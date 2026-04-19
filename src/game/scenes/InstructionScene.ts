import Phaser from 'phaser'
import { instructionLines, namedFactions } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { setHeaderText, setLoreText, setObjectiveText, setPromptText, setStatusText } from '../../ui/shell'

export class InstructionScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key
  private readonly pad = new GamepadState()

  constructor() {
    super('instructions')
  }

  create() {
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'instructions',
      flow: 'instructions',
    })
    setStatusText('How-to-play screen active.')
    setObjectiveText('Review the full two-chapter kit before entering the run briefing.')
    setLoreText(
      `Allied traces remain from ${namedFactions.join(', ')}. Faction variants, relics, and challenge modifiers all feed into the same chapter run now.`
    )
    setHeaderText('This screen is for controls only. Actual run setup happens in the mission briefing scene.')
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South button opens briefing' : 'Enter opens briefing')
    audioDirector.playTrack('menu')

    this.add.rectangle(480, 270, 960, 540, 0x09141a, 0.86)
    this.add.text(480, 84, 'Mission Brief', {
      fontFamily: 'Georgia',
      fontSize: '42px',
      color: '#fff4d3',
    }).setOrigin(0.5)

    this.add.text(480, 212, instructionLines.join('\n\n'), {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#e1ece8',
      align: 'center',
      wordWrap: { width: 740 },
      lineSpacing: 12,
    }).setOrigin(0.5)

    this.add.text(480, 374, `Faction support available: ${namedFactions.join(' · ')}`, {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d2ddd5',
      align: 'center',
      wordWrap: { width: 760 },
    }).setOrigin(0.5)

    this.add.text(480, 448, 'Press Enter or the south button to open the mission briefing.', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f5c978',
    }).setOrigin(0.5)

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) {
      this.scene.start('briefing')
    }
    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) {
      this.scene.start('briefing')
    }
  }
}
