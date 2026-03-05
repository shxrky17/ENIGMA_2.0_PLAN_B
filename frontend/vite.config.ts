import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
  ],
  // SockJS-client references Node.js `global` — polyfill it for the browser
  define: {
    global: 'globalThis',
  },
})
