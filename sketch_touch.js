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

// --- NUOVO SISTEMA OWNER SENZA PROMPT DEL BROWSER ---
let ownerMenuOpen = false;
let insertModeActive = false; // Stato di inserimento password grafico
let passwordSequence = [];
let OWNER_PASS_CODE = ["SU", "SU", "GIU", "GIU"]; // La tua nuova password di pulsanti!

// Opzioni Trucchi Owner
let ownerGodMode = false;
let ownerSuperSpeed = false;
let ownerMagnetMode = false;
let comboCheatsEnabled = true; 

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
        this.shieldCooldown = 0; 
    }

    display() {
        if (this.shieldActive) {
            fill(0, 255, 200);
            stroke(0, 255, 200);
            strokeWeight(2);
            circle(this.x, this.y, this.size + 15);
            noStroke();
        }

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
        if (!this.shieldActive && this.shieldCooldown <= 0) {
            this.shieldActive = true;
            this.shieldTime = 300; 
        }
    }

    updateShield() {
        if (this.shieldActive) {
            this.shieldTime--;
            if (this.shieldTime <= 0) {
                this.shieldActive = false;
                this.shieldCooldown = 480; 
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

    // Schermata di inserimento password grafica nativa
    if (insertModeActive) {
        drawInsertPasswordScreen();
        drawSettingsIcon();
        return;
    }

    // Schermata del Menu Owner aperta
    if (ownerMenuOpen) {
        drawOwnerMenu();
        drawSettingsIcon();
        return; 
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
            updateStatus('🚨 INSERISCI IL CODICE CON I PULSANTI VERDI PER VINCERE!');
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

    drawSettingsIcon();
}

function drawSettingsIcon() {
    noStroke();
    textSize(26);
    textAlign(RIGHT, TOP);
    fill(255);
    text('⚙️', CANVAS_WIDTH - 15, 15);
}

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

// NUOVA SCHERMATA GRAFICA PER LA PASSWORD (EVITA I COLOGNAMENTI MOBILE)
function drawInsertPasswordScreen() {
    fill(20, 20, 40, 250);
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    fill(0, 255, 255);
    textSize(24);
    textAlign(CENTER, TOP);
    text('🔑 ACCESSO SICURO PROPRIETARIO', CANVAS_WIDTH / 2, 50);
    
    fill(200);
    textSize(16);
    text('Usa i tasti direzionali verdi per inserire la sequenza.', CANVAS_WIDTH / 2, 110);
    text('La password attuale richiede 4 movimenti.', CANVAS_WIDTH / 2, 140);
    
    // Mostra quanti pallini/caratteri sono stati inseriti
    textSize(28);
    let asterischi = "";
    for(let i=0; i<passwordSequence.length; i++) {
        asterischi += "🔴 ";
    }
    if(passwordSequence.length === 0) asterischi = "(In attesa dei tasti...)";
    fill(255, 255, 0);
    text(asterischi, CANVAS_WIDTH / 2, 210);

    // Tasto cancella/annulla grafico
    fill(100, 50, 50);
    rect(CANVAS_WIDTH / 2 - 80, 320, 160, 40, 5);
    fill(255);
    textSize(16);
    text('Annulla', CANVAS_WIDTH / 2, 340);
}

function drawOwnerMenu() {
    fill(15, 15, 25, 250);
    rect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    
    fill(0, 255, 255);
    textSize(26);
    textAlign(CENTER, TOP);
    text('🛠️ IMPOSTAZIONI PROPRIETARIO 🛠️', CANVAS_WIDTH / 2, 25);
    
    drawMenuButton(75, "1. GOD MODE (Invincibilità): " + (ownerGodMode ? "ATTIVO" : "DISATTIVO"), ownerGodMode);
    drawMenuButton(125, "2. SUPER VELOCITÀ PLAYER: " + (ownerSuperSpeed ? "ATTIVO" : "DISATTIVO"), ownerSuperSpeed);
    drawMenuButton(175, "3. MAGNETE POWER-UP: " + (ownerMagnetMode ? "ATTIVO" : "DISATTIVO"), ownerMagnetMode);
    drawMenuButton(225, "🎹 TRUCCHI COMBO (SU-GIU-SX-DX): " + (comboCheatsEnabled ? "ABILITATI" : "DISABILITATI"), comboCheatsEnabled);
    
    drawMenuButton(285, "💥 ONE-HIT CLEAR (Elimina nemici ora)", false);
    drawMenuButton(335, "🌀 ATTIVA SUBITO TRAPPOLA FINALE", false);
    
    fill(218, 165, 32);
    rect(50, 385, CANVAS_WIDTH - 100, 35, 5);
    fill(255);
    textAlign(CENTER, CENTER);
    textSize(14);
    text('🔑 REIMPOSTA PASSWORD OWNER A DEFAULT', CANVAS_WIDTH / 2, 402);
    
    fill(255, 0, 0);
    rect(CANVAS_WIDTH / 2 - 100, 440, 200, 40, 5);
    fill(255);
    textSize(16);
    text('❌ CHIUDI E BLOCCA', CANVAS_WIDTH / 2, 460);
}

function drawMenuButton(y, stringa, attivo) {
    if (attivo) fill(0, 200, 0);
    else fill(45, 45, 60);
    rect(50, y, CANVAS_WIDTH - 100, 35, 5);
    fill(255);
    textAlign(LEFT, CENTER);
    textSize(14);
    text("  " + stringa, 60, y + 17);
}

function mousePressed() {
    // Intercettazione dell'ingranaggio
    if (mouseX > CANVAS_WIDTH - 60 && mouseX < CANVAS_WIDTH && mouseY > 0 && mouseY < 60) {
        if (!ownerMenuOpen && !insertModeActive) {
            insertModeActive = true;
            passwordSequence = []; // Svuota i tentativi precedenti
        } else {
            ownerMenuOpen = false;
            insertModeActive = false;
        }
        return;
    }
    
    if (insertModeActive) {
        // Tasto Annulla dentro la schermata password
        if (mouseX > CANVAS_WIDTH / 2 - 80 && mouseX < CANVAS_WIDTH / 2 + 80 && mouseY > 320 && mouseY < 360) {
            insertModeActive = false;
        }
        return;
    }

    if (ownerMenuOpen) {
        if (mouseX > CANVAS_WIDTH / 2 - 100 && mouseX < CANVAS_WIDTH / 2 + 100 && mouseY > 440 && mouseY < 480) {
            ownerMenuOpen = false;
        }
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 75 && mouseY < 110) {
            ownerGodMode = !ownerGodMode;
        }
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 125 && mouseY < 160) {
            ownerSuperSpeed = !ownerSuperSpeed;
        }
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 175 && mouseY < 210) {
            ownerMagnetMode = !ownerMagnetMode;
        }
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 225 && mouseY < 260) {
            comboCheatsEnabled = !comboCheatsEnabled;
        }
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 285 && mouseY < 320) {
            enemies = [];
            ownerMenuOpen = false;
        }
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 335 && mouseY < 370) {
            if (gameActive) {
                cheatActivated = true;
                activateTrap();
            }
            ownerMenuOpen = false;
        }
        if (mouseX > 50 && mouseX < CANVAS_WIDTH - 50 && mouseY > 385 && mouseY < 420) {
            OWNER_PASS_CODE = ["SU", "SU", "GIU", "GIU"];
            updateStatus("Password resettata a: SU SU GIU GIU");
        }
    }
}

// Gestione dell'input dei pulsanti per la password o per i trucchi
function handleOwnerPasswordInput(direction) {
    if (!insertModeActive) return false;

    passwordSequence.push(direction);

    // Controlla se la sequenza inserita combacia con la password
    let valid = true;
    if (passwordSequence.length === OWNER_PASS_CODE.length) {
        for (let i = 0; i < OWNER_PASS_CODE.length; i++) {
            if (passwordSequence[i] !== OWNER_PASS_CODE[i]) {
                valid = false;
            }
        }
        
        if (valid) {
            insertModeActive = false;
            ownerMenuOpen = true; 
        } else {
            passwordSequence = []; // Sbagliata, resetta e riprova
            updateStatus("❌ Sequenza errata! Riprova.");
        }
    }
    return true; // Blocca i movimenti del player durante l'inserimento
}

function checkCheatCombo(directionPressed) {
    if (directionPressed !== "RESET") {
        resetRecordClicks = 0;
    }

    // Se stiamo digitando la password del menu, intercetta qui e non muovere il giocatore
    if (handleOwnerPasswordInput(directionPressed)) return;

    if (!comboCheatsEnabled) return;

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
    check