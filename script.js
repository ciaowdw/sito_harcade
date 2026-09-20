window.addEventListener('DOMContentLoaded', () => {
    // Inizializzazione dati se prima volta
    if (!localStorage.getItem('hub_total_xp')) {
        localStorage.setItem('hub_total_xp', '0');
        localStorage.setItem('hub_level', '1');
        localStorage.setItem('hub_rank', 'Novizio');
    }

    // Carica dati persistenti
    const totalXP = parseInt(localStorage.getItem('hub_total_xp'));
    const level = parseInt(localStorage.getItem('hub_level'));
    const rank = localStorage.getItem('hub_rank');

    // Formula barra livello
    const xpNecessariPerLivello = 500;
    const xpLivelloAttuale = totalXP % xpNecessariPerLivello;
    const percentualeBarra = (xpLivelloAttuale / xpNecessariPerLivello) * 100;

    // Disegna statistiche dell'utente
    document.getElementById('xp-fill').style.width = percentualeBarra + '%';
    document.getElementById('total-xp-num').innerText = totalXP.toLocaleString();
    document.getElementById('player-level').innerText = level;
    document.getElementById('rank-name').innerText = rank;

    // Funzione interna per attivare graficamente i medaglioni sbloccati
    function sbloccaBadgeVisivo(idBadge) {
        const elemento = document.getElementById(idBadge);
        if (elemento) {
            elemento.classList.add('unlocked');
        }
    }

    // CONTROLLI IN TEMPO REALE SUI SALVATAGGI DELLE ALTRE PAGINE
    if(localStorage.getItem('obj_pokemon_done') === 'true') sbloccaBadgeVisivo('badge-pokemon');
    if(localStorage.getItem('obj_minecraft_done') === 'true') sbloccaBadgeVisivo('badge-minecraft');
    if(localStorage.getItem('badge_anime_complete') === 'true') sbloccaBadgeVisivo('badge-otaku');
    if(localStorage.getItem('obj_sport_done') === 'true') sbloccaBadgeVisivo('badge-sport');
    if(localStorage.getItem('obj_bey_done') === 'true') sbloccaBadgeVisivo('badge-bey');
    
    if(localStorage.getItem('obj_snake_done') === 'true') sbloccaBadgeVisivo('badge-snake');
    if(localStorage.getItem('obj_clicker_lvl5') === 'true') sbloccaBadgeVisivo('badge-clicker');
    if(localStorage.getItem('badge_tris_won') === 'true') sbloccaBadgeVisivo('badge-bot');
    
    if(localStorage.getItem('obj_aim_done') === 'true') sbloccaBadgeVisivo('badge-aim');
    if(localStorage.getItem('obj_reaction_done') === 'true') sbloccaBadgeVisivo('badge-reaction');
    if(localStorage.getItem('obj_cps_done') === 'true') sbloccaBadgeVisivo('badge-cps');

    // Sblocco del Medaglione Leggenda se arrivi al livello 10
    if(rank === 'Leggenda' || level >= 10) {
        sbloccaBadgeVisivo('badge-legend');
    }
});
