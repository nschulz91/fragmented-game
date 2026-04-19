import Phaser from 'phaser'
import { Boss } from '../entities/Boss'
import { Enemy, type MinionKind } from '../entities/Enemy'
import { Player } from '../entities/Player'
import {
  arena,
  bossStats,
  pixorHazards,
  pixorPlatforms,
  playerStats,
  spawnPoints,
  wavePlan,
} from '../content/tuning'
import { buffLabels, perkLabels } from '../content/gameText'
import { grantScore, saveSettings, type MetaProgress, type RenderState, type RunState } from '../state'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { Hud } from '../systems/Hud'
import { showLevelBanner } from '../systems/LevelBanner'
import { showNarrativeBeat } from '../systems/NarrativeBeat'
import { SeededRng } from '../systems/SeededRng'
import { addParallaxBackdrop, buildPlatforms, drawBranchSigns, drawHazards } from '../systems/SideScrollStage'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setRegionText, setStatusText } from '../../ui/shell'

type ActionState = {
  slash: boolean
  pulse: boolean
  dash: boolean
  parry: boolean
  chargePressed: boolean
  chargeHeld: boolean
  jump: boolean
  pause: boolean
  fullscreen: boolean
}

export class GameScene extends Phaser.Scene {
  private player!: Player
  private hud!: Hud
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'A' | 'D' | 'LEFT' | 'RIGHT' | 'UP' | 'W' | 'SPACE' | 'Q' | 'SHIFT' | 'E' | 'C' | 'ESC' | 'F', Phaser.Input.Keyboard.Key>
  private readonly pad = new GamepadState()
  private enemies: Enemy[] = []
  private boss?: Boss
  private enemyProjectiles!: Phaser.Physics.Arcade.Group
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private currentWaveIndex = 0
  private phaseLabel = 'Wave 1'
  private currentObjective = wavePlan[0].objective
  private rng!: SeededRng
  private simulationNow = 0
  private bossActive = false
  private checkpointHandled = false
  private bossPhaseTriggered = new Set<number>()
  private shieldTimer = 0
  private beatOneShown = false
  private beatTwoShown = false

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
    this.beatOneShown = false
    this.beatTwoShown = false

    setStatusText('Lake Pixor loaded. Side path breach active.')
    setObjectiveText(runState.resumedFromCheckpoint ? 'Resume from the checkpoint and break the Warden.' : wavePlan[0].objective)
    setLoreText(
      runState.resumedFromCheckpoint
        ? 'Charlie returns to the breach shelf with the checkpoint state intact.'
        : 'Lake Pixor is now a side-scrolling chapter with elevated ruins, toxic channels, and a boss gate at the far east.'
    )
    setHeaderText('Charlie now fights through a side-scrolling breach with upper/lower approach options instead of a flat arena.')
    setProgressText(`Relics ${meta.unlockedRelics.length} | Score ${runState.score} | Modifier x${runState.scoreMultiplier}`)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South slash, West pulse, South jump' : 'Space jump/slash, Q pulse, C charge')
    setRegionText('Chapter 1: Lake Pixor')

    audioDirector.playTrack('ambient')
    this.physics.world.setBounds(0, 0, arena.width, arena.height)
    this.cameras.main.setBounds(0, 0, arena.width, arena.height)
    this.cameras.main.flash(260, 30, 40, 48)

    this.drawArena()
    this.enemyProjectiles = this.physics.add.group()
    this.player = new Player(this, 168, 380, runState.selectedBuff, runState.selectedPerk, runState.activeRelics, runState.factionVariant)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.physics.add.collider(this.player, this.platforms)

    if (runState.activeChallengeModifiers.includes('glass-fragility')) {
      this.player.health = Math.min(this.player.health, this.player.maxHealth - 24)
    }

    this.hud = new Hud(this)
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,UP,W,SPACE,Q,SHIFT,E,C,ESC,F') as GameScene['keys']

