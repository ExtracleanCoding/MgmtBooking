import { defineConfig } from 'vite';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    // Output directory
    outDir: 'dist',

    // Generate sourcemaps for debugging
    sourcemap: true,

    // Rollup options for code splitting
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      },
      output: {
        // Manual chunk splitting for optimal loading
        manualChunks: {
          // Core utilities and state management
          'core': [
            './src/core/utils.js',
            './src/core/state.js',
            './src/core/storage.js',
          ],
          // Calendar features
          'calendar': [
            './src/modules/calendar.js',
          ],
          // Billing and reports
          'billing': [
            './src/modules/billing.js',
            './src/modules/reports.js',
          ],
          // External dependencies
          'vendor': [
            'chart.js',
            'lz-string',
          ],
        },
        // Naming pattern for chunks
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: 'assets/[ext]/[name]-[hash].[ext]',
      },
    },

    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true,
      },
    },

    // Target modern browsers
    target: 'es2020',
  },

  // Server configuration for development
  server: {
    port: 3000,
    open: true,
  },

  // Preview server configuration
  preview: {
    port: 4173,
  },
});
