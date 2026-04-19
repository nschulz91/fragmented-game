import './style.css'
import Phaser from 'phaser'
import { gameConfig } from './game/config'
import { mountShell, setLoreText, setObjectiveText, setStatusText } from './ui/shell'

mountShell()
setStatusText('Booting Parxillia...')
setObjectiveText('Survive the Lake Pixor combat trial and reach the Prince of Shadows.')
setLoreText(
  'Charlie Smith is tracking the force that stole his brother. Lake Pixor is the first hard proof that the Shadow Court is already hunting him.'
)

const game = new Phaser.Game({
  ...gameConfig,
  parent: 'game-container',
})

window.addEventListener('beforeunload', () => {
  game.destroy(true)
})
