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
        
        // Si la carte est un Atout ou Joker, on lui ajoute une distinction
        let estAtout = estUnJokerOuAtout(carte);
        if (estAtout) {
            cardDiv.style.border = "2px solid #f1c40f"; // Bordure dorée
        }

        if (cartesSelectionnees.includes(index)) {
            cardDiv.classList.add('carte-selectionnee');
        }

        cardDiv.onclick = () => verifierClicCarte(index);
        
        cardDiv.innerHTML = `
            <div>${carte.valeur} ${estAtout ? '⭐' : ''}</div>
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

// Fonction pour donner un score numérique aux valeurs afin de les trier facilement
function obtenirValeurNumerique(valeur) {
    if (valeur === 'V') return 11;
    if (valeur === 'D') return 12;
    if (valeur === 'R') return 13;
    if (valeur === 'Joker') return 50; // Les jokers vont à la fin
    return parseInt(valeur);
}

// ACTION : Trier la main par couleur puis par valeur
function actionTrierMain() {
    maMain.sort((a, b) => {
        // 1. On compare d'abord les couleurs
        if (a.couleur !== b.couleur) {
            return COULEURS.indexOf(a.couleur) - COULEURS.indexOf(b.couleur);
        }
        // 2. Si c'est la même couleur, on compare les valeurs numériques
        return obtenirValeurNumerique(a.valeur) - obtenirValeurNumerique(b.valeur);
    });

    // On rafraîchit l'affichage pour voir le résultat
    afficherMain();
}

// Détermine si une carte agit comme un Joker (soit un Joker, soit l'Atout de la manche)
function estUnJokerOuAtout(carte) {
    if (carte.type === 'joker') return true;
    
    // L'Atout correspond au numéro de la manche + 2 (Ex: Manche 1 = 3 cartes -> Atout = 3)
    let valeurAtout = mancheActuelle + 2;
    let valeurAtoutTexte = valeurAtout.toString();
    
    if (valeurAtout === 11) valeurAtoutTexte = 'V';
    if (valeurAtout === 12) valeurAtoutTexte = 'D';
    if (valeurAtout === 13) valeurAtoutTexte = 'R';

    return carte.valeur === valeurAtoutTexte;
}

// Vérifier si un groupe forme une Famille (en comptant les Atouts comme Jokers)
function estUneFamille(groupe) {
    if (groupe.length < 3) return false;
    
    // On filtre toutes les cartes qui NE SONT PAS des Jokers ou des Atouts
    let cartesNormales = groupe.filter(c => !estUnJokerOuAtout(c));
    if (cartesNormales.length === 0) return true; // Que des Jokers/Atouts = valide !

    let valeurRef = cartesNormales[0].valeur;
    // Toutes les cartes normales doivent avoir la même valeur
    return cartesNormales.every(c => c.valeur === valeurRef);
}

// Vérifier si un groupe forme une Suite (en comptant les Atouts comme Jokers)
function estUneSuite(groupe) {
    if (groupe.length < 3) return false;
    
    // On filtre pour ne garder que les cartes "normales"
    let cartesNormales = groupe.filter(c => !estUnJokerOuAtout(c));
    if (cartesNormales.length === 0) return true; // Que des Jokers/Atouts = valide !

    // Vérifier la même couleur pour toutes les cartes normales
    let couleurRef = cartesNormales[0].couleur;
    if (!cartesNormales.every(c => c.couleur === couleurRef)) return false;

    // Convertir en valeurs numériques et trier
    let valeurs = cartesNormales.map(c => obtenirValeurNumerique(c.valeur)).sort((a, b) => a - b);
    
    // Nombre de Jokers/Atouts disponibles pour combler les trous
    let nbJokersDispo = groupe.length - cartesNormales.length;
    
    for (let i = 0; i < valeurs.length - 1; i++) {
        let ecart = valeurs[i+1] - valeurs[i] - 1;
        if (ecart < 0) return false; // Doublons interdits dans une suite (ex: deux 5 de même couleur)
        nbJokersDispo -= ecart;
        if (nbJokersDispo < 0) return false; // Pas assez de Jokers/Atouts
    }
    return true;
}

// Action de test pour valider une sélection (à utiliser très bientôt !)
function testerCombinaison(indicesSélectionnes) {
    let groupe = indicesSélectionnes.map(i => maMain[i]);
    if (estUneFamille(groupe)) {
        alert("C'est une Famille valide !");
    } else if (estUneSuite(groupe)) {
        alert("C'est une Suite valide !");
    } else {
        alert("Combinaison invalide.");
    }
}

let cartesSelectionnees = []; // Indices des cartes cliquées pour créer une combinaison
let groupesAposer = []; // Tableau contenant les groupes de cartes préparés (ex: [ [c1,c2,c3], [c4,c5,c6] ])

// 1. Modifier l'affichage des cartes pour gérer le clic de sélection
function afficherMain() {
    const handDiv = document.getElementById('player-hand');
    handDiv.innerHTML = ''; 
    
    maMain.forEach((carte, index) => {
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card', carte.couleur);
        
        // Si la carte est actuellement sélectionnée, on lui ajoute la classe
        if (cartesSelectionnees.includes(index)) {
            cardDiv.classList.add('carte-selectionnee');
        }

        // Clic sur une carte : si on a pioché, le clic bascule entre sélectionner ou défausser
        cardDiv.onclick = () => verifierClicCarte(index);
        
        cardDiv.innerHTML = `
            <div>${carte.valeur}</div>
            <div style="font-size: 24px;">${obtenirSymbole(carte.couleur)}</div>
            <div style="text-align: right;">${carte.valeur}</div>
        `;
        handDiv.appendChild(cardDiv);
    });
}

function verifierClicCarte(index) {
    // Si la carte est déjà sélectionnée pour poser, on la retire de la sélection
    if (cartesSelectionnees.includes(index)) {
        cartesSelectionnees = cartesSelectionnees.filter(i => i !== index);
    } else {
        // Sinon, on l'ajoute à la sélection temporaire
        cartesSelectionnees.push(index);
    }
    afficherMain();
}

// 2. Créer un groupe à partir des cartes sélectionnées
function creerNouveauGroupe() {
    if (cartesSelectionnees.length < 3) {
        alert("Une combinaison doit contenir au moins 3 cartes !");
        return;
    }

    // Récupérer les cartes sélectionnées
    let nouveauGroupe = cartesSelectionnees.map(i => maMain[i]);
    
    // Vérifier si ce groupe forme une suite ou une famille valide
    if (estUneFamille(nouveauGroupe) || estUneSuite(nouveauGroupe)) {
        groupesAposer.push(nouveauGroupe);
        
        // Retirer ces cartes de la main principale
        maMain = maMain.filter((_, idx) => !cartesSelectionnees.includes(idx));
        cartesSelectionnees = []; // Réinitialiser la sélection
        
        afficherMain();
        afficherGroupesAPoser();
    } else {
        alert("Ce groupe n'est ni une Suite valide, ni une Famille valide !");
    }
}

// 3. Afficher les groupes validés en attente de pose définitive
function afficherGroupesAPoser() {
    const container = document.getElementById('zones-combinaisons');
    container.innerHTML = '';

    groupesAposer.forEach((groupe, idxGroupe) => {
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

// 4. Valider l'abattage complet de la main
function validerEtPoserMain() {
    // Selon la règle : Il faut poser la TOTALITÉ de sa main 
    if (maMain.length > 0) {
        alert(`Il vous reste ${maMain.length} carte(s) en main. Vous devez utiliser toutes vos cartes dans des combinaisons pour pouvoir poser !`);
        return;
    }

    if (groupesAposer.length === 0) {
        alert("Vous n'avez préparé aucune combinaison.");
        return;
    }

    alert("Félicitations ! Vous avez posé toute votre main ! Les autres joueurs ont un dernier tour.");
    // Ici, nous déclencherons le dernier tour pour le réseau
}

// Nouvelle fonction dédiée pour défausser via le bouton
function actionDefausserBouton() {
    if (!aPioche) {
        alert("Vous devez d'abord piocher une carte !"); // [cite: 22, 23]
        return;
    }

    if (cartesSelectionnees.length === 0) {
        alert("Cliquez sur la carte de votre main que vous souhaitez défausser.");
        return;
    }

    if (cartesSelectionnees.length > 1) {
        alert("Vous ne pouvez défausser qu'une seule carte à la fois !"); // 
        return;
    }

    // Récupérer l'index de la carte choisie
    let indexCarte = cartesSelectionnees[0];

    // Retirer la carte de la main et l'ajouter à la défausse
    let carteDefaussee = maMain.splice(indexCarte, 1)[0]; // 
    defausse.push(carteDefaussee); // 

    // Réinitialiser les états
    cartesSelectionnees = [];
    aPioche = false; // Fin du tour ! 

    // Mettre à jour l'affichage
    afficherMain();
    afficherDefausse();
}