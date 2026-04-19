export const arena = {
  width: 960,
  height: 540,
}

export const routeMap = {
  width: 1440,
  height: 540,
}

export const causewayMap = {
  width: 1680,
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
  chargeDamage: 38,
  chargeRadius: 86,
  chargeCooldownMs: 2500,
  chargeTimeMs: 520,
  invulnerabilityMs: 620,
  waterDamagePerSecond: 15,
  fireDamagePerSecond: 19,
}

export const minionStats = {
  shade: { health: 28, speed: 110, touchDamage: 12, tint: 0x6f5df7 },
  cultist: { health: 32, speed: 72, touchDamage: 8, tint: 0xc88ef2 },
  brute: { health: 58, speed: 64, touchDamage: 18, tint: 0xc16e45 },
  embermage: { health: 34, speed: 76, touchDamage: 10, tint: 0xff9358 },
  ashhound: { health: 40, speed: 142, touchDamage: 14, tint: 0xe8c280 },
}

export const bossStats = {
  maxHealth: 260,
  speed: 96,
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

export const routeLandmarks = [
  { x: 180, y: 274, width: 160, height: 36 },
  { x: 540, y: 152, width: 180, height: 28 },
  { x: 920, y: 382, width: 220, height: 30 },
  { x: 1260, y: 250, width: 160, height: 30 },
]

export const routeHazards = [
  { x: 346, y: 180, radius: 44 },
  { x: 820, y: 252, radius: 56 },
  { x: 1140, y: 396, radius: 62 },
]

export const routeEncounter = {
  shades: 1,
  embermages: 2,
  ashhounds: 2,
}

export const causewayLandmarks = [
  { x: 180, y: 254, width: 160, height: 30 },
  { x: 470, y: 170, width: 240, height: 28 },
  { x: 780, y: 360, width: 210, height: 28 },
  { x: 1110, y: 182, width: 240, height: 26 },
  { x: 1430, y: 310, width: 210, height: 32 },
]

export const causewayHazards = [
  { x: 338, y: 214, radius: 54 },
  { x: 620, y: 408, radius: 72 },
  { x: 1022, y: 278, radius: 68 },
  { x: 1360, y: 176, radius: 62 },
]

export const causewayStages = [
  {
    label: 'Causeway Gate One',
    objective: 'Break the first lane and clear the ember priests off the transit rail.',
    zoneStart: 0,
    zoneEnd: 520,
    enemies: ['embermage', 'embermage', 'ashhound', 'cultist'] as const,
  },
  {
    label: 'Causeway Mid Span',
    objective: 'Cross the middle span and survive the mixed rush at the shrine line.',
    zoneStart: 520,
    zoneEnd: 1120,
    enemies: ['ashhound', 'ashhound', 'shade', 'embermage', 'brute'] as const,
  },
  {
    label: 'Causeway Crown',
    objective: 'Hold the final approach and break the region-ending encounter.',
    zoneStart: 1120,
    zoneEnd: 1680,
    enemies: ['embermage', 'embermage', 'ashhound', 'ashhound', 'shade', 'cultist', 'brute'] as const,
  },
]
