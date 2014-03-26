/*  Copyright (c) 2013 TruongNGUYEN
    Server for projectX
    BH Licensed.
 */

//var TYPE_INVITE = "invite";
//var TYPE_FOUND_PLAYER = "foundPlayer";
//var TYPE_PLAYER_NOT_AVAILABLE = "playerNotAvailable";
//var TYPE_WELLCOME = "wellcome";
//var TYPE_RECEIVE_CONFIRM = "receiveConfirm";
//var TYPE_START_GAME = "startGame";
//var TYPE_NEXT_ROUND = "nextRound";
//var TYPE_PLAYER_ANSWER = "playerAnswer";
//var TYPE_END_GAME = "endGame";
//var TYPE_PLAYER_DISCONNECT = "playerDisconnect";
//var TYPE_PLAYER_RECONNECTED = "playerReconnect";
//var TYPE_ONLINE_PLAYERS = "onlinePlayers";
var TYPE_CONNECTED = "userJoined";
//var TYPE_CREATE_GAME = "createGame";
//var TYPE_JOIN_GAME_SUCCESS = "joinGameSuccess";
//var TYPE_JOIN_GAME_NOT_SUCCESS = "joinGameNotSuccess";
//var TYPE_PLAYER_JOIN_GAME = "playerJoinGame";
//var TYPE_PLAYER_EXIT_GAME = "playerExitGame";
//var TYPE_PALYER_READY_GAME = "readyForGame";
//var TYPE_CHECK_START_GAME = "checkStartGame";
//var TYPE_HOST_EXIT_GAME = "hostExitGame";
//var TYPE_AVAILABLE_PLAYERS = "availablePlayers";
//var TYPE_CHAT = "chat";
var MessageType = {
		"Chat" : "chat",
		"CheckGameState" : "checkGameState",
		"CreateGame" : "createGame",
		"EndGame" : "endGame",
		"InvitePlayer" : "invite",
		"JoinGame" : "joinGame",
//		"JoinGameNotSuccess" : "joinGameNotSuccess",
		"MessageInGame" : "msgInGame",
		"OnlinePlayers" : "onlinePlayers",
		"PauseResumeGame" : "pauseResumeGame",
		"PlayerExitGame" : "playerExitGame",
//		"PlayerJoinGame" : "playerJoinGame",
		"PlayerLogOut" : "playerLogOut",
		"PlayerNotAvailable" : "playerNotAvailable",
		"PlayingGames" : "playingGames",
//		"ExitWaitingGame" : "exitWaitingGame",
		"ReadyForGame" : "readyForGame",
		"StartLoadingGame" : "startLoadingGame",
		"StartGame" : "startGame",
//		"StartGameNotSuccess" : "startGameNotSuccess",
		"WaitingGames" : "waitingGames",
		"UpdateGame" : "updateGame"
};
var PlayerPlayingState = {
	"Idle" : 0,
	"Playing" : 1,
	"Busy" : 2
};

var PlayerOnlineState = {
	"Offline" : 0,
	"Online" : 1,
	"Invisible" : 2
};

var PlayerProperty = {
	"Id" : "id",
	"Name" : "name",
	"OnlineState" : "onlineState",
	"PlayingState" : "playingState",
	"AvatarUrl" : "avatarUrl",
	"Channel" : "channel",
	"SocketId" : "socketId"
};

function Player(id, name, onlineState, playingState, avatarUrl, channel, socketId){
	this.id = id;
	this.name = name;
	this.onlineState = onlineState;
	this.playingState = playingState;
	this.avatarUrl = avatarUrl;
	this.channel = channel;
	this.socketId = socketId;
}

var GameState = {
//	"CreatingOrJoining" : 0,
	"Waiting" : 1,
	"Loading" : 2,
	"Playing" : 3,
	"Pausing" : 4,
	"Ended" : 5
};

var JoinGameState = {
	"Success" : 0,
	"GameNotExist" : 1,
	"PlayerIsAlreadyJoint" : 2,
	"NotEnoughSlot" : 3,
	"NotWaitingGame" : 4
};

var StartLoadingGameState = {
	"Success" : 0,
	"GameNotExist" : 1,
	"SenderIsNotHost" : 2,
	"PlayersAreNotReady" : 3
};

var StartGameState = {
	"Success" : 0,
	"GameNotExist" : 1,
	"SenderIsNotHost" : 2,
	"PlayersAreNotReady" : 3,
	"NotLoadingGame" : 4
};

var GamePlayerReadyState = {
	"NotReadyToLoadGame" : 0,
	"ReadyToLoadingGame" : 1,
	"NotReadyToPlay" : 2,
	"ReadyToPlay" : 3
};

var CheckGameState = {
	"GameNotExist" : 0,
	"SenderIsNotJointGame" : 1,
	"NotReadyToLoadGame" : 2,
	"ReadyToLoadGame" : 3,
	"NotReadyToPlay" : 4,
	"ReadyToPlay": 5,
	"Playing" : 6,
	"Pausing" : 7,
	"Ended" : 8
};

var EndGameState = {
	"Success" : 0,
	"GameNotExist" : 1,
	"SenderIsNotPlayers" : 2,
	"GameHasEnded" : 3,
	"NotPlayingGame" : 4,
	"GameIsNotEndYet" : 5
};

var intervalTime = 15;
//var maxPlayerInGame = 2;
var hasOwnProperty = Object.prototype.hasOwnProperty;

//var recordIntervals = {};
//var gameTimers = {};
//var numberOfPlayerAnswer = {};
var clients = {};
var socketsOfClients = {};
var games = {};
var players = {};
var currentGameOfPlayer = {};

var game_server = module.exports, app_server = require('./app.js'), game_logic = require('./game.logic.js'), verbose = true;
game_server.users = function(req, res) {
	var str = "";
	var i = 0;
	Object.keys(players).forEach(
			function(userName) {
				str += (i++) + "Id: " + players[userName][PlayerProperty.Id] + "<br/>"
						+ "     Player: " + players[userName][PlayerProperty.Name] + "<br/>"
						+ "     Channel: " + players[userName][PlayerProperty.Channel] + "<br/>"
						+ "     OnlineState: " + players[userName][PlayerProperty.OnlineState] + "<br/>"
						+ "     PlayingState: " + players[userName][PlayerProperty.PlayingState] + "<br/>";
			});
	res.send(str);
};

game_server.games = function(req, res) {
	var str = "";
	var i = 0;
	Object.keys(games).forEach(
			function(gameId) {
				str += JSON.stringify(games[gameId]) + ".           \n";
			});
	res.send(str);
};

game_server.chat = function(obj) {
	var dataToSend = {};
	dataToSend.type = MessageType.Chat;
	dataToSend.data = obj;
	obj.receivers.forEach(function(player) {
		if (clients.hasOwnProperty(player)) {
			app_server.sendMsgToClient(clients[player], dataToSend);
		}
	});
};

