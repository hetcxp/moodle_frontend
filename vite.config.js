export default {
  base: '/moodle_frontend/',
  build: {
    sourcemap: false
  },
  server: {
    host: true,
    proxy: {
      '/moodle': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/moodle/, '')
      }
    }
  }
}
