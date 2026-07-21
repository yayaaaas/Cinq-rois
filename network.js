var peer = null;
var conn = null;

function creerPartie() {
    const nameInput = document.getElementById('player-name').value.trim();
    if (nameInput !== "") monPseudo = nameInput;

    const codePartie = "5ROIS-" + Math.floor(1000 + Math.random() * 9000);
    peer = new Peer(codePartie);

    peer.on('open', (id) => {
        // Affiche le code dans le panneau de connexion
        document.getElementById('my-id-display').innerHTML = `Partie créée ! Code : <b style="font-size: 20px; color: #f1c40f;">${id}</b>`;
        document.getElementById('status-message').innerText = "Transmettez ce code au Joueur 2 et attendez sa connexion...";
        
        estHote = true;
        monTour = true;
        
        // On NE MASQUE PAS le menu tout de suite pour que l'hôte puisse lire le code !
    });

    peer.on('connection', (connection) => {
        conn = connection;
        initialiserConnexion();
    });

    peer.on('error', (err) => {
        alert("Erreur de connexion PeerJS : " + err.type);
    });
}

function rejoindrePartie() {
    // Récupération du pseudo saisi
    const nameInput = document.getElementById('player-name').value.trim();
    if (nameInput !== "") monPseudo = nameInput;

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
        
        // Affiche l'interface de jeu pour le Joueur 2
        demarrerJeuUI();
    });
}

function initialiserConnexion() {
    conn.on('open', () => {
        document.getElementById('status-message').innerText = "Connecté ! Synchronisation...";

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