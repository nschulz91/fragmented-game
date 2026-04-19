import type { SettingsState } from '../state'

type SfxName =
  | 'slash'
  | 'hit'
  | 'pulse'
  | 'dash'
  | 'parry'
  | 'boss'
  | 'warning'
  | 'win'
  | 'lose'
  | 'shield'

type TrackName = 'menu' | 'ambient' | 'none'

class AudioDirector {
  private context?: AudioContext
  private interval?: number
  private settingsResolver: () => SettingsState = () => ({
    masterVolume: 1,
    musicVolume: 1,
    sfxVolume: 1,
    fullscreen: false,
  })
  private currentTrack: TrackName = 'none'

  configure(settingsResolver: () => SettingsState) {
    this.settingsResolver = settingsResolver
  }

  private ensureContext() {
    if (typeof window === 'undefined') return undefined
    if (!this.context) {
      const AudioCtor =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtor) return undefined
      this.context = new AudioCtor()
    }
    if (this.context.state === 'suspended') void this.context.resume()
    return this.context
  }

  private getSfxGain(multiplier = 1) {
    const settings = this.settingsResolver()
    return settings.masterVolume * settings.sfxVolume * multiplier
  }

  private getMusicGain(multiplier = 1) {
    const settings = this.settingsResolver()
    return settings.masterVolume * settings.musicVolume * multiplier
  }

  playSfx(name: SfxName, intensity = 1) {
    const ctx = this.ensureContext()
    if (!ctx) return

    const profiles = {
      slash: { freq: 320, end: 180, dur: 0.08, type: 'triangle' as OscillatorType, gain: 0.05 },
      hit: { freq: 160, end: 90, dur: 0.12, type: 'square' as OscillatorType, gain: 0.06 },
      pulse: { freq: 540, end: 160, dur: 0.28, type: 'sawtooth' as OscillatorType, gain: 0.045 },
      dash: { freq: 260, end: 420, dur: 0.09, type: 'sine' as OscillatorType, gain: 0.04 },
      parry: { freq: 700, end: 320, dur: 0.12, type: 'triangle' as OscillatorType, gain: 0.05 },
      boss: { freq: 100, end: 65, dur: 0.32, type: 'sawtooth' as OscillatorType, gain: 0.07 },
      warning: { freq: 220, end: 310, dur: 0.22, type: 'square' as OscillatorType, gain: 0.05 },
      win: { freq: 430, end: 640, dur: 0.42, type: 'triangle' as OscillatorType, gain: 0.06 },
      lose: { freq: 180, end: 60, dur: 0.52, type: 'sine' as OscillatorType, gain: 0.06 },
      shield: { freq: 880, end: 520, dur: 0.15, type: 'sine' as OscillatorType, gain: 0.04 },
    }[name]

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = profiles.type
    oscillator.frequency.setValueAtTime(profiles.freq, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(profiles.end, ctx.currentTime + profiles.dur)
    gain.gain.setValueAtTime(this.getSfxGain(profiles.gain * intensity), ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + profiles.dur)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + profiles.dur)
  }

  playTrack(track: TrackName) {
    if (this.currentTrack === track) return
    this.stopTrack()
    this.currentTrack = track
    if (track === 'none') return

    const ctx = this.ensureContext()
    if (!ctx) return

    const patterns =
      track === 'menu'
        ? [
            [261.6, 329.6, 392.0],
            [293.6, 349.2, 440.0],
          ]
        : [
            [110.0, 164.8],
            [98.0, 146.8],
          ]

    let step = 0
    this.interval = window.setInterval(() => {
      const notes = patterns[step % patterns.length]
      step += 1
      notes.forEach((freq, index) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = track === 'menu' ? 'triangle' : 'sine'
        osc.frequency.setValueAtTime(freq, ctx.currentTime)
        gain.gain.setValueAtTime(this.getMusicGain(track === 'menu' ? 0.02 : 0.015), ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1.2 + index * 0.04)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 1.4 + index * 0.04)
      })
    }, track === 'menu' ? 1700 : 2200)
  }

  stopTrack() {
    if (this.interval) {
      window.clearInterval(this.interval)
      this.interval = undefined
    }
    this.currentTrack = 'none'
  }

  suspend() {
    this.stopTrack()
    if (this.context && this.context.state === 'running') {
      void this.context.suspend()
    }
  }

  shutdown() {
    this.stopTrack()
    if (this.context) {
      const context = this.context
      this.context = undefined
      void context.close()
    }
  }
}

export const audioDirector = new AudioDirector()
