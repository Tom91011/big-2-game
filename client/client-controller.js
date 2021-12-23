import View from "./view.js";

export default class ClientController
{
	#ackCallbacks = {};
	#socket = null;
	#playerId = null;
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

			else if(value.type == 'hands-dealt')
				this.handsDealt(value.payload);
		});

		this.#view = view;
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

		return {id, name};
	}

	async handsDealt(hands)
	{
		this.#view.handsDealt(hands);
		
	}

	deal(gameId)
	{
		return this.#send({
			command: 'deal',
			playerId: this.#playerId,
			gameId
		})
	}

	joinGame(gameId)
	{
		return this.#send({
			command: 'join',
			playerId: this.#playerId,
			gameId
		});
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