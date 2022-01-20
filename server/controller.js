
import Game from './game.js';

export default class Controller
{
	#playerSockets = {};
	#games = {};

	constructor()
	{
	}

	/// Handles commands from clients
	async handleCommand(ws, data)
	{
		console.log('Handling command: %s', data);

		// TODO: make sure the client reconnects properly
		this.#playerSockets[data.playerId] = ws;

		switch(data.command)
		{
			case 'create':
				let game = await this.#createGame(data.gameName);
				await this.#acknowledge(data.playerId, data.messageId, { gameId: game.id});
				var playersHands = await this.#addPlayer(game.id, data.playerId, data.playerName, data.gameOwner);
				this.updateAllPlayersHands(playersHands);
				return;
	
			case 'join':
				var playersHands = await this.#addPlayer(data.gameId, data.playerId, data.playerName, data.gameOwner);
				await this.#acknowledge(data.playerId, data.messageId);
				this.updateAllPlayersHands(playersHands);
				break;
	
			case 'deal':
				await this.#deal(data.gameId, data.numJokers, data.dealerPlayerId);
				await this.#acknowledge(data.playerId, data.messageId);
				break;

			case 'play-hand':
				await this.#playHand(data.gameId, data.playerId, data.cards);
				await this.#acknowledge(data.playerId, data.messageId);

		}
	}

	#generateGameId(){
		// TODO: implement
		return '1234';
	}

	/// Creates a game
	async #createGame(gameName)
	{
		let gameId = this.#generateGameId();

		// if(games[gameId])
		// {
		// 	acknowledge(ws, data.messageId, { error: "Game ID already exists" })
		// 	return;
		// }
			
		this.#games[gameId] = new Game(gameName, gameId);
		return {
			id: gameId,
			name: gameName
		};
	}

	/// Adds a player to a game
	#addPlayer(gameId, playerId, playerName, gameOwner)	
	{
		let game = this.#games[gameId];
		return game.addPlayer(playerId, playerName, gameOwner);
	}

	/// Deals the decks to all players
	async #deal(gameId, numJokers, dealerPlayerId = null)
	{
		let game = this.#games[gameId];
		let playersHands = await game.deal(numJokers, dealerPlayerId);

		this.updateAllPlayersHands(playersHands);
	}

	async updateAllPlayersHands(playersHands)
	{	
		for(var h = 0; h < playersHands.length; h++)
		{	
			let playerWs = this.#playerSockets[playersHands[h].playerId];
			console.log(playersHands[h].hands)
			this.#send(playerWs, {
				type: 'hands-updated',
				payload: playersHands[h].hands
			})
		}
	}

	/// Handles a player playing a hand
	async #playHand(gameId, playerId, cards)
	{
		let game = this.#games[gameId];
		let result = game.playHand(playerId, cards);

		// let everyone know what was played
		this.#notifyPlayers({
			type: 'hand-played',
			payload: result.playedHand
		})

		// update all players' hands'
		this.updateAllPlayersHands(result.playersHands);
	}

	/// Sends the given data via the given websocket
	#send(ws, data)
	{
		// TODO: does this return a promise?
		return ws.send(JSON.stringify(data));
	}

	/// Sends an ACK message to the given playerId, in response to the given messageId, with the optional payload
	#acknowledge = function(playerId, messageId, payload)
	{
		let ws = this.#playerSockets[playerId];
		payload = payload || {}
		payload.messageId = messageId;
		return this.#send(ws, {
			type: 'ack',
			payload: payload
		});
	}

	/// Sends the given payload to all players
	async #notifyPlayers(payload)
	{
		let tasks = Object.values(this.#playerSockets).map(ws => this.#send(ws, payload))
		await Promise.all(tasks);
	}
}