import Phaser from 'phaser'
import { Boss } from '../entities/Boss'
import { Enemy, type MinionKind } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { arena, arenaLandmarks, bossStats, playerStats, spawnPoints, waterPools, wavePlan } from '../content/tuning'
import { buffLabels, perkLabels } from '../content/gameText'
import {
  grantScore,
  saveSettings,
  type MetaProgress,
  type RenderState,
  type RunState,
} from '../state'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { Hud } from '../systems/Hud'
import { SeededRng } from '../systems/SeededRng'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setRegionText, setStatusText } from '../../ui/shell'

type ActionState = {
  slash: boolean
  pulse: boolean
  dash: boolean
  parry: boolean
  chargePressed: boolean
  chargeHeld: boolean
  pause: boolean
  fullscreen: boolean
}

export class GameScene extends Phaser.Scene {
  private player!: Player
  private hud!: Hud
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'Q' | 'SHIFT' | 'E' | 'C' | 'ESC' | 'F', Phaser.Input.Keyboard.Key>
  private readonly pad = new GamepadState()
  private enemies: Enemy[] = []
  private boss?: Boss
  private enemyProjectiles!: Phaser.Physics.Arcade.Group
  private currentWaveIndex = 0
  private phaseLabel = 'Wave 1'
  private currentObjective = wavePlan[0].objective
  private rng!: SeededRng
  private simulationNow = 0
  private bossActive = false
  private checkpointHandled = false
  private bossPhaseTriggered = new Set<number>()
  private shieldTimer = 0

  constructor() {
    super('game')
  }

  init(data?: { region?: 'pixor' }) {
    const runState = this.registry.get('runState') as RunState
    runState.currentRegion = data?.region ?? 'pixor'
    runState.currentChapter = 1
    runState.currentFlow = 'game'
    runState.mode = 'game'
    this.registry.set('runState', runState)
    this.simulationNow = 0
  }

