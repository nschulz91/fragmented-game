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
        <p class="subtitle">Two-chapter breach run with relic unlocks, challenge modifiers, chapter cards, and a public browser build.</p>
      </header>

      <section class="stat-block mission">
        <h2>Objective</h2>
        <p id="objective-text"></p>
      </section>

      <section class="stat-block">
        <h2>Story Feed</h2>
        <p id="lore-text" class="body-copy"></p>
      </section>

      <section class="stat-block">
        <h2>Controls</h2>
        <ul id="controls-text" class="controls-list"></ul>
      </section>

      <section class="meta-strip">
        <div>
          <span class="meta-label">Prompt Mode</span>
          <strong id="prompt-text">Keyboard prompts active</strong>
        </div>
        <div>
          <span class="meta-label">Meta Progress</span>
          <strong id="progress-text">No relics unlocked yet</strong>
        </div>
        <div>
          <span class="meta-label">Region</span>
          <strong id="region-text">Lake Pixor -> Breach Road -> Cinder Causeway</strong>
        </div>
      </section>
    </aside>

    <section class="viewport-card">
      <div class="viewport-header">
        <div>
          <strong>Chapter run</strong>
          <span id="header-text">Lake Pixor breach, reward room, route traversal, and a second playable region.</span>
        </div>
      </div>
      <div id="game-container"></div>
      <div class="status-line">
        <span id="status-text"></span>
        <span id="warning-text" class="danger">Hazards change by chapter. Toxic water and fire vents both punish greed.</span>
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
