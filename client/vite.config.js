import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const siteUrl = (env.VITE_SITE_URL || 'https://memora.cards').replace(/\/$/, '')

  return {
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'html-seo-site-url',
      transformIndexHtml(html) {
        return html.replaceAll('__SITE_URL__', siteUrl)
      },
    },
  ],
  test: {
    environment: 'node',
    include: ['src/**/*.test.js'],
  },
  server: {
    proxy: {
      // Use /api/ so /api-docs.html stays on Vite (served from public/)
      '/api/': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
    },
  },
  }
})
