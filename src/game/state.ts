export type SceneMode =
  | 'menu'
  | 'instructions'
  | 'settings'
  | 'checkpoint'
  | 'boss-intro'
  | 'game'
  | 'pause'
  | 'win'
  | 'lose'

export type BuffId = 'time-thread' | 'iron-blood' | 'rift-step'
export type PerkId = 'house-veyra' | 'order-of-glass' | 'pixor-scouts'

export interface SettingsState {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  fullscreen: boolean
}

export interface CheckpointState {
  unlocked: boolean
  seed: string
  reachedAtWave: number
}

export interface RunState {
  seed: string
  currentWave: number
  bossPhase: number
  checkpoint: CheckpointState
  selectedBuff: BuffId | null
  selectedPerk: PerkId | null
  shieldCharges: number
  boostUntil: number
  resumedFromCheckpoint: boolean
  paused: boolean
  mode: SceneMode
}

export interface RenderState {
  mode: SceneMode
  coordinateSystem: string
  player?: {
    x: number
    y: number
    health: number
    maxHealth: number
    facing: { x: number; y: number }
    dashReady: boolean
    parryReady: boolean
    pulseReady: boolean
    shieldCharges: number
  }
  enemies?: Array<{
    kind: string
    x: number
    y: number
    health: number
    state?: string
  }>
  boss?: {
    phase: number
    health: number
    maxHealth: number
    state?: string
  }
  encounter?: {
    seed: string
    wave: number
    checkpointUnlocked: boolean
    selectedBuff: BuffId | null
    selectedPerk: PerkId | null
  }
  objective?: string
}

export const defaultSettings: SettingsState = {
  masterVolume: 0.85,
  musicVolume: 0.45,
  sfxVolume: 0.8,
  fullscreen: false,
}

export function createRunState(seed = 'pixor-v2-default'): RunState {
  return {
    seed,
    currentWave: 1,
    bossPhase: 0,
    checkpoint: {
      unlocked: false,
      seed,
      reachedAtWave: 0,
    },
    selectedBuff: null,
    selectedPerk: null,
    shieldCharges: 0,
    boostUntil: 0,
    resumedFromCheckpoint: false,
    paused: false,
    mode: 'menu',
  }
}

export const buffCatalog: Record<BuffId, { name: string; description: string }> = {
  'time-thread': {
    name: 'Time Thread',
    description: 'Pulse cooldown drops and the arena feels slower around Charlie.',
  },
  'iron-blood': {
    name: 'Iron Blood',
    description: 'Max health rises and Charlie stabilizes before the boss breach.',
  },
  'rift-step': {
    name: 'Rift Step',
    description: 'Dash cooldown shortens and each evade travels farther.',
  },
}

export const perkCatalog: Record<PerkId, { name: string; faction: string; description: string }> = {
  'house-veyra': {
    name: 'House Veyra',
    faction: 'House Veyra',
    description: 'A shield pulse periodically reforms and can absorb one hit.',
  },
  'order-of-glass': {
    name: 'Order of Glass',
    faction: 'Order of Glass',
    description: 'Parry timing is more forgiving and enemy stun lasts longer.',
  },
  'pixor-scouts': {
    name: 'Pixor Scouts',
    faction: 'Pixor Scouts',
    description: 'A successful dash through danger grants a brief damage spike.',
  },
}

export function getSeedFromLocation() {
  const params = new URLSearchParams(window.location.search)
  return params.get('seed') || 'pixor-v2-default'
}

