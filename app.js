//Got the packages (in the form of objects)
var express = require('express');
var app = express();
var serv = require('http').Server(app);

//Send the user the 'index.html' file, to let them interact
app.get('/',function(req, res){
	res.sendFile(__dirname + '/client/index.html');
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
    
    socket.on('inputPack', function(data){
        console.log(data.target);
    });
	
});




var Piece = function(param){
    self.blocks = param.blocks
    self.position = param.position
    self.rotation = param.rotation
    

}

Peice.spawnNew(){
    
var blocks = [{x:0,y:0}, {x:1,y:0}, {x:0,y:1}, {x:1,y:1} ]
    
    return Peice({[],{x:0,y:0}, 0))
}

var Board = function(){
    self.blocks = [];
    self.activePiece = [];
    
    self.updatePiece = function(){
        
        testPeice = []
        
        if(activePiece[0] > 0){
            //setpeice and return
        }            
                
        for(let x  = 1; x < 11; x++){
                
            if(activePiece[x] & blocks[x-1] > 0){
                //setPeice and return
            }
            testPeice[x-1] = activePeice[x]
        }
        activePeice = testPeice;
        
    }
    
    self.spawnNextPeice() = function(){
        
        
    }
    
}


//Every so often, send data back to the players
setInterval(function(){
    
    pack = "Test";
    
    for(var i in SOCKET_LIST){
		
        
				var socket = SOCKET_LIST[i];
				socket.emit('update', pack);
	}
}, 1000/25);    
    