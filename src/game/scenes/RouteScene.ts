import Phaser from 'phaser'
import { Enemy, type MinionKind } from '../entities/Enemy'
import { Player } from '../entities/Player'
import { routeEncounter, routeHazards, routeLandmarks, routeMap } from '../content/tuning'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { grantScore, saveMetaProgress, unlockRelic, type MetaProgress, type RelicId, type RunState } from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setRegionText, setStatusText } from '../../ui/shell'

export class RouteScene extends Phaser.Scene {
  private player!: Player
  private readonly pad = new GamepadState()
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private keys!: Record<'W' | 'A' | 'S' | 'D' | 'SPACE' | 'Q' | 'SHIFT' | 'E' | 'C' | 'ESC', Phaser.Input.Keyboard.Key>
  private enemies: Enemy[] = []
  private enemyProjectiles!: Phaser.Physics.Arcade.Group
  private shrine!: Phaser.GameObjects.Image
  private shrineActivated = false
  private routeEncounterCleared = false
  private simulationNow = 0

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
    setObjectiveText('Reach the eastern gate, activate the shrine, and survive the route encounter.')
    setLoreText('The road between chapters is narrow, broken, and already under watch.')
    setHeaderText('Breach Road is a medium transition segment: traversal, shrine interaction, and one Causeway preview encounter.')
    setRegionText('Transition: Breach Road')
    setProgressText(`Current relics ${runState.activeRelics.length} | Score ${runState.score}`)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'Use the left stick and south button' : 'WASD moves, combat kit still active')
    audioDirector.playTrack('route')

    this.physics.world.setBounds(0, 0, routeMap.width, routeMap.height)
    this.cameras.main.setBounds(0, 0, routeMap.width, routeMap.height)

    this.drawRoute()
    this.enemyProjectiles = this.physics.add.group()
    this.player = new Player(this, 120, 420, null, null, runState.activeRelics, runState.factionVariant)
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08)

    this.cursors = this.input.keyboard!.createCursorKeys()
    this.keys = this.input.keyboard!.addKeys('W,A,S,D,SPACE,Q,SHIFT,E,C,ESC') as RouteScene['keys']

    this.physics.add.overlap(this.player, this.enemyProjectiles, (_player, projectile) => {
      const shot = projectile as Phaser.Physics.Arcade.Image
      if (this.player.isParrying() && shot.getData('parryable')) {
        shot.destroy()
        return
      }
      this.player.receiveDamage(Number(shot.getData('damage') ?? 10), this.simulationNow)
      shot.destroy()
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
    if (Phaser.Input.Keyboard.JustDown(this.keys.SPACE) || this.pad.justPressed(GamepadButtons.South)) {
      this.player.slash(now, this.enemies)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.Q) || this.pad.justPressed(GamepadButtons.West)) {
      this.player.pulse(now, this.enemies)
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.C) || this.pad.justPressed(GamepadButtons.R1)) {
      this.player.startCharge(now)
    }
    if ((!this.keys.C.isDown && this.player.isCharging(now)) || this.pad.isDown(GamepadButtons.R1) === false) {
      const charge = this.player.releaseCharge(now, this.enemies)
      if (charge.detonated) this.flashCharge()
    }

    this.player.updateState(now)
    this.enemies = this.enemies.filter((enemy) => enemy.active)
    this.enemies.forEach((enemy) => enemy.update(now, this.player))

    routeHazards.forEach((hazard) => {
      if (Phaser.Math.Distance.Between(this.player.x, this.player.y, hazard.x, hazard.y) < hazard.radius) {
        this.player.receiveDamage(0.4, now)
      }
    })

    if (!this.routeEncounterCleared && this.enemies.length === 0) {
      this.routeEncounterCleared = true
      grantScore(this.registry.get('runState'), 360)
      setStatusText('Route encounter cleared. The shrine line is safe for a moment.')
      setObjectiveText('Touch the shrine to stabilize the path, then continue east.')
    }

    if (this.routeEncounterCleared && !this.shrineActivated && Phaser.Math.Distance.Between(this.player.x, this.player.y, this.shrine.x, this.shrine.y) < 42) {
      this.activateShrine()
    }

    if (this.shrineActivated && this.player.x > routeMap.width - 110) {
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
    setStatusText('Shrine activated. The route is stable enough to continue.')
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
      const enemy = new Enemy(this, 760 + index * 48, index % 2 === 0 ? 194 : 386, kind, this.enemyProjectiles)
      this.enemies.push(enemy)
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

  private drawRoute() {
    const backdrop = this.add.graphics()
    backdrop.fillGradientStyle(0x201713, 0x281915, 0x0f1516, 0x091013, 1)
    backdrop.fillRect(0, 0, routeMap.width, routeMap.height)

    routeLandmarks.forEach((landmark) => {
      this.add.rectangle(landmark.x, landmark.y, landmark.width, landmark.height, 0x3e2c27, 0.96).setDepth(2)
    })

    routeHazards.forEach((hazard) => {
      this.add.circle(hazard.x, hazard.y, hazard.radius + 12, 0xffb06d, 0.08).setDepth(1)
      this.add.circle(hazard.x, hazard.y, hazard.radius, 0xca5b22, 0.34).setDepth(1)
    })

    this.shrine = this.add.image(980, 126, 'shrine').setScale(1.8).setDepth(8)
    this.add.text(60, 484, 'Breach Road', {
      fontFamily: 'Georgia',
      fontSize: '28px',
      color: '#ead9bf',
    })
    this.add.text(routeMap.width - 120, 66, 'Cinder Causeway', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#f5c978',
    })
  }
}

function relicCatalogLabel(relicId: RelicId) {
  if (relicId === 'glass-lens') return 'Glass Lens'
  if (relicId === 'scout-feather') return 'Scout Feather'
  if (relicId === 'ember-idol') return 'Ember Idol'
  return 'Warden Heart'
}
