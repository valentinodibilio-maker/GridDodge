// --- VARIABILI DI GIOCO ---
let player;
let enemies = [];
let powerups = [];
let score = 0;
let highScore = 0;
let lives = 3;
let gameOver = false;
let gameStarted = false;

// --- CONFIGURAZIONE SCUDO ---
let shieldActive = false;
let shieldTimer = 0;
let shieldCooldown = 0;
const SHIELD_DURATION = 180; // 3 secondi a 60fps
const SHIELD_COOLDOWN_TIME = 600; // 10 secondi di ricarica

// --- OWNER MENU & TRUCCHI ---
let showAdminMenu = false;
let passwordCorrect = false;
let godMode = false;
let magnetMode = false;
let superSpeed = false;
const ADMIN_PASSWORD = "admin"; // Puoi cambiare la password qui

// --- VARIABILI DI MOVIMENTO (per i pulsanti HTML) ---
let moveDir = "";

function setup() {
  // RIGA FONDAMENTALE PER GITHUB PAGES: si aggancia al div HTML
  let canvas = createCanvas(400, 450);
  canvas.parent('p5-container');
  
  // Carica il record locale se esiste
  if (localStorage.getItem("gridDodgeHighScore")) {
    highScore = parseInt(localStorage.getItem("gridDodgeHighScore"));
  }
  
  resetGame();
}

function draw() {
  background(20);
  
  // Disegna l'interfaccia di stato superiore
  drawUI();

  if (!gameStarted) {
    drawStartScreen();
    return;
  }

  if (gameOver) {
    drawGameOverScreen();
    return;
  }

  // --- LOGICA DI GIOCO ATTIVA ---
  
  // Gestione trucchi e movimenti
  let currentSpeed = superSpeed ? 8 : 4;
  handleHTMLControls(currentSpeed);

  // Aggiorna e mostra il giocatore
  player.update();
  player.display();

  // Gestione Scudo
  if (shieldActive) {
    shieldTimer--;
    if (shieldTimer <= 0) shieldActive = false;
  }
  if (shieldCooldown > 0) shieldCooldown--;

  // Generazione progressiva nemici e power-up
  if (frameCount % max(10, 40 - floor(score / 5)) === 0) {
    enemies.push(new Enemy());
  }
  if (frameCount % 120 === 0) {
    powerups.push(new PowerUp());
  }

  // Ciclo Nemici
  for (let i = enemies.length - 1; i >= 0; i--) {
    enemies[i].update();
    enemies[i].display();

    // Collisione con lo scudo attivo
    if (shieldActive && player.intersects(enemies[i])) {
      enemies.splice(i, 1);
      score += 2;
      continue;
    }

    // Collisione con il giocatore
    if (player.intersects(enemies[i])) {
      if (!godMode && !shieldActive) {
        lives--;
        document.getElementById("gameStatus").innerText = "Colpito! Vite rimaste: " + lives;
        if (lives <= 0) {
          endGame();
        }
      }
      enemies.splice(i, 1);
      continue;
    }

    // Rimuovi nemici fuori schermo
    if (enemies[i].y > height) {
      enemies.splice(i, 1);
      score++;
    }
  }

  // Ciclo Power-Up
  for (let i = powerups.length - 1; i >= 0; i--) {
    if (magnetMode) {
      powerups[i].attractTo(player.x, player.y);
    }
    
    powerups[i].update();
    powerups[i].display();

    if (player.intersects(powerups[i])) {
      if (powerups[i].type === "HEART") {
        lives = min(5, lives + 1);
        document.getElementById("gameStatus").innerText = "Vita recuperata!";
      } else {
        score += 10;
        document.getElementById("gameStatus").innerText = "+10 Punti Stella!";
      }
      powerups.splice(i, 1);
      continue;
    }

    if (powerups[i].y > height) {
      powerups.splice(i, 1);
    }
  }

  // Mostra il menu di amministrazione se attivo
  if (showAdminMenu) {
    drawAdminOverlay();
  }
}

