// Variabili del gioco
let player;
let enemies = [];
let powerups = [];
let score = 0;
let level = 1;
let gameActive = false;
let gameOver = false;

// Record e Combo Segrete
let highScore = 0;
let comboSequence = [];
const CHEAT_COMBO = ["SU", "GIU", "SX", "DX"];        
const INFINITE_COMBO = ["SX", "DX", "SX", "DX"];    

// Contatore per il reset del record
let resetRecordClicks = 0;

// Fasi del Trucco Normale
let cheatActivated = false;
let cheatTimer = 0; 
let challengePhase = false; 
let gameWon = false; 

// --- NOVITÀ: IMPOSTAZIONI OWNER & COOLDOWN SCUDO ---
const OWNER_PASSWORD = "owner2026"; // La tua password segreta
let ownerMenuOpen = false;
let ownerAuthenticated = false;

// Opzioni Trucchi Owner
let ownerGodMode = false;
let ownerSuperSpeed = false;
let ownerMagnetMode = false;

// Costanti Dimensioni
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
        this.shieldCooldown = 0; // Cooldown in fotogrammi (480 = 8 secondi a 60fps)
    }

    display() {
        if (this.shieldActive) {
            fill(0, 255, 200);
            stroke(0, 255, 200);
            strokeWeight(2);
            circle(this.x, this.y, this.size + 15);
            noStroke();
        }

        // Se God Mode è attivo, il player diventa dorato/arcobaleno
        if (ownerGodMode) {
            fill(255, 215, 0);
        } else {
            fill(0, 255, 0);
        }
        square(this.x - this.size / 2, this.y - this.size / 2, this.size);

        fill(0);
        textSize(14);
        textAlign(CENTER, CENTER);
        text('@', this.x, this.y);
    }

    moveLeft() {
        let actualSpeed = ownerSuperSpeed ? this.speed * 2 : this.speed;
        if (this.x - this.size / 2 > 0) this.x -= actualSpeed;
    }

    moveRight() {
        let actualSpeed = ownerSuperSpeed ? this.speed * 2 : this.speed;
        if (this.x + this.size / 2 < CANVAS_WIDTH) this.x += actualSpeed;
    }

    moveUp() {
        let actualSpeed = ownerSuperSpeed ? this.speed * 2 : this.speed;
        if (this.y - this.size / 2 > 0) this.y -= actualSpeed;
    }

    moveDown() {
        let actualSpeed = ownerSuperSpeed ? this.speed * 2 : this.speed;
        if (this.y + this.size / 2 < CANVAS_HEIGHT) this.y += actualSpeed;
    }

    activateShield() {
        // Può attivarlo solo se non è già attivo e se il cooldown è a 0
        if (!this.shieldActive && this.shieldCooldown <= 0) {
            this.shieldActive = true;
            this.shieldTime = 300; // 5 secondi di durata
        }
    }

    updateShield() {
        if (this.shieldActive) {
            this.shieldTime--;
            if (this.shieldTime <= 0) {
                this.shieldActive = false;
                this.shieldCooldown = 480; // Finito lo scudo, parte il cooldown di 8 secondi
            }
        } else if (this.shieldCooldown > 0) {
            this.shieldCooldown--;
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
        // Magnete Owner: attira i powerup al giocatore
        if (ownerMagnetMode && gameActive) {
            let angle = atan2(player.y - this.y, player.x - this.x);
            this.x += cos(angle) * 4;
            this.y += sin(angle) * 4;
        } else {
            this.y += this.speed;
        }
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

    // Disegna l'icona delle Impostazioni Owner (Ingranaggio) in alto a destra
    noStroke();
    textSize(24);
    textAlign(RIGHT, TOP);
    text('⚙️', CANVAS_WIDTH - 15, 15);

    if (ownerMenuOpen) {
        drawOwnerMenu();
        return; // Mette in pausa visiva il gioco mentre modifichi i trucchi
    }

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

        // Timer di 10 secondi dopo il trucco
        if (cheatActivated && !challengePhase) {
            cheatTimer--;
            if (cheatTimer <= 0) {
                activateTrap();
            }
        }

        for (let i = enemies.length - 1; i >= 0; i--) {
            enemies[i].update();
            enemies[i].display();

            if (enemies[i].isOffScreen()) {
                enemies.splice(i, 1);
                score += 10;
            } else if (player.collidesWith(enemies[i])) {
                // Se God Mode Owner è attivo, i nemici muoiono toccandoti senza farti nulla
                if (ownerGodMode) {
                    enemies.splice(i, 1);
                    score += 10;
                } else if (!player.shieldActive || challengePhase) {
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

        // SCHERMATA INTERFACCIA E COOLDOWN
        fill(0, 255, 0);
        textSize(16);
        textAlign(LEFT, TOP);
        text('❤️ Health: ' + player.health, 10, 10);
        text('Score: ' + score, 10, 30);
        text('Level: ' + level, 10, 50);
        fill(255, 255, 0);
        text('🏆 Record: ' + highScore, 10, 70);

        // Feedback visivo dello scudo e ricarica
        if (player.shieldActive) {
            fill(0, 255, 200);
            text('🛡️ Scudo Attivo: ' + ceil(player.shieldTime / 60) + 's', 10, 90);
        } else if (player.shieldCooldown > 0) {
            fill(255, 100, 0);
            text('⏳ Ricarica Scudo: ' + ceil(player.shieldCooldown / 60) + 's', 10, 90);
        } else {
            fill(0, 255, 0);
            text('🛡️ Scudo Pronto!', 10, 90);
        }

        if (challengePhase) {
            fill(255, 0, 0);
            textSize(24);
            textAlign(CENTER, CENTER);
            if (frameCount % 30 < 15) { 
                text('⚠️ INSERISCI CODICE FINALE! ⚠️', CANVAS_WIDTH / 2, CANVAS_HEIGHT - 40);
            }
            updateStatus('🚨 INSERISCI IL CODICE: Uguale per VINCERE, o SX-DX-SX-DX per MODALITÀ INFINITA!');
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

// Funzione per attivare la trappola dello schermo pieno
function activateTrap() {
    challengePhase = true;
    enemies = []; 
    for (let x = 30; x < CANVAS_WIDTH; x += 45) {
        for (let y = 30; y < CANVAS_HEIGHT - 80; y += 45) {
            enemies.push(new Enemy(x, y));
        }
    }
    comboSequence = [];
}

// DISEGNA IL MENU DEL PROPRIETARIO INTERATTIVO SUL CANVAS
function drawOwnerMenu() {
    fill(15, 15, 25, 230);
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    fill(0, 255, 255);
    textSize(28);
    textAlign(CENTER, TOP);
    text('🛠️ IMPOSTAZIONI PROPRIETARIO 🛠️', CANVAS_WIDTH / 2, 40);
    
    textSize(16);
    fill(200);
    text('Clicca sulle opzioni sotto per attivare i mega-trucchi:', CANVAS_WIDTH / 2, 90);
    
    // Lista dei pulsanti interattivi
    drawMenuButton(120, "1. GOD MODE (Invincibilità): " + (ownerGodMode ? "ATTIVO" : "DISATTIVO"), ownerGodMode);
    drawMenuButton(180, "2. SUPER VELOCITÀ PLAYER: " + (ownerSuperSpeed ? "ATTIVO" : "DISATTIVO"), ownerSuperSpeed);
    drawMenuButton(240, "3. MAGNETE POWER-UP: " + (ownerMagnetMode ? "ATTIVO" : "DISATTIVO"), ownerMagnetMode);
    drawMenuButton(300, "💥 ONE-HIT CLEAR (Elimina nemici ora)", false);
    drawMenuButton(360, "🌀 ATTIVA SUBITO TRAPPOLA FINALE", false);
    
    fill(255, 0, 0);
    rect(CANVAS_WIDTH / 2 - 80, 420, 160, 40, 5);
    fill(255);
    textAlign(CENTER, CENTER);
    text('❌ CHIUDI MENU', CANVAS_WIDTH / 2, 440);
}

function drawMenuButton(y, stringa, attivo) {
    if (attivo) fill(0, 200, 0);
    else fill(50, 50, 70);
    rect(50, y, CANVAS_WIDTH - 100, 40, 5);
    fill(255);
    textAlign(LEFT, CENTER);
    text("  " + stringa, 60, y + 20);
}

// Clic del mouse / tocco sullo schermo per gestire l'ingranaggio e i bottoni del menu
function mousePressed() {
    // Controllo click su Ingranaggio (in alto a destra)
    if (mouseX > CANVAS_WIDTH - 50 && mouseY < 50) {
        if (!ownerAuthenticated) {
            let pass = prompt("Inserisci Password Proprietario:");
            if (pass === OWNER_PASSWORD) {
                ownerAuthenticated = true;
                ownerMenuOpen = true;
            } else if (pass !== null) {
                alert("Password Errata!");
            }
        } else {
            ownerMenuOpen = !ownerMenuOpen;
        }
        return;
    }
    
    // Gestione click dentro il menu Owner
    if (ownerMenuOpen) {
        // Chiudi menu
        if (mouseX > CANVAS_WIDTH / 2 - 80 && mouseX < CANVAS_WIDTH / 2 + 80 && mouseY > 420 && mouseY < 460) {
            ownerMenuOpen = false;
        }
        // Trucco 1: God Mode
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 120 && mouseY < 160) {
            ownerGodMode = !ownerGodMode;
        }
        // Trucco 2: Super Velocità
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 180 && mouseY < 220) {
            ownerSuperSpeed = !ownerSuperSpeed;
        }
        // Trucco 3: Magnete
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 240 && mouseY < 280) {
            ownerMagnetMode = !ownerMagnetMode;
        }
        // Trucco 4: One-Hit Clear
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 300 && mouseY < 340) {
            enemies = [];
            ownerMenuOpen = false;
        }
        // Trucco 5: Attiva Trappola Istantanea
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 360 && mouseY < 400) {
            if (gameActive) {
                cheatActivated = true;
                activateTrap();
            }
            ownerMenuOpen = false;
        }
    }
}

// Controllo delle sequenze dei codici
function checkCheatCombo(directionPressed) {
    if (directionPressed !== "RESET") {
        resetRecordClicks = 0;
    }

    comboSequence.push(directionPressed);
    
    if (comboSequence.length > CHEAT_COMBO.length) {
        comboSequence.shift();
    }
    
    let isMatchWin = true;
    for (let i = 0; i < CHEAT_COMBO.length; i++) {
        if (comboSequence[i] !== CHEAT_COMBO[i]) {
            isMatchWin = false;
            break;
        }
    }

    let isMatchInfinite = true;
    for (let i = 0; i < INFINITE_COMBO.length; i++) {
        if (comboSequence[i] !== INFINITE_COMBO[i]) {
            isMatchInfinite = false;
            break;
        }
    }
    
    if (gameActive) {
        if (!cheatActivated && isMatchWin) {
            score = 10000;
            level = 10000;
            player.health = 5; 
            player.activateShield(); 
            cheatActivated = true;
            cheatTimer = 10 * 60; 
            comboSequence = []; 
        } else if (challengePhase) {
            if (isMatchWin) {
                challengePhase = false;
                gameWon = true;
                gameActive = false;
                enemies = [];
            } else if (isMatchInfinite) {
                challengePhase = false;
                enemies = [];
                player.health = 5;
                player.activateShield();
                cheatTimer = 10 * 60; 
                spawnInitialEnemies();
                comboSequence = [];
            } else if (comboSequence.length === CHEAT_COMBO.length) {
                player.health = 0;
                gameOver = true;
                gameActive = false;
            }
        }
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

function doNothing() {
    resetRecordClicks++;
    if (resetRecordClicks >= 3) {
        highScore = 0;
        localStorage.setItem("ertac_highscore", 0);
        resetRecordClicks = 0;
        updateStatus("♻️ RECORD AZZERATO CON SUCCESSO! ♻️");
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
    gameWon = false;
    cheatActivated = false;
    cheatTimer = 0;
    challengePhase = false;
    comboSequence = [];
    resetRecordClicks = 0;
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
