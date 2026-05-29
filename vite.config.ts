import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'url'

const emptyModule = fileURLToPath(new URL('./src/empty-module.ts', import.meta.url))

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: {
    // hwp.js가 내부적으로 참조하는 Node.js 내장 모듈을 브라우저 환경에서 빈 모듈로 대체
    alias: {
      fs: emptyModule,
      path: emptyModule,
    },
  },
})
