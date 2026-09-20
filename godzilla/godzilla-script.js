const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
const menuOverlay = document.getElementById('menu-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const actionBtn = document.getElementById('action-btn');

let score, gameLoop, isPlaying = false;
let godzilla = { x: 0, y: 0, size: 16, targetX: 0, targetY: 0, easing: 0.04, angle: 0, burning: false };
let entities = [];
let ultimoTocco = 0;
let raggioAttivo = false;
let raggioTimer = 0;
let raggioDisponibile = true;
let raggioCooldownTimer = 0;
let raggioInCarica = false;
let raggioCaricaTimer = 0;
let mechaActive = false;
let mechaSpawned300 = false;
let spaceSpawned500 = false;
let mechaTimer = 0;
let mechaX = -200;
let mechaY = -200;
let mechaSize = 40;
let rockets = [];
let raggioAudioOsc = null;
let raggioAudioGain = null;
let beamDuelActive = false;
let beamProgress = 0.5;

// Variabili Space Godzilla
let spaceActive = false;
let spaceX = -200;
let spaceY = -200;
let spaceSize = 40;
let spaceTimer = 0;
let currentQteKey = '';
let qteTimer = 0;
let qteKeysList = ['A', 'S', 'D', 'W', 'Q', 'E'];
let spacePhase = 'defense'; // 'defense', 'transformation', 'defeat'
let waveCount = 0;
let waveTimer = 0;

function suonaRuggitoMecha() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(80, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(35, audioCtx.currentTime + 1.5);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(300, audioCtx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 1.5);
        filter.Q.setValueAtTime(15, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 1.5);
        osc.connect(filter);
        filter.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 1.5);
    } catch(e) {}
}

function suonaCaricaRaggio(durataSecondi) {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(100, audioCtx.currentTime);
        osc.frequency.linearRampToValueAtTime(950, audioCtx.currentTime + durataSecondi);
        gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.4, audioCtx.currentTime + durataSecondi);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + durataSecondi);
    } catch(e) {}
}

function startAudioRaggio() {
    try {
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        raggioAudioOsc = audioCtx.createOscillator();
        raggioAudioGain = audioCtx.createGain();
        const filter = audioCtx.createBiquadFilter();
        raggioAudioOsc.type = 'sawtooth';
        raggioAudioOsc.frequency.setValueAtTime(130, audioCtx.currentTime);
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450, audioCtx.currentTime);
        raggioAudioGain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        raggioAudioOsc.connect(filter);
        filter.connect(raggioAudioGain);
        raggioAudioGain.connect(audioCtx.destination);
        raggioAudioOsc.start();
    } catch(e) {}
}

function stopAudioRaggio() {
    if (raggioAudioOsc) {
        try {
            raggioAudioOsc.stop();
            raggioAudioOsc.disconnect();
        } catch(e) {}
        raggioAudioOsc = null;
    }
}

function ridimensionaSchermo() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    if (isPlaying && !beamDuelActive && !spaceActive) {
        godzilla.targetX = godzilla.x;
        godzilla.targetY = godzilla.y;
    }
}

window.addEventListener('resize', ridimensionaSchermo);
ridimensionaSchermo();
actionBtn.addEventListener('click', startGame);

function genNewQteKey() {
    currentQteKey = qteKeysList[Math.floor(Math.random() * qteKeysList.length)];
    qteTimer = 90; 
}

function gestisciTouch(e) {
    if (!isPlaying || !e.touches || e.touches.length === 0) return;
    if (beamDuelActive) {
        premutoTastoDuello();
        return;
    }
    if (spaceActive && spacePhase === 'defense') {
        premutoTastoQte(currentQteKey);
        return;
    }
    let touch = e.touches[0];
    if (!raggioAttivo && !raggioInCarica) {
        godzilla.targetX = touch.clientX;
        godzilla.targetY = touch.clientY;
    }
}

