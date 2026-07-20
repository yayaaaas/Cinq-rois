var peer = null;
var conn = null;

// 1. L'hôte crée la partie
function creerPartie() {
    const codePartie = "5ROIS-" + Math.floor(1000 + Math.random() * 9000);
    peer = new Peer(codePartie);

    peer.on('open', (id) => {
        document.getElementById('my-id-display').innerHTML = `Partie créée ! Code : <b>${id}</b>`;
        document.getElementById('status-message').innerText = "En attente du Joueur 2...";
        estHote = true;
        monTour = true;
    });

    peer.on('connection', (connection) => {
        conn = connection;
        initialiserConnexion();
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
        monTour = false;
    });
}

function initialiserConnexion() {
    conn.on('open', () => {
        document.getElementById('status-message').innerText = "Connecté ! Synchronisation...";

        // Le joueur 2 confirme qu'il est prêt à recevoir les cartes
        if (!estHote) {
            setTimeout(() => {
                envoyerActionReseau('JOUEUR_PRET', {});
            }, 500);
        }
    });

    conn.on('data', (data) => {
        if (typeof recevoirActionReseau === 'function') {
            recevoirActionReseau(data);
        }
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