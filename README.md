# Village Chronicles — Steampunk Settlement

A 3D village simulation game built for the Supercell hackathon. Place buildings on a grid, produce resources, and watch an AI chronicler narrate your settlement's history in medieval prose.

## Quick Start

```bash
npm install
npm run dev
```

Open `http://localhost:5173` in your browser.

## How to Play

1. **Click an empty grid cell** to open the build menu
2. **Place a Clockwork Forge** (free) to start producing Gears
3. **Spend resources** to build Steam Mills, Crystal Refineries, and more
4. **Click buildings** to view info, upgrade with Blueprints, or activate trade boosts
5. **Click NPCs** (orange figures) to chat with villagers
6. **Watch the Chronicle** (right sidebar) for narrative history entries

## Buildings

| Building | Produces | Cost |
|---|---|---|
| Clockwork Forge | 5 Gears/s | Free |
| Steam Mill | 3 Steam/s | 50 Gears |
| Crystal Refinery | 1 Crystal/s | 100 Gears, 50 Steam |
| Airship Dock | 2x boost (30s) | 80 Gears, 40 Steam, 20 Crystals |
| Inventor's Workshop | Blueprints | 150 Gears, 75 Steam, 30 Crystals |

## Resources

- **Gears** — Mechanical currency, produced by forges
- **Steam** — Energy resource, produced by mills
- **Crystals** — Rare arcane resource, produced by refineries
- **Blueprints** — Produced by workshops, used to upgrade buildings

## Tech Stack

- React + Vite + TailwindCSS v4
- React Three Fiber + @react-three/drei (3D rendering)
- Zustand (state management)
- Framer Motion (UI animations)
- Web Audio API (sound effects)

## Project Structure

```
src/
├── store/useStore.js          # Zustand game state + game loop
├── components/3d/             # R3F 3D scene, grid, buildings, NPCs
├── components/ui/             # HUD, build menu, chronicle, chat
├── services/ai/               # AI harness + mock provider (stubbed)
├── data/                      # Building definitions, chronicle templates
└── utils/                     # Grid helpers, sound effects
```

## Build

```bash
npm run build    # Production build to dist/
npm run preview  # Preview production build
```
