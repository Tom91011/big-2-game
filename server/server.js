import express from 'express'
import { WebSocketServer } from 'ws';
import path from 'path'
import Controller from './controller.js';

const app = express();

app.use(express.static(path.resolve('client')));
app.get('/', function(req, res){
	res.sendFile(path.resolve('client/client.html'));
}); 


const wss = new WebSocketServer({ port: 8080 });
let controller = new Controller();

wss.on('connection', function connection(ws) {
	ws.on('message', function message(data) {
		console.log('received: %s', data);

		let json = JSON.parse(data);
		controller.handleCommand(ws, json);
	});
});


app.listen(3000);