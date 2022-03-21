//Got the packages (in the form of objects)
var express = require('express');
var app = express();
var serv = require('http').Server(app);
var fs = require('fs');

//Send the user the 'index.html' file, to let them interact
app.get('/',function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});

//If its the mirror, send the mirror file.
app.get('/mirror',function(req, res){
	res.sendFile(__dirname + '/client/mirrorIndex.html');
});

app.use('/client', express.static(__dirname + '/client'));

const scores = require('./scores.json');


//Start the server on a port
serv.listen(8012);
console.log("Server started.");

//A list to track all of the sockets
var SOCKET_LIST = {};

//Creating the io object (to help us talk with the sockets)
var io = require('socket.io')(serv,{});


//Setting up what to do when someone connects
io.sockets.on('connection', function(socket){
    
    //Give it an ID and add it to the list
	console.log('socket connection');
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
    
    //create a new player for them (Not currently doing this, just using socket id)
    /*
    var player = Player({id:socket.id});
    
    Player.list[socket.id] = player;
    */
    
    //Determine what to do when it disconnects
    socket.on('disconnect', function(){
        
		delete SOCKET_LIST[socket.id];
	});
    
	Board.onConnect(socket);
});

//NOT CURRENTLY USED!
//Because only one match happens at a time, the socket can contain all of the player data.
var Player = function(params){
    var self = {
        id: params.id,
        active: false,
        postActive: false,
        numGames: true,
        waiting: false,
    }
    
    return self;
}

Player.list = {};

var BOARD_HEIGHT = 25;

