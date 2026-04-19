import { spawn } from 'node:child_process'
import process from 'node:process'
import { chromium } from 'playwright'

const previewPort = 4173
const previewUrl = `http://127.0.0.1:${previewPort}/?seed=smoke-seed`

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

async function waitForPreview(page, attempts = 40) {
  for (let index = 0; index < attempts; index += 1) {
    try {
      await page.goto(previewUrl, { waitUntil: 'networkidle' })
      return
    } catch {
      await wait(500)
    }
  }
  throw new Error('Preview server did not become ready in time.')
}

function assert(condition, message) {
  if (!condition) throw new Error(message)
}

const preview = spawn('npm', ['run', 'preview', '--', '--host', '127.0.0.1', '--port', String(previewPort)], {
  cwd: process.cwd(),
  stdio: 'ignore',
})

let browser

try {
  browser = await chromium.launch({ headless: true })
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  const errors = []

  page.on('pageerror', (error) => errors.push(`pageerror:${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console:${message.text()}`)
  })

  await waitForPreview(page)
  await wait(1000)

  const renderState = async () => JSON.parse(await page.evaluate(() => window.render_game_to_text?.() ?? '{}'))

  let state = await renderState()
  assert(state.mode === 'menu', `Expected menu mode, received ${state.mode}`)

  await page.evaluate(() => {
    window.__fragmentedGame.scene.start('game')
  })
  await wait(500)

  state = await renderState()
  assert(state.mode === 'game', `Expected game mode, received ${state.mode}`)
  assert(state.encounter.wave === 1, `Expected wave 1 at game start, received ${state.encounter.wave}`)

  await page.evaluate(() => {
    window.advanceTime?.(1000)
  })
  await wait(100)

  state = await renderState()
  assert(state.player.health < state.player.maxHealth, 'Expected player to take hazard or enemy pressure during advanceTime step')

  await page.evaluate(() => {
    const game = window.__fragmentedGame
    const scene = game.scene.getScene('game')
    scene['currentWaveIndex'] = 2
    scene['enemies'].forEach((enemy) => enemy.destroy())
    scene['enemies'] = []
    const runState = scene.registry.get('runState')
    runState.currentWave = 3
    scene.registry.set('runState', runState)
    scene['unlockCheckpoint']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'checkpoint', `Expected checkpoint mode, received ${state.mode}`)
  assert(state.encounter.checkpointUnlocked === true, 'Expected checkpointUnlocked to be true')

  await page.evaluate(() => {
    const checkpoint = window.__fragmentedGame.scene.getScene('checkpoint')
    checkpoint['confirm']()
    checkpoint['confirm']()
    checkpoint['finish']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'boss-intro', `Expected boss-intro mode, received ${state.mode}`)
  assert(state.encounter.selectedBuff === 'time-thread', `Expected default smoke buff selection, received ${state.encounter.selectedBuff}`)
  assert(state.encounter.selectedPerk === 'house-veyra', `Expected default smoke perk selection, received ${state.encounter.selectedPerk}`)

  await page.evaluate(() => {
    const intro = window.__fragmentedGame.scene.getScene('boss-intro')
    intro['finish']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'game', `Expected game mode during boss start, received ${state.mode}`)
  assert(state.boss?.phase === 1, `Expected boss phase 1, received ${state.boss?.phase}`)

  await page.evaluate(() => {
    const scene = window.__fragmentedGame.scene.getScene('game')
    scene['boss'].health = scene['boss'].maxHealth * 0.68
    scene['handlePhaseProgression']()
    scene['boss'].health = scene['boss'].maxHealth * 0.3
    scene['handlePhaseProgression']()
    scene.scene.launch('pause')
    scene.scene.pause()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'pause', `Expected pause mode, received ${state.mode}`)
  assert(state.encounter.wave === 4, `Expected boss wave marker 4, received ${state.encounter.wave}`)

  assert(errors.length === 0, `Smoke test captured browser errors: ${errors.join('\n')}`)
  console.log('Smoke test passed.')
} finally {
  preview.kill('SIGTERM')
  if (browser) await browser.close()
}
