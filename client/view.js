export default class View
{
	#playerRows = {};
	#playerId = null;

	constructor($container)
	{
		this.$playerTableBody = $container.querySelector('.js-players tbody');
		this.$playerRowTemplate = this.$playerTableBody.querySelector('.js-template');
		this.$playerRowTemplate.parentElement.removeChild(this.$playerRowTemplate);
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

	setActive(playerId)
	{
		for(const [id, $player] of Object.entries(this.#playerRows))
			$player.querySelector('.js-actor').textContent = id == playerId;		
	}

	handsDealt(hands)
	{
		for(var h = 0; h < hands.length; h++)
		{
			let hand = hands[h];
			if(hand.playerId == this.#playerId)
			{
				// my hand
				this.#playerRows[hand.playerId].querySelector('.js-cards').textContent = hand.hand.join(', ');

			}
			else
			{
				// someone elses hand
				this.#playerRows[hand.playerId].querySelector('.js-cards').textContent = hand.cardsRemaining;
			}

			if(hand.eldest)
				this.setActive(hand.playerId);
		}
	}
}