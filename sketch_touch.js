// Variabili del gioco
let player;
let enemies = [];
let powerups = [];
let score = 0;
let level = 1;
let gameActive = false;
let gameOver = false;

// Record e Combo Segreta
let highScore = 0;
let comboSequence = [];
const CHEAT_COMBO = ["SU", "GIU", "SX", "DX"]; 

// Fasi del Trucco
let cheatActivated = false;
let cheatTimer = 0; 
let challengePhase = false; 
let gameWon = false; 

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
    constructor(x, y) {
        this.x = x !== undefined ? x : random(ENEMY_SIZE, CANVAS_WIDTH - ENEMY_SIZE);
        this.y = y !== undefined ? y : random(-50, -10);
        this.size = ENEMY_SIZE;
        this.speed = challengePhase ? 0 : (2 + min(level, 30) * 0.5); 
        this.dirX = challengePhase ? 0 : random(-1, 1);
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
    constructor() {
        this.x = random(POWERUP_SIZE, CANVAS_WIDTH - POWERUP_SIZE);
        this.y = random(-50, -10);
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

    if (!gameActive && !gameOver && !gameWon) {
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
        
    } else if (gameWon) {
        fill(0, 255, 255);
        textSize(36);
        textAlign(CENTER, CENTER);
        text('🏆 GIOCO FINITO! 🏆', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 - 60);
        fill(255, 255, 0);
        textSize(28);
        text('HAI VINTO IL GIOCO!', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
        textSize(18);
        fill(0, 255, 0);
        text('Punteggio Finale: ' + score, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 50);
        text('Tocca RICOMINCIA', CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2 + 100);
        updateStatus('🎉 COMPLIMENTI! Hai finito il gioco!');
        
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
        if (!challengePhase) {
            if (currentDirection.left) player.moveLeft();
            if (currentDirection.right) player.moveRight();
            if (currentDirection.up) player.moveUp();
            if (currentDirection.down) player.moveDown();
        }

        player.updateShield();

        if (cheatActivated && !challengePhase) {
            cheatTimer--;
            if (cheatTimer <= 0) {
                challengePhase = true;
                enemies = []; 
                for (let x = 30; x < CANVAS_WIDTH; x += 45) {
                    for (let y = 30; y < CANVAS_HEIGHT - 80; y += 45) {
                        enemies.push(new Enemy(x, y));
                    }
                }
                comboSequence = []; 
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            enemies[i].display();

            if (enemies[i].isOffScreen()) {
                enemies.splice(i, 1);
                score += 10;
            } else if (player.collidesWith(enemies[i])) {
                if (!player.shieldActive || challengePhase) {
                    player.health = 0;
                    gameOver = true;
                    gameActive = false;
                } else {
                    enemies.splice(i, 1);
                    score += 20;
                }
            }
        }

        if (!challengePhase) {
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

        if (player.shieldActive && !challengePhase) {
            fill(0, 255, 200);
            text('🛡️ Shield: ' + ceil(player.shieldTime / 60) + 's', 10, 90);
        }

        if (challengePhase) {
            fill(255, 0, 0);
            textSize(24);
            textAlign(CENTER, CENTER);
            if (frameCount % 30 < 15) { 
                text('⚠️ INSERISCI NUOVO CODICE! ⚠️', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
            }
            updateStatus('🚨 REINSERISCI IL CODICE O ESPLODERAI!');
        } else if (cheatActivated) {
            let secondsLeft = ceil(cheatTimer / 60);
            fill(255, 100, 0);
            textSize(22);
            textAlign(CENTER, TOP);
            text('⏳ AUTODISTRUZIONE TRA: ' + secondsLeft + 's', CANVAS_WIDTH / 2, 20);
            updateStatus('⏳ Tempo rimasto: ' + secondsLeft + 's');
        } else if (score > highScore && highScore > 0) {
            fill(255, 255, 0);
            textSize(22);
            textAlign(CENTER, TOP);
            text('🔥 NUOVO RECORD! 🔥', CANVAS_WIDTH / 2, 20);
            updateStatus('🔥 NUOVO RECORD! Punti: ' + score);
        } else {
            updateStatus('❤️ ' + player.health + ' | Score: ' + score + ' | Record: ' + highScore);
        }
    }
}

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
    
    if (isMatch && gameActive) {
        if (!cheatActivated) {
            score = 10000;
            level = 10000;
            player.health = 5; 
            player.activateShield(); 
            cheatActivated = true;
            cheatTimer = 10 * 60; 
            comboSequence = []; 
        } else if (challengePhase) {
            challengePhase = false;
            gameWon = true;
            gameActive = false;
            enemies = [];
        }
    } else if (challengePhase && comboSequence.length === CHEAT_COMBO.length && !isMatch) {
        player.health = 0;
        gameOver = true;
        gameActive = false;
    }
}

function moveUp() {
    checkCheatCombo("SU");
    if (!gameActive && !gameOver && !gameWon) {
        gameActive = true;
        currentDirection.up = false;
    } else if (gameActive && !challengePhase) {
        currentDirection.up = true;
    }
}

function moveDown() {
    checkCheatCombo("GIU");
    if (gameActive && !challengePhase) {
        currentDirection.down = true;
    }
}

function moveLeft() {
    checkCheatCombo("SX");
    if (gameActive && !challengePhase) {
        currentDirection.left = true;
    }
}

function moveRight() {
    checkCheatCombo("DX");
    if (gameActive && !challengePhase) {
        currentDirection.right = true;
    }
}

function stopMove() {
    currentDirection = { up: false, down: false, left: false, right: false };
}

function doNothing() {}

// Questa funzione ora gestisce correttamente il riavvio completo pulito
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
    gameWon = false;
    cheatActivated = false;
    cheatTimer = 0;
    challengePhase = false;
    comboSequence = [];
    spawnInitialEnemies();
}

function spawnInitialEnemies() {
    for (let i = 0; i < 4; i++) {
        enemies.push(new Enemy());
    }
}

function activateShield() {
    if (gameActive && !challengePhase) {
        player.activateShield();
    }
}

function updateStatus(text) {
    let status = document.getElementById('gameStatus');
    if (status) {
        status.textContent = text;
    }
}

document.addEventListener('touchmove', function(e) {
    e.preventDefault();
}, { passive: false });
