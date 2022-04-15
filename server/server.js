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

// Websocket server for game interaction
const wss = new WebSocketServer({ port: 8080 });
let controller = new Controller();

wss.on('connection', function connection(ws) {
	ws.on('message', function message(data) {
		let json = JSON.parse(data);
		controller.handleCommand(ws, json);
	});
});


app.listen(process.env.PORT || 3000);