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
        <h1 class="title">Lake Pixor Trial</h1>
        <p class="subtitle">Combat-first breach simulation with faction support, boss checkpointing, and a full local browser play path.</p>
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
          <span class="meta-label">Playable</span>
          <strong>Local dev + preview build</strong>
        </div>
        <div>
          <span class="meta-label">Region</span>
          <strong>Lake Pixor, Parxillia</strong>
        </div>
      </section>
    </aside>

    <section class="viewport-card">
      <div class="viewport-header">
        <div>
          <strong>Combat sandbox</strong>
          <span>Single-canvas action scene with menu overlays, checkpoint upgrades, and boss-phase scripting.</span>
        </div>
      </div>
      <div id="game-container"></div>
      <div class="status-line">
        <span id="status-text"></span>
        <span id="warning-text" class="danger">Water remains toxic to Charlie.</span>
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

