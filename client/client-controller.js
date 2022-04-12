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
		this.#bus.subscribe('deal', (numJokers, gameStarted) => this.deal(numJokers, gameStarted));
		this.#bus.subscribe('create-game', playerName => this.createGame(playerName));
		this.#bus.subscribe('join-game', (id, playerName) => this.joinGame(id,playerName));
		this.#bus.subscribe('play-hand', cards => this.playHand(cards));

		this.#bus.subscribe('ack', result => this.#ackCallbacks[result.messageId](result));
	}

	async createGame(playerName)
	{
		let ack = await this.#send({
			command: 'create',
			playerId: this.#playerId,
			playerName: playerName,
			gameOwner: true
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

	deal(numJokers, gameStarted)
	{	
		return this.#send({
			command: 'deal',
			playerId: this.#playerId,
			gameId: this.#gameId,
			numJokers,
			gameStarted: gameStarted
		})
	}

	async joinGame(gameId, playerName)
	{
		try
		{	
			let ack = await this.#send({
				command: 'join',
				playerId: this.#playerId,
				playerName: playerName,
				gameOwner: false,
				gameId
			});

			this.#gameId = gameId;
			this.#bus.publish('game-joined', {id: this.#gameId, name: ack.gameName});
		} 
		catch(e)
		{
			if(e.error == "game-doesnt-exist")
				this.#bus.publish('error-occurred', `Game ${gameId} does not exist`);
			else if(e.error == "game-already-started")		
				this.#bus.publish('error-occurred', `Game ${gameId} already stated`);
		}
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