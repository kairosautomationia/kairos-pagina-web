import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  appType: 'mpa',
  build: {
    rolldownOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        diagnostico: resolve(import.meta.dirname, 'diagnostico.html'),
      },
      output: {
        codeSplitting: {
          groups: [
            { name: 'three-vendor', test: /node_modules[\\/]three[\\/]/, priority: 20 },
            { name: 'r3f-vendor', test: /node_modules[\\/]@react-three[\\/]/, priority: 10 },
          ],
        },
      },
    },
  },
})
