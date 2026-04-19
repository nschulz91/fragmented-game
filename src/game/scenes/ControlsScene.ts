import Phaser from 'phaser'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { renderControlsPanel } from '../systems/ControlsPanel'

export class ControlsScene extends Phaser.Scene {
  private readonly pad = new GamepadState()
  private keys!: Record<'ENTER' | 'ESC', Phaser.Input.Keyboard.Key>
  private returnMode: 'pause' | 'menu' = 'menu'

  constructor() {
    super('controls')
  }

  init(data?: { returnMode?: 'pause' | 'menu' }) {
    this.returnMode = data?.returnMode ?? 'menu'
  }

  create() {
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'controls',
      overlay: 'controls',
    })
    this.keys = this.input.keyboard!.addKeys('ENTER,ESC') as ControlsScene['keys']
    this.add.rectangle(480, 270, 960, 540, 0x010508, 0.72)
    renderControlsPanel(this, {
      x: 480,
      y: 270,
      width: 780,
      height: 420,
      title: this.returnMode === 'pause' ? 'Paused: Controls Layout' : 'Controls Layout',
      inputMode: (this.registry.get('inputMode') ?? 'keyboard') as 'keyboard' | 'controller',
    })
    this.add.text(480, 496, 'Press Enter, Esc, or the south button to close.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#dbe6e1',
    }).setOrigin(0.5)
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
      Phaser.Input.Keyboard.JustDown(this.keys.ESC) ||
      this.pad.justPressed(GamepadButtons.South) ||
      this.pad.justPressed(GamepadButtons.Start)
    ) {
      this.close()
    }
  }

  private close() {
    if (this.returnMode === 'pause') {
      this.scene.resume('pause')
    } else {
      this.scene.resume('menu')
    }
    this.scene.stop()
  }
}
