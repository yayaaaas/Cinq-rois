// ==========================================
// 1. VARIABLES GLOBALES & MENU
// ==========================================
const COULEURS = ['coeur', 'carreau', 'trefle', 'pique', 'etoile'];
const VALEURS = ['3', '4', '5', '6', '7', '8', '9', '10', 'V', 'D', 'R'];

let monPseudo = "Joueur 1";
let modeJeu = "MULTI"; // "SOLO" ou "MULTI"

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
let scoreAdversaire = 0;

function afficherMenuMulti() {
    const multiPanel = document.getElementById('multi-panel');
    multiPanel.style.display = multiPanel.style.display === 'none' ? 'block' : 'none';
}

function demarrerJeuUI() {
    let nameInput = document.getElementById('player-name').value.trim();
    if (nameInput !== "") {
        monPseudo = nameInput;
    }
    document.getElementById('main-menu').style.display = 'none';
    document.getElementById('game-zone').style.display = 'block';
}

function lancerModeSolo() {
    modeJeu = "SOLO";
    demarrerJeuUI();
    alert(`Bienvenue ${monPseudo} ! Mode Solo en cours de préparation...`);
}

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
        status.innerText = monTour ? `[Manche ${mancheActuelle}/11] C'est VOTRE tour de jouer !` : `[Manche ${mancheActuelle}/11] Tour de votre ADVERSAIRE...`;
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