//game_server.sendMsgToOtherClient = function(obj) {
//	var fromClient = obj.fromClient;
//	var toClients = obj.toClients;
//	var data = obj.msg;
//	var dataToSend = {};
//	dataToSend.notice = "receiveMsgFromOtherClient";
//	dataToSend.fromClient = fromClient;
//	dataToSend.msg = data;
//	if (data.hasOwnProperty("gameId")) {
//		var gameId = data.gameId;
//		if (games.hasOwnProperty(gameId)) {
//			toClients.forEach(function(toClient) {
//				sendMessageToAPlayer(toClient, dataToSend);
//			});
//		}
//	} else {
//		toClients.forEach(function(toClient) {
//			sendMessageToAPlayer(toClient, dataToSend);
//		});
//	}
//};

game_server.sendMsgInGameToOtherPlayers = function(obj) {
	var senderId = obj.sender;
	var toClients = obj.receivers;
	var data = obj.data;
	var dataToSend = {};
	dataToSend.type = MessageType.MessageInGame;
	dataToSend.sender = senderId;
	dataToSend.data = data;
	if (data.hasOwnProperty("id")) {
		var gameId = data.id;
		if (games.hasOwnProperty(gameId)) {
			var game = games[gameId];
			if (game.state == GameState.Playing)
			{
				if (lengthOfObj(toClients) == 0)
					sendMessageToAll(game, dataToSend);
				else {
					toClients.forEach(function(toClient) {
						sendMessageToAPlayer(toClient, dataToSend);
					});			
				}
			}
		}
	}
};

game_server.setPlayer = function(sId, data) {
	onUserConnect(sId, data);
	app_server.sendToClient(sId, TYPE_CONNECTED, {
		"clientId" : sId
	});
};

//function onUserConnect(sId, playerData) {
//	var id = playerData.id;
//	var i = 0;
//	// Does not exist ... so, proceed
//	clients[id] = sId;
//	if (players.hasOwnProperty(id)) {
//		try {
//			if (currentGameOfPlayer.hasOwnProperty(id)) {
//				var gameId = currentGameOfPlayer[id];
//				var data = {};
//				data.player = playerName;
//				endWhenPlayerQuitGame(gameId, "playerQuitGame", data)
//			}
//		} catch (err) {
//		}
//		delete players[id];
//	}
//	console.log(JSON.stringify(playerData));
//	players[id] = {
//		"name" : playerData.name,
//		"status" : playerData.status,
//		"socketId" : sId,
//		"channel" : playerData.channel,
//		"id" : id
//	};
//	Object.keys(socketsOfClients).forEach(function(oldSocketId) {
//		if (socketsOfClients[oldSocketId] == id) {
//			delete socketsOfClients[oldSocketId];
//		}
//	});
//	socketsOfClients[sId] = id;
//}

function onUserConnect(sId, playerData) {
	var id = playerData.id;
	// Does not exist ... so, proceed
	clients[id] = sId;
	if (players.hasOwnProperty(id)) {
		try {
			if (currentGameOfPlayer.hasOwnProperty(id)) {
				var gameId = currentGameOfPlayer[id];
				processWhenPlayerQuitGame(id, gameId);
			}
		} catch (err) {
		}
		delete players[id];
	}
	log("onUserConnect:player:", playerData);
	players[id] = new Player(id,
							playerData[PlayerProperty.Name],
							playerData[PlayerProperty.OnlineState],
							playerData[PlayerProperty.PlayingState],
							playerData[PlayerProperty.AvatarUrl],
							playerData[PlayerProperty.Channel],
							sId);
	Object.keys(socketsOfClients).forEach(function(oldSocketId) {
		if (socketsOfClients[oldSocketId] == id) {
			delete socketsOfClients[oldSocketId];
		}
	});
	socketsOfClients[sId] = id;
}

//game_server.onUserDisconnect = function(sId) {
//	try {
//		if (socketsOfClients.hasOwnProperty(sId)) {
//			var player = socketsOfClients[sId];
//			if (currentGameOfPlayer.hasOwnProperty(player)) {
//				var gameId = currentGameOfPlayer[player];
//				if (games.hasOwnProperty(gameId)) {
//					console.log("games[gameId].playing: "
//							+ games[gameId].playing + " -- "
//							+ typeof games[gameId].playing);
//					if (games[gameId].playing == false
//							|| games[gameId].playing == "false") {
//						var obj = {
//							"gameId" : gameId,
//							"isHostPlayer" : games[gameId].clientPlayers[player].isHost,
//							"player" : player
//						};
//						exitWaitingGame(obj);
//					} else {
//						console.log("User disconnect when playing game");
//						var data = {
//							"player" : player
//						};
//						endWhenPlayerQuitGame(gameId, "playerQuitGame", data)
//					}
//				}
//			}
//			delete players[socketsOfClients[sId]];
//			delete clients[socketsOfClients[sId]];
//			delete socketsOfClients[sId];
//		}
//	} catch (err) {
//		console.log("ERORR onUserDisconnect: " + JSON.stringify(err));
//	}
//};
//
//game_server.onUserLogout = function(sId) {
//	try {
//		if (socketsOfClients.hasOwnProperty(sId)) {
//			delete players[socketsOfClients[sId]];
//			delete clients[socketsOfClients[sId]];
//			delete socketsOfClients[sId];
//		}
//	} catch (err) {
//		console.log("ERORR onUserLogout: " + JSON.stringify(err));
//	}
//};

function disconnect(sId){
	try {
		if (socketsOfClients.hasOwnProperty(sId)) {
			var playerId = socketsOfClients[sId];
			if (currentGameOfPlayer.hasOwnProperty(playerId)) {
				var gameId = currentGameOfPlayer[playerId];
				processWhenPlayerQuitGame(playerId, gameId);
			}
			delete players[socketsOfClients[sId]];
			delete clients[socketsOfClients[sId]];
			delete socketsOfClients[sId];
		}
	} catch (err) {
		console.log("ERORR onUserDisconnect: " + JSON.stringify(err));
	}
}

game_server.onUserDisconnect = function(sId) {
	disconnect(sId);
};

game_server.onUserLogout = function(sId) {
	disconnect(sId);
};

//game_server.onUserQuitGame = function(sId) {
//	try {
//		if (socketsOfClients.hasOwnProperty(sId)) {
//			if (currentGameOfPlayer.hasOwnProperty(socketsOfClients[sId])) {
//				var gameId = currentGameOfPlayer[socketsOfClients[sId]];
//				var data = {};
//				data.player = socketsOfClients[sId];
//				endWhenPlayerQuitGame(gameId, "playerQuitGame", data)
//			}
//		}
//	} catch (err) {
//		console.log("ERORR onUserQuitGame: " + JSON.stringify(err));
//	}
//};

game_server.onUserQuitGame = function(obj) {
	var playerId = obj.sender;
	var gameId = obj.data.id;
	processWhenPlayerQuitGame(playerId, gameId);
};

