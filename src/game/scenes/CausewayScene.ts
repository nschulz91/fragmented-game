import Phaser from 'phaser'
import { Enemy, type MinionKind } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { causewayHazards, causewayLandmarks, causewayMap, causewayStages } from '../content/tuning'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import {
  grantScore,
  recordChapterResult,
  recordRunResult,
  saveMetaProgress,
  unlockChallengeModifier,
  unlockRelic,
  type ChallengeModifierId,
  type MetaProgress,
  type RelicId,
  type RunState,
} from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setRegionText, setStatusText } from '../../ui/shell'

export class CausewayScene extends Phaser.Scene {
  private player!: Player
  private readonly pad = new GamepadState()
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'Q' | 'SHIFT' | 'E' | 'C' | 'ESC', Phaser.Input.Keyboard.Key>
  private enemies: Enemy[] = []
  private enemyProjectiles!: Phaser.Physics.Arcade.Group
  private simulationNow = 0
  private stageIndex = -1
  private shrineTriggered = false
  private stageBanner?: Phaser.GameObjects.Text

  constructor() {
    super('causeway')
  }

  create() {
    const runState = this.registry.get('runState') as RunState
    runState.currentRegion = 'causeway'
    runState.currentChapter = 2
    runState.currentFlow = 'causeway'
    runState.causewayStage = 0
    this.registry.set('runState', runState)
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'causeway',
      flow: 'causeway',
      region: 'causeway',
      chapter: 2,
      score: runState.score,
      relics: runState.activeRelics,
      activeModifiers: runState.activeChallengeModifiers,
    })

    setStatusText('Cinder Causeway active.')
    setObjectiveText('Push through the three Causeway gates and survive the region-ending encounter.')
    setLoreText('The Causeway collapses in layers. Fire hazards, lane pressure, and hunter packs arrive together.')
    setHeaderText('Cinder Causeway is the broader second region: multiple spaces, stronger hazards, and two new enemy families.')
    setRegionText('Chapter 2: Cinder Causeway')
    setProgressText(`Current score ${runState.score} | Relics ${runState.activeRelics.length} | Modifier count ${runState.activeChallengeModifiers.length}`)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'Controller prompts active' : 'Keyboard prompts active')
    audioDirector.playTrack('causeway')

    this.physics.world.setBounds(0, 0, causewayMap.width, causewayMap.height)
    this.cameras.main.setBounds(0, 0, causewayMap.width, causewayMap.height)

    this.drawCauseway()
    this.enemyProjectiles = this.physics.add.group()
    this.player = new Player(this, 118, 410, null, null, runState.activeRelics, runState.factionVariant)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.stageBanner = this.add.text(480, 22, '', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#ffd7a3',
    }).setOrigin(0.5, 0).setScrollFactor(0).setDepth(101)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,Q,SHIFT,E,C,ESC') as CausewayScene['keys']

    this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, projectile) => {
      const shot = projectile as Phaser.Physics.Arcade.Image
      if (this.player.isParrying() && shot.getData('parryable')) {
        shot.destroy()
        return
      }
      this.player.receiveDamage(Number(shot.getData('damage') ?? 10), this.simulationNow)
      shot.destroy()
    })
  }

  update(time: number) {
    this.simulationNow = time
    this.pad.sync(this.input.gamepad)
    this.runFrame(time)
  }

  manualAdvance(ms: number) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)))
    for (let i = 0; i < steps; i += 1) {
      this.simulationNow += 1000 / 60
      this.runFrame(this.simulationNow)
      this.physics.world.singleStep()
    }
  }

  private runFrame(now: number) {
    const moveVector = new Phaser.Math.Vector2(
      (this.cursors.left?.isDown || this.keys.A.isDown ? -1 : 0) + (this.cursors.right?.isDown || this.keys.D.isDown ? 1 : 0) + this.pad.axisX(),
      (this.cursors.up?.isDown || this.keys.W.isDown ? -1 : 0) + (this.cursors.down?.isDown || this.keys.S.isDown ? 1 : 0) + this.pad.axisY()
    )

    this.player.move(moveVector)
    if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) || this.pad.justPressed(GamepadButtons.East)) this.player.dash(now, moveVector)
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) || this.pad.justPressed(GamepadButtons.North)) this.player.parry(now)
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.pad.justPressed(GamepadButtons.South)) this.player.slash(now, this.enemies)
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q) || this.pad.justPressed(GamepadButtons.West)) this.player.pulse(now, this.enemies)
    if (Phaser.Input.Keyboard.JustDown(this.keys.C) || this.pad.justPressed(GamepadButtons.R1)) this.player.startCharge(now)
    if ((!this.keys.C.isDown && this.player.isCharging(now)) || this.pad.isDown(GamepadButtons.R1) === false) {
      const charge = this.player.releaseCharge(now, this.enemies)
      if (charge.detonated) this.flashCharge()
    }

    this.player.updateState(now)
    this.enemies = this.enemies.filter((enemy) => enemy.active)
    this.enemies.forEach((enemy) => enemy.update(now, this.player))

    causewayHazards.forEach((hazard) => {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, hazard.x, hazard.y) < hazard.radius) {
        this.player.receiveDamage(0.55, now)
      }
    })

    this.updateStageState()
    this.updateRenderState(now)

    if (this.player.health <= 0) {
      this.scene.start('lose')
    }
  }

  private updateStageState() {
    const nextStage = causewayStages.findIndex((stage) => this.player.x >= stage.zoneStart && this.player.x < stage.zoneEnd)
    if (nextStage !== -1 && nextStage !== this.stageIndex) {
      this.stageIndex = nextStage
      const runState = this.registry.get('runState') as RunState
      runState.causewayStage = nextStage + 1
      this.registry.set('runState', runState)
      this.stageBanner?.setText(causewayStages[nextStage].label)
      setObjectiveText(causewayStages[nextStage].objective)
      if (this.enemies.length === 0) {
        this.spawnStage(nextStage)
      }
    }

    if (!this.shrineTriggered && this.player.x > 840) {
      this.shrineTriggered = true
      this.handleShrineReward()
    }

    if (this.stageIndex === causewayStages.length - 1 && this.enemies.length === 0) {
      this.finishRun()
    }
  }

  private spawnStage(stageIndex: number) {
    const stage = causewayStages[stageIndex]
    stage.enemies.forEach((kind, index) => {
      const enemy = new Enemy(
        this,
        stage.zoneStart + 190 + index * 56,
        160 + ((index % 3) * 110),
        kind as MinionKind,
        this.enemyProjectiles
      )
      this.enemies.push(enemy)
    })
    const runState = this.registry.get('runState') as RunState
    grantScore(runState, stageIndex === causewayStages.length - 1 ? 1200 : 520)
    this.registry.set('runState', runState)
  }

  private handleShrineReward() {
    const meta = this.registry.get('metaProgress') as MetaProgress
    const runState = this.registry.get('runState') as RunState
    const shrineRelic = (['ember-idol', 'scout-feather', 'glass-lens', 'wardens-heart'] as RelicId[]).find(
      (relicId) => !meta.unlockedRelics.includes(relicId)
    )
    if (shrineRelic) {
      unlockRelic(meta, runState, shrineRelic)
      saveMetaProgress(meta)
      this.registry.set('metaProgress', meta)
      this.registry.set('runState', runState)
      setLoreText(`Causeway shrine unlock: ${shrineRelic}. The second chapter just got sharper.`)
    } else {
      setLoreText('The Causeway shrine reinforces Charlie, but every current relic is already in the pool.')
    }
  }

  private finishRun() {
    const meta = this.registry.get('metaProgress') as MetaProgress
    const runState = this.registry.get('runState') as RunState
    const chapterScore = Math.max(2600, runState.score + 900)
    runState.score = chapterScore
    recordChapterResult(meta, runState, 'causeway', chapterScore)
    const nextModifier = (['ember-tax', 'glass-fragility', 'hunters-mark'] as ChallengeModifierId[]).find(
      (modifierId) => !meta.unlockedChallengeModifiers.includes(modifierId)
    )
    if (nextModifier) unlockChallengeModifier(meta, runState, nextModifier)
    const runRank = recordRunResult(meta, runState)
    saveMetaProgress(meta)
    this.registry.set('metaProgress', meta)
    this.registry.set('runState', runState)
    this.registry.set('resultsRank', runRank)
    this.scene.start('dialogue', {
      lines: 'causeway-outro',
      nextScene: 'results',
      nextData: {},
    })
  }

  private updateRenderState(now: number) {
    const runState = this.registry.get('runState') as RunState
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'causeway',
      flow: 'causeway',
      region: 'causeway',
      chapter: 2,
      inputMode: runState.inputMode,
      seed: runState.seed,
      score: runState.score,
      relics: runState.activeRelics,
      activeModifiers: runState.activeChallengeModifiers,
      player: {
        x: Math.round(this.player.x),
        y: Math.round(this.player.y),
        health: Math.round(this.player.health),
        maxHealth: this.player.maxHealth,
        facing: { x: Number(this.player.facing.x.toFixed(2)), y: Number(this.player.facing.y.toFixed(2)) },
        dashReady: this.player.canDash(now),
        parryReady: this.player.canParry(now),
        pulseReady: this.player.canPulse(now),
        chargeReady: this.player.canCharge(now),
        shieldCharges: this.player.shieldCharges,
      },
      enemies: this.enemies.map((enemy) => ({
        kind: enemy.kind,
        x: Math.round(enemy.x),
        y: Math.round(enemy.y),
        health: enemy.health,
        state: enemy.stateLabel,
      })),
      objective: this.stageIndex >= 0 ? causewayStages[this.stageIndex].objective : 'Enter the Causeway.',
    })
  }

  private drawCauseway() {
    const backdrop = this.add.graphics()
    backdrop.fillGradientStyle(0x251412, 0x341611, 0x0e1114, 0x090d10, 1)
    backdrop.fillRect(0, 0, causewayMap.width, causewayMap.height)

    causewayLandmarks.forEach((landmark) => {
      this.add.rectangle(landmark.x, landmark.y, landmark.width, landmark.height, 0x442922, 0.96).setDepth(2)
    })

    causewayHazards.forEach((hazard) => {
      this.add.circle(hazard.x, hazard.y, hazard.radius + 14, 0xffaf70, 0.09).setDepth(1)
      this.add.circle(hazard.x, hazard.y, hazard.radius, 0xdb5f20, 0.36).setDepth(1)
    })

    this.add.text(38, 484, 'Cinder Causeway', {
      fontFamily: 'Georgia',
      fontSize: '30px',
      color: '#efdbc8',
    })
  }

  private flashCharge() {
    const burst = this.add.circle(this.player.x, this.player.y, this.player.chargeRadius, 0xffbb75, 0.32).setDepth(16)
    this.tweens.add({
      targets: burst,
      alpha: 0,
      scale: 1.4,
      duration: 180,
      onComplete: () => burst.destroy(),
    })
  }
}