window.addEventListener('touchstart', (e) => {
    if (!isPlaying) return;
    if (beamDuelActive) {
        premutoTastoDuello();
        return;
    }
    if (spaceActive && spacePhase === 'defense') {
        premutoTastoQte(currentQteKey);
        return;
    }
    let tempoAttuale = new Date().getTime();
    let diffTempo = tempoAttuale - ultimoTocco;
    ultimoTocco = tempoAttuale;
    if (diffTempo < 300 && diffTempo > 0) {
        attivaRaggioAtomico();
    }
    gestisciTouch(e);
}, { passive: false });

window.addEventListener('touchmove', gestisciTouch, { passive: false });

window.addEventListener('mousemove', (e) => {
    if (isPlaying && !raggioAttivo && !raggioInCarica && !beamDuelActive && !spaceActive) {
        godzilla.targetX = e.clientX;
        godzilla.targetY = e.clientY;
    }
});

window.addEventListener('keydown', (e) => {
    let keyString = e.key.toUpperCase();
    if (spaceActive && spacePhase === 'defense') {
        if (keyString === currentQteKey) {
            premutoTastoQte(keyString);
        } else if (qteKeysList.includes(keyString)) {
            perdiQte();
        }
        return;
    }
    if (e.key === ' ' || e.code === 'Space') {
        if (beamDuelActive) {
            premutoTastoDuello();
        } else {
            attivaRaggioAtomico();
        }
    }
});

function premutoTastoQte(tasto) {
    genNewQteKey();
}

function perdiQte() {
    clearInterval(gameLoop);
    stopAudioRaggio();
    isPlaying = false;
    spaceActive = false;
    overlayTitle.innerText = "💥 POLVERIZZATO!";
    overlayTitle.style.color = "#ff003c";
    overlayText.innerText = "I cristalli fotonici di Space Godzilla ti hanno travolto. Premi i tasti giusti della tastiera (o tocca lo schermo se sei da telefono) per difenderti!";
    actionBtn.innerText = "RIGENERA KAIJU";
    menuOverlay.style.display = 'flex';
}

function premutoTastoDuello() {
    beamProgress += 0.045;
}

function attivaRaggioAtomico() {
    if (raggioDisponibile && !raggioAttivo && !raggioInCarica && isPlaying && !beamDuelActive && !spaceActive) {
        raggioInCarica = true;
        raggioCaricaTimer = 300;
        raggioDisponibile = false;
        raggioCooldownTimer = 3600;
        suonaCaricaRaggio(5.0);
    }
}

function startGame() {
    menuOverlay.style.display = 'none';
    score = 0;
    isPlaying = true;
    godzilla.x = canvas.width / 2;
    godzilla.y = canvas.height / 2;
    godzilla.targetX = godzilla.x;
    godzilla.targetY = godzilla.y;
    godzilla.size = 16;
    godzilla.angle = 0;
    godzilla.burning = false;
    raggioAttivo = false;
    raggioTimer = 0;
    raggioInCarica = false;
    raggioCaricaTimer = 0;
    raggioDisponibile = true;
    raggioCooldownTimer = 0;
    mechaActive = false;
    mechaSpawned300 = false;
    spaceSpawned500 = false;
    mechaTimer = 0;
    beamDuelActive = false;
    beamProgress = 0.5;
    spaceActive = false;
    spacePhase = 'defense';
    waveCount = 0;
    waveTimer = 0;
    rockets = [];
    entities = [];
    for (let i = 0; i < 12; i++) spawnEntity(true);
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(update, 1000 / 60);
}