game_server.getAvailablePlayers = function(sId, obj) {
	try {
		var availableUsers = new Array();
		var i = 0;
		Object.keys(players).forEach(
				function(playerId) {
					log("Player: ", players[playerId]);
//					if (players[playerId][PlayerProperty.Channel] == obj.appName && players[email][PlayerProperty.PlayingState] == PlayerPlayingState.Idle)
					if (players[playerId][PlayerProperty.OnlineState] == PlayerOnlineState.Online)
						if (i <= 20) {
							availableUsers.push(players[playerId]);
						}
					i++;
				});

		var dataToSend = {
			"type" : MessageType.OnlinePlayers,
			"data" : {
				"availablePlayers" : availableUsers
			}
		};
		app_server.sendMsgToClient(sId, dataToSend);

	} catch (err) {
		console.log("Error when get getAvailablePlayers: "
				+ JSON.stringify(err));
	}
}; // game_server.getAvailablePlayers

game_server.getWaitingGames = function(sId, obj) {
	try {
		var waitingGames = new Array();
		var i = 0;
		Object.keys(games).forEach(
				function(gameId) {
					if (games[gameId].channel == obj.channel
							&& games[gameId].state == GameState.Waiting) {
						waitingGames.push(games[gameId]);
						i++;
					}
				});
		var dataToSend = {
			"type" : MessageType.WaitingGames,
			"data" : {
				"games" : waitingGames
			}
		};
		app_server.sendMsgToClient(sId, dataToSend);

	} catch (err) {
		console.log("Error when get getWaittingGames: " + JSON.stringify(err));
	}
}; // game_server.getWaittingGames

game_server.getPlayingGames = function(sId, obj) {
	try {
		var playingGames = new Array();
		var i = 0;
		Object.keys(games).forEach(
				function(gameId) {
					if (games[gameId].channel == obj.channel
							&& games[gameId].state == GameState.Playing) {
						playingGames.push(games[gameId]);
						i++;
					}
				});
		var dataToSend = {
			"type" : MessageType.PlayingGames,
			"data" : {
				"games" : playingGames
			}
		};
		app_server.sendMsgToClient(sId, dataToSend);

	} catch (err) {
		console.log("Error when get getPlayingGames: " + JSON.stringify(err));
	}
}; // game_server.getPlayingGames

//game_server.findQuickMatch = function(obj) {
//	var dataToSend = {};
//	console.log('looking for a game for user: ' + obj.data.sender);
//	var i;
//	var keys = Object.keys(object);
//	var length = keys.length;
//	var result = [];
//	for (i = 0; i < length; i++) {
//		var p = object[keys[Math.floor(Math.random() * length)]];
//		if (p.email != obj.player && p.status == 1) {
//			result.push(p);
//			i++;
//		}
//		if (i > 4) {
//			break;
//		}
//	}
//	if (result.length > 0) {
//		for ( var player in result) {
//			dataToSend.notice = "inviteQuickMatch";
//			dataToSend.data = obj;
//			console.log('found user: ' + JSON.stringify(player));
//			app_server.sendMsgToClient(clients[player.email], dataToSend);
//		}
//	} else {
//
//	}
//}; // game_server.findQuickMatch

//game_server.createGame = function(obj) {
//	var game = obj.game;
//	var gameId = game.id;
//	games[gameId] = game;
//	var dataToSend = {
//		"notice" : TYPE_CREATE_GAME_SUCCESS
//	};
//	for ( var key in games[gameId].clientPlayers) {
//		currentGameOfPlayer[key] = gameId;
//		players[key].status = 2;
//		app_server.sendMsgToClient(clients[key], dataToSend);
//	}
//
//}; // game_server.createGame

game_server.createGame = function(obj) {
	var senderId = obj.sender;
	var game = obj.data.game;
	var gameId = game.id;
	var dataToSend = {
			"type" : MessageType.CreateGame,
			"data" : 
			{
				"id" : gameId
			}
	};
	if (games.hasOwnProperty(gameId)) {
		log("createGame:Unsuccess:GameId:", gameId);
		log("createGame:Unsuccess:Games:", games);
		dataToSend.data.success = false;
	}
	else
	{
		var player = {
			"id" : senderId,
			"state" : GamePlayerReadyState.NotReadyToLoadGame
		}
		addPlayerIntoGame(player, game);
		game.host = senderId;
		game.state = GameState.Waiting;
		games[gameId] = game;
		setCurrentGameOfPlayer(senderId, gameId);
		dataToSend.data.success = true;
	}
	app_server.sendMsgToClient(clients[senderId], dataToSend);
}; // game_server.createGame

function addPlayerIntoGame(player, game) {
	if (!game.hasOwnProperty("players"))
		game.players = {};
	game.players[player.id] = player;
}


//game_server.createQuickGame = function(obj) {
//	console.log("create quick game: " + JSON.stringify(obj));
//	var game = obj.game;
//	var gameId = game.id;
//	games[gameId] = game;
//	var dataToSend = {
//		"notice" : "createQuickGameSuccess"
//	};
//	dataToSend.data = obj;
//	for ( var key in games[gameId].clientPlayers) {
//		try {
//			currentGameOfPlayer[key] = gameId;
//			players[key].status = 2;
//			app_server.sendMsgToClient(clients[key], dataToSend);
//		} catch (err) {
//			console.log("error when create quick match");
//		}
//
//	}
//}; // game_server.createQuickGame

//game_server.updateGame = function(obj) {
//	var newGame = obj.game;
//	var gameId = newGame.id;
//	delete games[gameId];
//	games[gameId] = newGame;
//	for (var key in games[gameId].clientPlayers) {
//		if (games[gameId].clientPlayers[key].isHost == "false")
//			games[gameId].clientPlayers[key].status = false;
//	}
//	var dataToSend = {
//		"type" : "updateGame"
//	};
//	dataToSend.data = obj;
//	for (var key in games[gameId].clientPlayers) {
//		app_server.sendMsgToClient(clients[key], dataToSend);
//	}
//}; // game_server.updateGame

game_server.updateGame = function(obj) {
	var senderId = obj.sender;
	var gameId = obj.data.id;
	if (games.hasOwnProperty(gameId))
	{
		var game = games[gameId];
		if (game.host == senderId)
		{
			var dataToSend = {
				"type" : MessageType.UpdateGame
			};
			dataToSend.data = obj.data;
			sendMessageToAll(game, dataToSend);
		}
	}
}; // game_server.updateGame

//game_server.joinGame = function(obj) {
//
//	var gameId = obj.gameId;
//	var playerJoin = obj.player;
//	if (games.hasOwnProperty(gameId)
//			&& lengthOfObj(games[gameId].clientPlayers) < games[gameId].playerNumber) {
//		games[gameId].clientPlayers[obj.playerEmail] = playerJoin;
//		var dataToSend = {
//			"notice" : TYPE_PLAYER_JOIN_GAME
//		};
//		dataToSend.data = {};
//		dataToSend.data.game = games[gameId];
//		for ( var key in games[gameId].clientPlayers) {
//			currentGameOfPlayer[key] = gameId;
//			players[key].status = 2;
//			app_server.sendMsgToClient(clients[key], dataToSend);
//		}
//	} else {
//		console.log("games notHasOwnProperty(gameId)");
//		var dataToSend = {
//			"notice" : TYPE_JOIN_GAME_NOT_SUCCESS
//		};
//		app_server.sendMsgToClient(clients[obj.playerEmail], dataToSend);
//	}
//}; // game_server.joinGame

