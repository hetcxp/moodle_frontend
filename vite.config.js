import { VitePWA } from 'vite-plugin-pwa'

export default {
  base: '/moodle_frontend/',
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      scope: '/moodle_frontend/',
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/moodle_frontend/index.html',
        navigateFallbackAllowlist: [/^\/moodle_frontend\//],
      },
      manifest: {
        name: 'Moodle Academy',
        short_name: 'Moodle',
        description: 'Frontend para Moodle Academy',
        theme_color: '#1a73e8',
        background_color: '#f4f5f7',
        display: 'standalone',
        scope: '/moodle_frontend/',
        start_url: '/moodle_frontend/',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  build: {
    sourcemap: false
  },
  server: {
    host: true,
    proxy: {
      '^/moodle(/|$)': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/moodle/, '')
      }
    }
  }
}
