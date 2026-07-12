// Variabili del gioco
let player;
let enemies = [];
let powerups = [];
let score = 0;
let level = 1;
let gameActive = false;
let gameOver = false;

// VARIABILI NUOVE: Record e Combo Segreta
let highScore = 0;
let comboSequence = [];
const CHEAT_COMBO = ["SU", "GIU", "SX", "DX"]; // La combinazione segreta!

// Costanti
const PLAYER_SIZE = 30;
const ENEMY_SIZE = 25;
const POWERUP_SIZE = 15;
const CANVAS_WIDTH = 600;
const CANVAS_HEIGHT = 500;

// Direzioni di movimento
let currentDirection = { up: false, down: false, left: false, right: false };

// Classe Player
class Player {
    constructor() {
        this.x = CANVAS_WIDTH / 2;
        this.y = CANVAS_HEIGHT - 50;
        this.size = PLAYER_SIZE;
        this.health = 3;
        this.speed = 5;
        this.shieldActive = false;
        this.shieldTime = 0;
    }

    display() {
        if (this.shieldActive) {
            fill(0, 255, 200);
            stroke(0, 255, 200);
            strokeWeight(2);
            circle(this.x, this.y, this.size + 15);
            noStroke();
        }

        fill(0, 255, 0);
        square(this.x - this.size / 2, this.y - this.size / 2, this.size);

        fill(0);
        textSize(14);
        textAlign(CENTER, CENTER);
        text('@', this.x, this.y);
    }

    moveLeft() {
        if (this.x - this.size / 2 > 0) this.x -= this.speed;
    }

    moveRight() {
        if (this.x + this.size / 2 < CANVAS_WIDTH) this.x += this.speed;
    }

    moveUp() {
        if (this.y - this.size / 2 > 0) this.y -= this.speed;
    }

    moveDown() {
        if (this.y + this.size / 2 < CANVAS_HEIGHT) this.y += this.speed;
    }

    activateShield() {
        if (!this.shieldActive) {
            this.shieldActive = true;
            this.shieldTime = 300;
        }
    }

    updateShield() {
        if (this.shieldActive) {
            this.shieldTime--;
            if (this.shieldTime <= 0) {
                this.shieldActive = false;
            }
        }
    }

    collidesWith(obj) {
        let d = dist(this.x, this.y, obj.x, obj.y);
        return d < (this.size + obj.size) / 2;
    }
}

// Classe Enemy
class Enemy {
    constructor(x = random(ENEMY_SIZE, CANVAS_WIDTH - ENEMY_SIZE), y = random(-50, -10)) {
        this.x = x;
        this.y = y;
        this.size = ENEMY_SIZE;
        // Limitiamo la velocità massima per evitare blocchi al livello 10.000
        this.speed = 2 + min(level, 30) * 0.5; 
        this.dirX = random(-1, 1);
    }

    display() {
        fill(255, 0, 0);
        square(this.x - this.size / 2, this.y - this.size / 2, this.size);
        fill(0);
        textSize(14);
        textAlign(CENTER, CENTER);
        text('X', this.x, this.y);
    }

    update() {
        this.y += this.speed;
        this.x += this.dirX;

        if (this.x - this.size / 2 < 0 || this.x + this.size / 2 > CANVAS_WIDTH) {
            this.dirX *= -1;
        }
    }

    isOffScreen() {
        return this.y > CANVAS_HEIGHT;
    }
}

// Classe PowerUp
class PowerUp {
    constructor(x = random(POWERUP_SIZE, CANVAS_WIDTH - POWERUP_SIZE), y = random(-50, -10)) {
        this.x = x;
        this.y = y;
        this.size = POWERUP_SIZE;
        this.speed = 1.5;
        this.type = random() > 0.5 ? 'health' : 'score';
    }

    display() {
        textSize(20);
        textAlign(CENTER, CENTER);
        if (this.type === 'health') {
            fill(255, 100, 100);
            text('♥', this.x, this.y);
        } else {
            fill(255, 255, 0);
            text('★', this.x, this.y);
        }
    }

    update() {
        this.y += this.speed;
    }

    isOffScreen() {
        return this.y > CANVAS_HEIGHT;
    }
}

function setup() {
    let container = document.getElementById('p5-container');
    let canvas = createCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
    canvas.parent(container);

    document.body.addEventListener('touchmove', function(e) {
        e.preventDefault();
    }, { passive: false });

    // Recupera il vecchio Record salvato sul telefono
    let savedHighScore = localStorage.getItem("ertac_highscore");
    if (savedHighScore !== null) {
        highScore = parseInt(savedHighScore);
    }

    player = new Player();
    spawnInitialEnemies();
}

