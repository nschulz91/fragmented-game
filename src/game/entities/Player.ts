import Phaser from 'phaser'
import { playerStats } from '../content/tuning'
import type { BuffId, FactionVariantId, PerkId, RelicId } from '../state'

type EnemyLike = Phaser.Physics.Arcade.Sprite & {
  receiveDamage: (amount: number) => void
  applySlow?: (durationMs: number) => void
  stun?: (durationMs: number) => void
}

export class Player extends Phaser.Physics.Arcade.Sprite {
  health = playerStats.maxHealth
  maxHealth = playerStats.maxHealth
  moveSpeed = playerStats.moveSpeed
  jumpVelocity = playerStats.jumpVelocity
  pulseCooldownMs = playerStats.pulseCooldownMs
  dashCooldownMs = playerStats.dashCooldownMs
  dashDistance = playerStats.dashDistance
  parryWindowMs = playerStats.parryWindowMs
  chargeCooldownMs = playerStats.chargeCooldownMs
  chargeRadius = playerStats.chargeRadius
  chargeDamage = playerStats.chargeDamage
  chargeTimeMs = playerStats.chargeTimeMs
  lastSlashAt = -9999
  lastPulseAt = -9999
  lastDamageAt = -9999
  lastDashAt = -9999
  dashUntil = -9999
  lastParryAt = -9999
  parryUntil = -9999
  lastChargeAt = -9999
  chargeStartedAt = -9999
  facing = new Phaser.Math.Vector2(1, 0)
  shieldCharges = 0
  damageBoostUntil = 0
  successfulParryAt = -9999
  private actionLockUntil = 0
  private deathHandled = false
  private wasGrounded = true
  readonly shieldOrb: Phaser.GameObjects.Image
  readonly relicOrb: Phaser.GameObjects.Image
  readonly activeRelics: RelicId[]

  constructor(
    scene: Phaser.Scene,
    x: number,
    y: number,
    buff: BuffId | null,
    perk: PerkId | null,
    relics: RelicId[] = [],
    factionVariant: FactionVariantId = 'house-veyra'
  ) {
    super(scene, x, y, 'charlie-sheet', 0)
    this.activeRelics = [...relics]
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setScale(0.4)
    this.setSize(56, 108)
    this.setOffset(82, 198)
    this.setCollideWorldBounds(true)
    this.setDepth(30)
    this.shieldOrb = scene.add.image(x, y - 54, 'shield').setAlpha(0).setDepth(36).setScale(0.55)
    this.relicOrb = scene.add.image(x, y - 2, 'relic-core').setAlpha(relics.length > 0 ? 0.46 : 0).setDepth(36).setScale(0.42)
    this.applyLoadout(buff, perk, factionVariant)
    this.applyRelics(relics)
    this.play('charlie-idle')
  }

  private applyLoadout(buff: BuffId | null, perk: PerkId | null, factionVariant: FactionVariantId) {
    if (buff === 'time-thread') this.pulseCooldownMs = 2800
    if (buff === 'iron-blood') {
      this.maxHealth = 150
      this.health = 140
    }
    if (buff === 'rift-step') {
      this.dashCooldownMs = 900
      this.dashDistance = 154
    }
    if (perk === 'house-veyra') this.shieldCharges = 1
    if (perk === 'order-of-glass') this.parryWindowMs = 320

    if (factionVariant === 'house-veyra') {
      this.maxHealth += 10
      this.health += 10
      this.shieldCharges += 1
    }
    if (factionVariant === 'order-of-glass') {
      this.parryWindowMs += 40
      this.chargeCooldownMs -= 250
    }
    if (factionVariant === 'pixor-scouts') {
      this.moveSpeed += 24
      this.dashDistance += 18
    }
  }

  private applyRelics(relics: RelicId[]) {
    if (relics.includes('wardens-heart')) {
      this.maxHealth += 18
      this.health += 18
    }
    if (relics.includes('glass-lens')) {
      this.pulseCooldownMs = Math.max(2200, this.pulseCooldownMs - 450)
      this.chargeRadius += 24
    }
    if (relics.includes('scout-feather')) {
      this.moveSpeed += 16
      this.dashDistance += 22
    }
    if (relics.includes('ember-idol')) {
      this.chargeDamage += 14
    }
  }

