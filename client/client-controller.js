import View from "./view.js";

export default class ClientController
{
	#ackCallbacks = {};
	#socket = null;
	#bus = null;
	#playerId = null;
	#gameId = null;

	constructor(socket, bus, playerId)
	{
		this.#socket = socket;
		this.#bus = bus;
		this.#initBus();

		this.#playerId = playerId;
	}

	#initBus()
	{
		this.#bus.subscribe('create-game', name => this.createGame(name));
		this.#bus.subscribe('join-game', id => this.joinGame(id));
		this.#bus.subscribe('deal', () => this.deal());
		this.#bus.subscribe('play-hand', cards => this.playHand(cards));

		this.#bus.subscribe('ack', result => this.#ackCallbacks[result.messageId](result));
	}

	async createGame(name)
	{
		let ack = await this.#send({
			command: 'create',
			gameName: name,
			playerId: this.#playerId
		});

		this.#gameId = ack.gameId;

		this.#bus.publish('game-created', {id: this.#gameId, name});
	}

	async playHand(cards)
	{
		let ack = await this.#send({
			command: 'play-hand',
			gameId: this.#gameId,
			playerId: this.#playerId,
			cards: cards
		})
	}

	deal()
	{
		return this.#send({
			command: 'deal',
			playerId: this.#playerId,
			gameId: this.#gameId
		})
	}

	async joinGame(gameId)
	{
		let ack = await this.#send({
			command: 'join',
			playerId: this.#playerId,
			gameId
		});

		this.#gameId = gameId;

		this.#bus.publish('game-joined', {id: this.#gameId, name: ack.gameName});
	}

	#send(json)
	{
		return new Promise((resolve, reject) => {
			let messageId = new Date().getTime();
			this.#ackCallbacks[messageId] = payload => {
				delete this.#ackCallbacks[messageId];
				if(payload.error)
					reject(payload);
				resolve(payload);
			};

			json.messageId = messageId;
			this.#socket.send(JSON.stringify(json));
		})
	}
}