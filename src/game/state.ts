export type SceneMode =
  | 'menu'
  | 'briefing'
  | 'chapter-card'
  | 'dialogue'
  | 'instructions'
  | 'settings'
  | 'checkpoint'
  | 'boss-intro'
  | 'reward'
  | 'route'
  | 'game'
  | 'causeway'
  | 'pause'
  | 'win'
  | 'lose'
  | 'results'

export type RegionId = 'pixor' | 'breach-road' | 'causeway'
export type RankId = 'S' | 'A' | 'B' | 'C'
export type InputMode = 'keyboard' | 'controller'

export type BuffId = 'time-thread' | 'iron-blood' | 'rift-step'
export type PerkId = 'house-veyra' | 'order-of-glass' | 'pixor-scouts'
export type RelicId = 'wardens-heart' | 'glass-lens' | 'scout-feather' | 'ember-idol'
export type ChallengeModifierId = 'ember-tax' | 'glass-fragility' | 'hunters-mark'
export type FactionVariantId = 'house-veyra' | 'order-of-glass' | 'pixor-scouts'

export interface SettingsState {
  masterVolume: number
  musicVolume: number
  sfxVolume: number
  muted: boolean
  fullscreen: boolean
}

export interface CheckpointState {
  unlocked: boolean
  seed: string
  reachedAtWave: number
}

export interface MetaProgress {
  unlockedRelics: RelicId[]
  unlockedChallengeModifiers: ChallengeModifierId[]
  highestRegionUnlocked: RegionId
  bestRunRank: RankId | null
  bestRunScore: number
  bestChapterRanks: Partial<Record<Exclude<RegionId, 'breach-road'>, RankId>>
  factionVariantsUnlocked: FactionVariantId[]
  completedRuns: number
  settings: SettingsState
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
  currentRegion: RegionId
  currentChapter: 1 | 2
  currentFlow: SceneMode
  inputMode: InputMode
  score: number
  scoreMultiplier: number
  equippedRelic: RelicId | null
  activeRelics: RelicId[]
  activeChallengeModifiers: ChallengeModifierId[]
  factionVariant: FactionVariantId
  unlockedRelicsThisRun: RelicId[]
  unlockedModifiersThisRun: ChallengeModifierId[]
  chapterScores: Partial<Record<Exclude<RegionId, 'breach-road'>, number>>
  chapterRanks: Partial<Record<Exclude<RegionId, 'breach-road'>, RankId>>
  routeShrineUsed: boolean
  causewayStage: number
}

export interface RenderState {
  mode: SceneMode
  flow: SceneMode
  coordinateSystem: string
  region?: RegionId
  chapter?: number
  seed?: string
  inputMode?: InputMode
  player?: {
    x: number
    y: number
    health: number
    maxHealth: number
    facing: { x: number; y: number }
    dashReady: boolean
    parryReady: boolean
    pulseReady: boolean
    chargeReady?: boolean
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
  relics?: RelicId[]
  activeModifiers?: ChallengeModifierId[]
  score?: number
  rank?: RankId | null
  objective?: string
}

export const defaultSettings: SettingsState = {
  masterVolume: 0.85,
  musicVolume: 0.3,
  sfxVolume: 0.8,
  muted: false,
  fullscreen: false,
}

export const relicCatalog: Record<RelicId, { name: string; description: string }> = {
  'wardens-heart': {
    name: 'Warden Heart',
    description: 'Max health rises and each chapter clear restores a small amount of life.',
  },
  'glass-lens': {
    name: 'Glass Lens',
    description: 'Pulse and charged detonation radius expand, making space control easier.',
  },
  'scout-feather': {
    name: 'Scout Feather',
    description: 'Move speed and dash distance rise, especially useful on lane-heavy routes.',
  },
  'ember-idol': {
    name: 'Ember Idol',
    description: 'Charged strike deals heavier damage and leaves a brief burning patch.',
  },
}

export const challengeModifierCatalog: Record<
  ChallengeModifierId,
  { name: string; description: string; scoreMultiplier: number }
> = {
  'ember-tax': {
    name: 'Ember Tax',
    description: 'Hazards burn harder and Causeway enemies apply more pressure.',
    scoreMultiplier: 1.15,
  },
  'glass-fragility': {
    name: 'Glass Fragility',
    description: 'Charlie starts with less health, but final score climbs faster.',
    scoreMultiplier: 1.25,
  },
  'hunters-mark': {
    name: 'Hunter’s Mark',
    description: 'Extra enemies join key encounters, but the run pays out more score.',
    scoreMultiplier: 1.4,
  },
}

export const factionVariantCatalog: Record<
  FactionVariantId,
  { name: string; description: string; scoreMultiplier: number }
> = {
  'house-veyra': {
    name: 'House Veyra',
    description: 'Safer pacing, more shielding, lower score pressure.',
    scoreMultiplier: 0.95,
  },
  'order-of-glass': {
    name: 'Order of Glass',
    description: 'Sharper parry rewards and more exacting combat windows.',
    scoreMultiplier: 1.1,
  },
  'pixor-scouts': {
    name: 'Pixor Scouts',
    description: 'Faster movement and riskier routes with stronger score payout.',
    scoreMultiplier: 1.12,
  },
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

const settingsStorageKey = 'fragmented-settings-v1'
const metaStorageKey = 'fragmented-meta-v1'

export function createMetaProgress(): MetaProgress {
  return {
    unlockedRelics: [],
    unlockedChallengeModifiers: [],
    highestRegionUnlocked: 'pixor',
    bestRunRank: null,
    bestRunScore: 0,
    bestChapterRanks: {},
    factionVariantsUnlocked: ['house-veyra', 'order-of-glass', 'pixor-scouts'],
    completedRuns: 0,
    settings: { ...defaultSettings },
  }
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
    currentRegion: 'pixor',
    currentChapter: 1,
    currentFlow: 'menu',
    inputMode: 'keyboard',
    score: 0,
    scoreMultiplier: 1,
    equippedRelic: null,
    activeRelics: [],
    activeChallengeModifiers: [],
    factionVariant: 'house-veyra',
    unlockedRelicsThisRun: [],
    unlockedModifiersThisRun: [],
    chapterScores: {},
    chapterRanks: {},
    routeShrineUsed: false,
    causewayStage: 0,
  }
}

export function loadMetaProgress(): MetaProgress {
  if (typeof window === 'undefined') return createMetaProgress()
  try {
    const raw = window.localStorage.getItem(metaStorageKey)
    if (!raw) return createMetaProgress()
    const parsed = JSON.parse(raw) as Partial<MetaProgress>
    return {
      ...createMetaProgress(),
      ...parsed,
      settings: {
        ...defaultSettings,
        ...(parsed.settings ?? {}),
      },
    }
  } catch {
    return createMetaProgress()
  }
}

export function saveMetaProgress(progress: MetaProgress) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(metaStorageKey, JSON.stringify(progress))
  } catch {
    // Ignore storage errors so local play still works without persistence.
  }
}

