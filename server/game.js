const suits = [ 'D', 'H', 'C', 'S' ];
const numerics = [ 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K' ];

export default class Game
{
	#id = null;
	#name = null;
	#players = {}
	#playedHands = [];
	#currentPlayerIndex = null;

	constructor(name, id)
	{
		this.#name = name;
		this.#id = id;
	}

	addPlayer(id, name)
	{
		// TODO: prevent in-progress joining
		// TODO: limit to max-players

		this.#players[id] = {
			id,
			name,
			cards: []
		}

		let playersHands = this.#getPlayersHands();
		return Promise.resolve(playersHands);
	}

	deal(numJokers, dealerPlayerId = null)
	{
		// TODO: prevent double dealing

		let deck = this.#buildDeck(numJokers);
		this.#dealDeck(deck, dealerPlayerId);
		let playersHands = this.#getPlayersHands();
		return Promise.resolve(playersHands);
	}

	#buildDeck(numJokers)
	{
		let deck = [];
		for(let i = 0; i < 13; i++)
		{
			for(let suit = 0; suit < 4; suit++)
				deck.push(numerics[i] + suits[suit]);
		}

		for(let j = 1; j < numJokers; j++)
			deck.push('?');

		deck = this.#shuffleDeck(deck);

		return deck;
	}

	#shuffleDeck(deck)
	{
		// TODO: implement me
		return deck;
	}

	#chooseDealer(dealerPlayerId)
	{
		let playersArray = Object.values(this.#players)

		this.#currentPlayerIndex = null;
		if(!dealerPlayerId)
			this.#currentPlayerIndex = Math.floor(Math.random() * playersArray.length)
		else
		{
			this.#currentPlayerIndex = playersArray.findIndex(player => player.id == dealerPlayerId) + 1;
			if(this.#currentPlayerIndex == playersArray.length)
				this.#currentPlayerIndex = 0;
		}
	}

	#dealDeck(deck, dealerPlayerId)
	{
		this.#chooseDealer(dealerPlayerId);

		// deal
		let playersArray = Object.values(this.#players)
		let p = this.#currentPlayerIndex;
		while(deck.length > 0)
		{
			let card = deck.pop();
			playersArray[p].cards.push(card);

			if(++p == playersArray.length)
				p = 0;
		}
	}

	/// Returns an array of hand-views for each player, your own hand contains the cards, others' hands contains just the number of cards
	#getPlayersHands()
	{
		let playersArray = Object.values(this.#players)
		let playersHands = [];
		for(var p = 0; p < playersArray.length; p++)
		{
			// give each player their respective view of what everyone's hand looks like
			let handsView = playersArray.map((player, i) => {
				// your own hand
				if(player.id == playersArray[p].id)
					return {
						playerId: player.id,
						cards: player.cards,
						currentPlayer: this.#currentPlayerIndex == i
					};

				// someone elses hand
				return {
					playerId: player.id,
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

	/// Plays a hand into the game
	playHand(playerId, cards)
	{
		let player = this.#players[playerId];
		
		for(var c = 0; c < cards.length; c++)
		{
			let cardIndex = player.cards.findIndex(card => card == cards[c]);
			if(cardIndex > -1)
				player.cards.splice(cardIndex, 1)
		}

		let playedHand = {
			playerId,
			cards
		};
		this.#playedHands.push(playedHand);

		this.#currentPlayerIndex++;
		if(this.#currentPlayerIndex == Object.keys(this.#players).length)
			this.#currentPlayerIndex == 0

		let playersHands = this.#getPlayersHands();

		return {
			playersHands,
			playedHand
		};
	}
}