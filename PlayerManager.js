// PlayerManager.js - Handles player connections, socket management, and player queue

var ScoreManager = require('./ScoreManager.js')

class PlayerManager {
    constructor(io, config, statsLogger, board) {
        this.io = io;
        this.config = config;
        this.statsLogger = statsLogger;
        this.board = board;
        this.scoreManager = new ScoreManager(config); // Use the new ScoreManager
        this.SOCKET_LIST = {};
        this.playerQueue = [];
        this.player2List = {};
        this.currentPlayer = 0;
        
        this.setupSocketConnections();
    }
    
    // Sets up socket connection handling
    setupSocketConnections() {
        this.io.sockets.on('connection', (socket) => {
            this.handleNewConnection(socket);
        });
    }
    
    // Handles new socket connections
    handleNewConnection(socket) {
        // Generate unique ID and add to socket list
        socket.id = Math.random();
        this.SOCKET_LIST[socket.id] = socket;
        
        // Log new user
        this.statsLogger.incrementUserCount();
        
        // Setup player-specific event handlers
        this.setupPlayerEvents(socket);
        
        // Handle disconnection
        socket.on('disconnect', () => {
            this.handleDisconnection(socket);
        });
    }
    
    // Setup event handlers for player-specific actions
    setupPlayerEvents(socket) {
        // Handle player input
        socket.on('inputPack', (data) => {
            if (this.board.gameStarted && socket.id === this.currentPlayer) {
                this.board.movePiece(data.target);
            }
        });
        
        // Handle hold piece action
        socket.on('hold', (data) => {
            if (this.board.gameStarted && socket.id === this.currentPlayer) {
                this.board.holdActive();
            }
        });
        
        // Handle when player is ready to play
        socket.on('ready', (data) => {
            this.enqueuePlayer(socket.id);
        });
        
        // Handle manual game start (if needed)
        socket.on('start', (data) => {
            this.startGame(socket.id);
        });

        // Handle score events using ScoreManager
        socket.on('score', (data) => {
            const newScores = this.scoreManager.setScore(data);
            socket.emit('returnScores', newScores);
        });

        socket.on('getScores', (data) => {
            const scores = this.scoreManager.getScores();
            socket.emit('returnScores', {scores: scores});
        });
    }
    
    // Handle socket disconnection
    handleDisconnection(socket) {
        delete this.SOCKET_LIST[socket.id];
        
        // Remove from player queue if present
        this.playerQueue = this.playerQueue.filter(playerId => playerId !== socket.id);
        
        // If current player disconnects, end the game
        if (socket.id === this.currentPlayer && this.board.gameStarted) {
            this.board.gameStarted = false;
            this.board.timer = this.config.game.gameOver.timer;
            this.currentPlayer = 0;
        }
    }
    
    // Add player to the game queue
    enqueuePlayer(playerId) {
        if (!this.playerQueue.includes(playerId)) {
            this.playerQueue.push(playerId);
        }
    }
    
    // Check for players in queue and start game if available
    checkForPlayers() {
        if (this.playerQueue.length > 0) {
            this.currentPlayer = this.playerQueue[0];
            this.playerQueue = this.playerQueue.slice(1);
            
            // Verify socket still exists
            if (!this.SOCKET_LIST[this.currentPlayer]) {
                // Try next player if current one disconnected
                this.checkForPlayers();
                return;
            }
            
            this.board.gameStarted = true;
            this.board.reset();
            this.board.spawnNextPiece();
            
            // Notify the current player and all mirrors
            if (this.SOCKET_LIST[this.currentPlayer]) {
                this.SOCKET_LIST[this.currentPlayer].emit('startTheGame', {});
            }
            this.sendToAll('beginMirror', {});
        }
    }
    
    // Start a game manually (alternative method)
    startGame(playerId) {
        this.currentPlayer = playerId;
        this.board.gameStarted = true;
        this.board.reset();
        this.board.spawnNextPiece();
    }
    
    // Send data to all connected sockets
    sendToAll(eventName, data) {
        for (let socketId in this.SOCKET_LIST) {
            const socket = this.SOCKET_LIST[socketId];
            if (socket) {
                socket.emit(eventName, data);
            }
        }
    }
    
    // Send data to current player only
    sendToCurrentPlayer(eventName, data) {
        if (this.SOCKET_LIST[this.currentPlayer]) {
            this.SOCKET_LIST[this.currentPlayer].emit(eventName, data);
        }
    }
    
    // Get current player socket
    getCurrentPlayerSocket() {
        return this.SOCKET_LIST[this.currentPlayer];
    }
    
    // Get socket by ID
    getSocket(socketId) {
        return this.SOCKET_LIST[socketId];
    }
    
    // Get number of connected players
    getPlayerCount() {
        return Object.keys(this.SOCKET_LIST).length;
    }
    
    // Get queue length
    getQueueLength() {
        return this.playerQueue.length;
    }
    
    // Get current player ID
    getCurrentPlayerId() {
        return this.currentPlayer;
    }
}

// Player class (currently not used but kept for potential future use)
const Player = function(params) {
    const self = {
        id: params.id,
        active: false,
        postActive: false,
        numGames: 0,
        waiting: false,
    };
    
    return self;
};

Player.list = {};

module.exports = { PlayerManager, Player };
