const COULEURS = ['coeur', 'carreau', 'trefle', 'pique', 'etoile'];
const VALEURS = ['3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];

let pioche = [];
let defausse = [];
let maMain = [];
let mancheActuelle = 1; 
let aPioche = false; // Sécurité : force le joueur à piocher AVANT de défausser

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

// Nouvelle fonction : Met à jour la pile de défausse visuellement
function afficherDefausse() {
    const discardSlot = document.getElementById('discard-pile');
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

function afficherMain() {
    const handDiv = document.getElementById('player-hand');
    handDiv.innerHTML = ''; 
    
    // On ajoute un index pour savoir sur quelle carte on clique
    maMain.forEach((carte, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', carte.couleur);
        // Au clic, on tente de défausser cette carte
        cardDiv.setAttribute('onclick', `actionDefausser(${index})`);
        
        cardDiv.innerHTML = `
            <div>${carte.valeur}</div>
            <div style="font-size: 24px;">${obtenirSymbole(carte.couleur)}</div>
            <div style="text-align: right;">${carte.valeur}</div>
        `;
        handDiv.appendChild(cardDiv);
    });
}

function obtenirSymbole(couleur) {
    if (couleur === 'coeur') return '♥';
    if (couleur === 'carreau') return '♦';
    if (couleur === 'trefle') return '♣';
    if (couleur === 'pique') return '♠';
    if (couleur === 'etoile') return '★';
    return '🃏';
}

// ACTION : Piocher une carte
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

// ACTION : Piocher dans la défausse
function actionPiocherDefausse() {
    if (aPioche) {
        alert("Vous avez déjà pioché ! Défaussez une carte pour finir votre tour.");
        return;
    }
    if (defausse.length === 0) {
        alert("La défausse est vide, vous devez piocher dans le paquet !");
        return;
    }
    
    // On récupère la carte visible de la défausse
    let cartePrelee = defausse.pop();
    maMain.push(cartePrelee);
    aPioche = true; // On valide l'action de pioche
    
    afficherMain();
    afficherDefausse();
}

// ACTION : Défausser une carte
function actionDefausser(indexCarte) {
    if (!aPioche) {
        alert("Vous devez d'abord piocher une carte !");
        return;
    }
    // On retire la carte de la main et on l'envoie dans la défausse
    let carteDefaussee = maMain.splice(indexCarte, 1)[0];
    defausse.push(carteDefaussee);
    
    aPioche = false; // Le tour est fini, on réinitialise pour le prochain tour
    afficherMain();
    afficherDefausse();
}

function initialiserPartieLocale() {
    pioche = melanger(genererDeck());
    let nbCartes = mancheActuelle + 2; 
    
    for (let i = 0; i < nbCartes; i++) {
        maMain.push(pioche.pop());
    }
    
    // On retourne la première carte de la pioche pour lancer la défausse
    defausse.push(pioche.pop());
    
    afficherMain();
    afficherDefausse();
}

window.onload = initialiserPartieLocale;