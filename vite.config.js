import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/local-print': {
        target: 'http://localhost:5075',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/local-print/, ''),
      },
    },
  },
  externals: {
    pdfmake: 'pdfMake'
  },
  build: {
    rollupOptions: {
      external: ['pdfmake'],
    },
  },
})
