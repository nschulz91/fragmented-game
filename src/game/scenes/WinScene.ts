import Phaser from 'phaser'
import { bossOutroLines } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { setHeaderText, setLoreText, setObjectiveText, setPromptText, setStatusText } from '../../ui/shell'

export class WinScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key
  private readonly pad = new GamepadState()

  constructor() {
    super('win')
  }

  create() {
    const runState = this.registry.get('runState')
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'win',
      flow: 'win',
      encounter: {
        seed: runState.seed,
        wave: runState.currentWave,
        checkpointUnlocked: runState.checkpoint.unlocked,
        selectedBuff: runState.selectedBuff,
        selectedPerk: runState.selectedPerk,
      },
      objective: 'Lake Pixor is secure. Return to menu to start another run.',
    })
    setStatusText('Victory confirmed.')
    setObjectiveText('Lake Pixor is clear. The route toward the Cinder Causeway is now live.')
    setLoreText(bossOutroLines.map((line) => line.line).join(' '))
    setHeaderText('Legacy win screen. The main milestone flow now routes through reward, route, and results scenes instead.')
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South button returns to menu' : 'Enter returns to menu')
    audioDirector.playTrack('menu')

    this.add.rectangle(480, 270, 960, 540, 0x061117, 0.9)
    this.add.text(480, 118, 'Lake Pixor Held', {
      fontFamily: 'Georgia',
      fontSize: '46px',
      color: '#fff1be',
    }).setOrigin(0.5)

    this.add.text(480, 254, bossOutroLines.map((line) => `${line.speaker}: ${line.line}`).join('\n\n'), {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#e4f4ed',
      align: 'center',
      wordWrap: { width: 720 },
      lineSpacing: 12,
    }).setOrigin(0.5)

    this.add.text(480, 446, 'Press Enter or the south button to return to menu.', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#f5c978',
    }).setOrigin(0.5)

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) this.scene.start('menu')
    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) this.scene.start('menu')
  }
}
