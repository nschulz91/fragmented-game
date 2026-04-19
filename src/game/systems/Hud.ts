import Phaser from 'phaser'

export class Hud {
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly waveText: Phaser.GameObjects.Text
  private readonly healthText: Phaser.GameObjects.Text
  private readonly pulseText: Phaser.GameObjects.Text
  private readonly objectiveText: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(100)
    this.waveText = scene.add.text(20, 18, '', { fontFamily: 'Georgia', fontSize: '18px', color: '#f8e9c4' }).setScrollFactor(0).setDepth(101)
    this.healthText = scene.add.text(20, 72, '', { fontFamily: 'Georgia', fontSize: '15px', color: '#ffffff' }).setScrollFactor(0).setDepth(101)
    this.pulseText = scene.add.text(20, 94, '', { fontFamily: 'Georgia', fontSize: '15px', color: '#d5f4ff' }).setScrollFactor(0).setDepth(101)
    this.objectiveText = scene.add.text(690, 18, '', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#d8ebe4',
      align: 'right',
      wordWrap: { width: 240 },
    }).setOrigin(1, 0).setScrollFactor(0).setDepth(101)
  }

  render(playerHealth: number, playerMaxHealth: number, pulseReady: boolean, label: string, objective: string) {
    this.graphics.clear()
    this.graphics.fillStyle(0x041014, 0.85)
    this.graphics.fillRoundedRect(14, 14, 250, 92, 18)
    this.graphics.lineStyle(2, 0xd6c28e, 0.25)
    this.graphics.strokeRoundedRect(14, 14, 250, 92, 18)

    const ratio = Phaser.Math.Clamp(playerHealth / playerMaxHealth, 0, 1)
    this.graphics.fillStyle(0x211111, 0.9)
    this.graphics.fillRoundedRect(20, 48, 190, 16, 8)
    this.graphics.fillStyle(ratio > 0.4 ? 0xf27059 : 0xe64b3c, 1)
    this.graphics.fillRoundedRect(20, 48, 190 * ratio, 16, 8)

    this.waveText.setText(label)
    this.healthText.setText(`Health ${Math.ceil(playerHealth)} / ${playerMaxHealth}`)
    this.pulseText.setText(pulseReady ? 'Time pulse: ready' : 'Time pulse: charging')
    this.objectiveText.setText(objective)
  }

  destroy() {
    this.graphics.destroy()
    this.waveText.destroy()
    this.healthText.destroy()
    this.pulseText.destroy()
    this.objectiveText.destroy()
  }
}
