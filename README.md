# DiceChess 🎲♟️

DiceChess is a fast-paced, 3D chess variant where you battle an opponent across **6 different chessboards simultaneously**. The game takes place on the 6 faces of a 3D die. Roll the die to switch faces, track your victories, and conquer the cube!

## 🌟 Key Features

- **6 Simultaneous Games**: Play six independent chess games on the faces of a 3D die. Checkmate your opponent on a single face to claim it, and play continues on the remaining faces until all are conquered!
- **Automatic Die Rolls**: The die rolls automatically after every move, randomly selecting an unfinished face for the next turn.
- **Multiple Game Modes**:
  - **Online Multiplayer (P2P)**: Connect directly with friends using a simple 6-character room code via WebRTC. No servers needed!
  - **Play vs Bot**: Hone your skills against an integrated AI opponent.
  - **Local Multiplayer**: Play with a friend on the same device.
- **Host Takeover & Reconnection**: Robust P2P system. If the host disconnects, the game automatically pauses and the remaining player takes over as the new host. Rejoining seamlessly resumes the game right where you left off.
- **Premium Aesthetics**: High-definition 3D die animations, standard Lichess SVG pieces for perfect readability, and sleek dark-mode UI. You can even toggle between the 2D chessboard and the spinning 3D die mid-game.
- **Moderation Tools**: The host can easily kick disruptive players and return to the waiting room to invite someone else.

## 🛠️ Technologies Used

- **React** for UI and component architecture.
- **React Three Fiber (R3F) & Three.js** for the 3D scene, physics, and die animations.
- **PeerJS** for WebRTC peer-to-peer multiplayer connectivity.
- **Zustand** for lightweight and fast global state management.
- **Chess.js** for chess move validation, FEN state logic, and bot moves.
- **Vite** for blazing fast builds.

## 🚀 Getting Started

### Installation

1. Clone this repository.
2. Install the dependencies:
   ```bash
   npm install
   ```

### Running Locally

Start the Vite development server:

```bash
npm run dev
```

Then, open your browser to the URL provided (usually `http://localhost:5173`).

### Building for Production

```bash
npm run build
```

This will generate an optimized build in the `dist` folder.
