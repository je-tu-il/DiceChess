# 🎲♟️ DiceChess — Échecs 3D Multijoueur sur Dé à 6 Faces

[![Live Demo](https://img.shields.io/badge/Demo%20en%20Ligne-Jouer%20sur%20GitHub%20Pages-success?style=for-the-badge&logo=github)](https://je-tu-il.github.io/DiceChess/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev/)
[![Three.js](https://img.shields.io/badge/3D-Three.js%20%2F%20R3F-black.svg?logo=three.js)](https://threejs.org/)
[![P2P WebRTC](https://img.shields.io/badge/Multiplayer-PeerJS%20WebRTC-FF6B6B.svg)](https://peerjs.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

> Une variante d'échecs en 3D où vous affrontez votre adversaire sur **6 échiquiers indépendants simultanément**, situés sur les 6 faces d'un dé cubique 3D.  
> À chaque coup joué, le dé roule automatiquement sur une face aléatoire non terminée. Conquérez un maximum de faces pour remporter la victoire !

---

## ⚡ Jouer Immédiatement (Sans Installation)

👉 **[Lancer une partie en ligne : https://je-tu-il.github.io/DiceChess/](https://je-tu-il.github.io/DiceChess/)**

- 🤖 **Jouer contre l'ordinateur (IA)** : Idéal pour s'entraîner en solo.
- 👥 **Multijoueur Local** : Deux joueurs sur le même écran.
- 🌐 **Multijoueur en Ligne (P2P)** : Partagez simplement un code de salon à 6 caractères avec un ami via WebRTC (connexion directe sans compte ni serveur).

---

## ✨ Fonctionnalités Clés

- 🎲 **6 Parties Simultanées sur un Dé 3D** :
  - Chaque face du dé est un échiquier autonome en cours.
  - Infligez un échec et mat sur une face pour la conquérir définitivement.
  - La partie continue sur les faces restantes jusqu'à conquête du cube.
- 🔄 **Lancer Automatique du Dé** : Le dé bascule en 3D avec physique réaliste pour désigner la prochaine face à jouer.
- 🔗 **Multijoueur Peer-to-Peer Résilient** :
  - Reprise d'hôte automatique : si l'hôte se déconnecte, le second joueur prend le relais sans perdre la partie.
  - Reconnexion fluide avec sauvegarde d'état FEN.
- 🎨 **Esthétique Soignée** :
  - Pièces vectorielles SVG officielles Lichess pour une lisibilité parfaite.
  - Bascule instantanée entre la vue plateau 2D et le dé 3D interactif.
  - Thème sombre moderne.

---

## 🛠️ Lancement pour Développeurs (Code Source)

```bash
git clone https://github.com/je-tu-il/DiceChess.git
cd DiceChess
npm install
npm run dev
```
Ouvrez `http://localhost:5173/`.

### Build de Production
```bash
npm run build
```

---

## 📄 Licence

Ce projet est sous licence MIT. Libre d'utilisation et de modification.
