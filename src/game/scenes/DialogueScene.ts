import Phaser from 'phaser'
import {
  bossIntroLines,
  bossOutroLines,
  causewayIntroDialogue,
  causewayOutroDialogue,
  pixorDialogue,
  rewardRoomLines,
  routeDialogue,
} from '../content/gameText'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { setHeaderText, setLoreText, setObjectiveText, setPromptText, setStatusText } from '../../ui/shell'

type DialogueId = 'pixor-intro' | 'boss-intro' | 'boss-outro' | 'reward-room' | 'route' | 'causeway-intro' | 'causeway-outro'

type DialogueLine = {
  speaker: string
  portrait: string
  line: string
}

export class DialogueScene extends Phaser.Scene {
  private readonly pad = new GamepadState()
  private enterKey?: Phaser.Input.Keyboard.Key
  private lines: DialogueLine[] = []
  private index = 0
  private nextScene = 'game'
  private nextData: unknown
  private portrait?: Phaser.GameObjects.Image
  private speakerText?: Phaser.GameObjects.Text
  private bodyText?: Phaser.GameObjects.Text

  constructor() {
    super('dialogue')
  }

  init(data?: { lines?: DialogueId; nextScene?: string; nextData?: unknown }) {
    this.lines = resolveDialogue(data?.lines ?? 'pixor-intro')
    this.nextScene = data?.nextScene ?? 'game'
    this.nextData = data?.nextData
    this.index = 0
  }

  create() {
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'dialogue',
      flow: 'dialogue',
    })
    setStatusText('Dialogue card active.')
    setObjectiveText('Advance through the scene to continue the run.')
    setLoreText(this.lines.map((line) => `${line.speaker}: ${line.line}`).join(' '))
    setHeaderText('Portrait cards carry chapter framing, reward-room beats, and the route setup.')
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South button advances dialogue' : 'Enter advances dialogue')

    this.add.rectangle(480, 270, 960, 540, 0x060d11, 0.96)
    this.add.rectangle(168, 270, 180, 236, 0x111c22, 0.95).setStrokeStyle(2, 0xf5c978, 0.3)
    this.add.rectangle(608, 270, 476, 236, 0x0f171d, 0.95).setStrokeStyle(2, 0xcfdcd6, 0.16)

    this.portrait = this.add.image(168, 270, this.lines[0].portrait).setDisplaySize(128, 148)
    this.speakerText = this.add.text(370, 188, '', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f5c978',
    })
    this.bodyText = this.add.text(370, 232, '', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#e1ece8',
      wordWrap: { width: 408 },
      lineSpacing: 12,
    })

    this.add.text(480, 462, 'Press Enter or the south button to continue.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d5dfda',
    }).setOrigin(0.5)

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
    this.renderLine()
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) this.advance()
    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) this.advance()
  }

  private advance() {
    if (this.index < this.lines.length - 1) {
      this.index += 1
      this.renderLine()
      return
    }
    this.scene.start(this.nextScene, this.nextData as Record<string, unknown> | undefined)
  }

  private renderLine() {
    const line = this.lines[this.index]
    this.portrait?.setTexture(line.portrait)
    this.speakerText?.setText(line.speaker)
    this.bodyText?.setText(line.line)
  }
}

function resolveDialogue(id: DialogueId): DialogueLine[] {
  if (id === 'boss-intro') return bossIntroLines
  if (id === 'boss-outro') return bossOutroLines
  if (id === 'reward-room') return rewardRoomLines
  if (id === 'route') return routeDialogue
  if (id === 'causeway-intro') return causewayIntroDialogue
  if (id === 'causeway-outro') return causewayOutroDialogue
  return pixorDialogue
}
