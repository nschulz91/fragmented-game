import Phaser from 'phaser'
import { bossStats } from '../content/tuning'

export class Boss extends Phaser.Physics.Arcade.Sprite {
  health = bossStats.maxHealth
  maxHealth = bossStats.maxHealth
  touchDamage = bossStats.touchDamage
  moveSpeed = bossStats.speed
  private slowUntil = 0
  private nextShotAt = 0
  private triggeredThresholds = new Set<number>()
  private readonly enemyProjectiles: Phaser.Physics.Arcade.Group

  constructor(scene: Phaser.Scene, x: number, y: number, enemyProjectiles: Phaser.Physics.Arcade.Group) {
    super(scene, x, y, 'warden')
    this.enemyProjectiles = enemyProjectiles
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCircle(30)
    this.setDepth(24)
    this.setTint(0xffd089)
  }

  update(now: number, player: Phaser.GameObjects.Sprite) {
    if (!this.body) return
    const speedScale = now < this.slowUntil ? 0.55 : 1
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const desiredSpeed = distance > 170 ? this.moveSpeed * speedScale : this.moveSpeed * 0.35 * speedScale
    this.scene.physics.velocityFromRotation(angle, desiredSpeed, (this.body as Phaser.Physics.Arcade.Body).velocity)

    if (now >= this.nextShotAt) {
      this.nextShotAt = now + (this.health / this.maxHealth < 0.5 ? 820 : 1300)
      const spread = this.health / this.maxHealth < 0.5 ? [-0.22, 0, 0.22] : [0]
      spread.forEach((delta) => {
        const bolt = this.enemyProjectiles.create(this.x, this.y, 'boss-bolt') as Phaser.Physics.Arcade.Image
        bolt.setDepth(16)
        bolt.setTint(0xffa45b)
        bolt.setCircle(8)
        this.scene.physics.velocityFromRotation(angle + delta, 220, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
        bolt.setData('damage', bossStats.projectileDamage)
        bolt.setData('expiresAt', now + 3200)
      })
    }
  }

  receiveDamage(amount: number) {
    this.health = Math.max(0, this.health - amount)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      yoyo: true,
      duration: 90,
    })
    if (this.health <= 0) {
      this.destroy()
    }
  }

  applySlow(durationMs: number) {
    this.slowUntil = Math.max(this.slowUntil, this.scene.time.now + durationMs)
  }

  consumeTriggeredThresholds() {
    const ratio = this.health / this.maxHealth
    const hits = bossStats.summonThresholds.filter((threshold) => ratio <= threshold && !this.triggeredThresholds.has(threshold))
    hits.forEach((threshold) => this.triggeredThresholds.add(threshold))
    return hits.length
  }
}
