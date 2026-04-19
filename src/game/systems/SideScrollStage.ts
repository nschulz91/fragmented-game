import Phaser from 'phaser'

type PlatformDef = { x: number; y: number; width: number; height: number; branch: string }
type HazardDef = { x: number; y: number; width: number; height: number; type: 'water' | 'fire' }
type StageTheme = 'pixor' | 'route' | 'causeway'

export function addParallaxBackdrop(scene: Phaser.Scene, key: string, width: number, height: number, _title?: string) {
  const sky = scene.add.image(width * 0.5, height * 0.5, key).setDisplaySize(width, height).setScrollFactor(0.2, 0.05).setDepth(-20)
  const haze = scene.add.rectangle(width * 0.5, height * 0.48, width, height * 0.62, 0x081014, 0.18).setScrollFactor(0.4, 0.15).setDepth(-18)
  const farColumns = scene.add.graphics().setScrollFactor(0.55, 0.2).setDepth(-16)
  farColumns.fillStyle(0x10161f, 0.35)
  for (let index = 0; index < 8; index += 1) {
    farColumns.fillRoundedRect(80 + index * (width / 7), 210 + (index % 3) * 26, 56 + (index % 2) * 18, 240 + (index % 4) * 28, 12)
  }
  const midground = scene.add.graphics().setScrollFactor(0.72, 0.3).setDepth(-12)
  midground.fillStyle(0x0b1118, 0.24)
  for (let index = 0; index < 12; index += 1) {
    const x = 40 + index * (width / 10)
    midground.fillRoundedRect(x, 290 + ((index + 1) % 3) * 28, 82 + (index % 4) * 18, 180 + (index % 5) * 18, 16)
  }
  const foregroundMist = scene.add.graphics().setScrollFactor(0.92, 0.55).setDepth(5)
  foregroundMist.fillStyle(0xcfdccf, 0.05)
  foregroundMist.fillEllipse(width * 0.22, height - 42, width * 0.26, 42)
  foregroundMist.fillEllipse(width * 0.62, height - 34, width * 0.34, 48)

  return { sky, haze, farColumns, midground, foregroundMist }
}

export function buildPlatforms(scene: Phaser.Scene, platforms: PlatformDef[], theme: StageTheme, worldHeight: number) {
  const group = scene.physics.add.staticGroup()
  paintGroundBands(scene, platforms, theme, worldHeight)
  platforms.forEach((platform) => {
    const slab = scene.add.rectangle(platform.x, platform.y, platform.width, platform.height, 0x2c2a30, 0.98).setOrigin(0, 0).setDepth(10)
    const cap = scene.add.rectangle(platform.x + 6, platform.y + 5, platform.width - 12, platform.height - 10, branchColor(platform.branch), 0.92).setOrigin(0, 0).setDepth(11)
    const tileKey = themeTileKey(theme)
    const tile = scene.add.tileSprite(platform.x + platform.width * 0.5, platform.y + platform.height * 0.5, platform.width - 6, platform.height - 6, tileKey).setDepth(11.5)
    tile.setAlpha(0.78)
    scene.add.rectangle(platform.x, platform.y, platform.width, 5, 0xe1d3b1, 0.22).setOrigin(0, 0).setDepth(12)
    paintPlatformFace(scene, platform)
    paintPlatformProps(scene, platform, theme)
    group.add(slab)
    group.add(cap)
  })
  return group
}

export function drawHazards(scene: Phaser.Scene, hazards: HazardDef[], theme: StageTheme) {
  hazards.forEach((hazard) => {
    const fill = hazard.type === 'water' ? 0x2fb8aa : 0xff7a36
    const glow = hazard.type === 'water' ? 0x89fff1 : 0xffc178
    scene.add.rectangle(hazard.x, hazard.y, hazard.width, hazard.height, fill, 0.78).setOrigin(0, 0).setDepth(6)
    scene.add.rectangle(hazard.x, hazard.y - 8, hazard.width, 10, glow, 0.22).setOrigin(0, 0).setDepth(7)
    const ripple = scene.add.graphics().setDepth(8)
    ripple.lineStyle(3, glow, 0.32)
    for (let offset = 12; offset < hazard.width; offset += 48) {
      ripple.strokeEllipse(hazard.x + offset, hazard.y + 8, 28, 10)
      ripple.strokeEllipse(hazard.x + offset + 18, hazard.y + 18, 22, 8)
    }
    if (theme === 'causeway' && hazard.type === 'fire') {
      for (let offset = 18; offset < hazard.width; offset += 60) {
        const vent = scene.add.image(hazard.x + offset, hazard.y - 8, 'stage-causeway-prop').setScale(0.24).setDepth(8.5)
        vent.setAlpha(0.34)
      }
    }
  })
}

export function drawBranchSigns(scene: Phaser.Scene, labels: Array<{ x: number; y: number; text: string; accent?: number }>) {
  labels.forEach((label) => {
    const plate = scene.add.rectangle(label.x, label.y, 150, 34, 0x12161c, 0.74).setDepth(14)
    plate.setStrokeStyle(2, label.accent ?? 0xf0c47a, 0.68)
    scene.add.text(label.x, label.y, label.text, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#f1e7d3',
    }).setOrigin(0.5).setDepth(15)
  })
}

