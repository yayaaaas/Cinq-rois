// ==========================================
// CONFIGURATION FIREBASE
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyAC2zG7TC0Gt1YiWDMCNUyUUxsc-L18Wsg",
  authDomain: "cinq-rois.firebaseapp.com",
  databaseURL: "https://cinq-rois-default-rtdb.firebaseio.com",
  projectId: "cinq-rois",
  storageBucket: "cinq-rois.firebasestorage.app",
  messagingSenderId: "1026512231197",
  appId: "1:1026512231197:web:2d2d49aeb2a48cbdf69ff4"
};

// Initialisation de Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomCode = null;
let roomRef = null;

function creerPartie() {
    modeJeu = "MULTI";
    if (typeof reinitialiserVariablePartie === 'function') reinitialiserVariablePartie();

    const nameInput = document.getElementById('player-name').value.trim();
    if (nameInput !== "") monPseudo = nameInput;

    const selectNb = document.getElementById('nb-players-select');
    if (selectNb) nbJoueursAttendus = parseInt(selectNb.value);

    roomCode = "5R-" + Math.floor(1000 + Math.random() * 9000);
    roomRef = db.ref('rooms/' + roomCode);

    estHote = true;
    monIndexReseau = 0;

    let joueurHote = { index: 0, pseudo: monPseudo, score: 0 };
    joueursReseau = [joueurHote];

    // Création du salon dans la base de données
    roomRef.set({
        status: "WAITING",
        nbAttendus: nbJoueursAttendus,
        joueurs: [joueurHote],
        derniereAction: null
    }).then(() => {
        document.getElementById('my-id-display').innerHTML = `Partie créée ! Code : <b style="font-size: 20px; color: #f1c40f;">${roomCode}</b>`;
        document.getElementById('status-message').innerText = `En attente de ${nbJoueursAttendus - 1} autre(s) joueur(s)...`;
        ecouterSalonFirebase();
    });
}

function rejoindrePartie() {
    modeJeu = "MULTI";
    if (typeof reinitialiserVariablePartie === 'function') reinitialiserVariablePartie();

    const nameInput = document.getElementById('player-name').value.trim();
    if (nameInput !== "") monPseudo = nameInput;

    const codeEntre = document.getElementById('join-id-input').value.trim().toUpperCase();
    if (!codeEntre) {
        alert("Entrez un code valide !");
        return;
    }

    roomCode = codeEntre;
    roomRef = db.ref('rooms/' + roomCode);

    roomRef.get().then((snapshot) => {
        if (!snapshot.exists()) {
            alert("Partie introuvable ! Vérifiez le code.");
            return;
        }

        let roomData = snapshot.val();
        let listeJ = roomData.joueurs || [];

        if (listeJ.length >= roomData.nbAttendus) {
            alert("La table est déjà pleine !");
            return;
        }

        // Vérifier si déjà présent
        let pIndex = listeJ.findIndex(j => j.pseudo === monPseudo);
        if (pIndex === -1) {
            monIndexReseau = listeJ.length;
            let nouveauJ = { index: monIndexReseau, pseudo: monPseudo, score: 0 };
            listeJ.push(nouveauJ);
            roomRef.child('joueurs').set(listeJ);
        } else {
            monIndexReseau = pIndex;
        }

        estHote = false;
        nbJoueursAttendus = roomData.nbAttendus;
        demarrerJeuUI();
        ecouterSalonFirebase();
    });
}

function ecouterSalonFirebase() {
    if (!roomRef) return;

    roomRef.on('value', (snapshot) => {
        let roomData = snapshot.val();
        if (!roomData) return;

        joueursReseau = roomData.joueurs || [];

        // L'Hôte lance la partie quand la table est complète
        if (estHote && roomData.status === "WAITING" && joueursReseau.length === nbJoueursAttendus) {
            roomRef.child('status').set("PLAYING");
            preparerTableauScoresUI();
            demarrerJeuUI();
            demarrerMancheReseau();
            return;
        }

        // Action transmise dans le jeu
        if (roomData.derniereAction) {
            recevoirActionReseau(roomData.derniereAction);
        }
    });
}

function envoyerActionReseau(type, contenu) {
    if (!roomRef) return;
    
    // Écriture de l'action dans Firebase (synchronisée en temps réel chez tout le monde)
    roomRef.child('derniereAction').set({
        type: type,
        contenu: contenu,
        timestamp: Date.now()
    });
}