    this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, projectile) => {
      this.handleProjectileCollision(projectile as Phaser.Physics.Arcade.Image)
    })

    showLevelBanner(this, {
      title: 'Lake Pixor',
      subtitle: 'Chapter 1 · Breach of the Poisoned Shore',
      accent: '#78d5c5',
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
    for (let index = 0; index < steps; index += 1) {
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
    this.currentObjective = 'Break the Warden of Pixor at the eastern gate.'
    setObjectiveText(this.currentObjective)
    setLoreText('The Warden is holding the upper gate. Use the ledges and punish the casting windows.')
    this.boss = new Boss(this, 1704, 180, this.enemyProjectiles)
    this.physics.add.collider(this.boss, this.platforms)
    audioDirector.playSfx('warning')
    showLevelBanner(this, {
      title: 'Warden Gate',
      subtitle: 'Final Shelf · Hold the line and break the guardian',
      accent: '#ffbe7b',
      duration: 1900,
    })
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

    const horizontal =
      (this.cursors.left?.isDown || this.keys.A.isDown || this.keys.LEFT.isDown ? -1 : 0) +
      (this.cursors.right?.isDown || this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) +
      this.pad.axisX()

    this.player.move(horizontal)
    if (actions.jump && this.player.jump()) audioDirector.playSfx('dash', 0.45)
    if (actions.dash) {
      const used = this.player.dash(now, horizontal)
      if (used) {
        audioDirector.playSfx('dash')
        this.flashDashFx()
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

    this.enemies = this.enemies.filter((enemy) => enemy.active && enemy.health > 0)
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
    const jumpKey = Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.keys.W) || this.pad.justPressed(GamepadButtons.South)
    const slashKey = Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.pad.justPressed(GamepadButtons.South)
    return {
      slash: slashKey && !jumpKey,
      pulse: Phaser.Input.Keyboard.JustDown(this.keys.Q) || this.pad.justPressed(GamepadButtons.West),
      dash: Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) || this.pad.justPressed(GamepadButtons.East),
      parry: Phaser.Input.Keyboard.JustDown(this.keys.E) || this.pad.justPressed(GamepadButtons.North),
      chargePressed: Phaser.Input.Keyboard.JustDown(this.keys.C) || this.pad.justPressed(GamepadButtons.R1),
      chargeHeld,
      jump: jumpKey,
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
    this.playFx('fx-slash-sheet', 'fx-slash', this.player.x + this.player.facing.x * 56, this.player.y - 26, this.player.facing.x < 0 ? -0.9 : 0.9, 34)
  }

  private flashPulseFx() {
    this.playFx('fx-pulse-sheet', 'fx-pulse', this.player.x, this.player.y - 24, 0.72, 14)
  }

  private flashDashFx() {
    this.playFx('fx-dash-sheet', 'fx-dash', this.player.x - this.player.facing.x * 18, this.player.y - 18, this.player.facing.x < 0 ? -0.82 : 0.82, 29)
  }

  private flashChargeFx() {
    this.playFx('fx-charge-sheet', 'fx-charge', this.player.x, this.player.y - 18, 0.8, 14)
  }

  private updateHazards(deltaMs: number, time: number) {
    const runState = this.registry.get('runState') as RunState
    const hazardMultiplier = runState.activeChallengeModifiers.includes('ember-tax') ? 1.3 : 1
    for (const pool of pixorHazards) {
      const insideX = this.player.x > pool.x && this.player.x < pool.x + pool.width
      const insideY = this.player.y + 24 > pool.y
      if (insideX && insideY) {
        const damage = ((playerStats.waterDamagePerSecond * hazardMultiplier) * deltaMs) / 1000
        const tookDamage = this.player.receiveDamage(damage, time)
        if (tookDamage) audioDirector.playSfx('hit', 0.5)
        setStatusText('Toxic runoff is burning Charlie.')
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
      this.playFx('fx-parry-sheet', 'fx-parry', this.player.x, this.player.y - 26, 0.7, 38)
      return
    }
    const damage = Number(projectile.getData('damage') ?? 8)
    if (this.player.receiveDamage(damage, now)) {
      audioDirector.playSfx('hit')
      this.playFx('fx-hit-sheet', 'fx-hit', this.player.x, this.player.y - 24, 0.7, 38)
    }
    projectile.destroy()
  }

  private handleEnemyContact(time: number) {
    this.enemies.forEach((enemy) => {
      if (!enemy.active) return
      if (Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 58) {
        if (this.player.isParrying()) {
          enemy.stun?.((this.registry.get('runState') as RunState).selectedPerk === 'order-of-glass' ? 850 : 600)
          this.player.handleParrySuccess(enemy)
          audioDirector.playSfx('parry')
          this.playFx('fx-parry-sheet', 'fx-parry', enemy.x, enemy.y - 22, 0.6, 38)
          return
        }
        if (this.player.receiveDamage(enemy.touchDamage * 0.18, time)) {
          audioDirector.playSfx('hit', 0.8)
          this.playFx('fx-hit-sheet', 'fx-hit', this.player.x, this.player.y - 24, 0.7, 38)
        }
      }
    })

    if (this.boss && this.boss.active && Phaser.Math.Distance.Between(this.boss.x, this.boss.y, this.player.x, this.player.y) < 86) {
      if (this.player.isParrying()) {
        this.boss.stun((this.registry.get('runState') as RunState).selectedPerk === 'order-of-glass' ? 700 : 450)
        this.player.handleParrySuccess(this.boss)
        audioDirector.playSfx('parry')
        this.playFx('fx-parry-sheet', 'fx-parry', this.boss.x, this.boss.y - 36, 0.9, 38)
      } else if (this.player.receiveDamage(this.boss.touchDamage * 0.2, time)) {
        audioDirector.playSfx('hit', 1.1)
        this.playFx('fx-hit-sheet', 'fx-hit', this.player.x, this.player.y - 24, 0.8, 38)
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
        setLoreText('The Warden tears open the upper ramp and calls shades down from the breach.')
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
        setLoreText('The last phase turns the breach into a layered crossfire.')
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
      if (this.currentWaveIndex === 1 && !this.beatOneShown) {
        this.beatOneShown = true
        showNarrativeBeat(this, {
          speaker: 'Marshal Veyra',
          portrait: 'portrait-veyra',
          line: 'The first shelf is clear. Do not let the Warden set the pace.',
          accent: '#78d5c5',
        })
      }
      if (this.currentWaveIndex === 2 && !this.beatTwoShown) {
        this.beatTwoShown = true
        showNarrativeBeat(this, {
          speaker: 'Scout Runner',
          portrait: 'portrait-scout',
          line: 'Checkpoint shelf ahead. One more hard push and the gate is yours.',
          accent: '#f2dd99',
        })
      }
      this.spawnWave(this.currentWaveIndex)
      const nextWave = wavePlan[this.currentWaveIndex]
      runState.currentWave = this.currentWaveIndex + 1
      this.registry.set('runState', runState)
      this.phaseLabel = nextWave.label
      this.currentObjective = nextWave.objective
      setObjectiveText(nextWave.objective)
      setLoreText(`Wave ${this.currentWaveIndex + 1} changes elevation and pressure. Read the telegraphs before they trap the lane.`)
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
    setLoreText('The checkpoint is stable. Choose your breach loadout before climbing into the Warden gate.')
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
    const enemy = new Enemy(this, spawn.x + Phaser.Math.Between(-18, 18), spawn.y + Phaser.Math.Between(-12, 12), kind, this.enemyProjectiles)
    this.physics.add.collider(enemy, this.platforms)
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
    addParallaxBackdrop(this, 'bg-pixor', arena.width, arena.height)
    this.platforms = buildPlatforms(this, pixorPlatforms, 'pixor', arena.height)
    drawHazards(this, pixorHazards, 'pixor')
    drawBranchSigns(this, [
      { x: 432, y: 320, text: 'Upper Ruin Path', accent: 0x9ecae7 },
      { x: 1036, y: 360, text: 'Low Spillway', accent: 0x8ce4d6 },
      { x: 1326, y: 290, text: 'Checkpoint Shelf', accent: 0xf2dd99 },
      { x: 1602, y: 248, text: 'Warden Gate', accent: 0xffc37b },
    ])
  }

  private playFx(sheetKey: string, animKey: string, x: number, y: number, scale: number, depth: number) {
    const fx = this.add.sprite(x, y, sheetKey, 0).setScale(scale).setDepth(depth)
    fx.play(animKey)
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy())
    return fx
  }
}
