const mountNode = document.querySelector<HTMLDivElement>('#app')

if (!mountNode) {
  throw new Error('Missing #app mount node')
}

const app = mountNode

export function mountShell() {
  app.innerHTML = `
    <aside class="panel">
      <div>
        <p class="eyebrow">Fragmented</p>
        <h1 class="title">Lake Pixor Trial</h1>
        <p class="subtitle">
          Browser-based combat sandbox. Charlie survives the first strike from the Shadow Court and proves he can
          reach the Prince of Shadows.
        </p>
      </div>

      <section class="stat-block mission">
        <h2>Mission</h2>
        <p id="objective-text"></p>
      </section>

      <section class="stat-block">
        <h2>Story Feed</h2>
        <p id="lore-text" class="body-copy"></p>
      </section>

      <section class="stat-block instructions">
        <h2>Controls</h2>
        <ul>
          <li><strong>Move:</strong> WASD or Arrow Keys</li>
          <li><strong>Slash:</strong> Space</li>
          <li><strong>Time Pulse:</strong> Shift</li>
          <li><strong>Confirm / restart:</strong> Enter</li>
        </ul>
      </section>
    </aside>

    <section class="viewport-card">
      <div class="viewport-header">
        <div>
          <strong>Combat sandbox</strong>
          <span>Single-screen top-down encounter built for local browser play.</span>
        </div>
      </div>
      <div id="game-container"></div>
      <div class="status-line">
        <span id="status-text"></span>
        <span id="warning-text" class="danger">Water is toxic to Charlie.</span>
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
