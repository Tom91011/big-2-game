import Validation from "./validation.js";

export default class Big2Validation extends Validation
{
	isLegalHand(cards)
	{
		if(cards.length == 0)
			return { errors: ['Can\'t play 0 cards. Did you mean to pass instead?'] };

		// any single card is legal
		if(cards.length == 1)
			return { errors: [] };

		// two cards must be a pair
		if(cards.length == 2)
		{
			let card0 = this.parseCard(cards[0]);
			let card1 = this.parseCard(cards[1]);
			if(card0.value == card1.value)
				return { errors: [] };
			return { errors: [ 'Two cards must be a pair' ]};
		}

		// three cards must be a three-of-a-kind
		if(cards.length == 3)
		{
			let card0 = this.parseCard(cards[0]);
			let card1 = this.parseCard(cards[1]);
			let card2 = this.parseCard(cards[2]);
			if(card0.value == card1.value && card1.value == card2.value)
				return { errors: [] };
			return { errors: [ 'Three cards must be three-of-a-kind' ]};
		}

		if(cards.length == 5)
		{
			let parsedCards = cards.map(c => this.parseCard(c));
			parsedCards.sort((a, b) => a.valueOrdinal - b.valueOrdinal);

			// flush
			if(parsedCards[0].suit == parsedCards[1].suit 
				&& parsedCards[1].suit == parsedCards[2].suit
				&& parsedCards[2].suit == parsedCards[3].suit
				&& parsedCards[3].suit == parsedCards[4].suit)
			{
				return { errors: [] };
			}


			// TODO: straight

			// TODO: full house
		}

		// anything else is illegal
		return { errors: ["bad hand, yo"]};
	}

	handBeatsHand(cardsA, cardsB)
	{
		// TODO: implement me
		return true;
	}

	getValueOrdinal(value)
	{
		switch(value)
		{
			case 'A':
				// TODO: support high and low
				return 1;
			case '2':
				// TODO: support high and low
				return 2;
			case '3':
			case '4':
			case '5':
			case '6':
			case '7':
			case '8':
			case '9':
			case '10':
				return parseInt(value, 10);
			case 'J':
				return 11;
			case 'Q':
				return 12;
			case 'K':
				return 13;
		}
	}
}