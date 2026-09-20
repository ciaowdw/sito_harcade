const canvas = document.getElementById('snakeCanvas');
const ctx = canvas.getContext('2d');
const scoreEl = document.getElementById('current-score');
const bestScoreEl = document.getElementById('best-score');
const coinWalletEl = document.getElementById('coin-wallet');
const menuOverlay = document.getElementById('menu-overlay');
const overlayTitle = document.getElementById('overlay-title');
const overlayText = document.getElementById('overlay-text');
const actionBtn = document.getElementById('action-btn');
const shopErrorMsg = document.getElementById('shop-error-msg');

const box = 18; 
let snake, direction, nextDirection, food, score, gameLoop;

let snakeHighScore = parseInt(localStorage.getItem('snake_high_score') || '0');
bestScoreEl.innerText = snakeHighScore;

let moneteTotali = parseInt(localStorage.getItem('snake_coins') || '0');
let skinAttiva = localStorage.getItem('snake_active_skin') || 'default';
let skinSbloccate = JSON.parse(localStorage.getItem('snake_unlocked_skins') || '["default"]');
coinWalletEl.innerText = moneteTotali;

const configurazioneColoriSkin = {
    default: ['#00f0ff', '#00b4cc'],
    pink: ['#ff007f', '#ff55a3'],
    green: ['#39ff14', '#20b90c'],
    glitch: ['#9400d3', '#ff00ff'],
    gold: ['#ffd700', '#cc9900']
};

actionBtn.addEventListener('click', initGame);
document.addEventListener('keydown', changeDirection);

document.getElementById('btn-up').addEventListener('touchstart', (e) => { e.preventDefault(); if (direction !== 'DOWN') nextDirection = 'UP'; });
document.getElementById('btn-down').addEventListener('touchstart', (e) => { e.preventDefault(); if (direction !== 'UP') nextDirection = 'DOWN'; });
document.getElementById('btn-left').addEventListener('touchstart', (e) => { e.preventDefault(); if (direction !== 'RIGHT') nextDirection = 'LEFT'; });
document.getElementById('btn-right').addEventListener('touchstart', (e) => { e.preventDefault(); if (direction !== 'LEFT') nextDirection = 'RIGHT'; });
        
document.getElementById('btn-up').addEventListener('mousedown', () => { if (direction !== 'DOWN') nextDirection = 'UP'; });
document.getElementById('btn-down').addEventListener('mousedown', () => { if (direction !== 'UP') nextDirection = 'DOWN'; });
document.getElementById('btn-left').addEventListener('mousedown', () => { if (direction !== 'RIGHT') nextDirection = 'LEFT'; });
document.getElementById('btn-right').addEventListener('mousedown', () => { if (direction !== 'LEFT') nextDirection = 'RIGHT'; });

function initGame() {
    menuOverlay.style.display = 'none';
    score = 0;
    scoreEl.innerText = score;
    direction = 'RIGHT';
    nextDirection = 'RIGHT';
    
    snake = [
        { x: 10 * box, y: 10 * box },
        { x: 9 * box, y: 10 * box },
        { x: 8 * box, y: 10 * box }
    ];
    
    generateFood();
    aggiornaBottoniNegozio();
    
    if (gameLoop) clearInterval(gameLoop);
    gameLoop = setInterval(draw, 110);
}

function generateFood() {
    food = {
        x: Math.floor(Math.random() * (canvas.width / box)) * box,
        y: Math.floor(Math.random() * (canvas.height / box)) * box
    };
    for (let cell of snake) {
        if (cell.x === food.x && cell.y === food.y) {
            generateFood();
            break;
        }
    }
}

