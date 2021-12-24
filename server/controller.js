
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
				let game = await this.#createGame(data.gameId, data.gameName);
				await this.#acknowledge(data.playerId, data.messageId);
				await this.#addPlayer(game.id, data.playerId, data.playerName);
				return;
	
			case 'join':
				await this.#addPlayer(data.gameId, data.playerId, data.playerName);
				await this.#acknowledge(data.playerId, data.messageId);
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

	/// Creates a game
	async #createGame(gameId, gameName)
	{
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
	async #addPlayer(gameId, playerId, playerName)
	{
		let game = this.#games[gameId];
		let player = await game.addPlayer(playerId, playerName);

		await this.#notifyPlayers({
			type: 'player-joined',
			payload: player
		});
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
		return this.#send(ws, {
			type: 'ack',
			messageId: messageId,
			payload: payload || {}
		});
	}

	/// Sends the given payload to all players
	async #notifyPlayers(payload)
	{
		let tasks = Object.values(this.#playerSockets).map(ws => this.#send(ws, payload))
		await Promise.all(tasks);
	}
}