//The Board object, handles the game logic
var Board = function(){
    
    var self = {
        blocks: (new Array(BOARD_HEIGHT)),
        activePiece: (new Array(BOARD_HEIGHT)),
        currPiece: null,
        nextPiece: [15],
        heldPiece: null,
        p2Indicator: 16,
        activeColor: 4,
        nextColor: 4,
        heldColor:null,
        gameSpeed: 1,
        playerQueue: [],
        player2List: {},
        currentPlayer: 0,
        currentScore:0,
        timer: 0,
        readyHold: true,
    }
    
    //Resets the board
    self.reset = function(){
        self.blocks.fill(0);
        self.activePiece.fill(0);
        Board.sendToAll('reset', {});
        self.currentScore = 0;
        currPiece = null;
        heldPiece = null;
    }

    
    //Moves the peice one block down, sets it if it will be set.
    self.updatePiece = function(){
        
        if(self.activePiece[0] > 0){
            self.setPiece();
            self.spawnNextPiece();
            return true;
        }            
        testPiece = self.activePiece.slice(1);
        testPiece.push(0)

        if(self.checkOverlap(testPiece, self.blocks)){
            
            self.setPiece();
            self.spawnNextPiece();
            return true;
        }
        else{
            self.activePiece = testPiece;
            Board.sendToAll('activeUpdate', {dir:'down'});
            return false;
        }
        
        
    }
    //Moves player2
    self.moveP2Indicator = function(dir){
        if(dir == 'left'){
             if(!self.checkBounds(self.activePiece, -1)){
                    return;
             }
             
             self.p2Indicator = self.p2Indicator >> 1;
             //Socket emit it
          
        }
        else if(dir == 'right'){
             if(!self.checkBounds(self.activePiece, 1)){
                    return;
             }
             self.p2Indicator = self.p2Indicator << 1;
             //Socket emit
          
        }
    }
    
    //Moves the piece in the given direction (or rotates it)
    self.movePiece = function(dir){
        testPiece = new Array(BOARD_HEIGHT).fill(0);
        testPiece.fill(0);

        if(dir == 'down'){
            while(!self.updatePiece()){
            }
        }
        else if(dir == 'rotateR' || dir == 'rotateL'){
            self.rotatePiece(dir);
        }
        else{
            if(dir == 'left'){
                
                if(!self.checkBounds(self.activePiece, -1)){
                    return;
                }
                
                for(let x = 0; x < self.activePiece.length; x++){
                    testPiece[x] = ((self.activePiece[x]) >> 1);

                }
            }    
            else if(dir == 'right'){
                
                if(!self.checkBounds(self.activePiece, 1)){
                    return;
                }
                
                for(let x = 0; x < self.activePiece.length; x++){
                    testPiece[x] = ((self.activePiece[x]) << 1);
                    
                }
            }
                
            if(!self.checkOverlap(testPiece, self.blocks)){
                Board.sendToAll('activeUpdate', {dir:dir});
                self.activePiece = testPiece;
            }
        }


    }
    
    //See if there is overlap between the two arrays (if any bits are the same)
    self.checkOverlap = function(test, blocks){
        
        for(let x  = 0; x < self.activePiece.length; x++){
                
            if((test[x] & blocks[x]) > 0){
                return true;
            }
        }
        
        return false;
        
    }
    
    //See if a peice would be out of bounds when moved(L/R)
    //int array, block: The peice to check
    //int, Shift: The amount of spaces to the RIGHT to check (make negative for left)
    self.checkBounds = function(block, shift){
        
        for(let i = 0; i < block.length; i++){
            
            if(shift > 0){
                if((block[i] << shift ) >= 4096){
                    return false;
                }
            }
            else{
                if((block[i] % (1 << (-shift))) > 0){
                    return false;
                }
            }
        }
        return true;
    }
    
    
    
    //Sets THE active peice onto the board (by adding its values to the array)
    //@Todo Make it so you can place a given peice, not just the active one.
    self.setPiece = function(){
        
        count = 0;
        rowList = [];
        for(let x = 0; x < self.activePiece.length; x++){
            self.blocks[x] = self.blocks[x] + self.activePiece[x];
            
            if(self.blocks[x] >= 4095){
                count++;
                rowList.push(x);
                
            }
            else if (count > 0){
                
                self.blocks[x-count] = self.blocks[x];
                self.blocks[x] = 0;
            }
                
        }
        Board.sendToAll('deleteRow', {row:rowList});
        self.updateScore(count);
    }
    //Updates the score;
    self.updateScore = function(count){
        self.currentScore += count*count*1000;
        while(self.currentScore > self.gameSpeed * self.gameSpeed * 1000){
            self.gameSpeed++;
        }
        Board.sendToAll('UpdateScore', {score:self.currentScore});
            
    }
    
    //Rotates the peice (only in one direction now, must add other direction).
    self.rotatePiece = function(dir, up=0, bound=0){
        var frstPcX = 0;
        var frstPcY = 0;
        
        found = false;
        newActive = (new Array(BOARD_HEIGHT)).fill(0);
        newActive.fill(0);
        center = self.findActiveCenter();
                    
        frstPcX = center.x;
        frstPcY = center.y;
        amount = 0;
        index = 0;
        for(let i = 0; i < self.activePiece.length; i++){
            val = self.activePiece[i];
            count = 0;
            
            while(val > 0){

                if(val & 1 > 0){

                    if(dir == 'rotateR'){
                        amount = (1 << frstPcX - i + frstPcY + bound);
                        index = (frstPcY + count - frstPcX + up);
                    }
                    else{
                        amount = (1 << frstPcX + i - frstPcY + bound);
                        index = (frstPcY - count + frstPcX + up);
                        
                    }
                    if(index < 0){
                        self.rotatePiece(dir, up + 1, bound);
                        return;
                    }

                    if(amount < 0){
                        self.rotatePiece(dir, up, bound + 1);
                        return;
                    }
                    else if(amount >= 4096){
                        self.rotatePiece(dir, up, bound - 1);
                        return;
                    }
                    
                    newActive[index] += amount;

                }
                val = val >> 1;
                count++;
            }
            
        }
        
        if(!self.checkOverlap(newActive, self.blocks)){
            Board.sendToAll('activeUpdate', {dir:'rotate', color:self.activeColor, active:newActive});
            self.activePiece = newActive;
        }
        else{
            //TODO rotate it otherwise.
        }
    }
    
    //changes the activePeice @TODO REMOVE
    self.changeActive = function(blockNum){
            
            for(let x = 0; x < self.activePeice.length; x++){
                if(self.active.Peice[x] > 9){
                    yPos = x;
                }
            }
            
            if(blockNum = 1){
                self.activePeice = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,16,16,16,16];
            }

        
    }
    
    //Finds the center of the active peice (useful for rotation, also is kinda broken)
    self.findActiveCenter = function(){
        max = 0;
        row = 0;
        for(let i = 0; i < self.activePiece.length; i++){
            if(self.activePiece[i] > max){
                max = self.activePiece[i];
                row = i;
            }
        }
        len = 0;
        frstPcX = 0;
        found = false;

        while(max > 0){
            if((max & 1) != 1){

                frstPcX = frstPcX + 1;

            }
            else{

                found = true;
                len++;
            }
            max = max >> 1;
            
        }
        xVal = Math.floor(frstPcX+(len/2));
        return {x:xVal, y:row};
                
    }
    //Sets a new random peice as the active piece
    self.spawnNextPiece = function(){
        
        self.readyHold = true;
        
        rand = Math.floor(Math.random() * 7);
        console.log("SPAWNING NEXT");
        console.log("NEXT PEICE IS:");
        console.log(self.nextPiece);
        self.currPiece = self.nextPiece;
        self.activePiece = Board.peiceTo(self.nextPiece, {x:5, y:20}, (new Array(BOARD_HEIGHT)).fill(0));
        self.activeColor = self.nextColor;
        self.nextPiece = Board.getRandPeice(rand);
        self.nextColor = rand;
        console.log("NOW ITS:")
        console.log(self.nextPiece);
        
        if(self.checkOverlap(self.activePiece, self.blocks)){
			//GAMEOVER
			self.timer = 100;
            self.gameStarted = false;
			Board.sendToAll('GameOver', {score:self.currentScore});
            SOCKET_LIST[self.currentPlayer].emit('enterScore', {score:self.currentScore});
            
        }
        
        Board.sendToAll('setActive', {color:self.activeColor, active:self.activePiece, next:self.nextPiece, nextC:self.nextColor});
        
    }
    //Puts the active piece into hold
    self.holdActive = function(){

        console.log(self.readyHold);
        if(!self.readyHold){
            return;
        }
        self.readyHold = false;

        if(self.heldPiece == null){
            self.heldPiece = self.currPiece;
            self.heldColor = self.activeColor;
            self.activePiece = [];
            Board.sendToAll('activeUpdate', {dir:'hold', color:self.activeColor, active:[], held:self.heldPiece, heldC: self.heldColor});
            self.spawnNextPiece();
            return;
        }
        temp = self.currPiece;
        self.currPiece = self.heldPiece;
        self.heldPiece = temp;
        temp = self.activeColor; 
        self.activeColor = self.heldColor;
        self.heldColor = temp;
        self.activePiece = Board.peiceTo(self.currPiece, {x:5, y:20}, (new Array(BOARD_HEIGHT)).fill(0));
        Board.sendToAll('activeUpdate', {dir:'hold', color:self.activeColor, active:self.activePiece, held:self.heldPiece, heldC: self.heldColor});
    }
    
    //Places a target into the board at the set position.
    self.swapPeiceWithActive = function(target){
           
        count = 0;
        for(let i = 0; i < self.active.length; i++){
            if(self.active.length[i] > 0){
                val = self.active.length[i];
                while(val > 0){
                    if((val & 1) > 0){
                        //Setting the active to a new peice.
                        self.active = Board.peiceTo(target, {x:count, y:i}, new Array(BOARD_HEIGHT));
                    }
                    val = val >> 1;
                    count++;
                }
            }
        }
    }
    
    
    self.enqueue = function(player){

        self.playerQueue.push(player);
        
    }

    self.checkForPlayers = function(){
        if(self.playerQueue.length > 0){
            self.currentPlayer = self.playerQueue[0];
            self.playerQueue = self.playerQueue.slice(1);
            Board.gb.gameStarted = true;
            Board.gb.reset();
            
            Board.gb.spawnNextPiece();
            SOCKET_LIST[self.currentPlayer].emit('startTheGame', {});
            Board.sendToAll('beginMirror', {});
        }
        else{
            //Wait a minute
        }
    }

    return self;
}