function branchColor(branch: string) {
  if (branch === 'high') return 0x536279
  if (branch === 'low') return 0x5a5147
  if (branch === 'boss' || branch === 'crown') return 0x694238
  return 0x4c5862
}

function paintPlatformFace(scene: Phaser.Scene, platform: PlatformDef) {
  const face = scene.add.graphics().setDepth(12)
  for (let offset = 0; offset < platform.width; offset += 34) {
    face.fillStyle(0x1a171b, 0.14)
    face.fillRoundedRect(platform.x + offset + 6, platform.y + 10, 18, Math.max(8, platform.height - 16), 4)
  }

  face.lineStyle(2, 0xf1e6cb, 0.08)
  for (let offset = 0; offset < platform.width; offset += 52) {
    face.lineBetween(platform.x + offset, platform.y + platform.height - 5, platform.x + offset + 18, platform.y + 8)
  }
}

function paintGroundBands(scene: Phaser.Scene, platforms: PlatformDef[], theme: StageTheme, worldHeight: number) {
  const mainPlatforms = platforms.filter((platform) => platform.branch === 'main')
  mainPlatforms.forEach((platform) => {
    const tile = scene.add.tileSprite(
      platform.x + platform.width * 0.5,
      platform.y + platform.height + Math.max(12, (worldHeight - platform.y - platform.height) * 0.5),
      platform.width,
      Math.max(24, worldHeight - platform.y - platform.height),
      themeTileKey(theme)
    ).setDepth(9)
    tile.setAlpha(0.92)
    const skirt = scene.add.rectangle(
      platform.x + platform.width * 0.5,
      platform.y + platform.height + Math.max(12, (worldHeight - platform.y - platform.height) * 0.5),
      platform.width,
      Math.max(24, worldHeight - platform.y - platform.height),
      theme === 'causeway' ? 0x1a0f0c : 0x0a1117,
      0.54
    ).setDepth(9.2)
    const lip = scene.add.rectangle(platform.x + platform.width * 0.5, platform.y + platform.height + 2, platform.width, 10, 0x05090c, 0.64).setDepth(9.4)
    void skirt
    void lip
  })
}

function paintPlatformProps(scene: Phaser.Scene, platform: PlatformDef, theme: StageTheme) {
  const accent = branchAccent(platform.branch)
  const props = scene.add.graphics().setDepth(13)

  props.fillStyle(0x120f12, 0.42)
  props.fillRoundedRect(platform.x + 10, platform.y - 22, Math.min(34, platform.width * 0.14), 22, 4)
  props.fillRoundedRect(platform.x + platform.width - 46, platform.y - 18, 28, 18, 4)

  props.fillStyle(accent, 0.2)
  props.fillRoundedRect(platform.x + 12, platform.y - 18, Math.min(28, platform.width * 0.12), 10, 4)

  if (platform.branch === 'boss' || platform.branch === 'crown') {
    props.fillStyle(0x2c1711, 0.38)
    props.fillRoundedRect(platform.x + platform.width * 0.45, platform.y - 34, 18, 34, 6)
    props.fillStyle(0xffb47a, 0.18)
    props.fillCircle(platform.x + platform.width * 0.45 + 9, platform.y - 16, 10)
  }

  if (platform.branch === 'low') {
    props.fillStyle(0x2db3a7, 0.2)
    props.fillEllipse(platform.x + platform.width * 0.32, platform.y - 2, 44, 10)
  }

  if (platform.branch === 'high') {
    props.fillStyle(0xa7b9d6, 0.16)
    props.fillRoundedRect(platform.x + platform.width * 0.28, platform.y - 28, 12, 28, 4)
    props.fillRoundedRect(platform.x + platform.width * 0.28 + 18, platform.y - 22, 10, 22, 4)
  }

  const propKey = themePropKey(theme)
  const propCount = Math.max(1, Math.floor(platform.width / 220))
  for (let index = 0; index < propCount; index += 1) {
    const offset = platform.x + 42 + index * ((platform.width - 84) / propCount)
    const prop = scene.add.image(offset, platform.y - 8, propKey).setDepth(13.4)
    prop.setOrigin(0.5, 1)
    prop.setScale(theme === 'causeway' ? 0.22 : theme === 'route' ? 0.2 : 0.18)
    prop.setAlpha(index % 2 === 0 ? 0.34 : 0.22)
  }
}

function branchAccent(branch: string) {
  if (branch === 'high') return 0xbec9df
  if (branch === 'low') return 0x70d9cb
  if (branch === 'boss' || branch === 'crown') return 0xffb06a
  return 0xc8c0b1
}

function themeTileKey(theme: StageTheme) {
  if (theme === 'pixor') return 'stage-pixor-tile'
  if (theme === 'route') return 'stage-route-tile'
  return 'stage-causeway-tile'
}

function themePropKey(theme: StageTheme) {
  if (theme === 'pixor') return 'stage-pixor-prop'
  if (theme === 'route') return 'stage-route-prop'
  return 'stage-causeway-prop'
}
