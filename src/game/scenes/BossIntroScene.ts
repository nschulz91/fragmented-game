import Phaser from 'phaser'
import { bossIntroLines } from '../content/gameText'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { setHeaderText, setLoreText, setObjectiveText, setPromptText, setStatusText } from '../../ui/shell'

export class BossIntroScene extends Phaser.Scene {
  private readonly pad = new GamepadState()
  private enterKey?: Phaser.Input.Keyboard.Key

  constructor() {
    super('boss-intro')
  }

  create() {
    const runState = this.registry.get('runState')
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'boss-intro',
      flow: 'boss-intro',
      encounter: {
        seed: runState.seed,
        wave: runState.currentWave,
        checkpointUnlocked: runState.checkpoint.unlocked,
        selectedBuff: runState.selectedBuff,
        selectedPerk: runState.selectedPerk,
      },
      objective: 'Enter the breach and start the Warden fight.',
    })
    setStatusText('Boss breach imminent.')
    setObjectiveText('Hold your selection, enter the breach, and break the Warden of Pixor.')
    setLoreText('The warden is the final lock between Lake Pixor and the Cinder Causeway.')
    setHeaderText('Boss card transitions from checkpoint loadout selection into the Warden fight.')
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South button starts the fight' : 'Enter starts the fight')
    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.add.rectangle(480, 270, 960, 540, 0x050b10, 0.9)
    this.add.text(480, 96, 'Warden Intercept', {
      fontFamily: 'Georgia',
      fontSize: '40px',
      color: '#fff0cc',
    }).setOrigin(0.5)

    this.add.text(
      480,
      238,
      bossIntroLines.map((line) => `${line.speaker}: ${line.line}`).join('\n\n'),
      {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#e1efe7',
      align: 'center',
      wordWrap: { width: 700 },
      lineSpacing: 10,
    }
    ).setOrigin(0.5)

    this.add.text(480, 444, 'Press Enter or the south button to start the boss phase.', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#f5c978',
    }).setOrigin(0.5)
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.finish()
    }
    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) {
      this.finish()
    }
  }

  private finish() {
    this.scene.stop()
    const gameScene = this.scene.get('game') as { beginBossPhase?: () => void }
    gameScene.beginBossPhase?.()
  }
}