game_server.joinGame = function(obj) {
	var gameId = obj.data.id;
	var playerJoinId = obj.sender;
	var dataToSend = {
		"type" : MessageType.JoinGame
	};
	dataToSend.data = {
		"id" : gameId
	};
	if (games.hasOwnProperty(gameId)) {
		var game = games[gameId];
		if (game.state == GameState.Waiting) {
			if (!game.players.hasOwnProperty(playerJoinId)) {
				if (hasSlotToJoinGame(game)) {
					var playerJoin = {
						"id" : playerJoinId,
						"state" : GamePlayerReadyState.NotReadyToLoadGame
					}
					addPlayerIntoGame(playerJoin, game);
//						game.players[playerJoinId] = playerJoin;
					setCurrentGameOfPlayer(playerJoinId, gameId);
					dataToSend.data.state = JoinGameState.Success;
					dataToSend.data.player = playerJoinId;
					dataToSend.data.game = game;
					sendMessageToAll(game, dataToSend);
				} else {
					log("Joint game: Could not joint game ", gameId);
					log("Joint game: Reason: ", "NotEnoughtSlot");
					log("Joint game: Game: ", game);
					dataToSend.data.state = JoinGameState.NotEnoughSlot;
					sendMessageToAPlayer(playerJoinId, dataToSend);
				}
			} else {
				log("Joint game: Could not joint game ", gameId);
				log("Joint game: Reason: ", "PlayerIsAlreadyJoint");
				log("Joint game: Game: ", game);
				dataToSend.data.state = JoinGameState.PlayerIsAlreadyJoint;
				sendMessageToAPlayer(playerJoinId, dataToSend);
			}
		} else {
			log("Joint game: Could not joint game ", gameId);
			log("Joint game: Reason: ", "NotWaitingGame");
			log("Joint game: Game: ", game);
			dataToSend.data.state = JoinGameState.NotWaitingGame;
			sendMessageToAPlayer(playerJoinId, dataToSend);
		}
	} else {
		log("Joint game: Could not joint game ", gameId);
		log("Joint game: Reason: ", "GameIsNotExist");
		log("Joint game: Games: ", games);
		dataToSend.data.state = JoinGameState.GameNotExist;
		sendMessageToAPlayer(playerJoinId, dataToSend);
	}
}; // game_server.joinGame

function hasSlotToJoinGame(game) {
	if (game.hasOwnProperty("maxPlayersNumber") && (game.maxPlayersNumber > 0)) {
		if (lengthOfObj(game.players) < game.maxPlayersNumber)
			return true;
		else
			return false;
	} else {
		return true;
	}
}

//game_server.exitWaitingGame = function(obj) {
//	exitWaitingGame(obj);
//};
//
//function exitWaitingGame(obj) {
//	var gameId = obj.gameId;
//	var playerExit = obj.player;
//	var isHost = (obj.isHostPlayer == "true");
//	if (games.hasOwnProperty(gameId)) {
//		if (!isHost) {
//			var dataToSend = {
//				"notice" : TYPE_PLAYER_EXIT_GAME
//			};
//			dataToSend.data = {
//				"player" : games[gameId].clientPlayers[playerExit],
//				"playerEmail" : playerExit
//			};
//			app_server.sendMsgToClient(gameId, dataToSend);
//			delete games[gameId].clientPlayers[playerExit];
//			delete currentGameOfPlayer[playerExit];
//			players[playerExit].status = 1;
//		} else {
//			var dataToSend = {
//				"notice" : TYPE_HOST_EXIT_GAME
//			};
//			dataToSend.data = {
//				"player" : games[gameId].clientPlayers[playerExit]
//			};
//			for ( var email in games[gameId].clientPlayers) {
//				try {
//					players[email].status = 1;
//					delete currentGameOfPlayer[email];
//					if (email != playerExit)
//						app_server.sendMsgToClient(clients[email], dataToSend);
//				} catch (err) {
//					console.log("Error: " + JSON.stringify(err));
//				}
//			}
//			delete games[gameId];
//		}
//
//	} else {
//		console.log("games notHasOwnProperty(gameId)");
//	}
//}

//game_server.readyForGame = function(obj) {
//	var gameId = obj.gameId;
//	var playerEmail = obj.sender;
//	var ready = (obj.ready == "true");
//	if (games.hasOwnProperty(gameId)) {
//		games[gameId].clientPlayers[playerEmail].status = ready;
//		var dataToSend = {
//			"notice" : TYPE_PALYER_READY_GAME
//		};
//		dataToSend.data = obj;
//		for ( var email in games[gameId].clientPlayers) {
//			if (email != playerEmail)
//				app_server.sendMsgToClient(clients[email], dataToSend);
//		}
//	} else {
//		console.log("games notHasOwnProperty(gameId)");
//	}
//};

game_server.readyForGame = function(obj) {
	var gameId = obj.data.id;
	var playerId = obj.sender;
	var state = obj.data.state;
	if (games.hasOwnProperty(gameId)) {
		var game = games[gameId];
		if (game.players.hasOwnProperty(playerId))
		{
			var dataToSend = {
				"type" : MessageType.ReadyForGame
			};
			dataToSend.data = {
				"id" : gameId,
				"player" : playerId,
				"state" : state,
				"game" : game
			};
			if (game.state == GameState.Waiting) 
			{
				if ((state == GamePlayerReadyState.NotReadyToLoadGame) || (state == GamePlayerReadyState.ReadyToLoadingGame))
				{
					game.players[playerId].state = state;
					sendMessageToAllExceptPlayer(game, dataToSend, playerId);
				}
				else
				{
					log("readyForGame: ReadyStateNotValid: State: ", state);
					log("readyForGame: ReadyStateNotValid: Game: ", game);
				}
			}
			else if (game.state == GameState.Loading)
			{
				if ((state == GamePlayerReadyState.NotReadyToPlay) || (state == GamePlayerReadyState.ReadyToPlay))
				{
					game.players[playerId].state = state;
					sendMessageToAllExceptPlayer(game, dataToSend, playerId);
				}
				else
				{
					log("readyForGame: ReadyStateNotValid: State: ", state);
					log("readyForGame: ReadyStateNotValid: Game: ", game);
				}
			}
			else
			{
				log("readyForGame: GameIsInOtherState: Game: ", game);
			}
		} else {
			log("readyForGame: PlayerNotJoinGame: PlayerId: ", playerId);
			log("readyForGame: PlayerNotJoinGame: Game: ", game);
		}
	} else {
		log("readyForGame: GameNotExit: GameId: ", gameId);
		log("readyForGame: GameNotExit: Games: ", games);
	}
}; // game_server.readyForGame

