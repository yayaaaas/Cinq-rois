// ==========================================
// 1. VARIABLES GLOBALES & MENU
// ==========================================
const COULEURS = ['coeur', 'carreau', 'trefle', 'pique', 'etoile'];
const VALEURS = ['3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];

let monPseudo = "Joueur 1";
let modeJeu = "MULTI"; 

let pioche = [];
let defausse = [];
let maMain = [];
let mancheActuelle = 1; 
let aPioche = false;
let monTour = false; 
let estHote = false;

let cartesSelectionnees = [];
let groupesAposer = [];

let estDernierTour = false;
let aPoseMaMain = false; 
let piocheDepuisDefausse = false;

let scoreJoueur = 0;

let joueursReseau = [];
let monIndexReseau = 0;
let indexJoueurActuelReseau = 0;
let indexJoueurQuiAPoseReseau = -1;

function afficherMenuMulti() {
    const multiPanel = document.getElementById('multi-panel');
    if (multiPanel) {
        multiPanel.style.display = multiPanel.style.display === 'none' ? 'block' : 'none';
    }
}

function demarrerJeuUI() {
    let nameInput = document.getElementById('player-name').value.trim();
    if (nameInput !== "") monPseudo = nameInput;
    
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-zone').style.display = 'block';

    const gameContainer = document.getElementById('game-container');
    if (gameContainer) gameContainer.style.display = '';

    const table = document.getElementById('table');
    if (table) table.style.display = '';

    const tableauPose = document.getElementById('tableau-pose');
    if (tableauPose) tableauPose.style.display = '';
}

function reinitialiserVariablePartie() {
    mancheActuelle = 1;
    scoreJoueur = 0;
    joueursReseau = [];
    monIndexReseau = 0;
    indexJoueurActuelReseau = 0;
    indexJoueurQuiAPoseReseau = -1;
    
    if (typeof bots !== 'undefined') bots.forEach(b => b.score = 0);
    
    maMain = [];
    pioche = [];
    defausse = [];
    groupesAposer = [];
    cartesSelectionnees = [];
    aPoseMaMain = false;
    estDernierTour = false;
    aPioche = false;
    piocheDepuisDefausse = false;

    const tbody = document.getElementById('lignes-scores');
    if (tbody) tbody.innerHTML = '';
}

function lancerModeSolo() {
    modeJeu = "SOLO";
    reinitialiserVariablePartie();
    demarrerJeuUI();
    initialiserPartieSolo();
}

function retourAccueil() {
    const confirmer = confirm("Voulez-vous vraiment quitter la partie et revenir au menu principal ?");
    if (!confirmer) return;

    reinitialiserVariablePartie();

    document.getElementById('game-zone').style.display = 'none';
    document.getElementById('main-menu').style.display = 'block';

    const multiPanel = document.getElementById('multi-panel');
    if (multiPanel) multiPanel.style.display = 'none';

    const statusMsg = document.getElementById('status-message');
    if (statusMsg) statusMsg.innerText = "Préparation de la partie...";
}

// ==========================================
// 2. GENERATION DECK & REGLES
// ==========================================
function genererDeck() {
    let deck = [];
    for (let set = 0; set < 2; set++) {
        COULEURS.forEach(couleur => {
            VALEURS.forEach(valeur => {
                deck.push({ valeur: valeur, couleur: couleur, type: 'normale' });
            });
        });
        for (let j = 0; j < 3; j++) {
            deck.push({ valeur: 'Joker', couleur: 'joker', type: 'joker' });
        }
    }
    return deck;
}

function melanger(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

function estUnJokerOuAtout(carte) {
    if (!carte) return false;
    if (carte.type === 'joker') return true;
    let valeurAtout = (mancheActuelle + 2).toString();
    if (valeurAtout === '11') valeurAtout = 'V';
    if (valeurAtout === '12') valeurAtout = 'D';
    if (valeurAtout === '13') valeurAtout = 'R';
    return carte.valeur === valeurAtout;
}

function obtenirValeurNumerique(valeur) {
    if (valeur === 'V') return 11;
    if (valeur === 'D') return 12;
    if (valeur === 'R') return 13;
    if (valeur === 'Joker') return 50;
    return parseInt(valeur);
}

function estUneFamille(groupe) {
    if (groupe.length < 3) return false;
    let cartesNormales = groupe.filter(c => !estUnJokerOuAtout(c));
    if (cartesNormales.length === 0) return true;
    let valeurRef = cartesNormales[0].valeur;
    return cartesNormales.every(c => c.valeur === valeurRef);
}

function estUneSuite(groupe) {
    if (groupe.length < 3) return false;
    let cartesNormales = groupe.filter(c => !estUnJokerOuAtout(c));
    if (cartesNormales.length === 0) return true;

    let couleurRef = cartesNormales[0].couleur;
    if (!cartesNormales.every(c => c.couleur === couleurRef)) return false;

    let valeurs = cartesNormales.map(c => obtenirValeurNumerique(c.valeur)).sort((a, b) => a - b);
    let nbJokersDispo = groupe.length - cartesNormales.length;
    
    for (let i = 0; i < valeurs.length - 1; i++) {
        let ecart = valeurs[i+1] - valeurs[i] - 1;
        if (ecart < 0) return false;
        nbJokersDispo -= ecart;
        if (nbJokersDispo < 0) return false;
    }
    return true;
}

function validerCombinaison(groupe) {
    return estUneFamille(groupe) || estUneSuite(groupe);
}

// ==========================================
// 3. AFFICHAGE
// ==========================================
function obtenirSymbole(couleur) {
    if (couleur === 'coeur') return '♥';
    if (couleur === 'carreau') return '♦';
    if (couleur === 'trefle') return '♣';
    if (couleur === 'pique') return '♠';
    if (couleur === 'etoile') return '★';
    return '🃏';
}

function afficherMain() {
    const handDiv = document.getElementById('player-hand');
    if (!handDiv) return;
    handDiv.innerHTML = ''; 

    maMain.forEach((carte, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', carte.couleur);

        let estAtoutOuJoker = estUnJokerOuAtout(carte);
        if (estAtoutOuJoker) {
            cardDiv.style.border = "3px solid #f1c40f";
            cardDiv.style.boxShadow = "0 0 10px #f1c40f";
        }

        if (cartesSelectionnees.includes(index)) {
            cardDiv.classList.add('carte-selectionnee');
        }

        cardDiv.onclick = () => verifierClicCarte(index);

        let texteAtout = estAtoutOuJoker ? '⭐' : '';

        cardDiv.innerHTML = `
            <div>${carte.valeur} ${texteAtout}</div>
            <div style="font-size: 24px;">${obtenirSymbole(carte.couleur)}</div>
            <div style="text-align: right;">${carte.valeur}</div>
        `;
        handDiv.appendChild(cardDiv);
    });
}

function afficherDefausse() {
    const discardSlot = document.getElementById('discard-pile');
    if (!discardSlot) return;

    if (defausse.length > 0) {
        const derniereCarte = defausse[defausse.length - 1];
        discardSlot.className = `card-slot card ${derniereCarte.couleur}`;
        discardSlot.innerHTML = `
            <div>${derniereCarte.valeur}</div>
            <div style="font-size: 24px;">${obtenirSymbole(derniereCarte.couleur)}</div>
            <div style="text-align: right;">${derniereCarte.valeur}</div>
        `;
    } else {
        discardSlot.className = 'card-slot';
        discardSlot.innerHTML = 'Défausse vide';
    }

    const btnCancel = document.getElementById('btn-cancel-draw');
    if (btnCancel) {
        btnCancel.style.display = (aPioche && piocheDepuisDefausse && !aPoseMaMain) ? 'inline-block' : 'none';
    }
}

function mettreAJourStatutTour() {
    const status = document.getElementById('status-message');
    if (!status) return;

    if (modeJeu === "SOLO") {
        status.innerText = monTour ? `[Manche ${mancheActuelle}/11] C'est VOTRE tour !` : `[Manche ${mancheActuelle}/11] Tour des bots...`;
    } else {
        let joueurNom = joueursReseau[indexJoueurActuelReseau] ? joueursReseau[indexJoueurActuelReseau].pseudo : "un joueur";
        if (estDernierTour) {
            status.innerText = monTour ? `⚠️ [DERNIER TOUR] C'est VOTRE tour !` : `⚠️ [DERNIER TOUR] Tour de ${joueurNom}...`;
        } else {
            status.innerText = monTour ? `[Manche ${mancheActuelle}/11] C'est VOTRE tour !` : `[Manche ${mancheActuelle}/11] Tour de ${joueurNom}...`;
        }
    }
}

function afficherGroupesAPoser() {
    const container = document.getElementById('zones-combinaisons');
    if (!container) return;
    container.innerHTML = '';

    groupesAposer.forEach((groupe) => {
        const divGroupe = document.createElement('div');
        divGroupe.className = 'groupe-cartes';
        
        groupe.forEach(carte => {
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card', carte.couleur);
            cardDiv.innerHTML = `
                <div>${carte.valeur}</div>
                <div style="font-size: 20px;">${obtenirSymbole(carte.couleur)}</div>
                <div style="text-align: right;">${carte.valeur}</div>
            `;
            divGroupe.appendChild(cardDiv);
        });

        container.appendChild(divGroupe);
    });
}

// ==========================================
// 4. ACTIONS JOUEUR
// ==========================================
function verifierClicCarte(index) {
    if (cartesSelectionnees.includes(index)) {
        cartesSelectionnees = cartesSelectionnees.filter(i => i !== index);
    } else {
        cartesSelectionnees.push(index);
    }
    afficherMain();
}

function deplacerCarteSelectionnee(direction) {
    if (cartesSelectionnees.length !== 1) {
        alert("Sélectionnez 1 seule carte à déplacer.");
        return;
    }
    let idx = cartesSelectionnees[0];
    let nvlIdx = idx + direction;

    if (nvlIdx >= 0 && nvlIdx < maMain.length) {
        let temp = maMain[idx];
        maMain[idx] = maMain[nvlIdx];
        maMain[nvlIdx] = temp;

        cartesSelectionnees = [nvlIdx];
        afficherMain();
    }
}

function actionPiocher() {
    if (!monTour) {
        alert("Ce n'est pas votre tour !");
        return;
    }
    if (aPioche) {
        alert("Vous avez déjà pioché !");
        return;
    }

    let cartePiochee = pioche.pop();
    maMain.push(cartePiochee);
    aPioche = true;
    piocheDepuisDefausse = false; 
    afficherMain();

    if (modeJeu === "MULTI") {
        miseAJourActionReseau();
    }
}

function actionPiocherDefausse() {
    if (!monTour) {
        alert("Ce n'est pas votre tour !");
        return;
    }
    if (aPioche) {
        alert("Vous avez déjà pioché !");
        return;
    }
    if (defausse.length === 0) {
        alert("La défausse est vide !");
        return;
    }

    let confirmation = confirm("Règle : Vous ne pouvez piocher dans la défausse QUE si vous posez TOUTE votre main ce tour-ci.");
    if (!confirmation) return;

    let cartePrelee = defausse.pop();
    maMain.push(cartePrelee);
    aPioche = true;
    piocheDepuisDefausse = true; 
    
    afficherMain();
    afficherDefausse();

    if (modeJeu === "MULTI") {
        miseAJourActionReseau();
    }
}

function annulerPiocheDefausse() {
    if (aPioche && piocheDepuisDefausse && !aPoseMaMain) {
        let carteRemise = maMain.pop();
        defausse.push(carteRemise);
        aPioche = false;
        piocheDepuisDefausse = false;
        afficherMain();
        afficherDefausse();
        
        if (modeJeu === "MULTI") {
            miseAJourActionReseau();
        }
    }
}

function actionTrierMain() {
    maMain.sort((a, b) => {
        if (a.couleur !== b.couleur) {
            return COULEURS.indexOf(a.couleur) - COULEURS.indexOf(b.couleur);
        }
        return obtenirValeurNumerique(a.valeur) - obtenirValeurNumerique(a.valeur);
    });
    cartesSelectionnees = [];
    afficherMain();
}

function creerNouveauGroupe() {
    if (mancheActuelle <= 3 && groupesAposer.length >= 1) {
        alert("⚠️ RÈGLE : Durant les 3 premières manches, vous ne pouvez poser qu'UNE SEULE combinaison !");
        return;
    }

    if (cartesSelectionnees.length < 3) {
        alert("Une combinaison doit contenir au moins 3 cartes !");
        return;
    }

    let nouveauGroupe = cartesSelectionnees.map(i => maMain[i]);
    
    if (estUneFamille(nouveauGroupe) || estUneSuite(nouveauGroupe)) {
        groupesAposer.push(nouveauGroupe);
        maMain = maMain.filter((_, idx) => !cartesSelectionnees.includes(idx));
        cartesSelectionnees = [];
        afficherMain();
        afficherGroupesAPoser();
    } else {
        alert("Ce groupe n'est ni une Suite valide, ni une Famille valide !");
    }
}

function retirerCartesPosees() {
    groupesAposer.forEach(groupe => {
        maMain.push(...groupe);
    });
    groupesAposer = [];
    cartesSelectionnees = [];
    afficherMain();
    afficherGroupesAPoser();
}

function actionDefausserBouton() {
    if (!monTour) {
        alert("Ce n'est pas votre tour !");
        return;
    }

    if (!aPioche) {
        alert("Vous devez piocher d'abord !");
        return;
    }

    if (groupesAposer.length > 0 && maMain.length === 1) {
        let tousValides = groupesAposer.every(g => validerCombinaison(g));
        if (tousValides) aPoseMaMain = true;
    }

    if (piocheDepuisDefausse && !aPoseMaMain && !estDernierTour) {
        alert("⚠️ RÈGLE : Vous avez pioché dans la défausse, vous êtes OBLIGÉ de placer toute votre main dans des combinaisons valides avant de défausser !");
        return;
    }

    if (cartesSelectionnees.length !== 1) {
        alert("Sélectionnez 1 carte à défausser.");
        return;
    }

    let indexCarte = cartesSelectionnees[0];
    let carteDefaussee = maMain.splice(indexCarte, 1)[0];
    defausse.push(carteDefaussee);

    cartesSelectionnees = [];
    aPioche = false;
    monTour = false;
    piocheDepuisDefausse = false;

    afficherMain();
    afficherDefausse();

    if (modeJeu === "SOLO") {
        if (aPoseMaMain && !estDernierTour) {
            estDernierTour = true;
            indexJoueurQuiAPose = 0; 
            aPoseMaMain = false;
        }
        passerTourSuivantSolo();
        return;
    }

    // MULTIJOUEUR
    let aPoseCeTour = false;
    if (aPoseMaMain) {
        aPoseCeTour = true;
        aPoseMaMain = false;
    }

    if (!estDernierTour && aPoseCeTour) {
        estDernierTour = true;
        indexJoueurQuiAPoseReseau = monIndexReseau;
    }

    // Calcul pénalités si fin de tour en dernier tour
    let mesPenalites = estDernierTour ? calculerPointsMain(maMain) : 0;

    // Passer au joueur suivant
    let suivantIndex = (indexJoueurActuelReseau + 1) % joueursReseau.length;

    // Vérification de la fin de la manche (si le tour revient à celui qui a posé)
    let finMancheAtteinte = (estDernierTour && suivantIndex === indexJoueurQuiAPoseReseau);

    if (finMancheAtteinte) {
        // Appliquer les scores pour tout le monde
        joueursReseau[monIndexReseau].score += mesPenalites;
    }

    let mainsMaj = {};
    mainsJoueursGlobales[monIndexReseau] = maMain;

    let nouvelEtat = {
        mancheActuelle: mancheActuelle,
        pioche: pioche,
        defausse: defausse,
        mains: mainsJoueursGlobales,
        indexActuel: finMancheAtteinte ? indexJoueurQuiAPoseReseau : suivantIndex,
        estDernierTour: estDernierTour,
        indexQuiAPose: indexJoueurQuiAPoseReseau,
        joueurs: joueursReseau,
        finDeManche: finMancheAtteinte
    };

    envoyerEtatJeuFirebase(nouvelEtat);
}

function miseAJourActionReseau() {
    mainsJoueursGlobales[monIndexReseau] = maMain;
    let nouvelEtat = {
        mancheActuelle: mancheActuelle,
        pioche: pioche,
        defausse: defausse,
        mains: mainsJoueursGlobales,
        indexActuel: indexJoueurActuelReseau,
        estDernierTour: estDernierTour,
        indexQuiAPose: indexJoueurQuiAPoseReseau,
        joueurs: joueursReseau,
        finDeManche: false
    };
    envoyerEtatJeuFirebase(nouvelEtat);
}

function calculerPointsMain(main) {
    let total = 0;
    main.forEach(carte => {
        if (carte.type === 'joker') total += 50;
        else if (estUnJokerOuAtout(carte)) total += 20;
        else if (carte.valeur === 'V') total += 11;
        else if (carte.valeur === 'D') total += 12;
        else if (carte.valeur === 'R') total += 13;
        else total += parseInt(carte.valeur);
    });
    return total;
}

// ==========================================
// 5. SYNCHRONISATION EN TEMPS REEL (FIREBASE)
// ==========================================
let mainsJoueursGlobales = {};

function preparerTableauScoresUI() {
    const headerTr = document.getElementById('score-header');
    const footerTr = document.getElementById('score-footer');
    const tbody = document.getElementById('lignes-scores');

    if (!headerTr || !footerTr || !tbody) return;

    if (modeJeu === "SOLO") {
        headerTr.innerHTML = `<th>Manche</th><th>${monPseudo}</th><th>${bots[0].nom}</th><th>${bots[1].nom}</th><th>${bots[2].nom}</th>`;
        footerTr.innerHTML = `<th>TOTAL</th><th id="total-joueur">0 pts</th><th id="total-bot-1">0 pts</th><th id="total-bot-2">0 pts</th><th id="total-bot-3">0 pts</th>`;
    } else {
        let cols = `<th>Manche</th>`;
        let foot = `<th>TOTAL</th>`;
        joueursReseau.forEach((j) => {
            cols += `<th>${j.pseudo}</th>`;
            foot += `<th id="total-multi-${j.index}">${j.score || 0} pts</th>`;
        });
        headerTr.innerHTML = cols;
        footerTr.innerHTML = foot;
    }
}

function demarrerMancheReseau() {
    modeJeu = "MULTI";
    pioche = melanger(genererDeck());
    let nbCartes = mancheActuelle + 2;
    mainsJoueursGlobales = {};

    joueursReseau.forEach(j => {
        let mainJ = [];
        for (let i = 0; i < nbCartes; i++) {
            mainJ.push(pioche.pop());
        }
        mainsJoueursGlobales[j.index] = mainJ;
    });

    defausse = [pioche.pop()];

    let etatInitial = {
        mancheActuelle: mancheActuelle,
        pioche: pioche,
        defausse: defausse,
        mains: mainsJoueursGlobales,
        indexActuel: 0,
        estDernierTour: false,
        indexQuiAPose: -1,
        joueurs: joueursReseau,
        finDeManche: false
    };

    envoyerEtatJeuFirebase(etatInitial);
}

function synchroniserEtatJeu(state, confirmations) {
    if (!state) return;

    mancheActuelle = state.mancheActuelle;
    pioche = state.pioche || [];
    defausse = state.defausse || [];
    mainsJoueursGlobales = state.mains || {};
    joueursReseau = state.joueurs || [];
    indexJoueurActuelReseau = state.indexActuel;
    estDernierTour = state.estDernierTour;
    indexJoueurQuiAPoseReseau = state.indexQuiAPose;

    maMain = mainsJoueursGlobales[monIndexReseau] || [];
    monTour = (monIndexReseau === indexJoueurActuelReseau);

    preparerTableauScoresUI();
    afficherMain();
    afficherDefausse();
    afficherGroupesAPoser();
    mettreAJourListeJoueursMultiUI();
    mettreAJourStatutTour();

    // FIN DE MANCHE
    if (state.finDeManche) {
        let nbConf = confirmations ? Object.keys(confirmations).length : 0;
        document.getElementById('status-message').innerText = `🏁 Fin de la manche ${mancheActuelle} ! Joueurs prêts : ${nbConf}/${joueursReseau.length}`;

        // Si tout le monde a validé sa fin de manche
        if (estHote && nbConf >= joueursReseau.length) {
            mancheActuelle++;
            if (mancheActuelle > 11) {
                alert("🏆 PARTIE TERMINÉE !");
            } else {
                // Effacer les confirmations et lancer la manche suivante
                roomRef.child('confirmations').remove();
                demarrerMancheReseau();
            }
        }
    }
}

function validerFinMancheBouton() {
    envoyerConfirmationJoueur(monIndexReseau);
}

function mettreAJourListeJoueursMultiUI() {
    const container = document.getElementById('players-list');
    if (!container) return;
    container.innerHTML = '';

    joueursReseau.forEach((j) => {
        const div = document.createElement('div');
        div.className = 'player-card' + (j.index === indexJoueurActuelReseau ? ' active-turn' : '');
        let roleText = j.index === monIndexReseau ? ' (Vous)' : '';
        div.innerHTML = `<b>${j.pseudo}${roleText} - ${j.score || 0} pts</b>`;
        container.appendChild(div);
    });
}

// ==========================================
// 6. MODE SOLO (CONTRE 3 BOTS)
// ==========================================
let bots = [
    { id: 1, nom: "Bot 1", main: [], score: 0 },
    { id: 2, nom: "Bot 2", main: [], score: 0 },
    { id: 3, nom: "Bot 3", main: [], score: 0 }
];

let listeJoueursSolo = []; 
let indexJoueurActuel = 0;
let indexJoueurQuiAPose = -1;

function initialiserPartieSolo() {
    if (mancheActuelle === 1) {
        reinitialiserVariablePartie();
        preparerTableauScoresUI();
    }

    pioche = melanger(genererDeck());
    let nbCartes = mancheActuelle + 2;

    maMain = [];
    for (let i = 0; i < nbCartes; i++) maMain.push(pioche.pop());

    bots.forEach(bot => {
        bot.main = [];
        for (let i = 0; i < nbCartes; i++) bot.main.push(pioche.pop());
    });

    defausse = [pioche.pop()];
    aPoseMaMain = false;
    estDernierTour = false;
    groupesAposer = [];
    cartesSelectionnees = [];
    aPioche = false;

    listeJoueursSolo = [
        { type: 'HUMAIN', nom: monPseudo },
        { type: 'BOT', botData: bots[0] },
        { type: 'BOT', botData: bots[1] },
        { type: 'BOT', botData: bots[2] }
    ];

    indexJoueurActuel = 0; 
    monTour = true;

    afficherMain();
    afficherDefausse();
    afficherGroupesAPoser();
    mettreAJourListeJoueursUI();
    mettreAJourStatutTour();
}

function jouerTourBot(bot) {
    document.getElementById('status-message').innerText = `🤖 ${bot.nom} réfléchit...`;

    setTimeout(() => {
        if (pioche.length === 0) actionPiocher(); 
        let cartePiochee = pioche.pop();
        bot.main.push(cartePiochee);

        bot.main.sort((a, b) => {
            let ptsA = estUnJokerOuAtout(a) ? 0 : obtenirValeurNumerique(a.valeur);
            let ptsB = estUnJokerOuAtout(b) ? 0 : obtenirValeurNumerique(b.valeur);
            return ptsB - ptsA;
        });

        let carteDefaussee = bot.main.shift();
        defausse.push(carteDefaussee);
        afficherDefausse();

        if (!estDernierTour && bot.main.length <= 3 && Math.random() < 0.5) {
            estDernierTour = true;
            indexJoueurQuiAPose = indexJoueurActuel;
        }

        passerTourSuivantSolo();
    }, 1000);
}

function passerTourSuivantSolo() {
    indexJoueurActuel = (indexJoueurActuel + 1) % listeJoueursSolo.length;
    let joueurActuel = listeJoueursSolo[indexJoueurActuel];

    mettreAJourListeJoueursUI();

    if (estDernierTour && indexJoueurActuel === indexJoueurQuiAPose) {
        finirMancheSolo();
        return;
    }

    if (joueurActuel.type === 'HUMAIN') {
        monTour = true;
        aPioche = false;
        mettreAJourStatutTour();
    } else {
        monTour = false;
        jouerTourBot(joueurActuel.botData);
    }
}

function mettreAJourListeJoueursUI() {
    const container = document.getElementById('players-list');
    if (!container) return;
    container.innerHTML = '';

    listeJoueursSolo.forEach((j, idx) => {
        const div = document.createElement('div');
        div.className = 'player-card';
        if (idx === indexJoueurActuel) div.classList.add('active-turn');
        let nomAffiche = j.type === 'HUMAIN' ? j.nom : j.botData.nom;
        div.innerHTML = `<b>${nomAffiche}</b>`;
        container.appendChild(div);
    });
}

function finirMancheSolo() {
    let penHumain = (indexJoueurQuiAPose === 0) ? 0 : calculerPointsMain(maMain);
    scoreJoueur += penHumain;

    let penBot1 = (indexJoueurQuiAPose === 1) ? 0 : calculerPointsMain(bots[0].main);
    let penBot2 = (indexJoueurQuiAPose === 2) ? 0 : calculerPointsMain(bots[1].main);
    let penBot3 = (indexJoueurQuiAPose === 3) ? 0 : calculerPointsMain(bots[2].main);

    bots[0].score += penBot1;
    bots[1].score += penBot2;
    bots[2].score += penBot3;

    ajouterLigneScoreSolo(mancheActuelle, penHumain, penBot1, penBot2, penBot3);

    mancheActuelle++;
    if (mancheActuelle > 11) {
        alert("🎮 PARTIE SOLO TERMINÉE ! Les 11 manches ont été jouées.");
        document.getElementById('status-message').innerText = "🏆 Partie terminée !";
    } else {
        initialiserPartieSolo();
    }
}

function ajouterLigneScoreSolo(manche, penHumain, penBot1, penBot2, penBot3) {
    const tbody = document.getElementById('lignes-scores');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>M${manche} (${manche + 2}c)</td>
        <td>${penHumain} pts</td>
        <td>${penBot1} pts</td>
        <td>${penBot2} pts</td>
        <td>${penBot3} pts</td>
    `;
    tbody.appendChild(tr);

    const totJ = document.getElementById('total-joueur');
    const totB1 = document.getElementById('total-bot-1');
    const totB2 = document.getElementById('total-bot-2');
    const totB3 = document.getElementById('total-bot-3');

    if (totJ) totJ.innerText = `${scoreJoueur} pts`;
    if (totB1) totB1.innerText = `${bots[0].score} pts`;
    if (totB2) totB2.innerText = `${bots[1].score} pts`;
    if (totB3) totB3.innerText = `${bots[2].score} pts`;
}

// ==========================================
// 7. MODALES MOBILE
// ==========================================
function ouvrirModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) modal.classList.add('open');
}

function fermerModal(idModal) {
    const modal = document.getElementById(idModal);
    if (modal) modal.classList.remove('open');
}