function afficherPoseAdversaire(groupesAdverses) {
    const zoneAdversaire = document.getElementById('tableau-adversaire');
    const container = document.getElementById('zones-combinaisons-adversaire');
    
    if (!zoneAdversaire || !container) return;
    
    zoneAdversaire.style.display = 'block';
    container.innerHTML = '';

    groupesAdverses.forEach((groupe) => {
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
// 4. ACTIONS DU JOUEUR
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

    if (pioche.length === 0) {
        if (defausse.length <= 1) {
            alert("Plus aucune carte disponible dans la pioche ni dans la défausse !");
            return;
        }
        
        let carteSommet = defausse.pop();
        pioche = melanger(defausse);
        defausse = [carteSommet];
        
        afficherDefausse();
        alert("La pioche était vide : la défausse a été remélangée pour former une nouvelle pioche !");
    }

    let cartePiochee = pioche.pop();
    maMain.push(cartePiochee);
    aPioche = true;
    piocheDepuisDefausse = false; // Pioche normale
    afficherMain();

    envoyerActionReseau('ACTION_PIOCHE_PIOCHE', {});
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

    let confirmation = confirm("Règle : Vous ne pouvez piocher dans la défausse QUE si vous posez TOUTE votre main ce tour-ci. Voulez-vous continuer ?");
    if (!confirmation) return;

    let cartePrelee = defausse.pop();
    maMain.push(cartePrelee);
    aPioche = true;
    piocheDepuisDefausse = true; // Marquage de la règle
    
    afficherMain();
    afficherDefausse();

    envoyerActionReseau('ACTION_PIOCHE_DEFAUSSE', {});
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
    if (!monTour) {
        alert("Ce n'est pas votre tour !");
        return;
    }
    if (!aPioche) {
        alert("Vous devez piocher avant de poser !");
        return;
    }

    if (maMain.length > 1) {
        alert(`Il vous reste ${maMain.length} carte(s) en main. Placez toutes vos cartes dans des combinaisons (sauf 1 à défausser) !`);
        return;
    }

    if (groupesAposer.length === 0) {
        alert("Vous n'avez préparé aucune combinaison.");
        return;
    }

    alert("Vous avez posé votre main ! Cliquez maintenant sur votre dernière carte et défaussez-la pour valider votre tour.");
    aPoseMaMain = true;
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

    // VÉRIFICATION RÈGLE : Interdiction de défausser sans avoir posé si pioché dans la défausse
    if (piocheDepuisDefausse && !aPoseMaMain && !estDernierTour) {
        alert("⚠️ RÈGLE : Vous avez pioché dans la défausse, vous êtes OBLIGÉ de poser toute votre main ce tour-ci !");
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
    piocheDepuisDefausse = false; // Réinitialisation

    afficherMain();
    afficherDefausse();
    mettreAJourStatutTour();

    // Si c'était notre DERNIER TOUR
    if (estDernierTour) {
        let mesPenalites = calculerPointsMain(maMain);
        scoreJoueur += mesPenalites;
        
        ajouterLigneScoreTableau(mancheActuelle, mesPenalites, 0);

        alert(`Fin de la manche ${mancheActuelle} ! Vous écopez de ${mesPenalites} points de pénalité.`);
        
        envoyerActionReseau('FIN_MANCHE_SCORE', { 
            penalites: mesPenalites,
            carteDefaussee: carteDefaussee
        });

        if (estHote) {
            setTimeout(() => {
                passerMancheSuivante();
            }, 1000);
        }
        return;
    }

    // Si ON VIENT DE POSER en premier
    if (aPoseMaMain) {
        alert("Main transmise ! L'adversaire joue son dernier tour.");
        envoyerActionReseau('PREMIERE_POSE', { 
            groupes: groupesAposer,
            carteDefaussee: carteDefaussee 
        });
        aPoseMaMain = false;
    } 
    // Tour normal de défausse
    else {
        envoyerActionReseau('ACTION_DEFAUSSER', { carte: carteDefaussee });
    }
}

function calculerPointsMain(main) {
    let total = 0;
    main.forEach(carte => {
        if (carte.type === 'joker') {
            total += 50;
        } else if (estUnJokerOuAtout(carte)) {
            total += 20;
        } else if (carte.valeur === 'V') {
            total += 11;
        } else if (carte.valeur === 'D') {
            total += 12;
        } else if (carte.valeur === 'R') {
            total += 13;
        } else {
            total += parseInt(carte.valeur);
        }
    });
    return total;
}

// ==========================================
// 5. GESTION DES MANCHES ET DU RÉSEAU
// ==========================================
function passerMancheSuivante() {
    mancheActuelle++;
    
    if (mancheActuelle > 11) {
        let gagnant = scoreJoueur < scoreAdversaire ? "VOUS AVEZ GAGNÉ !" : scoreJoueur > scoreAdversaire ? "L'ADVERSAIRE A GAGNÉ !" : "ÉGALITÉ PARFAITE !";
        alert(`🏆 FIN DE LA PARTIE ! 🏆\n\nScore Final :\n- Vous : ${scoreJoueur} pts\n- Adversaire : ${scoreAdversaire} pts\n\nRésultat : ${gagnant}`);
        document.getElementById('status-message').innerText = `🏆 Fin de partie ! ${gagnant}`;
        return;
    }

    if (estHote) {
        initialiserPartieReseau();
    }
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
    aPoseMaMain = false;
    estDernierTour = false;
    piocheDepuisDefausse = false;
    aPioche = false; 
    monTour = true; 
    groupesAposer = [];
    cartesSelectionnees = [];
    
    afficherMain();
    afficherDefausse();
    afficherGroupesAPoser();
    
    const zoneAdv = document.getElementById('tableau-adversaire');
    if (zoneAdv) zoneAdv.style.display = 'none';

    mettreAJourStatutTour();

    envoyerActionReseau('DEBUT_PARTIE', {
        pioche: pioche,
        mainJoueur2: mainJoueur2,
        defausse: defausse,
        mancheActuelle: mancheActuelle
    });
}

function recevoirActionReseau(donnees) {
    if (donnees.type === 'JOUEUR_PRET' && estHote) {
        document.getElementById('status-message').innerText = "Joueur 2 connecté ! C'est votre tour.";
        initialiserPartieReseau();
    }
    else if (donnees.type === 'DEBUT_PARTIE') {
        pioche = donnees.contenu.pioche;
        maMain = donnees.contenu.mainJoueur2;
        defausse = donnees.contenu.defausse;
        mancheActuelle = donnees.contenu.mancheActuelle;
        monTour = false;
        aPioche = false;
        estDernierTour = false;
        aPoseMaMain = false;
        piocheDepuisDefausse = false;
        
        cartesSelectionnees = [];
        groupesAposer = [];
        afficherMain();
        afficherDefausse();
        afficherGroupesAPoser();
        
        const zoneAdv = document.getElementById('tableau-adversaire');
        if (zoneAdv) zoneAdv.style.display = 'none';

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
        monTour = true;
        mettreAJourStatutTour();
    }
    else if (donnees.type === 'PREMIERE_POSE') {
        defausse.push(donnees.contenu.carteDefaussee);
        afficherDefausse();
        afficherPoseAdversaire(donnees.contenu.groupes);
        
        estDernierTour = true;
        monTour = true;
        
        alert(`⚠️ L'adversaire a posé toute sa main ! C'est votre DERNIER TOUR pour la manche ${mancheActuelle} !`);
        document.getElementById('status-message').innerText = `⚠️ DERNIER TOUR (Manche ${mancheActuelle}) ! Piochez, posez vos groupes et défaussez.`;
    }
    else if (donnees.type === 'FIN_MANCHE_SCORE') {
        if (donnees.contenu.carteDefaussee) {
            defausse.push(donnees.contenu.carteDefaussee);
            afficherDefausse();
        }
        
        let penAdversaireQuiAPerdu = donnees.contenu.penalites;
        scoreAdversaire += penAdversaireQuiAPerdu;

        ajouterLigneScoreTableau(mancheActuelle, 0, penAdversaireQuiAPerdu);

        alert(`Fin de la manche ${mancheActuelle} !\nScores cumulés -> Vous: ${scoreJoueur} pts | Adversaire: ${scoreAdversaire} pts`);
        
        if (estHote) {
            setTimeout(() => {
                passerMancheSuivante();
            }, 1000);
        }
    }
}

function ajouterLigneScoreTableau(manche, penVous, penAdversaire) {
    const tbody = document.getElementById('lignes-scores');
    if (!tbody) return;

    const tr = document.createElement('tr');
    tr.innerHTML = `
        <td>Manche ${manche}</td>
        <td>${penVous} pts</td>
        <td>${penAdversaire} pts</td>
    `;
    tbody.appendChild(tr);

    document.getElementById('total-joueur').innerText = `${scoreJoueur} pts`;
    document.getElementById('total-adversaire').innerText = `${scoreAdversaire} pts`;
}