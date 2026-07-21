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