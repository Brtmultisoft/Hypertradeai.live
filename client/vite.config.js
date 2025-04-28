import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { splitVendorChunkPlugin } from 'vite'
import { compression } from 'vite-plugin-compression2'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    splitVendorChunkPlugin(), // Split vendor chunks for better caching
    compression({ // Compress assets
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 10240, // Only compress files larger than 10kb
    }),
  ],
  server: {
    port: 2013, // Different port from the admin app
    open: true,
    hmr: {
      overlay: true, // Show errors as overlay
    },
  },
  resolve: {
    alias: {
      '@': '/src',
    },
  },
  build: {
    target: 'es2015', // Target modern browsers for smaller bundle size
    minify: 'terser', // Use terser for better minification
    cssMinify: true, // Minify CSS
    sourcemap: false, // Disable sourcemaps in production
    chunkSizeWarningLimit: 1000, // Increase chunk size warning limit
    rollupOptions: {
      output: {
        manualChunks: {
          // Split vendor chunks for better caching
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'mui-vendor': ['@mui/material', '@mui/icons-material'],
          'chart-vendor': ['chart.js', 'react-chartjs-2'],
          'utils': ['axios', 'date-fns', 'jwt-decode'],
        },
      },
    },
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true, // Remove debugger statements
      },
    },
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@mui/material', 'axios'],
  },
})
