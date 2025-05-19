// Mirror controller script

let ACTIVEGAME = false;

// Get the socket and DOM elements
const socket = io();
const ctx = {};
ctx[0] = document.getElementById("ctx").getContext("2d");
ctx[1] = document.getElementById("ctx1").getContext("2d");
ctx[2] = document.getElementById("ctx2").getContext("2d");
ctx[3] = document.getElementById("ctx3").getContext("2d");

const canvas = {};
canvas[0] = document.getElementById("ctx");
canvas[1] = document.getElementById("ctx1");
canvas[2] = document.getElementById("ctx2");
canvas[3] = document.getElementById("ctx3");

// Prepare all images and save them in a list
const Img = {};
for(let i = 0; i < config.blocks.images.length; i++) {
    Img[i] = new Image();
    Img[i].src = config.blocks.images[i];
}

let score = 0;
let gameOver = false;

// Socket event handlers
socket.on('UpdateScore', function(data) {
    score = data.score;
    Update();
});

socket.on('MoveIndicator', function(data) {
    if (data.dir == 'left') {
        Block.indicator.x--;
    } else if(data.dir == 'right') {
        Block.indicator.x++;
    }
});

// Update function that redraws everything with new data
const Update = function() {
    ACTIVEGAME = true;
    if(gameOver) {
        return;
    }
    
    // Clear canvases
    ctx[0].fillStyle = config.canvas.baseColor;
    ctx[0].fillRect(0, 0, config.canvas.width, config.canvas.height);
    ctx[1].fillStyle = config.canvas.baseColor;
    ctx[1].fillRect(0, 0, config.canvas.width, config.canvas.height);
    ctx[2].fillStyle = config.canvas.baseColor;
    ctx[2].fillRect(0, 0, config.canvas.width, config.canvas.height);
    
    // Draw blocks
    for(var i in Block.list) {
        Block.list[i].draw();
    }
    
    // Draw pieces
    Piece.active.draw();
    Piece.next.draw(
        x=config.game.nextPieceDraw.x,
        y=config.game.nextPieceDraw.y,
        cont=1
    );
    
    // Draw score
    const scoreConfig = config.context.score;
    ctx[2].lineWidth = scoreConfig.lineWidth;
    ctx[2].strokeStyle = scoreConfig.strokeStyle;
    ctx[2].font = scoreConfig.font;
    ctx[2].fillStyle = scoreConfig.fillStyle;
    ctx[2].fillText("Score", scoreConfig.textWidth, scoreConfig.textHeight);
    ctx[2].strokeRect(0, 0, scoreConfig.containerWidth, scoreConfig.containerHeight);      
    ctx[2].fillText(
        score.toString(), 
        scoreConfig.textRight - (score.toString().length*scoreConfig.charWidth), 
        scoreConfig.textTop
    );
    
    // Draw "Next" text
    const nextConfig = config.context.next;
    ctx[1].lineWidth = nextConfig.lineWidth;
    ctx[1].strokeStyle = nextConfig.strokeStyle;
    ctx[1].font = nextConfig.font;
    ctx[1].fillStyle = nextConfig.fillStyle;
    ctx[1].fillText("Next", nextConfig.textLeft, nextConfig.textTop);
    
    // Draw "Hold" text
    const holdConfig = config.context.hold;
    ctx[3].lineWidth = holdConfig.lineWidth;
    ctx[3].strokeStyle = holdConfig.strokeStyle;
    ctx[3].font = holdConfig.font;
    ctx[3].fillStyle = holdConfig.fillStyle;
    ctx[3].fillText("Hold", holdConfig.textLeft, holdConfig.textTop);
}

// Game state events
const gameStartDiv = document.getElementById('pregameDiv');

socket.on('beginMirror', function(data) {
    ACTIVEGAME = true;
    gameStartDiv.style.display = 'none';
    gameOver = false;
});

socket.on('GameOver', function(data) {
    ctx[0].fillStyle = config.context.canvas.fillStyle;
    ctx[0].font = config.context.canvas.font;
    ctx[0].fillText(
        config.context.canvas.gameOverText, 
        config.context.canvas.gameOverTextX, 
        config.canvas.height/2
    );
    gameOver = true;
    score = 0;
    ctx[3].fillStyle = config.context.hold.clearStyle;
    ctx[3].fillRect(0, 0, config.canvas.width, config.canvas.height);
});

