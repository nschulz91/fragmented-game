import Phaser from 'phaser'
import { setControlsText, setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'
import { audioDirector } from '../systems/AudioDirector'
import { createRunState, loadMetaProgress, loadSettings, getSeedFromLocation } from '../state'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  preload() {
    this.load.spritesheet('charlie-sheet', '/assets/generated/charlie_sheet_final.png', {
      frameWidth: 220,
      frameHeight: 320,
    })
    this.load.spritesheet('shade-sheet', '/assets/generated/shade_sheet_final.png', {
      frameWidth: 180,
      frameHeight: 264,
    })
    this.load.spritesheet('cultist-sheet', '/assets/generated/cultist_sheet_final.png', {
      frameWidth: 176,
      frameHeight: 252,
    })
    this.load.spritesheet('brute-sheet', '/assets/generated/brute_sheet_final.png', {
      frameWidth: 224,
      frameHeight: 320,
    })
    this.load.spritesheet('embermage-sheet', '/assets/generated/embermage_sheet_final.png', {
      frameWidth: 164,
      frameHeight: 252,
    })
    this.load.spritesheet('ashhound-sheet', '/assets/generated/ashhound_sheet_final.png', {
      frameWidth: 240,
      frameHeight: 164,
    })
    this.load.spritesheet('warden-sheet', '/assets/generated/warden_sheet_final.png', {
      frameWidth: 286,
      frameHeight: 360,
    })

    this.load.image('bg-pixor', '/assets/generated/pixor_painted.png')
    this.load.image('bg-route', '/assets/generated/route_painted.png')
    this.load.image('bg-causeway', '/assets/generated/causeway_painted.png')

    this.load.image('portrait-charlie', '/assets/generated/portrait_charlie_painted.png')
    this.load.image('portrait-warden', '/assets/generated/portrait_warden_painted.png')
    this.load.image('portrait-veyra', '/assets/generated/portrait_veyra_painted.png')
    this.load.image('portrait-scout', '/assets/generated/portrait_scout_painted.png')
    this.load.image('portrait-glass', '/assets/generated/portrait_glass_painted.png')
    this.load.image('charlie-fullbody', '/assets/generated/charlie_fullbody.png')
    this.load.image('charlie-turnaround', '/assets/generated/charlie_turnaround.png')
    this.load.image('fragmented-key-art', '/assets/generated/fragmented_key_art.png')

    this.load.svg('pulse-ring', '/assets/fx/pulse-ring.svg')
    this.load.svg('shield', '/assets/fx/shield-orb.svg')
    this.load.svg('shrine', '/assets/fx/shrine.svg')
    this.load.svg('relic-core', '/assets/fx/relic-core.svg')
    this.load.spritesheet('fx-slash-sheet', '/assets/generated/fx_slash_sheet.png', {
      frameWidth: 220,
      frameHeight: 160,
    })
    this.load.spritesheet('fx-dash-sheet', '/assets/generated/fx_dash_sheet.png', {
      frameWidth: 240,
      frameHeight: 120,
    })
    this.load.spritesheet('fx-pulse-sheet', '/assets/generated/fx_pulse_sheet.png', {
      frameWidth: 260,
      frameHeight: 220,
    })
    this.load.spritesheet('fx-parry-sheet', '/assets/generated/fx_parry_sheet.png', {
      frameWidth: 160,
      frameHeight: 160,
    })
    this.load.spritesheet('fx-hit-sheet', '/assets/generated/fx_hit_sheet.png', {
      frameWidth: 160,
      frameHeight: 160,
    })
    this.load.spritesheet('fx-charge-sheet', '/assets/generated/fx_charge_sheet.png', {
      frameWidth: 260,
      frameHeight: 260,
    })
    this.load.image('stage-pixor-tile', '/assets/generated/stage_pixor_tile.png')
    this.load.image('stage-route-tile', '/assets/generated/stage_route_tile.png')
    this.load.image('stage-causeway-tile', '/assets/generated/stage_causeway_tile.png')
    this.load.image('stage-pixor-prop', '/assets/generated/stage_pixor_prop.png')
    this.load.image('stage-route-prop', '/assets/generated/stage_route_prop.png')
    this.load.image('stage-causeway-prop', '/assets/generated/stage_causeway_prop.png')
  }

  create() {
    this.buildTextures()
    this.buildAnimations()

    const metaProgress = loadMetaProgress()
    const settings = loadSettings()
    metaProgress.settings = settings

    this.registry.set('metaProgress', metaProgress)
    this.registry.set('settings', settings)
    this.registry.set('runState', createRunState(getSeedFromLocation()))
    this.registry.set('inputMode', 'keyboard')
    this.registry.set('renderState', {
      mode: 'menu',
      flow: 'menu',
      region: 'pixor',
      chapter: 1,
      seed: getSeedFromLocation(),
      inputMode: 'keyboard',
      coordinateSystem: 'origin=(0,0) top-left, +x right, +y down',
      encounter: {
        seed: getSeedFromLocation(),
        wave: 1,
        checkpointUnlocked: false,
        selectedBuff: null,
        selectedPerk: null,
      },
      relics: metaProgress.unlockedRelics,
      activeModifiers: [],
      score: 0,
      rank: null,
    })

    audioDirector.configure(() => this.registry.get('settings'))
    setStatusText('Meta systems loaded. Start the Warden Aftermath run.')
    setObjectiveText('Choose a relic, faction variant, and optional modifier before entering Lake Pixor.')
    setLoreText('Lake Pixor and the Cinder Causeway are now linked chapters in the same hunt.')
    setControlsText([
      'Move: WASD / arrows / left stick',
      'Slash: Space / south button',
      'Pulse: Q / west button',
      'Dash: Shift / east button',
      'Parry: E / north button',
      'Charge: C / right shoulder',
      'Mute: M',
      'Pause: Esc / start',
      'Fullscreen: F',
    ])

    ;(window as Window & {
      render_game_to_text?: () => string
      advanceTime?: (ms: number) => void
    }).render_game_to_text = () => JSON.stringify(this.registry.get('renderState') ?? {})

    ;(window as Window & {
      render_game_to_text?: () => string
      advanceTime?: (ms: number) => void
    }).advanceTime = (ms: number) => {
      const scene =
        (this.scene.get('game') as unknown as { manualAdvance?: (stepMs: number) => void } | undefined) ??
        (this.scene.get('causeway') as unknown as { manualAdvance?: (stepMs: number) => void } | undefined)
      scene?.manualAdvance?.(ms)
    }

    this.scene.start('menu')
  }

  private buildTextures() {
    this.makeCircleTexture('enemy-bolt', 8, 0xf4d7ff, 0x8e3bb4)
    this.makeCircleTexture('boss-bolt', 10, 0xffb366, 0xa14612)
    this.makeCircleTexture('ember-bolt', 9, 0xffbf6d, 0xc8561b)
  }

  private makeCircleTexture(key: string, radius: number, fill: number, stroke: number) {
    const gfx = this.add.graphics()
    gfx.fillStyle(fill, 1)
    gfx.lineStyle(4, stroke, 1)
    gfx.fillCircle(radius + 4, radius + 4, radius)
    gfx.strokeCircle(radius + 4, radius + 4, radius)
    gfx.generateTexture(key, radius * 2 + 8, radius * 2 + 8)
    gfx.destroy()
  }

  private buildAnimations() {
    if (!this.anims.exists('charlie-idle')) {
      this.anims.create({
        key: 'charlie-idle',
        frames: this.anims.generateFrameNumbers('charlie-sheet', { start: 0, end: 1 }),
        frameRate: 3,
        repeat: -1,
      })
    }
    if (!this.anims.exists('charlie-run')) {
      this.anims.create({
        key: 'charlie-run',
        frames: this.anims.generateFrameNumbers('charlie-sheet', { start: 2, end: 5 }),
        frameRate: 10,
        repeat: -1,
      })
    }
    if (!this.anims.exists('charlie-jump')) {
      this.anims.create({
        key: 'charlie-jump',
        frames: [
          { key: 'charlie-sheet', frame: 6, duration: 90 },
          { key: 'charlie-sheet', frame: 7, duration: 80 },
          { key: 'charlie-sheet', frame: 6, duration: 90 },
        ],
        frameRate: 10,
        repeat: -1,
      })
    }
    if (!this.anims.exists('charlie-fall')) {
      this.anims.create({
        key: 'charlie-fall',
        frames: [
          { key: 'charlie-sheet', frame: 7, duration: 110 },
          { key: 'charlie-sheet', frame: 6, duration: 90 },
        ],
        frameRate: 8,
        repeat: -1,
      })
    }
    if (!this.anims.exists('charlie-land')) {
      this.anims.create({
        key: 'charlie-land',
        frames: [
          { key: 'charlie-sheet', frame: 7, duration: 70 },
          { key: 'charlie-sheet', frame: 6, duration: 60 },
          { key: 'charlie-sheet', frame: 1, duration: 90 },
        ],
        frameRate: 12,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-dash')) {
      this.anims.create({
        key: 'charlie-dash',
        frames: this.anims.generateFrameNumbers('charlie-sheet', { start: 13, end: 14 }),
        frameRate: 16,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-slash')) {
      this.anims.create({
        key: 'charlie-slash',
        frames: this.anims.generateFrameNumbers('charlie-sheet', { start: 8, end: 10 }),
        frameRate: 18,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-pulse')) {
      this.anims.create({
        key: 'charlie-pulse',
        frames: this.anims.generateFrameNumbers('charlie-sheet', { start: 11, end: 12 }),
        frameRate: 10,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-parry')) {
      this.anims.create({
        key: 'charlie-parry',
        frames: this.anims.generateFrameNumbers('charlie-sheet', { start: 15, end: 16 }),
        frameRate: 14,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-charge-start')) {
      this.anims.create({
        key: 'charlie-charge-start',
        frames: [{ key: 'charlie-sheet', frame: 17 }],
        frameRate: 1,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-charge-hold')) {
      this.anims.create({
        key: 'charlie-charge-hold',
        frames: [{ key: 'charlie-sheet', frame: 18 }],
        frameRate: 1,
        repeat: -1,
      })
    }
    if (!this.anims.exists('charlie-charge-release')) {
      this.anims.create({
        key: 'charlie-charge-release',
        frames: [{ key: 'charlie-sheet', frame: 19 }],
        frameRate: 1,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-charge')) {
      this.anims.create({
        key: 'charlie-charge',
        frames: this.anims.generateFrameNumbers('charlie-sheet', { start: 17, end: 19 }),
        frameRate: 10,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-hit')) {
      this.anims.create({
        key: 'charlie-hit',
        frames: [{ key: 'charlie-sheet', frame: 20 }],
        frameRate: 1,
        repeat: 0,
      })
    }
    if (!this.anims.exists('charlie-death')) {
      this.anims.create({
        key: 'charlie-death',
        frames: this.anims.generateFrameNumbers('charlie-sheet', { start: 21, end: 22 }),
        frameRate: 4,
        repeat: 0,
      })
    }

    this.createNpcAnimations('shade-sheet', 'shade')
    this.createNpcAnimations('cultist-sheet', 'cultist')
    this.createNpcAnimations('brute-sheet', 'brute')
    this.createNpcAnimations('embermage-sheet', 'embermage')
    this.createNpcAnimations('ashhound-sheet', 'ashhound')
    this.createBossAnimations()
    this.createFxAnimations()
  }

  private createNpcAnimations(sheetKey: string, prefix: string) {
    const pairs: Array<[string, number[]]> = [
      ['idle', [0, 1]],
      ['move', [2, 3, 4]],
      ['telegraph', [5, 6]],
      ['attack', [7, 8]],
      ['hit', [9]],
      ['death', [10, 11]],
    ]
    pairs.forEach(([name, frames]) => {
      const key = `${prefix}-${name}`
      if (this.anims.exists(key)) return
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: sheetKey, frame })),
        frameRate: name === 'move' ? 8 : name === 'telegraph' || name === 'attack' ? 10 : name === 'death' ? 6 : 3,
        repeat: name === 'idle' || name === 'move' ? -1 : 0,
      })
    })
  }

  private createBossAnimations() {
    const defs: Array<[string, number[]]> = [
      ['warden-idle', [0, 1]],
      ['warden-move', [2, 3, 4]],
      ['warden-cast', [5, 6, 7]],
      ['warden-dash', [8, 9]],
      ['warden-phase', [10, 11]],
      ['warden-hit', [12]],
      ['warden-death', [13, 14]],
    ]
    defs.forEach(([key, frames]) => {
      if (this.anims.exists(key)) return
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: 'warden-sheet', frame })),
        frameRate: frames.length > 1 ? 6 : 1,
        repeat: key === 'warden-idle' || key === 'warden-move' ? -1 : 0,
      })
    })
  }

  private createFxAnimations() {
    const defs: Array<[string, string, number[]]> = [
      ['fx-slash', 'fx-slash-sheet', [0, 1, 2, 3, 4]],
      ['fx-pulse', 'fx-pulse-sheet', [0, 1, 2, 3, 4]],
      ['fx-dash', 'fx-dash-sheet', [0, 1, 2, 3, 4]],
      ['fx-parry', 'fx-parry-sheet', [0, 1, 2, 3, 4]],
      ['fx-hit', 'fx-hit-sheet', [0, 1, 2, 3, 4]],
      ['fx-charge', 'fx-charge-sheet', [0, 1, 2, 3, 4, 5, 6]],
    ]
    defs.forEach(([key, sheet, frames]) => {
      if (this.anims.exists(key)) return
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: sheet, frame })),
        frameRate: 14,
        repeat: 0,
      })
    })
  }
}
