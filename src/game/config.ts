import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { InstructionScene } from './scenes/InstructionScene'
import { SettingsScene } from './scenes/SettingsScene'
import { CheckpointScene } from './scenes/CheckpointScene'
import { BossIntroScene } from './scenes/BossIntroScene'
import { GameScene } from './scenes/GameScene'
import { PauseScene } from './scenes/PauseScene'
import { WinScene } from './scenes/WinScene'
import { LoseScene } from './scenes/LoseScene'

export const VIEWPORT_WIDTH = 960
export const VIEWPORT_HEIGHT = 540

export const gameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: VIEWPORT_WIDTH,
  height: VIEWPORT_HEIGHT,
  backgroundColor: '#091116',
  input: {
    gamepad: true,
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },
  scene: [BootScene, MenuScene, InstructionScene, SettingsScene, CheckpointScene, BossIntroScene, GameScene, PauseScene, WinScene, LoseScene],
  render: {
    pixelArt: false,
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}