  move(horizontal: number) {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (!body) return
    if (this.isDashing()) return
    if (Math.abs(horizontal) > 0.08) {
      const direction = Math.sign(horizontal)
      this.facing.set(direction, 0)
      this.setFlipX(direction < 0)
      body.setVelocityX(direction * this.moveSpeed)
      if (this.isGrounded() && !this.isCharging()) this.playLoop('charlie-run')
    } else {
      body.setVelocityX(Phaser.Math.Linear(body.velocity.x, 0, 0.2))
      if (this.isGrounded() && !this.isCharging()) this.playLoop('charlie-idle')
    }
  }

  jump() {
    const body = this.body as Phaser.Physics.Arcade.Body
    if (!body) return false
    if (!body.blocked.down && !body.touching.down) return false
    body.setVelocityY(-this.jumpVelocity)
    this.wasGrounded = false
    this.playLoop('charlie-jump')
    return true
  }

  isGrounded() {
    const body = this.body as Phaser.Physics.Arcade.Body
    return Boolean(body?.blocked.down || body?.touching.down)
  }

  isDashing() {
    return this.scene.time.now < this.dashUntil
  }

  isParrying() {
    return this.scene.time.now < this.parryUntil
  }

  isCharging(now = this.scene.time.now) {
    return this.chargeStartedAt > 0 && now - this.chargeStartedAt < this.chargeTimeMs + 900
  }

  canSlash(now: number) {
    return now - this.lastSlashAt >= playerStats.slashCooldownMs
  }

  slash(now: number, enemies: EnemyLike[], onHit?: () => void) {
    if (!this.canSlash(now)) return false
    this.lastSlashAt = now
    this.playAction('charlie-slash', 180)

    let hit = false
    const damage = this.getAttackDamage(playerStats.slashDamage)
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const dx = enemy.x - this.x
      const dy = Math.abs(enemy.y - this.y)
      if (Math.abs(dx) > playerStats.slashRange || dy > 70) continue
      if (Math.sign(dx || 1) !== Math.sign(this.facing.x || 1)) continue
      enemy.receiveDamage(damage)
      hit = true
    }

