/*  Copyright (c) 2013 TruongNGUYEN
    Server for projectX
    BH Licensed.
 */

var express = require('express');
var socketio = require('socket.io');
var http = require('http');
var app_server = module.exports;
var game_server = require('./game.server.js');
var path = require('path');

var app = express();

var allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
	res.header('Access-Control-Allow-Headers',
			'Content-Type, Authorization, Content-Length, X-Requested-With');

	// intercept OPTIONS method
	if ('OPTIONS' == req.method) {
		res.send(200);
	} else {
		next();
	}
};

app.configure(function() {
	app.use(allowCrossDomain);
	app.set('port', 3005);
	app.set('views', __dirname + '/views');
	app.set('view engine', 'jade');
	app.use(express.favicon());
	app.use(express.logger('dev'));
	app.use(express.bodyParser());
	app.use(express.methodOverride());
	app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function() {
	app.use(express.errorHandler());
});

app.get('/ping', function(req, res) {
	res.send('pong');
});

app.get('/users', function(req, res) {
	game_server.users(req, res);
});

app.get('/games', function(req, res) {
	game_server.games(req, res);
});

var server = app.listen(app.get('port'), function() {
	console.log("Express server listening on port " + app.get('port'));
});
var io = socketio.listen(server, {
	origins : '*:*'
});
io.set('origins', '*:*');

io.configure('development', function() {
	io.set('transports', [ 'xhr-polling' ]);
	io.set("polling duration", 15);
	io.set('close timeout', 15); // 24h time out
});

io.sockets.on('connection', function(socket) {
	socket.on('setPlayer', function(data) {
		console.log("CLIENT:" + socket.id + " CONNECTED TO SERVER");
		game_server.setPlayer(socket.id, data);
	});

	socket.on('request', function(msg) {
		var obj = JSON.parse(msg);
		console.log("Receive request type from client: " + obj.type);
		try {
			if (obj.type == "msgInGame")
			{
				game_server.sendMsgInGameToOtherPlayers(obj);
			}
			else if (obj.type == "chat") {
				game_server.chat(obj);
			}
//			if (obj.type == "sendMsgToOtherClient") {
//				game_server.sendMsgToOtherClient(obj);
//			}
			else if (obj.type == "findGame") {
				game_server.findGame(obj);
			}
			else if (obj.type == "createGame") {
				game_server.createGame(obj);
			}
			// else if(obj.type == "createQuickGame") {
			// game_server.createQuickGame(obj);
			// }
			else if (obj.type == "updateGame") {
				game_server.updateGame(obj);
			}
			else if (obj.type == "joinGame") {
				game_server.joinGame(obj);
			}
//			else if (obj.type == "exitWaitingGame") {
//				game_server.exitWaitingGame(obj);
//			}
			else if (obj.type == "readyForGame") {
				game_server.readyForGame(obj);
			}
			else if (obj.type == "checkGameState") {
				game_server.checkGameState(obj);
			}
			else if (obj.type == "startLoadingGame") {
				game_server.startLoadingGame(obj);
			}
			// else if(obj.type == "findQuickMatch") {
			// game_server.findQuickMatch(obj);
			// }
			// else if(obj.type == "confirmJoinGame") {
			// game_server.confirmJoinGame(obj);
			// }
			else if (obj.type == "startGame") {
				game_server.startGame(obj);
			}
			// else if(obj.type == "playerAnswer") {
			// game_server.onPlayerAnswer(obj);
			// }
			else if (obj.type == "onlinePlayers") {
				game_server.getAvailablePlayers(socket.id, obj);
			}
			else if (obj.type == "waitingGames") {
				game_server.getWaitingGames(socket.id, obj);
			}
			else if (obj.type == "playingGames") {
				game_server.getPlayingGames(socket.id, obj);
			}
			else if (obj.type == "invite") {
				game_server.inviteToGame(socket.id, obj);
			}
//			else if (obj.type == "requestEndGame") {
//				game_server.onReceiveRqEndGame(obj);
//			}
//			else if (obj.type == "playerQuitGame") {
////				game_server.onUserQuitGame(socket.id);
//				game_server.onUserQuitGame(obj);
//			}
//			else if (obj.type == "pauseGame") {
//				game_server.onPauseGame(obj);
//			}
//			else if (obj.type == "resumeGame") {
//				game_server.onResumeGame(obj);
//			}
			else if (obj.type == "endGame") {
				game_server.onReceiveRqEndGame(obj);
			}
			else if (obj.type == "playerExitGame") {
				game_server.onUserQuitGame(obj);
			}
			else if (obj.type == "pauseResumeGame") {
				game_server.onPauseResumeGame(obj);
			}
			else if (obj.type == "playerLogOut") {
				game_server.onUserLogout(socket.id);
			}
		} catch (err) {
			console.log("Errorrrorororoororororororororororororo:" + JSON.stringify(err));
		}

	});
	socket.on('disconnect', function() {
		game_server.onUserDisconnect(socket.id);
	});
});

app_server.sendMsgToClient = function(sId, msg) {
	try {
		// console.log("sendMsgToClient: " + sId + " with msg: " +
		// JSON.stringify(msg));
		io.sockets.sockets[sId].emit('message', msg);
	} catch (err) {
		console.log("Error: " + JSON.stringify(err));
	}

};

app_server.sendToClient = function(sId, notice, msg) {
	try {
		// console.log("sendMsgToClient: " + sId + " with msg: " +
		// JSON.stringify(msg));
		io.sockets.sockets[sId].emit(notice, msg);
	} catch (err) {
		console.log("Error: " + JSON.stringify(err));
	}

};

var hasOwnProperty = Object.prototype.hasOwnProperty;
