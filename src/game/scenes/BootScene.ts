import Phaser from 'phaser'
import { setControlsText, setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'
import { audioDirector } from '../systems/AudioDirector'
import { createRunState, loadMetaProgress, loadSettings, getSeedFromLocation } from '../state'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create() {
    this.buildTextures()

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
    this.makeCircleTexture('charlie', 24, 0xf2d39b, 0x5f1931)
    this.makeCircleTexture('shade', 18, 0x7869ff, 0x281c5e)
    this.makeCircleTexture('cultist', 18, 0xd6a7ff, 0x59306b)
    this.makeCircleTexture('brute', 24, 0xc06c3d, 0x5e2c16)
    this.makeCircleTexture('embermage', 19, 0xff9a63, 0x7d3115)
    this.makeCircleTexture('ashhound', 21, 0xdac48d, 0x4c4031)
    this.makeCircleTexture('warden', 34, 0xffca80, 0x6f300f)
    this.makeCircleTexture('enemy-bolt', 8, 0xf4d7ff, 0x8e3bb4)
    this.makeCircleTexture('boss-bolt', 10, 0xffb366, 0xa14612)
    this.makeCircleTexture('ember-bolt', 9, 0xffbf6d, 0xc8561b)
    this.makeCircleTexture('shield', 12, 0xbdf3ff, 0x3d7da0)
    this.makeCircleTexture('shrine', 16, 0xa9f2d1, 0x36735e)
    this.makeCircleTexture('relic-core', 14, 0xf6e2a6, 0x745b20)
    this.makeRingTexture('pulse-ring', 148, 0xbdefff)
    this.makePortraitTexture('portrait-charlie', 0xf2d39b, 0x5f1931)
    this.makePortraitTexture('portrait-warden', 0xffca80, 0x6f300f)
    this.makePortraitTexture('portrait-veyra', 0xb7d9f8, 0x345c79)
    this.makePortraitTexture('portrait-scout', 0xc7f1b4, 0x426038)
    this.makePortraitTexture('portrait-glass', 0xe7d7ff, 0x6d59a1)
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

  private makeRingTexture(key: string, radius: number, color: number) {
    const gfx = this.add.graphics()
    gfx.lineStyle(6, color, 0.9)
    gfx.strokeCircle(radius + 6, radius + 6, radius)
    gfx.generateTexture(key, radius * 2 + 12, radius * 2 + 12)
    gfx.destroy()
  }

  private makePortraitTexture(key: string, fill: number, stroke: number) {
    const gfx = this.add.graphics()
    gfx.fillStyle(fill, 1)
    gfx.fillRoundedRect(0, 0, 128, 148, 18)
    gfx.lineStyle(5, stroke, 1)
    gfx.strokeRoundedRect(0, 0, 128, 148, 18)
    gfx.fillStyle(stroke, 0.28)
    gfx.fillCircle(64, 54, 28)
    gfx.fillRoundedRect(28, 86, 72, 36, 12)
    gfx.generateTexture(key, 128, 148)
    gfx.destroy()
  }
}
