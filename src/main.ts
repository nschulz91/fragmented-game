import './style.css'
import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { audioDirector } from './game/systems/AudioDirector'
import type { SettingsState } from './game/state'
import { saveSettings } from './game/state'
import { mountShell } from './ui/shell'

mountShell()

const game = new Phaser.Game({
  ...gameConfig,
  parent: 'game-container',
})

declare global {
  interface Window {
    __fragmentedGame?: Phaser.Game
    render_game_to_text?: () => string
    advanceTime?: (ms: number) => void
  }
}

window.__fragmentedGame = game
window.render_game_to_text = () => JSON.stringify(game.registry.get('renderState') ?? {})
window.advanceTime = (ms: number) => {
  const scene =
    (game.scene.getScene('game') as { manualAdvance?: (stepMs: number) => void } | undefined) ??
    (game.scene.getScene('causeway') as { manualAdvance?: (stepMs: number) => void } | undefined) ??
    (game.scene.getScene('route') as { manualAdvance?: (stepMs: number) => void } | undefined)
  scene?.manualAdvance?.(ms)
}

window.addEventListener('keydown', (event) => {
  if (event.repeat || event.key.toLowerCase() !== 'm') return
  const settings = game.registry.get('settings') as SettingsState | undefined
  if (!settings) return
  const nextSettings = {
    ...settings,
    muted: !settings.muted,
  }
  game.registry.set('settings', nextSettings)
  saveSettings(nextSettings)
  audioDirector.syncSettings()
})

const suspendAudioIfHidden = () => {
  if (document.visibilityState === 'hidden') {
    audioDirector.suspend()
  }
}

document.addEventListener('visibilitychange', suspendAudioIfHidden)
window.addEventListener('pagehide', () => {
  audioDirector.shutdown()
})

window.addEventListener('beforeunload', () => {
  audioDirector.shutdown()
  game.destroy(true)
})
