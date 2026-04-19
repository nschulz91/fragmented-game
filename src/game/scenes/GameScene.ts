import Phaser from 'phaser'
import { Boss } from '../entities/Boss'
import { Enemy, type MinionKind } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { arena, playerStats, spawnPoints, waterPools, wavePlan } from '../content/tuning'
import { Hud } from '../systems/Hud'
import { Sfx } from '../systems/Sfx'
import { setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'

export class GameScene extends Phaser.Scene {
  private player!: Player
  private hud!: Hud
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'SHIFT', Phaser.Input.Keyboard.Key>
  private enemies: Enemy[] = []
  private boss?: Boss
  private enemyProjectiles!: Phaser.Physics.Arcade.Group
  private readonly sfx = new Sfx()
  private currentWave = 0
  private phaseLabel = 'Wave 1'
  private pulseGlow?: Phaser.GameObjects.Image

  constructor() {
    super('game')
  }

  create() {
    setStatusText('Arena loaded. Hold the breach.')
    setObjectiveText('Clear the first wave.')
    setLoreText('Charlie breaches Lake Pixor. The water burns, the air is wrong, and the first wave is already moving.')

    this.physics.world.setBounds(0, 0, arena.width, arena.height)
    this.cameras.main.setBounds(0, 0, arena.width, arena.height)

    this.drawArena()
    this.enemyProjectiles = this.physics.add.group()
    this.player = new Player(this, 480, 420)
    this.hud = new Hud(this)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,SHIFT') as GameScene['keys']

    this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, projectile) => {
      const shot = projectile as Phaser.Physics.Arcade.Image
      const damage = Number(shot.getData('damage') ?? 8)
      if (this.player.receiveDamage(damage, this.time.now)) {
        this.sfx.play('hit')
      }
      shot.destroy()
    })

    this.spawnWave(0)
  }

  update(time: number) {
    this.handleInput(time)
    this.updateHazards(time)
    this.cleanupProjectiles(time)

    this.enemies = this.enemies.filter((enemy) => enemy.active)
    this.enemies.forEach((enemy) => enemy.update(time, this.player))
    this.boss?.update(time, this.player)

    this.handleEnemyContact(time)
    this.handleWaveProgression()

    const pulseCooldown = time - this.player.lastPulseAt >= playerStats.pulseCooldownMs
    const objective = this.boss
      ? 'Break the warden before the Prince can lock down Lake Pixor.'
      : this.currentWave < wavePlan.length
        ? `Eliminate all hostiles in wave ${this.currentWave + 1}.`
        : 'Prepare for the warden.'

    this.hud.render(this.player.health, this.player.maxHealth, pulseCooldown, this.phaseLabel, objective)

    if (this.player.health <= 0) {
      this.sfx.play('lose')
      this.scene.start('lose')
    }
  }

  private drawArena() {
    const backdrop = this.add.graphics()
    backdrop.fillGradientStyle(0x16353d, 0x16353d, 0x0b161b, 0x0b161b, 1)
    backdrop.fillRect(0, 0, arena.width, arena.height)
    backdrop.fillStyle(0x89c9bc, 0.1)
    backdrop.fillCircle(180, 84, 160)
    backdrop.fillCircle(820, 420, 190)

    const ruins = this.add.graphics()
    ruins.fillStyle(0x2d474d, 0.9)
    ruins.fillRoundedRect(108, 250, 120, 26, 10)
    ruins.fillRoundedRect(706, 226, 130, 28, 10)
    ruins.fillRoundedRect(388, 144, 180, 24, 10)
    ruins.fillRoundedRect(386, 360, 200, 26, 10)

    waterPools.forEach((pool) => {
      const water = this.add.circle(pool.x, pool.y, pool.radius, 0x2b84a3, 0.45)
      water.setStrokeStyle(3, 0xa6e1ff, 0.3)
    })

    this.add.text(32, 500, 'Lake Pixor', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#d2ede6',
    }).setAlpha(0.85)
  }

  private handleInput(time: number) {
    const x = (this.cursors.left?.isDown || this.keys.A.isDown ? -1 : 0) + (this.cursors.right?.isDown || this.keys.D.isDown ? 1 : 0)
    const y = (this.cursors.up?.isDown || this.keys.W.isDown ? -1 : 0) + (this.cursors.down?.isDown || this.keys.S.isDown ? 1 : 0)
    this.player.move(new Phaser.Math.Vector2(x, y))

    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
      const used = this.player.slash(time, [...this.enemies, ...(this.boss ? [this.boss] : [])], () => this.sfx.play('slash'))
      if (used) {
        const slashFx = this.add.arc(this.player.x + this.player.facing.x * 30, this.player.y + this.player.facing.y * 30, 38, 0, 180, false, 0xfbe6aa, 0.35)
        slashFx.setRotation(this.player.facing.angle())
        slashFx.setDepth(30)
        this.tweens.add({
          targets: slashFx,
          alpha: 0,
          scale: 1.3,
          duration: 120,
          onComplete: () => slashFx.destroy(),
        })
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT)) {
      const used = this.player.pulse(time, [...this.enemies, ...(this.boss ? [this.boss] : [])], () => this.sfx.play('pulse'))
      if (used) {
        this.pulseGlow?.destroy()
        this.pulseGlow = this.add.image(this.player.x, this.player.y, 'pulse-ring').setDepth(10).setAlpha(0.6)
        this.tweens.add({
          targets: this.pulseGlow,
          alpha: 0,
          scale: 1.45,
          duration: 280,
          onComplete: () => this.pulseGlow?.destroy(),
        })
      }
    }
  }

  private updateHazards(time: number) {
    for (const pool of waterPools) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, pool.x, pool.y)
      if (distance <= pool.radius) {
        const damage = (playerStats.waterDamagePerSecond / 60) * this.game.loop.delta / (1000 / 60)
        const tookDamage = this.player.receiveDamage(damage, time)
        if (tookDamage) this.sfx.play('hit')
        setStatusText('Toxic water is burning Charlie.')
        return
      }
    }
    setStatusText(this.boss ? 'Warden active.' : `Wave ${this.currentWave + 1} active.`)
  }

  private cleanupProjectiles(time: number) {
    for (const child of this.enemyProjectiles.getChildren()) {
      const projectile = child as Phaser.Physics.Arcade.Image
      if (!projectile.active) continue
      const expiresAt = Number(projectile.getData('expiresAt') ?? 0)
      if (
        expiresAt < time ||
        projectile.x < -40 ||
        projectile.y < -40 ||
        projectile.x > arena.width + 40 ||
        projectile.y > arena.height + 40
      ) {
        projectile.destroy()
      }
    }
  }

  private handleEnemyContact(time: number) {
    this.enemies.forEach((enemy) => {
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 34) {
        if (this.player.receiveDamage(enemy.touchDamage * (this.game.loop.delta / 1000), time)) {
          this.sfx.play('hit')
        }
      }
    })

    if (this.boss && Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y) < 48) {
      if (this.player.receiveDamage(this.boss.touchDamage * (this.game.loop.delta / 1000), time)) {
        this.sfx.play('hit')
      }
    }
  }

  private handleWaveProgression() {
    if (this.boss) {
      const summons = this.boss.consumeTriggeredThresholds()
      for (let i = 0; i < summons; i += 1) {
        this.spawnMinion('shade')
        this.spawnMinion('cultist')
        this.sfx.play('boss')
      }

      if (!this.boss.active) {
        this.sfx.play('win')
        this.scene.start('win')
      }
      return
    }

    if (this.enemies.length > 0) return

    this.currentWave += 1
    if (this.currentWave < wavePlan.length) {
      this.spawnWave(this.currentWave)
      setObjectiveText(`Wave ${this.currentWave + 1} is in motion. Break it fast.`)
      setLoreText('The Shadow Court changes cadence. Heavy bodies are moving in with the next push.')
      return
    }

    this.spawnBoss()
    setObjectiveText('The warden has entered Lake Pixor. Defeat it.')
    setLoreText('The first breach worked. The warden of Lake Pixor manifests to stop Charlie before he reaches the castle.')
  }

  private spawnWave(index: number) {
    const wave = wavePlan[index]
    this.phaseLabel = `Wave ${index + 1}`
    for (let i = 0; i < wave.shades; i += 1) this.spawnMinion('shade')
    for (let i = 0; i < wave.cultists; i += 1) this.spawnMinion('cultist')
    for (let i = 0; i < wave.brutes; i += 1) this.spawnMinion('brute')
  }

  private spawnMinion(kind: MinionKind) {
    const spawn = Phaser.Utils.Array.GetRandom(spawnPoints)
    const enemy = new Enemy(this, spawn.x + Phaser.Math.Between(-18, 18), spawn.y + Phaser.Math.Between(-18, 18), kind, this.enemyProjectiles)
    this.enemies.push(enemy)
  }

  private spawnBoss() {
    this.phaseLabel = 'Warden'
    this.boss = new Boss(this, 480, 108, this.enemyProjectiles)
    this.sfx.play('boss')
  }
}
