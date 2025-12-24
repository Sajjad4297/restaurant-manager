import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Move tailwindcss() to the top of the list
  plugins: [
    tailwindcss(),
    react(),
  ],
  clearScreen: false,
  server: {
    port: 1420, // Tauri's default
    strictPort: true,
  },
  // Use empty string or './' for relative paths in Tauri
  base: "",
  // Add this to ensure CSS is bundled correctly
  build: {
    cssCodeSplit: false,
  }
})
