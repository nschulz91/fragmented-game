import { defineConfig } from 'vite'

const base = process.env.GITHUB_PAGES === 'true' ? '/fragmented-game/' : '/'

export default defineConfig({
  base,
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
