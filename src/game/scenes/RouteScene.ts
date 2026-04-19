import Phaser from 'phaser'
import { Enemy, type MinionKind } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { routeEncounter, routeHazards, routeMap, routePlatforms } from '../content/tuning'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { showLevelBanner } from '../systems/LevelBanner'
import { showNarrativeBeat } from '../systems/NarrativeBeat'
import { addParallaxBackdrop, buildPlatforms, drawBranchSigns, drawHazards } from '../systems/SideScrollStage'
import { grantScore, saveMetaProgress, unlockRelic, type MetaProgress, type RelicId, type RunState } from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setRegionText, setStatusText } from '../../ui/shell'

export class RouteScene extends Phaser.Scene {
  private player!: Player
  private readonly pad = new GamepadState()
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'A' | 'D' | 'LEFT' | 'RIGHT' | 'UP' | 'W' | 'SPACE' | 'Q' | 'SHIFT' | 'E' | 'C' | 'ESC', Phaser.Input.Keyboard.Key>
  private enemies: Enemy[] = []
  private enemyProjectiles!: Phaser.Physics.Arcade.Group
  private platforms!: Phaser.Physics.Arcade.StaticGroup
  private shrine!: Phaser.GameObjects.Image
  private shrineActivated = false
  private routeEncounterCleared = false
  private simulationNow = 0
  private routeBeatShown = false

  constructor() {
    super('route')
  }

