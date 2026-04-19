import Phaser from 'phaser'
import { setStatusText } from '../../ui/shell'

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot')
  }

  create() {
    this.buildTextures()
    setStatusText('Assets forged. Press Enter to start.')
    this.scene.start('menu')
  }

  private buildTextures() {
    this.makeCircleTexture('charlie', 24, 0xf2d39b, 0x5f1931)
    this.makeCircleTexture('shade', 18, 0x7869ff, 0x281c5e)
    this.makeCircleTexture('cultist', 18, 0xd6a7ff, 0x59306b)
    this.makeCircleTexture('brute', 24, 0xc06c3d, 0x5e2c16)
    this.makeCircleTexture('warden', 30, 0xffca80, 0x6f300f)
    this.makeCircleTexture('enemy-bolt', 8, 0xf4d7ff, 0x8e3bb4)
    this.makeCircleTexture('boss-bolt', 10, 0xffb366, 0xa14612)
    this.makeRingTexture('pulse-ring', 140, 0xbdefff)
  }

  private makeCircleTexture(key: string, radius: number, fill: number, stroke: number) {
    const gfx = this.add.graphics()
    gfx.fillStyle(fill, 1)
    gfx.lineStyle(4, stroke, 1)
    gfx.fillCircle(radius + 4, radius + 4, radius)
    gfx.strokeCircle(radius + 4, radius + 4, radius)
    gfx.generateTexture(key, radius * 2 + 8, radius * 2 + 8)
    gfx.destroy()
  }

  private makeRingTexture(key: string, radius: number, color: number) {
    const gfx = this.add.graphics()
    gfx.lineStyle(6, color, 0.9)
    gfx.strokeCircle(radius + 6, radius + 6, radius)
    gfx.generateTexture(key, radius * 2 + 12, radius * 2 + 12)
    gfx.destroy()
  }
}
