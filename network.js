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

// Initialisation
firebase.initializeApp(firebaseConfig);
const db = firebase.database();

let roomCode = null;
let roomRef = null;
let nbJoueursAttendus = 2;

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

    roomRef.set({
        status: "WAITING",
        nbAttendus: nbJoueursAttendus,
        joueurs: [joueurHote],
        gameState: null,
        confirmations: null,
        messages: null
    }).then(() => {
        document.getElementById('my-id-display').innerHTML = `Partie créée ! Code : <b style="font-size: 20px; color: #f1c40f;">${roomCode}</b>`;
        document.getElementById('status-message').innerText = `En attente de ${nbJoueursAttendus - 1} autre(s) joueur(s)...`;
        ecouterSalonFirebase();
        ecouterChatFirebase();
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
        ecouterChatFirebase();
    });
}

function ecouterSalonFirebase() {
    if (!roomRef) return;

    roomRef.on('value', (snapshot) => {
        let roomData = snapshot.val();
        if (!roomData) return;

        joueursReseau = roomData.joueurs || [];

        // L'Hôte démarre la partie quand la table est pleine
        if (estHote && roomData.status === "WAITING" && joueursReseau.length === nbJoueursAttendus) {
            roomRef.child('status').set("PLAYING");
            preparerTableauScoresUI();
            demarrerJeuUI();
            demarrerMancheReseau();
            return;
        }

        // Synchronisation de l'état du jeu
        if (roomData.gameState) {
            synchroniserEtatJeu(roomData.gameState, roomData.confirmations);
        }
    });
}

function envoyerEtatJeuFirebase(nouvelEtat) {
    if (!roomRef) return;
    roomRef.child('gameState').set(nouvelEtat);
}

function envoyerConfirmationJoueur(indexJ) {
    if (!roomRef) return;
    roomRef.child('confirmations/' + indexJ).set(true);
}

// ==========================================
// CHAT EN TEMPS RÉEL (FIREBASE)
// ==========================================
function envoyerMessageChat(event) {
    event.preventDefault();
    const input = document.getElementById('chat-input');
    const texte = input.value.trim();

    if (!texte) return;

    if (modeJeu === "SOLO") {
        afficherNouveauMessageChat(monPseudo, texte);
        input.value = '';
        return;
    }

    if (roomRef) {
        roomRef.child('messages').push({
            pseudo: monPseudo,
            texte: texte,
            timestamp: Date.now()
        });
        input.value = '';
    }
}

function ecouterChatFirebase() {
    if (!roomRef) return;

    roomRef.child('messages').on('child_added', (snapshot) => {
        let msg = snapshot.val();
        if (msg) {
            afficherNouveauMessageChat(msg.pseudo, msg.texte);
        }
    });
}

function afficherNouveauMessageChat(pseudo, texte) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const div = document.createElement('div');
    div.className = 'chat-msg';
    div.innerHTML = `<span class="sender">${pseudo} :</span> ${texte}`;
    container.appendChild(div);

    container.scrollTop = container.scrollHeight; // Auto-scroll vers le bas
}