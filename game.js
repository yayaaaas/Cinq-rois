// ==========================================
// 1. VARIABLES GLOBALES
// ==========================================
const COULEURS = ['coeur', 'carreau', 'trefle', 'pique', 'etoile'];
const VALEURS = ['3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];

let pioche = [];
let defausse = [];
let maMain = [];
let mancheActuelle = 1; 
let aPioche = false;
let monTour = false; // Gère le tour par tour

let cartesSelectionnees = [];
let groupesAposer = [];

// ==========================================
// 2. GÉNÉRATION DU DECK ET TRI
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

// ==========================================
// 3. AFFICHAGE DE L'INTERFACE
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

function mettreAJourStatutTour() {
    const status = document.getElementById('status-message');
    if (status) {
        status.innerText = monTour ? "C'est VOTRE tour de jouer !" : "Tour de votre ADVERSAIRE...";
    }
}

// ==========================================
// 4. ACTIONS DU JOUEUR (SYNCHRONISÉES)
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
    if (!monTour) {
        alert("Ce n'est pas votre tour !");
        return;
    }
    if (aPioche) {
        alert("Vous avez déjà pioché !");
        return;
    }
    if (pioche.length > 0) {
        let cartePiochee = pioche.pop();
        maMain.push(cartePiochee);
        aPioche = true;
        afficherMain();

        // On informe l'autre joueur que la pioche a diminué
        envoyerActionReseau('ACTION_PIOCHE_PIOCHE', {});
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
    
    let cartePrelee = defausse.pop();
    maMain.push(cartePrelee);
    aPioche = true;
    
    afficherMain();
    afficherDefausse();

    // On informe l'autre joueur de la pioche dans la défausse
    envoyerActionReseau('ACTION_PIOCHE_DEFAUSSE', {});
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
    if (cartesSelectionnees.length !== 1) {
        alert("Sélectionnez EXACTEMENT une carte à défausser.");
        return;
    }

    let indexCarte = cartesSelectionnees[0];
    let carteDefaussee = maMain.splice(indexCarte, 1)[0];
    defausse.push(carteDefaussee);

    cartesSelectionnees = [];
    aPioche = false;
    monTour = false; // Fin de tour !

    afficherMain();
    afficherDefausse();
    mettreAJourStatutTour();

    // Synchronisation : on envoie la carte défaussée et on donne la main à l'adversaire
    envoyerActionReseau('ACTION_DEFAUSSER', { carte: carteDefaussee });
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

function validerEtPoserMain() {
    if (!monTour) {
        alert("Ce n'est pas votre tour !");
        return;
    }

    if (!aPioche) {
        alert("Vous devez piocher une carte avant de poser votre main !");
        return;
    }

    // S'il reste plus d'1 carte (celle à défausser pour finir)
    if (maMain.length > 1) {
        alert(`Il vous reste ${maMain.length} carte(s) en main. Il faut placer toutes vos cartes dans des combinaisons (sauf 1 à défausser) !`);
        return;
    }

    if (groupesAposer.length === 0) {
        alert("Vous n'avez préparé aucune combinaison.");
        return;
    }

    // Victoire / Pose validée
    alert("🎉 VICTOIRE ! Vous avez posé toute votre main !");
    document.getElementById('status-message').innerText = "🏆 Vous avez remporté la manche !";

    // Prévenir l'autre joueur
    if (typeof envoyerActionReseau === 'function') {
        envoyerActionReseau('POSE_VICTOIRE', { groupes: groupesAposer });
    }
}

// ==========================================
// 5. INITIALISATION ET RÉSEAU
// ==========================================
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
    mettreAJourStatutTour();

    envoyerActionReseau('DEBUT_PARTIE', {
        pioche: pioche,
        mainJoueur2: mainJoueur2,
        defausse: defausse
    });
}

function recevoirActionReseau(donnees) {
    // L'hôte reçoit la confirmation du Joueur 2 -> Il distribue le jeu !
    if (donnees.type === 'JOUEUR_PRET' && estHote) {
        document.getElementById('status-message').innerText = "Joueur 2 connecté ! C'est votre tour.";
        initialiserPartieReseau();
    }
    else if (donnees.type === 'DEBUT_PARTIE') {
        pioche = donnees.contenu.pioche;
        maMain = donnees.contenu.mainJoueur2;
        defausse = donnees.contenu.defausse;
        monTour = false; // Le joueur 2 attend son tour
        
        // Rafraîchissement complet de l'écran du Joueur 2
        cartesSelectionnees = [];
        afficherMain();
        afficherDefausse();
        mettreAJourStatutTour();
    }
    else if (donnees.type === 'ACTION_PIOCHE_PIOCHE') {
        pioche.pop();
    }
    else if (donnees.type === 'ACTION_PIOCHE_DEFAUSSE') {
        defausse.pop();
        afficherDefausse();
    }
    else if (donnees.type === 'ACTION_DEFAUSSER') {
        defausse.push(donnees.contenu.carte);
        afficherDefausse();
        monTour = true; // C'est maintenant notre tour !
        mettreAJourStatutTour();
    }
    else if (donnees.type === 'POSE') {
        alert("L'autre joueur a posé toute sa main ! C'est le dernier tour de la manche.");
    }
}

// Fonction pour regrouper les cartes sélectionnées dans la zone de pose
function creerNouveauGroupe() {
    if (cartesSelectionnees.length < 3) {
        alert("Une combinaison doit contenir au moins 3 cartes !");
        return;
    }

    // Récupérer les cartes cliquées
    let nouveauGroupe = cartesSelectionnees.map(i => maMain[i]);
    
    // Vérifier si le groupe est valide
    if (estUneFamille(nouveauGroupe) || estUneSuite(nouveauGroupe)) {
        groupesAposer.push(nouveauGroupe);
        
        // Retirer ces cartes de la main
        maMain = maMain.filter((_, idx) => !cartesSelectionnees.includes(idx));
        cartesSelectionnees = [];
        
        afficherMain();
        afficherGroupesAPoser();
    } else {
        alert("Ce groupe n'est ni une Suite valide, ni une Famille valide !");
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