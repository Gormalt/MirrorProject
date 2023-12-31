var mongojs = require("mongojs");
//var db = mongojs('localhost:27017/GameDevWarriors', ['maps']);

var express = require('express');
var app = express();
var serv = require('http').Server(app);

app.get('/',function(req, res){
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(8012);
console.log("Server started.");

var SOCKET_LIST = {};

var Entity = function(){
	var self = {
		map:0,
		x:0,
		y:0,
		dx:0,
		dy:0,
		spdX:0,
		spdY:0,
		id:"",
		mapNo:null,
	}
	self.findMapNo = function(){
		for(var i in Map.list){
			if(Map.list[i].name == self.map){
				self.mapNo = i;
			}
		}
	}
	
	self.update = function(){
		self.updatePosition();
	}
	self.updatePosition = function (){
		self.x += self.spdX;
		self.y += self.spdY;
	}
	self.getDistance = function(pt){
		return Math.sqrt(Math.pow(self.x - pt.x,2) + Math.pow(self.y - pt.y,2));
	}
	self.isCollidingWith = function(trgt){
		if(self.x + self.dx > trgt.x && self.x < trgt.x + trgt.dx && self.y + self.dy > trgt.y && self.y < trgt.y + trgt.dy){
			return true;
		}
		return false;
	}
	return self;
}

var Slime = function(map, x, y){
	var self = Entity();
	self.x = x;
	self.y = y;
	self.id = Math.random();
	self.maxhp = 10;
	self.hp = 10;
	self.range = 250;
	self.cooldown = 4000;
	self.toRemove = false;
	self.dx = 50;
	self.dy = 50;
	
	self.map = map;
	
	self.findMapNo();
	
	self.targetPlayer = function(){
		var distance = self.range;
		var playerId = null;
		for(var i in Player.list){
			if(self.getDistance(Player.list[i]) < distance){
				distance = self.getDistance(Player.list[i]);
				playerId = i;

				}
		}
		return playerId;
	}
	
	self.attackPlayer = function(playerId){

		var attackAngle = 1;
		//@Todo, player targeting.
		if(Player.list[playerId].x > self.x){
			self.spdX = 10;
		}
		else
		{
			self.spdX = -10;
		}
		self.spdY = -10;
		cooldown = 0;
	}
	
	self.updatePos = function(){

		if(isEmpty(self.mapNo, self.x, self.y + 1, 50, 50)){
			self.spdY++;
		}
		else if(self.spdY > 0){
			self.spdY = 0;
			self.spdX = 0;
		}
		
		if(isEmpty(self.mapNo, self.x, self.y + self.spdY, 50, 50)){
			self.y += self.spdY;
		}
		else{
			self.spdY = 0;
		}
		
		self.x += self.spdX;
		
	}
	
	self.getInitPack = function(){
		return{
			id:self.id,
			x:self.x,
			y:self.y,
			hp:self.hp,
			dx:self.dx,
			dy:self.dy,
			hpMax:self.hpMax,
		}
	}
	for(var i in Map.list){
	if(Map.list[i].name == self.map){
		initPack.map[i].slime.push(self.getInitPack());
		Slime.list[self.id] = self;
	}
	}
}

Slime.list = {};

Slime.update = function(mapNo){
	var slimePack = [];
	
	for(var i in Slime.list){
	if(Slime.list[i].map == Map.list[mapNo].name){
	
		slime = Slime.list[i];
		if(slime.cooldown >= 60 && slime.targetPlayer()){
			slime.attackPlayer(slime.targetPlayer());
			slime.cooldown = 0;
		}
		
		if(slime.cooldown < 60){
			slime.cooldown++;
		}
		slime.updatePos();
		
		for(var i in Player.list){
			if(slime.isCollidingWith(Player.list[i])){
				Player.list[i].hp--;	
			}			
		}
		
		for(var i in Bullet.list){
			if(slime.isCollidingWith(Bullet.list[i])){
				slime.hp--;
			}
		}
		if(slime.hp <= 0){
			slime.toRemove = true;
		}
		
		if(slime.toRemove){
			removePack.map[mapNo].slime.push(slime.id);
			delete Slime.list[slime.id];

		}
		else{
			slimePack.push(slime);
		}
	}
	}
	return slimePack;
	
}

5

Slime.getAllInitPack = function(mapNo){
			var slime = [];
	for (var i in Slime.list){
		if(Slime.list[i].mapNo = mapNo){
			slime.push(Slime.list[i].getInitPack());
		}
	}
	return slime;
}
var Player = function(id, username){
	var self = Entity();
		self.id = id;
		self.name = username;
		self.number = "" + Math.floor(10 * Math.random());
		self.selfpressingRight = false;
		self.pressingLeft = false;
		self.pressingUp = false;
		self.pressingDown = false;
		self.pressingAttack = false;
		self.pressingJump = false;
		self.mouseAngle = 0;
		self.maxSpd = 10;
		self.hp = 10;
		self.hpMax = 10;
		self.score = 0;
		self.jumpSpd = 13;
		self.y = -80;
		self.dx = 80;
		self.dy = 80;
		self.cx = self.x+(self.dx/2)
		self.cy = self.y+(self.dy/2)
		self.canJump = false;
		
		var super_update = self.update;
		
		self.update = function(){
			if(self.hp <= 0){
				self.hp = self.hpMax;
				self.x = 20;
			}
			self.updateSpd();
			self.updatePos();
			//super_update();
			if(self.pressingAttack){
				self.shootBullet(self.mouseAngle);
			}


		}
		self.shootBullet = function(angle){
			var b = Bullet(self.id,angle);
			b.x = self.cx;
			b.y = self.cy;
		}
	self.updatePos = function(){

		if(isEmpty(self.mapNo, self.x + self.spdX, self.y, self.dx, self.dy)){
		self.x += self.spdX;
		}
		else if(self.spdX > 0){
			while(!isEmpty(self.mapNo, self.x + self.spdX, self.y,self.dx,self.dy) && self.spdX > 0){
				self.spdX--;
				
			}
			self.x += self.spdX;
			self.canJump = true;
			
		}
		else if(self.spdX < 0){
			while(!isEmpty(self.mapNo, self.x + self.spdX, self.y, self.dx, self.dy) && self.spdX < 0){
				self.spdX++;
				
			}
			self.x += self.spdX;
			self.canJump = true;

		}
		else{
			self.canJump = true;
			self.spdX = 0;
			
		}
		
		if(isEmpty(self.mapNo, self.x, self.y + self.spdY, self.dx, self.dy)){
		self.y += self.spdY;
		}
		else if(self.spdY > 0){
			while(!isEmpty(self.mapNo, self.x, self.y + self.spdY, self.dx, self.dy) && self.spdY > 0){
				self.spdY--;

			}
			self.y += self.spdY;
			self.canJump = true;
			
		}
		else if(self.spdY < 0){
			while(!isEmpty(self.mapNo, self.x, self.y + self.spdY, self.dx, self.dy) && self.spdY < 0){
				self.spdY++;

			}
			self.y += self.spdY;
			self.canJump = true;

		}
		else{
			self.canJump = true;
			self.spdY = 0;
		}
		
		self.cx = self.x + (self.dx/2);
		self.cy = self.y + (self.dy/2);
	}
	
	self.updateSpd = function(){
		if(self.pressingRight)
			self.spdX = self.maxSpd;
		else if(self.pressingLeft)
			self.spdX = -self.maxSpd;
		else
			self.spdX = 0;
		
		if(self.pressingUp && self.canJump == true){
			self.spdY = -self.jumpSpd;
			self.canJump = false;
		}
		else if(self.pressingDown)
			self.spdY = +self.jumpSpd;
		
		if(isEmpty(self.mapNo, self.x, self.y + self.spdY + 1, self.dx, self.dy)){
			self.spdY++;
		}
		else if(!isEmpty(self.mapNo, self.x, self.y + self.spdY, self.dx, self.dy)){
			while(!isEmpty(self.mapNo, self.x, self.y + self.spdY, self.dx, self.dy) && self.spdY > 0){
				self.spdY--;
				
			}
				self.canJump = true;
		}	



	}
	
	self.getInitPack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			number:self.number,
			hp:self.hp,
			hpMax:self.hpMax,
			score:self.score,
			name:self.name,
			dx: self.dx,
			dy: self.dy,
		};
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
			hp:self.hp,
			score:self.score,
		}
	}
	
	Player.list[id] = self;
	self.init = function(){
		for(var i in Map.list){
			if(Map.list[i].name == self.map){
				initPack.map[i].player.push(self.getInitPack());
			}	
		}

	}	
			return self;
}

