import Phaser from 'phaser'
import { introLines } from '../content/gameText'
import { setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'

export class MenuScene extends Phaser.Scene {
  private startKey?: Phaser.Input.Keyboard.Key

  constructor() {
    super('menu')
  }

  create() {
    setStatusText('Menu ready. Enter starts the hunt.')
    setObjectiveText('Enter Lake Pixor and survive two waves before the warden arrives.')
    setLoreText(introLines.join(' '))

    this.add.rectangle(480, 270, 960, 540, 0x071318, 0.6)
    this.add.text(480, 140, 'Fragmented', {
      fontFamily: 'Georgia',
      fontSize: '48px',
      color: '#fff1ca',
    }).setOrigin(0.5)

    this.add.text(480, 218, 'Lake Pixor combat sandbox', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#bfd3d8',
    }).setOrigin(0.5)

    introLines.forEach((line, index) => {
      this.add.text(480, 292 + index * 74, line, {
        fontFamily: 'Georgia',
        fontSize: '20px',
        color: '#ebf3ee',
        align: 'center',
        wordWrap: { width: 700 },
      }).setOrigin(0.5)
    })

    this.add.text(480, 500, 'Press Enter for mission brief', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f4c972',
    }).setOrigin(0.5)

    this.startKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.input.once('pointerdown', () => {
      this.scene.start('instructions')
    })
  }

  update() {
    if (this.startKey && Phaser.Input.Keyboard.JustDown(this.startKey)) {
      this.scene.start('instructions')
    }
  }
}
