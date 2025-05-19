// Client controller script for the player controls

// Get elements from DOM
const nextButton = document.getElementById('next');
const landingDiv = document.getElementById('landing');
const backButton = document.getElementById('backButton');
const backButton2 = document.getElementById('backButton2');

const leaderboardButton = document.getElementById('gameLeaderboard');

const selectDiv = document.getElementById('select');
const readyButton = document.getElementById('ready');
const backBtn = document.getElementById('back');

const controlDiv = document.getElementById('control');
const pregameDiv = document.getElementById('pregame');
const waitingDiv = document.getElementById('waiting');

const scoreDiv = document.getElementById('score');
const scoreNum = document.getElementById('scoreNum');
const scoreName = document.getElementById('scoreName');
const scoreButton = document.getElementById('scoreButton');
const leaderDiv = document.getElementById('scoreDisplay');

const player1Button = document.getElementById('player1');
const player2Button = document.getElementById('player2');

// Get score span elements
const scoreSpans = [];
scoreSpans[0] = document.getElementById('s1');
scoreSpans[1] = document.getElementById('s2');
scoreSpans[2] = document.getElementById('s3');
scoreSpans[3] = document.getElementById('s4');
scoreSpans[4] = document.getElementById('s5');
scoreSpans[5] = document.getElementById('s6');
scoreSpans[6] = document.getElementById('s7');
scoreSpans[7] = document.getElementById('s8');

// Socket setup
const socket = io();
let playerNum = 1;

// Event Listeners
backButton2.onclick = function() {
    console.log("BACK");
    leaderDiv.style.display = 'none';
    scoreDiv.style.display = 'none';
    landingDiv.style.display = 'block';
    pregameDiv.style.display = 'block';
}

nextButton.onclick = function() {
    landingDiv.style.display = 'none';
    pregameDiv.style.display = 'none';
    waitingDiv.style.display = 'block';
    socket.emit('ready', {playerNum});
}

player1Button.onclick = function() {
    playerNum = 1;
    player1Button.style.backgroundColor = config.colors.activeButtonColor;
    player2Button.style.backgroundColor = config.colors.inactiveButtonColor;
}

player2Button.onclick = function() {
    playerNum = 2;
    player2Button.style.backgroundColor = config.colors.activeButtonColor;
    player1Button.style.backgroundColor = config.colors.inactiveButtonColor;
}

leaderboardButton.onclick = function() {
    socket.emit('score', {name:"", score:"0"});
    leaderDiv.style.display = 'block';
    landingDiv.style.display = 'none';
    pregameDiv.style.display = 'none';
}

backBtn.onclick = function() {
    leaderDiv.style.display = 'none';
    scoreDiv.style.display = 'none';
    landingDiv.style.display = 'block';
    pregameDiv.style.display = 'block';
}

readyButton.onclick = function() {
    waitingDiv.style.display = 'block';
    pregameDiv.style.display = 'none';
    socket.emit('ready', {playerNum});
}

scoreButton.onclick = function() {
    socket.emit('score', {name:scoreName.value, score:scoreNum.innerHTML});
}

// Socket event handlers
socket.on('returnScores', function(data) {
    console.log(data);
    leaderDiv.style.display = 'block';
    scoreDiv.style.display = 'none';
    for(let x = 0; x < data.length; x++) {
        scoreSpans[x].innerHTML = (data[x].name + " - " + data[x].score);
    }
});

socket.on('startTheGame', function(data) {
    waitingDiv.style.display = 'none';
    controlDiv.style.display = 'block';
});

socket.on('enterScore', function(data) {
    scoreNum.innerHTML = (data.score);
    controlDiv.style.display = 'none';
    scoreDiv.style.display = 'block';
});

// Game Control Buttons
const leftButton = document.getElementById('pressLeft');
const rightButton = document.getElementById('pressRight');
const downButton = document.getElementById('pressDown');
const rotateRButton = document.getElementById('rotateR');
const rotateLButton = document.getElementById('rotateL');
const holdButton = document.getElementById('hold');

// Game control event listeners
leftButton.onclick = function() {
    socket.emit('inputPack', {target:"left"});
}

rightButton.onclick = function() {
    socket.emit('inputPack', {target:"right"});
}

downButton.onclick = function() {
    socket.emit('inputPack', {target:"down"});
}

rotateRButton.onclick = function() {
    socket.emit('inputPack', {target:"rotateL"});
}

rotateLButton.onclick = function() {
    socket.emit('inputPack', {target:"rotateR"});
}

holdButton.onclick = function() {
    socket.emit('hold', {target:'now'});
}
