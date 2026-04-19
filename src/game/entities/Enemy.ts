import Phaser from 'phaser'
import { minionStats } from '../content/tuning'

export type MinionKind = keyof typeof minionStats

export class Enemy extends Phaser.Physics.Arcade.Sprite {
  readonly kind: MinionKind
  health: number
  maxHealth: number
  touchDamage: number
  moveSpeed: number
  stateLabel = 'advance'
  private slowUntil = 0
  private stunUntil = 0
  private nextAttackAt = 0
  private stateUntil = 0
  private attackAngle = 0
  private readonly telegraph: Phaser.GameObjects.Graphics
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
    this.telegraph = scene.add.graphics().setDepth(12)
  }

  update(now: number, player: Phaser.GameObjects.Sprite) {
    this.telegraph.clear()
    if (!this.body) return

    if (now < this.stunUntil) {
      this.stateLabel = 'stunned'
      this.setVelocity(0, 0)
      this.telegraph.lineStyle(3, 0xbdf3ff, 0.7)
      this.telegraph.strokeCircle(this.x, this.y, 28)
      return
    }

    if (this.kind === 'shade') this.updateShade(now, player)
    if (this.kind === 'cultist') this.updateCultist(now, player)
    if (this.kind === 'brute') this.updateBrute(now, player)
    if (this.kind === 'embermage') this.updateEmbermage(now, player)
    if (this.kind === 'ashhound') this.updateAshhound(now, player)
  }

  private updateShade(now: number, player: Phaser.GameObjects.Sprite) {
    const body = this.body as Phaser.Physics.Arcade.Body
    const toPlayer = new Phaser.Math.Vector2(player.x - this.x, player.y - this.y)
    const distance = toPlayer.length()
    const slowScale = now < this.slowUntil ? 0.45 : 1

    if (this.stateLabel === 'lunge') {
      if (now >= this.stateUntil) {
        this.stateLabel = 'recover'
        this.stateUntil = now + 260
        this.setVelocity(0, 0)
      } else {
        return
      }
    }

    if (this.stateLabel === 'telegraph') {
      this.setVelocity(0, 0)
      this.telegraph.lineStyle(3, 0x9fa2ff, 0.85)
      this.telegraph.strokeLineShape(new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(this.attackAngle) * 96, this.y + Math.sin(this.attackAngle) * 96))
      this.telegraph.lineStyle(2, 0xffffff, 0.35)
      this.telegraph.strokeCircle(this.x, this.y, 26)
      if (now >= this.stateUntil) {
        this.stateLabel = 'lunge'
        this.stateUntil = now + 240
        this.scene.physics.velocityFromRotation(this.attackAngle, 340, body.velocity)
      }
      return
    }

    if (this.stateLabel === 'recover' && now < this.stateUntil) {
      this.setVelocity(0, 0)
      return
    }

    const side = Math.sin(now * 0.004 + this.x * 0.01) > 0 ? 1 : -1
    const flankTarget = new Phaser.Math.Vector2(player.x, player.y).add(toPlayer.normalizeRightHand().scale(side * 72))
    const angle = Phaser.Math.Angle.Between(this.x, this.y, flankTarget.x, flankTarget.y)
    this.scene.physics.velocityFromRotation(angle, this.moveSpeed * slowScale, body.velocity)
    this.stateLabel = 'advance'

    if (distance < 160 && now >= this.nextAttackAt) {
      this.nextAttackAt = now + 1650
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 340
      this.attackAngle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
      this.setVelocity(0, 0)
    }
  }

  private updateCultist(now: number, player: Phaser.GameObjects.Sprite) {
    const body = this.body as Phaser.Physics.Arcade.Body
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const slowScale = now < this.slowUntil ? 0.45 : 1

    if (this.stateLabel === 'telegraph') {
      this.setVelocity(0, 0)
      this.telegraph.fillStyle(0xf2a4ff, 0.18)
      this.telegraph.fillCircle(this.x, this.y, 30)
      this.telegraph.lineStyle(3, 0xf8d3ff, 0.8)
      this.telegraph.strokeCircle(this.x, this.y, 32)
      if (now >= this.stateUntil) {
        this.stateLabel = 'cast'
        this.nextAttackAt = now + 1800
        const spread = [-0.18, 0, 0.18]
        spread.forEach((delta) => {
          const bolt = this.enemyProjectiles.create(this.x, this.y, 'enemy-bolt') as Phaser.Physics.Arcade.Image
          bolt.setDepth(14)
          bolt.setTint(0xf4b3ff)
          bolt.setCircle(6)
          this.scene.physics.velocityFromRotation(angle + delta, 210, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
          bolt.setData('damage', 10)
          bolt.setData('expiresAt', now + 3400)
          bolt.setData('parryable', true)
        })
      }
      return
    }

    const desired =
      distance > 240 ? this.moveSpeed * slowScale : distance < 170 ? -this.moveSpeed * 0.65 * slowScale : 0
    this.scene.physics.velocityFromRotation(angle, desired, body.velocity)
    this.stateLabel = 'position'

    if (distance < 320 && now >= this.nextAttackAt) {
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 520
      this.setVelocity(0, 0)
    }
  }

  private updateBrute(now: number, player: Phaser.GameObjects.Sprite) {
    const body = this.body as Phaser.Physics.Arcade.Body
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const slowScale = now < this.slowUntil ? 0.5 : 1

    if (this.stateLabel === 'charge') {
      this.telegraph.lineStyle(4, 0xff8a58, 0.55)
      this.telegraph.strokeLineShape(new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(this.attackAngle) * 80, this.y + Math.sin(this.attackAngle) * 80))
      if (now >= this.stateUntil) {
        this.stateLabel = 'recover'
        this.stateUntil = now + 240
        this.setVelocity(0, 0)
      }
      return
    }

    if (this.stateLabel === 'telegraph') {
      this.setVelocity(0, 0)
      this.telegraph.fillStyle(0xff7842, 0.12)
      this.telegraph.fillCircle(this.x + Math.cos(this.attackAngle) * 70, this.y + Math.sin(this.attackAngle) * 70, 38)
      this.telegraph.lineStyle(3, 0xffb58b, 0.85)
      this.telegraph.strokeCircle(this.x + Math.cos(this.attackAngle) * 70, this.y + Math.sin(this.attackAngle) * 70, 42)
      if (now >= this.stateUntil) {
        this.stateLabel = 'charge'
        this.stateUntil = now + 360
        this.scene.physics.velocityFromRotation(this.attackAngle, 300, body.velocity)
      }
      return
    }

    if (this.stateLabel === 'recover' && now < this.stateUntil) {
      this.setVelocity(0, 0)
      return
    }

    this.scene.physics.velocityFromRotation(angle, this.moveSpeed * slowScale, body.velocity)
    this.stateLabel = 'advance'

    if (distance < 260 && now >= this.nextAttackAt) {
      this.nextAttackAt = now + 2200
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 620
      this.attackAngle = angle
      this.setVelocity(0, 0)
    }
  }

  private updateEmbermage(now: number, player: Phaser.GameObjects.Sprite) {
    const body = this.body as Phaser.Physics.Arcade.Body
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const slowScale = now < this.slowUntil ? 0.45 : 1

    if (this.stateLabel === 'telegraph') {
      this.setVelocity(0, 0)
      this.telegraph.fillStyle(0xff8a5d, 0.14)
      this.telegraph.fillCircle(player.x, player.y, 46)
      this.telegraph.lineStyle(3, 0xffca82, 0.82)
      this.telegraph.strokeCircle(player.x, player.y, 52)
      if (now >= this.stateUntil) {
        this.stateLabel = 'cast'
        this.nextAttackAt = now + 2100
        const bolt = this.enemyProjectiles.create(this.x, this.y, 'ember-bolt') as Phaser.Physics.Arcade.Image
        bolt.setDepth(14)
        bolt.setTint(0xffb46c)
        bolt.setCircle(7)
        this.scene.physics.velocityFromRotation(angle, 240, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
        bolt.setData('damage', 12)
        bolt.setData('expiresAt', now + 3000)
        bolt.setData('parryable', true)
      }
      return
    }

    const desired = distance > 260 ? this.moveSpeed * slowScale : distance < 180 ? -this.moveSpeed * 0.58 * slowScale : 0
    this.scene.physics.velocityFromRotation(angle, desired, body.velocity)
    this.stateLabel = 'position'

    if (distance < 360 && now >= this.nextAttackAt) {
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 680
      this.setVelocity(0, 0)
    }
  }

  private updateAshhound(now: number, player: Phaser.GameObjects.Sprite) {
    const body = this.body as Phaser.Physics.Arcade.Body
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const slowScale = now < this.slowUntil ? 0.5 : 1

    if (this.stateLabel === 'pounce') {
      if (now >= this.stateUntil) {
        this.stateLabel = 'recover'
        this.stateUntil = now + 220
        this.setVelocity(0, 0)
      }
      return
    }

    if (this.stateLabel === 'telegraph') {
      this.setVelocity(0, 0)
      this.telegraph.lineStyle(3, 0xffe4ab, 0.8)
      this.telegraph.strokeCircle(this.x, this.y, 26)
      this.telegraph.lineStyle(3, 0xffb061, 0.7)
      this.telegraph.strokeLineShape(new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(this.attackAngle) * 120, this.y + Math.sin(this.attackAngle) * 120))
      if (now >= this.stateUntil) {
        this.stateLabel = 'pounce'
        this.stateUntil = now + 260
        this.scene.physics.velocityFromRotation(this.attackAngle, 360, body.velocity)
      }
      return
    }

    if (this.stateLabel === 'recover' && now < this.stateUntil) {
      this.setVelocity(0, 0)
      return
    }

    this.scene.physics.velocityFromRotation(angle, this.moveSpeed * slowScale, body.velocity)
    this.stateLabel = 'hunt'

    if (distance < 220 && now >= this.nextAttackAt) {
      this.nextAttackAt = now + 1600
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 260
      this.attackAngle = angle
      this.setVelocity(0, 0)
    }
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

  stun(durationMs: number) {
    this.stunUntil = Math.max(this.stunUntil, this.scene.time.now + durationMs)
  }

  destroy(fromScene?: boolean) {
    this.telegraph.destroy()
    return super.destroy(fromScene)
  }
}
