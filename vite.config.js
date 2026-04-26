import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// 중요! GitHub Pages 배포 시 base 경로 수정 필요
// 예: 본인 저장소 이름이 'our-diary'면 base: '/our-diary/'
// 사용자/조직 페이지 (username.github.io 같은 경우)면 base: '/'
export default defineConfig({
  plugins: [react()],
  base: '/our-diary/', // ← 본인 저장소 이름에 맞게 수정
  build: {
    outDir: 'dist',
  },
  server: {
    port: 3000,
    host: true,
  },
})
