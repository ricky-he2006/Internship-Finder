import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/chat': 'http://localhost:8000',
      '/parse-resume': 'http://localhost:8000',
      '/health': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: () => '/',
      },
    },
  },
})