Player.list = {};
Player.onConnect = function(socket, username){
		var player = Player(socket.id, username);
		
		player.map = "test";
		
		if(player.name == 'bob'){
			player.map = "Dev";
		}
		

		player.findMapNo();
		player.init();

	socket.on('keyPress', function(data){
		if(data.inputId ==='left')
			player.pressingLeft = data.state;
		else if(data.inputId === 'right')
			player.pressingRight = data.state;
		else if(data.inputId === 'up')
			player.pressingUp = data.state;
		else if(data.inputId === 'down')
			player.pressingDown = data.state;
		else if(data.inputId === 'attack')
			player.pressingAttack = data.state;
		else if (data.inputId === 'mouseAngle')
			player.mouseAngle = data.state;
	});

	

	socket.emit('init',{
		selfId:socket.id,
		player:Player.getAllInitPack(Player.list[socket.id].mapNo),
		bullet:Bullet.getAllInitPack(Player.list[socket.id].mapNo),
		slime:Slime.getAllInitPack(Player.list[socket.id].mapNo),
		obstacle:getObstacles(Player.list[socket.id].mapNo),
	});
	
}

Player.getAllInitPack = function(mapNo){
		var player = [];
	for (var i in Player.list){
	//console.log(Player.list[i].mapNo + " " + Player.list[i].name);
		if(Player.list[i].mapNo == mapNo){
			player.push(Player.list[i].getInitPack());
		}
	}
	return player;
}

