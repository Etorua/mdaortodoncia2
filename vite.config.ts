import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 30001,
    host: '0.0.0.0',
    strictPort: true
    ,
    // Proxy para redirigir llamadas /api al backend en desarrollo
    proxy: {
      '/soporteback/api': {
        target: 'http://localhost:3002',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './frontend/src'),
      '@/components': path.resolve(__dirname, './frontend/src/components'),
      '@/pages': path.resolve(__dirname, './frontend/src/pages'),
      '@/types': path.resolve(__dirname, './frontend/src/types'),
      '@/utils': path.resolve(__dirname, './frontend/src/utils'),
      '@/services': path.resolve(__dirname, './frontend/src/services'),
      '@/hooks': path.resolve(__dirname, './frontend/src/hooks')
    }
  }
})