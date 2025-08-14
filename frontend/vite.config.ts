import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: true
  },
  define: {
    // 🧹 SUPPRIMER console.log EN PRODUCTION
    ...(process.env.NODE_ENV === 'production' ? {
      'console.log': '(() => {})',
      'console.debug': '(() => {})',
    } : {})
  },
  build: {
    // 🚀 OPTIMISATIONS PRODUCTION
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Supprimer tous les console.log
        drop_debugger: true,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'supabase': ['@supabase/supabase-js'],
          'router': ['react-router-dom'],
        }
      }
    }
  }
})