export function loadSettings(): SettingsState {
  if (typeof window === 'undefined') return { ...defaultSettings }
  const meta = loadMetaProgress()
  try {
    const raw = window.localStorage.getItem(settingsStorageKey)
    if (!raw) return { ...defaultSettings, ...meta.settings }
    const parsed = JSON.parse(raw) as Partial<SettingsState>
    return {
      ...defaultSettings,
      ...meta.settings,
      ...parsed,
    }
  } catch {
    return { ...defaultSettings, ...meta.settings }
  }
}

export function saveSettings(settings: SettingsState) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(settingsStorageKey, JSON.stringify(settings))
    const meta = loadMetaProgress()
    meta.settings = { ...defaultSettings, ...settings }
    saveMetaProgress(meta)
  } catch {
    // Ignore storage failures; the game should still run normally.
  }
}

export function getSeedFromLocation() {
  const params = new URLSearchParams(window.location.search)
  return params.get('seed') || 'pixor-v2-default'
}

export function getScoreMultiplier(
  activeChallengeModifiers: ChallengeModifierId[],
  factionVariant: FactionVariantId
): number {
  return Number(
    (
      factionVariantCatalog[factionVariant].scoreMultiplier *
      activeChallengeModifiers.reduce((sum, modifierId) => sum * challengeModifierCatalog[modifierId].scoreMultiplier, 1)
    ).toFixed(2)
  )
}

export function calculateRank(score: number, region: Exclude<RegionId, 'breach-road'> | 'run'): RankId {
  const thresholds =
    region === 'pixor'
      ? { S: 1700, A: 1200, B: 780 }
      : region === 'causeway'
        ? { S: 3600, A: 2600, B: 1800 }
        : { S: 5400, A: 4000, B: 2800 }

  if (score >= thresholds.S) return 'S'
  if (score >= thresholds.A) return 'A'
  if (score >= thresholds.B) return 'B'
  return 'C'
}

export function grantScore(runState: RunState, baseScore: number) {
  runState.score += Math.round(baseScore * runState.scoreMultiplier)
}

export function unlockRelic(meta: MetaProgress, runState: RunState, relicId: RelicId) {
  if (!meta.unlockedRelics.includes(relicId)) meta.unlockedRelics.push(relicId)
  if (!runState.unlockedRelicsThisRun.includes(relicId)) runState.unlockedRelicsThisRun.push(relicId)
  if (!runState.activeRelics.includes(relicId)) runState.activeRelics.push(relicId)
}

export function unlockChallengeModifier(meta: MetaProgress, runState: RunState, modifierId: ChallengeModifierId) {
  if (!meta.unlockedChallengeModifiers.includes(modifierId)) meta.unlockedChallengeModifiers.push(modifierId)
  if (!runState.unlockedModifiersThisRun.includes(modifierId)) runState.unlockedModifiersThisRun.push(modifierId)
}

export function recordChapterResult(
  meta: MetaProgress,
  runState: RunState,
  region: Exclude<RegionId, 'breach-road'>,
  score: number
) {
  const rank = calculateRank(score, region)
  runState.chapterScores[region] = score
  runState.chapterRanks[region] = rank
  const currentBest = meta.bestChapterRanks[region]
  if (!currentBest || compareRank(rank, currentBest) < 0) {
    meta.bestChapterRanks[region] = rank
  }
  if (region === 'causeway') meta.highestRegionUnlocked = 'causeway'
  return rank
}

export function recordRunResult(meta: MetaProgress, runState: RunState) {
  const rank = calculateRank(runState.score, 'run')
  if (runState.score > meta.bestRunScore) meta.bestRunScore = runState.score
  if (!meta.bestRunRank || compareRank(rank, meta.bestRunRank) < 0) meta.bestRunRank = rank
  meta.completedRuns += 1
  return rank
}

function compareRank(left: RankId, right: RankId) {
  const order: RankId[] = ['S', 'A', 'B', 'C']
  return order.indexOf(left) - order.indexOf(right)
}
