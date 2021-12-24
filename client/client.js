import ClientController from './client-controller.js'
import View from './view.js';
import bus from './bus.js';// '@trullock/pubsub';

var socket = new WebSocket("ws://localhost:8080",);

let playerId = new Date().getTime();

socket.onopen = async function() {
	new View(document, bus, playerId);
	new ClientController(socket, bus, playerId);


	socket.addEventListener('message', message => {
		let msg = JSON.parse(message.data);
		console.log('Received: ');
		console.log(msg);

		bus.publish(msg.type, msg.payload)
	});
};