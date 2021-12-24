export default class View
{
	#bus = null;
	#playerRows = {};
	#playerId = null;

	constructor($container, bus)
	{
		this.#bus = bus;
		this.#initBus();


		$container.querySelector('button.js-create-game').addEventListener('click', e => {
			this.#bus.publish('create-game');
		}, false);

		this.$lobby = $container.querySelector('.js-game-lobby');

		this.$gameTable = $container.querySelector('.js-game-table');
		this.$gameId = this.$gameTable.querySelector('.js-game-id');


		this.$playerTableBody = $container.querySelector('.js-players tbody');
		this.$playerRowTemplate = this.$playerTableBody.querySelector('.js-template');
		this.$playerRowTemplate.parentElement.removeChild(this.$playerRowTemplate);

		this.$table = $container.querySelector('.js-table')

		$container.querySelector('.js-play').addEventListener('click', e => {
			e.preventDefault();
			let cards = ['10S', 'JS', 'QS', 'KS', '2S'];
			this.#bus.publish('play-hand', cards)
		}, false);
	}

	#initBus()
	{
		this.#bus.subscribe('game-created', game => this.#gameStarted(game));
		this.#bus.subscribe('player-joined', (player, isCurrent) => this.#addPlayer(player, isCurrent));
		this.#bus.subscribe('hand-played', hand => this.#handPlayed(hand));
		this.#bus.subscribe('hands-updated', hands => this.#handsUpdated(hands));
	}

	#gameStarted(game)
	{
		this.$lobby.classList.add('d-none');
		this.$gameTable.classList.remove('d-none');
		this.$gameId.textContent = game.id;
	}

	#addPlayer(player, isCurrentPlayer)
	{
		var $player = this.$playerRowTemplate.cloneNode(true);
		$player.querySelector('.js-id').textContent = player.id;
		$player.querySelector('.js-cards').textContent = player.cardsRemaining;

		this.#playerRows[player.id] = $player;
		this.$playerTableBody.appendChild($player);

		if(isCurrentPlayer)
			this.#playerId = player.id;
	}

	#setCurrentPlayer(playerId)
	{
		for(const [id, $player] of Object.entries(this.#playerRows))
			$player.querySelector('.js-actor').textContent = id == playerId;		
	}

	#handsUpdated(hands)
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
			this.#setCurrentPlayer(hand.playerId);
	}

	#handPlayed(hand)
	{
		this.$table.textContent = hand.cards.join(', ');
	}
}