function spawnEntity(isInitial = false) {
    let maxRandomSize = Math.min(35 + (score / 10), 150);
    let size = Math.floor(Math.random() * maxRandomSize) + 6;
    let vaADestra = Math.random() < 0.5;
    let velocitaBase = Math.random() * 1.5 + 1.2;
    let vx = vaADestra ? velocitaBase : -velocitaBase;
    let color = 'hsl(' + (Math.random() * 360) + ', 100%, 65%)';
    let x, y;
    if (isInitial) {
        x = Math.random() * canvas.width;
        y = Math.random() * canvas.height;
    } else {
        x = vaADestra ? -60 : canvas.width + 60;
        y = Math.random() * (canvas.height - 100) + 50;
    }
    entities.push({ x: x, y: y, size: size, type: "fish", vx: vx, vy: 0, color: color, dirSign: vaADestra ? 1 : -1, bodyRatio: Math.random() * 0.4 + 0.4, tailRatio: Math.random() * 0.3 + 0.25, baseSpeed: velocitaBase });
}

function disegnaPesce(x, y, s, dirSign, color, bodyRatio, tailRatio, spaventato) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(dirSign, 1);
    if (spaventato) {
        ctx.shadowBlur = 12;
        ctx.shadowColor = "#ff0055";
    }
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, s, s * bodyRatio, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-s, 0);
    ctx.lineTo(-s * 1.4, -s * tailRatio);
    ctx.lineTo(-s * 1.4, s * tailRatio);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(s * 0.4, -s * 0.1, Math.max(1.5, s * 0.1), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
}

