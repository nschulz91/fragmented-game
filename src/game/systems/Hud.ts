import Phaser from 'phaser'

export class Hud {
  private readonly graphics: Phaser.GameObjects.Graphics
  private readonly texts: Record<string, Phaser.GameObjects.Text>

  constructor(scene: Phaser.Scene) {
    this.graphics = scene.add.graphics().setScrollFactor(0).setDepth(100)
    this.texts = {
      wave: scene.add.text(18, 14, '', { fontFamily: 'Georgia', fontSize: '16px', color: '#f8e9c4' }).setScrollFactor(0).setDepth(101),
      health: scene.add.text(18, 60, '', { fontFamily: 'Georgia', fontSize: '14px', color: '#ffffff' }).setScrollFactor(0).setDepth(101),
      ability: scene.add.text(18, 80, '', { fontFamily: 'Georgia', fontSize: '13px', color: '#d5f4ff' }).setScrollFactor(0).setDepth(101),
      perk: scene.add.text(18, 98, '', { fontFamily: 'Georgia', fontSize: '13px', color: '#f4ddac' }).setScrollFactor(0).setDepth(101),
      objective: scene.add.text(730, 14, '', {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: '#d8ebe4',
        align: 'right',
        wordWrap: { width: 214 },
      }).setOrigin(1, 0).setScrollFactor(0).setDepth(101),
      boss: scene.add.text(482, 14, '', {
        fontFamily: 'Georgia',
        fontSize: '15px',
        color: '#ffd6a8',
      }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101),
    }
  }

  render(input: {
    playerHealth: number
    playerMaxHealth: number
    slashReady: boolean
    dashReady: boolean
    parryReady: boolean
    pulseReady: boolean
    chargeReady?: boolean
    shieldCharges: number
    label: string
    objective: string
    buffLabel: string
    perkLabel: string
    bossHealthRatio?: number
    bossPhase?: number
  }) {
    this.graphics.clear()
    this.graphics.fillStyle(0x041014, 0.72)
    this.graphics.fillRoundedRect(10, 10, 264, 108, 16)
    this.graphics.lineStyle(2, 0xd6c28e, 0.18)
    this.graphics.strokeRoundedRect(10, 10, 264, 108, 16)

    const ratio = Phaser.Math.Clamp(input.playerHealth / input.playerMaxHealth, 0, 1)
    this.graphics.fillStyle(0x211111, 0.9)
    this.graphics.fillRoundedRect(18, 40, 184, 14, 7)
    this.graphics.fillStyle(ratio > 0.4 ? 0xf27059 : 0xe64b3c, 1)
    this.graphics.fillRoundedRect(18, 40, 184 * ratio, 14, 7)

    if (input.bossHealthRatio !== undefined) {
      this.graphics.fillStyle(0x251611, 0.9)
      this.graphics.fillRoundedRect(316, 16, 328, 12, 7)
      this.graphics.fillStyle(0xff934f, 1)
      this.graphics.fillRoundedRect(316, 16, 328 * Phaser.Math.Clamp(input.bossHealthRatio, 0, 1), 12, 7)
    }

    this.texts.wave.setText(input.label)
    this.texts.health.setText(`Health ${Math.ceil(input.playerHealth)} / ${input.playerMaxHealth}   Shields ${input.shieldCharges}`)
    this.texts.ability.setText(
      `Slash ${input.slashReady ? 'ready' : 'cd'}   Dash ${input.dashReady ? 'ready' : 'cd'}   Parry ${input.parryReady ? 'ready' : 'cd'}   Pulse ${input.pulseReady ? 'ready' : 'cd'}   Charge ${input.chargeReady ? 'ready' : 'cd'}`
    )
    this.texts.perk.setText(`${input.buffLabel}   |   ${input.perkLabel}`)
    this.texts.objective.setText(input.objective)
    this.texts.boss.setText(input.bossHealthRatio !== undefined ? `Warden phase ${input.bossPhase}` : '')
  }

  destroy() {
    this.graphics.destroy()
    Object.values(this.texts).forEach((text) => text.destroy())
  }
}