socket.on('WaitForPlayers', function(data) {
    if(gameOver) {
        gameStartDiv.style.display = 'block';
        ctx[0].fillStyle = 'black';
        ctx[0].fillRect(0, 0, config.canvas.width, config.canvas.height);
    }
});


// Block manipulation functions for the mirror controller

// Updates the active piece position
socket.on('activeUpdate', function(data) {
    if(data.dir == 'rotate' || data.dir == 'hold') {
        const color = data.color;
        let newBlockList = {};
        let val, count;
        
        for(let i = 0; i < data.active.length; i++) {
            count = 0;
            val = data.active[i];
            
            while(val > 0) {
                if((val & 1) != 0) {
                    const newBlock = new Block(color, {x:count, y:i});
                    newBlockList[newBlock.id] = newBlock;
                }
                val = val >> 1;
                count++;
            }
        }

        if(data.dir == 'hold') {
            ctx[3].fillStyle = config.context.hold.clearStyle;
            ctx[3].fillRect(0, 0, config.context.hold.boxWidth, config.context.hold.boxHeight);
            Piece.held = new Piece({
                color: data.heldC, 
                blockList: GetBlockList(data.held, data.heldC, true)
            });
            Piece.held.draw(
                x=config.game.nextPieceDraw.x,
                y=config.game.nextPieceDraw.y,
                cont=3
            );
        }
        
        Piece.active = new Piece({color:color, blockList:newBlockList});
    } else {
        Piece.active.move(data.dir);
    }
    
    Update();
});

socket.on('reset', function(data) {
    Piece.active.blocks = {};
    Block.list = [];
});

// Deletes a saved row of blocks
socket.on('deleteRow', function(data) {
    for(let i in Block.list) {
        const block = Block.list[i];
        
        if(data.row.includes(block.y)) {
            delete Block.list[i];
        } else {
            const yVal = block.y;
            for(let j = 0; j < data.row.length; j++) {
                if(yVal > data.row[j]) {
                    block.y--;
                }
            }
        }
    }
    
    for(let i in Piece.active.blocks) {
        const block = Piece.active.blocks[i];
        
        if(data.row.includes(block.y)) {
            delete Piece.active.blocks[i];
        } else {
            const yVal = block.y;
            for(let j = 0; j < data.row.length; j++) {
                if(yVal > data.row[j]) {
                    block.y--;
                }
            }
        }
    }
    
    Update();
});

// Take the active block and makes it a normal one.
socket.on('setActive', function(data) {
    if(Piece.active) {
        for(let i in Piece.active.blocks) {
            const block = Piece.active.blocks[i];
            Block.list[block.id] = block;
        }
    }
    
    let newBlockList = {};
    let val, count;
    
    for(let i = 0; i < data.active.length; i++) {
        count = 0;
        val = data.active[i];
            
        while(val > 0) {
            if(val & 1 > 0) {
               const newBlock = new Block(data.color, {x:count, y:i});
               newBlockList[newBlock.id] = newBlock;
            }
            val = val >> 1;
            count++;
        }
    }
    
    const nextList = GetBlockList(data.next, data.nextC, offset=true);
    
    Piece.active = new Piece({color: data.color, blockList:newBlockList});
    Piece.next = new Piece({color: data.nextC, blockList:nextList});
    
    Update();
});

// Utility function to get a block list from data
const GetBlockList = function(data, color, offset=false) {
    let nextList = {};
    
    let firstX = config.game.blocksPerRow;
    let firstY = config.game.blockStartingY;
    
    for(let i = 0; i < data.length; i++) {
        let count = 0;
        let val = data[i];
            
        while(val > 0) {
            if(val & 1 > 0) {
               const newBlock = new Block(color, {x:count, y:i});
               nextList[newBlock.id] = newBlock;
               
               //Code for next/hold blocks
               if(offset) {
                    if(count < firstX) {
                        firstX = count;
                    }
                    if(i < firstY) {
                        firstY = i;
                    }
               }
            }
            val = val >> 1;
            count++;
        }
    }

    if(offset) {
        for(let i in nextList) {
            const block = nextList[i];
            block.x = block.x - firstX;
            block.y = block.y - firstY;
        }
    }
    
    return nextList;
}

// Auto-reload if game becomes inactive
setInterval(function() { 
    if(ACTIVEGAME == false) {
       location.reload();
    } else {
        ACTIVEGAME = false;
    }
}, config.game.reloadInterval);