Player.onDisconnect = function(socket){

	for(var i in Map.list){
		if(Player.list[socket.id] && Map.list[i].name == Player.list[socket.id].map){
			removePack.map[i].player.push(socket.id);
		}
	}
	delete Player.list[socket.id];
}

Player.update = function(mapNo){
	
	var pack = [];
	
    for(var i in Player.list){
	if(Player.list[i].map == Map.list[mapNo].name){
		var player = Player.list[i];
			
			player.update();
			pack.push(player.getUpdatePack());	
	

	}
	}
	return pack;
}

var Bullet = function(parent, angle){
	var self = Entity();
	self.id = Math.random();
	self.spdX = Math.cos(angle/180*Math.PI)* 10;
	self.spdY = Math.sin(angle/180*Math.PI)* 10;
	self.parent = parent;
	self.timer = 0;
	self.dx = 20;
	self.dy = 20;
	self.toRemove = false;
	self.map = Player.list[parent].map;
	self.mapNo = Player.list[parent].mapNo;
	var super_update = self.update;
	self.update = function(){
		if(self.timer++ > 100)
			self.toRemove = true;
		super_update();
		
		for(var i in Player.list){
			var p = Player.list[i];
			if(self.getDistance(p) < 32 && self.parent !== p.id){
				self.toRemove = true;
				p.hp -= 1;

				if(p.hp <= 0) {
					var shooter = Player.list[self.parent];
					if(shooter)
						shooter.score += 1;
					p.hp = p.hpMax;
					p.x = Math.random() * 500;
					//p.y = Math.random() * 500;

				}
			}
		}
	}
	
		self.getInitPack = function(){
		return{
			id:self.id,
			x:self.x,
			y:self.y,
		};
	}
	self.getUpdatePack = function(){
		return {
			id:self.id,
			x:self.x,
			y:self.y,
		}
	}
	
	
	Bullet.list[self.id] = self;
	for(var i in Map.list){
	if(Map.list[i].name == self.map){
		initPack.map[i].bullet.push(self.getInitPack());
	}
	}
	return self;
}
Bullet.list = {};


var Map = function(data){
	var self = {};
	self.id = data.id;
	self.name = data.map;
	self.obstacles = data.obstacles;
	self.monsters = data.monsters;
	
	Map.list[self.id] = self;
	return self;

}

Map.list = {};
Map({
	id:2,
	map:"test",
	obstacles:[
{
	img:0,
	x:-600, 
	y:10, 
	dx:2000, 
	dy:600,
	id:2
},
{
	img:0,
	x:100, 
	y:-60, 
	dx:20, 
	dy:20,
	id:1
},
{
	img:0,
	x:120, 
	y:-260, 
	dx:50, 
	dy:50,
	id:3
}
],
monsters:[]
})

Map({id:5,map:"Dev",obstacles:[],monsters:[]});


var Obstacle = function(param){
	var self = Entity();
	self.x = param.x;
	self.y = param.y;
	self.dx = param.dx;
	self.dy = param.dy;
	self.img = param.img;
	self.id = param.id;
	self.map = param.mapNo;
	
	Map.list[self.map].obstacles[self.id] = self;
	return self;
}

Obstacle.list = {};


//Obstacle Initialization. To be replaced by reading the database later.

Obstacle({
	img:0,
	x:-600, 
	y:10, 
	dx:2000, 
	dy:600,
	id:2,
	mapNo:2,
});
Obstacle({
	img:0,
	x:100, 
	y:-60, 
	dx:20, 
	dy:20,
	id:1,
	mapNo:2,
	
});
Obstacle({
	img:0,
	x:120, 
	y:-260, 
	dx:50, 
	dy:50,
	id:3,
	mapNo:2,
});

