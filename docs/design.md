# Fragmented Design Notes

## Current Milestone

Build a locally runnable browser game that proves:

- Charlie's side-scrolling movement works across branching routes
- close-range combat feels readable
- time-based power can matter without overcomplicating controls
- enemy variety can be delivered with simple AI
- the game loop supports menu -> mission -> chapter flow -> win/lose

## Implemented Choices

- Side-scrolling action with layered routes and platform combat
- Phaser 3 with Vite and TypeScript
- Two-chapter structure: Lake Pixor -> Breach Road -> Cinder Causeway
- Five minion types: shade, cultist, brute, embermage, ashhound
- One multi-phase chapter boss: the Warden of Lake Pixor
- Hazard system: toxic water, ember vents, lane traps
- Story delivered through chapter cards, dialogue portraits, mission briefings, and shell text
- Generated-and-curated PNG sprite sheets for Charlie, enemies, boss states, and combat FX
- Painted backdrops plus chapter-specific stage tiles and prop dressing for Lake Pixor, Breach Road, and Cinder Causeway
- Slimmed shell/HUD layout so the gameplay plane and background art stay visible during testing

## Deferred Work

- Open world traversal
- Full AI ally system
- Inventory depth
- Playable brother unlock
- Final production-quality sprite-sheet animation cleanup
- Higher-end painted environment packs and authored audio tracks
