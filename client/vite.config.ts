import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      '/v1': {
        target: 'https://wavelength-wxut4.ondigitalocean.app',
        changeOrigin: true,
      },
      '/health': 'http://localhost:8080',
      '/ready': 'http://localhost:8080',
    },
  },
})