//game_server.checkStartGame = function(obj) {
//	var gameId = obj.gameId;
//	var player = obj.player;
//	games[gameId].clientPlayers[player].status = true;
//	if (games.hasOwnProperty(gameId)) {
//		var ready = true;
//		if (lengthOfObj(games[gameId].clientPlayers) < games[gameId].playerNumber) {
//			ready = false;
//		} else
//			for ( var playerEmail in games[gameId].clientPlayers) {
//				var status = games[gameId].clientPlayers[playerEmail].status;
//				if (status == false || status == "false") {
//					ready = false;
//					break;
//				}
//			}
//		var dataToSend = {
//			"notice" : TYPE_CHECK_START_GAME
//		};
//		dataToSend.data = {
//			"ready" : ready
//		};
//		app_server.sendMsgToClient(clients[player], dataToSend);
//	} else {
//		console.log("games notHasOwnProperty(gameId)");
//	}
//};

game_server.checkGameState = function(obj) {
	var gameId = obj.data.id;
	var senderId = obj.sender;
	var dataToSend = {
		"type" : MessageType.CheckGameState
	};
	dataToSend.data = {
		"id" : gameId
	};
	if (games.hasOwnProperty(gameId))
	{
		var game = games[gameId];
		if (game.players.hasOwnProperty(senderId))
		{
			dataToSend.data.game = game;
			if (game.state == GameState.Waiting)
			{
				if (arePlayersEnoughAndReadyToStartLoading(game))
					dataToSend.data.state = CheckGameState.ReadyToLoadGame;
				else
					dataToSend.data.state = CheckGameState.NotReadyToLoadGame;
				sendMessageToAPlayer(senderId, dataToSend);
			}
			else if (game.state == GameState.Loading)
			{
				if (arePlayersReadyToStart(game))
					dataToSend.data.state = CheckGameState.ReadyToPlay;
				else
					dataToSend.data.state = CheckGameState.NotReadyToPlay;
				sendMessageToAPlayer(senderId, dataToSend);
			}
			else if (game.state == GameState.Playing)
			{
				dataToSend.data.state = CheckGameState.Playing;
				sendMessageToAPlayer(senderId, dataToSend);
			}
			else if (game.state == GameState.Pausing)
			{
				dataToSend.data.state = CheckGameState.Pausing;
				sendMessageToAPlayer(senderId, dataToSend);
			}
			else// if (game.state == GameState.Ended)
			{
				dataToSend.data.state = CheckGameState.Ended;
				sendMessageToAPlayer(senderId, dataToSend);
			}
		}
		else
		{
			dataToSend.data.state = CheckGameState.SenderIsNotJointGame;
			sendMessageToAPlayer(senderId, dataToSend);
			log("checkGameState: SenderIsNotJointGame: SenderId", senderId);
			log("checkGameState: SenderIsNotJointGame: Game", game);
		}
	}
	else
	{
		dataToSend.data.state = CheckGameState.GameNotExist;
		sendMessageToAPlayer(senderId, dataToSend);
		log("checkGameState: GameNotExist: GameId", gameId);
		log("checkGameState: GameNotExist: Games", games);
	}
};

function hasEnoughPlayerToStartGame(game) {
	if (game.hasOwnProperty("minPlayersNumber") && (game.minPlayersNumber > 0)) {
		if (lengthOfObj(game.players) >= game.minPlayersNumber)
			return true;
		else
			return false;
	} else {
		return true;
	}
}

function arePlayersEnoughAndReadyToStartLoading(game) {
	if (hasEnoughPlayerToStartGame(game)) 
	{
		for (var playerId in game.players) 
		{
			var isPlayerReady = game.players[playerId].state == GamePlayerReadyState.ReadyToLoadingGame;
			if (!isPlayerReady)
				return false;
		}
		return true;
	}
	return false;
}

function arePlayersReadyToStart(game) {
	for (var playerId in game.players) {
		var isPlayerReady = game.players[playerId].state == GamePlayerReadyState.ReadyToPlay;
		if (!isPlayerReady) {
			return  false;
		}
	}
	return true;
}

//game_server.inviteToGame = function(sId, obj) {
//	var dataToSend = {};
////	var playerEmail = obj.player;
////	var gameId = obj.data.gameId;
//	
//	obj.players.forEach(function(playerId) {
//		if (players[playerId].status == PlayerStateIdle) && games.hasOwnProperty(gameId)) {
//			dataToSend.notice = TYPE_INVITE;
//			dataToSend.sender = obj.sender
//			dataToSend.players = players
//			dataToSend.data = obj.data;
////			dataToSend.data.game = games[gameId];
//			app_server.sendMsgToClient(clients[playerId], dataToSend);
//		} else {
//			dataToSend.notice = TYPE_PLAYER_NOT_AVAILABLE;
//			dataToSend.data = {
//				"player" : playerId
//			};
//			app_server.sendMsgToClient(sId, dataToSend);
//		}
//	});
//}; // game_server.inviteToGame

game_server.inviteToGame = function(sId, obj) {
	var dataToSend = {};
//	var playerEmail = obj.player;
	var gameId = obj.data.id;
	
	if (games.hasOwnProperty(gameId))
	{
		var game = games[gameId];
		obj.receivers.forEach(function(playerId) 
			{
				if ((players.hasOwnProperty(playerId)) && (players[playerId][PlayerProperty.PlayingState] == PlayerPlayingState.Idle)) {
					dataToSend.type = MessageType.InvitePlayer;
					dataToSend.sender = obj.sender;
//					dataToSend.data = obj.data;
					dataToSend.data = {
						"id" : gameId,
						"game" : game
					}
					sendMessageToAPlayer(playerId, dataToSend);
				} else {
					dataToSend.type = MessageType.PlayerNotAvailable;
					dataToSend.data = {
						"id" : gameId,
						"player" : playerId
					};
					app_server.sendMsgToClient(sId, dataToSend);
				}
			});	
	} else {
		console.log("inviteToGame: games notHasOwnProperty(" + gameId +")");
		console.log("inviteToGame: games : " + JSON.stringify(games));
	}
}; // game_server.inviteToGame

//game_server.confirmJoinGame = function(obj) {
//	var dataToSend = {};
//	dataToSend.notice = "receiveConfirm"
//	dataToSend.data = obj;
//	app_server.sendMsgToClient(clients[obj.sender], dataToSend);
//}; // game_server.confirmJoinGame

