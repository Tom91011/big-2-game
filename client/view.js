export default class View
{
	#playerRows = {};
	#playerId = null;

	onPlayHand = () => {};

	constructor($container)
	{
		this.$playerTableBody = $container.querySelector('.js-players tbody');
		this.$playerRowTemplate = this.$playerTableBody.querySelector('.js-template');
		this.$playerRowTemplate.parentElement.removeChild(this.$playerRowTemplate);

		this.$table = $container.querySelector('.js-table')

		$container.querySelector('.js-play').addEventListener('click', e => {
			e.preventDefault();
			let cards = ['10S', 'JS', 'QS', 'KS', '2S'];
			this.onPlayHand(cards);
		}, false);
	}

	addPlayer(player, isCurrentPlayer)
	{
		var $player = this.$playerRowTemplate.cloneNode(true);
		$player.querySelector('.js-id').textContent = player.id;
		$player.querySelector('.js-cards').textContent = player.cardsRemaining;

		this.#playerRows[player.id] = $player;
		this.$playerTableBody.appendChild($player);

		if(isCurrentPlayer)
			this.#playerId = player.id;
	}

	setCurrentPlayer(playerId)
	{
		for(const [id, $player] of Object.entries(this.#playerRows))
			$player.querySelector('.js-actor').textContent = id == playerId;		
	}

	handsUpdated(hands)
	{
		for(var h = 0; h < hands.length; h++)
			this.#updatePlayer(hands[h]);
	}

	#updatePlayer(hand)
	{
		if(hand.playerId == this.#playerId)
		{
			// my hand
			this.#playerRows[hand.playerId].querySelector('.js-cards').textContent = hand.cards.join(', ');
		}
		else
		{
			// someone elses hand
			this.#playerRows[hand.playerId].querySelector('.js-cards').textContent = hand.cardsRemaining;
		}

		if(hand.currentPlayer)
			this.setCurrentPlayer(hand.playerId);
	}

	handPlayed(hand)
	{
		this.$table.textContent = hand.cards.join(', ');
	}
}