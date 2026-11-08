import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/freetouse-proxy': {
        target: 'https://api.freetouse.com/v3',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/freetouse-proxy/, ''),
      },
    },
  },
})