//Adds a given peice to the toArray at given 'pos' (with x and y) and returns it.
//This does NOT currently mutate the original
Board.peiceTo = function(peice, pos, toArray){

    newArray = Array.from(toArray);
    for(let i = 0; i < peice.length; i++){
        
        if((peice[i] << pos.x) >= 4096){
            return Board.peiceTo(peice, {x:pos.x-1, y:pos.y}, toArray);
        }
        
        newArray[i + pos.y] = (peice[i] << pos.x);
        
    }

    return newArray;
}


Board.getRandPeice = function(rand){
    piece = [];

    console.log(rand);
    if(rand == 6){
        piece = [7,4];
    }
    else if(rand == 5){
        piece = [6,3];
    }
    else if(rand == 4){
        piece = [15];
    }
    else if(rand == 3){
        piece = [7,1];
    }
    else if(rand == 2){
        piece = [7,2];
    }
    else if(rand == 1){
        piece = [3,3];
    }
    else{
        piece = [4,7];
    }
    
    return piece;
        
}

//This is for player input
//@TODO add other info on connect.
Board.onConnect = function(socket){
    
    socket.on('inputPack', function(data){
       if(Board.gb.gameStarted){
            Board.gb.movePiece(data.target);
       }
    });
    
    socket.on('hold', function(data){
        if(Board.gb.gameStarted){
            Board.gb.holdActive();
        }
    });
    
    socket.on('ready', function(data){
        
        Board.gb.enqueue(socket.id);
        
    });
    
    socket.on('start', function(data){
        Board.gb.gameStarted = true;
        Board.gb.reset();
        Board.gb.spawnNextPiece();
    });
    
    socket.on('score', function(data){
        console.log('RECEIVING!');
        socket.emit('returnScores', setScore(data));
    });
    
    socket.on('getScores', function(data){
        socket.emit('returnScores', {scores:scores.board});
    })
}
//For the board to send data to all ends connected, usefull for sending out updates.
Board.sendToAll = function(name, data){
    
    for(var i in SOCKET_LIST){
        var socket = SOCKET_LIST[i];
        socket.emit(name, data); 
    }
}

