
class Piece {
    constructor(config, shape = null, color = null, boardArray = null) {
        this.config = config;
        this.shape = shape;
        this.color = color;
        this.boardArray = boardArray || new Array(config.game.board.height).fill(0);
    }

    // Create a new Piece from shape and color
    static fromShapeAndColor(config, shape, color, position = null) {
        const piece = new Piece(config, shape, color);
        if (position) {
            piece.updateBoardArray(position);
        }
        return piece;
    }

    // Convert piece shape to board array and store it
    updateBoardArray(position) {
        if (!this.shape) {
            this.boardArray = new Array(this.config.game.board.height).fill(0);
            return;
        }
        
        this.boardArray = new Array(this.config.game.board.height).fill(0);

        for(let i = 0; i < this.shape.length; i++) {
            if((this.shape[i] << position.x) >= this.config.game.board.bitShift) {
                return this.updateBoardArray({ x: position.x - 1, y: position.y });
            }
            this.boardArray[i + position.y] = (this.shape[i] << position.x);
        }
    }

    // Find center point of piece (for rotation)
    findCenter() {
        let max = 0;
        let row = 0;

        for(let i = 0; i < this.boardArray.length; i++) {
            if(this.boardArray[i] > max) {
                max = this.boardArray[i];
                row = i;
            }
        }

        let len = 0;
        let frstPcX = 0;
        let found = false;

        while(max > 0) {
            if((max & 1) != 1) {
                frstPcX = frstPcX + 1;
            } else {
                found = true;
                len++;
            }
            max = max >> 1;
        }

        let xVal = Math.floor(frstPcX + (len/2));
        return { x: xVal, y: row };
    }

    // Rotate piece (right or left)
    rotate(dir, up=0, bound=0) {
        let frstPcX = 0;
        let frstPcY = 0;
        
        let newActive = new Array(this.config.game.board.height).fill(0);
        let center = this.findCenter();
                    
        frstPcX = center.x;
        frstPcY = center.y;

        for(let i = 0; i < this.boardArray.length; i++) {
            let val = this.boardArray[i];
            let count = 0;
            
            while(val > 0) {
                if(val & 1 > 0) {
                    let amount;
                    let index;

                    if(dir == 'rotateR') {
                        amount = (1 << frstPcX - i + frstPcY + bound);
                        index = (frstPcY + count - frstPcX + up);
                    } else {
                        amount = (1 << frstPcX + i - frstPcY + bound);
                        index = (frstPcY - count + frstPcX + up);
                    }

                    if(index < 0) {
                        return this.rotate(dir, up + 1, bound);
                    }

                    if(amount < 0) {
                        return this.rotate(dir, up, bound + 1);
                    } else if(amount >= this.config.game.board.bitShift) {
                        return this.rotate(dir, up, bound - 1);
                    }
                    if(index > this.config.game.board.height) {
                        return null;
                    }
                    newActive[index] += amount;
                }
                val = val >> 1;
                count++;
            }
        }
        
        // Create and return a new rotated Piece
        const rotatedPiece = new Piece(this.config, this.shape, this.color, newActive);
        return rotatedPiece;
    }

    // Check if piece would be out of bounds when moved
    checkBounds(shift) {
        for(let i = 0; i < this.boardArray.length; i++) {
            if(shift > 0) {
                if((this.boardArray[i] << shift) >= this.config.game.board.bitShift) {
                    return false;
                }
            } else {
                if((this.boardArray[i] % (1 << (-shift))) > 0) {
                    return false;
                }
            }
        }
        return true;
    }

    // Move the piece left or right
    move(dir) {
        let newBoardArray = new Array(this.config.game.board.height).fill(0);
        
        if(dir == 'left') {
            if(!this.checkBounds(-1)) {
                return null;
            }
            for(let x = 0; x < this.boardArray.length; x++) {
                newBoardArray[x] = (this.boardArray[x] >> 1);
            }
        }
        else if(dir == 'right') {
            if(!this.checkBounds(1)) {
                return null;
            }
            for(let x = 0; x < this.boardArray.length; x++) {
                newBoardArray[x] = (this.boardArray[x] << 1);
            }
        }
        
        // Create and return a new moved Piece
        return new Piece(this.config, this.shape, this.color, newBoardArray);
    }

    // Move the piece down
    moveDown() {
        let newBoardArray = this.boardArray.slice(1);
        newBoardArray.push(0);
        
        // Create and return a new moved Piece
        return new Piece(this.config, this.shape, this.color, newBoardArray);
    }

    // Get a random piece from the config
    static getRandomPiece(config) {
        const rand = Math.floor(Math.random() * config.game.pieces.length);
        return new Piece(
            config,
            config.game.pieces[rand],
            rand
        );
    }
}

module.exports = Piece;
