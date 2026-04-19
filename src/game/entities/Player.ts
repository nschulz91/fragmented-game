import Phaser from 'phaser'
import { playerStats } from '../content/tuning'

type EnemyLike = Phaser.Physics.Arcade.Sprite & { receiveDamage: (amount: number) => void; applySlow?: (durationMs: number) => void }

export class Player extends Phaser.Physics.Arcade.Sprite {
  health = playerStats.maxHealth
  maxHealth = playerStats.maxHealth
  lastSlashAt = -9999
  lastPulseAt = -9999
  lastDamageAt = -9999
  facing = new Phaser.Math.Vector2(1, 0)

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'charlie')
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCircle(20)
    this.setCollideWorldBounds(true)
    this.setDepth(20)
  }

  move(vector: Phaser.Math.Vector2) {
    if (vector.lengthSq() > 0.01) {
      vector.normalize()
      this.facing.copy(vector)
      this.setVelocity(vector.x * playerStats.moveSpeed, vector.y * playerStats.moveSpeed)
    } else {
      this.setVelocity(0, 0)
    }
  }

  canSlash(now: number) {
    return now - this.lastSlashAt >= playerStats.slashCooldownMs
  }

  slash(now: number, enemies: EnemyLike[], onHit?: () => void) {
    if (!this.canSlash(now)) return false
    this.lastSlashAt = now

    let hit = false
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const direction = new Phaser.Math.Vector2(enemy.x - this.x, enemy.y - this.y)
      const distance = direction.length()
      if (distance > playerStats.slashRange) continue
      direction.normalize()
      const facingDot = Phaser.Math.Clamp(this.facing.dot(direction), -1, 1)
      if (facingDot < 0.15) continue
      enemy.receiveDamage(playerStats.slashDamage)
      hit = true
    }

    if (hit) onHit?.()
    return true
  }

  canPulse(now: number) {
    return now - this.lastPulseAt >= playerStats.pulseCooldownMs
  }

  pulse(now: number, enemies: EnemyLike[], onHit?: () => void) {
    if (!this.canPulse(now)) return false
    this.lastPulseAt = now

    for (const enemy of enemies) {
      if (!enemy.active) continue
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (distance > playerStats.pulseRange) continue
      enemy.receiveDamage(playerStats.pulseDamage)
      enemy.applySlow?.(1800)
    }

    onHit?.()
    return true
  }

  receiveDamage(amount: number, now: number) {
    if (now - this.lastDamageAt < playerStats.invulnerabilityMs) return false
    this.lastDamageAt = now
    this.health = Math.max(0, this.health - amount)
    return true
  }
}
