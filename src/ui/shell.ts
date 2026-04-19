const mountNode = document.querySelector<HTMLDivElement>('#app')

if (!mountNode) {
  throw new Error('Missing #app mount node')
}

const app = mountNode

export function mountShell() {
  app.innerHTML = `
    <aside class="panel">
      <header class="brand-block">
        <p class="eyebrow">Fragmented</p>
        <h1 class="title">Warden Aftermath</h1>
        <p class="subtitle">Painterly side-scrolling breach run with relic unlocks, branching routes, and chapter-driven combat.</p>
      </header>

      <section class="summary-grid">
        <div class="summary-chip">
          <span class="meta-label">Mode</span>
          <strong id="prompt-text">Keyboard prompts active</strong>
        </div>
        <div class="summary-chip">
          <span class="meta-label">Region</span>
          <strong id="region-text">Lake Pixor -> Breach Road -> Cinder Causeway</strong>
        </div>
      </section>

      <section class="stat-block mission">
        <h2>Run Brief</h2>
        <p id="objective-text"></p>
        <p id="header-text" class="body-copy"></p>
      </section>

      <section class="stat-block">
        <h2>World Feed</h2>
        <p id="lore-text" class="body-copy"></p>
      </section>

      <section class="stat-block compact">
        <h2>Controls</h2>
        <ul id="controls-text" class="controls-list"></ul>
      </section>

      <section class="meta-strip compact">
        <div class="meta-card">
          <span class="meta-label">Meta Progress</span>
          <strong id="progress-text">No relics unlocked yet</strong>
        </div>
        <div class="meta-card warning">
          <span class="meta-label">Hazard Note</span>
          <strong id="warning-text">Toxic water and fire vents both punish greed.</strong>
        </div>
      </section>
    </aside>

    <section class="viewport-card">
      <div class="viewport-header">
        <div>
          <strong>Chapter run</strong>
          <span>Lake Pixor breach, reward room, route traversal, and a second playable region.</span>
        </div>
      </div>
      <div id="game-container"></div>
      <div class="status-line">
        <span id="status-text"></span>
        <span class="danger">Animated art pass active for live testing.</span>
      </div>
    </section>
  `
}

export function setObjectiveText(text: string) {
  const target = document.querySelector<HTMLElement>('#objective-text')
  if (target) target.textContent = text
}

export function setLoreText(text: string) {
  const target = document.querySelector<HTMLElement>('#lore-text')
  if (target) target.textContent = text
}

export function setStatusText(text: string) {
  const target = document.querySelector<HTMLElement>('#status-text')
  if (target) target.textContent = text
}

export function setControlsText(lines: string[]) {
  const target = document.querySelector<HTMLElement>('#controls-text')
  if (!target) return
  target.innerHTML = lines.map((line) => `<li>${line}</li>`).join('')
}

export function setPromptText(text: string) {
  const target = document.querySelector<HTMLElement>('#prompt-text')
  if (target) target.textContent = text
}

export function setProgressText(text: string) {
  const target = document.querySelector<HTMLElement>('#progress-text')
  if (target) target.textContent = text
}

export function setRegionText(text: string) {
  const target = document.querySelector<HTMLElement>('#region-text')
  if (target) target.textContent = text
}

export function setHeaderText(text: string) {
  const target = document.querySelector<HTMLElement>('#header-text')
  if (target) target.textContent = text
}
