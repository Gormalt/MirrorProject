var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(8012);
console.log("Server started.");
var SOCKET_LIST = {};\



var io = require('socket.io')(serv,{});

io.sockets.on('connection', function(socket){

	console.log('socket connection');
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('signIn', function(data){

		Player.onConnect(socket, data.username);
		socket.emit('signInResponse',{success:true});
	});
        
    	socket.on('disconnect', function(){
		Player.onDisconnect(socket);
		delete SOCKET_LIST[socket.id];
	});
	
});


Board.update = function(){
    var pack = [];
}


setInterval(function(){
    
    pack = Board.update();
    
    for(var i in SOCKET_LIST){
		
        
				var socket = SOCKET_LIST[i];
				socket.emit('update', pack);
			}
		}
	}
}, 1000/25);    
    