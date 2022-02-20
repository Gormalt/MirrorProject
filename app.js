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
    
    //What to do when getting inputs
    socket.on('inputPack', function(data){
        console.log(data.target);
    });
	
});



var Board = function(){
    
    var self = {
        blocks: new Array(15),
        activePiece: new Array(15),
    }
    
    self.reset = function(){
        self.blocks.fill(0);
        self.activePiece.fill(0);
        
    }
    
    self.updatePiece = function(){
        
        
        
        if(self.activePiece[0] > 0){
            self.setPiece();
            self.spawnNextPiece();
            return;
        }            
        testPiece = self.activePiece.slice(1);
        testPiece.push(0)
        if(self.checkOverlap(testPiece, self.blocks)){
            
             self.setPiece();
             self.spawnNextPiece();
        }
        else{
            testPiece[x-1] = self.activePiece[x]
        }
        
        
    }
    
    self.checkOverlap = function(test, blocks){
        
        for(let x  = 1; x < self.activePiece.length; x++){
                
            if((test[x] & blocks[x]) > 0){
                return true;
            }
        }
        
        return false;
        
    }
    
    self.setPiece = function(){
        
        for(let x = 0; x < self.activePiece.length; x++){
            self.blocks[x] = self.blocks[x] + self.activePiece[x];
            
        }
        
    }
    
    
    self.spawnNextPiece = function(){
        self.activePiece = [0,0,0,0,0,0,0,0,0,0,0,0,0,24,24]
         
    }
    
    return self;
}

var gameStarted = false;
var board = Board();
//Every so often, send data back to the players
setInterval(function(){

    if(!gameStarted){
        board.reset();
        gameStarted = true;
        board.spawnNextPiece();
    }
    else{
        board.updatePiece();
        console.log("Active:");
        console.log(board.activePiece);
        console.log("Board:");
        console.log(board.blocks);
    }
    var pack = {}
    for(var i in SOCKET_LIST){
		
        
				var socket = SOCKET_LIST[i];
				socket.emit('update', pack);
	}
}, 1000/1);    
    