// --- FUNZIONI DI SUPPORTO DI INTERFACCIA ---
function drawUI() {
  // Barra dei punteggi superiore
  fill(0, 255, 0);
  textSize(16);
  textAlign(LEFT, TOP);
  text("PUNTI: " + score, 15, 15);
  textAlign(RIGHT, TOP);
  text("RECORD: " + highScore, width - 50, 15);

  // Disegna l'ingranaggio del menu segreto in alto a destra
  push();
  stroke(0, 255, 0);
  strokeWeight(2);
  noFill();
  translate(width - 25, 23);
  for (let i = 0; i < 8; i++) {
    rotate(PI / 4);
    line(0, 0, 10, 0);
  }
  ellipse(0, 0, 12, 12);
  pop();

  // Visualizzazione cuori della vita
  textAlign(LEFT, TOP);
  let heartStr = "";
  for (let i = 0; i < lives; i++) heartStr += "❤️";
  text(heartStr, 15, 40);

  // Indicatore Scudo Disponibile / In Ricarica
  if (shieldActive) {
    fill(0, 191, 255);
    text("🛡️ ATTIVO", 15, 65);
  } else if (shieldCooldown > 0) {
    fill(255, 100, 100);
    text("⏳ RICARICA: " + ceil(shieldCooldown / 60) + "s", 15, 65);
  } else {
    fill(255, 255, 0);
    text("🛡️ PRONTO", 15, 65);
  }
  
  // Scritta Trucchi Attivi
  if (godMode || magnetMode || superSpeed) {
    fill(255, 0, 255);
    textAlign(CENTER, TOP);
    text("⚡ TRUCCHI ATTIVI ⚡", width / 2, 40);
  }
}

function drawStartScreen() {
  textAlign(CENTER, CENTER);
  fill(0, 255, 0);
  textSize(24);
  text("DODGE MASTERS", width / 2, height / 2 - 20);
  textSize(16);
  fill(255);
  text("Usa i tasti sotto per muoverti\ne attivare lo scudo.", width / 2, height / 2 + 20);
}

function drawGameOverScreen() {
  textAlign(CENTER, CENTER);
  fill(255, 0, 0);
  textSize(32);
  text("GAME OVER", width / 2, height / 2 - 20);
  textSize(18);
  fill(255);
  text("Punteggio Finale: " + score, width / 2, height / 2 + 20);
}

function drawAdminOverlay() {
  fill(0, 0, 0, 230);
  rect(0, 0, width, height);
  fill(0, 255, 0);
  textAlign(CENTER, TOP);
  textSize(20);
  text("⚙️ OWNER PANEL ⚙️", width / 2, 80);

  if (!passwordCorrect) {
    textSize(14);
    fill(255);
    text("Pannello protetto.\nClicca qui per inserire la password.", width / 2, height / 2 - 20);
  } else {
    textSize(16);
    fill(godMode ? 255 : 100, godMode ? 0 : 255, godMode ? 255 : 100);
    text("[1] GOD MODE: " + (godMode ? "ON" : "OFF"), width / 2, 160);
    fill(magnetMode ? 255 : 100, magnetMode ? 0 : 255, magnetMode ? 255 : 100);
    text("[2] MAGNETE: " + (magnetMode ? "ON" : "OFF"), width / 2, 210);
    fill(superSpeed ? 255 : 100, superSpeed ? 0 : 255, superSpeed ? 255 : 100);
    text("[3] SUPER VELOCITÀ: " + (superSpeed ? "ON" : "OFF"), width / 2, 260);
    
    fill(255, 100, 100);
    text("Clicca sullo schermo per uscire", width / 2, height - 80);
  }
}

// --- LOGICA DEL CLICK SUL CANVAS (Menu Segreto & Trucchi) ---
function mousePressed() {
  // Verifica se viene cliccata la zona dell'ingranaggio in alto a destra
  if (mouseX > width - 40 && mouseX < width && mouseY > 0 && mouseY < 50) {
    showAdminMenu = !showAdminMenu;
    return;
  }

  if (showAdminMenu) {
    if (!passwordCorrect) {
      let pwd = prompt("Inserisci la Password Amministratore:");
      if (pwd === ADMIN_PASSWORD) {
        passwordCorrect = true;
        alert("Accesso eseguito, Benvenuto Proprietario!");
      } else if (pwd !== null) {
        alert("Password errata!");
      }
    } else {
      // Seleziona i trucchi cliccando sulle varie altezze dello schermo
      if (mouseY > 140 && mouseY < 180) godMode = !godMode;
      if (mouseY > 190 && mouseY < 230) magnetMode = !magnetMode;
      if (mouseY > 240 && mouseY < 280) superSpeed = !superSpeed;
      
      // Cliccando in fondo si esce
      if (mouseY > height - 100) showAdminMenu = false;
    }
  }
}