//'gb' is the 'gameBoard' its the board of the currently active board.
Board.gb = Board();

var setScore = function(score){
    totalScores = scores;
    nextScore = score;
    nextScore.name= nextScore.name.slice(0,3);
    temp = {};


    
    for(let i = 0; i < totalScores.length; i++){
        if(totalScores[i].score < parseInt(nextScore.score)){
            temp = totalScores[i];
         
            totalScores[i] = nextScore;
            nextScore = temp;
        }
    }
    json = JSON.stringify(totalScores);
    fs.writeFile('scores.json', json, 'utf8', function(err) {
    if (err) throw err;
    console.log('complete');
    });
    return totalScores;
}


var counter = 50;
//Every so often, update the board
setInterval(function(){ 
    
    if(!Board.gb.gameStarted){

        if(Board.gb.timer < 1){
            
            Board.gb.checkForPlayers();
            Board.sendToAll('WaitForPlayers', {});
        }
        else{
            
            Board.gb.timer--;
        }
    }
    else{
        if(counter == 0){
           
            Board.gb.updatePiece();
            console.log("Active:");
            console.log(Board.gb.activePiece);
            console.log("Board:");
            console.log(Board.gb.blocks);
            console.log("Held:");
            console.log(Board.gb.heldPiece);
            console.log("CurrPiece");
            console.log(Board.gb.currPiece);
            counter = 50 - Board.gb.gameSpeed;
        }
        else{
            counter--;
        }
    }
    var pack = {}
    for(var i in SOCKET_LIST){
		
        
        var socket = SOCKET_LIST[i];
	}
}, 1000/50);    
    