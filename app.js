//Got the packages (in the form of objects)
var express = require('express');
var app = express();
var serv = require('http').Server(app);

// Load configuration
const config = require('./config.json');

// Initialize the StatsLogger
const StatsLogger = require('./statsLogger');
const statsLogger = new StatsLogger(config);

// Import Board class
const Board = require('./Board');

// Import PlayerManager
const { PlayerManager } = require('./PlayerManager');

//Send the user the 'index.html' file, to let them interact
app.get('/',function(req, res){
	res.sendFile(__dirname + config.paths.mainPage);
});

//If its the mirror, send the mirror file.
app.get('/mirror',function(req, res){
	res.sendFile(__dirname + config.paths.mirrorPage);
});

app.use('/client', express.static(__dirname + config.server.staticPath));

//Start the server on a port
serv.listen(config.server.port);
console.log("Server started on port " + config.server.port);

//Creating the io object (to help us talk with the sockets)
var io = require('socket.io')(serv,{})

//'board' is the current game board instance
var board = new Board(config, statsLogger);

// Initialize PlayerManager
const playerManager = new PlayerManager(io, config, statsLogger, board);

// Update board reference to use playerManager
board.setPlayerManager(playerManager);

var counter = config.game.timing.baseSpeed;
//Every so often, update the board
setInterval(function(){ 
    
    if(!board.gameStarted){
        if(board.timer < 1){
            playerManager.checkForPlayers();
            playerManager.sendToAll('WaitForPlayers', {});
        }
        else{
            board.timer--;
        }
    }
    else{
        if(counter == 0){
            board.updatePiece();
            counter = config.game.timing.baseSpeed - board.gameSpeed;
        }
        else{
            counter--;
        }
    }
}, 1000/config.game.timing.frameRate);
