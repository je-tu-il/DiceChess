# DiceChess

DiceChess is a fast-paced, peer-to-peer 3D chess variant where you battle an opponent across 6 different boards simultaneously. Roll the die to switch faces, track your victories, and conquer the cube!

## Features

- **P2P Multiplayer**: Connect directly with your friends using a simple 6-character room code. No servers needed.
- **6 Simultaneous Games**: The game takes place on the 6 faces of a 3D die.
- **Automatic Die Rolls**: The die rolls automatically after every move, randomly selecting an unfinished face.
- **Independent Victories**: Checkmate your opponent on a single face to claim it. Play continues on the remaining faces until all are conquered!

## Technologies Used

- **React** for UI and state management
- **React Three Fiber (R3F)** & **Three.js** for the 3D scene and die animations
- **PeerJS** for WebRTC peer-to-peer multiplayer connectivity
- **Zustand** for global state management
- **Chess.js** for chess move validation and FEN state logic
- **Vite** as the build tool

## Getting Started

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
"# DiceChess" 
"# DiceChess" 
