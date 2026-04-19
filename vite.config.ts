import { defineConfig } from 'vite'

const base = process.env.GITHUB_PAGES === 'true' ? '/fragmented-game/' : '/'

export default defineConfig({
  base,
  server: {
    allowedHosts: true,
  },
  preview: {
    allowedHosts: true,
  },
  build: {
    chunkSizeWarningLimit: 1600,
  },
})
