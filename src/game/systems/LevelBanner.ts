import Phaser from 'phaser'

export function showLevelBanner(
  scene: Phaser.Scene,
  config: { title: string; subtitle?: string; accent?: string; duration?: number }
) {
  const duration = config.duration ?? 2100
  const accent = Phaser.Display.Color.HexStringToColor(config.accent ?? '#f5c978').color
  const container = scene.add.container(480, 62).setScrollFactor(0).setDepth(210).setAlpha(0)

  const plate = scene.add.rectangle(0, 0, 424, 78, 0x081116, 0.92)
  plate.setStrokeStyle(2, accent, 0.32)
  const plateGlow = scene.add.rectangle(0, 0, 392, 54, accent, 0.06)
  const title = scene.add.text(0, -8, config.title, {
    fontFamily: 'Georgia',
    fontSize: '30px',
    color: '#fff0cc',
    stroke: '#091116',
    strokeThickness: 4,
  }).setOrigin(0.5)
  const subtitle = scene.add.text(0, 18, config.subtitle ?? '', {
    fontFamily: 'Georgia',
    fontSize: '14px',
    color: '#d9e8df',
    letterSpacing: 2,
  }).setOrigin(0.5)

  container.add([plate, plateGlow, title, subtitle])
  container.y = 24

  scene.tweens.add({
    targets: container,
    y: 62,
    alpha: 1,
    duration: 260,
    ease: 'Cubic.Out',
  })

  scene.time.delayedCall(duration, () => {
    scene.tweens.add({
      targets: container,
      y: 34,
      alpha: 0,
      duration: 280,
      ease: 'Cubic.In',
      onComplete: () => container.destroy(),
    })
  })

  return container
}
