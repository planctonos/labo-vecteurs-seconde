let currentGame = 'basket-norme';
let score = 0, tries = 0, sessionEssais = 0;
let ballonPos, ballonVitesse, panierPos;
let pointsGrid = [], ptStart, ptEnd, userVec;
let estEnTrainDeViser = false, estLance = false, animationTranslation = false;
let animProgress = 0, message = "";

const GRAVITE = 0.25;
const SOL_Y = 450;
const COTE = 40; 
const ORIGINE_USER = { x: 560, y: 280 }; 

// Variables globales spécifiques au Mode Découverte
let decPhase = 'demo'; // États possibles : 'demo', 'choix', 'validation'
let decPtStart, decPtEnd, decAnimPos;
let decDemoCount = 0;
let decChoices = [];
let decSelectedVec = null;

function setup() {
    let canvas = createCanvas(800, 550);
    canvas.parent('canvas-container');
    initGame();
}

function draw() {
    background(245, 250, 255);
    if (currentGame === 'translation') drawTranslationMode();
    else if (currentGame === 'decouverte') drawDecouverteMode();
    else drawBasketMode();
    if (message !== "") drawOverlay();
}

function initGame(newLevel = true) {
    message = "";
    estLance = false;
    estEnTrainDeViser = false;
    animationTranslation = false;
    animProgress = 0;

    if (currentGame === 'translation') {
        if (newLevel) genererPointsUnique(8);
        ptStart = random(pointsGrid);
        do { ptEnd = random(pointsGrid); } while (ptStart === ptEnd);
        userVec = createVector(0, 0);
    } else if (currentGame === 'decouverte') {
        decPhase = 'demo';
        decDemoCount = 0;
        decSelectedVec = null;
        if (newLevel) {
            // Positionne le point de départ aléatoirement sur la grille de gauche
            decPtStart = createVector(floor(random(2, 11)) * COTE, floor(random(2, 12)) * COTE);
            // Positionne le point d'arrivée avec une distance minimale pour l'aspect visuel
            do {
                decPtEnd = createVector(floor(random(2, 11)) * COTE, floor(random(2, 12)) * COTE);
            } while (p5.Vector.dist(decPtStart, decPtEnd) < 3 * COTE);
        }
        generateDecouverteChoices();
    } else {
        ballonPos = createVector(100, SOL_Y - 40);
        if (newLevel) panierPos = createVector(random(450, 750), random(150, 300));
        ballonVitesse = createVector(0, 0);
    }
}

function genererPointsUnique(nb) {
    pointsGrid = [];
    let noms = "ABCDEFGH".split("");
    while (pointsGrid.length < nb) {
        let newPt = { x: floor(random(1, 8)), y: floor(random(2, 11)), nom: noms[pointsGrid.length] };
        if (!pointsGrid.some(p => p.x === newPt.x && p.y === newPt.y)) pointsGrid.push(newPt);
    }
}

// --- LOGIQUE DU MODE DÉCOUVERTE ---

function generateDecouverteChoices() {
    // Calcul des composantes mathématiques du vecteur (Y inversé pour repère standard)
    let dx = round((decPtEnd.x - decPtStart.x) / COTE);
    let dy = round(-(decPtEnd.y - decPtStart.y) / COTE);
    
    let choicesSet = new Set();
    choicesSet.add(`${dx},${dy}`); // Vecteur correct
    
    // Distracteurs et pièges classiques (inversions d'axes, de signes)
    let candidates = [
        `${dx},${-dy}`,
        `${-dx},${dy}`,
        `${-dx},${-dy}`,
        `${dy},${dx}`,
        `${dx + 1},${dy}`,
        `${dx},${dy - 1}`,
        `${dx - 1},${dy + 1}`
    ];
    
    for (let c of candidates) {
        if (choicesSet.size >= 4) break;
        if (c !== `${dx},${dy}`) choicesSet.add(c);
    }
    
    while (choicesSet.size < 4) {
        choicesSet.add(`${floor(random(-5, 6))},${floor(random(-5, 6))}`);
    }
    
    let arr = Array.from(choicesSet);
    arr.sort(() => random() - 0.5); // Mélange des boutons
    
    decChoices = arr.map((str, i) => {
        let p = str.split(",");
        let bDx = parseInt(p[0]);
        let bDy = parseInt(p[1]);
        return {
            dx: bDx,
            dy: bDy,
            pixelVec: createVector(bDx * COTE, -bDy * COTE),
            isCorrect: (bDx === dx && bDy === dy),
            x: 550,
            y: 120 + i * 90,
            w: 220,
            h: 65
        };
    });
}