//game_server.startGame = function(obj) {
//	var gameId = obj.gameId;
//	var dataToSend = {};
//	var prepareTime = obj.prepareTime;
//	dataToSend.notice = "startGame";
//	dataToSend.data = obj;
//	if (games.hasOwnProperty(gameId)) {
//		for ( var playerEmail in games[gameId].clientPlayers) {
//			app_server.sendMsgToClient(clients[playerEmail], dataToSend);
//		}
//		numberOfPlayerAnswer[gameId] = 0;
//		games[gameId].passedRound = {};
//		try {
//			if (recordIntervals.hasOwnProperty(gameId)) {
//				clearTimeout(recordIntervals[gameId]);
//				delete recordIntervals[gameId];
//			}
//		} catch (err) {
//			console.log("Err: " + JSON.stringify(err));
//		}
//		if (!games[gameId].hasOwnProperty("scores"))
//			games[gameId].scores = {};
//		for ( var playerEmail in games[gameId].clientPlayers) {
//			games[gameId].scores[playerEmail] = 0;
//		}
//		games[gameId].playing = "true";
//		console.log("game saved with: " + JSON.stringify(games[gameId]));
//		setTimeout(function() {
//			recordIntervals[gameId] = startIntervalTimer(gameId, intervalTime);
//		}, prepareTime * 1000);
//	}
//}; // game_server.confirmJoinGame

//{
//	type: "startLoadGame",
//	data:
//	{
//		id: GameId,
//		state: Success/GameNotExist/SenderIsNotHost/PlayersAreNotReady,
//		game: Game //Only when reason is PlayersAreNotReady
//	}
//}

game_server.startLoadingGame = function(obj) {
	var senderId = obj.sender;
	var gameId = obj.data.id;
	var dataToSend = {
		"type" : MessageType.StartLoadingGame
	};
	dataToSend.data = {
		"id" : gameId
	};
	if (games.hasOwnProperty(gameId)) {
		var game = games[gameId];
		if (game.host == senderId)
		{
			if (arePlayersEnoughAndReadyToStartLoading(game))
			{
				game.state = GameState.Loading;
				dataToSend.data.state = StartLoadingGameState.Success;
				sendMessageToAll(game, dataToSend);
				log("startLoadingGame: Success: Game: ", game);
			}
			else
			{
				dataToSend.data.state = StartLoadingGameState.PlayersAreNotReady;
				dataToSend.data.game = game;
				sendMessageToAPlayer(senderId, dataToSend);
				log("startLoadingGame: PlayersAreNotReady: Game: ", game);
			}
		}
		else
		{
			dataToSend.data.state = StartLoadingGameState.SenderIsNotHost;
			sendMessageToAPlayer(senderId, dataToSend);
			log("startLoadingGame: SenderIsNotHost: SenderId: ", senderId);
			log("startLoadingGame: SenderIsNotHost: Game: ", game);
		}
	}
	else
	{
		dataToSend.data.state = StartLoadingGameState.GameNotExist;
		sendMessageToAPlayer(senderId, dataToSend);
		log("startLoadingGame: GameNotExist: GameId: ", gameId);
		log("startLoadingGame: GameNotExist: Games: ", games);
	}
}; // game_server.startLoadingGame
//data:
//{
//	id: GameId
//	state: Success/GameNotExist/SenderIsNotHost/PlayersAreNotReady/NotLoadingGame
//	game: Game //Only when reason is PlayersAreNotReady or NotLoadingGame
//}
game_server.startGame = function(obj) {
	var senderId = obj.sender;
	var gameId = obj.data.id;
	var dataToSend = {
		"type" : MessageType.StartGame
	};
	dataToSend.data = {
		"id" : gameId
	};
	if (games.hasOwnProperty(gameId)) 
	{
		var game = games[gameId];
		if (game.host == senderId)
		{
			if (game.state == GameState.Loading) 
			{
				if (arePlayersReadyToStart(game))
				{
					game.state = GameState.Playing;
					dataToSend.data.state = StartGameState.Success;
					sendMessageToAll(game, dataToSend);
					log("startGame: Success: Game: ", game);
				}
				else
				{
					dataToSend.data.state = StartGameState.PlayersAreNotReady;
					dataToSend.data.game = game;
					sendMessageToAPlayer(senderId, dataToSend);
					log("startGame: PlayersAreNotReady: Game: ", game);
				}
			}
			else
			{
				dataToSend.data.state = StartGameState.NotLoadingGame;
				dataToSend.data.game = game;
				sendMessageToAPlayer(senderId, dataToSend);
				log("startGame: NotLoadingGame: Game: ", game);
			}
		}
		else
		{
			dataToSend.data.state = StartGameState.SenderIsNotHost;
			sendMessageToAPlayer(senderId, dataToSend);
			log("startGame: SenderIsNotHost: SenderId: ", senderId);
			log("startGame: SenderIsNotHost: Game: ", game);
		}
	}
	else
	{
		dataToSend.data.state = StartGameState.GameNotExist;
		sendMessageToAPlayer(senderId, dataToSend);
		log("startGame: GameNotExist: GameId: ", gameId);
		log("startGame: GameNotExist: Games: ", games);
	}
}; // game_server.startGame

//game_server.onPlayerAnswer = function(obj) {
//	onQuizAnswer(obj);
//}; // game_server.onPlayerAnswer
//
//function onQuizAnswer(obj) {
//	var i = 0;
//	var _id = obj.gameId;
//
//	var round = obj.round;
//	if (games.hasOwnProperty(_id) && (games[_id].currentRound == round)) {
//		numberOfPlayerAnswer[_id] = numberOfPlayerAnswer[_id] + 1;
//		if (games[_id].passedRound[round] != true) // undefined or false
//			games[_id].passedRound[round] = false;
//		try {
//			if (obj.result == 'true')
//				games[_id].scores[obj.player] = games[_id].scores[obj.player] + 3;
//			else
//				games[_id].scores[obj.player] = games[_id].scores[obj.player] - 1;
//			games[_id].scores[obj.player] = games[_id].scores[obj.player]
//					+ obj.bonus;
//			for ( var playerEmail in games[_id].clientPlayers) {
//				if (playerEmail != obj.player) {
//					var dataToSend = {};
//					dataToSend.notice = obj.type;
//					dataToSend.data = obj;
//					sendMessageToAPlayer(playerEmail, dataToSend);
//				}
//			}
//			if (games[_id].passedRound[round] == false
//					&& (obj.result == 'true' || numberOfPlayerAnswer[_id] >= 2)) {
//				clearTimeout(recordIntervals[_id]);
//				games[_id].passedRound[round] = true;
//				games[_id].currentRound = games[_id].currentRound + 1;
//				numberOfPlayerAnswer[_id] = 0;
//				if (games[_id].currentRound < games[_id].round) {
//					sendRequestNextRoundToAll(_id, games[_id]);
//				} else {
//					setTimeout(function() {
//						console.log("currentRound: " + games[_id].currentRound
//								+ " --- Total round: " + games[_id].round);
//						endgame(_id);
//					}, 2 * 1000);
//				}
//			}
//		} catch (err) {
//			console.log("Error when process player answer: "
//					+ JSON.stringify(err));
//		}
//	} else {
//		console
//				.log(" nonnnnnnnnnnnnnnnn games.hasOwnProperty(_id) && (games.currRound === round) ");
//	}
//}
//
//game_server.onPauseGame = function(obj) {
//	var _id = obj.gameId;
//	if (games.hasOwnProperty(_id)) {
//		var dataToSend = {};
//		dataToSend.notice = obj.type;
//		dataToSend.data = obj;
//		for ( var playerEmail in games[_id].clientPlayers) {
//			sendMessageToAPlayer(playerEmail, dataToSend);
//		}
//		if (recordIntervals.hasOwnProperty(_id)) {
//			clearTimeout(recordIntervals[_id]);
//			delete recordIntervals[_id];
//		}
//	}
//
//}; // game_server.onPauseGame
//
//game_server.onResumeGame = function(obj) {
//	var _id = obj.gameId;
//	var time = obj.gameTime;
//	if (games.hasOwnProperty(_id)) {
//		var dataToSend = {};
//		dataToSend.notice = obj.type;
//		dataToSend.data = obj;
//		for ( var playerEmail in games[_id].clientPlayers) {
//			sendMessageToAPlayer(playerEmail, dataToSend);
//		}
//		recordIntervals[_id] = startIntervalTimer(_id, time);
//	}
//
//}; // game_server.onResumeGame

