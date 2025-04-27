import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

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
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Ensure assets are copied correctly
    assetsInlineLimit: 4096, // 4kb - files smaller than this will be inlined as base64
    // Generate a manifest file for better asset tracking
    manifest: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
    },
  },
  // Ensure public directory is properly handled
  publicDir: 'public',
})