function drawDecouverteMode() {
    // Dessin de la grille principale sur la partie gauche (largeur 520)
    drawGrid(0, 0, 520, height);
    stroke(44, 62, 80); strokeWeight(2); line(530, 0, 530, height);

    // Dessin des deux objets fixes identiques (A: départ, B: arrivée)
    drawIdenticalObject(decPtStart.x, decPtStart.y, "#3498db");
    drawIdenticalObject(decPtEnd.x, decPtEnd.y, "#2ecc71");

    fill(44, 62, 80); noStroke(); textStyle(BOLD); textSize(16); textAlign(CENTER, CENTER);
    text("A", decPtStart.x, decPtStart.y - 25);
    text("B", decPtEnd.x, decPtEnd.y - 25);

    // 1. PHASE DÉMONSTRATION AUTOMATIQUE (3 fois)
    if (decPhase === 'demo') {
        animProgress += 0.015;
        decAnimPos = p5.Vector.lerp(decPtStart, decPtEnd, animProgress);
        
        // Tracé du vecteur temporaire de démonstration
        stroke(231, 76, 60); strokeWeight(3);
        line(decPtStart.x, decPtStart.y, decAnimPos.x, decAnimPos.y);
        
        drawIdenticalObject(decAnimPos.x, decAnimPos.y, "#e74c3c");
        
        fill(44, 62, 80); noStroke(); textStyle(NORMAL); textAlign(CENTER); textSize(16);
        text(`Observe la translation (Animation : ${decDemoCount + 1}/3)`, 260, 35);
        
        if (animProgress >= 1) {
            animProgress = 0;
            decDemoCount++;
            if (decDemoCount >= 3) {
                decPhase = 'choix';
            }
        }
    } 
    // 2. PHASE ATTENTE DU CHOIX DE L'ÉLÈVE
    else if (decPhase === 'choix') {
        fill(44, 62, 80); noStroke(); textStyle(NORMAL); textAlign(CENTER); textSize(16);
        text("Quel vecteur correspond à cette translation ?", 260, 35);
        drawDecouverteButtons();
    } 
    // 3. PHASE ANIMATION DE VALIDATION DU VECTEUR CHOISI
    else if (decPhase === 'validation') {
        animProgress += 0.02;
        let targetPos = p5.Vector.add(decPtStart, decSelectedVec.pixelVec);
        decAnimPos = p5.Vector.lerp(decPtStart, targetPos, animProgress);
        
        stroke(155, 89, 182); strokeWeight(3);
        line(decPtStart.x, decPtStart.y, decAnimPos.x, decAnimPos.y);
        
        drawIdenticalObject(decAnimPos.x, decAnimPos.y, "#9b59b6");
        
        fill(44, 62, 80); noStroke(); textStyle(NORMAL); textAlign(CENTER); textSize(16);
        text("Déplacement de l'objet selon ton vecteur...", 260, 35);
        
        drawDecouverteButtons();

        if (animProgress >= 1) {
            animProgress = 0;
            tries++;
            if (decSelectedVec.isCorrect) {
                score++;
                message = "RÉUSSI !";
                logToTable(`u(${decSelectedVec.dx} ; ${decSelectedVec.dy})`, true);
            } else {
                message = "ERREUR";
                logToTable(`u(${decSelectedVec.dx} ; ${decSelectedVec.dy})`, false);
            }
            updateScoreUI();
        }
    }
}

function drawIdenticalObject(x, y, col) {
    push();
    translate(x, y);
    fill(col);
    stroke(44, 62, 80);
    strokeWeight(2);
    ellipse(0, 0, 24, 24);
    fill(255, 180);
    ellipse(0, 0, 10, 10);
    pop();
}