function disegnaKaiju(x, y, sizeValue, angleValue, variant) {
    ctx.save();
    ctx.translate(x, y);
    if (variant === 'mecha' || variant === 'space') {
        ctx.scale(-1, 1);
    } else {
        ctx.rotate(angleValue);
    }
    let s = sizeValue * 0.5;
    
if (variant === 'mecha') ctx.fillStyle = '#5c6b73';else if (variant === 'space') ctx.fillStyle = '#3a0ca3';else if (godzilla.burning) ctx.fillStyle = '#ff3300';else ctx.fillStyle = '#1c3d22';ctx.beginPath();ctx.moveTo(-s * 0.5, 0);ctx.quadraticCurveTo(-s * 1.5, s * 0.4, -s * 2, s * 0.2);ctx.quadraticCurveTo(-s * 1.4, -s * 0.2, -s * 0.5, 0);ctx.fill();ctx.shadowBlur = (variant === 'mecha' || variant === 'space' || raggioAttivo || godzilla.burning) ? 25 : 15;if (variant === 'mecha') ctx.shadowColor = '#ff003c';else if (variant === 'space') ctx.shadowColor = '#b5179e';else if (godzilla.burning) ctx.shadowColor = '#ff9f1c';else ctx.shadowColor = '#00f0ff';ctx.fillStyle = ctx.shadowColor;ctx.beginPath(); ctx.moveTo(-s * 1.4, -s * 0.1); ctx.lineTo(-s * 1.6, -s * 0.5); ctx.lineTo(-s * 1.2, -s * 0.2); ctx.fill();ctx.beginPath(); ctx.moveTo(-s * 0.7, -s * 0.3); ctx.lineTo(-s * 0.9, -s * 0.9); ctx.lineTo(-s * 0.4, -s * 0.5); ctx.fill();ctx.beginPath(); ctx.moveTo(-s * 0.1, -s * 0.5); ctx.lineTo(-s * 0.2, -s * 1.0); ctx.lineTo(s * 0.2, -s * 0.6); ctx.fill();if (variant === 'space') {ctx.fillStyle = '#ffffff';ctx.shadowColor = '#ffffff';ctx.beginPath(); ctx.moveTo(-s * 0.4, -s * 0.5); ctx.lineTo(-s * 0.5, -s * 1.4); ctx.lineTo(-s * 0.1, -s * 0.6); ctx.fill();}ctx.shadowBlur = 0;if (variant === 'mecha') ctx.fillStyle = '#7d8f99';else if (variant === 'space') ctx.fillStyle = '#7209b7';else if (godzilla.burning) ctx.fillStyle = '#e63946';else ctx.fillStyle = '#265431';ctx.beginPath(); ctx.ellipse(-s * 0.2, 0, s * 0.9, s * 0.6, 0, 0, Math.PI * 2); ctx.fill();if (variant === 'mecha') ctx.fillStyle = '#5c6b73';else if (variant === 'space') ctx.fillStyle = '#3a0ca3';else if (godzilla.burning) ctx.fillStyle = '#ff3300';else ctx.fillStyle = '#1c3d22';ctx.beginPath(); ctx.arc(-s * 0.4, s * 0.5, s * 0.35, 0, Math.PI * 2); ctx.fill();ctx.beginPath(); ctx.arc(-s * 0.5, -s * 0.4, s * 0.3, 0, Math.PI * 2); ctx.fill();if (variant === 'mecha') ctx.fillStyle = '#7d8f99';else if (variant === 'space') ctx.fillStyle = '#7209b7';else if (godzilla.burning) ctx.fillStyle = '#ff9f1c';else ctx.fillStyle = '#265431';ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.4); ctx.lineTo(s * 1.3, -s * 0.3); ctx.lineTo(s * 1.2, s * 0.1); ctx.lineTo(s * 0.5, s * 0.4); ctx.closePath(); ctx.fill();if (variant === 'mecha') ctx.fillStyle = '#ff003c';else if (variant === 'space') ctx.fillStyle = '#ffffff';else if (godzilla.burning) ctx.fillStyle = '#ffff00';else ctx.fillStyle = (raggioAttivo ? '#ffffff' : '#39ff14');ctx.beginPath(); ctx.arc(s * 0.8, -s * 0.15, s * 0.12, 0, Math.PI * 2); ctx.fill();ctx.restore();}function update() {if (!raggioAttivo && !raggioInCarica && !beamDuelActive && !spaceActive) {let dxTarget = godzilla.targetX - godzilla.x;let dyTarget = godzilla.targetY - godzilla.y;if (Math.sqrt(dxTarget * dxTarget + dyTarget * dyTarget) > 5) {godzilla.angle = Math.atan2(dyTarget, dxTarget);}godzilla.x += dxTarget * godzilla.easing;godzilla.y += dyTarget * godzilla.easing;}if (raggioInCarica) {raggioCaricaTimer--;if (raggioCaricaTimer <= 0) {raggioInCarica = false;raggioAttivo = true;raggioTimer = 300;startAudioRaggio();}}if (raggioAttivo) {raggioTimer--;if (raggioTimer <= 0) {raggioAttivo = false;stopAudioRaggio();}}if (!raggioDisponibile && !raggioAttivo && !raggioInCarica) {raggioCooldownTimer--;if (raggioCooldownTimer <= 0) raggioDisponibile = true;}if (score >= 300 && !mechaSpawned300) {mechaSpawned300 = true;beamDuelActive = true;beamProgress = 0.5;entities = [];rockets = [];godzilla.x = canvas.width * 0.12;godzilla.y = canvas.height * 0.5;godzilla.angle = 0;mechaX = canvas.width * 0.88;mechaY = canvas.height * 0.5;mechaSize = godzilla.size;suonaRuggitoMecha();startAudioRaggio();}if (Math.floor(godzilla.size) >= 500 && !spaceSpawned500) {spaceSpawned500 = true;spaceActive = true;spacePhase = 'defense';spaceTimer = 3600;entities = [];rockets = [];godzilla.x = canvas.width * 0.15;godzilla.y = canvas.height * 0.5;godzilla.angle = 0;spaceX = canvas.width * 0.85;spaceY = canvas.height * 0.5;spaceSize = godzilla.size;suonaRuggitoMecha();genNewQteKey();}let gradientMare = ctx.createLinearGradient(0, 0, 0, canvas.height);gradientMare.addColorStop(0, '#061322');gradientMare.addColorStop(1, '#02050a');ctx.fillStyle = gradientMare;ctx.fillRect(0, 0, canvas.width, canvas.height);if (spaceActive) {if (spacePhase === 'defense') {spaceTimer--;qteTimer--;if (qteTimer <= 0) {perdiQte();return;}ctx.save();ctx.lineWidth = 8;ctx.strokeStyle = '#b5179e';ctx.shadowBlur = 15;ctx.shadowColor = '#f72585';ctx.beginPath();ctx.moveTo(spaceX - 30, spaceY);ctx.lineTo(godzilla.x + 30, godzilla.y);ctx.stroke();ctx.strokeStyle = '#00f0ff';ctx.beginPath();ctx.arc(godzilla.x, godzilla.y, godzilla.size * 0.4, 0, Math.PI * 2);ctx.stroke();ctx.restore();if (spaceTimer <= 0) {spacePhase = 'transformation';godzilla.burning = true;waveCount = 0;waveTimer = 180;}} else if (spacePhase === 'transformation') {waveTimer--;if (waveTimer <= 0) {waveCount++;waveTimer = 90;if (waveCount >= 3) {spacePhase = 'defeat';spaceTimer = 60;}}ctx.save();ctx.strokeStyle = '#ff9f1c';ctx.lineWidth = 12;ctx.shadowBlur = 30;ctx.shadowColor = '#ff3300';ctx.beginPath();let raggioOnda = (1 - (waveTimer / 180)) * canvas.width;ctx.arc(godzilla.x, godzilla.y, raggioOnda, 0, Math.PI * 2);ctx.stroke();ctx.restore();} else if (spacePhase === 'defeat') {spaceTimer--;if (spaceTimer <= 0) {spaceActive = false;score += 500;for (let i = 0; i < 12; i++) spawnEntity(true);}ctx.save();ctx.fillStyle = '#ffffff';ctx.shadowBlur = 50;ctx.shadowColor = '#ff0055';ctx.beginPath();ctx.arc(spaceX, spaceY, (1 - (spaceTimer / 60)) * 200, 0, Math.PI * 2);ctx.fill();ctx.restore();}disegnaKaiju(godzilla.x, godzilla.y, godzilla.size, 0, 'player');if (spacePhase !== 'defeat' || spaceTimer % 4 > 2) {disegnaKaiju(spaceX, spaceY, spaceSize, 0, 'space');}if (spacePhase === 'defense') {ctx.save();ctx.fillStyle = '#ffffff';ctx.font = "bold 24px sans-serif";ctx.textAlign = 'center';ctx.fillText('⚡ SE SEI DA PC PREMI SULLA TASTIERA: ' + currentQteKey + ' ⚡', canvas.width / 2, 80);ctx.font = "bold 18px sans-serif";ctx.fillStyle = '#00f0ff';ctx.fillText('(Se sei da telefono, TOCCA semplicemente lo schermo in tempo!)', canvas.width / 2, 115);ctx.fillStyle = 'rgba(255,255,255,0.2)';ctx.fillRect(canvas.width / 2 - 100, 140, 200, 15);ctx.fillStyle = '#00f0ff';ctx.fillRect(canvas.width / 2 - 100, 140, (qteTimer / 90) * 200, 15);ctx.fillStyle = '#ff9f1c';ctx.font = "20px sans-serif";ctx.fillText('Resisti per: ' + Math.ceil(spaceTimer / 60) + 's', canvas.width / 2, 190);ctx.restore();} else if (spacePhase === 'transformation') {ctx.save();ctx.fillStyle = '#ff3300';ctx.font = "bold 32px sans-serif";ctx.textAlign = 'center';ctx.fillText('🔥 GODZILLA BURNING DISINTEGRA SPACE GODZILLA! 🔥', canvas.width / 2, 100);ctx.restore();}}if (beamDuelActive) {beamProgress -= 0.0035;if (beamProgress <= 0.05) {beamDuelActive = false;stopAudioRaggio();clearInterval(gameLoop);endGame(false);return;}if (beamProgress >= 0.95) {beamDuelActive = false;stopAudioRaggio();score += 100;if (godzilla.size < 500) {godzilla.size += 15;if (godzilla.size > 500) godzilla.size = 500;}mechaActive = false;for (let i = 0; i < 12; i++) spawnEntity(true);}let altezzaFissaY = canvas.height * 0.5;let gX = godzilla.x + (godzilla.size * 0.5 * 0.8);let mX = mechaX - (mechaSize * 0.5 * 0.8);let scontroX = gX + (mX - gX) * beamProgress;ctx.save();ctx.lineWidth = 22;ctx.strokeStyle = 'rgba(0, 240, 255, 0.3)';ctx.beginPath(); ctx.moveTo(gX, altezzaFissaY); ctx.lineTo(scontroX, altezzaFissaY); ctx.stroke();ctx.lineWidth = 10;ctx.strokeStyle = '#ffffff';ctx.shadowBlur = 25; ctx.shadowColor = '#00f0ff';ctx.beginPath(); ctx.moveTo(gX, altezzaFissaY); ctx.lineTo(scontroX, altezzaFissaY); ctx.stroke();ctx.lineWidth = 22;ctx.strokeStyle = 'rgba(255, 0, 60, 0.3)';ctx.beginPath(); ctx.moveTo(mX, altezzaFissaY); ctx.lineTo(scontroX, altezzaFissaY); ctx.stroke();ctx.lineWidth = 10;ctx.strokeStyle = '#ffffff';ctx.shadowBlur = 25; ctx.shadowColor = '#ff003c';ctx.beginPath(); ctx.moveTo(mX, altezzaFissaY); ctx.lineTo(scontroX, altezzaFissaY); ctx.stroke();ctx.fillStyle = '#ffffff';ctx.shadowBlur = 40; ctx.shadowColor = '#00f0ff';ctx.beginPath(); ctx.arc(scontroX, altezzaFissaY, 25 + Math.random() * 15, 0, Math.PI * 2); ctx.fill();ctx.restore();disegnaKaiju(godzilla.x, altezzaFissaY, godzilla.size, 0, 'player');disegnaKaiju(mechaX, altezzaFissaY, mechaSize, 0, 'mecha');ctx.save();ctx.fillStyle = '#ff003c';ctx.font = "bold 24px sans-serif";ctx.textAlign = 'center';ctx.fillText('💥 SCONTRO FINALE! PREMI SPAZIO O TOCCA RAPIDAMENTE! 💥', canvas.width / 2, 80);ctx.restore();}if (!beamDuelActive && !spaceActive) {if (raggioAttivo) {ctx.save();ctx.translate(godzilla.x, godzilla.y);ctx.rotate(godzilla.angle);let raggioLunghezza = Math.max(canvas.width, canvas.height);let gradRaggio = ctx.createLinearGradient(0, -15, 0, 15);gradRaggio.addColorStop(0, 'rgba(0, 240, 255, 0.2)');gradRaggio.addColorStop(0.5, 'rgba(0, 240, 255, 1)');gradRaggio.addColorStop(1, 'rgba(0, 240, 255, 0.2)');ctx.fillStyle = gradRaggio;ctx.shadowBlur = 25;ctx.shadowColor = godzilla.burning ? '#ff9f1c' : '#00f0ff';ctx.fillRect(0, -15, raggioLunghezza, 30);ctx.restore();}entities.forEach((ent, index) => {let dxG = ent.x - godzilla.x;let dyG = ent.y - godzilla.y;let distG = Math.sqrt(dxG * dxG + dyG * dyG);let spaventato = false;if (ent.size < godzilla.size && distG < 160) {spaventato = true;if (dxG > 0) { ent.vx = ent.baseSpeed * 1.5; ent.dirSign = 1; }else { ent.vx = -ent.baseSpeed * 1.5; ent.dirSign = -1; }} else { ent.vx = ent.dirSign * ent.baseSpeed; }ent.x += ent.vx;ent.y += ent.vy;if (ent.x < -160 || ent.x > canvas.width + 160 || ent.y < -160 || ent.y > canvas.height + 160) {entities.splice(index, 1);spawnEntity(false);return;}if (raggioAttivo) {let dxF = ent.x - godzilla.x;let dyF = ent.y - godzilla.y;let angoloPesce = Math.atan2(dyF, dxF);let diffAngolo = angoloPesce - godzilla.angle;while (diffAngolo < -Math.PI) diffAngolo += Math.PI * 2;while (diffAngolo > Math.PI) diffAngolo -= Math.PI * 2;let distanzaProiezione = Math.cos(diffAngolo) * Math.sqrt(dxF * dxF + dyF * dyF);let catchment = ent.size + 15;let distanzaAsse = Math.abs(Math.sin(diffAngolo) * Math.sqrt(dxF * dxF + dyF * dyF));if (distanzaProiezione > 0 && distanzaAsse < catchment) {entities.splice(index, 1);score += 5;if (godzilla.size < 500) {godzilla.size += 3;if (godzilla.size > 500) godzilla.size = 500;}spawnEntity(false);return;}}disegnaPesce(ent.x, ent.y, ent.size, ent.dirSign, ent.color, ent.bodyRatio, ent.tailRatio, spaventato);ctx.fillStyle = spaventato ? "#ff0055" : "#00f0ff";ctx.font = 'bold ' + Math.max(12, ent.size * 0.55) + 'px sans-serif';ctx.textAlign = 'center';ctx.textBaseline = 'middle';ctx.fillText(Math.floor(ent.size), ent.x, ent.y - ent.size - 10);let dx = godzilla.x - ent.x;let dy = godzilla.y - ent.y;let distance = Math.sqrt(dx * dx + dy * dy);if (distance < (godzilla.size * 0.5) + ent.size) {if (godzilla.size >= ent.size) {entities.splice(index, 1);score += 5;if (godzilla.size < 500) {godzilla.size += 3;if (godzilla.size > 500) godzilla.size = 500;}spawnEntity(false);} else {clearInterval(gameLoop);stopAudioRaggio();endGame(false);return;}}});ctx.fillStyle = '#39ff14';ctx.font = "bold 16px sans-serif";ctx.textAlign = 'center';let livelloTesto = Math.floor(godzilla.size);ctx.fillText('Tu: ' + (livelloTesto >= 500 ? "500 (MAX)" : livelloTesto), godzilla.x, godzilla.y - (godzilla.size * 0.5) - 12);disegnaKaiju(godzilla.x, godzilla.y, godzilla.size, godzilla.angle, 'player');ctx.save();ctx.textAlign = 'right';ctx.font = "bold 16px sans-serif";if (raggioDisponibile) {ctx.fillStyle = '#00f0ff';ctx.fillText('RAGGIO: OK', canvas.width - 20, 35);} else {ctx.fillStyle = '#ff007f';let secondiMancanti = Math.ceil(raggioCooldownTimer / 60);ctx.fillText(raggioInCarica ? 'CARICAMENTO...' : 'RICARICA: ' + secondiMancanti + 's', canvas.width - 20, 35);}ctx.restore();}if (score >= 5000) {clearInterval(gameLoop);stopAudioRaggio();endGame(true);}}function endGame(isVictory) {isPlaying = false;stopAudioRaggio();overlayTitle.innerText = isVictory ? "👑 DIO DEI KAIJU!" : "SCONFITTA MARINA";overlayText.innerText = isVictory ? 'Hai raggiunto 5000 punti energia! La sottomissione globale è completa.' : 'Sei stato sconfitto in combattimento!';actionBtn.innerText = "RIGENERA KAIJU";menuOverlay.style.display = 'flex';}