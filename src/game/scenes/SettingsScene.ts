import Phaser from 'phaser'
import { GamepadButtons, GamepadState } from '../systems/GamepadState'
import { audioDirector } from '../systems/AudioDirector'
import { saveSettings, type SettingsState } from '../state'
import { setLoreText, setObjectiveText, setStatusText } from '../../ui/shell'

const options = [
  { key: 'masterVolume', label: 'Master volume', step: 0.05 },
  { key: 'musicVolume', label: 'Music volume', step: 0.05 },
  { key: 'sfxVolume', label: 'SFX volume', step: 0.05 },
  { key: 'muted', label: 'Mute', step: 1 },
  { key: 'fullscreen', label: 'Fullscreen', step: 1 },
] as const

export class SettingsScene extends Phaser.Scene {
  private cursor = 0
  private readonly pad = new GamepadState()
  private texts: Phaser.GameObjects.Text[] = []
  private keys!: Record<'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'ENTER' | 'ESC' | 'F' | 'M', Phaser.Input.Keyboard.Key>
  private originScene = 'menu'

  constructor() {
    super('settings')
  }

  init(data?: { from?: string }) {
    this.originScene = data?.from ?? 'menu'
  }

  create() {
    this.registry.set('renderState', {
      ...(this.registry.get('renderState') ?? {}),
      mode: 'settings',
    })
    setStatusText('Settings panel active.')
    setObjectiveText('Tune audio and fullscreen before returning to the breach.')
    setLoreText('Order of Glass tuning notes suggest calm levels before a boss-phase shift.')
    audioDirector.playTrack('menu')

    this.keys = this.input.keyboard!.addKeys('UP,DOWN,LEFT,RIGHT,ENTER,ESC,F,M') as SettingsScene['keys']
    this.add.rectangle(480, 270, 960, 540, 0x091218, 0.96)
    this.add.text(480, 84, 'Settings', { fontFamily: 'Georgia', fontSize: '40px', color: '#fff0cc' }).setOrigin(0.5)

    options.forEach((_option, index) => {
      const text = this.add.text(480, 170 + index * 72, '', {
        fontFamily: 'Georgia',
        fontSize: '26px',
        color: '#d8e8e2',
      }).setOrigin(0.5)
      this.texts.push(text)
    })

    this.add.text(480, 462, 'Left/Right adjusts. M toggles mute. Enter or Esc returns. F toggles fullscreen.', {
      fontFamily: 'Georgia',
      fontSize: '18px',
      color: '#d2ddd5',
      align: 'center',
    }).setOrigin(0.5)

    this.render()
  }

  update() {
    this.pad.sync(this.input.gamepad)
    if (Phaser.Input.Keyboard.JustDown(this.keys.UP) || this.pad.justPressed(GamepadButtons.DpadUp)) {
      this.cursor = Phaser.Math.Wrap(this.cursor - 1, 0, options.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.DOWN) || this.pad.justPressed(GamepadButtons.DpadDown)) {
      this.cursor = Phaser.Math.Wrap(this.cursor + 1, 0, options.length)
      this.render()
    }
    if (Phaser.Input.Keyboard.JustDown(this.keys.LEFT)) this.adjust(-1)
    if (Phaser.Input.Keyboard.JustDown(this.keys.RIGHT)) this.adjust(1)
    if (this.pad.justPressed(GamepadButtons.DpadLeft)) this.adjust(-1)
    if (this.pad.justPressed(GamepadButtons.DpadRight)) this.adjust(1)
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) this.toggleMute()
    if (Phaser.Input.Keyboard.JustDown(this.keys.F)) this.toggleFullscreen()
    if (
      Phaser.Input.Keyboard.JustDown(this.keys.ENTER) ||
      Phaser.Input.Keyboard.JustDown(this.keys.ESC) ||
      this.pad.justPressed(GamepadButtons.South) ||
      this.pad.justPressed(GamepadButtons.Start)
    ) {
      this.scene.start(this.originScene)
    }
  }

  private adjust(direction: -1 | 1) {
    const settings = { ...(this.registry.get('settings') as SettingsState) }
    const option = options[this.cursor]
    if (option.key === 'fullscreen') {
      this.toggleFullscreen()
      return
    }
    if (option.key === 'muted') {
      this.toggleMute()
      return
    }
    const current = settings[option.key] as number
    settings[option.key] = Phaser.Math.Clamp(current + option.step * direction, 0, 1)
    this.registry.set('settings', settings)
    saveSettings(settings)
    audioDirector.syncSettings()
    audioDirector.playSfx('pulse', 0.5)
    this.render()
  }

  private toggleFullscreen() {
    if (this.scale.isFullscreen) this.scale.stopFullscreen()
    else this.scale.startFullscreen()
    const settings = { ...(this.registry.get('settings') as SettingsState), fullscreen: this.scale.isFullscreen }
    this.registry.set('settings', settings)
    saveSettings(settings)
    audioDirector.playSfx('warning', 0.8)
    this.render()
  }

  private toggleMute() {
    const settings = { ...(this.registry.get('settings') as SettingsState), muted: !(this.registry.get('settings') as SettingsState).muted }
    this.registry.set('settings', settings)
    saveSettings(settings)
    audioDirector.syncSettings()
    if (!settings.muted) audioDirector.playSfx('pulse', 0.4)
    this.render()
  }

  private render() {
    const settings = this.registry.get('settings') as SettingsState
    options.forEach((option, index) => {
      const active = index === this.cursor
      const text =
        option.key === 'fullscreen'
          ? `${option.label}: ${this.scale.isFullscreen ? 'On' : 'Off'}`
          : option.key === 'muted'
            ? `${option.label}: ${settings.muted ? 'On' : 'Off'}`
          : `${option.label}: ${Math.round((settings[option.key as keyof SettingsState] as number) * 100)}%`
      this.texts[index]
        .setText(`${active ? '› ' : ''}${text}`)
        .setColor(active ? '#f5c978' : '#d8e8e2')
    })
  }
}
