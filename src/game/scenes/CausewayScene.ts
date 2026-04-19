import Phaser from 'phaser'
import { Enemy, type MinionKind } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { causewayHazards, causewayMap, causewayPlatforms, causewayStages } from '../content/tuning'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { showLevelBanner } from '../systems/LevelBanner'
import { showNarrativeBeat } from '../systems/NarrativeBeat'
import { addParallaxBackdrop, buildPlatforms, drawBranchSigns, drawHazards } from '../systems/SideScrollStage'
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
  private keys!: Record<'A' | 'D' | 'LEFT' | 'RIGHT' | 'UP' | 'W' | 'SPACE' | 'Q' | 'SHIFT' | 'E' | 'C' | 'ESC', Phaser.Input.Keyboard.Key>
  private enemies: Enemy[] = []
  private enemyProjectiles!: Phaser.Physics.Arcade.Group
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private simulationNow = 0
  private stageIndex = -1
  private shrineTriggered = false
  private storyBeatOneShown = false
  private storyBeatTwoShown = false

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
    setObjectiveText('Push through the three Causeway gates and survive the crown encounter.')
    setLoreText('The Causeway is now a full side-scrolling chapter with stacked lanes, heat vents, and branch-heavy movement.')
    setHeaderText('Cinder Causeway escalates the game into a more authored platform-combat chapter with upper/lower route pressure.')
    setRegionText('Chapter 2: Cinder Causeway')
    setProgressText(`Current score ${runState.score} | Relics ${runState.activeRelics.length} | Modifier count ${runState.activeChallengeModifiers.length}`)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'Controller prompts active' : 'Up/W jump, Shift dash, Space slash')
    audioDirector.playTrack('causeway')

    this.physics.world.setBounds(0, 0, causewayMap.width, causewayMap.height)
    this.cameras.main.setBounds(0, 0, causewayMap.width, causewayMap.height)

    this.drawCauseway()
    this.enemyProjectiles = this.physics.add.group()
    this.player = new Player(this, 118, 412, null, null, runState.activeRelics, runState.factionVariant)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.physics.add.collider(this.player, this.platforms)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,UP,W,SPACE,Q,SHIFT,E,C,ESC') as CausewayScene['keys']

    this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, projectile) => {
      const shot = projectile as Phaser.Physics.Arcade.Image
      if (this.player.isParrying() && shot.getData('parryable')) {
        this.playFx('fx-parry-sheet', 'fx-parry', this.player.x, this.player.y - 24, 0.7, 30)
        shot.destroy()
        return
      }
      this.player.receiveDamage(Number(shot.getData('damage') ?? 10), this.simulationNow)
      this.playFx('fx-hit-sheet', 'fx-hit', this.player.x, this.player.y - 24, 0.7, 30)
      shot.destroy()
    })

    showLevelBanner(this, {
      title: 'Cinder Causeway',
      subtitle: 'Chapter 2 · The road burns but it still holds',
      accent: '#ffb67c',
    })
  }

  update(time: number) {
    this.simulationNow = time
    this.pad.sync(this.input.gamepad)
    this.runFrame(time)
  }

  manualAdvance(ms: number) {
    const steps = Math.max(1, Math.round(ms / (1000 / 60)))
    for (let index = 0; index < steps; index += 1) {
      this.simulationNow += 1000 / 60
      this.runFrame(this.simulationNow)
      this.physics.world.singleStep()
    }
  }

  private runFrame(now: number) {
    const horizontal =
      (this.cursors.left?.isDown || this.keys.A.isDown || this.keys.LEFT.isDown ? -1 : 0) +
      (this.cursors.right?.isDown || this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) +
      this.pad.axisX()

    this.player.move(horizontal)
    if ((Phaser.Input.Keyboard.JustDown(this.cursors.up!) || Phaser.Input.Keyboard.JustDown(this.keys.W) || this.pad.justPressed(GamepadButtons.South)) && this.player.jump()) {
      audioDirector.playSfx('dash', 0.45)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.SHIFT) || this.pad.justPressed(GamepadButtons.East)) {
      if (this.player.dash(now, horizontal)) this.playFx('fx-dash-sheet', 'fx-dash', this.player.x - this.player.facing.x * 18, this.player.y - 18, this.player.facing.x < 0 ? -0.82 : 0.82, 29)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.E) || this.pad.justPressed(GamepadButtons.North)) this.player.parry(now)
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) this.player.slash(now, this.enemies)
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q) || this.pad.justPressed(GamepadButtons.West)) this.player.pulse(now, this.enemies)
    if (Phaser.Input.Keyboard.JustDown(this.keys.C) || this.pad.justPressed(GamepadButtons.R1)) this.player.startCharge(now)
    if ((!this.keys.C.isDown && this.player.isCharging(now)) || this.pad.isDown(GamepadButtons.R1) === false) {
      const charge = this.player.releaseCharge(now, this.enemies)
      if (charge.detonated) this.flashCharge()
    }

    this.player.updateState(now)
    this.enemies = this.enemies.filter((enemy) => enemy.active && enemy.health > 0)
    this.enemies.forEach((enemy) => enemy.update(now, this.player))

    causewayHazards.forEach((hazard) => {
      if (this.player.x > hazard.x && this.player.x < hazard.x + hazard.width && this.player.y + 24 > hazard.y) {
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
      setObjectiveText(causewayStages[nextStage].objective)
      showLevelBanner(this, {
        title: causewayStages[nextStage].label,
        subtitle: 'Subsector breach',
        accent: '#ffcf91',
        duration: 1500,
      })
      if (this.enemies.length === 0) this.spawnStage(nextStage)
    }

    if (!this.storyBeatOneShown && this.stageIndex === 1 && this.enemies.length === 0) {
      this.storyBeatOneShown = true
      showNarrativeBeat(this, {
        speaker: 'Archivist of Glass',
        portrait: 'portrait-glass',
        line: 'The mid span is failing in a pattern. Someone ahead is shaping this collapse for you.',
        accent: '#ffcf91',
      })
    }

    if (!this.storyBeatTwoShown && this.stageIndex === 2 && this.player.x > 1640) {
      this.storyBeatTwoShown = true
      showNarrativeBeat(this, {
        speaker: 'Charlie',
        portrait: 'portrait-charlie',
        line: 'Crown span ahead. Good. One more shield comes down tonight.',
        accent: '#ffb67c',
      })
    }

    if (!this.shrineTriggered && this.player.x > 1180) {
      this.shrineTriggered = true
      this.handleShrineReward()
    }

    if (this.stageIndex === causewayStages.length - 1 && this.enemies.length === 0 && this.player.x > 2140) {
      this.finishRun()
    }
  }

  private spawnStage(stageIndex: number) {
    const stage = causewayStages[stageIndex]
    stage.enemies.forEach((kind, index) => {
      const enemy = new Enemy(
        this,
        stage.zoneStart + 210 + index * 82,
        index % 3 === 0 ? 240 : index % 2 === 0 ? 408 : 324,
        kind as MinionKind,
        this.enemyProjectiles
      )
      this.physics.add.collider(enemy, this.platforms)
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
    addParallaxBackdrop(this, 'bg-causeway', causewayMap.width, causewayMap.height)
    this.platforms = buildPlatforms(this, causewayPlatforms, 'causeway', causewayMap.height)
    drawHazards(this, causewayHazards, 'causeway')
    drawBranchSigns(this, [
      { x: 356, y: 330, text: 'Ash Tower Ramp', accent: 0xffcf91 },
      { x: 914, y: 362, text: 'Collapsed Lower Rail', accent: 0xe59f73 },
      { x: 1538, y: 390, text: 'Rift Furnace', accent: 0xffbf8a },
      { x: 2088, y: 210, text: 'Crown Span', accent: 0xffd4a7 },
    ])
  }

  private flashCharge() {
    this.playFx('fx-charge-sheet', 'fx-charge', this.player.x, this.player.y - 18, 0.8, 16)
  }

  private playFx(sheetKey: string, animKey: string, x: number, y: number, scale: number, depth: number) {
    const fx = this.add.sprite(x, y, sheetKey, 0).setScale(scale).setDepth(depth)
    fx.play(animKey)
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy())
  }
}
