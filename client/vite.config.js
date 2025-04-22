import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 2013, // Different port from the admin app
    open: true
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
