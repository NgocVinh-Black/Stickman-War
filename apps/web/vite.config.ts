import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [vue()],
  // Đường dẫn tương đối để deploy được dưới thư mục con (vd. /nguoi-que/)
  base: './',
  server: {
    // Dev: chuyển WebSocket và API sang máy chủ NestJS (pnpm dev:server, cổng 8787)
    proxy: {
      '/ws': { target: 'ws://localhost:8787', ws: true },
      '/api': { target: 'http://localhost:8787' },
    },
  },
  test: {
    environment: 'happy-dom',
  },
});
