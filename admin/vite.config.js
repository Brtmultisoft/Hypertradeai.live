import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 2014, // Different port from the client app
    open: true
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
