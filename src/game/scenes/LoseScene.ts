import Phaser from 'phaser'
import { loseSummary } from '../content/gameText'
import { setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'

export class LoseScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key

  constructor() {
    super('lose')
  }

  create() {
    setStatusText('Charlie was forced out of the breach.')
    setObjectiveText('Restart from the last stable checkpoint.')
    setLoreText(loseSummary)

    this.add.rectangle(480, 270, 960, 540, 0x12080b, 0.9)
    this.add.text(480, 140, 'Charlie Fell', {
      fontFamily: 'Georgia',
      fontSize: '44px',
      color: '#ffd0c9',
    }).setOrigin(0.5)

    this.add.text(480, 256, loseSummary, {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f3e7e4',
      align: 'center',
      wordWrap: { width: 720 },
      lineSpacing: 10,
    }).setOrigin(0.5)

    this.add.text(480, 432, 'Press Enter to restart the breach', {
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
