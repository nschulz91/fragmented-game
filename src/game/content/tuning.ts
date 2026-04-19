export const arena = {
  width: 1960,
  height: 540,
}

export const routeMap = {
  width: 1880,
  height: 540,
}

export const causewayMap = {
  width: 2320,
  height: 540,
}

export const playerStats = {
  maxHealth: 120,
  moveSpeed: 240,
  jumpVelocity: 640,
  slashDamage: 22,
  slashRange: 92,
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
  { x: 260, y: 340 },
  { x: 580, y: 290 },
  { x: 760, y: 410 },
  { x: 1020, y: 224 },
  { x: 1280, y: 378 },
  { x: 1510, y: 310 },
  { x: 1760, y: 244 },
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

export const pixorPlatforms = [
  { x: 80, y: 472, width: 1760, height: 34, branch: 'main' as const },
  { x: 302, y: 356, width: 250, height: 24, branch: 'high' as const },
  { x: 618, y: 292, width: 234, height: 24, branch: 'high' as const },
  { x: 908, y: 394, width: 210, height: 24, branch: 'low' as const },
  { x: 1188, y: 326, width: 218, height: 24, branch: 'high' as const },
  { x: 1488, y: 286, width: 236, height: 24, branch: 'boss' as const },
]

export const pixorHazards = [
  { x: 468, y: 502, width: 188, height: 38, type: 'water' as const },
  { x: 830, y: 502, width: 144, height: 38, type: 'water' as const },
  { x: 1328, y: 502, width: 156, height: 38, type: 'water' as const },
]

export const routeLandmarks = [
  { x: 180, y: 274, width: 160, height: 36 },
  { x: 540, y: 152, width: 180, height: 28 },
  { x: 920, y: 382, width: 220, height: 30 },
  { x: 1260, y: 250, width: 160, height: 30 },
]

export const routePlatforms = [
  { x: 72, y: 476, width: 1718, height: 34, branch: 'main' as const },
  { x: 300, y: 360, width: 210, height: 22, branch: 'high' as const },
  { x: 566, y: 278, width: 202, height: 22, branch: 'high' as const },
  { x: 834, y: 392, width: 232, height: 22, branch: 'low' as const },
  { x: 1124, y: 308, width: 220, height: 22, branch: 'high' as const },
  { x: 1434, y: 360, width: 218, height: 22, branch: 'low' as const },
  { x: 1640, y: 286, width: 168, height: 22, branch: 'high' as const },
]

export const routeHazards = [
  { x: 420, y: 506, width: 156, height: 34, type: 'fire' as const },
  { x: 932, y: 506, width: 128, height: 34, type: 'fire' as const },
  { x: 1184, y: 506, width: 118, height: 34, type: 'fire' as const },
  { x: 1500, y: 506, width: 146, height: 34, type: 'fire' as const },
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

export const causewayPlatforms = [
  { x: 56, y: 478, width: 2140, height: 36, branch: 'main' as const },
  { x: 250, y: 368, width: 214, height: 22, branch: 'high' as const },
  { x: 516, y: 286, width: 222, height: 22, branch: 'high' as const },
  { x: 812, y: 398, width: 236, height: 22, branch: 'low' as const },
  { x: 1134, y: 316, width: 214, height: 22, branch: 'high' as const },
  { x: 1458, y: 384, width: 248, height: 22, branch: 'low' as const },
  { x: 1760, y: 300, width: 220, height: 22, branch: 'high' as const },
  { x: 2038, y: 246, width: 192, height: 22, branch: 'crown' as const },
]

export const causewayHazards = [
  { x: 360, y: 506, width: 168, height: 34, type: 'fire' as const },
  { x: 930, y: 506, width: 152, height: 34, type: 'fire' as const },
  { x: 1278, y: 506, width: 144, height: 34, type: 'fire' as const },
  { x: 1644, y: 506, width: 144, height: 34, type: 'fire' as const },
  { x: 1960, y: 506, width: 158, height: 34, type: 'fire' as const },
]

export const causewayStages = [
  {
    label: 'Causeway Gate One',
    objective: 'Break the first lane and clear the ember priests off the transit rail.',
    zoneStart: 0,
    zoneEnd: 760,
    enemies: ['embermage', 'embermage', 'ashhound', 'cultist'] as const,
  },
  {
    label: 'Causeway Mid Span',
    objective: 'Cross the middle span and survive the mixed rush at the shrine line.',
    zoneStart: 760,
    zoneEnd: 1540,
    enemies: ['ashhound', 'ashhound', 'shade', 'embermage', 'brute'] as const,
  },
  {
    label: 'Causeway Crown',
    objective: 'Hold the final approach and break the region-ending encounter.',
    zoneStart: 1540,
    zoneEnd: 2320,
    enemies: ['embermage', 'embermage', 'ashhound', 'ashhound', 'shade', 'cultist', 'brute'] as const,
  },
]
