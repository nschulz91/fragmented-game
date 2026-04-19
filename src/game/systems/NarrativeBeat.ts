import Phaser from 'phaser'

export function showNarrativeBeat(
  scene: Phaser.Scene,
  config: {
    speaker: string
    line: string
    portrait: string
    accent?: string
    duration?: number
  }
) {
  const duration = config.duration ?? 3200
  const accent = Phaser.Display.Color.HexStringToColor(config.accent ?? '#f5c978').color
  const container = scene.add.container(220, 426).setScrollFactor(0).setDepth(214).setAlpha(0)

  const plate = scene.add.rectangle(0, 0, 396, 112, 0x071116, 0.94)
  plate.setStrokeStyle(2, accent, 0.26)
  const portrait = scene.add.image(-150, 0, config.portrait).setDisplaySize(76, 90)
  const speaker = scene.add.text(-94, -30, config.speaker, {
    fontFamily: 'Georgia',
    fontSize: '18px',
    color: '#f5c978',
  }).setOrigin(0, 0.5)
  const line = scene.add.text(-94, 8, config.line, {
    fontFamily: 'Georgia',
    fontSize: '16px',
    color: '#dce7e2',
    wordWrap: { width: 250 },
    lineSpacing: 6,
  }).setOrigin(0, 0.5)

  container.add([plate, portrait, speaker, line])
  container.x = 180

  scene.tweens.add({
    targets: container,
    x: 220,
    alpha: 1,
    duration: 220,
    ease: 'Cubic.Out',
  })

  scene.time.delayedCall(duration, () => {
    scene.tweens.add({
      targets: container,
      x: 188,
      alpha: 0,
      duration: 260,
      ease: 'Cubic.In',
      onComplete: () => container.destroy(),
    })
  })

  return container
}
