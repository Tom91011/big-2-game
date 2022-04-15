import express from 'express'
import { WebSocketServer } from 'ws';
import path from 'path'
import Controller from './controller.js';

// Web server client web-app
const app = express();

app.use(express.static(path.resolve('client')));

app.get('/', function(req, res){
	res.sendFile(path.resolve('client/view.html'));
}); 

const server = app.listen(process.env.PORT || 3000);

// Websocket server for game interaction
const wss = new WebSocketServer({ server });
let controller = new Controller();

wss.on('connection', function connection(ws) {
	ws.on('message', function message(data) {
		let json = JSON.parse(data);
		controller.handleCommand(ws, json);
	});
});


