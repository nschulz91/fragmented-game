import Phaser from 'phaser'
import { minionStats } from '../content/tuning'

export type MinionKind = keyof typeof minionStats

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: MinionKind
  health: number
  maxHealth: number
  touchDamage: number
  moveSpeed: number
  private slowUntil = 0
  private nextActionAt = 0
  readonly enemyProjectiles: Phaser.Physics.Arcade.Group

  constructor(scene: Phaser.Scene, x: number, y: number, kind: MinionKind, enemyProjectiles: Phaser.Physics.Arcade.Group) {
    super(scene, x, y, kind)
    this.kind = kind
    this.enemyProjectiles = enemyProjectiles
    const stats = minionStats[kind]
    this.health = stats.health
    this.maxHealth = stats.health
    this.touchDamage = stats.touchDamage
    this.moveSpeed = stats.speed

    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCircle(kind === 'brute' ? 24 : 18)
    this.setTint(stats.tint)
    this.setDepth(18)
  }

  update(now: number, player: Phaser.GameObjects.Sprite) {
    if (!this.body) return
    const slowScale = now < this.slowUntil ? 0.45 : 1
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const speed = this.moveSpeed * slowScale

    if (this.kind === 'cultist') {
      const desired = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y) > 210 ? speed : speed * 0.2
      this.scene.physics.velocityFromRotation(angle, desired, (this.body as Phaser.Physics.Arcade.Body).velocity)
      if (now >= this.nextActionAt) {
        this.nextActionAt = now + 1600
        const bolt = this.enemyProjectiles.create(this.x, this.y, 'enemy-bolt') as Phaser.Physics.Arcade.Image
        bolt.setDepth(14)
        bolt.setTint(0xf4b3ff)
        bolt.setCircle(6)
        this.scene.physics.velocityFromRotation(angle, 180, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
        bolt.setData('damage', 10)
        bolt.setData('expiresAt', now + 3200)
      }
      return
    }

    if (this.kind === 'brute') {
      if (now >= this.nextActionAt) {
        this.nextActionAt = now + 1900
        this.scene.physics.velocityFromRotation(angle, speed * 2.8, (this.body as Phaser.Physics.Arcade.Body).velocity)
      } else if (now > this.nextActionAt - 1200) {
        this.setVelocity(0, 0)
      }
      return
    }

    this.scene.physics.velocityFromRotation(angle, speed, (this.body as Phaser.Physics.Arcade.Body).velocity)
  }

  receiveDamage(amount: number) {
    this.health = Math.max(0, this.health - amount)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      yoyo: true,
      duration: 80,
    })
    if (this.health <= 0) {
      this.destroy()
    }
  }

  applySlow(durationMs: number) {
    this.slowUntil = Math.max(this.slowUntil, this.scene.time.now + durationMs)
  }
}
