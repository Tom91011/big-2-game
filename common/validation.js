export default class Validation
{
	isLegalHand(cards)
	{
		return false;
	}

	handBeatsHand(cardsA, cardsB)
	{
		return false;
	}

	getValueOrdinal(value)
	{
		return value;
	}

	parseCard(card)
	{
		let value = card.substr(0, card.length - 1);
		let suit = card.substr(card.length - 1, 1);

		return {
			value,
			valueOrdinal: this.getValueOrdinal(value),
			suit
		}
	}
}