function draw() {
    background(20, 20, 30);

    stroke(0, 255, 0);
    strokeWeight(3);
    noFill();
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    if (!gameActive && !gameOver) {
        fill(0, 255, 0);
        textSize(32);
        textAlign(CENTER, CENTER);
        text('DODGE MASTERS', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
        textSize(18);
        text('Evita i nemici rossi (X)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 30);
        text('Raccogli power-up (♥ ★)', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        
        fill(255, 255, 0);
        text('🏆 RECORD: ' + highScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 40);
        
        fill(0, 255, 0);
        text('Tocca SU per iniziare!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 90);
        updateStatus('🏆 Record: ' + highScore + ' | Tocca SU per iniziare!');
    } else if (gameOver) {
        fill(255, 0, 0);
        textSize(40);
        textAlign(CENTER, CENTER);
        text('GAME OVER', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 80);
        fill(0, 255, 0);
        textSize(20);
        text('Score: ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 10);
        text('Level: ' + level, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 20);
        
        if (score > highScore && score > 0) {
            highScore = score;
            localStorage.setItem("ertac_highscore", highScore);
        }
        
        fill(255, 255, 0);
        text('🏆 Record di sempre: ' + highScore, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        
        fill(0, 255, 0);
        text('Tocca RICOMINCIA', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
        updateStatus('GAME OVER! Score: ' + score + ' | Record: ' + highScore);
    } else {
        // GIOCO ATTIVO
        if (currentDirection.left) player.moveLeft();
        if (currentDirection.right) player.moveRight();
        if (currentDirection.up) player.moveUp();
        if (currentDirection.down) player.moveDown();

        player.updateShield();

        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            enemies[i].display();

            if (enemies[i].isOffScreen()) {
                enemies.splice(i, 1);
                score += 10;
            } else if (player.collidesWith(enemies[i])) {
                if (!player.shieldActive) {
                    player.health--;
                    enemies.splice(i, 1);
                    if (player.health <= 0) {
                        if (score > highScore) {
                            highScore = score;
                            localStorage.setItem("ertac_highscore", highScore);
                        }
                        gameOver = true;
                        gameActive = false;
                    }
                } else {
                    enemies.splice(i, 1);
                    score += 20;
                }
            }
        }

        for (let i = powerups.length - 1; i >= 0; i--) {
            powerups[i].update();
            powerups[i].display();

            if (powerups[i].isOffScreen()) {
                powerups.splice(i, 1);
            } else if (player.collidesWith(powerups[i])) {
                if (powerups[i].type === 'health') {
                    player.health = min(player.health + 1, 5);
                } else {
                    score += 50;
                }
                powerups.splice(i, 1);
            }
        }

        if (random() < 0.02 + min(level, 30) * 0.005) {
            enemies.push(new Enemy());
        }

        if (random() < 0.008) {
            powerups.push(new PowerUp());
        }

        if (score >= level * 100 && level < 10000) {
            level++;
        }

        player.display();

        fill(0, 255, 0);
        textSize(16);
        textAlign(LEFT, TOP);
        text('❤️ Health: ' + player.health, 10, 10);
        text('Score: ' + score, 10, 30);
        text('Level: ' + level, 10, 50);
        
        fill(255, 255, 0);
        text('🏆 Record: ' + highScore, 10, 70);

        if (player.shieldActive) {
            fill(0, 255, 200);
            text('🛡️ Shield: ' + ceil(player.shieldTime / 60) + 's', 10, 90);
        }

        if (score > highScore && highScore > 0) {
            fill(255, 255, 0);
            textSize(22);
            textAlign(CENTER, TOP);
            text('🔥 NUOVO RECORD! 🔥', CANVAS_WIDTH / 2, 20);
            updateStatus('🔥 NUOVO RECORD! Punti: ' + score + ' | Livello: ' + level);
        } else {
            updateStatus('❤️ ' + player.health + ' | Score: ' + score + ' | Record: ' + highScore);
        }
    }
}

// Gestisce la combo segreta per il trucco
function checkCheatCombo(directionPressed) {
    comboSequence.push(directionPressed);
    
    if (comboSequence.length > CHEAT_COMBO.length) {
        comboSequence.shift();
    }
    
    let isMatch = true;
    for (let i = 0; i < CHEAT_COMBO.length; i++) {
        if (comboSequence[i] !== CHEAT_COMBO[i]) {
            isMatch = false;
            break;
        }
    }
    
    // TRUCCO ATTIVATO!
    if (isMatch && gameActive) {
        score = 10000;
        level = 10000;
        player.health = 5; 
        player.activateShield(); 
        comboSequence = []; 
    }
}

function moveUp() {
    checkCheatCombo("SU");
    if (!gameActive && !gameOver) {
        gameActive = true;
        currentDirection.up = false;
    } else if (gameActive) {
        currentDirection.up = true;
    }
}

function moveDown() {
    checkCheatCombo("GIU");
    if (gameActive) {
        currentDirection.down = true;
    }
}

function moveLeft() {
    checkCheatCombo("SX");
    if (gameActive) {
        currentDirection.left = true;
    }
}

function moveRight() {
    checkCheatCombo("DX");
    if (gameActive) {
        currentDirection.right = true;
    }
}

function stopMove() {
    currentDirection = { up: false, down: false, left: false, right: false };
}

function doNothing() {
    // Pulsante centrale
}

function activateShield() {
    if (gameActive) {
        player.activateShield();
    }
}

function restartGame() {
    resetGame();
}

function resetGame() {
    player = new Player();
    enemies = [];
    powerups = [];
    score = 0;
    level = 1;
    gameActive = true;
    gameOver = false;
    comboSequence = [];
    spawnInitialEnemies();
}

function spawnInitialEnemies() {
    for (let i = 0; i < 3 + min(level, 5); i++) {
        enemies.push(new Enemy());
    }
}

function updateStatus(text) {
    let status = document.getElementById('gameStatus');j
    if (status) {
        status.textContent = text;
    }
}

document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
