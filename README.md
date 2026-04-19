# Fragmented

Fragmented is a standalone browser-based 2D action-adventure combat sandbox built with Phaser and Vite.  
This first milestone is a local-playable Lake Pixor encounter: Charlie Smith fights through two minion waves, defeats a Shadow Court warden, and proves out the core combat loop for the larger game.

## Local Run

```bash
npm install
npm run dev
```

Open the local Vite URL in a browser.

## Build And Preview

```bash
npm run build
npm run preview
```

## Controls

- `WASD` or arrow keys: move
- `Space`: slash
- `Shift`: time pulse
- `Enter`: continue from menu, briefing, win, or lose screens

## Version 1 Scope

- Browser-based local game loop
- Menu, mission brief, gameplay, win, and lose scenes
- Top-down arena combat
- Charlie as the only playable character
- Three minion archetypes
- One boss encounter
- Toxic water hazard
- Keyboard-only controls
- Lightweight procedural sound effects

## Project Structure

- `src/game/scenes/`: Phaser scenes
- `src/game/entities/`: player and enemy logic
- `src/game/systems/`: HUD and sound helpers
- `src/game/content/`: tuning values and story text
- `src/ui/`: DOM shell around the canvas
- `docs/`: story and design notes

## Notes

- The visual assets are intentionally generated placeholders for speed and portability.
- The current build is a combat-first sandbox, not the full open-world game.
- The docs in `docs/` capture the source story and the design direction for expansion.
