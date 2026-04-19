import Phaser from 'phaser'
import { causewayChapterCard, pixorChapterCard, routeChapterCard } from '../content/gameText'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { setHeaderText, setLoreText, setObjectiveText, setPromptText, setRegionText, setStatusText } from '../../ui/shell'

type ChapterCardId = 'pixor' | 'route' | 'causeway'

export class ChapterCardScene extends Phaser.Scene {
  private readonly pad = new GamepadState()
  private enterKey?: Phaser.Input.Keyboard.Key
  private nextScene = 'dialogue'
  private nextData: unknown

  constructor() {
    super('chapter-card')
  }

  init(data?: { card?: ChapterCardId; nextScene?: string; nextData?: unknown }) {
    this.nextScene = data?.nextScene ?? 'dialogue'
    this.nextData = data?.nextData
    this.registry.set('chapterCardId', data?.card ?? 'pixor')
  }

  create() {
    const cardId = (this.registry.get('chapterCardId') ?? 'pixor') as ChapterCardId
    const card = cardId === 'causeway' ? causewayChapterCard : cardId === 'route' ? routeChapterCard : pixorChapterCard
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'chapter-card',
      flow: 'chapter-card',
      region: cardId === 'route' ? 'breach-road' : cardId,
      chapter: cardId === 'causeway' ? 2 : 1,
    })
    setStatusText(`${card.title}: ${card.subtitle}`)
    setObjectiveText(card.body)
    setLoreText(card.body)
    setHeaderText('Chapter cards mark the route transition and lock the next scene in the run sequence.')
    setRegionText(card.subtitle)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South button continues' : 'Enter continues')

    this.add.rectangle(480, 270, 960, 540, 0x050c10, 0.95)
    this.add.text(480, 172, card.title, {
      fontFamily: 'Georgia',
      fontSize: '30px',
      color: '#f5c978',
    }).setOrigin(0.5)
    this.add.text(480, 236, card.subtitle, {
      fontFamily: 'Georgia',
      fontSize: '54px',
      color: '#fff0cc',
    }).setOrigin(0.5)
    this.add.text(480, 322, card.body, {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#dce7e2',
      align: 'center',
      wordWrap: { width: 700 },
      lineSpacing: 12,
    }).setOrigin(0.5)
    this.add.text(480, 454, 'Press Enter or the south button to continue.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d5dfda',
    }).setOrigin(0.5)

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) this.finish()
    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) this.finish()
  }

  private finish() {
    this.scene.start(this.nextScene, this.nextData as Record<string, unknown> | undefined)
  }
}
