import Phaser from 'phaser'
import { winSummary } from '../content/gameText'
import { setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'

export class WinScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key

  constructor() {
    super('win')
  }

  create() {
    setStatusText('Victory confirmed.')
    setObjectiveText('Lake Pixor is clear. The path to the Shadow Castle remains.')
    setLoreText(winSummary)

    this.add.rectangle(480, 270, 960, 540, 0x071117, 0.86)
    this.add.text(480, 138, 'Lake Pixor Held', {
      fontFamily: 'Georgia',
      fontSize: '44px',
      color: '#fff1be',
    }).setOrigin(0.5)

    this.add.text(480, 254, winSummary, {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#e4f4ed',
      align: 'center',
      wordWrap: { width: 720 },
      lineSpacing: 10,
    }).setOrigin(0.5)

    this.add.text(480, 432, 'Press Enter to run the breach again', {
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
