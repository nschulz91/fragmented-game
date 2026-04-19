export class SeededRng {
  private state: number

  constructor(seed: string) {
    let hash = 2166136261
    for (let i = 0; i < seed.length; i += 1) {
      hash ^= seed.charCodeAt(i)
      hash = Math.imul(hash, 16777619)
    }
    this.state = hash >>> 0
  }

  next() {
    this.state = (1664525 * this.state + 1013904223) >>> 0
    return this.state / 0xffffffff
  }

  pick<T>(items: T[]) {
    return items[Math.floor(this.next() * items.length) % items.length]
  }
}

