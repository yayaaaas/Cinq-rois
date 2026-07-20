let peer = null;
let conn = null;
let estHote = false;

// 1. L'hôte crée la partie
function creerPartie() {
    // Génère un ID aléatoire court à 4 chiffres/lettres pour que ce soit facile à partager
    const codePartie = "5ROIS-" + Math.floor(1000 + Math.random() * 9000);
    
    peer = new Peer(codePartie);

    peer.on('open', (id) => {
        document.getElementById('my-id-display').innerHTML = `Partie créée ! Code à donner : <b>${id}</b>`;
        document.getElementById('status-message').innerText = "En attente du second joueur...";
        estHote = true;
    });

    // Quand le second joueur se connecte à l'hôte
    peer.on('connection', (connection) => {
        conn = connection;
        initialiserEvenementsConnexion();
        document.getElementById('status-message').innerText = "Joueur 2 connecté ! La partie commence.";
        
        // Si on est l'hôte, c'est nous qui initialisons le jeu et envoyons les cartes
        initialiserPartieReseau();
    });
}

// 2. Le second joueur rejoint la partie avec le code
function rejoindrePartie() {
    const codeEntre = document.getElementById('join-id-input').value.trim();
    if (!codeEntre) {
        alert("Veuillez entrer un code de partie valide !");
        return;
    }

    peer = new Peer();

    peer.on('open', () => {
        conn = peer.connect(codeEntre);
        initialiserEvenementsConnexion();
    });
}

// 3. Gestion des messages réseau entre les joueurs
function initialiserEvenementsConnexion() {
    conn.on('open', () => {
        document.getElementById('status-message').innerText = "Connecté à la partie !";
    });

    // Quand on reçoit des données de l'autre joueur
    conn.on('data', (data) => {
        recevoirActionReseau(data);
    });

    conn.on('close', () => {
        document.getElementById('status-message').innerText = "L'autre joueur s'est déconnecté.";
    });
}

// Envoyer un ordre/une action à l'autre joueur
function envoyerActionReseau(type, contenu) {
    if (conn && conn.open) {
        conn.send({ type: type, contenu: contenu });
    }
}