function drawDecouverteButtons() {
    push();
    textAlign(CENTER, CENTER);
    
    fill(44, 62, 80); noStroke(); textStyle(BOLD); textSize(16);
    text("Vecteurs proposés :", 665, 80);
    
    for (let btn of decChoices) {
        let isHover = (decPhase === 'choix' && mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h);
        
        if (decPhase === 'validation' && decSelectedVec === btn) {
            fill(155, 89, 182, 45);
            stroke(155, 89, 182);
        } else {
            fill(isHover ? 240 : 255);
            stroke(200);
        }
        
        strokeWeight(2);
        rect(btn.x, btn.y, btn.w, btn.h, 8);
        
        // Mini flèche indicative dessinée à l'intérieur du bouton
        let arrowBase = createVector(btn.x + 35, btn.y + btn.h / 2);
        let displayVec = btn.pixelVec.copy().setMag(25);
        drawArrow(arrowBase, displayVec, '#2c3e50', "");
        
        // Coordonnées du vecteur u (x ; y)
        fill(44, 62, 80); noStroke(); textStyle(BOLD); textSize(16);
        text(`u (${btn.dx} ; ${btn.dy})`, btn.x + 135, btn.y + btn.h / 2);
    }
    pop();
}

// --- FIN LOGIQUE MODE DÉCOUVERTE ---

function drawTranslationMode() {
    drawGrid(0, 0, 360, height);
    drawGrid(400, 0, width, height);
    stroke(44, 62, 80); strokeWeight(2); line(380, 0, 380, height);

    for (let p of pointsGrid) {
        fill(44, 62, 80); noStroke();
        ellipse(p.x * COTE, p.y * COTE, 10);
        textSize(16); textStyle(BOLD);
        text(p.nom, p.x * COTE + 12, p.y * COTE - 12);
    }

    if (animationTranslation) {
        animProgress += 0.02;
        let currentX = lerp(ptStart.x * COTE, (ptStart.x * COTE) + userVec.x, animProgress);
        let currentY = lerp(ptStart.y * COTE, (ptStart.y * COTE) + userVec.y, animProgress);
        fill(231, 76, 60); noStroke(); ellipse(currentX, currentY, 15);
        if (animProgress >= 1) { checkTranslation(); animationTranslation = false; }
    }

    fill(44, 62, 80); textAlign(CENTER); textSize(17); textStyle(NORMAL);
    text(`Crée un vecteur u permettant un déplacement du point ${ptStart.nom} au point ${ptEnd.nom}`, width / 2, 40);

    let base = createVector(ORIGINE_USER.x, ORIGINE_USER.y);
    fill(52, 152, 219); ellipse(base.x, base.y, 8);
    drawArrow(base, userVec, '#3498db', `u (${userVec.x / COTE} ; ${-userVec.y / COTE})`);

    fill(39, 174, 96); noStroke(); rect(width - 130, height - 60, 110, 40, 5);
    fill(255); textSize(16); text("VALIDER", width - 75, height - 35);
}

function checkTranslation() {
    tries++;
    let targetX = (ptEnd.x - ptStart.x) * COTE;
    let targetY = (ptEnd.y - ptStart.y) * COTE;
    if (userVec.x === targetX && userVec.y === targetY) { score++; message = "RÉUSSI !"; }
    else { message = "ERREUR"; userVec = createVector(targetX, targetY); }
    updateScoreUI();
    logToTable(`(${targetX/COTE};${-targetY/COTE})`, message === "RÉUSSI !");
}

function drawBasketMode() {
    fill(127, 140, 141); noStroke(); rect(0, SOL_Y, width, height - SOL_Y);
    fill(46, 204, 113); rect(0, SOL_Y - 5, width, 5);
    fill(255); stroke(0); rect(panierPos.x + 35, panierPos.y - 80, 10, 100);
    stroke(231, 76, 60); noFill(); strokeWeight(4); ellipse(panierPos.x, panierPos.y, 65, 15);
    
    if (estLance) {
        ballonVitesse.y += GRAVITE; ballonPos.add(ballonVitesse);
        if (dist(ballonPos.x, ballonPos.y, panierPos.x, panierPos.y) < 35) finishBasket(true);
        else if (ballonPos.y > SOL_Y || ballonPos.x > width || ballonPos.x < 0) finishBasket(false);
    } else if (estEnTrainDeViser) {
        let v = p5.Vector.sub(ballonPos, createVector(mouseX, mouseY));
        if (currentGame === 'basket-norme') v = createVector(1, -1).setMag(v.mag());
        if (currentGame === 'basket-direction') v.setMag(140);
        drawArrow(ballonPos, v, '#e74c3c', "Norme: " + v.mag().toFixed(0));
        window.tempVec = v;
    }
    fill(211, 84, 0); stroke(0); strokeWeight(2); ellipse(ballonPos.x, ballonPos.y, 40);
}

