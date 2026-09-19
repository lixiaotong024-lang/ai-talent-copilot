import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 使用相对路径 base，确保可以直接部署到任意 GitHub Pages 项目子路径下
export default defineConfig({
  base: './',
  plugins: [react()],
  build: {
    target: 'es2020',
    chunkSizeWarningLimit: 1600,
  },
})