  create() {
    const runState = this.registry.get('runState') as RunState
    const meta = this.registry.get('metaProgress') as MetaProgress
    this.rng = new SeededRng(runState.seed)
    this.currentWaveIndex = runState.resumedFromCheckpoint && runState.checkpoint.unlocked ? wavePlan.length : 0
    runState.currentWave = this.currentWaveIndex + 1
    this.registry.set('runState', runState)
    this.checkpointHandled = runState.checkpoint.unlocked
    this.bossActive = false
    this.bossPhaseTriggered.clear()
    this.shieldTimer = 0

    setStatusText('Lake Pixor loaded. Hold the breach.')
    setObjectiveText(runState.resumedFromCheckpoint ? 'Resume from the checkpoint and break the Warden.' : wavePlan[0].objective)
    setLoreText(
      runState.resumedFromCheckpoint
        ? 'The checkpoint still holds. Charlie returns to the boss breach with the same run state.'
        : 'Lake Pixor is the first chapter: toxic ground, broken landmarks, and the first proof that the route east can hold.'
    )
    setHeaderText('Chapter 1 remains the structured combat tutorial, but now it feeds chapter score, relic progression, and the reward room.')
    setProgressText(`Relics ${meta.unlockedRelics.length} | Score ${runState.score} | Modifier x${runState.scoreMultiplier}`)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South slash, West pulse, R1 charge' : 'Space slash, Q pulse, C charge')
    setRegionText('Chapter 1: Lake Pixor')

    audioDirector.playTrack('ambient')

    this.physics.world.setBounds(0, 0, arena.width, arena.height)
    this.cameras.main.setBounds(0, 0, arena.width, arena.height)
    this.cameras.main.flash(260, 30, 40, 48)

    this.drawArena()
    this.enemyProjectiles = this.physics.add.group()
    this.player = new Player(
      this,
      480,
      420,
      runState.selectedBuff,
      runState.selectedPerk,
      runState.activeRelics,
      runState.factionVariant
    )

    if (runState.activeChallengeModifiers.includes('glass-fragility')) {
      this.player.health = Math.min(this.player.health, this.player.maxHealth - 24)
    }

    this.hud = new Hud(this)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,Q,SHIFT,E,C,ESC,F') as GameScene['keys']

    this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, projectile) => {
      this.handleProjectileCollision(projectile as Phaser.Physics.Arcade.Image)
    })

    if (runState.resumedFromCheckpoint && runState.checkpoint.unlocked) {
      this.scene.launch('boss-intro')
      this.scene.pause()
    } else {
      this.spawnWave(0)
    }
  }

  update(time: number, delta: number) {
    this.simulationNow = time
    this.pad.sync(this.input.gamepad)
    this.runFrame(delta, time, false)
  }

  manualAdvance(ms: number) {
    if (!this.scene.isActive()) return
    const steps = Math.max(1, Math.round(ms / (1000 / 60)))
    for (let i = 0; i < steps; i += 1) {
      this.simulationNow += 1000 / 60
      this.runFrame(1000 / 60, this.simulationNow, true)
      this.physics.world.singleStep()
    }
  }

  beginBossPhase() {
    if (this.bossActive) return
    this.bossActive = true
    const runState = this.registry.get('runState') as RunState
    runState.currentWave = wavePlan.length + 1
    runState.bossPhase = 1
    this.registry.set('runState', runState)
    this.phaseLabel = 'Warden'
    this.currentObjective = 'Break the Warden of Pixor before the Prince locks the breach.'
    setObjectiveText(this.currentObjective)
    setLoreText('The final lock moves. The Warden is now the bridge between the lake and the reward room.')
    this.boss = new Boss(this, 480, 112, this.enemyProjectiles)
    audioDirector.playSfx('warning')
    this.scene.resume()
  }

  private runFrame(deltaMs: number, now: number, manual: boolean) {
    if (this.scene.isPaused()) return

    const actions = this.collectActions()
    if (actions.pause && !manual) {
      const runState = this.registry.get('runState') as RunState
      runState.paused = true
      this.registry.set('runState', runState)
      this.scene.launch('pause')
      this.scene.pause()
      return
    }
    if (actions.fullscreen && !manual) {
      if (this.scale.isFullscreen) this.scale.stopFullscreen()
      else this.scale.startFullscreen()
      const settings = { ...(this.registry.get('settings') as { fullscreen: boolean }) }
      settings.fullscreen = this.scale.isFullscreen
      this.registry.set('settings', { ...(this.registry.get('settings') as object), ...settings })
      saveSettings(this.registry.get('settings'))
    }

    const moveVector = new Phaser.Math.Vector2(
      (this.cursors.left?.isDown || this.keys.A.isDown ? -1 : 0) + (this.cursors.right?.isDown || this.keys.D.isDown ? 1 : 0) + this.pad.axisX(),
      (this.cursors.up?.isDown || this.keys.W.isDown ? -1 : 0) + (this.cursors.down?.isDown || this.keys.S.isDown ? 1 : 0) + this.pad.axisY()
    )

    this.player.move(moveVector)
    if (actions.dash) {
      const used = this.player.dash(now, moveVector)
      if (used) {
        audioDirector.playSfx('dash')
        if ((this.registry.get('runState') as RunState).selectedPerk === 'pixor-scouts') {
          this.player.activateDamageBoost(now, 1800)
        }
      }
    }
    if (actions.parry && this.player.parry(now)) audioDirector.playSfx('parry', 0.7)
    if (actions.chargePressed) this.player.startCharge(now)
    if (!actions.chargeHeld && this.player.isCharging(now)) {
      const charge = this.player.releaseCharge(now, [...this.enemies, ...(this.boss ? [this.boss] : [])])
      if (charge.detonated) {
        this.flashChargeFx()
        audioDirector.playSfx('boss', 0.45)
      }
    }
    if (actions.slash) {
      const used = this.player.slash(now, [...this.enemies, ...(this.boss ? [this.boss] : [])], () => audioDirector.playSfx('slash'))
      if (used) this.flashSlashFx()
    }
    if (actions.pulse) {
      const used = this.player.pulse(now, [...this.enemies, ...(this.boss ? [this.boss] : [])], () => audioDirector.playSfx('pulse'))
      if (used) this.flashPulseFx()
    }

    this.player.updateState(now)
    this.updatePerks(now)
    this.updateHazards(deltaMs, now)
    this.cleanupProjectiles(now)

    this.enemies = this.enemies.filter((enemy) => enemy.active)
    this.enemies.forEach((enemy) => enemy.update(now, this.player))
    this.boss?.update(now, this.player)

    this.handleEnemyContact(now)
    this.handlePhaseProgression()
    this.updateHud()
    this.updateRenderState()

    if (this.player.health <= 0) {
      audioDirector.playSfx('lose')
      this.scene.start('lose')
    }
  }

  private collectActions(): ActionState {
    const chargeHeld = this.keys.C.isDown || this.pad.isDown(GamepadButtons.R1)
    return {
      slash: Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.pad.justPressed(GamepadButtons.South),
      pulse: Phaser.Input.Keyboard.JustDown(this.keys.Q) || this.pad.justPressed(GamepadButtons.West),
      dash: Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) || this.pad.justPressed(GamepadButtons.East),
      parry: Phaser.Input.Keyboard.JustDown(this.keys.E) || this.pad.justPressed(GamepadButtons.North),
      chargePressed: Phaser.Input.Keyboard.JustDown(this.keys.C) || this.pad.justPressed(GamepadButtons.R1),
      chargeHeld,
      pause: Phaser.Input.Keyboard.JustDown(this.keys.ESC) || this.pad.justPressed(GamepadButtons.Start),
      fullscreen: Phaser.Input.Keyboard.JustDown(this.keys.F),
    }
  }

  private updatePerks(now: number) {
    const runState = this.registry.get('runState') as RunState
    if (runState.selectedPerk === 'house-veyra' && now > this.shieldTimer) {
      this.shieldTimer = now + 8500
      this.player.grantShield()
      audioDirector.playSfx('shield')
    }
  }

  private flashSlashFx() {
    const slashFx = this.add.arc(this.player.x + this.player.facing.x * 32, this.player.y + this.player.facing.y * 32, 40, 0, 180, false, 0xfbe6aa, 0.36)
    slashFx.setRotation(this.player.facing.angle())
    slashFx.setDepth(30)
    this.tweens.add({
      targets: slashFx,
      alpha: 0,
      scale: 1.34,
      duration: 120,
      onComplete: () => slashFx.destroy(),
    })
  }

  private flashPulseFx() {
    const ring = this.add.image(this.player.x, this.player.y, 'pulse-ring').setDepth(10).setAlpha(0.7)
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.5,
      duration: 260,
      onComplete: () => ring.destroy(),
    })
  }

  private flashChargeFx() {
    const ring = this.add.circle(this.player.x, this.player.y, this.player.chargeRadius, 0xffba7b, 0.28).setDepth(14)
    this.tweens.add({
      targets: ring,
      alpha: 0,
      scale: 1.4,
      duration: 180,
      onComplete: () => ring.destroy(),
    })
  }

  private updateHazards(deltaMs: number, time: number) {
    const runState = this.registry.get('runState') as RunState
    const hazardMultiplier = runState.activeChallengeModifiers.includes('ember-tax') ? 1.3 : 1
    for (const pool of waterPools) {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, pool.x, pool.y)
      if (distance <= pool.radius) {
        const damage = ((playerStats.waterDamagePerSecond * hazardMultiplier) * deltaMs) / 1000
        const tookDamage = this.player.receiveDamage(damage, time)
        if (tookDamage) audioDirector.playSfx('hit', 0.5)
        setStatusText('Toxic water is burning Charlie.')
        return
      }
    }
    if (this.bossActive) setStatusText(`Warden phase ${this.boss?.phase ?? 1} active.`)
    else setStatusText(`${wavePlan[this.currentWaveIndex]?.label ?? 'Checkpoint'} active.`)
  }

  private cleanupProjectiles(now: number) {
    for (const child of this.enemyProjectiles.getChildren()) {
      const projectile = child as Phaser.Physics.Arcade.Image
      if (!projectile.active) continue
      const expiresAt = Number(projectile.getData('expiresAt') ?? 0)
      if (expiresAt < now || projectile.x < -40 || projectile.y < -40 || projectile.x > arena.width + 40 || projectile.y > arena.height + 40) {
        projectile.destroy()
      }
    }
  }

  private handleProjectileCollision(projectile: Phaser.Physics.Arcade.Image) {
    const now = this.simulationNow
    if (this.player.isParrying() && projectile.getData('parryable')) {
      projectile.destroy()
      this.player.handleParrySuccess()
      audioDirector.playSfx('parry')
      return
    }
    const damage = Number(projectile.getData('damage') ?? 8)
    if (this.player.receiveDamage(damage, now)) audioDirector.playSfx('hit')
    projectile.destroy()
  }

  private handleEnemyContact(time: number) {
    this.enemies.forEach((enemy) => {
      if (!enemy.active) return
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 34) {
        if (this.player.isParrying()) {
          enemy.stun?.((this.registry.get('runState') as RunState).selectedPerk === 'order-of-glass' ? 850 : 600)
          this.player.handleParrySuccess(enemy)
          audioDirector.playSfx('parry')
          return
        }
        if (this.player.receiveDamage(enemy.touchDamage * 0.18, time)) audioDirector.playSfx('hit', 0.8)
      }
    })

    if (this.boss && this.boss.active && Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y) < 52) {
      if (this.player.isParrying()) {
        this.boss.stun((this.registry.get('runState') as RunState).selectedPerk === 'order-of-glass' ? 700 : 450)
        this.player.handleParrySuccess(this.boss)
        audioDirector.playSfx('parry')
      } else if (this.player.receiveDamage(this.boss.touchDamage * 0.2, time)) {
        audioDirector.playSfx('hit', 1.1)
      }
    }
  }

  private handlePhaseProgression() {
    const runState = this.registry.get('runState') as RunState
    if (this.bossActive && this.boss) {
      if (!this.boss.active) {
        grantScore(runState, 1350)
        this.player.restoreAfterChapterClear()
        this.registry.set('runState', runState)
        audioDirector.playSfx('win')
        this.scene.start('dialogue', {
          lines: 'boss-outro',
          nextScene: 'reward',
          nextData: {},
        })
        return
      }

      const ratio = this.boss.health / this.boss.maxHealth
      if (ratio <= bossStats.phaseThresholds[0] && !this.bossPhaseTriggered.has(2)) {
        this.bossPhaseTriggered.add(2)
        this.boss.enterPhase(2)
        runState.bossPhase = 2
        this.registry.set('runState', runState)
        this.spawnMinion('shade')
        this.spawnMinion('shade')
        audioDirector.playSfx('warning')
        setLoreText('The Warden fractures the air and calls shades into the breach.')
      }
      if (ratio <= bossStats.phaseThresholds[1] && !this.bossPhaseTriggered.has(3)) {
        this.bossPhaseTriggered.add(3)
        this.boss.enterPhase(3)
        runState.bossPhase = 3
        this.registry.set('runState', runState)
        this.spawnMinion('shade')
        this.spawnMinion('cultist')
        this.spawnMinion('brute')
        audioDirector.playSfx('boss')
        setLoreText('The last phase is heavier, faster, and much less patient.')
      }
      return
    }

    if (this.currentWaveIndex >= wavePlan.length) {
      if (!this.checkpointHandled) this.unlockCheckpoint()
      return
    }

    if (this.enemies.length > 0) return

    this.currentWaveIndex += 1
    if (this.currentWaveIndex < wavePlan.length) {
      this.spawnWave(this.currentWaveIndex)
      const nextWave = wavePlan[this.currentWaveIndex]
      runState.currentWave = this.currentWaveIndex + 1
      this.registry.set('runState', runState)
      this.phaseLabel = nextWave.label
      this.currentObjective = nextWave.objective
      setObjectiveText(nextWave.objective)
      setLoreText(`Wave ${this.currentWaveIndex + 1} breaches with a different rhythm. Read the telegraphs before they close.`)
      return
    }

    this.unlockCheckpoint()
  }

  private unlockCheckpoint() {
    if (this.checkpointHandled) return
    this.checkpointHandled = true
    const runState = this.registry.get('runState') as RunState
    runState.checkpoint.unlocked = true
    runState.checkpoint.reachedAtWave = wavePlan.length
    runState.currentWave = wavePlan.length
    grantScore(runState, 540)
    this.registry.set('runState', runState)
    this.phaseLabel = 'Checkpoint'
    this.currentObjective = 'Select one buff and one faction support perk.'
    setObjectiveText(this.currentObjective)
    setLoreText('The checkpoint is stable. Choose one upgrade and one faction line before the boss intercept.')
    this.scene.launch('checkpoint')
    this.scene.pause()
  }

  private spawnWave(index: number) {
    const wave = wavePlan[index]
    const runState = this.registry.get('runState') as RunState
    runState.currentWave = index + 1
    this.registry.set('runState', runState)
    this.phaseLabel = wave.label
    this.currentObjective = wave.objective
    const kinds: MinionKind[] = [
      ...Array(wave.shades + (runState.activeChallengeModifiers.includes('hunters-mark') ? 1 : 0)).fill('shade'),
      ...Array(wave.cultists).fill('cultist'),
      ...Array(wave.brutes).fill('brute'),
    ] as MinionKind[]
    kinds.forEach((kind) => this.spawnMinion(kind))
  }

  private spawnMinion(kind: MinionKind) {
    const spawn = this.rng.pick(spawnPoints)
    const enemy = new Enemy(this, spawn.x + Phaser.Math.Between(-18, 18), spawn.y + Phaser.Math.Between(-18, 18), kind, this.enemyProjectiles)
    this.enemies.push(enemy)
  }

  private updateHud() {
    const runState = this.registry.get('runState') as RunState
    this.hud.render({
      playerHealth: this.player.health,
      playerMaxHealth: this.player.maxHealth,
      slashReady: this.player.canSlash(this.simulationNow),
      dashReady: this.player.canDash(this.simulationNow),
      parryReady: this.player.canParry(this.simulationNow),
      pulseReady: this.player.canPulse(this.simulationNow),
      chargeReady: this.player.canCharge(this.simulationNow),
      shieldCharges: this.player.shieldCharges,
      label: this.phaseLabel,
      objective: `${this.currentObjective}  |  Score ${runState.score}`,
      buffLabel: `Buff: ${runState.selectedBuff ? buffLabels[runState.selectedBuff] : 'None'}`,
      perkLabel: `Support: ${runState.selectedPerk ? perkLabels[runState.selectedPerk] : 'None'}`,
      bossHealthRatio: this.boss?.active ? this.boss.health / this.boss.maxHealth : undefined,
      bossPhase: this.boss?.active ? this.boss.phase : undefined,
    })
  }

  private updateRenderState() {
    const runState = this.registry.get('runState') as RunState
    const renderState: RenderState = {
      mode: 'game',
      flow: runState.currentFlow,
      region: 'pixor',
      chapter: 1,
      seed: runState.seed,
      inputMode: runState.inputMode,
      coordinateSystem: 'origin=(0,0) top-left, +x right, +y down',
      player: {
        x: this.player.x,
        y: this.player.y,
        health: Math.round(this.player.health),
        maxHealth: this.player.maxHealth,
        facing: { x: Number(this.player.facing.x.toFixed(2)), y: Number(this.player.facing.y.toFixed(2)) },
        dashReady: this.player.canDash(this.simulationNow),
        parryReady: this.player.canParry(this.simulationNow),
        pulseReady: this.player.canPulse(this.simulationNow),
        chargeReady: this.player.canCharge(this.simulationNow),
        shieldCharges: this.player.shieldCharges,
      },
      enemies: this.enemies.map((enemy) => ({
        kind: enemy.kind,
        x: Math.round(enemy.x),
        y: Math.round(enemy.y),
        health: enemy.health,
        state: enemy.stateLabel,
      })),
      boss: this.boss?.active
        ? {
            phase: this.boss.phase,
            health: Math.round(this.boss.health),
            maxHealth: this.boss.maxHealth,
            state: this.boss.stateLabel,
          }
        : undefined,
      encounter: {
        seed: runState.seed,
        wave: this.currentWaveIndex + 1,
        checkpointUnlocked: runState.checkpoint.unlocked,
        selectedBuff: runState.selectedBuff,
        selectedPerk: runState.selectedPerk,
      },
      relics: runState.activeRelics,
      activeModifiers: runState.activeChallengeModifiers,
      score: runState.score,
      objective: this.currentObjective,
    }
    this.registry.set('renderState', renderState)
  }

  private drawArena() {
    const backdrop = this.add.graphics()
    backdrop.fillGradientStyle(0x1d3a42, 0x17363e, 0x0e171c, 0x0a1014, 1)
    backdrop.fillRect(0, 0, arena.width, arena.height)

    const aura = this.add.graphics()
    aura.fillStyle(0xa1dfe3, 0.06)
    aura.fillCircle(170, 94, 156)
    aura.fillCircle(806, 392, 194)

    const ruins = this.add.graphics()
    ruins.fillStyle(0x2d474d, 0.95)
    arenaLandmarks.forEach((landmark, index) => {
      ruins.fillRoundedRect(landmark.x - landmark.width / 2, landmark.y - landmark.height / 2, landmark.width, landmark.height, 12)
      this.add.circle(landmark.x, landmark.y, 10 + index * 2, 0xcaa66b, 0.18).setDepth(4)
    })

    waterPools.forEach((pool, index) => {
      const safeRing = this.add.circle(pool.x, pool.y, pool.radius + 16, 0x94e5b0, 0.08)
      safeRing.setDepth(1)
      const water = this.add.circle(pool.x, pool.y, pool.radius, 0x2f8fb5, 0.52)
      water.setStrokeStyle(4, 0xd6fff9, 0.28)
      water.setDepth(2)
      this.add.text(pool.x, pool.y + pool.radius + 16, index === 0 ? 'Toxic water' : '', {
        fontFamily: 'Georgia',
        fontSize: '14px',
        color: '#d7f3ff',
      }).setOrigin(0.5).setDepth(2)
    })

    this.add.text(30, 496, 'Lake Pixor', {
      fontFamily: 'Georgia',
      fontSize: '30px',
      color: '#e0eee6',
    }).setAlpha(0.9)
    this.add.text(824, 500, 'Breach Road', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d9c492',
    }).setOrigin(1, 0.5).setAlpha(0.75)
  }
}
