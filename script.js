const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const score1Display = document.getElementById('player1Score');
const score2Display = document.getElementById('player2Score');
const messageDisplay = document.getElementById('messageDisplay');
const instructions = document.getElementById('instructions');

const GRID_SIZE = 10;
const CANVAS_WIDTH = 1000; 
const CANVAS_HEIGHT = 600;

canvas.width = CANVAS_WIDTH;
canvas.height = CANVAS_HEIGHT;

let player1, player2;
let gameRunning = false;
let gameInterval;
let p1Score = 0;
let p2Score = 0;

// --- AUDIO CONFIGURATION ---
// Replace these strings with your actual file paths (e.g., "sounds/bgm.mp3")
const BGM_URL = "Music/bgm.mp3";
const CRASH_URL = "Music/explode.wav";
const TURN_URL = "Music/turn.wav";

const bgm = new Audio(BGM_URL);
bgm.loop = true;
bgm.volume = 0.5;

const crashSound = new Audio(CRASH_URL);
const turnSound = new Audio(TURN_URL);

function initAudio() {
    // Browsers require a user gesture to play audio
    bgm.play().catch(e => console.log("Audio waiting for user interaction"));
}

function playCrashSound() {
    crashSound.currentTime = 0; // Reset to start if already playing
    crashSound.play().catch(e => {});
}

function playTurnSound() {
    turnSound.currentTime = 0;
    turnSound.play().catch(e => {});
}

// --- GAME LOGIC ---
function Player(x, y, color, controls) {
    this.startX = x;
    this.startY = y;
    this.color = color;
    this.controls = controls;
    this.reset();
}

Player.prototype.reset = function() {
    this.x = this.startX;
    this.y = this.startY;
    this.dx = this.color === '#ff00ff' ? 1 : -1;
    this.dy = 0;
    this.trail = [{x: this.x, y: this.y}];
};

Player.prototype.update = function() {
    this.x += this.dx * GRID_SIZE;
    this.y += this.dy * GRID_SIZE;
    this.trail.push({x: this.x, y: this.y});
};

Player.prototype.draw = function() {
    ctx.strokeStyle = this.color;
    ctx.lineWidth = GRID_SIZE - 2;
    ctx.shadowBlur = 15;
    ctx.shadowColor = this.color;
    ctx.beginPath();
    ctx.moveTo(this.trail[0].x + GRID_SIZE/2, this.trail[0].y + GRID_SIZE/2);
    for(let i=1; i<this.trail.length; i++) {
        ctx.lineTo(this.trail[i].x + GRID_SIZE/2, this.trail[i].y + GRID_SIZE/2);
    }
    ctx.stroke();
    ctx.fillStyle = "#fff";
    ctx.fillRect(this.x, this.y, GRID_SIZE, GRID_SIZE);
    ctx.shadowBlur = 0;
};

function drawGrid() {
    ctx.strokeStyle = '#001a1a';
    ctx.lineWidth = 1;
    for (let x = 0; x <= CANVAS_WIDTH; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_HEIGHT); ctx.stroke();
    }
    for (let y = 0; y <= CANVAS_HEIGHT; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_WIDTH, y); ctx.stroke();
    }
}

function initGame() {
    player1 = new Player(GRID_SIZE * 10, CANVAS_HEIGHT / 2, '#ff00ff', {up: 'KeyW', down: 'KeyS', left: 'KeyA', right: 'KeyD'});
    player2 = new Player(CANVAS_WIDTH - GRID_SIZE * 11, CANVAS_HEIGHT / 2, '#00ffff', {up: 'ArrowUp', down: 'ArrowDown', left: 'ArrowLeft', right: 'ArrowRight'});
    draw();
}

function startRound() {
    initAudio();
    player1.reset();
    player2.reset();
    messageDisplay.style.display = 'none';
    instructions.style.opacity = '0';
    gameRunning = true;
    gameInterval = setInterval(gameLoop, 80);
}

function checkCollision(p) {
    if (p.x < 0 || p.x >= CANVAS_WIDTH || p.y < 0 || p.y >= CANVAS_HEIGHT) return true;
    const allTrails = [...player1.trail.slice(0, -1), ...player2.trail.slice(0, -1)];
    return allTrails.some(segment => p.x === segment.x && p.y === segment.y);
}

function gameLoop() {
    player1.update();
    player2.update();
    const p1Hit = checkCollision(player1);
    const p2Hit = checkCollision(player2);

    if (p1Hit || p2Hit) {
        gameRunning = false;
        clearInterval(gameInterval);
        playCrashSound();
        if (p1Hit && p2Hit) messageDisplay.textContent = "DRAW! Press ENTER";
        else if (p1Hit) { p2Score++; messageDisplay.textContent = "P2 WINS! Press ENTER"; }
        else { p1Score++; messageDisplay.textContent = "P1 WINS! Press ENTER"; }
        score1Display.textContent = `P1: ${p1Score}`;
        score2Display.textContent = `P2: ${p2Score}`;
        messageDisplay.style.display = 'block';
        instructions.style.opacity = '1';
    }
    draw();
}

function draw() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    drawGrid();
    player1.draw();
    player2.draw();
}

window.addEventListener('keydown', e => {
    if (e.code === 'Enter' && !gameRunning) startRound();
    const keys = {
        'KeyW': [player1, 0, -1], 'KeyS': [player1, 0, 1], 'KeyA': [player1, -1, 0], 'KeyD': [player1, 1, 0],
        'ArrowUp': [player2, 0, -1], 'ArrowDown': [player2, 0, 1], 'ArrowLeft': [player2, -1, 0], 'ArrowRight': [player2, 1, 0]
    };
    if (keys[e.code]) {
        const [p, dx, dy] = keys[e.code];
        if ((dx !== 0 && p.dx === 0) || (dy !== 0 && p.dy === 0)) {
            p.dx = dx; p.dy = dy;
            playTurnSound(); // Added a sound trigger for turning
        }
    }
});

initGame();