game_server.onPauseResumeGame = function(obj) {
	var senderId = obj.sender;
	var gameId = obj.data.id;
	var pause = obj.data.pause;
	if (games.hasOwnProperty(gameId)) {
		var game = games[gameId];
		if (game.players.hasOwnProperty(senderId) && (game.state == GameState.Playing || game.state == GameState.Pausing))
		{
			var dataToSend = {};
			dataToSend.type = MessageType.PauseResumeGame;
			dataToSend.sender = obj.sender;
			dataToSend.data = obj.data;
			if (game.state == GameState.Pausing)
			{
				if (!pause)
				{
					game.state = GameState.Playing;
					game.pauserId = null;
					sendMessageToAll(game, dataToSend);
				}
			}
			else
			{
				if (pause)
				{
					game.state = GameState.Pausing;
					game.pauserId = senderId;
					sendMessageToAll(game, dataToSend);
				}
			}
			
		}
	}
};

//game_server.onReceiveRqEndGame = function(obj) {
//	var _id = obj.gameId;
//	if (games.hasOwnProperty(_id)) {
//		endgame(_id);
//	}
//}; // game_server.onReceiveRqEndGame

game_server.onReceiveRqEndGame = function(obj) {
	var senderId = obj.sender;
	var gameId = obj.data.id;
	var dataToSend = {
		"type" : MessageType.EndGame
	};
	dataToSend.data = {
		"id" : gameId
	};
	if (games.hasOwnProperty(gameId)) {
		var game = games[gameId];
		if (game.players.hasOwnProperty(senderId))
		{
			if (game.state == GameState.Playing)
			{
				if (game_logic.isGameEnd(game))
				{
					log("onReceiveRqEndGame: End game: ", game);
					game.state = GameState.Ended;
					dataToSend.data.state = EndGameState.Success;
					dataToSend.data.player = senderId;
					dataToSend.data.game = game;
					sendMessageToAll(game, dataToSend);
//					setTimeout(function() {
//						try {
//							for (var playerId in game.players) {
//								deleteCurrentGameOfPlayer(playerId);
//							}
//							delete games[gameId];
//						} catch (err) {
//							log("onReceiveRqEndGame: Error when delete data to endGame: ", err);
//						}
//					}, 3000);
				}
				else
				{
					dataToSend.data.state = EndGameState.GameIsNotEndYet;
					dataToSend.data.game = game;
					sendMessageToAPlayer(senderId, dataToSend);
					log("onReceiveRqEndGame: GameIsNotEndYet: Game: ", game);
				}
			}
			else if (game.state == GameState.Ended)
			{
				dataToSend.data.state = EndGameState.GameHasEnded;
				dataToSend.data.game = game;
				sendMessageToAPlayer(senderId, dataToSend);
				log("onReceiveRqEndGame: GameHasEnded: Game: ", game);
			}
			else
			{
				dataToSend.data.state = EndGameState.NotPlayingGame;
				dataToSend.data.game = game;
				sendMessageToAPlayer(senderId, dataToSend);
				log("onReceiveRqEndGame: NotPlayingGame: Game: ", game);
			}
		}
		else
		{
			dataToSend.data.state = EndGameState.SenderIsNotPlayers;
			sendMessageToAPlayer(senderId, dataToSend);
			log("onReceiveRqEndGame: SenderIsNotPlayers: SenderId: ", senderId);
			log("onReceiveRqEndGame: SenderIsNotPlayers: Game: ", game);
		}
	}
	else
	{
		dataToSend.data.state = EndGameState.GameNotExist;
		sendMessageToAPlayer(senderId, dataToSend);
		log("onReceiveRqEndGame: GameNotExist: GameId: ", gameId);
		log("onReceiveRqEndGame: GameNotExist: Games: ", games);
	}
}; // game_server.onReceiveRqEndGame

function is_empty(obj) {
	// null and undefined are empty
	if (obj == null)
		return true;
	// Assume if it has a length property with a non-zero value
	// that that property is correct.
	if (obj.length && obj.length > 0)
		return false;
	if (obj.length === 0)
		return true;
	for ( var key in obj) {
		if (hasOwnProperty.call(obj, key))
			return false;
	}

	return true;
}

function startGameTimer() {
	var count = 0;
	var gameTimer = setInterval(function() {
		console.log("Tick: " + count++);
	}, 1000);
	return gameTimer;
}

//function startIntervalTimer(_id, timerInterval) {
//	if (games.hasOwnProperty(_id)) {
//		var start_time = new Date();
//		var count = 1;
//		var interval = setTimeout(function() {
//			try {
//				games[_id].currentRound = games[_id].currentRound + 1;
//				if (games[_id].currentRound < games[_id].round) {
//					var end_time = new Date();
//					var dif = end_time.getTime() - start_time.getTime();
//					numberOfPlayerAnswer[_id] = 0;
//					sendRequestNextRoundToAll(_id, games[_id]);
//					count++;
//				} else {
//					clearTimeout(interval);
//					endgame(_id);
//				}
//			} catch (err) {
//			}
//		}, timerInterval * 1000);
//		return interval;
//	}
//}