function changeDirection(e) {
    if ((e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') && direction !== 'RIGHT') nextDirection = 'LEFT';
    else if ((e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') && direction !== 'DOWN') nextDirection = 'UP';
    else if ((e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') && direction !== 'LEFT') nextDirection = 'RIGHT';
    else if ((e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') && direction !== 'UP') nextDirection = 'DOWN';
}

function draw() {
    direction = nextDirection;
    ctx.fillStyle = '#0d0d13';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let coloriAttuali = configurazioneColoriSkin[skinAttiva] || configurazioneColoriSkin['default'];

    for (let i = 0; i < snake.length; i++) {
        // GESTIONE DELLE OMBRE E DELLE SCIE LUMINOSE AVANZATE
        if (skinAttiva === 'gold') {
            ctx.shadowBlur = Math.max(15 - i, 2);
            ctx.shadowColor = '#ffd700';
            ctx.fillStyle = coloriAttuali[i === 0 ? 0 : 1];
        } else if (skinAttiva === 'glitch') {
            ctx.shadowBlur = 10;
            ctx.shadowColor = '#9400d3';
            ctx.fillStyle = coloriAttuali[i === 0 ? 0 : 1];
        } else if (skinAttiva === 'rainbow') {
            // Effetto Multicolor dinamico basato sull'indice del corpo e sul tempo corrente
            let tonalitaHues = (i * 20 + Date.now() / 15) % 360;
            ctx.fillStyle = `hsl(${tonalitaHues}, 100%, 50%)`;
            
            // Effetto Scia Luminosa Arcobaleno
            ctx.shadowBlur = Math.max(18 - i, 3);
            ctx.shadowColor = `hsl(${tonalitaHues}, 100%, 50%)`;
        } else {
            ctx.shadowBlur = 0;
            ctx.fillStyle = coloriAttuali[i === 0 ? 0 : 1];
        }

        ctx.strokeStyle = '#0d0d13';
        ctx.fillRect(snake[i].x, snake[i].y, box, box);
        ctx.strokeRect(snake[i].x, snake[i].y, box, box);
    }
    ctx.shadowBlur = 0; // Ripristina l'ombra per gli altri oggetti

    ctx.fillStyle = '#ff007f';
    ctx.shadowBlur = 10;
    ctx.shadowColor = '#ff007f';
    ctx.fillRect(food.x, food.y, box, box);
    ctx.shadowBlur = 0; 

    let snakeX = snake[0].x;
    let snakeY = snake[0].y;

    if (direction === 'LEFT') snakeX -= box;
    if (direction === 'UP') snakeY -= box;
    if (direction === 'RIGHT') snakeX += box;
    if (direction === 'DOWN') snakeY += box;

    if (snakeX === food.x && snakeY === food.y) {
        score += 25; 
        moneteTotali += 25; 
        localStorage.setItem('snake_coins', moneteTotali.toString());
        scoreEl.innerText = score;
        coinWalletEl.innerText = moneteTotali;
        generateFood();
    } else {
        snake.pop();
    }

    let newHead = { x: snakeX, y: snakeY };

    if (snakeX < 0 || snakeX >= canvas.width || snakeY < 0 || snakeY >= canvas.height || collision(newHead, snake)) {
        clearInterval(gameLoop);
        handleGameOver();
        return;
    }

    snake.unshift(newHead);
}

function collision(head, array) {
    for (let i = 0; i < array.length; i++) {
        if (head.x === array[i].x && head.y === array[i].y) return true;
    }
    return false;
}

function handleGameOver() {
    if (score > snakeHighScore) {
        snakeHighScore = score;
        localStorage.setItem('snake_high_score', snakeHighScore.toString());
        bestScoreEl.innerText = snakeHighScore;
    }

    if (score >= 500) {
        overlayTitle.innerText = "🏆 TRAGUARDO SUPERATO!";
        overlayTitle.style.color = "#00f0ff";
        overlayText.innerText = `Punteggio finale: ${score}. Obiettivo raggiunto! Guadagni +35 XP e sblocchi il medaglione 'Giga Snake'.`;
        
        if (localStorage.getItem('obj_snake_done') !== 'true') {
            let totalHubXP = parseInt(localStorage.getItem('hub_total_xp') || '0');
            localStorage.setItem('hub_total_xp', (totalHubXP + 35).toString());
            localStorage.setItem('obj_snake_done', 'true');
        }
    } else {
        overlayTitle.innerText = "GAME OVER";
        overlayText.innerText = `Hai fatto ${score} punti. Raccogli più mele per guadagnare monete ed evolvere l'aspetto del tuo serpente!`;
    }

    actionBtn.innerText = "🔄 RIGIOCA";
    menuOverlay.style.display = 'flex';
    aggiornaBottoniNegozio();
}

window.selezionaSkin = function(idSkin) {
    if (skinSbloccate.includes(idSkin)) {
        skinAttiva = idSkin;
        localStorage.setItem('snake_active_skin', skinAttiva);
        aggiornaBottoniNegozio();
    }
}

window.compraSkin = function(idSkin, prezzo) {
    if (skinSbloccate.includes(idSkin)) {
        window.selezionaSkin(idSkin);
        return;
    }

    if (moneteTotali >= prezzo) {
        moneteTotali -= prezzo;
        skinSbloccate.push(idSkin);
        skinAttiva = idSkin;
        
        localStorage.setItem('snake_coins', moneteTotali.toString());
        localStorage.setItem('snake_unlocked_skins', JSON.stringify(skinSbloccate));
        localStorage.setItem('snake_active_skin', skinAttiva);
        
        shopErrorMsg.innerText = "";
        aggiornaBottoniNegozio();
    } else {
        shopErrorMsg.innerText = `❌ Monete insufficienti! Ti mancano ${prezzo - moneteTotali} monete.`;
        setTimeout(() => { shopErrorMsg.innerText = ""; }, 2500);
    }
}

function aggiornaBottoniNegozio() {
    coinWalletEl.innerText = moneteTotali;
    const mappaturaBottoni = {
        default: 'btn-skin-default',
        pink: 'btn-skin-pink',
        green: 'btn-skin-green',
        glitch: 'btn-skin-glitch',
        gold: 'btn-skin-gold',
        rainbow: 'btn-skin-rainbow'
    };

    for (let id in mappaturaBottoni) {
        const btn = document.getElementById(mappaturaBottoni[id]);
        if (!btn) continue;

        if (skinAttiva === id) {
            btn.innerText = "In Uso";
            btn.className = "shop-btn active";
        } else if (skinSbloccate.includes(id)) {
            btn.innerText = "Usa";
            btn.className = "shop-btn";
        } else {
            let prezziTesto = { pink: "100", green: "250", glitch: "350", gold: "500", rainbow: "750" };
            btn.innerText = `Compra (${prezziTesto[id]})`;
            btn.className = "shop-btn";
        }
    }
}

aggiornaBottoniNegozio();
