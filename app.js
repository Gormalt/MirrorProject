//Got the packages (in the form of objects)
var express = require('express');
var app = express();
var serv = require('http').Server(app);

//Send the user the 'index.html' file, to let them interact
app.get('/',function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});
app.get('/mirror',function(req, res){
	res.sendFile(__dirname + '/client/mirrorIndex.html');
});

app.use('/client', express.static(__dirname + '/client'));

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
    
    //Determine what to do when it disconnects
    socket.on('disconnect', function(){
        
		delete SOCKET_LIST[socket.id];
	});
    
	Board.onConnect(socket);
});


//The Board object, handles the game logic
var Board = function(){
    
    var self = {
        blocks: new Array(15),
        activePiece: new Array(15),
    }
    
    self.reset = function(){
        self.blocks.fill(0);
        self.activePiece.fill(0);
        
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
    //Moves the piece in the given direction (or rotates it)
    self.movePiece = function(dir){
        testPiece = new Array(15);
        testPiece.fill(0);

        if(dir == 'down'){
            while(!self.updatePiece()){
            }
        }
        else if(dir == 'rotate'){
            self.rotatePiece(dir);
        }
        else{
            if(dir == 'left'){
                for(let x = 0; x < self.activePiece.length; x++){
                    res = ((self.activePiece[x]) >> 1);

                    testPiece[x] = res;
                    
                    if(res == 0 && self.activePiece[x] != 0){
                        return;
                    }
                    
                   
                }
            }    
            else if(dir == 'right'){
                for(let x = 0; x < self.activePiece.length; x++){
                    res = ((self.activePiece[x]) << 1);
                    
                    if(res > 4094){
                        return;
                    }
                    
                    testPiece[x] = res;
                    
                    
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
    //Sets THE active peice onto the board (by adding its values to the array)
    //@Todo Make it so you can place a give peice, not just the active one.
    self.setPiece = function(){
        
        count = 0;
        
        for(let x = 0; x < self.activePiece.length; x++){
            self.blocks[x] = self.blocks[x] + self.activePiece[x];
            
            if(self.blocks[x] >= 4095){
                count++;
                Board.sendToAll('deleteRow', {row:x})
            }
            else if (count > 0){
                
                self.blocks[x-count] = self.blocks[x];
                self.blocks[x] = 0;
            }
                
        }
       
        
    }
    //Rotates the peice (only in one direction now, must add other direction).
    self.rotatePiece = function(dir){
        var frstPcX = 0;
        var frstPcY = 0;
        
        found = false;
        newActive = new Array(15);
        newActive.fill(0);
        center = self.findActiveCenter();
                    
        frstPcX = center.x;
        frstPcY = center.y;
        for(let i = 0; i < self.activePiece.length; i++){
            val = self.activePiece[i];

                

            count = 0;
            
            while(val > 0){

                if(val & 1 > 0){

                    if(frstPcX + i - frstPcY > 0){
                        amount = (1 << frstPcX - i + frstPcY);
                    }
                    else{
                        amount = (1 >> -(frstPcX + i - frstPcY));
                    }
                    
                    newActive[frstPcY+count-frstPcX] += amount;
                }
                val = val >> 1;
                count++;
            }
            
        }
        
        if(!self.checkOverlap(newActive, self.blocks)){
            Board.sendToAll('activeUpdate', {dir:'rotate', color:'black', active:newActive});
            self.activePiece = newActive;
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
        rand = Math.floor(Math.random() * 5);
        if(rand == 4){
            self.activePiece = [0,0,0,0,0,0,0,0,0,0,0,16,16,16,16]
        }
        else if(rand == 3){
            self.activePiece = [0,0,0,0,0,0,0,0,0,0,0,0,0,56,8]
        }
        else if(rand == 2){
            self.activePiece = [0,0,0,0,0,0,0,0,0,0,0,0,0,56,32]
        }
        else if(rand == 1){
            self.activePiece = [0,0,0,0,0,0,0,0,0,0,0,0,0,24,24]
        }
        else{
            self.activePiece = [0,0,0,0,0,0,0,0,0,0,0,0,0,24,24]
        }
        
        if(self.checkOverlap(self.activePiece, self.blocks)){
        
            //@TODO: XXXX note that here, we can determine if the game is over (ie, can't spawn a new peice because of overlap.
            //We will need to add something so that the game stops when this happens.
            //Will also need to add a way to reset the game (may need another socket.on)
            //Focus on having everything reset from the server for now.
        }
        Board.sendToAll('setActive', {color:'white', active:self.activePiece});
    }

    return self;
}


//This is for player input
//@TODO add other info on connect.
Board.onConnect = function(socket){
    
    socket.on('inputPack', function(data){
        
       Board.gb.movePiece(data.target);
    });

    socket.on('start', function(data){
        Board.gb.gameStarted = true;
        Board.gb.reset();
        Board.gb.spawnNextPiece();
    });
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

//Every so often, update the board
setInterval(function(){

    if(!Board.gb.gameStarted){
        //What to do while we wait...?
    }
    else{
        Board.gb.updatePiece();
        console.log("Active:");
        console.log(Board.gb.activePiece);
        console.log("Board:");
        console.log(Board.gb.blocks);
    }
    var pack = {}
    for(var i in SOCKET_LIST){
		
        
        var socket = SOCKET_LIST[i];
        socket.emit('update', pack);
	}
}, 1000/1);    
    