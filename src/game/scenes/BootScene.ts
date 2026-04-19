import Phaser from 'phaser'
import { setControlsText, setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'
import { audioDirector } from '../systems/AudioDirector'
import { createRunState, defaultSettings, getSeedFromLocation } from '../state'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create() {
    this.buildTextures()

    const settings = this.registry.get('settings') ?? { ...defaultSettings }
    this.registry.set('settings', settings)
    this.registry.set('runState', createRunState(getSeedFromLocation()))
    this.registry.set('renderState', {
      mode: 'menu',
      coordinateSystem: 'origin=(0,0) top-left, +x right, +y down',
      encounter: {
        seed: getSeedFromLocation(),
        wave: 1,
        checkpointUnlocked: false,
        selectedBuff: null,
        selectedPerk: null,
      },
    })
    audioDirector.configure(() => this.registry.get('settings'))
    setStatusText('Assets forged. Start the Lake Pixor trial.')
    setObjectiveText('Choose play, review controls, or tune audio before the breach.')
    setLoreText('Parxillia is holding three quiet allies at the edge of Lake Pixor.')
    setControlsText([
      'Move: WASD / arrows / left stick',
      'Slash: Space / south button',
      'Pulse: Q / west button',
      'Dash: Shift / east button',
      'Parry: E / north button',
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
      const scene = this.scene.get('game') as unknown as { manualAdvance?: (ms: number) => void } | undefined
      scene?.manualAdvance?.(ms)
    }

    this.scene.start('menu')
  }

  private buildTextures() {
    this.makeCircleTexture('charlie', 24, 0xf2d39b, 0x5f1931)
    this.makeCircleTexture('shade', 18, 0x7869ff, 0x281c5e)
    this.makeCircleTexture('cultist', 18, 0xd6a7ff, 0x59306b)
    this.makeCircleTexture('brute', 24, 0xc06c3d, 0x5e2c16)
    this.makeCircleTexture('warden', 34, 0xffca80, 0x6f300f)
    this.makeCircleTexture('enemy-bolt', 8, 0xf4d7ff, 0x8e3bb4)
    this.makeCircleTexture('boss-bolt', 10, 0xffb366, 0xa14612)
    this.makeCircleTexture('shield', 12, 0xbdf3ff, 0x3d7da0)
    this.makeRingTexture('pulse-ring', 148, 0xbdefff)
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
}
