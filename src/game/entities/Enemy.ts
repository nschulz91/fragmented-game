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
  private isDying = false
  private readonly telegraph: Phaser.GameObjects.Graphics
  readonly enemyProjectiles: Phaser.Physics.Arcade.Group

  constructor(scene: Phaser.Scene, x: number, y: number, kind: MinionKind, enemyProjectiles: Phaser.Physics.Arcade.Group) {
    super(scene, x, y, `${kind}-sheet`, 0)
    this.kind = kind
    this.enemyProjectiles = enemyProjectiles
    const stats = minionStats[kind]
    this.health = stats.health
    this.maxHealth = stats.health
    this.touchDamage = stats.touchDamage
    this.moveSpeed = stats.speed

    scene.add.existing(this)
    scene.physics.add.existing(this)
    if (kind === 'shade') this.setScale(0.62)
    if (kind === 'cultist') this.setScale(0.66)
    if (kind === 'brute') this.setScale(0.54)
    if (kind === 'embermage') this.setScale(0.7)
    if (kind === 'ashhound') this.setScale(0.56)
    if (kind === 'shade') {
      this.setSize(46, 92)
      this.setOffset(67, 156)
    } else if (kind === 'cultist') {
      this.setSize(44, 88)
      this.setOffset(66, 150)
    } else if (kind === 'brute') {
      this.setSize(72, 118)
      this.setOffset(76, 194)
    } else if (kind === 'embermage') {
      this.setSize(44, 88)
      this.setOffset(60, 150)
    } else {
      this.setSize(94, 42)
      this.setOffset(72, 112)
    }
    this.setDepth(24)
    this.telegraph = scene.add.graphics().setDepth(16)
    this.play(`${this.kind}-idle`)
  }

  update(now: number, player: Phaser.GameObjects.Sprite) {
    this.telegraph.clear()
    const body = this.body as Phaser.Physics.Arcade.Body | undefined
    if (!body) return
    if (this.isDying) return

    if (now < this.stunUntil) {
      this.stateLabel = 'stunned'
      body.setVelocityX(0)
      this.drawMarker(0xbdf3ff)
      this.playState('hit')
      return
    }

    if (this.kind === 'shade') this.updateShade(now, player, body)
    if (this.kind === 'cultist') this.updateCultist(now, player, body)
    if (this.kind === 'brute') this.updateBrute(now, player, body)
    if (this.kind === 'embermage') this.updateEmbermage(now, player, body)
    if (this.kind === 'ashhound') this.updateAshhound(now, player, body)

    if (body.velocity.x !== 0) this.setFlipX(body.velocity.x > 0)
  }

  private updateShade(now: number, player: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) {
    const dx = player.x - this.x
    const dy = Math.abs(player.y - this.y)
    const slowScale = now < this.slowUntil ? 0.45 : 1

    if (this.stateLabel === 'lunge') {
      this.playState('attack')
      if (now >= this.stateUntil) {
        this.stateLabel = 'recover'
        this.stateUntil = now + 220
        body.setVelocityX(0)
      }
      return
    }

    if (this.stateLabel === 'telegraph') {
      body.setVelocityX(0)
      this.drawLineTelegraph(Math.sign(dx || 1), 108, 0x9fa2ff)
      this.playState('telegraph')
      if (now >= this.stateUntil) {
        this.stateLabel = 'lunge'
        this.stateUntil = now + 210
        body.setVelocityX(Math.sign(dx || 1) * 340)
      }
      return
    }

    if (this.stateLabel === 'recover' && now < this.stateUntil) return

    body.setVelocityX(Math.sign(dx || 1) * this.moveSpeed * slowScale)
    this.stateLabel = 'advance'
    this.playState('move')

    if (Math.abs(dx) < 170 && dy < 84 && now >= this.nextAttackAt) {
      this.nextAttackAt = now + 1500
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 320
      body.setVelocityX(0)
    }
  }

  private updateCultist(now: number, player: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) {
    const dx = player.x - this.x
    const dy = player.y - this.y
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const slowScale = now < this.slowUntil ? 0.45 : 1

    if (this.stateLabel === 'telegraph') {
      body.setVelocityX(0)
      this.drawMarker(0xf1b7ff, player.x, player.y, 30)
      this.playState('telegraph')
      if (now >= this.stateUntil) {
        this.stateLabel = 'cast'
        this.nextAttackAt = now + 1800
        ;[-0.15, 0, 0.15].forEach((delta) => this.fireBolt('enemy-bolt', angle + delta, 215, 10, now))
      }
      return
    }

    const desired = Math.abs(dx) > 280 ? Math.sign(dx) * this.moveSpeed * slowScale : Math.abs(dx) < 170 ? -Math.sign(dx) * this.moveSpeed * 0.7 * slowScale : 0
    body.setVelocityX(desired)
    if (Math.abs(dy) > 90 && body.blocked.down) body.setVelocityY(-420)
    this.stateLabel = 'position'
    this.playState('move')

    if (Math.abs(dx) < 360 && Math.abs(dy) < 180 && now >= this.nextAttackAt) {
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 520
      body.setVelocityX(0)
    }
  }

  private updateBrute(now: number, player: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) {
    const dx = player.x - this.x
    const dy = Math.abs(player.y - this.y)
    const slowScale = now < this.slowUntil ? 0.55 : 1

    if (this.stateLabel === 'charge') {
      this.drawLineTelegraph(Math.sign(this.attackAngle || 1), 112, 0xff9155)
      this.playState('attack')
      if (now >= this.stateUntil) {
        this.stateLabel = 'recover'
        this.stateUntil = now + 260
        body.setVelocityX(0)
      }
      return
    }

    if (this.stateLabel === 'telegraph') {
      body.setVelocityX(0)
      this.drawMarker(0xffb58b, this.x + Math.sign(this.attackAngle || 1) * 72, this.y, 42)
      this.playState('telegraph')
      if (now >= this.stateUntil) {
        this.stateLabel = 'charge'
        this.stateUntil = now + 360
        body.setVelocityX(Math.sign(this.attackAngle || 1) * 320)
      }
      return
    }

    if (this.stateLabel === 'recover' && now < this.stateUntil) return

    body.setVelocityX(Math.sign(dx || 1) * this.moveSpeed * slowScale)
    this.stateLabel = 'advance'
    this.playState('move')

    if (Math.abs(dx) < 250 && dy < 80 && now >= this.nextAttackAt) {
      this.nextAttackAt = now + 2100
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 580
      this.attackAngle = Math.sign(dx || 1)
      body.setVelocityX(0)
    }
  }

  private updateEmbermage(now: number, player: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) {
    const dx = player.x - this.x
    const dy = player.y - this.y
    const angle = Phaser.Math.Angle.Between(this.x, this.y, player.x, player.y)
    const slowScale = now < this.slowUntil ? 0.45 : 1

    if (this.stateLabel === 'telegraph') {
      body.setVelocityX(0)
      this.drawMarker(0xffca82, player.x, player.y, 46)
      this.playState('telegraph')
      if (now >= this.stateUntil) {
        this.stateLabel = 'cast'
        this.nextAttackAt = now + 2100
        this.fireBolt('ember-bolt', angle, 250, 12, now)
      }
      return
    }

    const desired = Math.abs(dx) > 280 ? Math.sign(dx) * this.moveSpeed * slowScale : Math.abs(dx) < 190 ? -Math.sign(dx) * this.moveSpeed * 0.6 * slowScale : 0
    body.setVelocityX(desired)
    if (Math.abs(dy) > 100 && body.blocked.down) body.setVelocityY(-430)
    this.stateLabel = 'position'
    this.playState('move')

    if (Math.abs(dx) < 390 && Math.abs(dy) < 210 && now >= this.nextAttackAt) {
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 660
      body.setVelocityX(0)
    }
  }

  private updateAshhound(now: number, player: Phaser.GameObjects.Sprite, body: Phaser.Physics.Arcade.Body) {
    const dx = player.x - this.x
    const dy = Math.abs(player.y - this.y)
    const slowScale = now < this.slowUntil ? 0.5 : 1

    if (this.stateLabel === 'pounce') {
      this.playState('attack')
      if (now >= this.stateUntil) {
        this.stateLabel = 'recover'
        this.stateUntil = now + 220
        body.setVelocityX(0)
      }
      return
    }

    if (this.stateLabel === 'telegraph') {
      body.setVelocityX(0)
      this.drawLineTelegraph(Math.sign(dx || 1), 136, 0xffb061)
      this.playState('telegraph')
      if (now >= this.stateUntil) {
        this.stateLabel = 'pounce'
        this.stateUntil = now + 260
        body.setVelocityX(Math.sign(dx || 1) * 330)
        if (body.blocked.down) body.setVelocityY(-320)
      }
      return
    }

    if (this.stateLabel === 'recover' && now < this.stateUntil) return

    body.setVelocityX(Math.sign(dx || 1) * this.moveSpeed * slowScale)
    this.stateLabel = 'hunt'
    this.playState('move')

    if (Math.abs(dx) < 220 && dy < 90 && now >= this.nextAttackAt) {
      this.nextAttackAt = now + 1600
      this.stateLabel = 'telegraph'
      this.stateUntil = now + 240
      body.setVelocityX(0)
    }
  }

  receiveDamage(amount: number) {
    if (this.isDying) return
    this.health = Math.max(0, this.health - amount)
    this.scene.tweens.add({
      targets: this,
      alpha: 0.35,
      yoyo: true,
      duration: 80,
    })
    if (this.health <= 0) {
      this.isDying = true
      const body = this.body as Phaser.Physics.Arcade.Body | undefined
      body?.setVelocity(0, 0)
      if (body) body.enable = false
      this.playState('death')
      this.telegraph.clear()
      this.setActive(false)
      this.scene.time.delayedCall(180, () => this.destroy())
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

  private fireBolt(key: string, angle: number, speed: number, damage: number, now: number) {
    const bolt = this.enemyProjectiles.create(this.x, this.y - 14, key) as Phaser.Physics.Arcade.Image
    bolt.setDepth(18)
    bolt.setScale(key === 'ember-bolt' ? 1.2 : 1)
    this.scene.physics.velocityFromRotation(angle, speed, (bolt.body as Phaser.Physics.Arcade.Body).velocity)
    bolt.setData('damage', damage)
    bolt.setData('expiresAt', now + 3400)
    bolt.setData('parryable', true)
  }

  private drawMarker(color: number, x = this.x, y = this.y, radius = 26) {
    this.telegraph.lineStyle(3, color, 0.82)
    this.telegraph.strokeCircle(x, y, radius)
  }

  private drawLineTelegraph(direction: number, length: number, color: number) {
    this.telegraph.lineStyle(4, color, 0.82)
    this.telegraph.strokeLineShape(new Phaser.Geom.Line(this.x, this.y - 10, this.x + direction * length, this.y - 10))
  }

  private playState(state: 'idle' | 'move' | 'telegraph' | 'attack' | 'hit' | 'death') {
    const key = `${this.kind}-${state}`
    if (this.anims.currentAnim?.key !== key) this.play(key, true)
  }
}
