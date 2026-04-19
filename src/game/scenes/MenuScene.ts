import Phaser from 'phaser'
import { menuLore } from '../content/gameText'
import { audioDirector } from '../systems/AudioDirector'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { createRunState, type MetaProgress } from '../state'
import { setHeaderText, setLoreText, setObjectiveText, setProgressText, setPromptText, setRegionText, setStatusText } from '../../ui/shell'

const menuOptions = ['Start Run', 'Controls Layout', 'How to Play', 'Settings'] as const

export class MenuScene extends Phaser.Scene {
  private cursor = 0
  private readonly pad = new GamepadState()
  private entries: Phaser.GameObjects.Text[] = []
  private startKey?: Phaser.Input.Keyboard.Key
  private keys!: Record<'UP' | 'DOWN' | 'ENTER' | 'ESC', Phaser.Input.Keyboard.Key>

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

    setStatusText('Menu ready. Enter the run briefing, controls layout, or settings.')
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

    this.keys = this.input.keyboard!.addKeys('UP,DOWN,ENTER,ESC') as MenuScene['keys']
    this.startKey = this.keys.ENTER

    this.add.image(480, 270, 'fragmented-key-art').setDisplaySize(960, 540).setAlpha(0.54)
    this.add.rectangle(480, 270, 960, 540, 0x04080c, 0.72)
    this.add.rectangle(480, 80, 620, 112, 0x091219, 0.84).setStrokeStyle(2, 0xf5c978, 0.24)
    this.add.rectangle(258, 324, 360, 300, 0x081116, 0.84).setStrokeStyle(1, 0xf5c978, 0.18)
    this.add.rectangle(736, 322, 274, 362, 0x0a1318, 0.64).setStrokeStyle(1, 0xf5c978, 0.12)
    this.add.image(742, 316, 'charlie-turnaround').setDisplaySize(228, 320).setAlpha(0.92)

    this.add.text(480, 48, 'FRAGMENTED', {
      fontFamily: 'Georgia',
      fontSize: '56px',
      fontStyle: 'bold',
      color: '#fff3d0',
      stroke: '#1a2428',
      strokeThickness: 6,
    }).setOrigin(0.5)

    this.add.text(480, 104, 'Warden Aftermath', {
      fontFamily: 'Georgia',
      fontSize: '24px',
      color: '#c5d7da',
      letterSpacing: 3,
    }).setOrigin(0.5)

    this.add.text(258, 186, 'A shadow has broken Lake Pixor.\nCharlie is still following the trail.', {
      fontFamily: 'Georgia',
      fontSize: '20px',
      color: '#edf4ef',
      align: 'center',
      wordWrap: { width: 304 },
      lineSpacing: 8,
    }).setOrigin(0.5)

    this.add.text(
      258,
      248,
      `Best run: ${metaProgress.bestRunRank ?? 'none'}   Score: ${metaProgress.bestRunScore}\nCompleted runs: ${metaProgress.completedRuns}   Relics: ${metaProgress.unlockedRelics.length}`,
      {
        fontFamily: 'Georgia',
        fontSize: '14px',
        color: '#cfddd7',
        align: 'center',
        wordWrap: { width: 304 },
        lineSpacing: 7,
      }
    ).setOrigin(0.5)

    this.add.text(742, 104, 'Charlie Smith', {
      fontFamily: 'Georgia',
      fontSize: '22px',
      color: '#f5c978',
    }).setOrigin(0.5)

    this.add.text(742, 138, 'Hunter of the Prince of Shadows', {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#d8e8e2',
    }).setOrigin(0.5)

    this.add.text(742, 470, 'Break Lake Pixor. Force Breach Road open.\nSurvive the Cinder Causeway.', {
      fontFamily: 'Georgia',
      fontSize: '17px',
      color: '#edf4ef',
      align: 'center',
      wordWrap: { width: 240 },
      lineSpacing: 8,
    }).setOrigin(0.5)

    menuOptions.forEach((label, index) => {
      const text = this.add.text(258, 328 + index * 44, label, {
        fontFamily: 'Georgia',
        fontSize: '25px',
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
    } else if (selected === 'Controls Layout') {
      this.scene.pause()
      this.scene.launch('controls', { returnMode: 'menu' })
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
