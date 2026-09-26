const canvas = null; // Nessun canvas richiesto per questo modulo quiz
const scoreEl = document.getElementById('result-score');
const menuOverlay = document.getElementById('quiz-screen');

// Archivio di 15 domande assortite sullo Sport Mondiale
const domande = [
    { q: "Quale nazione ha vinto il maggior numero di Mondiali di calcio maschili?", o: ["Italia", "Germania", "Argentina", "Brasile"], a: 2 },
    { q: "Quanti anelli compongono la bandiera ufficiale dei Giochi Olimpici?", o: ["4", "5", "6", "7"], a: 1 },
    { q: "Quale tennista detiene il record per il maggior numero di titoli del Grande Slam maschili?", o: ["Roger Federer", "Rafael Nadal", "Novak Djokovic", "Pete Sampras"], a: 2 },
    { q: "Ogni quanti anni si disputano tradizionalmente i Giochi Olimpici?", o: ["2 anni", "3 anni", "4 anni", "5 anni"], a: 2 },
    { q: "In quale sport viene assegnata la mitica 'Giacca Verde' al vincitore del Masters?", o: ["Golf", "Polo", "Tennis", "Scherma"], a: 0 },
    { q: "Quale leggendario pilota di Formula 1 ha vinto 7 titoli mondiali ed è tedesco?", o: ["Lewis Hamilton", "Michael Schumacher", "Sebastian Vettel", "Ayrton Senna"], a: 1 },
    { q: "Quanti giocatori di una singola squadra si trovano contemporaneamente in campo nel basket?", o: ["5", "6", "7", "11"], a: 0 },
    { q: "Come viene chiamato il punteggio di parità 40-40 nel gioco del tennis?", o: ["Deuce (Parità)", "Advantage", "Love", "Tie-break"], a: 0 },
    { q: "Quale atleta detiene il record del mondo dei 100 metri piani con 9.58 secondi?", o: ["Carl Lewis", "Tyson Gay", "Usain Bolt", "Yohan Blake"], a: 2 },
    { q: "Quale scuderia automobilistica ha disputato tutti i mondiali di Formula 1 dalla fondazione?", o: ["McLaren", "Mercedes", "Ferrari", "Williams"], a: 2 },
    { q: "In quale nazione sono nati i moderni giochi sportivi del Rugby e del Cricket?", o: ["Nuova Zelanda", "Australia", "Francia", "Inghilterra"], a: 3 },
    { q: "Quale squadra di basket NBA ha stabilito il record di 73 vittorie in una sola stagione?", o: ["Chicago Bulls", "Golden State Warriors", "Los Angeles Lakers", "Boston Celtics"], a: 1 },
    { q: "Di quanti minuti è composto un tempo regolamentare di una partita di calcio?", o: ["35 minuti", "40 minuti", "45 Industrial", "50 minuti"], a: 2 },
    { q: "In quale disciplina si compete per conquistare l'America's Cup?", o: ["Vela", "Canottaggio", "Ciclismo", "Sfondamento"], a: 0 },
    { q: "Quale nazione ha ospitato i Giochi Olimpici invernali nel 2026?", o: ["Francia", "Italia (Milano-Cortina)", "Canada", "Giappone"], a: 1 }
];

let indexDomanda = 0;
let risposteCorrette = 0;

function mostraDomanda() {
    if (indexDomanda < domande.length) {
        document.getElementById('quiz-progress').innerText = `Domanda ${indexDomanda + 1} di ${domande.length}`;
        document.getElementById('question').innerText = domande[indexDomanda].q;
        
        const containerOpzioni = document.getElementById('options');
        containerOpzioni.innerHTML = '';

        domande[indexDomanda].o.forEach((opzione, i) => {
            const bottone = document.createElement('button');
            bottone.className = 'option-btn';
            bottone.innerText = opzione;
            bottone.onclick = () => controllaRisposta(i, bottone);
            containerOpzioni.appendChild(bottone);
        });
    } else {
        mostraRisultatoFinale();
    }
}

function controllaRisposta(indiceScelto, bottoneCliccato) {
    const indiceCorretto = domande[indexDomanda].a;
    const tuttiIBottoni = document.querySelectorAll('.option-btn');

    tuttiIBottoni.forEach(btn => btn.disabled = true);

    if (indiceScelto === indiceCorretto) {
        bottoneCliccato.classList.add('correct');
        risposteCorrette++;
    } else {
        bottoneCliccato.classList.add('wrong');
        tuttiIBottoni[indiceCorretto].classList.add('correct');
    }

    setTimeout(() => {
        indexDomanda++;
        mostraDomanda();
    }, 1200);
}

function mostraRisultatoFinale() {
    document.getElementById('quiz-screen').style.display = 'none';
    document.getElementById('quiz-progress').style.display = 'none';
    
    const resultScreen = document.getElementById('result-screen');
    const rewardText = document.getElementById('result-reward');
    
    resultScreen.style.display = 'block';
    scoreEl.innerText = `Hai totalizzato ${risposteCorrette} su ${domande.length} risposte esatte!`;

    // OBIETTIVO SBLOCCO: Almeno 11 risposte corrette su 15
    if (risposteCorrette >= 11) {
        if (localStorage.getItem('obj_sport_done') !== 'true') {
            let totalHubXP = parseInt(localStorage.getItem('hub_total_xp') || '0');
            localStorage.setItem('hub_total_xp', (totalHubXP + 30).toString());
            localStorage.setItem('obj_sport_done', 'true');
        }
        rewardText.innerText = "🏆 CAMPIONE! Hai fatto almeno 11 punti: guadagni +30 XP e sblocchi il Medaglione 'Campione'!";
        rewardText.style.color = "#00f0ff";
    } else {
        rewardText.innerText = `Ti mancano ${11 - risposteCorrette} risposte corrette per raggiungere l'obiettivo (minimo 11/15) e sbloccare il Medaglione!`;
        rewardText.style.color = "#aaa";
    }
}

// Inizializzazione automatica del test
mostraDomanda();
