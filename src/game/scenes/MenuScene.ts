import Phaser from 'phaser'
import { menuLore } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { createRunState, type MetaProgress } from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setRegionText, setStatusText } from '../../ui/shell'

const menuOptions = ['Start Run', 'How to Play', 'Settings'] as const

export class MenuScene extends Phaser.Scene {
  private cursor = 0
  private readonly pad = new GamepadState()
  private entries: Phaser.GameObjects.Text[] = []
  private startKey?: Phaser.Input.Keyboard.Key
  private keys!: Record<'UP' | 'DOWN' | 'ENTER', Phaser.Input.Keyboard.Key>

  constructor() {
    super('menu')
  }

  create() {
    const metaProgress = this.registry.get('metaProgress') as MetaProgress
    const runState = createRunState(this.registry.get('runState')?.seed ?? 'pixor-v2-default')
    this.registry.set('runState', runState)
    this.registry.set('renderState', {
      mode: 'menu',
      flow: 'menu',
      region: 'pixor',
      chapter: 1,
      seed: runState.seed,
      inputMode: this.registry.get('inputMode') ?? 'keyboard',
      coordinateSystem: 'origin=(0,0) top-left, +x right, +y down',
      encounter: {
        seed: runState.seed,
        wave: 1,
        checkpointUnlocked: false,
        selectedBuff: null,
        selectedPerk: null,
      },
      relics: metaProgress.unlockedRelics,
      activeModifiers: metaProgress.unlockedChallengeModifiers,
      score: metaProgress.bestRunScore,
      rank: metaProgress.bestRunRank,
    })

    setStatusText('Menu ready. Enter the run briefing, controls, or settings.')
    setObjectiveText('Prepare a two-chapter run through Lake Pixor, Breach Road, and the Cinder Causeway.')
    setLoreText(menuLore.join(' '))
    setHeaderText('Persistent relic unlocks, challenge modifiers, faction variants, and run ranking are now part of the route.')
    setRegionText(
      metaProgress.highestRegionUnlocked === 'causeway'
        ? 'Highest unlocked region: Cinder Causeway'
        : 'Highest unlocked region: Lake Pixor'
    )
    setProgressText(
      `Relics ${metaProgress.unlockedRelics.length} | Modifiers ${metaProgress.unlockedChallengeModifiers.length} | Best ${
        metaProgress.bestRunRank ?? 'none'
      }`
    )
    setPromptText((this.registry.get('inputMode') ?? 'keyboard') === 'controller' ? 'South button confirms' : 'Enter confirms')
    audioDirector.playTrack('menu')

    this.keys = this.input.keyboard!.addKeys('UP,DOWN,ENTER') as MenuScene['keys']
    this.startKey = this.keys.ENTER

    this.add.rectangle(480, 270, 960, 540, 0x061015, 0.72)
    this.add.text(480, 84, 'Fragmented', {
      fontFamily: 'Georgia',
      fontSize: '52px',
      color: '#fff1ca',
    }).setOrigin(0.5)

    this.add.text(480, 154, 'Warden Aftermath', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#bfd3d8',
    }).setOrigin(0.5)

    this.add.text(480, 250, menuLore.join('\n\n'), {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#ebf3ee',
      align: 'center',
      wordWrap: { width: 710 },
      lineSpacing: 10,
    }).setOrigin(0.5)

    this.add.text(
      480,
      350,
      `Best run: ${metaProgress.bestRunRank ?? 'none'}   |   Best score: ${metaProgress.bestRunScore}   |   Completed runs: ${metaProgress.completedRuns}`,
      {
        fontFamily: 'Georgia',
        fontSize: '18px',
        color: '#d9e8df',
      }
    ).setOrigin(0.5)

    menuOptions.forEach((label, index) => {
      const text = this.add.text(480, 408 + index * 34, label, {
        fontFamily: 'Georgia',
        fontSize: '24px',
        color: '#d8e8e2',
      }).setOrigin(0.5)
      text.setInteractive({ useHandCursor: true }).on('pointerdown', () => {
        this.cursor = index
        this.confirm()
      })
      this.entries.push(text)
    })

    this.render()
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (this.pad.axisX() !== 0 || this.pad.axisY() !== 0 || this.pad.justPressed(GamepadButtons.South)) {
      this.registry.set('inputMode', 'controller')
      setPromptText('South button confirms')
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.UP) || this.pad.justPressed(GamepadButtons.DpadUp)) {
      this.registry.set('inputMode', 'keyboard')
      setPromptText('Enter confirms')
      this.cursor = Phaser.Math.Wrap(this.cursor - 1, 0, menuOptions.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.DOWN) || this.pad.justPressed(GamepadButtons.DpadDown)) {
      this.registry.set('inputMode', 'keyboard')
      setPromptText('Enter confirms')
      this.cursor = Phaser.Math.Wrap(this.cursor + 1, 0, menuOptions.length)
      this.render()
    }
    if (this.startKey && Phaser.Input.Keyboard.JustDown(this.startKey)) this.confirm()
    if (this.pad.justPressed(GamepadButtons.South) || this.pad.justPressed(GamepadButtons.Start)) this.confirm()
  }

  private confirm() {
    const selected = menuOptions[this.cursor]
    if (selected === 'Start Run') {
      this.scene.start('briefing')
    } else if (selected === 'How to Play') {
      this.scene.start('instructions')
    } else {
      this.scene.start('settings', { from: 'menu' })
    }
  }

  private render() {
    this.entries.forEach((entry, index) => {
      const active = index === this.cursor
      entry.setText(`${active ? '› ' : ''}${menuOptions[index]}`).setColor(active ? '#f5c978' : '#d8e8e2')
    })
  }
}
