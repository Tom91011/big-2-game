const $container = document

export default class View
{
	#bus = null;
	#playerRows = {};
	#playerId = null;

	constructor($container, bus, playerId)
	{
		this.#bus = bus;
		this.#initBus();
		this.#playerId = playerId;

		$container.querySelector('button.js-create-game').addEventListener('click', e => {
			e.preventDefault();
			this.#bus.publish('create-game', this.$playerName.value);
		}, false);

		$container.querySelector('button.js-join-game').addEventListener('click', e => {
			e.preventDefault();
			this.#bus.publish('join-game', $container.querySelector('input[name=game-id]').value, this.$playerName.value
			);
		}, false);

		this.$playerName = $container.querySelector('#txtLobbyPlayerName')

		this.$lobby = $container.querySelector('.js-game-lobby');

		this.$gameTable = $container.querySelector('.js-game-table');
		this.$gameId = this.$gameTable.querySelector('.js-game-id');

		this.$playerTableBody = $container.querySelector('.js-players tbody');
		this.$playerRowTemplate = this.$playerTableBody.querySelector('.js-template');
		this.$playerRowTemplate.parentElement.removeChild(this.$playerRowTemplate);

		this.$table = $container.querySelector('.js-table')

		this.$txtNumJokers = $container.querySelector('input[name=num-jokers]');

		$container.querySelector('.js-play').addEventListener('click', e => {
			e.preventDefault();
			let cards = this.#getSelectedCardsToPlay();
			this.#bus.publish('play-hand', cards)
		}, false);
	}

	#getSelectedCardsToPlay()
	{
		let $player = this.#playerRows[this.#playerId];
		let $cards = [...$player.querySelectorAll('input[name=cards]:checked')];
		let cards = $cards.map($card => $card.value);
		return cards;
	}

	#initBus()
	{
		this.#bus.subscribe('game-created', game => this.#gameStarted(game));
		this.#bus.subscribe('game-joined', game => this.#gameStarted(game));
		this.#bus.subscribe('hand-played', hand => this.#handPlayed(hand));
		this.#bus.subscribe('hands-updated', (hands, gameStarted) => this.#handsUpdated(hands, gameStarted));
	}

	#gameStarted(game)
	{
		this.$lobby.classList.add('d-none');
		this.$gameTable.classList.remove('d-none');
		this.$gameId.textContent = game.id;
	}

	#addPlayer(hand, gameStarted)
	{
		var $player = this.$playerRowTemplate.cloneNode(true);
		$player.querySelector('.js-id').textContent = hand.playerId;
		this.#playerRows[hand.playerId] = $player;
		$player.querySelector('.js-name').textContent = hand.playerName;
		this.$playerTableBody.appendChild($player);
		
		if(!hand.gameOwnerButton)
		{
		$player.querySelector('.js-owner').classList.add('d-none')
		}

		$container.querySelector('.js-deal').addEventListener('click', e => {
			e.preventDefault();	
			if(hand.gameOwnerButton)
			{
				this.$txtNumJokers = $player.querySelector('.num-jokers')
				const numJokers = parseInt(this.$txtNumJokers.value, 10);
				this.#bus.publish('deal', numJokers, gameStarted);
			}
		}, false);
	}

	#setCurrentPlayer(playerId)
	{
		for(const [id, $player] of Object.entries(this.#playerRows))
			$player.querySelector('.js-actor').textContent = id == playerId;
	}

	#handsUpdated(hands, gameStarted)
	{
		for(var h = 0; h < hands.length; h++)
				this.#updatePlayer(hands[h], gameStarted)					
	}

	#updatePlayer(hand, gameStarted)
	{
		if(hand.gameStarted)
			$container.querySelector('.js-owner').classList.add('d-none')

		if(hand.gameStarted)
			$container.querySelector('.js-owner').classList.add('d-none')		

			// displays the play-cards button if the players view is the current player, removes the button if not
		if(hand.currentPlayer && hand.playerId == this.#playerId) 
			$container.querySelector('.js-play').classList.remove('d-none')
		else if((!hand.currentPlayer && hand.playerId == this.#playerId))
			$container.querySelector('.js-play').classList.add('d-none')
		
		if(!this.#playerRows[hand.playerId])
			this.#addPlayer(hand, gameStarted);

		if(hand.playerId == this.#playerId)
		{
			// my hand
			let $player = this.#playerRows[hand.playerId];
			let $cards = $player.querySelector('.js-cards');
			let $cardTemplate = $player.querySelector('.js-card');

			while($cards.firstElementChild)
				$cards.removeChild($cards.firstElementChild);
				
			for(var c = 0; c < hand.cards.length; c++)
			{
				let $card = $cardTemplate.cloneNode(true);
				let $label = $card.querySelector('label');
				let $input = $card.querySelector('input');

				$input.id = 'chkHandCard' + c;
				$label.htmlFor = $input.id;
				$input.value = hand.cards[c];
				$label.textContent = hand.cards[c];

				$cards.appendChild($card);
				$card.classList.remove('d-none');
			}
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