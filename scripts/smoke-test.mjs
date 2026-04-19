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
    window.__fragmentedGame.scene.start('briefing')
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'briefing', `Expected briefing mode, received ${state.mode}`)

  await page.evaluate(() => {
    const briefing = window.__fragmentedGame.scene.getScene('briefing')
    briefing['deploy']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'chapter-card', `Expected chapter-card mode, received ${state.mode}`)

  await page.evaluate(() => {
    const card = window.__fragmentedGame.scene.getScene('chapter-card')
    card['finish']()
  })
  await wait(250)

  state = await renderState()
  assert(state.mode === 'dialogue', `Expected dialogue mode, received ${state.mode}`)

  await page.evaluate(() => {
    const dialogue = window.__fragmentedGame.scene.getScene('dialogue')
    dialogue['advance']()
    dialogue['advance']()
  })
  await wait(400)

  state = await renderState()
  assert(state.mode === 'game', `Expected game mode, received ${state.mode}`)
  assert(state.region === 'pixor', `Expected pixor region, received ${state.region}`)

  await page.evaluate(() => {
    const scene = window.__fragmentedGame.scene.getScene('game')
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

  await page.evaluate(() => {
    const checkpoint = window.__fragmentedGame.scene.getScene('checkpoint')
    checkpoint['confirm']()
    checkpoint['confirm']()
    checkpoint['finish']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'boss-intro', `Expected boss-intro mode, received ${state.mode}`)

  await page.evaluate(() => {
    const intro = window.__fragmentedGame.scene.getScene('boss-intro')
    intro['finish']()
  })
  await wait(300)

  await page.evaluate(() => {
    const scene = window.__fragmentedGame.scene.getScene('game')
    scene['boss'].health = 0
    scene['boss'].destroy()
    scene['handlePhaseProgression']()
    scene['handlePhaseProgression']()
  })
  await wait(700)

  state = await renderState()
  assert(state.mode === 'dialogue', `Expected boss outro dialogue, received ${state.mode}`)

  await page.evaluate(() => {
    const dialogue = window.__fragmentedGame.scene.getScene('dialogue')
    dialogue['advance']()
    dialogue['advance']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'reward', `Expected reward mode, received ${state.mode}`)

  await page.evaluate(() => {
    const reward = window.__fragmentedGame.scene.getScene('reward')
    reward['confirm']()
  })
  await wait(300)

  await page.evaluate(() => {
    const dialogue = window.__fragmentedGame.scene.getScene('dialogue')
    dialogue['advance']()
  })
  await wait(200)

  await page.evaluate(() => {
    const card = window.__fragmentedGame.scene.getScene('chapter-card')
    card['finish']()
  })
  await wait(200)

  await page.evaluate(() => {
    const dialogue = window.__fragmentedGame.scene.getScene('dialogue')
    dialogue['advance']()
    dialogue['advance']()
  })
  await wait(400)

  state = await renderState()
  assert(state.mode === 'route', `Expected route mode, received ${state.mode}`)
  assert(state.region === 'breach-road', `Expected breach-road region, received ${state.region}`)

  await page.evaluate(() => {
    const route = window.__fragmentedGame.scene.getScene('route')
    route['enemies'].forEach((enemy) => enemy.destroy())
    route['enemies'] = []
    route['routeEncounterCleared'] = true
    route['activateShrine']()
    route['player'].x = 1360
    route['runFrame'](0)
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'chapter-card', `Expected causeway chapter-card mode, received ${state.mode}`)

  await page.evaluate(() => {
    const card = window.__fragmentedGame.scene.getScene('chapter-card')
    card['finish']()
  })
  await wait(200)

  await page.evaluate(() => {
    const dialogue = window.__fragmentedGame.scene.getScene('dialogue')
    dialogue['advance']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'causeway', `Expected causeway mode, received ${state.mode}`)
  assert(state.region === 'causeway', `Expected causeway region, received ${state.region}`)

  await page.evaluate(() => {
    const causeway = window.__fragmentedGame.scene.getScene('causeway')
    causeway['stageIndex'] = 2
    causeway['enemies'].forEach((enemy) => enemy.destroy())
    causeway['enemies'] = []
    causeway['finishRun']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'dialogue', `Expected causeway outro dialogue, received ${state.mode}`)

  await page.evaluate(() => {
    const dialogue = window.__fragmentedGame.scene.getScene('dialogue')
    dialogue['advance']()
  })
  await wait(300)

  state = await renderState()
  assert(state.mode === 'results', `Expected results mode, received ${state.mode}`)
  assert(state.score > 0, 'Expected positive score in results state')

  assert(errors.length === 0, `Smoke test captured browser errors: ${errors.join('\n')}`)
  console.log('Smoke test passed.')
} finally {
  preview.kill('SIGTERM')
  if (browser) await browser.close()
}
