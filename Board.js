// Board.js - Handles the Tetris game logic
const Piece = require('./Piece');

class Board {
    constructor(config, statsLogger) {
        this.config = config;
        this.statsLogger = statsLogger;
        this.playerManager = null; // Will be set after initialization
        
        // Board state
        this.blocks = new Array(config.game.board.height).fill(0);
        
        // Game state
        this.activePiece = null; // The current active piece 
        this.currPiece = null;   // Current piece shape/color info
        this.nextPiece = Piece.fromShapeAndColor(
            config, 
            config.game.pieces[config.game.startingPiece], 
            config.game.startingPiece
        );
        this.heldPiece = null;   // Held piece 
        this.p2Indicator = 16;
        this.gameSpeed = config.game.startingSpeed;
        this.currentScore = 0;
        this.timer = 0;
        this.readyHold = true;
        this.gameStarted = false;
    }
    
    // Set reference to PlayerManager
    setPlayerManager(playerManager) {
        this.playerManager = playerManager;
    }
    
    //Resets the board
    reset() {
        this.blocks.fill(0);
        this.activePiece = null;
        this.sendToAll('reset', {});
        this.currentScore = 0;
        this.currPiece = null;
        this.heldPiece = null;
        this.gameSpeed = 1;
    }

    //Moves the piece one block down, sets it if it will be set.
    updatePiece() {
        const activeBoardArray = this.activePiece.boardArray;
        
        if(activeBoardArray[0] > 0) {
            this.setPiece();
            this.spawnNextPiece();
            return true;
        }            
        
        const movedPiece = this.activePiece.moveDown();
        
        if(this.checkOverlap(movedPiece.boardArray, this.blocks)) {
            this.setPiece();
            this.spawnNextPiece();
            return true;
        }
        else {
            this.activePiece = movedPiece;
            this.sendToAll('activeUpdate', {dir:'down'});
            return false;
        }
    }
    
    //Moves player2
    moveP2Indicator(dir) {
        if(dir == 'left') {
            if(!this.activePiece.checkBounds(-1)) {
                return;
            }
            this.p2Indicator = this.p2Indicator >> 1;
        }
        else if(dir == 'right') {
            if(!this.activePiece.checkBounds(1)) {
                return;
            }
            this.p2Indicator = this.p2Indicator << 1;
        }
    }
    
    //Moves the piece in the given direction (or rotates it)
    movePiece(dir) {
        if(dir == 'down') {
            while(!this.updatePiece()) {
                // Keep moving down until piece is set
            }
        }
        else if(dir == 'rotateR' || dir == 'rotateL') {
            const rotated = this.activePiece.rotate(dir);
            if (rotated && !this.checkOverlap(rotated.boardArray, this.blocks)) {
                this.sendToAll('activeUpdate', {
                    dir: 'rotate', 
                    color: this.activePiece.color, 
                    active: rotated.boardArray
                });
                this.activePiece = rotated;
            }
        }
        else if(dir == 'left' || dir == 'right') {
            const moved = this.activePiece.move(dir);
            if (moved && !this.checkOverlap(moved.boardArray, this.blocks)) {
                this.sendToAll('activeUpdate', {dir:dir});
                this.activePiece = moved;
            }
        }
    }
    
    //See if there is overlap between the two arrays
    checkOverlap(test, blocks) {
        for(let x = 0; x < test.length; x++) {
            if((test[x] & blocks[x]) > 0) {
                return true;
            }
        }
        return false;
    }
    
    //Sets the active piece onto the board
    setPiece() {
        let count = 0;
        let rowList = [];
        const activeBoardArray = this.activePiece.boardArray;
        
        for(let x = 0; x < activeBoardArray.length; x++) {
            this.blocks[x] = this.blocks[x] + activeBoardArray[x];
            
            if(this.blocks[x] >= this.config.game.board.maxValue) {
                count++;
                rowList.push(x);
            }
            else if (count > 0) {
                this.blocks[x-count] = this.blocks[x];
                this.blocks[x] = 0;
            }
        }
        this.sendToAll('deleteRow', {row:rowList});
        this.updateScore(count);
    }
    
