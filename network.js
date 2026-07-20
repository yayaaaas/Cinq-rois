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
        monTour = false; // Le joueur 2 attend
    });
}

function initialiserConnexion() {
    conn.on('open', () => {
        console.log("Connexion établie !");
        document.getElementById('status-message').innerText = "Connecté ! Préparation de la partie...";

        // Si on est le Joueur 2, on dit à l'hôte : "Je suis prêt, envoie les cartes !"
        if (!estHote) {
            envoyerActionReseau('JOUEUR_PRET', {});
        }
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