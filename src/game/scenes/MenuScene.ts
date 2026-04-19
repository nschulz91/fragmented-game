import Phaser from 'phaser'
import { menuLore } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { createRunState } from '../state'
import { setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'

const menuOptions = ['Play', 'How to Play', 'Settings'] as const

export class MenuScene extends Phaser.Scene {
  private cursor = 0
  private readonly pad = new GamepadState()
  private entries: Phaser.GameObjects.Text[] = []
  private startKey?: Phaser.Input.Keyboard.Key
  private keys!: Record<'UP' | 'DOWN' | 'ENTER', Phaser.Input.Keyboard.Key>

  constructor() {
    super('menu')
  }

  create() {
    const runState = createRunState(this.registry.get('runState')?.seed ?? 'pixor-v2-default')
    this.registry.set('runState', runState)
    this.registry.set('renderState', {
      mode: 'menu',
      coordinateSystem: 'origin=(0,0) top-left, +x right, +y down',
      encounter: {
        seed: runState.seed,
        wave: 1,
        checkpointUnlocked: false,
        selectedBuff: null,
        selectedPerk: null,
      },
    })

    setStatusText('Menu ready. Choose play, instructions, or settings.')
    setObjectiveText('Prepare for a three-wave breach, a checkpoint upgrade choice, and a three-phase boss.')
    setLoreText(menuLore.join(' '))
    audioDirector.playTrack('menu')

    this.keys = this.input.keyboard!.addKeys('UP,DOWN,ENTER') as MenuScene['keys']
    this.startKey = this.keys.ENTER

    this.add.rectangle(480, 270, 960, 540, 0x061015, 0.7)
    this.add.text(480, 88, 'Fragmented', {
      fontFamily: 'Georgia',
      fontSize: '52px',
      color: '#fff1ca',
    }).setOrigin(0.5)

    this.add.text(480, 154, 'Lake Pixor Trial', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#bfd3d8',
    }).setOrigin(0.5)

    this.add.text(480, 252, menuLore.join('\n\n'), {
      fontFamily: 'Georgia',
      fontSize: '19px',
      color: '#ebf3ee',
      align: 'center',
      wordWrap: { width: 700 },
      lineSpacing: 10,
    }).setOrigin(0.5)

    menuOptions.forEach((label, index) => {
      const text = this.add.text(480, 404 + index * 38, label, {
        fontFamily: 'Georgia',
        fontSize: '26px',
        color: '#d8e8e2',
      }).setOrigin(0.5)
      text.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.cursor = index
        this.confirm()
      })
      this.entries.push(text)
    })

    this.render()
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (Phaser.Input.Keyboard.JustDown(this.keys.UP) || this.pad.justPressed(GamepadButtons.DpadUp)) {
      this.cursor = Phaser.Math.Wrap(this.cursor - 1, 0, menuOptions.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.DOWN) || this.pad.justPressed(GamepadButtons.DpadDown)) {
      this.cursor = Phaser.Math.Wrap(this.cursor + 1, 0, menuOptions.length)
      this.render()
    }
    if (this.startKey && Phaser.Input.Keyboard.JustDown(this.startKey)) this.confirm()
    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) this.confirm()
  }

  private confirm() {
    const selected = menuOptions[this.cursor]
    if (selected === 'Play' || selected === 'How to Play') {
      this.scene.start('instructions')
    } else {
      this.scene.start('settings', { from: 'menu' })
    }
  }

  private render() {
    this.entries.forEach((entry, index) => {
      const active = index === this.cursor
      entry.setText(`${active ? '› ' : ''}${menuOptions[index]}`).setColor(active ? '#f5c978' : '#d8e8e2')
    })
  }
}
