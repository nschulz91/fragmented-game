import Phaser from 'phaser'
import { instructionLines } from '../content/gameText'
import { setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'

export class InstructionScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key

  constructor() {
    super('instructions')
  }

  create() {
    setStatusText('Briefing active. Enter deploys Charlie.')
    setObjectiveText('Clear wave one, clear wave two, defeat the warden, then hold the line.')
    setLoreText(
      'Lake Pixor is polluted by Shadow Court residue. Charlie can weaponize time, but the arena is designed to grind him down before the castle.'
    )

    this.add.rectangle(480, 270, 960, 540, 0x0b1820, 0.72)
    this.add.text(480, 98, 'Mission Brief', {
      fontFamily: 'Georgia',
      fontSize: '40px',
      color: '#fff4d3',
    }).setOrigin(0.5)

    this.add.text(480, 218, instructionLines.join('\n\n'), {
      fontFamily: 'Georgia',
      fontSize: '21px',
      color: '#e1ece8',
      align: 'center',
      wordWrap: { width: 720 },
      lineSpacing: 10,
    }).setOrigin(0.5)

    this.add.text(480, 394, 'Recommended pattern: keep moving, slash minions, pulse when the pack closes.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#c7dfdf',
      align: 'center',
      wordWrap: { width: 760 },
    }).setOrigin(0.5)

    this.add.text(480, 472, 'Press Enter to breach the arena', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f4c972',
    }).setOrigin(0.5)

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.input.once('pointerdown', () => {
      this.scene.start('game')
    })
  }

  update() {
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start('game')
    }
  }
}
