import { defineConfig } from 'tsup';

// Đóng gói máy chủ thành 1 file CJS; lõi game (@nguoi-que/core, mã TS trong workspace) được gộp vào,
// các thư viện trong node_modules giữ nguyên bên ngoài.
export default defineConfig({
  entry: { main: 'src/main.ts' },
  format: ['cjs'],
  target: 'node22',
  platform: 'node',
  outDir: 'dist',
  clean: true,
  sourcemap: true,
  noExternal: ['@nguoi-que/core'],
  outExtension: () => ({ js: '.cjs' }),
});
