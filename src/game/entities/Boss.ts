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
  private attackDirection = 1
  private isDying = false
  private readonly telegraph: Phaser.GameObjects.Graphics
  private readonly enemyProjectiles: Phaser.Physics.Arcade.Group

  constructor(scene: Phaser.Scene, x: number, y: number, enemyProjectiles: Phaser.Physics.Arcade.Group) {
    super(scene, x, y, 'warden-sheet', 0)
    this.enemyProjectiles = enemyProjectiles
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setScale(0.68)
    this.setSize(92, 132)
    this.setOffset(96, 214)
    this.setDepth(28)
    this.telegraph = scene.add.graphics().setDepth(17)
    this.play('warden-idle')
  }

  update(now: number, player: Phaser.GameObjects.Sprite) {
    this.telegraph.clear()
    const body = this.body as Phaser.Physics.Arcade.Body | undefined
    if (!body) return
    if (this.isDying) return

    if (now < this.stunUntil) {
      this.stateLabel = 'stunned'
      body.setVelocityX(0)
      this.playState('hit')
      return
    }

    const dx = player.x - this.x
    const dy = player.y - this.y
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const speedScale = now < this.slowUntil ? 0.6 : 1
    this.setFlipX(dx > 0)

    if (this.stateLabel === 'burst-charge') {
      body.setVelocityX(0)
      this.telegraph.lineStyle(5, 0xffc17f, 0.8)
      this.telegraph.strokeCircle(this.x, this.y - 18, 110)
      this.playState('cast')
      if (now >= this.stateUntil) {
        this.fireRadialBurst(now)
        this.stateLabel = 'hunt'
        this.nextBurstAt = now + (this.phase === 3 ? 2500 : 3600)
      }
      return
    }

    if (this.stateLabel === 'dash-charge') {
      body.setVelocityX(0)
      this.telegraph.lineStyle(5, 0xff9155, 0.85)
      this.telegraph.strokeLineShape(new Phaser.Geom.Line(this.x, this.y - 20, this.x + this.attackDirection * 200, this.y - 20))
      this.playState('cast')
      if (now >= this.stateUntil) {
        this.stateLabel = 'dash'
        this.stateUntil = now + 260
        body.setVelocityX(this.attackDirection * 420)
      }
      return
    }

    if (this.stateLabel === 'dash') {
      this.playState('dash')
      if (now >= this.stateUntil) {
        this.stateLabel = 'hunt'
        body.setVelocityX(0)
        this.nextDashAt = now + 3200
      }
      return
    }

    const desiredSpeed = Math.abs(dx) > 185 ? Math.sign(dx || 1) * this.moveSpeed * speedScale : Math.sign(dx || 1) * this.moveSpeed * 0.35 * speedScale
    body.setVelocityX(desiredSpeed)
    if (Math.abs(dy) > 120 && body.blocked.down) body.setVelocityY(-400)
    this.stateLabel = 'hunt'
    this.playState(Math.abs(body.velocity.x) > 18 ? 'move' : 'idle')

    if (now >= this.nextVolleyAt) {
      this.nextVolleyAt = now + (this.phase === 1 ? 1200 : this.phase === 2 ? 980 : 760)
      this.playState('cast')
      this.fireVolley(now, angle)
    }

    if (this.phase >= 2 && now >= this.nextBurstAt) {
      this.stateLabel = 'burst-charge'
      this.stateUntil = now + 620
      body.setVelocityX(0)
      return
    }

    if (this.phase >= 3 && now >= this.nextDashAt) {
      this.stateLabel = 'dash-charge'
      this.stateUntil = now + 480
      this.attackDirection = Math.sign(dx || 1)
      body.setVelocityX(0)
    }
  }

  enterPhase(phase: number) {
    this.phase = phase
    this.stateLabel = 'phase-shift'
    this.nextBurstAt = this.scene.time.now + 700
    if (phase === 3) this.nextDashAt = this.scene.time.now + 1800
    this.playState('phase')
  }

  private fireVolley(now: number, angle: number) {
    const spread = this.phase === 1 ? [-0.12, 0, 0.12] : this.phase === 2 ? [-0.22, -0.06, 0.06, 0.22] : [-0.28, -0.14, 0, 0.14, 0.28]
    spread.forEach((delta) => {
      const bolt = this.enemyProjectiles.create(this.x, this.y - 26, 'boss-bolt') as Phaser.Physics.Arcade.Image
      bolt.setDepth(18)
      bolt.setTint(this.phase === 3 ? 0xff7f52 : 0xffa45b)
      bolt.setScale(1.15)
      this.scene.physics.velocityFromRotation(angle + delta, 220 + this.phase * 25, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
      bolt.setData('damage', bossStats.projectileDamage + (this.phase === 3 ? 2 : 0))
      bolt.setData('expiresAt', now + 3200)
      bolt.setData('parryable', true)
    })
  }

  private fireRadialBurst(now: number) {
    for (let index = 0; index < 10; index += 1) {
      const angle = -Math.PI + (Math.PI * index) / 9
      const bolt = this.enemyProjectiles.create(this.x, this.y - 18, 'boss-bolt') as Phaser.Physics.Arcade.Image
      bolt.setDepth(18)
      bolt.setTint(0xffd17d)
      this.scene.physics.velocityFromRotation(angle, 180 + this.phase * 14, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
      bolt.setData('damage', bossStats.projectileDamage)
      bolt.setData('expiresAt', now + 3000)
      bolt.setData('parryable', true)
    }
  }

  receiveDamage(amount: number) {
    if (this.isDying) return
    this.health = Math.max(0, this.health - amount)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.3,
      yoyo: true,
      duration: 90,
    })
    if (this.health <= 0) {
      this.isDying = true
      const body = this.body as Phaser.Physics.Arcade.Body | undefined
      body?.setVelocity(0, 0)
      if (body) body.enable = false
      this.playState('death')
      this.scene.time.delayedCall(420, () => this.destroy())
      return
    }
    this.playState('hit')
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

  private playState(state: 'idle' | 'move' | 'cast' | 'dash' | 'phase' | 'hit' | 'death') {
    const key = `warden-${state}`
    if (this.anims.currentAnim?.key !== key) this.play(key, true)
  }
}
