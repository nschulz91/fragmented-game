import Phaser from 'phaser'
import { resultsSummary } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { type MetaProgress, type RunState } from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setStatusText } from '../../ui/shell'

export class ResultsScene extends Phaser.Scene {
  private enterKey?: Phaser.Input.Keyboard.Key
  private readonly pad = new GamepadState()

  constructor() {
    super('results')
  }

  create() {
    const runState = this.registry.get('runState') as RunState
    const meta = this.registry.get('metaProgress') as MetaProgress
    const runRank = this.registry.get('resultsRank') as string
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'results',
      flow: 'results',
      region: 'causeway',
      chapter: 2,
      score: runState.score,
      rank: runRank,
      relics: runState.activeRelics,
      activeModifiers: runState.activeChallengeModifiers,
    })
    setStatusText('Run results ready.')
    setObjectiveText('Review rank, unlocked systems, and return to menu for another run.')
    setLoreText(resultsSummary)
    setHeaderText('Results summarize both chapter scores, final run rank, newly unlocked relics/modifiers, and meta-best progress.')
    setProgressText(`Best ${meta.bestRunRank ?? 'none'} | Score ${meta.bestRunScore} | Completed runs ${meta.completedRuns}`)
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South button returns to menu' : 'Enter returns to menu')
    audioDirector.playTrack('menu')

    this.add.rectangle(480, 270, 960, 540, 0x071015, 0.94)
    this.add.text(480, 92, 'Run Complete', {
      fontFamily: 'Georgia',
      fontSize: '42px',
      color: '#fff0cc',
    }).setOrigin(0.5)
    this.add.text(480, 144, `Final rank ${runRank}   |   Score ${runState.score}`, {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#f5c978',
    }).setOrigin(0.5)
    this.add.text(480, 228, resultsSummary, {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#dbe7e1',
      align: 'center',
      wordWrap: { width: 760 },
      lineSpacing: 12,
    }).setOrigin(0.5)
    this.add.text(
      480,
      344,
      `Pixor ${runState.chapterRanks.pixor ?? '-'}  |  Causeway ${runState.chapterRanks.causeway ?? '-'}\nUnlocked relics this run: ${
        runState.unlockedRelicsThisRun.length || 'none'
      }\nUnlocked modifiers this run: ${runState.unlockedModifiersThisRun.length || 'none'}`,
      {
        fontFamily: 'Georgia',
        fontSize: '20px',
        color: '#e1ece8',
        align: 'center',
        wordWrap: { width: 720 },
        lineSpacing: 10,
      }
    ).setOrigin(0.5)
    this.add.text(480, 460, 'Press Enter or the south button to return to menu.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d5dfda',
    }).setOrigin(0.5)

    this.enterKey = this.input.keyboard?.addKey(Phaser.Input.Keyboard.KeyCodes.ENTER)
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (this.enterKey && Phaser.Input.Keyboard.JustDown(this.enterKey)) this.scene.start('menu')
    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) this.scene.start('menu')
  }
}
