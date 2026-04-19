import Phaser from 'phaser'
import { bossStats } from '../content/tuning'

export class Boss extends Phaser.Physics.Arcade.Sprite {
  health = bossStats.maxHealth
  maxHealth = bossStats.maxHealth
  touchDamage = bossStats.touchDamage
  moveSpeed = bossStats.speed
  phase = 1
  stateLabel = 'hunt'
  private slowUntil = 0
  private stunUntil = 0
  private nextVolleyAt = 0
  private nextBurstAt = 0
  private nextDashAt = 0
  private stateUntil = 0
  private attackAngle = 0
  private readonly telegraph: Phaser.GameObjects.Graphics
  private readonly enemyProjectiles: Phaser.Physics.Arcade.Group

  constructor(scene: Phaser.Scene, x: number, y: number, enemyProjectiles: Phaser.Physics.Arcade.Group) {
    super(scene, x, y, 'warden')
    this.enemyProjectiles = enemyProjectiles
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCircle(34)
    this.setDepth(24)
    this.setTint(0xffd089)
    this.telegraph = scene.add.graphics().setDepth(13)
  }

  update(now: number, player: Phaser.GameObjects.Sprite) {
    this.telegraph.clear()
    if (!this.body) return

    if (now < this.stunUntil) {
      this.stateLabel = 'stunned'
      this.setVelocity(0, 0)
      return
    }

    const body = this.body as Phaser.Physics.Arcade.Body
    const distance = Phaser.Math.Distance.Between(this.x, this.y, player.x, player.y)
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const speedScale = now < this.slowUntil ? 0.6 : 1

    if (this.stateLabel === 'burst-charge') {
      this.setVelocity(0, 0)
      this.telegraph.lineStyle(5, 0xffc17f, 0.8)
      this.telegraph.strokeCircle(this.x, this.y, 110)
      if (now >= this.stateUntil) {
        this.fireRadialBurst(now)
        this.stateLabel = 'hunt'
        this.nextBurstAt = now + (this.phase === 3 ? 2500 : 3600)
      }
      return
    }

    if (this.stateLabel === 'dash-charge') {
      this.setVelocity(0, 0)
      this.telegraph.lineStyle(5, 0xff9155, 0.85)
      this.telegraph.strokeLineShape(new Phaser.Geom.Line(this.x, this.y, this.x + Math.cos(this.attackAngle) * 170, this.y + Math.sin(this.attackAngle) * 170))
      if (now >= this.stateUntil) {
        this.stateLabel = 'dash'
        this.stateUntil = now + 260
        this.scene.physics.velocityFromRotation(this.attackAngle, 360, body.velocity)
      }
      return
    }

    if (this.stateLabel === 'dash') {
      if (now >= this.stateUntil) {
        this.stateLabel = 'hunt'
        this.setVelocity(0, 0)
        this.nextDashAt = now + 3200
      }
      return
    }

    const desiredSpeed = distance > 165 ? this.moveSpeed * speedScale : this.moveSpeed * 0.3 * speedScale
    this.scene.physics.velocityFromRotation(angle, desiredSpeed, body.velocity)
    this.stateLabel = 'hunt'

    if (now >= this.nextVolleyAt) {
      this.nextVolleyAt = now + (this.phase === 1 ? 1200 : this.phase === 2 ? 980 : 760)
      this.fireVolley(now, angle)
    }

    if (this.phase >= 2 && now >= this.nextBurstAt) {
      this.stateLabel = 'burst-charge'
      this.stateUntil = now + 620
      this.setVelocity(0, 0)
      return
    }

    if (this.phase >= 3 && now >= this.nextDashAt) {
      this.stateLabel = 'dash-charge'
      this.stateUntil = now + 480
      this.attackAngle = angle
      this.setVelocity(0, 0)
    }
  }

  enterPhase(phase: number) {
    this.phase = phase
    this.stateLabel = 'phase-shift'
    this.nextBurstAt = this.scene.time.now + 700
    if (phase === 3) this.nextDashAt = this.scene.time.now + 1800
  }

  private fireVolley(now: number, angle: number) {
    const spread = this.phase === 1 ? [-0.12, 0, 0.12] : this.phase === 2 ? [-0.22, -0.06, 0.06, 0.22] : [-0.28, -0.14, 0, 0.14, 0.28]
    spread.forEach((delta) => {
      const bolt = this.enemyProjectiles.create(this.x, this.y, 'boss-bolt') as Phaser.Physics.Arcade.Image
      bolt.setDepth(16)
      bolt.setTint(this.phase === 3 ? 0xff7f52 : 0xffa45b)
      bolt.setCircle(8)
      this.scene.physics.velocityFromRotation(angle + delta, 220 + this.phase * 25, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
      bolt.setData('damage', bossStats.projectileDamage + (this.phase === 3 ? 2 : 0))
      bolt.setData('expiresAt', now + 3200)
      bolt.setData('parryable', true)
    })
  }

  private fireRadialBurst(now: number) {
    for (let index = 0; index < 12; index += 1) {
      const angle = (Math.PI * 2 * index) / 12
      const bolt = this.enemyProjectiles.create(this.x, this.y, 'boss-bolt') as Phaser.Physics.Arcade.Image
      bolt.setDepth(16)
      bolt.setTint(0xffd17d)
      bolt.setCircle(8)
      this.scene.physics.velocityFromRotation(angle, 180 + this.phase * 14, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
      bolt.setData('damage', bossStats.projectileDamage)
      bolt.setData('expiresAt', now + 3000)
      bolt.setData('parryable', true)
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

  stun(durationMs: number) {
    this.stunUntil = Math.max(this.stunUntil, this.scene.time.now + durationMs)
  }

  destroy(fromScene?: boolean) {
    this.telegraph.destroy()
    return super.destroy(fromScene)
  }
}

