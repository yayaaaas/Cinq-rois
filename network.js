let peer = null;
let conn = null;
let estHote = false;

// 1. L'hôte crée la partie
function creerPartie() {
    const codePartie = "5ROIS-" + Math.floor(1000 + Math.random() * 9000);
    peer = new Peer(codePartie);

    peer.on('open', (id) => {
        document.getElementById('my-id-display').innerHTML = `Partie créée ! Code : <b>${id}</b>`;
        document.getElementById('status-message').innerText = "En attente du Joueur 2...";
        estHote = true;
        monTour = true; // L'hôte commence toujours
    });

    peer.on('connection', (connection) => {
        conn = connection;
        initialiserConnexion();
        document.getElementById('status-message').innerText = "Joueur 2 connecté ! C'est votre tour de jouer.";
        
        // L'hôte distribue les cartes
        initialiserPartieReseau();
    });
}

// 2. Le second joueur rejoint la partie
function rejoindrePartie() {
    const codeEntre = document.getElementById('join-id-input').value.trim();
    if (!codeEntre) {
        alert("Entrez un code valide !");
        return;
    }

    peer = new Peer();

    peer.on('open', () => {
        conn = peer.connect(codeEntre);
        initialiserConnexion();
        estHote = false;
        monTour = false; // Le joueur 2 attend son tour
    });
}

function initialiserConnexion() {
    conn.on('open', () => {
        document.getElementById('status-message').innerText = monTour ? "C'est votre tour !" : "Au tour de votre adversaire...";
    });

    conn.on('data', (data) => {
        recevoirActionReseau(data);
    });

    conn.on('close', () => {
        document.getElementById('status-message').innerText = "Adversaire déconnecté.";
    });
}

function envoyerActionReseau(type, contenu) {
    if (conn && conn.open) {
        conn.send({ type: type, contenu: contenu });
    }
}