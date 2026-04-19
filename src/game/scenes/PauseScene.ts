import Phaser from 'phaser'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { createRunState } from '../state'
import { setStatusText } from '../../ui/shell'

const pauseOptions = ['Resume', 'Restart from Checkpoint', 'Restart Run', 'Quit to Menu'] as const
type ConfirmAction = 'restart-run' | 'quit-menu' | null

export class PauseScene extends Phaser.Scene {
  private cursor = 0
  private readonly pad = new GamepadState()
  private items: Phaser.GameObjects.Text[] = []
  private confirmText?: Phaser.GameObjects.Text
  private confirmAction: ConfirmAction = null
  private keys!: Record<'UP' | 'DOWN' | 'ENTER' | 'ESC', Phaser.Input.Keyboard.Key>

  constructor() {
    super('pause')
  }

  create() {
    const runState = this.registry.get('runState')
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'pause',
      encounter: {
        seed: runState.seed,
        wave: runState.currentWave,
        checkpointUnlocked: runState.checkpoint.unlocked,
        selectedBuff: runState.selectedBuff,
        selectedPerk: runState.selectedPerk,
      },
    })
    setStatusText('Run paused.')
    this.keys = this.input.keyboard!.addKeys('UP,DOWN,ENTER,ESC') as PauseScene['keys']
    this.add.rectangle(480, 270, 960, 540, 0x020608, 0.7)
    this.add.rectangle(480, 270, 440, 320, 0x09151b, 0.95).setStrokeStyle(2, 0xf5c978, 0.25)
    this.add.text(480, 146, 'Paused', { fontFamily: 'Georgia', fontSize: '38px', color: '#fff0cc' }).setOrigin(0.5)
    pauseOptions.forEach((label, index) => {
      const text = this.add.text(480, 218 + index * 46, label, {
        fontFamily: 'Georgia',
        fontSize: '24px',
        color: '#d4e0dc',
      }).setOrigin(0.5)
      this.items.push(text)
    })
    this.confirmText = this.add.text(480, 428, '', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#f5c978',
      align: 'center',
      wordWrap: { width: 360 },
    }).setOrigin(0.5)
    this.render()
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (Phaser.Input.Keyboard.JustDown(this.keys.UP) || this.pad.justPressed(GamepadButtons.DpadUp)) {
      this.cursor = Phaser.Math.Wrap(this.cursor - 1, 0, pauseOptions.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.DOWN) || this.pad.justPressed(GamepadButtons.DpadDown)) {
      this.cursor = Phaser.Math.Wrap(this.cursor + 1, 0, pauseOptions.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) {
      if (this.confirmAction) {
        this.confirmAction = null
        this.render()
        return
      }
      this.resumeRun()
      return
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) {
      const label = pauseOptions[this.cursor]
      const runState = this.registry.get('runState')
      if (label === 'Resume') {
        this.resumeRun()
      } else if (label === 'Restart from Checkpoint') {
        if (runState.currentRegion === 'pixor' && runState.checkpoint.unlocked) {
          runState.resumedFromCheckpoint = true
          this.registry.set('runState', runState)
          this.stopCurrentGameplayScene()
          this.scene.stop()
          this.scene.start('game')
        } else {
          this.confirmAction = 'restart-run'
          this.render()
        }
      } else if (label === 'Restart Run') {
        if (this.confirmAction === 'restart-run') {
          this.registry.set('runState', { ...createRunState(runState.seed), seed: runState.seed })
          this.stopCurrentGameplayScene()
          this.scene.stop()
          this.scene.start('briefing')
        } else {
          this.confirmAction = 'restart-run'
          this.render()
        }
      } else {
        if (this.confirmAction === 'quit-menu') {
          this.registry.set('runState', createRunState(runState.seed))
          this.stopCurrentGameplayScene()
          this.scene.stop()
          this.scene.start('menu')
        } else {
          this.confirmAction = 'quit-menu'
          this.render()
        }
      }
    }
  }

  private resumeRun() {
    const runState = this.registry.get('runState')
    const targetScene = runState.currentRegion === 'causeway' ? 'causeway' : runState.currentRegion === 'breach-road' ? 'route' : 'game'
    this.scene.resume(targetScene)
    this.scene.stop()
  }

  private stopCurrentGameplayScene() {
    const runState = this.registry.get('runState')
    const targetScene = runState.currentRegion === 'causeway' ? 'causeway' : runState.currentRegion === 'breach-road' ? 'route' : 'game'
    this.scene.stop(targetScene)
  }

  private render() {
    this.items.forEach((item, index) => {
      const active = index === this.cursor
      item.setText(`${active ? '› ' : ''}${pauseOptions[index]}`).setColor(active ? '#f5c978' : '#d4e0dc')
    })
    if (this.confirmText) {
      this.confirmText.setText(
        this.confirmAction === 'restart-run'
          ? 'Press Enter again to reset the full run.\nEsc cancels.'
          : this.confirmAction === 'quit-menu'
            ? 'Press Enter again to abandon the run and return to menu.\nEsc cancels.'
            : ''
      )
    }
  }
}