//function endWhenPlayerQuitGame(_id, notice, data) {
//	clearTimeout(recordIntervals[_id]);
//	if (games.hasOwnProperty(_id)) {
//		console.log("End game! zzzzzzzzzzzzzzzzz: "
//				+ JSON.stringify(games[_id]));
//		var dataToSend = {};
//		dataToSend.notice = notice;
//		data.scores = games[_id].scores;
//		dataToSend.data = data;
//		sendMessageToAll(games[_id], dataToSend);
//		try {
//			delete recordIntervals[_id];
//			delete numberOfPlayerAnswer[_id];
//			console.log(JSON.stringify(games));
//			for ( var playerEmail in games[_id].clientPlayers) {
//				players[playerEmail].status = 1;
//				if (currentGameOfPlayer.hasOwnProperty(playerEmail)) {
//					delete currentGameOfPlayer[playerEmail];
//				}
//			}
//			delete games[_id];
//		} catch (err) {
//			console.log("Error when delete data to endGame: "
//					+ JSON.stringify(err));
//		}
//	}
//}
function processWhenPlayerQuitGame(playerExitId, gameId) {
	if (games.hasOwnProperty(gameId)) {
		var game = games[gameId];
		if (game.players.hasOwnProperty(playerExitId))
		{
			var dataToSend = {
				"type" : MessageType.PlayerExitGame //TYPE_PLAYER_EXIT_GAME
			};
			dataToSend.data = {
				"player" : playerExitId,
				"id" : gameId
			};
			if (game.state == GameState.Waiting) {
				var isHost =  game.host == playerExitId;
				dataToSend.data.isHost = isHost;
				if (!isHost) {
					delete game.players[playerExitId];
					deleteCurrentGameOfPlayer(playerExitId);
					dataToSend.data.game = game;
					sendMessageToAll(game, dataToSend);
				} else {
					for (var playerId in game.players) {
						deleteCurrentGameOfPlayer(playerId);
					}
					sendMessageToAllExceptPlayer(game, dataToSend, playerExitId);
					delete games[gameId];
				}
			}
			else
			{
				game.quitters.push(playerExitId);
				delete game.players[playerExitId];
				dataToSend.data.game = game;
				sendMessageToAll(game, dataToSend);
				deleteCurrentGameOfPlayer(playerExitId);
				var numberPlayer = lengthOfObj(game.players);
				if (numberPlayer == 0)
					delete games[gameId];
			}
		}
	} else {
		console.log("games notHasOwnProperty(gameId)");
	}
}

function setCurrentGameOfPlayer(playerId, gameId) {
	try {
		currentGameOfPlayer[playerId] = gameId;
		players[playerId][PlayerProperty.PlayingState] = PlayerPlayingState.Playing;
	}
	catch (err) {
		console.log("Error in setCurrentGameOfPlayer: playerId : " + playerId + " gameId : " + gameId);
		console.log("Error in setCurrentGameOfPlayer: currentGameOfPlayer : " + JSON.stringify(currentGameOfPlayer));
		console.log("Error in setCurrentGameOfPlayer: players : " + JSON.stringify(players));
	}
}

function deleteCurrentGameOfPlayer(playerId) {
	if (currentGameOfPlayer.hasOwnProperty(playerId)) {
		delete currentGameOfPlayer[playerId];
	}
	players[playerId][PlayerProperty.PlayingState] = PlayerPlayingState.Idle;
}

//function endgame(_id) {
//	clearTimeout(recordIntervals[_id]);
//	// clearInterval(gameTimers[_id]);
//	if (games.hasOwnProperty(_id)) {
//		console.log("End game! zzzzzzzzzzzzzzzzz: "
//				+ JSON.stringify(games[_id]));
//		var dataToSend = {};
//		dataToSend.notice = "endGame";
//		dataToSend.data = {
//			"scores" : games[_id].scores
//		};
//		sendMessageToAll(games[_id], dataToSend);
//		setTimeout(function() {
//			try {
//				delete recordIntervals[_id];
//				// delete gameTimers[_id];
//				delete numberOfPlayerAnswer[_id];
//				console.log(JSON.stringify(games));
//				for ( var playerEmail in games[_id].clientPlayers) {
//					if (currentGameOfPlayer.hasOwnProperty(playerEmail)) {
//						delete currentGameOfPlayer[playerEmail];
//					}
//					if (players[playerEmail].status == 2)
//						players[playerEmail].status = 1;
//				}
//				delete games[_id];
//			} catch (err) {
//				console.log("Error when delete data to endGame: "
//						+ JSON.stringify(err));
//			}
//		}, 3 * 1000);
//	}
//}
//
//function sendRequestNextRoundToAll(_id, game) {
//	console.log("sendRequestNextRoundToAll");
//	if (typeof game != undefined) {
//		var dataToSend = {};
//		dataToSend.notice = "nextRound";
//		dataToSend.data = {
//			"round" : game.currentRound,
//			"scores" : game.scores
//		};
//		sendMessageToAll(game, dataToSend);
//		console.log("game saved: " + JSON.stringify(game));
//		setTimeout(function() {
//			if (recordIntervals.hasOwnProperty(_id)) {
//				delete recordIntervals[_id];
//			}
//			recordIntervals[_id] = startIntervalTimer(_id, intervalTime);
//		}, 2 * 1000);
//	}
//}
//
//function sendMessageToAll(game, msg) {
//	if (typeof game != undefined) {
//		try {
//			for ( var playerEmail in game.clientPlayers) {
//				sendMessageToAPlayer(playerEmail, msg);
//			}
//		} catch (err) {
//			console.log("Error when send msg to all");
//		}
//	}
//}

function sendMessageToAll(game, msg) {
	console.log("sendMessageToAll: game: " + JSON.stringify(game));
	console.log("sendMessageToAll: msg: " + JSON.stringify(msg));
	if (typeof game != undefined) {
		try {
			for (var playerId in game.players) {
				console.log("sendMessageToAll: playerId: " + JSON.stringify(playerId));
				console.log("sendMessageToAll: player: " + JSON.stringify(game.players[playerId]));
				sendMessageToAPlayer(playerId, msg);
			}
		} catch (err) {
			console.log("Error when send msg to all players in game " + game.id + ": " + JSON.stringify(err));
		}
	}
}

function sendMessageToAllExceptPlayer(game, msg, exceptPlayerId) {
	console.log("sendMessageToAllExceptPlayer: game: " + JSON.stringify(game));
	console.log("sendMessageToAllExceptPlayer: msg: " + JSON.stringify(msg));
	console.log("sendMessageToAllExceptPlayer: exceptPlayerId: " + exceptPlayerId);
	if (typeof game != undefined) {
		try {
			for (var playerId in game.players) {
				console.log("sendMessageToAllExceptPlayer: playerId: " + JSON.stringify(playerId));
				console.log("sendMessageToAllExceptPlayer: player: " + JSON.stringify(game.players[playerId]));
				if (playerId != exceptPlayerId)
					sendMessageToAPlayer(playerId, msg);
			}
		} catch (err) {
			console.log("Error when send msg to all players in game " + game.id + " except player " + exceptPlayerId + ": " + JSON.stringify(err));
		}
	}
}

function sendMessageToAPlayer(playerId, msg) {
	try {
		console.log("sendMessageToAPlayer: playerId: " + playerId + " sId: " + clients[playerId]);
		app_server.sendMsgToClient(clients[playerId], msg);
	} catch (err) {
		console.log("Error when send message to player " + playerId + ": " + JSON.stringify(err));
	}
}

function lengthOfObj(obj) {
	var length = 0;
	for ( var k in obj) {
		if (obj.hasOwnProperty(k))
			length++;
	}
	return length;
}

function log(message, object) {
	if (object == null)
		console.log(message);
	else
		console.log(message + JSON.stringify(object));
}
