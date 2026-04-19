import Phaser from 'phaser'
import { buffCatalog, perkCatalog, type BuffId, type PerkId } from '../state'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'

const buffOrder: BuffId[] = ['time-thread', 'iron-blood', 'rift-step']
const perkOrder: PerkId[] = ['house-veyra', 'order-of-glass', 'pixor-scouts']

export class CheckpointScene extends Phaser.Scene {
  private step: 'buff' | 'perk' | 'ready' = 'buff'
  private cursor = 0
  private readonly pad = new GamepadState()
  private entries: Phaser.GameObjects.Text[] = []
  private keys!: Record<'UP' | 'DOWN' | 'ENTER' | 'ESC', Phaser.Input.Keyboard.Key>

  constructor() {
    super('checkpoint')
  }

  create() {
    setStatusText('Checkpoint stabilized.')
    setObjectiveText('Take one run buff and one faction support perk before the boss breach.')
    setLoreText('House Veyra, the Order of Glass, and the Pixor Scouts all left one useful advantage near the lake.')
    this.keys = this.input.keyboard!.addKeys('UP,DOWN,ENTER,ESC') as CheckpointScene['keys']
    this.add.rectangle(480, 270, 960, 540, 0x071015, 0.93)
    this.drawFrame()
    this.render()
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (Phaser.Input.Keyboard.JustDown(this.keys.UP) || this.pad.justPressed(GamepadButtons.DpadUp)) {
      this.move(-1)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.DOWN) || this.pad.justPressed(GamepadButtons.DpadDown)) {
      this.move(1)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) {
      this.confirm()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC) && this.step === 'ready') {
      this.finish()
    }
  }

  private drawFrame() {
    this.add.text(480, 84, 'Checkpoint', { fontFamily: 'Georgia', fontSize: '40px', color: '#fff0cc' }).setOrigin(0.5)
    this.add.text(480, 126, 'Choose one run buff, then one faction support perk.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d5dfda',
    }).setOrigin(0.5)

    for (let index = 0; index < 3; index += 1) {
      const text = this.add.text(480, 206 + index * 78, '', {
        fontFamily: 'Georgia',
        fontSize: '24px',
        color: '#d8e8e2',
        align: 'center',
        wordWrap: { width: 640 },
      }).setOrigin(0.5)
      this.entries.push(text)
    }

    this.add.text(480, 468, 'Enter confirms. Esc proceeds once all selections are locked.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d5dfda',
      align: 'center',
    }).setOrigin(0.5)
  }

  private move(direction: -1 | 1) {
    const count = this.step === 'buff' ? buffOrder.length : this.step === 'perk' ? perkOrder.length : 1
    this.cursor = Phaser.Math.Wrap(this.cursor + direction, 0, count)
    this.render()
  }

  private confirm() {
    const runState = this.registry.get('runState')
    if (this.step === 'buff') {
      runState.selectedBuff = buffOrder[this.cursor]
      this.registry.set('runState', runState)
      this.step = 'perk'
      this.cursor = 0
      this.render()
      return
    }
    if (this.step === 'perk') {
      runState.selectedPerk = perkOrder[this.cursor]
      this.registry.set('runState', runState)
      this.step = 'ready'
      this.cursor = 0
      this.render()
      return
    }
    this.finish()
  }

  private finish() {
    this.scene.stop()
    this.scene.launch('boss-intro')
  }

  private render() {
    const runState = this.registry.get('runState')
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'checkpoint',
      encounter: {
        seed: runState.seed,
        wave: runState.currentWave,
        checkpointUnlocked: runState.checkpoint.unlocked,
        selectedBuff: runState.selectedBuff,
        selectedPerk: runState.selectedPerk,
      },
      objective:
        this.step === 'buff'
          ? 'Choose one run buff.'
          : this.step === 'perk'
            ? 'Choose one faction support perk.'
            : 'Selections locked. Proceed to the boss intercept.',
    })

    if (this.step === 'buff') {
      this.entries.forEach((entry, index) => {
        const buff = buffCatalog[buffOrder[index]]
        const active = index === this.cursor
        entry.setText(`${active ? '› ' : ''}${buff.name}\n${buff.description}`).setColor(active ? '#f5c978' : '#d8e8e2')
      })
      return
    }
    if (this.step === 'perk') {
      this.entries.forEach((entry, index) => {
        const perk = perkCatalog[perkOrder[index]]
        const active = index === this.cursor
        entry.setText(`${active ? '› ' : ''}${perk.faction}\n${perk.description}`).setColor(active ? '#f5c978' : '#d8e8e2')
      })
      return
    }

    this.entries[0].setText(`Run buff: ${buffCatalog[runState.selectedBuff as BuffId].name}`).setColor('#f5c978')
    this.entries[1].setText(`Faction support: ${perkCatalog[runState.selectedPerk as PerkId].name}`).setColor('#d8e8e2')
    this.entries[2].setText('Enter or Esc to begin the boss dialogue card.').setColor('#d8e8e2')
  }
}
