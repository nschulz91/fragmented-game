type EffectName = 'slash' | 'hit' | 'pulse' | 'boss' | 'win' | 'lose'

export class Sfx {
  private context?: AudioContext

  private ensureContext() {
    if (typeof window === 'undefined') return undefined
    if (!this.context) {
      const AudioCtor = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (!AudioCtor) return undefined
      this.context = new AudioCtor()
    }
    if (this.context.state === 'suspended') {
      void this.context.resume()
    }
    return this.context
  }

  play(effect: EffectName) {
    const ctx = this.ensureContext()
    if (!ctx) return

    const profile = {
      slash: { freq: 280, endFreq: 140, duration: 0.08, type: 'triangle' as OscillatorType, gain: 0.04 },
      hit: { freq: 150, endFreq: 90, duration: 0.12, type: 'square' as OscillatorType, gain: 0.05 },
      pulse: { freq: 520, endFreq: 180, duration: 0.28, type: 'sawtooth' as OscillatorType, gain: 0.035 },
      boss: { freq: 96, endFreq: 60, duration: 0.32, type: 'sawtooth' as OscillatorType, gain: 0.06 },
      win: { freq: 420, endFreq: 620, duration: 0.4, type: 'triangle' as OscillatorType, gain: 0.05 },
      lose: { freq: 210, endFreq: 70, duration: 0.45, type: 'sine' as OscillatorType, gain: 0.05 },
    }[effect]

    const oscillator = ctx.createOscillator()
    const gain = ctx.createGain()
    oscillator.type = profile.type
    oscillator.frequency.setValueAtTime(profile.freq, ctx.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(profile.endFreq, ctx.currentTime + profile.duration)
    gain.gain.setValueAtTime(profile.gain, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + profile.duration)
    oscillator.connect(gain)
    gain.connect(ctx.destination)
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + profile.duration)
  }
}
