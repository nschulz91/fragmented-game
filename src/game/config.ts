import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { MenuScene } from './scenes/MenuScene'
import { BriefingScene } from './scenes/BriefingScene'
import { ChapterCardScene } from './scenes/ChapterCardScene'
import { DialogueScene } from './scenes/DialogueScene'
import { ControlsScene } from './scenes/ControlsScene'
import { InstructionScene } from './scenes/InstructionScene'
import { SettingsScene } from './scenes/SettingsScene'
import { CheckpointScene } from './scenes/CheckpointScene'
import { BossIntroScene } from './scenes/BossIntroScene'
import { RewardScene } from './scenes/RewardScene'
import { RouteScene } from './scenes/RouteScene'
import { GameScene } from './scenes/GameScene'
import { CausewayScene } from './scenes/CausewayScene'
import { PauseScene } from './scenes/PauseScene'
import { WinScene } from './scenes/WinScene'
import { LoseScene } from './scenes/LoseScene'
import { ResultsScene } from './scenes/ResultsScene'

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
      gravity: { x: 0, y: 1600 },
      debug: false,
    },
  },
  scene: [
    BootScene,
    MenuScene,
    BriefingScene,
    ChapterCardScene,
    DialogueScene,
    ControlsScene,
    InstructionScene,
    SettingsScene,
    CheckpointScene,
    BossIntroScene,
    RewardScene,
    RouteScene,
    GameScene,
    CausewayScene,
    PauseScene,
    WinScene,
    LoseScene,
    ResultsScene,
  ],
  render: {
    pixelArt: false,
    antialias: true,
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
}
