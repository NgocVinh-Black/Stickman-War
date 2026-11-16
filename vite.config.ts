import { defineConfig } from 'vite';

export default defineConfig(({ isSsrBuild }) => ({
  // Đường dẫn tương đối để deploy được dưới thư mục con (vd. /nguoi-que/)
  base: './',
  // Bản build máy chủ online (vite build --ssr) chạy trên Node, không cần file public
  publicDir: isSsrBuild ? false : 'public',
  build: isSsrBuild ? { target: 'node22' } : {},
  server: {
    // Dev: chuyển WebSocket online sang máy chủ game (npm run server)
    proxy: {
      '/ws': { target: 'ws://localhost:8787', ws: true },
      '/api': { target: 'http://localhost:8787' },
    },
  },
}));