    if (hit) onHit?.()
    return true
  }

  canPulse(now: number) {
    return now - this.lastPulseAt >= this.pulseCooldownMs
  }

  pulse(now: number, enemies: EnemyLike[], onHit?: () => void) {
    if (!this.canPulse(now)) return false
    this.lastPulseAt = now
    this.playAction('charlie-pulse', 220)

    const damage = this.getAttackDamage(playerStats.pulseDamage)
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (distance > this.chargeRadius + 62) continue
      enemy.receiveDamage(damage)
      enemy.applySlow?.(1800)
    }

    onHit?.()
    return true
  }

  canDash(now: number) {
    return now - this.lastDashAt >= this.dashCooldownMs
  }

  dash(now: number, direction: number) {
    if (!this.canDash(now)) return false
    this.lastDashAt = now
    this.dashUntil = now + playerStats.dashDurationMs
    const body = this.body as Phaser.Physics.Arcade.Body
    const horizontal = Math.abs(direction) > 0.08 ? Math.sign(direction) : Math.sign(this.facing.x || 1)
    this.facing.set(horizontal, 0)
    this.setFlipX(horizontal < 0)
    body.setVelocityX(horizontal * (this.dashDistance / (playerStats.dashDurationMs / 1000)))
    if (!this.isGrounded()) body.setVelocityY(Math.min(body.velocity.y, -80))
    this.playAction('charlie-dash', 180)
    return true
  }

  canParry(now: number) {
    return now - this.lastParryAt >= playerStats.parryCooldownMs
  }

  parry(now: number) {
    if (!this.canParry(now)) return false
    this.lastParryAt = now
    this.parryUntil = now + this.parryWindowMs
    this.playAction('charlie-parry', 180)
    return true
  }

  canCharge(now: number) {
    return now - this.lastChargeAt >= this.chargeCooldownMs
  }

  startCharge(now: number) {
    if (!this.canCharge(now) || this.isCharging(now)) return false
    this.chargeStartedAt = now
    this.playAction('charlie-charge-start', 140)
    return true
  }

  releaseCharge(now: number, enemies: EnemyLike[]) {
    if (!this.isCharging(now)) return { triggered: false, detonated: false }
    const heldFor = now - this.chargeStartedAt
    this.chargeStartedAt = -9999
    if (heldFor < this.chargeTimeMs) {
      return { triggered: true, detonated: false }
    }

    this.lastChargeAt = now
    this.playAction('charlie-charge-release', 220)
    const damage = this.getAttackDamage(this.chargeDamage)
    let hit = false
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const distance = Phaser.Math.Distance.Between(this.x, this.y, enemy.x, enemy.y)
      if (distance > this.chargeRadius) continue
      enemy.receiveDamage(damage)
      enemy.stun?.(420)
      hit = true
    }
    return { triggered: true, detonated: true || hit }
  }

  handleParrySuccess(target?: EnemyLike) {
    this.successfulParryAt = this.scene.time.now
    target?.stun?.(this.parryWindowMs + 220)
  }

  grantShield() {
    this.shieldCharges += 1
  }

  activateDamageBoost(now: number, durationMs: number) {
    this.damageBoostUntil = Math.max(this.damageBoostUntil, now + durationMs)
  }

  restoreAfterChapterClear() {
    if (this.activeRelics.includes('wardens-heart')) {
      this.health = Math.min(this.maxHealth, this.health + 24)
    }
  }

  receiveDamage(amount: number, now: number) {
    if (this.isDashing()) return false
    if (now - this.lastDamageAt < playerStats.invulnerabilityMs) return false
    if (this.shieldCharges > 0) {
      this.shieldCharges -= 1
      this.lastDamageAt = now
      return false
    }
    this.lastDamageAt = now
    this.health = Math.max(0, this.health - amount)
    if (this.health <= 0) {
      this.deathHandled = true
      this.playAction('charlie-death', 1200)
    } else {
      this.playAction('charlie-hit', 260)
    }
    return true
  }

  updateState(now: number) {
    const body = this.body as Phaser.Physics.Arcade.Body
    const grounded = this.isGrounded()
    if (this.shieldCharges > 0) {
      this.shieldOrb.setPosition(this.x, this.y - 54).setAlpha(0.72)
      this.shieldOrb.rotation += 0.05
    } else {
      this.shieldOrb.setAlpha(0)
    }
    if (this.activeRelics.length > 0) {
      this.relicOrb.setPosition(this.x, this.y - 4).setAlpha(0.46)
      this.relicOrb.rotation -= 0.04
    } else {
      this.relicOrb.setAlpha(0)
    }

    if (this.isCharging(now) && now >= this.chargeStartedAt + 140 && !this.deathHandled && !this.isDashing()) {
      if (this.anims.currentAnim?.key !== 'charlie-charge-hold') {
        this.play('charlie-charge-hold', true)
      }
      this.actionLockUntil = Math.max(this.actionLockUntil, now + 70)
    }

    if (now > this.dashUntil && body) {
      if (Math.abs(body.velocity.x) > this.moveSpeed && !this.isDashing()) {
        body.setVelocityX(Phaser.Math.Linear(body.velocity.x, Math.sign(body.velocity.x) * this.moveSpeed, 0.18))
      }
    }
    if (grounded && !this.wasGrounded && !this.deathHandled && !this.isDashing() && !this.isCharging(now)) {
      this.playAction('charlie-land', 140)
    }
    if (!this.isDashing() && !this.isCharging(now) && now >= this.actionLockUntil && !this.deathHandled) {
      if (grounded) {
        if (Math.abs(body?.velocity.x ?? 0) > 18) this.playLoop('charlie-run')
        else this.playLoop('charlie-idle')
      } else {
        this.playLoop((body?.velocity.y ?? 0) < 0 ? 'charlie-jump' : 'charlie-fall')
      }
    }
    this.wasGrounded = grounded
  }

  private getAttackDamage(base: number) {
    return this.scene.time.now < this.damageBoostUntil ? Math.round(base * 1.35) : base
  }

  private playAction(key: string, durationMs: number) {
    this.actionLockUntil = this.scene.time.now + durationMs
    this.play(key, true)
  }

  private playLoop(key: string) {
    if (this.scene.time.now < this.actionLockUntil) return
    if (this.anims.currentAnim?.key !== key) this.play(key, true)
  }
}
