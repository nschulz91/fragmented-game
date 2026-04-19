import Phaser from 'phaser'

type ControlsPanelOptions = {
  x: number
  y: number
  width: number
  height: number
  title?: string
  inputMode?: 'keyboard' | 'controller'
}

const keyboardRows: Array<[string, string]> = [
  ['W', 'Jump'],
  ['A / D', 'Move'],
  ['Space', 'Slash'],
  ['Q', 'Pulse'],
  ['Shift', 'Dash'],
  ['E', 'Parry'],
  ['C', 'Charge'],
  ['Esc', 'Pause'],
  ['F', 'Fullscreen'],
]

const controllerRows: Array<[string, string]> = [
  ['Left Stick / D-pad', 'Move'],
  ['South', 'Jump / Confirm'],
  ['East', 'Dash'],
  ['West', 'Pulse'],
  ['North', 'Parry'],
  ['R1', 'Charge'],
  ['Start', 'Pause / Confirm'],
]

export function renderControlsPanel(scene: Phaser.Scene, options: ControlsPanelOptions) {
  const { x, y, width, height, title = 'Controls Layout', inputMode = 'keyboard' } = options
  const container = scene.add.container(x, y).setDepth(220)

  const panel = scene.add.rectangle(0, 0, width, height, 0x071116, 0.96)
  panel.setStrokeStyle(2, 0xf5c978, 0.22)
  container.add(panel)

  const titleText = scene.add.text(0, -height * 0.42, title, {
    fontFamily: 'Georgia',
    fontSize: '28px',
    color: '#fff0cc',
  }).setOrigin(0.5)
  container.add(titleText)

  const modeText = scene.add.text(0, -height * 0.34, `Prompt mode: ${inputMode === 'controller' ? 'Controller' : 'Keyboard'}`, {
    fontFamily: 'Georgia',
    fontSize: '16px',
    color: '#d8e8e2',
  }).setOrigin(0.5)
  container.add(modeText)

  const keyboardBlock = scene.add.container(-width * 0.24, 22)
  const controllerBlock = scene.add.container(width * 0.24, 22)
  container.add([keyboardBlock, controllerBlock])

  buildControlColumn(scene, keyboardBlock, 'Keyboard', keyboardRows, inputMode === 'keyboard')
  buildControlColumn(scene, controllerBlock, 'Controller', controllerRows, inputMode === 'controller')

  const footer = scene.add.text(0, height * 0.43, 'Compare both layouts here. From pause, closing this view returns to the paused run.', {
    fontFamily: 'Georgia',
    fontSize: '15px',
    color: '#cbd8d2',
    align: 'center',
    wordWrap: { width: width - 80 },
  }).setOrigin(0.5)
  container.add(footer)

  return container
}

function buildControlColumn(
  scene: Phaser.Scene,
  container: Phaser.GameObjects.Container,
  heading: string,
  rows: Array<[string, string]>,
  active: boolean
) {
  const headingText = scene.add.text(0, -144, heading, {
    fontFamily: 'Georgia',
    fontSize: '22px',
    color: active ? '#f5c978' : '#e2ebe7',
  }).setOrigin(0.5)
  const frame = scene.add.rectangle(0, 6, 278, 308, 0x0d1820, 0.9)
  frame.setStrokeStyle(2, active ? 0xf5c978 : 0xa3b7bf, active ? 0.28 : 0.18)
  container.add([frame, headingText])

  rows.forEach(([button, action], index) => {
    const y = -104 + index * 30
    const plate = scene.add.rectangle(-72, y, 102, 24, active ? 0x1f2e37 : 0x18242b, 1).setOrigin(0.5)
    plate.setStrokeStyle(1, active ? 0xf5c978 : 0xb7c6cb, active ? 0.35 : 0.18)
    const buttonText = scene.add.text(-72, y, button, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#fff4dc',
    }).setOrigin(0.5)
    const actionText = scene.add.text(-6, y, action, {
      fontFamily: 'Georgia',
      fontSize: '15px',
      color: '#d6e4df',
    }).setOrigin(0, 0.5)
    container.add([plate, buttonText, actionText])
  })
}
