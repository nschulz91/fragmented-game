# Fragmented

Fragmented is a standalone browser-based 2D action game built with Phaser and Vite.

The current milestone, **Warden Aftermath**, turns the original Lake Pixor slice into a chapter-based run:

- `Chapter 1`: Lake Pixor
- `Transition`: Breach Road
- `Chapter 2`: Cinder Causeway

It now includes:

- mission briefing, chapter cards, portrait-card dialogue scenes, reward room, route scene, second-region gameplay, and results summary
- persistent meta progression with unlocked relics, unlocked challenge modifiers, best rank/score, and browser-local settings
- slash, pulse, dash, parry, and charged strike combat
- faction variants, challenge modifiers, and run score multipliers
- a post-Warden reward flow and a broader second playable region with two new enemy families
- controller-aware prompts, fullscreen/settings persistence, and deterministic smoke coverage

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

## Controls

- `WASD` or arrow keys: move
- `Space`: slash
- `Q`: time pulse
- `Shift`: dash / evade
- `E`: parry / block
- `C`: charged strike
- `M`: mute toggle
- `Esc`: pause
- `F`: fullscreen
- `Enter`: continue / confirm on story and menu scenes

## Gamepad

- left stick / d-pad: move
- south button: slash / confirm
- east button: dash
- west button: pulse
- north button: parry
- right shoulder: charged strike
- start: pause / confirm on card scenes

## Persistence

The game persists browser-local meta progress:

- unlocked relic ids
- unlocked challenge modifier ids
- highest unlocked region
- best chapter rank / best run rank
- best score
- settings

It does **not** persist in-progress combat state.

## Deterministic Hooks

The game exposes two browser hooks for deterministic inspection:

- `window.render_game_to_text()`
- `window.advanceTime(ms)`

You can also set a deterministic encounter seed:

```text
/?seed=smoke-seed
```

## Regression Check

```bash
npm run smoke
```

This builds the project, serves the production bundle locally, and verifies the chapter flow:

- menu
- mission briefing
- chapter card / dialogue
- Lake Pixor gameplay
- checkpoint
- boss intro
- reward room
- Breach Road
- Cinder Causeway
- results summary

## Project Structure

- `src/game/scenes/`: chapter flow, gameplay scenes, overlays, reward/results flow
- `src/game/entities/`: Charlie, enemies, and boss logic
- `src/game/systems/`: HUD, audio, gamepad, and seeded RNG helpers
- `src/game/content/`: tuning values and story text
- `src/game/state.ts`: run state, meta progression, persistence, modifier/relic catalogs, and render-state types
- `src/ui/`: DOM shell around the canvas
- `docs/`: story and design notes

## Notes

- Art, portraits, relics, and audio loops are still procedural placeholders.
- The build is chapter-based and combat-first, not open world.
- The public browser build is served from GitHub Pages via the repo workflow.
