import Phaser from 'phaser'
import { briefingLines, factionVariantLabels, modifierLabels, relicLabels } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import {
  createRunState,
  getScoreMultiplier,
  type ChallengeModifierId,
  type FactionVariantId,
  type MetaProgress,
  type RelicId,
} from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setStatusText } from '../../ui/shell'

const rows = ['Faction Variant', 'Equipped Relic', 'Challenge Modifier', 'Deploy'] as const

export class BriefingScene extends Phaser.Scene {
  private cursor = 0
  private readonly pad = new GamepadState()
  private items: Phaser.GameObjects.Text[] = []
  private keys!: Record<'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ENTER' | 'ESC', Phaser.Input.Keyboard.Key>
  private factionIndex = 0
  private relicIndex = 0
  private modifierIndex = 0
  private factionIds: FactionVariantId[] = ['house-veyra', 'order-of-glass', 'pixor-scouts']
  private relicIds: Array<RelicId | null> = [null]
  private modifierIds: Array<ChallengeModifierId | null> = [null]

  constructor() {
    super('briefing')
  }

  create() {
    const meta = this.registry.get('metaProgress') as MetaProgress
    this.factionIds = meta.factionVariantsUnlocked
    this.relicIds = [null, ...meta.unlockedRelics]
    this.modifierIds = [null, ...meta.unlockedChallengeModifiers]

    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'briefing',
      flow: 'briefing',
      region: 'pixor',
      chapter: 1,
      seed: this.registry.get('runState')?.seed,
      inputMode: this.registry.get('inputMode') ?? 'keyboard',
      relics: meta.unlockedRelics,
      activeModifiers: meta.unlockedChallengeModifiers,
      score: meta.bestRunScore,
      rank: meta.bestRunRank,
    })

    setStatusText('Run briefing active.')
    setObjectiveText('Choose a faction variant, an equipped relic, and an optional challenge modifier.')
    setLoreText(briefingLines.join(' '))
    setHeaderText('Briefing locks the run seed, modifier, faction rules, and opening relic before Chapter 1 begins.')
    setProgressText(
      `Unlocked relics ${meta.unlockedRelics.length} | Unlocked modifiers ${meta.unlockedChallengeModifiers.length} | Highest region ${meta.highestRegionUnlocked}`
    )
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'D-pad changes rows, South deploys' : 'Arrow keys adjust, Enter deploys')
    audioDirector.playTrack('menu')

    this.keys = this.input.keyboard!.addKeys('UP,DOWN,LEFT,RIGHT,ENTER,ESC') as BriefingScene['keys']

    this.add.image(480, 270, 'fragmented-key-art').setDisplaySize(960, 540).setAlpha(0.28)
    this.add.rectangle(480, 270, 960, 540, 0x081117, 0.84)
    this.add.rectangle(316, 272, 506, 430, 0x0b1419, 0.86).setStrokeStyle(1, 0xf5c978, 0.18)
    this.add.rectangle(760, 270, 246, 396, 0x0b1419, 0.72).setStrokeStyle(1, 0xf5c978, 0.14)
    this.add.image(760, 308, 'charlie-fullbody').setDisplaySize(224, 336).setAlpha(0.98)

    this.add.text(316, 70, 'Mission Briefing', {
      fontFamily: 'Georgia',
      fontSize: '36px',
      color: '#fff0cc',
    }).setOrigin(0.5)

    this.add.text(316, 138, 'Choose your faction rule, one relic, and an optional modifier before Charlie enters Lake Pixor.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#e1ece8',
      align: 'center',
      wordWrap: { width: 404 },
      lineSpacing: 8,
    }).setOrigin(0.5)

    rows.forEach((_row, index) => {
      const text = this.add.text(316, 230 + index * 58, '', {
        fontFamily: 'Georgia',
        fontSize: '19px',
        color: '#d8e8e2',
        wordWrap: { width: 404 },
        align: 'left',
      }).setOrigin(0.5)
      this.items.push(text)
    })

    this.add.text(316, 478, 'Left/Right adjusts. Enter deploys. Esc returns to menu.', {
      fontFamily: 'Georgia',
      fontSize: '16px',
      color: '#d5dfda',
      align: 'center',
    }).setOrigin(0.5)

    this.add.text(760, 102, 'Charlie Smith', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f5c978',
    }).setOrigin(0.5)

    this.add.text(760, 136, 'Deploying into Lake Pixor with the current run loadout.', {
      fontFamily: 'Georgia',
      fontSize: '14px',
      color: '#d8e8e2',
      align: 'center',
      wordWrap: { width: 198 },
      lineSpacing: 6,
    }).setOrigin(0.5)

    this.add.text(760, 470, 'This choice locks the chapter rules for the run.\nPick a clean loadout and go.', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#e7efe9',
      align: 'center',
      wordWrap: { width: 198 },
      lineSpacing: 7,
    }).setOrigin(0.5)

    this.render()
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (this.pad.axisX() !== 0 || this.pad.axisY() !== 0 || this.pad.justPressed(GamepadButtons.South)) {
      this.registry.set('inputMode', 'controller')
      setPromptText('D-pad changes rows, South deploys')
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.UP) || this.pad.justPressed(GamepadButtons.DpadUp)) {
      this.registry.set('inputMode', 'keyboard')
      setPromptText('Arrow keys adjust, Enter deploys')
      this.cursor = Phaser.Math.Wrap(this.cursor - 1, 0, rows.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.DOWN) || this.pad.justPressed(GamepadButtons.DpadDown)) {
      this.registry.set('inputMode', 'keyboard')
      setPromptText('Arrow keys adjust, Enter deploys')
      this.cursor = Phaser.Math.Wrap(this.cursor + 1, 0, rows.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.LEFT) || this.pad.justPressed(GamepadButtons.DpadLeft)) this.adjust(-1)
    if (Phaser.Input.Keyboard.JustDown(this.keys.RIGHT) || this.pad.justPressed(GamepadButtons.DpadRight)) this.adjust(1)
    if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.scene.start('menu')
    if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) {
      if (this.cursor === rows.length - 1) {
        this.deploy()
      } else {
        this.cursor = rows.length - 1
        this.render()
      }
    }
  }

  private adjust(direction: -1 | 1) {
    if (this.cursor === 0) this.factionIndex = Phaser.Math.Wrap(this.factionIndex + direction, 0, this.factionIds.length)
    if (this.cursor === 1) this.relicIndex = Phaser.Math.Wrap(this.relicIndex + direction, 0, this.relicIds.length)
    if (this.cursor === 2) this.modifierIndex = Phaser.Math.Wrap(this.modifierIndex + direction, 0, this.modifierIds.length)
    this.render()
  }

  private deploy() {
    const baseRunState = createRunState(this.registry.get('runState')?.seed)
    const selectedRelic = this.relicIds[this.relicIndex]
    const selectedModifier = this.modifierIds[this.modifierIndex]
    baseRunState.currentFlow = 'briefing'
    baseRunState.mode = 'briefing'
    baseRunState.currentRegion = 'pixor'
    baseRunState.currentChapter = 1
    baseRunState.inputMode = this.registry.get('inputMode') ?? 'keyboard'
    baseRunState.factionVariant = this.factionIds[this.factionIndex]
    baseRunState.equippedRelic = selectedRelic
    baseRunState.activeRelics = selectedRelic ? [selectedRelic] : []
    baseRunState.activeChallengeModifiers = selectedModifier ? [selectedModifier] : []
    baseRunState.scoreMultiplier = getScoreMultiplier(baseRunState.activeChallengeModifiers, baseRunState.factionVariant)
    this.registry.set('runState', baseRunState)
    this.scene.start('chapter-card', {
      card: 'pixor',
      nextScene: 'dialogue',
      nextData: { lines: 'pixor-intro', nextScene: 'game', nextData: { region: 'pixor' } },
    })
  }

  private render() {
    const factionId = this.factionIds[this.factionIndex]
    const relicId = this.relicIds[this.relicIndex]
    const modifierId = this.modifierIds[this.modifierIndex]
    const scoreMultiplier = getScoreMultiplier(modifierId ? [modifierId] : [], factionId)

    this.items[0].setText(`${this.cursor === 0 ? '› ' : ''}Faction Variant\n${factionVariantLabels[factionId]}`)
    this.items[1].setText(
      `${this.cursor === 1 ? '› ' : ''}Equipped Relic\n${relicId ? relicLabels[relicId] : 'None'}`
    )
    this.items[2].setText(
      `${this.cursor === 2 ? '› ' : ''}Challenge Modifier\n${modifierId ? modifierLabels[modifierId] : 'None'}`
    )
    this.items[3].setText(`${this.cursor === 3 ? '› ' : ''}Deploy Run\nScore multiplier x${scoreMultiplier}`)

    this.items.forEach((item, index) => item.setColor(index === this.cursor ? '#f5c978' : '#d8e8e2'))
  }
}
