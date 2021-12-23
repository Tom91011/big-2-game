const suits = [ 'D', 'H', 'C', 'S' ];
const cards = [ 'A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K' ];

export default class Game
{
	#id = null;
	#name = null;
	#maxPlayers = 0;
	#players = {}
	#playedHands = [];

	constructor(name, id, maxPlayers)
	{
		this.#name = name;
		this.#id = id;
		this.#maxPlayers = maxPlayers
	}

	addPlayer(id, name)
	{
		// TODO: prevent in-progress joining
		// TODO: limit to max-players

		this.#players[id] = {
			id,
			name,
			hand: []
		}

		return Promise.resolve({
			id,
			name,
			cardsRemaining: 0
		});
	}

	deal(numJokers, dealerPlayerId = null)
	{
		// TODO: prevent double dealing

		let deck = this.#buildDeck(numJokers);
		let hands = this.#dealDeck(deck);
		return Promise.resolve(hands);
	}

	#buildDeck(numJokers)
	{
		let deck = [];
		for(let i = 0; i < 13; i++)
		{
			for(let suit = 0; suit < 4; suit++)
				deck.push(cards[i] + suits[suit]);
		}

		for(let j = 1; j < numJokers; j++)
			deck.push('?');

			
		// TODO: shuffle deck

		return deck;
	}

	#dealDeck(deck, dealerPlayerId)
	{
		let playersArray = Object.values(this.#players)

		// find/choose dealer
		let dealer = null;
		if(!dealerPlayerId)
			dealer = Math.floor(Math.random() * playersArray.length)
		else
			dealer = playersArray.findIndex(player => player.id == dealerPlayerId);

		// deal
		let p = dealer;
		while(deck.length > 0)
		{
			let card = deck.pop();
			playersArray[p].hand.push(card);

			if(++p == playersArray.length)
				p = 0;
		}

		// return players' hands
		return playersArray.map(p => ({
			playerId: p.id,
			hand: p.hand,
			eldest: dealer == playersArray - 1 ? 0 : dealer
		}));
	}

	playHand(playerId, hand)
	{

	}
}