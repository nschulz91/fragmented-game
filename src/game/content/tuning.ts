export const arena = {
  width: 960,
  height: 540,
}

export const playerStats = {
  maxHealth: 120,
  moveSpeed: 220,
  slashDamage: 22,
  slashRange: 82,
  slashCooldownMs: 270,
  pulseDamage: 14,
  pulseRange: 148,
  pulseCooldownMs: 4000,
  dashDistance: 118,
  dashDurationMs: 120,
  dashCooldownMs: 1450,
  parryWindowMs: 220,
  parryCooldownMs: 1450,
  invulnerabilityMs: 620,
  waterDamagePerSecond: 15,
}

export const minionStats = {
  shade: { health: 28, speed: 110, touchDamage: 12, tint: 0x6f5df7 },
  cultist: { health: 32, speed: 72, touchDamage: 8, tint: 0xc88ef2 },
  brute: { health: 58, speed: 64, touchDamage: 18, tint: 0xc16e45 },
}

export const bossStats = {
  maxHealth: 240,
  speed: 94,
  touchDamage: 18,
  projectileDamage: 12,
  phaseThresholds: [0.7, 0.35],
}

export const wavePlan = [
  { label: 'Wave 1', shades: 4, cultists: 0, brutes: 1, objective: 'Pressure test. Learn the first lunge and charge telegraphs.' },
  { label: 'Wave 2', shades: 3, cultists: 3, brutes: 1, objective: 'Ranged pressure enters the arena. Break cultists before they control space.' },
  { label: 'Wave 3', shades: 3, cultists: 2, brutes: 2, objective: 'High-pressure breach. Survive long enough to reach the checkpoint.' },
]

export const spawnPoints = [
  { x: 116, y: 94 },
  { x: 848, y: 96 },
  { x: 158, y: 440 },
  { x: 812, y: 428 },
  { x: 470, y: 108 },
  { x: 480, y: 446 },
]

export const waterPools = [
  { x: 228, y: 178, radius: 72 },
  { x: 728, y: 136, radius: 52 },
  { x: 684, y: 388, radius: 84 },
]

export const arenaLandmarks = [
  { x: 146, y: 270, width: 124, height: 28 },
  { x: 460, y: 148, width: 188, height: 26 },
  { x: 774, y: 232, width: 134, height: 28 },
  { x: 470, y: 372, width: 222, height: 28 },
]