var getObstacles = function(mapNo){
	var obstacles = [];
	for(var i in Map.list[mapNo].obstacles){
		obstacles.push(Map.list[mapNo].obstacles[i]);
	}
	return obstacles;
}

Bullet.getAllInitPack = function(mapNo){
	var bullets = [];
	for (var i in Bullet.list){
		if(Bullet.list[i].mapNo = mapNo){
			bullets.push(Bullet.list[i].getInitPack());
		}
	}
	return bullets
}

Bullet.update = function(mapNo){
	
	var pack = [];
	for(var i in Bullet.list){
	if(Bullet.list[i].map == Map.list[mapNo].name){
		var bullet = Bullet.list[i];
		bullet.update();
		if(bullet.toRemove){
			delete Bullet.list[i];
			removePack.map[mapNo].bullet.push(bullet.id);
		}
		else
			pack.push(bullet.getUpdatePack());
	}
	}
	return pack;
}

var DEBUG = true;

//@DataBase
/*
var isValidPassword = function(data, cb){
	db.account.find({username:data.username,password:data.password},function(err,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});
}

var isUsernameTaken = function(data,cb){
	db.account.find({username:data.username},function(err,res){
		if(res.length > 0)
			cb(true);
		else
			cb(false);
	});
}
var addUser = function(data,cb){
	db.account.insert({username:data.username,password:data.password}, function(err){
		cb();
	});
}

var getMapData = function(map, cb){
	db.maps.findOne({map:map}, function(err,res){
		if(res){
			cb(res);
		}
	});
}
*/

/*
getMapData("Dev", function(data){
	console.log(data);
});
*/
console.log(Map.list);

var isEmpty = function(mapNo,x,y,dx,dy){
	for(var i in Map.list[mapNo].obstacles){
		obstacle = Map.list[mapNo].obstacles[i];
		if(x + dx > obstacle.x && x < obstacle.x + obstacle.dx && y + dy > obstacle.y && y < obstacle.y + obstacle.dy)
			return false;
	}
	return true;
}

var io = require('socket.io')(serv,{});
io.sockets.on('connection', function(socket){
	console.log('socket connection');
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;
	socket.on('signIn', function(data){
		Player.onConnect(socket, data.username);
		socket.emit('signInResponse',{success:true});
	});
	//socket.on('signIn', function(data){
	//	isValidPassword(data, function(res){
	//		if(res){
	//			Player.onConnect(socket);
	//			socket.emit('signInResponse',{success:true});
	//		}
	//		else{
	//			socket.emit('signInResponse',{success:false});
	//		}
	//	});
	//});
	
	//socket.on('signUp', function(data){
	//	isUsernameTaken(data, function(res){
	//		if(res){
	//		socket.emit('signUpResponse',{success:false});
	//		}
	//		else{
	//			addUser(data, function(){
	//				socket.emit('signUpResponse',{success:true});
	//			});
	//		}
	//	});
	//});	
		
		
	socket.on('disconnect', function(){
		Player.onDisconnect(socket);
		delete SOCKET_LIST[socket.id];
	});
	socket.on('sendMsgToServer', function(data){
		var playerName = ("" + Player.list[socket.id].name);
		for(var i in SOCKET_LIST){
			SOCKET_LIST[i].emit('addToChat', playerName + ': ' + data);
		}
	});
	socket.on('evalServer', function(data){
		if(!DEBUG)
			return;
		

		if(data == "spawnSlime"){
		Slime("test", 900, -200);
			return;
		}
		var res = eval(data);
		console.log(res);
		socket.emit('evalAnswer',res);
	});
	
});

var initPack = {map:[]};
var removePack = {map:[]};

for(var i in Map.list){
	initPack.map[i] = {player:[], bullet:[], obstacle:[], slime:[]};
	removePack.map[i] = {player:[], bullet:[], slime:[]};
}


//Initializing test-slimes
Slime("test", 900, -200);

setInterval(function(){
	var pack = {map:[]};
	for(var i in Map.list){
		pack.map[i] = {
			player:Player.update(i),
			bullet:Bullet.update(i),
			slime:Slime.update(i),
		}
	}

	for(var i in SOCKET_LIST){
		for(var n in Map.list){
			//console.log(Player.list);
			if(Player.list[i] && Map.list[n].name == Player.list[i].map){
				var socket = SOCKET_LIST[i];
				socket.emit('init', initPack.map[n]);
				socket.emit('update', pack.map[n]);
				socket.emit('remove', removePack.map[n]);
			}
		}
	}
	//console.log(initPack);
	
	for(var i in Map.list){
	initPack.map[i] = {player:[], bullet:[], obstacle:[], slime:[]};
	removePack.map[i] = {player:[], bullet:[], slime:[]};
}
	
}, 1000/25);