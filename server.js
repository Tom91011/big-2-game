import express from 'express'
import { WebSocketServer } from 'ws';
import path from 'path'
import Controller from './controller.js';

const app = express();

app.get('/', function(req, res){
	res.sendFile(path.resolve('client/client.html'));
}); 

app.get('/client.js', function(req, res){
	res.sendFile(path.resolve('client/client.js'));
}); 

app.get('/client-controller.js', function(req, res){
	res.sendFile(path.resolve('client/client-controller.js'));
}); 

app.get('/client-game.js', function(req, res){
	res.sendFile(path.resolve('client/client-game.js'));
}); 


app.get('/view.js', function(req, res){
	res.sendFile(path.resolve('client/view.js'));
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