var peer = null;
var conns = []; // Liste des connexions (pour l'Hôte)
var connHote = null; // Connexion vers l'hôte (pour les Invités)
var nbJoueursAttendus = 2;

function creerPartie() {
    const nameInput = document.getElementById('player-name').value.trim();
    if (nameInput !== "") monPseudo = nameInput;

    const selectNb = document.getElementById('nb-players-select');
    if (selectNb) nbJoueursAttendus = parseInt(selectNb.value);

    const codePartie = "5ROIS-" + Math.floor(1000 + Math.random() * 9000);
    peer = new Peer(codePartie);

    peer.on('open', (id) => {
        document.getElementById('my-id-display').innerHTML = `Partie créée ! Code : <b style="font-size: 20px; color: #f1c40f;">${id}</b>`;
        document.getElementById('status-message').innerText = `En attente de ${nbJoueursAttendus - 1} autre(s) joueur(s)...`;
        
        estHote = true;
        monIndexReseau = 0;
        joueursReseau = [{ index: 0, pseudo: monPseudo, peerId: id, score: 0 }];
    });

    peer.on('connection', (connection) => {
        if (conns.length >= nbJoueursAttendus - 1) {
            connection.close(); // Table pleine
            return;
        }

        conns.push(connection);
        initialiserConnexionHote(connection);
    });

    peer.on('error', (err) => {
        alert("Erreur de connexion PeerJS : " + err.type);
    });
}

function rejoindrePartie() {
    const nameInput = document.getElementById('player-name').value.trim();
    if (nameInput !== "") monPseudo = nameInput;

    const codeEntre = document.getElementById('join-id-input').value.trim();
    if (!codeEntre) {
        alert("Entrez un code valide !");
        return;
    }

    peer = new Peer();

    peer.on('open', (id) => {
        connHote = peer.connect(codeEntre);
        initialiserConnexionInvite(connHote);
        estHote = false;
        demarrerJeuUI();
    });
}

function initialiserConnexionHote(connection) {
    connection.on('open', () => {
        document.getElementById('status-message').innerText = `Un joueur s'est connecté. (${conns.length + 1}/${nbJoueursAttendus})`;
    });

    connection.on('data', (data) => {
        recevoirActionReseau(data, connection);
    });

    connection.on('close', () => {
        document.getElementById('status-message').innerText = "Un joueur s'est déconnecté.";
    });
}

function initialiserConnexionInvite(connection) {
    connection.on('open', () => {
        document.getElementById('status-message').innerText = "Connecté à la table ! En attente du début...";
        envoyerActionReseau('JOUEUR_PRET', { pseudo: monPseudo });
    });

    connection.on('data', (data) => {
        recevoirActionReseau(data, connection);
    });

    connection.on('close', () => {
        alert("La connexion avec l'Hôte a été interrompue.");
    });
}

function envoyerActionReseau(type, contenu) {
    const message = { type: type, contenu: contenu };
    if (estHote) {
        // L'hôte envoie le message à tous les invités
        conns.forEach(c => {
            if (c.open) c.send(message);
        });
    } else if (connHote && connHote.open) {
        // L'invité envoie uniquement à l'hôte
        connHote.send(message);
    }
}