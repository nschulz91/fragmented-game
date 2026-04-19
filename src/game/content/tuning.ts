export const arena = {
  width: 960,
  height: 540,
}

export const playerStats = {
  maxHealth: 120,
  moveSpeed: 215,
  slashDamage: 20,
  slashRange: 76,
  slashCooldownMs: 290,
  pulseDamage: 10,
  pulseRange: 138,
  pulseCooldownMs: 4200,
  invulnerabilityMs: 650,
  waterDamagePerSecond: 14,
}

export const minionStats = {
  shade: { health: 24, speed: 92, touchDamage: 10, tint: 0x6c5ce7 },
  cultist: { health: 28, speed: 60, touchDamage: 8, tint: 0xc084fc },
  brute: { health: 46, speed: 54, touchDamage: 16, tint: 0xc35a3a },
}

export const bossStats = {
  maxHealth: 180,
  speed: 94,
  touchDamage: 18,
  projectileDamage: 12,
  summonThresholds: [0.72, 0.42],
}

export const wavePlan = [
  { shades: 4, cultists: 2, brutes: 0 },
  { shades: 3, cultists: 2, brutes: 2 },
]

export const spawnPoints = [
  { x: 120, y: 90 },
  { x: 842, y: 96 },
  { x: 154, y: 442 },
  { x: 812, y: 428 },
  { x: 472, y: 108 },
  { x: 482, y: 446 },
]

export const waterPools = [
  { x: 245, y: 182, radius: 62 },
  { x: 730, y: 140, radius: 48 },
  { x: 680, y: 382, radius: 72 },
]
