# Fragmented

Fragmented is a standalone browser-based 2D action-adventure combat slice built with Phaser and Vite.

This V2 milestone keeps the fight inside Lake Pixor and expands the playable loop to:

- title menu, how-to-play, settings, pause, checkpoint, boss intro, win, and lose scenes
- keyboard and gamepad support
- slash, pulse, dash, and parry combat
- three scripted pre-boss waves
- checkpoint buff and faction-perk selection
- a three-phase Warden boss with summons and stronger telegraphs
- deterministic debugging hooks for browser smoke tests

## Local Play

```bash
npm install
npm run dev
```

Open the local Vite URL, usually `http://127.0.0.1:5173/`.

## Production Preview

```bash
npm run build
npm run preview
```

This serves the production bundle locally.

If a hosted Vercel preview has been created for the current branch or repo, use that URL as the shareable browser build.

## Controls

- `WASD` or arrow keys: move
- `Space`: slash
- `Q`: time pulse
- `Shift`: dash / evade
- `E`: parry / block
- `Esc`: pause
- `F`: fullscreen
- `Enter`: continue through menu cards and end screens

## Gamepad

- left stick / d-pad: move
- south button: slash / confirm
- east button: dash
- west button: pulse
- north button: parry
- start: pause / confirm on menu-style scenes

## Smoke-Test Hooks

The game exposes two browser hooks for deterministic inspection:

- `window.render_game_to_text()`
- `window.advanceTime(ms)`

You can also set a deterministic encounter seed with the query string:

```text
/?seed=smoke-seed
```

## Project Structure

- `src/game/scenes/`: Phaser scene flow
- `src/game/entities/`: Charlie, enemies, and boss logic
- `src/game/systems/`: HUD, audio, gamepad, and seeded RNG helpers
- `src/game/content/`: tuning values and story text
- `src/game/state.ts`: run state, settings, buff/perk catalogs, and render-state types
- `src/ui/`: DOM shell around the canvas
- `docs/`: story and design notes

## Notes

- Visuals and audio are procedural placeholders tuned for readability and portability.
- The build is still a combat-first vertical slice, not the full open-world game.
- The docs in `docs/` remain the source story and direction for later expansion.
