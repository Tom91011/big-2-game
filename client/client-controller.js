import View from "./view.js";

export default class ClientController
{
	#ackCallbacks = {};
	#socket = null;
	#playerId = null;
	#gameId = null;
	#view = null;

	constructor(socket, view)
	{
		this.#socket = socket;
		this.#playerId = new Date().getTime();

		this.#socket.addEventListener('message', message => {
			let value = JSON.parse(message.data);
			console.log('Received: ');
			console.log(value);

			if(value.type == 'ack')
				this.#ackCallbacks[value.messageId](value);

			else if(value.type == 'player-joined')
				this.playerJoined(value.payload);

			else if(value.type == 'hands-updated')
				this.handsUpdated(value.payload);

			else if(value.type == 'hand-played')
				this.handPlayed(value.payload);
		});

		this.#view = view;
		this.attachViewListeners();
	}

	attachViewListeners()
	{
		this.#view.onPlayHand = cards => this.playHand(cards);
	}

	async playerJoined(player)
	{
		this.#view.addPlayer(player, player.id == this.#playerId);
	}

	async createGame(id, name)
	{
		let ack = await this.#send({
			command: 'create',
			gameId: id,
			gameName: name,
			playerId: this.#playerId
		});

		this.#gameId = id;
		return {id, name};
	}

	async handsUpdated(hands)
	{
		this.#view.handsUpdated(hands);
		
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

	async handPlayed(hand)
	{
		this.#view.handPlayed(hand);
	}


	deal(gameId)
	{
		return this.#send({
			command: 'deal',
			playerId: this.#playerId,
			gameId
		})
	}

	async joinGame(gameId)
	{
		let ack = await this.#send({
			command: 'join',
			playerId: this.#playerId,
			gameId
		});

		this.gameId = gameId;
	}

	#send(json)
	{
		return new Promise((resolve, reject) => {
			let messageId = new Date().getTime();
			this.#ackCallbacks[messageId] = response => {
				delete this.#ackCallbacks[messageId];
				if(response.payload.error)
					reject(response.payload);
				resolve(response.payload);
			};

			json.messageId = messageId;
			this.#socket.send(JSON.stringify(json));
		})
	}
}