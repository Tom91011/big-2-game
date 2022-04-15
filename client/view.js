export default class View
{
	#bus = null;
	#playerRows = {};
	#playerId = null;
	#handsPlayed = 0;
	#lastPlayedHand = {
		playerId: null,
		cards: [],
		roundOver: true
	};

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
			this.#bus.publish('join-game', $container.querySelector('input[name=game-id]').value, this.$playerName.value);
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

		this.$frmDeal = $container.querySelector('form.js-deal');
		this.$frmDeal.addEventListener('submit', e => {
			e.preventDefault();
			
			let $txtNumJokers = this.$frmDeal.querySelector('input[name="num-jokers"]')
			const numJokers = parseInt($txtNumJokers.value, 10);
			this.#bus.publish('deal', numJokers);
		}, false);

		this.$btnPlayHand = $container.querySelector('.js-play');
		this.$btnPlayHand.addEventListener('click', e => {
			e.preventDefault();
			let cards = this.#getSelectedCardsToPlay();
			if(cards.length == 0)
			{
				this.#bus.publish('error-occurred', 'Can\'t play 0 cards. Did you mean to pass instead?');
				return;
			}

			let validationResult = this.#validateHand(cards);
				if(validationResult.valid)
					this.#bus.publish('play-hand', cards)
				else
					this.#bus.publish('error-occurred', validationResult.error);
		}, false);

		this.$btnPass = $container.querySelector('.js-pass');
		this.$btnPass.addEventListener('click', e => {
			e.preventDefault();
			this.#bus.publish('play-hand', [])
		}, false);
	}

	#getSelectedCardsToPlay()
	{
		let $player = this.#playerRows[this.#playerId];
		let $cards = [...$player.querySelectorAll('input[name=cards]:checked')];
		let cards = $cards.map($card => $card.value);
		return cards;
	}

	#validateHand(cards)
	{
		// if its the first hand
		if(this.#handsPlayed == 0)
		{
			// must contain 3D
			if(!cards.indexOf('3D') == -1)
			{
				return {
					valid: false,
					error: 'First hand must contain 3D'
				};
			}
		}

		// TODO: dont allow passing on first hand (of a round)

		// this is not the first hand (of a round)
		if(!this.#lastPlayedHand.roundOver)
		{
			// must play the same number of cards as the last hand
			if(cards.length != this.#lastPlayedHand.cards.length)
			{
				return {
					valid: false,
					error: 'You must play the same number of cards as the previous hand'
				};
			}
		}

		// TODO: validate its a valid hand
		// TODO: validate it beats the previous hand
		return {
			valid: true
		};
	}

	#initBus()
	{
		this.#bus.subscribe('game-created', game => this.#gameEntered(game));
		this.#bus.subscribe('game-joined', game => this.#gameJoined(game));
		this.#bus.subscribe('game-started', () => this.#gameStarted());
		this.#bus.subscribe('hand-played', hand => this.#handPlayed(hand));
		this.#bus.subscribe('hands-updated', hands => this.#handsUpdated(hands));

		this.#bus.subscribe('error-occurred', message => alert(message));
	}

	#gameJoined(game)
	{
		this.$frmDeal.classList.add('d-none');
		this.#gameEntered(game);
	}

	#gameEntered(game)
	{
		this.$lobby.classList.add('d-none');
		this.$gameTable.classList.remove('d-none');
		this.$gameId.textContent = game.id;
	}

	#gameStarted()
	{
		this.$frmDeal.classList.add('d-none');
	}

	#addPlayer(hand)
	{
		var $player = this.$playerRowTemplate.cloneNode(true);
		$player.querySelector('.js-id').textContent = hand.playerId;
		this.#playerRows[hand.playerId] = $player;
		$player.querySelector('.js-name').textContent = hand.playerName;
		this.$playerTableBody.appendChild($player);
	}

	#setCurrentPlayer(currentPlayerId)
	{
		for(const [id, $player] of Object.entries(this.#playerRows))
		{
			let isCurrentPlayer = id == currentPlayerId;
			$player.querySelector('.js-actor').textContent = isCurrentPlayer;
		}

		let weAreCurrentPlayer = this.#playerId == currentPlayerId;
		this.$btnPlayHand.disabled = !weAreCurrentPlayer;
		this.$btnPass.disabled = !weAreCurrentPlayer;
	}

	#handsUpdated(hands)
	{
		for(var h = 0; h < hands.length; h++)
			this.#updatePlayer(hands[h])					
	}

	#updatePlayer(hand)
	{
		if(!this.#playerRows[hand.playerId])
			this.#addPlayer(hand);

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
		this.#lastPlayedHand = hand;
		this.#handsPlayed++;
    
		// dont do anything when it was a Pass
		if(hand.cards.length == 0)
			return;

		let $hand = document.createElement('div');
		$hand.classList.add('hand');

		let $cards = document.createElement('div');
		$cards.classList.add('cards');
		$hand.appendChild($cards);

		let randomAngle = Math.floor(Math.random() * 20) - 10;
		$cards.style.transform = `rotate(${randomAngle}deg) translateX(-50%)`;

		for(let i = 0; i < hand.cards.length; i++)
		{
			let $card = document.createElement('img');
			$card.classList.add('card');
			$card.src = this.#getCardImageUrl(hand.cards[i]);
			$cards.appendChild($card);
		}
		this.$table.appendChild($hand);
	}

	#getCardImageUrl(card)
	{
		let value = card.substr(0, card.length - 1);
		let suit = card.substr(card.length - 1, 1);

		value = value == 'K' ? 'king' 
				: value == 'Q' ? 'queen' 
				: value == 'J' ? 'jack'
				: value == 'A' ? 'ace'
				: value;

		suit = suit == 'D' ? 'diamonds'
				: suit == 'C' ? 'clubs'
				: suit == 'H' ? 'hearts'
				: 'spades';

		return '/cards/' + value + '_of_' + suit + '.png';
	}
}