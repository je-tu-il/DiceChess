# DiceChess — Walkthrough

## What Was Built

A 3D web application where a physics-driven die has 6 independent chess games mapped onto its faces. The core game loop: **roll → stop → play on top face → bot responds → auto-roll**.

## Architecture

```mermaid
graph TD
    A[App.jsx] --> B[Scene3D - R3F Canvas]
    A --> C[UIOverlay]
    B --> D[Physics World]
    D --> E[PhysicsDie - 6 CanvasTextures]
    D --> F[Floor + Walls]
    C --> G[Status Banner]
    C --> H[Board Indicators I-VI]
    C --> I[Roll Button]
    C --> J[ActiveBoardPanel]
    J --> K[Interactive Canvas Board]
    J --> L[Promotion Dialog]
    E -.-> M[gameStore - Zustand]
    J -.-> M
    M --> N[6x Chess.js FEN states]
    M --> O[Phase Machine]
```

## Key Files

| File | Purpose |
|---|---|
| [gameStore.js](file:///e:/Reste/DiceChess/src/store/gameStore.js) | Zustand store: 6 FEN states, phase machine, selection logic, promotion |
| [PhysicsDie.jsx](file:///e:/Reste/DiceChess/src/components/PhysicsDie.jsx) | Physics body + 6 canvas textures + rest detection + top-face computation |
| [drawChessboard.js](file:///e:/Reste/DiceChess/src/utils/drawChessboard.js) | Canvas renderer: pieces (Unicode), legal moves, check/selection highlights |
| [topFaceDetector.js](file:///e:/Reste/DiceChess/src/utils/topFaceDetector.js) | Quaternion dot-product algorithm to find upward-facing face |
| [botPlayer.js](file:///e:/Reste/DiceChess/src/utils/botPlayer.js) | Priority bot: checkmate > captures (MVV-LVA) > checks > center > random |
| [ActiveBoardPanel.jsx](file:///e:/Reste/DiceChess/src/components/ActiveBoardPanel.jsx) | Full-size interactive board overlay with click-to-move |
| [UIOverlay.jsx](file:///e:/Reste/DiceChess/src/components/UIOverlay.jsx) | Status bar, board indicator badges, roll button, bot turn automation |

## Game Loop

```
READY → (click Roll) → ROLLING → (velocity ≈ 0) → DETECTING → (top face found) → PLAYER_TURN
  → (user clicks piece, then target) → BOT_TURN → (bot plays after 600ms) → ROLLING → ...
```

## Verification

### Browser Testing Results

All core requirements verified ✅:
- 3D physics-based dice rolling with cannon-es
- 6 independent chess.js instances mapped to cube faces via CanvasTexture
- Top-face detection via quaternion normals
- Interaction locked to top face only
- Click-to-move piece selection with legal move indicators
- Bot plays opponent response automatically
- Auto-roll after bot turn completes

### Screenshots

````carousel
![Initial state — 3D die with chessboard textures and "Roll the Die" button](C:\Users\JetuilPc\.gemini\antigravity\brain\c014bec3-036e-42b6-884f-f526ae22a60c\.system_generated\click_feedback\click_feedback_1777049270916.png)
<!-- slide -->
![Board panel showing Face 5 — interactive chessboard ready for player input](C:\Users\JetuilPc\.gemini\antigravity\brain\c014bec3-036e-42b6-884f-f526ae22a60c\.system_generated\click_feedback\click_feedback_1777049302226.png)
<!-- slide -->
![Piece selected with legal move dots displayed](C:\Users\JetuilPc\.gemini\antigravity\brain\c014bec3-036e-42b6-884f-f526ae22a60c\.system_generated\click_feedback\click_feedback_1777049313621.png)
````

### Recording

![Full game loop demo — roll, play, bot responds, auto-roll](C:\Users\JetuilPc\.gemini\antigravity\brain\c014bec3-036e-42b6-884f-f526ae22a60c\roll_and_play_1777049252025.webp)
