import ClientController from './client-controller.js'
import View from './view.js';

var socket = new WebSocket("ws://localhost:8080",);

socket.onopen = async function() {
	var view = new View(document);
	var controller = new ClientController(socket, view);

	// demo hack to get things started
	let game = await controller.createGame("1234", "Test game")
	controller.deal(game.id);
};

