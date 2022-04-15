const suits = [ 'D', 'H', 'C', 'S' ];
const numerics = [ 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K' ];

export default class Game
{
	#id = null;
	#name = null;
	#players = {};
	#playersArray = [];
	#playedHands = [];
	#currentPlayerIndex = null;
	#gameStarted = false;

	constructor(name, id)
	{
		this.#name = name;
		this.#id = id;
		
		this.#gameStarted = false;
	}

	get gameStarted()
	{
		return this.#gameStarted;
	}

	get currentPlayerId()
	{
		let currentPlayer = this.#playersArray[this.#currentPlayerIndex];
		return currentPlayer.id;
	}

	/// Adds a player to the game
	addPlayer(id, name, gameOwner)
	{
		if(this.#gameStarted)
			throw Error("Game already started");

		// TODO: limit to max-players
		this.#players[id] = {
			id,
			name,
			cards: [],
			gameOwner
		}
		this.#playersArray.push(this.#players[id]);

		let playersHands = this.#getPlayersHands();
		return Promise.resolve(playersHands);
	}

	/// Deals all cards + numJokers to all players, starting with the given dealer (or by randomly choosing a dealer)
	deal(numJokers, dealerPlayerId = null)
	{
		if(this.#gameStarted)
			throw Error("Game already started");

		// TODO: prevent double dealing
		let deck = this.#buildDeck(numJokers);
		this.#chooseDealer(dealerPlayerId);
		this.#dealDeck(deck, dealerPlayerId);
		this.#chooseFirstPlayer();
		let playersHands = this.#getPlayersHands();
		this.#gameStarted = true;
		return Promise.resolve(playersHands);
	}

	/// Builds a shuffled deck of 52 + numJokers cards
	#buildDeck(numJokers)
	{
		let deck = [];
		for(let i = 0; i < 13; i++)
		{
			for(let suit = 0; suit < 4; suit++)
				deck.push(numerics[i] + suits[suit]);
		}

		for(let j = 0; j < numJokers; j++)
			deck.push('??');

		deck = this.#shuffleDeck(deck);

		return deck;
	}

	/// Shuffles the given deck
	#shuffleDeck(deck)
	{
		// TODO: implement me
		return deck;
	}

	/// Chooses the dealer, using either the given playerId or randomly picking a player
	#chooseDealer(dealerPlayerId = null)
	{
		this.#currentPlayerIndex = null;
		if(!dealerPlayerId)
			this.#currentPlayerIndex = Math.floor(Math.random() * this.#playersArray.length)
		else
		{
			this.#currentPlayerIndex = this.#playersArray.findIndex(player => player.id == dealerPlayerId) + 1;
			if(this.#currentPlayerIndex == this.#playersArray.length)
				this.#currentPlayerIndex = 0;
		}
	}

	/// Deals the given deck to all players
	#dealDeck(deck)
	{
		let playersArray = Object.values(this.#players)
		let p = this.#currentPlayerIndex;

		// deal all cards
		while(deck.length > 0)
		{
			let card = deck.pop();
			playersArray[p].cards.push(card);

			if(++p == playersArray.length)
				p = 0;
		}
	}

	/// Returns an array of hand-views for each player.
	///  Your own hand contains the cards, others' hands contains just the number of cards
	#getPlayersHands()
	{
		let playersArray = Object.values(this.#players)
		let playersHands = [];
		for(var p = 0; p < playersArray.length; p++)
		{
			// give each player their respective view of what everyone's hand looks like
			let handsView = playersArray.map((player, i) => {
				// your own hand
				if (player.id == playersArray[p].id)
				{
					return {
						playerId: player.id,
						playerName: player.name,
						cards: player.cards,
						currentPlayer: this.#currentPlayerIndex == i
					};
				}

				// someone elses hand
				return {
					playerName: player.name,
					playerId: player.id,
					playerName: player.name,
					cardsRemaining: player.cards.length,
					currentPlayer: this.#currentPlayerIndex == i
				}
			})

			playersHands.push({
				playerId: playersArray[p].id,
				hands: handsView
			});
		}
		return playersHands;
	}

	#chooseFirstPlayer()
	{
		// the player with 3D is first to act
		for(let i = 0; i < this.#playersArray.length; i++)
		{
			if(this.#playersArray[i].cards.indexOf('3D') != -1)
			{
				this.#currentPlayerIndex = i;
				return;
			}
		}
		return null;
	}

	/// Plays a hand into the game
	playHand(playerId, cards)
	{
		if(!this.#gameStarted)
			throw Error("Game not started");

		let player = this.#players[playerId];
		
		if(!player)
			throw Error(`Player ${playerId} does not exist`);

		if(playerId != this.currentPlayerId)
			throw Error(`Player ${playerId} is not the current player`);

		for(var c = 0; c < cards.length; c++)
		{
			let cardIndex = player.cards.findIndex(card => card == cards[c]);
			if(cardIndex > -1)
				player.cards.splice(cardIndex, 1)
		}
		

		let playedHand = {
			playerId,
			cards,
			roundOver: null // worked out below
		};
		this.#playedHands.push(playedHand);

		playedHand.roundOver = this.getRoundOver();

		this.#currentPlayerIndex++;
		if(this.#currentPlayerIndex == this.#playersArray.length)
			this.#currentPlayerIndex = 0;

		let playersHands = this.#getPlayersHands();

		return {
			playersHands,
			playedHand
		};
	}

	getRoundOver()
	{
		// find the last non passed hand
		for(var i = this.#playedHands.length - 1; i >=0; i--)
		{
			if(this.#playedHands[i].cards.length > 0)
			{
				i++
				break;
			}
		}

		// First hand cant be an everyone-else-passed scenario
		if(this.#playedHands.length == 0)
			return false;

		// hack for testing, can't really have 1 player
		if(this.#playersArray.length == 1)
			return false;

		// everyone has passed if the number of pass hands played is equal to the number of players minus one
		return this.#playedHands.length - i == this.#playersArray.length - 1;
	}
}