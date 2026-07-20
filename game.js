// Configuration du jeu
const COULEURS = ['coeur', 'carreau', 'trefle', 'pique', 'etoile'];
const VALEURS = ['3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R']; // V=Valet, D=Dame, R=Roi

let pioche = [];
let defausse = [];
let maMain = [];
let mancheActuelle = 1; // Manche 1 = 3 cartes

// 1. Générer le paquet complet (2 sets de 58 cartes = 116 cartes)
function genererDeck() {
    let deck = [];
    
    // On fait deux boucles pour les 2 sets identiques
    for (let set = 0; set < 2; set++) {
        // Ajout des cartes normales
        COULEURS.forEach(couleur => {
            VALEURS.forEach(valeur => {
                deck.push({ valeur: valeur, couleur: couleur, type: 'normale' });
            });
        });
        // Ajout des 3 Jokers par set (6 au total)
        for (let j = 0; j < 3; j++) {
            deck.push({ valeur: 'Joker', couleur: 'joker', type: 'joker' });
        }
    }
    return deck;
}

// 2. Mélanger le paquet (Fisher-Yates)
function melanger(deck) {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
}

// 3. Afficher la main dans le HTML
function afficherMain() {
    const handDiv = document.getElementById('player-hand');
    handDiv.innerHTML = ''; // On vide l'affichage précédent
    
    maMain.forEach(carte => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', carte.colour || carte.couleur);
        
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
    return '🃏'; // Joker
}

// Lancement d'une partie de test en local
function initialiserPartieLocale() {
    pioche = melanger(genererDeck());
    
    // Calcul du nombre de cartes à distribuer (Manche 1 = 3 cartes)
    let nbCartes = mancheActuelle + 2; 
    
    for (let i = 0; i < nbCartes; i++) {
        maMain.push(pioche.pop());
    }
    
    afficherMain();
}

// On lance dès que la page charge
window.onload = initialiserPartieLocale;