import Phaser from 'phaser'
import { loseSummary } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { createRunState, type RunState } from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setPromptText, setStatusText } from '../../ui/shell'

export class LoseScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key
  private resetKey?: Phaser.Input.Keyboard.Key
  private readonly pad = new GamepadState()

  constructor() {
    super('lose')
  }

  create() {
    const runState = this.registry.get('runState') as RunState
    const checkpointText = runState.checkpoint.unlocked
      ? 'Enter restarts at the boss intro. R restarts the full run.'
      : 'Enter returns to the mission briefing. R hard resets the run state.'

    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'lose',
      encounter: {
        seed: runState.seed,
        wave: runState.currentWave,
        checkpointUnlocked: runState.checkpoint.unlocked,
        selectedBuff: runState.selectedBuff,
        selectedPerk: runState.selectedPerk,
      },
      objective: runState.checkpoint.unlocked ? 'Restart from the boss intro or reset the full run.' : 'Restart the full Lake Pixor run.',
    })

    setStatusText('Charlie was forced out of the breach.')
    setObjectiveText(runState.checkpoint.unlocked ? 'Checkpoint intact. Restart from the boss intro.' : 'Return to the briefing and start a fresh run.')
    setLoreText(loseSummary)
    setHeaderText('Loss does not remove meta progression, but current run state is discarded.')
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South button returns to briefing or checkpoint' : 'Enter returns to briefing or checkpoint')
    audioDirector.playTrack('menu')

    this.add.rectangle(480, 270, 960, 540, 0x12080b, 0.92)
    this.add.text(480, 124, 'Charlie Fell', {
      fontFamily: 'Georgia',
      fontSize: '44px',
      color: '#ffd0c9',
    }).setOrigin(0.5)

    this.add.text(480, 242, loseSummary, {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f3e7e4',
      align: 'center',
      wordWrap: { width: 720 },
      lineSpacing: 10,
    }).setOrigin(0.5)

    this.add.text(480, 422, checkpointText, {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#f5c978',
      align: 'center',
      wordWrap: { width: 760 },
    }).setOrigin(0.5)

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.resetKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.R)
  }

  update() {
    this.pad.sync(this.input.gamepad)
    const runState = this.registry.get('runState') as RunState

    if (this.resetKey && Phaser.Input.Keyboard.JustDown(this.resetKey)) {
      this.registry.set('runState', createRunState(runState.seed))
      this.scene.start('briefing')
      return
    }

    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      if (runState.currentRegion === 'pixor' && runState.checkpoint.unlocked) {
        runState.resumedFromCheckpoint = true
        this.registry.set('runState', runState)
        this.scene.start('game')
      } else {
        this.registry.set('runState', createRunState(runState.seed))
        this.scene.start('briefing')
      }
      return
    }

    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) {
      if (runState.currentRegion === 'pixor' && runState.checkpoint.unlocked) {
        runState.resumedFromCheckpoint = true
        this.registry.set('runState', runState)
        this.scene.start('game')
      } else {
        this.registry.set('runState', createRunState(runState.seed))
        this.scene.start('briefing')
      }
    }
  }
}
