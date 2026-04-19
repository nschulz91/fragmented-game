# Fragmented Design Notes

## Current Milestone

Build a locally runnable browser game that proves:

- Charlie's core movement works
- close-range combat feels readable
- time-based power can matter without overcomplicating controls
- enemy variety can be delivered with simple AI
- the game loop supports menu -> mission -> battle -> win/lose

## Implemented Choices

- Top-down action instead of side-view
- Phaser 3 with Vite and TypeScript
- Single-screen Lake Pixor arena
- Three minion types: shade, cultist, brute
- One boss: the warden of Lake Pixor
- Hazard system: toxic water
- Story delivered through menu copy and shell text instead of dialogue trees

## Deferred Work

- Open world traversal
- Ally system
- Save progression
- Inventory depth
- Playable brother unlock
- Custom art pipeline
- Expanded boss scripting and cutscenes