  create() {
    const runState = this.registry.get('runState') as RunState
    runState.currentRegion = 'breach-road'
    runState.currentFlow = 'route'
    this.registry.set('runState', runState)
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'route',
      flow: 'route',
      region: 'breach-road',
      chapter: 1,
      score: runState.score,
      relics: runState.activeRelics,
      activeModifiers: runState.activeChallengeModifiers,
    })

    setStatusText('Breach Road open.')
    setObjectiveText('Choose a branch, stabilize the shrine, and survive the route encounter.')
    setLoreText('The road now splits into a high watchline and a low broken causeway before converging at the eastern gate.')
    setHeaderText('Breach Road is now a side-scrolling transition with real branch choices, shrine interaction, and a Causeway preview fight.')
    setRegionText('Transition: Breach Road')
    setProgressText(`Current relics ${runState.activeRelics.length} | Score ${runState.score}`)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South jump, East dash, right shoulder charge' : 'Up/W jump, Shift dash, C charge')
    audioDirector.playTrack('route')

    this.physics.world.setBounds(0, 0, routeMap.width, routeMap.height)
    this.cameras.main.setBounds(0, 0, routeMap.width, routeMap.height)

    this.drawRoute()
    this.enemyProjectiles = this.physics.add.group()
    this.player = new Player(this, 120, 410, null, null, runState.activeRelics, runState.factionVariant)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)
    this.physics.add.collider(this.player, this.platforms)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('A,D,LEFT,RIGHT,UP,W,SPACE,Q,SHIFT,E,C,ESC') as RouteScene['keys']

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
      title: 'Breach Road',
      subtitle: 'Transition · Hold the split path to the east',
      accent: '#b8ddff',
    })

    this.spawnEncounter()
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

    routeHazards.forEach((hazard) => {
      if (this.player.x > hazard.x && this.player.x < hazard.x + hazard.width && this.player.y + 24 > hazard.y) {
        this.player.receiveDamage(0.4, now)
      }
    })

    if (!this.routeEncounterCleared && this.enemies.length === 0) {
      this.routeEncounterCleared = true
      grantScore(this.registry.get('runState'), 360)
      setStatusText('Route encounter cleared. The split path is stable for a moment.')
      setObjectiveText('Touch the shrine, then head east into the Causeway gate.')
      if (!this.routeBeatShown) {
        this.routeBeatShown = true
        showNarrativeBeat(this, {
          speaker: 'Scout Runner',
          portrait: 'portrait-scout',
          line: 'The split held. Shrine first, then the Causeway gate before the road closes again.',
          accent: '#b8ddff',
        })
      }
    }

    if (this.routeEncounterCleared && !this.shrineActivated && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shrine.x, this.shrine.y) < 52) {
      this.activateShrine()
    }

    if (this.shrineActivated && this.player.x > routeMap.width - 160) {
      this.scene.start('chapter-card', {
        card: 'causeway',
        nextScene: 'dialogue',
        nextData: { lines: 'causeway-intro', nextScene: 'causeway', nextData: {} },
      })
    }

    if (this.player.health <= 0) {
      this.scene.start('lose')
    }

    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'route',
      flow: 'route',
      region: 'breach-road',
      chapter: 1,
      score: (this.registry.get('runState') as RunState).score,
      relics: (this.registry.get('runState') as RunState).activeRelics,
      activeModifiers: (this.registry.get('runState') as RunState).activeChallengeModifiers,
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
      objective: this.shrineActivated ? 'Reach the eastern gate.' : this.routeEncounterCleared ? 'Approach the shrine.' : 'Clear the route encounter.',
    })
  }

  private activateShrine() {
    if (this.shrineActivated) return
    this.shrineActivated = true
    const meta = this.registry.get('metaProgress') as MetaProgress
    const runState = this.registry.get('runState') as RunState
    runState.routeShrineUsed = true
    this.player.restoreAfterChapterClear()
    const shrineRelic = (['glass-lens', 'scout-feather', 'ember-idol'] as RelicId[]).find((relicId) => !meta.unlockedRelics.includes(relicId))
    if (shrineRelic) unlockRelic(meta, runState, shrineRelic)
    saveMetaProgress(meta)
    this.registry.set('metaProgress', meta)
    this.registry.set('runState', runState)
    setStatusText('Shrine activated. The eastern path is stable.')
    setObjectiveText('Push east into the Cinder Causeway.')
    setLoreText(shrineRelic ? `Shrine relic unlocked: ${relicCatalogLabel(shrineRelic)}.` : 'The shrine steadies the road, but all shrine relics are already unlocked.')
  }

  private spawnEncounter() {
    const kinds: MinionKind[] = [
      ...Array(routeEncounter.shades).fill('shade'),
      ...Array(routeEncounter.embermages).fill('embermage'),
      ...Array(routeEncounter.ashhounds).fill('ashhound'),
    ] as MinionKind[]
    kinds.forEach((kind, index) => {
      const enemy = new Enemy(this, 880 + index * 132, index % 2 === 0 ? 250 : index % 3 === 0 ? 338 : 408, kind, this.enemyProjectiles)
      this.physics.add.collider(enemy, this.platforms)
      this.enemies.push(enemy)
    })
  }

  private flashCharge() {
    this.playFx('fx-charge-sheet', 'fx-charge', this.player.x, this.player.y - 18, 0.8, 16)
  }

  private drawRoute() {
    addParallaxBackdrop(this, 'bg-route', routeMap.width, routeMap.height)
    this.platforms = buildPlatforms(this, routePlatforms, 'route', routeMap.height)
    drawHazards(this, routeHazards, 'route')
    drawBranchSigns(this, [
      { x: 418, y: 324, text: 'Watchline High Path', accent: 0xccdbf3 },
      { x: 1020, y: 356, text: 'Broken Lower Causeway', accent: 0xffbf7b },
      { x: 1308, y: 270, text: 'Shrine Spur', accent: 0xa8f2d7 },
      { x: 1700, y: 250, text: 'Causeway Gate', accent: 0xffd0a4 },
    ])
    this.shrine = this.add.image(1340, 228, 'shrine').setScale(0.92).setDepth(18)
  }

  private playFx(sheetKey: string, animKey: string, x: number, y: number, scale: number, depth: number) {
    const fx = this.add.sprite(x, y, sheetKey, 0).setScale(scale).setDepth(depth)
    fx.play(animKey)
    fx.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => fx.destroy())
  }
}

function relicCatalogLabel(relicId: RelicId) {
  if (relicId === 'glass-lens') return 'Glass Lens'
  if (relicId === 'scout-feather') return 'Scout Feather'
  if (relicId === 'ember-idol') return 'Ember Idol'
  return 'Warden Heart'
}
