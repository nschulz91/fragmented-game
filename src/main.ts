import './style.css'
import Phaser from 'phaser'
import { gameConfig } from './game/config'
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

window.addEventListener('beforeunload', () => {
  game.destroy(true)
})
