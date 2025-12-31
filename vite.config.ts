import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { prerenderPlugin } from './vite-plugin-prerender'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), prerenderPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    allowedHosts: [
      'luann-proptosed-circularly.ngrok-free.dev',
      '.ngrok-free.dev',
      '.ngrok.io',
      'localhost',
    ],
    proxy: {
      '/api': {
        target: 'https://luann-proptosed-circularly.ngrok-free.dev',
        changeOrigin: true,
        secure: false,
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      },
    },
  },
  publicDir: 'public',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})

