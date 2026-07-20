// ==========================================
// 1. CONFIGURATION & VARIABLES GLOBALES
// ==========================================
const COULEURS = ['coeur', 'carreau', 'trefle', 'pique', 'etoile'];
const VALEURS = ['3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];

let pioche = [];
let defausse = [];
let maMain = [];
let mancheActuelle = 1; // Manche 1 = 3 cartes = Atout 3
let aPioche = false;

let cartesSelectionnees = []; // Indices des cartes cliquées dans la main
let groupesAposer = [];        // Groupes de combinaisons validés en attente de pose

// ==========================================
// 2. CRÉATION ET MÉLANGE DU DECK
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

// ==========================================
// 3. RÈGLES : ATOUTS, JOKERS ET COMBINAISONS
// ==========================================
function estUnJokerOuAtout(carte) {
    if (carte.type === 'joker') return true;
    
    let valeurAtout = mancheActuelle + 2;
    let valeurAtoutTexte = valeurAtout.toString();
    
    if (valeurAtout === 11) valeurAtoutTexte = 'V';
    if (valeurAtout === 12) valeurAtoutTexte = 'D';
    if (valeurAtout === 13) valeurAtoutTexte = 'R';

    return carte.valeur === valeurAtoutTexte;
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

// ==========================================
// 4. AFFICHAGE DE L'INTERFACE
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
            `;
            divGroupe.appendChild(cardDiv);
        });

        container.appendChild(divGroupe);
    });
}

// ==========================================
// 5. ACTIONS DU JOUEUR (PIOCHER, DÉFAUSSER, TRIER)
// ==========================================
function verifierClicCarte(index) {
    if (cartesSelectionnees.includes(index)) {
        cartesSelectionnees = cartesSelectionnees.filter(i => i !== index);
    } else {
        cartesSelectionnees.push(index);
    }
    afficherMain();
}

function actionPiocher() {
    if (aPioche) {
        alert("Vous avez déjà pioché ! Défaussez une carte pour finir votre tour.");
        return;
    }
    if (pioche.length > 0) {
        let cartePiochee = pioche.pop();
        maMain.push(cartePiochee);
        aPioche = true;
        afficherMain();
    }
}

function actionPiocherDefausse() {
    if (aPioche) {
        alert("Vous avez déjà pioché ! Défaussez une carte pour finir votre tour.");
        return;
    }
    if (defausse.length === 0) {
        alert("La défausse est vide, vous devez piocher dans le paquet !");
        return;
    }
    
    let cartePrelee = defausse.pop();
    maMain.push(cartePrelee);
    aPioche = true;
    
    afficherMain();
    afficherDefausse();
}

function actionDefausserBouton() {
    if (!aPioche) {
        alert("Vous devez d'abord piocher une carte !");
        return;
    }
    if (cartesSelectionnees.length === 0) {
        alert("Cliquez sur la carte de votre main que vous souhaitez défausser.");
        return;
    }
    if (cartesSelectionnees.length > 1) {
        alert("Vous ne pouvez défausser qu'une seule carte à la fois !");
        return;
    }

    let indexCarte = cartesSelectionnees[0];
    let carteDefaussee = maMain.splice(indexCarte, 1)[0];
    defausse.push(carteDefaussee);

    cartesSelectionnees = [];
    aPioche = false;

    afficherMain();
    afficherDefausse();

    // Notification réseau si connecté
    if (typeof envoyerActionReseau === 'function') {
        envoyerActionReseau('DEFAUSSE', {
            carte: carteDefaussee,
            mainRestante: maMain.length
        });
    }
}

function actionTrierMain() {
    maMain.sort((a, b) => {
        if (a.couleur !== b.couleur) {
            return COULEURS.indexOf(a.couleur) - COULEURS.indexOf(b.couleur);
        }
        return obtenirValeurNumerique(a.valeur) - obtenirValeurNumerique(b.valeur);
    });
    cartesSelectionnees = [];
    afficherMain();
}

// ==========================================
// 6. GESTION DE LA POSE DE MAIN
// ==========================================
function creerNouveauGroupe() {
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

function validerEtPoserMain() {
    if (maMain.length > 0) {
        alert(`Il vous reste ${maMain.length} carte(s) en main. Vous devez utiliser toutes vos cartes dans des combinaisons pour pouvoir poser !`);
        return;
    }

    if (groupesAposer.length === 0) {
        alert("Vous n'avez préparé aucune combinaison.");
        return;
    }

    alert("Félicitations ! Vous avez posé toute votre main !");
    
    if (typeof envoyerActionReseau === 'function') {
        envoyerActionReseau('POSE', { groupes: groupesAposer });
    }
}

// ==========================================
// 7. INITIALISATION ET RÉSEAU
// ==========================================
function initialiserPartieLocale() {
    pioche = melanger(genererDeck());
    let nbCartes = mancheActuelle + 2; 
    
    maMain = [];
    for (let i = 0; i < nbCartes; i++) {
        maMain.push(pioche.pop());
    }
    
    defausse = [pioche.pop()];
    
    afficherMain();
    afficherDefausse();
}

function initialiserPartieReseau() {
    pioche = melanger(genererDeck());
    let nbCartes = mancheActuelle + 2;
    
    maMain = [];
    let mainJoueur2 = [];
    
    for (let i = 0; i < nbCartes; i++) {
        maMain.push(pioche.pop());
        mainJoueur2.push(pioche.pop());
    }
    
    defausse = [pioche.pop()];
    
    afficherMain();
    afficherDefausse();

    if (typeof envoyerActionReseau === 'function') {
        envoyerActionReseau('DEBUT_PARTIE', {
            pioche: pioche,
            mainJoueur2: mainJoueur2,
            defausse: defausse
        });
    }
}

function recevoirActionReseau(donnees) {
    if (donnees.type === 'DEFAUSSE') {
        defausse.push(donnees.carte);
        afficherDefausse();
        alert("L'autre joueur a défaussé une carte. C'est à votre tour !");
    }
    else if (donnees.type === 'DEBUT_PARTIE') {
        pioche = donnees.contenu.pioche;
        maMain = donnees.contenu.mainJoueur2;
        defausse = donnees.contenu.defausse;
        afficherMain();
        afficherDefausse();
    }
    else if (donnees.type === 'POSE') {
        alert("L'autre joueur a posé toute sa main ! Vous avez un dernier tour.");
    }
}

window.onload = initialiserPartieLocale;