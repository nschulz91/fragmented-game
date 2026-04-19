import Phaser from 'phaser'

export const GamepadButtons = {
  South: 0,
  East: 1,
  West: 2,
  North: 3,
  L1: 4,
  R1: 5,
  Select: 8,
  Start: 9,
  DpadUp: 12,
  DpadDown: 13,
  DpadLeft: 14,
  DpadRight: 15,
} as const

export class GamepadState {
  private previous: boolean[] = Array(20).fill(false)
  private current: boolean[] = Array(20).fill(false)
  private pad?: Phaser.Input.Gamepad.Gamepad

  sync(plugin?: Phaser.Input.Gamepad.GamepadPlugin | null) {
    this.pad = plugin?.getPad(0) ?? plugin?.pad1 ?? undefined

    for (let i = 0; i < this.current.length; i += 1) {
      this.previous[i] = this.current[i]
      this.current[i] = !!this.pad?.buttons[i]?.pressed
    }
  }

  isDown(index: number) {
    return this.current[index] ?? false
  }

  justPressed(index: number) {
    return !!this.current[index] && !this.previous[index]
  }

  axisX() {
    const stick = this.pad?.leftStick
    const axis = stick ? stick.x : 0
    let result = Math.abs(axis) > 0.2 ? axis : 0
    if (this.isDown(GamepadButtons.DpadLeft)) result = -1
    if (this.isDown(GamepadButtons.DpadRight)) result = 1
    return result
  }

  axisY() {
    const stick = this.pad?.leftStick
    const axis = stick ? stick.y : 0
    let result = Math.abs(axis) > 0.2 ? axis : 0
    if (this.isDown(GamepadButtons.DpadUp)) result = -1
    if (this.isDown(GamepadButtons.DpadDown)) result = 1
    return result
  }
}
