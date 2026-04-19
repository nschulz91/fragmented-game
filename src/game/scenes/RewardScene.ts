import Phaser from 'phaser'
import { modifierLabels, relicLabels } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import {
  challengeModifierCatalog,
  recordChapterResult,
  relicCatalog,
  saveMetaProgress,
  unlockChallengeModifier,
  unlockRelic,
  type ChallengeModifierId,
  type MetaProgress,
  type RelicId,
  type RunState,
} from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setStatusText } from '../../ui/shell'

export class RewardScene extends Phaser.Scene {
  private readonly pad = new GamepadState()
  private keys!: Record<'LEFT' | 'RIGHT' | 'ENTER', Phaser.Input.Keyboard.Key>
  private entries: Phaser.GameObjects.Text[] = []
  private cursor = 0
  private relicChoices: RelicId[] = []
  private unlockedModifier?: ChallengeModifierId

  constructor() {
    super('reward')
  }

  create() {
    const meta = this.registry.get('metaProgress') as MetaProgress
    const runState = this.registry.get('runState') as RunState
    this.relicChoices = (Object.keys(relicCatalog) as RelicId[])
      .filter((relicId) => !meta.unlockedRelics.includes(relicId))
      .slice(0, 2)
    if (this.relicChoices.length < 2) {
      this.relicChoices = (Object.keys(relicCatalog) as RelicId[]).slice(0, 2)
    }
    this.unlockedModifier = (Object.keys(challengeModifierCatalog) as ChallengeModifierId[]).find(
      (modifierId) => !meta.unlockedChallengeModifiers.includes(modifierId)
    )

    const pixorScore = Math.max(1600, runState.score + 450)
    const pixorRank = recordChapterResult(meta, runState, 'pixor', pixorScore)
    runState.score = pixorScore
    runState.currentFlow = 'reward'
    this.registry.set('runState', runState)
    saveMetaProgress(meta)

    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'reward',
      flow: 'reward',
      region: 'pixor',
      chapter: 1,
      relics: meta.unlockedRelics,
      activeModifiers: runState.activeChallengeModifiers,
      score: runState.score,
      rank: pixorRank,
    })

    setStatusText('Reward room stabilized.')
    setObjectiveText('Choose one relic from the Warden cache and carry it into Breach Road.')
    setLoreText(
      this.unlockedModifier
        ? `Lake Pixor rank ${pixorRank}. New modifier unlocked: ${modifierLabels[this.unlockedModifier]}.`
        : `Lake Pixor rank ${pixorRank}. All current modifiers are already unlocked.`
    )
    setHeaderText('The reward room converts the Chapter 1 victory into permanent progression and a stronger second half of the run.')
    setProgressText(`Chapter 1 rank ${pixorRank} | Score ${runState.score} | Modifier unlock ${this.unlockedModifier ? 'yes' : 'none'}`)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'Left/right choose, South confirms' : 'Left/right choose, Enter confirms')
    audioDirector.playTrack('menu')

    this.keys = this.input.keyboard!.addKeys('LEFT,RIGHT,ENTER') as RewardScene['keys']

    this.add.rectangle(480, 270, 960, 540, 0x0a1116, 0.94)
    this.add.text(480, 82, 'Warden Cache', {
      fontFamily: 'Georgia',
      fontSize: '42px',
      color: '#fff0cc',
    }).setOrigin(0.5)
    this.add.text(480, 136, `Lake Pixor cleared. Rank ${pixorRank}.`, {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#d9e8df',
    }).setOrigin(0.5)

    this.relicChoices.forEach((_relicId, index) => {
      const x = 280 + index * 400
      this.add.rectangle(x, 292, 292, 240, 0x121d24, 0.96).setStrokeStyle(2, 0xf5c978, 0.2)
      this.add.image(x, 212, 'relic-core').setScale(1.4)
      const text = this.add.text(x, 302, '', {
        fontFamily: 'Georgia',
        fontSize: '22px',
        color: '#d8e8e2',
        align: 'center',
        wordWrap: { width: 250 },
      }).setOrigin(0.5)
      this.entries.push(text)
    })

    if (this.unlockedModifier) {
      this.add.text(480, 470, `Modifier unlocked: ${modifierLabels[this.unlockedModifier]}  |  ${challengeModifierCatalog[this.unlockedModifier].description}`, {
        fontFamily: 'Georgia',
        fontSize: '16px',
        color: '#d5dfda',
        align: 'center',
        wordWrap: { width: 820 },
      }).setOrigin(0.5)
    }

    this.render()
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (Phaser.Input.Keyboard.JustDown(this.keys.LEFT) || this.pad.justPressed(GamepadButtons.DpadLeft)) {
      this.cursor = Phaser.Math.Wrap(this.cursor - 1, 0, this.relicChoices.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.RIGHT) || this.pad.justPressed(GamepadButtons.DpadRight)) {
      this.cursor = Phaser.Math.Wrap(this.cursor + 1, 0, this.relicChoices.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.ENTER) || this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) {
      this.confirm()
    }
  }

  private confirm() {
    const meta = this.registry.get('metaProgress') as MetaProgress
    const runState = this.registry.get('runState') as RunState
    const selectedRelic = this.relicChoices[this.cursor]
    unlockRelic(meta, runState, selectedRelic)
    runState.equippedRelic = selectedRelic
    if (this.unlockedModifier) unlockChallengeModifier(meta, runState, this.unlockedModifier)
    saveMetaProgress(meta)
    this.registry.set('metaProgress', meta)
    this.registry.set('runState', runState)
    this.scene.start('dialogue', {
      lines: 'reward-room',
      nextScene: 'chapter-card',
      nextData: {
        card: 'route',
        nextScene: 'dialogue',
        nextData: { lines: 'route', nextScene: 'route', nextData: {} },
      },
    })
  }

  private render() {
    this.entries.forEach((entry, index) => {
      const relicId = this.relicChoices[index]
      const active = index === this.cursor
      entry.setText(`${active ? '› ' : ''}${relicLabels[relicId]}\n${relicCatalog[relicId].description}`).setColor(active ? '#f5c978' : '#d8e8e2')
    })
  }
}