// --- CONTROLLI HTML INPUT ---
function handleHTMLControls(speed) {
  if (moveDir === "UP") player.y = max(80, player.y - speed);
  if (moveDir === "DOWN") player.y = min(height - 20, player.y + speed);
  if (moveDir === "LEFT") player.x = max(20, player.x - speed);
  if (moveDir === "RIGHT") player.x = min(width - 20, player.x + speed);
}

// Interfacce collegate ai bottoni dell'HTML
function moveUp() { if(!gameStarted) gameStarted = true; moveDir = "UP"; }
function moveDown() { moveDir = "DOWN"; }
function moveLeft() { moveDir = "LEFT"; }
function moveRight() { moveDir = "RIGHT"; }
function stopMove() { moveDir = ""; }

function activateShield() {
  if (!gameStarted || gameOver || shieldCooldown > 0 || shieldActive) return;
  shieldActive = true;
  shieldTimer = SHIELD_DURATION;
  shieldCooldown = SHIELD_COOLDOWN_TIME;
  document.getElementById("gameStatus").innerText = "Scudo attivazione temporanea!";
}

function restartGame() {
  resetGame();
}
function doNothing() {}

function resetGame() {
  player = new Player(width / 2, height - 50);
  enemies = [];
  powerups = [];
  score = 0;
  lives = 3;
  shieldActive = false;
  shieldTimer = 0;
  shieldCooldown = 0;
  gameOver = false;
  document.getElementById("gameStatus").innerText = "Gioco pronto! Schiva tutto!";
}

function endGame() {
  gameOver = true;
  document.getElementById("gameStatus").innerText = "Partita finita! Premi RICOMINCIA.";
  if (score > highScore) {
    highScore = score;
    localStorage.setItem("gridDodgeHighScore", highScore);
  }
}

// --- CLASSI DEL GIOCO (Player, Enemy, PowerUp) ---
class Player {
  constructor(x, y) {
    this.x = x;
    this.y = y;
    this.r = 15;
  }
  update() {
    this.x = constrain(this.x, this.r, width - this.r);
    this.y = constrain(this.y, 80 + this.r, height - this.r);
  }
  display() {
    push();
    if (shieldActive) {
      stroke(0, 191, 255);
      strokeWeight(3);
      noFill();
      ellipse(this.x, this.y, this.r * 3);
    }
    noStroke();
    fill(godMode ? 255 : 0, godMode ? 0 : 255, godMode ? 255 : 0);
    rectMode(CENTER);
    rect(this.x, this.y, this.r * 2, this.r * 2, 4);
    pop();
  }
  intersects(other) {
    let d = dist(this.x, this.y, other.x, other.y);
    return d < this.r + other.r;
  }
}

class Enemy {
  constructor() {
    this.x = random(20, width - 20);
    this.y = 50;
    this.r = random(10, 18);
    this.speed = random(2, 5) + (score * 0.05); // Aumenta con i punti
  }
  update() {
    this.y += this.speed;
  }
  display() {
    push();
    fill(255, 50, 50);
    noStroke();
    ellipse(this.x, this.y, this.r * 2);
    pop();
  }
}

class PowerUp {
  constructor() {
    this.x = random(20, width - 20);
    this.y = 50;
    this.r = 12;
    this.type = random(1) > 0.75 ? "HEART" : "STAR";
    this.speed = 2;
  }
  update() {
    this.y += this.speed;
  }
  attractTo(tx, ty) {
    this.x = lerp(this.x, tx, 0.05);
    this.y = lerp(this.y, ty, 0.05);
  }
  display() {
    push();
    textAlign(CENTER, CENTER);
    textSize(this.r * 2);
    text(this.type === "HEART" ? "❤️" : "⭐", this.x, this.y);
    pop();
  }
}