function finishBasket(win) {
    estLance = false; message = win ? "RÉUSSI !" : "MANQUÉ !";
    if (win) score++; tries++; updateScoreUI();
    logToTable(currentGame === 'basket-norme' ? window.tempVec.mag().toFixed(0) : "Vecteur", win);
}

function drawGrid(x1, y1, x2, y2) {
    stroke(200, 150); strokeWeight(1);
    for (let x = x1; x <= x2; x += COTE) line(x, y1, x, y2);
    for (let y = y1; y <= y2; y += COTE) line(x1, y, x2, y);
}

function drawArrow(base, vec, col, txt) {
    push(); stroke(col); fill(col); strokeWeight(4); translate(base.x, base.y);
    line(0, 0, vec.x, vec.y); rotate(vec.heading());
    triangle(vec.mag() - 12, 6, vec.mag() - 12, -6, vec.mag(), 0);
    pop();
    noStroke(); fill(col); textAlign(CENTER); text(txt, base.x + vec.x, base.y + vec.y - 15);
}

function drawOverlay() {
    rectMode(CENTER); fill(255, 240); noStroke(); rect(width/2, height/2, 400, 150, 10);
    textAlign(CENTER); textSize(40); fill(44, 62, 80); text(message, width / 2, height / 2);
    textSize(18); text("Clique pour continuer", width / 2, height / 2 + 45); rectMode(CORNER);
}

function switchGame(mode, btn) {
    currentGame = mode;
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('table-body').innerHTML = "";
    sessionEssais = 0; initGame(true);
}

function mousePressed() {
    if (message !== "") { 
        // Si l'élève échoue en mode découverte, on efface le message pour le remettre en phase de choix sur la MÊME configuration
        if (currentGame === 'decouverte' && message === "ERREUR") {
            message = "";
            decPhase = 'choix';
            animProgress = 0;
        } else {
            initGame(message === "RÉUSSI !"); 
        }
        return; 
    }
    
    if (currentGame === 'translation') {
        if (mouseX > width - 130 && mouseY > height - 60) { animationTranslation = true; animProgress = 0; }
        else if (mouseX > 400) estEnTrainDeViser = true;
    } else if (currentGame === 'decouverte') {
        if (decPhase === 'choix') {
            for (let btn of decChoices) {
                if (mouseX > btn.x && mouseX < btn.x + btn.w && mouseY > btn.y && mouseY < btn.y + btn.h) {
                    decSelectedVec = btn;
                    decPhase = 'validation';
                    animProgress = 0;
                    break;
                }
            }
        }
    } else {
        if (dist(mouseX, mouseY, ballonPos.x, ballonPos.y) < 40) estEnTrainDeViser = true;
    }
}

function mouseDragged() {
    if (currentGame === 'translation' && estEnTrainDeViser) {
        userVec.x = round((mouseX - ORIGINE_USER.x) / COTE) * COTE;
        userVec.y = round((mouseY - ORIGINE_USER.y) / COTE) * COTE;
    }
}

function mouseReleased() { 
    if (currentGame !== 'translation' && currentGame !== 'decouverte' && estEnTrainDeViser) {
        estEnTrainDeViser = false; estLance = true;
        ballonVitesse = window.tempVec.copy().mult(0.12);
    }
    estEnTrainDeViser = false; 
}

function updateScoreUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('tries').innerText = tries;
}

function logToTable(val, win) {
    sessionEssais++;
    let row = document.getElementById('table-body').insertRow(0);
    row.innerHTML = `<td>${sessionEssais}</td><td>${val}</td><td style="color:${win?'green':'red'}">${win?'✅':'❌'}</td>`;
}