    //Updates the score
    updateScore(count) {
        this.currentScore += count*count*this.config.game.scoring.baseMultiplier;
        while(this.currentScore > this.gameSpeed * this.config.game.scoring.levelThreshold) {
            this.gameSpeed++;
        }
        this.sendToAll('UpdateScore', {score:this.currentScore});
    }
    
    //Sets a new random piece as the active piece
    spawnNextPiece() {
        this.readyHold = true;
        
        // Use the next piece as the current active piece
        this.currPiece = this.nextPiece;
        
        // Create the active piece from the current piece
        this.activePiece = Piece.fromShapeAndColor(
            this.config,
            this.currPiece.shape,
            this.currPiece.color,
            this.config.game.spawnPosition
        );
        
        // Get a new random piece as the next piece
        this.nextPiece = Piece.getRandomPiece(this.config);
        
        // Check for game over condition
        if(this.checkOverlap(this.activePiece.boardArray, this.blocks)) {
            //GAMEOVER
            this.timer = this.config.game.gameOver.timer;
            this.gameStarted = false;
            
            // Log game stats
            this.statsLogger.recordGameCompleted(this.currentScore);
            this.sendToAll('GameOver', {score:this.currentScore});
            
            // Use PlayerManager to send score entry prompt to current player
            if(this.playerManager) {
                this.playerManager.sendToCurrentPlayer('enterScore', {score: this.currentScore});
            }
        }
        
        this.sendToAll('setActive', {
            color: this.activePiece.color, 
            active: this.activePiece.boardArray, 
            next: this.nextPiece.shape, 
            nextC: this.nextPiece.color
        });
    }
    
    //Puts the active piece into hold
    holdActive() {
        if(!this.readyHold) {
            return;
        }
        this.readyHold = false;

        if(this.heldPiece == null) {
            this.heldPiece = this.currPiece;
            // Clear active piece visually
            const emptyBoardArray = new Array(this.config.game.board.height).fill(0);
            
            this.sendToAll('activeUpdate', {
                dir: 'hold', 
                color: this.activePiece.color, 
                active: emptyBoardArray, 
                held: this.heldPiece.shape, 
                heldC: this.heldPiece.color
            });
            
            this.activePiece = null;
            this.spawnNextPiece();
            return;
        }
        
        // Swap current and held pieces
        const temp = this.currPiece;
        this.currPiece = this.heldPiece;
        this.heldPiece = temp;
        
        // Create a new active piece from the swapped current piece
        this.activePiece = Piece.fromShapeAndColor(
            this.config,
            this.currPiece.shape,
            this.currPiece.color,
            this.config.game.spawnPosition
        );
        
        this.sendToAll('activeUpdate', {
            dir: 'hold', 
            color: this.activePiece.color, 
            active: this.activePiece.boardArray, 
            held: this.heldPiece.shape, 
            heldC: this.heldPiece.color
        });
    }
    
    //Places a target into the board at the set position.
    swapPieceWithActive(target) {
        const activeBoardArray = this.activePiece.boardArray;
        let count = 0;
        
        for(let i = 0; i < activeBoardArray.length; i++) {
            if(activeBoardArray[i] > 0) {
                let val = activeBoardArray[i];
                while(val > 0) {
                    if((val & 1) > 0) {
                        const newPiece = Piece.fromShapeAndColor(
                            this.config,
                            target,
                            this.activePiece.color,
                            {x: count, y: i}
                        );
                        this.activePiece = newPiece;
                    }
                    val = val >> 1;
                    count++;
                }
            }
        }
    }

    //For the board to send data to all ends connected
    sendToAll(name, data) {
        if(this.playerManager) {
            this.playerManager.sendToAll(name, data);
        }
    }
}

module.exports = Board;
