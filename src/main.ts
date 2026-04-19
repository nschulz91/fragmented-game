import './style.css'
import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { audioDirector } from './game/systems/AudioDirector'
import { mountShell } from './ui/shell'

mountShell()

const game = new Phaser.Game({
  ...gameConfig,
  parent: 'game-container',
})

declare global {
  interface Window {
    __fragmentedGame?: Phaser.Game
  }
}

window.__fragmentedGame = game

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
