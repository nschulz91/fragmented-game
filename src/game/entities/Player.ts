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
    super(scene, x, y, 'charlie')
    this.activeRelics = [...relics]
    scene.add.existing(this)
    scene.physics.add.existing(this)
    this.setCircle(20)
    this.setCollideWorldBounds(true)
    this.setDepth(20)
    this.shieldOrb = scene.add.image(x, y - 30, 'shield').setAlpha(0).setDepth(26)
    this.relicOrb = scene.add.image(x, y + 28, 'relic-core').setAlpha(relics.length > 0 ? 0.46 : 0).setDepth(26)
    this.applyLoadout(buff, perk, factionVariant)
    this.applyRelics(relics)
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

  move(vector: Phaser.Math.Vector2) {
    if (this.isDashing()) return
    if (vector.lengthSq() > 0.01) {
      vector.normalize()
      this.facing.copy(vector)
      this.setVelocity(vector.x * this.moveSpeed, vector.y * this.moveSpeed)
    } else {
      this.setVelocity(0, 0)
    }
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

    let hit = false
    const damage = this.getAttackDamage(playerStats.slashDamage)
    for (const enemy of enemies) {
      if (!enemy.active) continue
      const direction = new Phaser.Math.Vector2(enemy.x - this.x, enemy.y - this.y)
      const distance = direction.length()
      if (distance > playerStats.slashRange) continue
      direction.normalize()
      if (this.facing.dot(direction) < 0.08) continue
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

  dash(now: number, direction: Phaser.Math.Vector2) {
    if (!this.canDash(now)) return false
    this.lastDashAt = now
    this.dashUntil = now + playerStats.dashDurationMs
    const vector = direction.lengthSq() > 0.01 ? direction.clone().normalize() : this.facing.clone().normalize()
    this.facing.copy(vector)
    this.setVelocity(
      vector.x * (this.dashDistance / (playerStats.dashDurationMs / 1000)),
      vector.y * (this.dashDistance / (playerStats.dashDurationMs / 1000))
    )
    return true
  }

  canParry(now: number) {
    return now - this.lastParryAt >= playerStats.parryCooldownMs
  }

  parry(now: number) {
    if (!this.canParry(now)) return false
    this.lastParryAt = now
    this.parryUntil = now + this.parryWindowMs
    return true
  }

  canCharge(now: number) {
    return now - this.lastChargeAt >= this.chargeCooldownMs
  }

  startCharge(now: number) {
    if (!this.canCharge(now) || this.isCharging(now)) return false
    this.chargeStartedAt = now
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
    return { triggered: true, detonated: hit || true }
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
    return true
  }

  updateState(now: number) {
    if (this.shieldCharges > 0) {
      this.shieldOrb.setPosition(this.x, this.y - 30).setAlpha(0.7)
      this.shieldOrb.rotation += 0.05
    } else {
      this.shieldOrb.setAlpha(0)
    }
    if (this.activeRelics.length > 0) {
      this.relicOrb.setPosition(this.x, this.y + 28).setAlpha(0.44)
      this.relicOrb.rotation -= 0.04
    } else {
      this.relicOrb.setAlpha(0)
    }
    if (!this.isDashing() && !this.body?.blocked.none) {
      this.setVelocity((this.body as Phaser.Physics.Arcade.Body).velocity.x * 0.8, (this.body as Phaser.Physics.Arcade.Body).velocity.y * 0.8)
    }
    if (!this.isDashing() && now > this.dashUntil && this.body) {
      const body = this.body as Phaser.Physics.Arcade.Body
      if (body.velocity.length() > this.moveSpeed) {
        body.velocity.normalize().scale(this.moveSpeed)
      }
    }
  }

  private getAttackDamage(base: number) {
    return this.scene.time.now < this.damageBoostUntil ? Math.round(base * 1.35) : base
  }
}
