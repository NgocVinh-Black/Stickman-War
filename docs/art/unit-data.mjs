// In ra JSON dữ liệu 144 lính (12 hệ × 12 loại) lấy thẳng từ lõi game: tên, mô tả, tỉ lệ, vũ khí, khiên, thú cưỡi, máy.
// gen_pixel_prompts.py gọi file này để prompt vẽ luôn khớp số liệu game. Chạy: node docs/art/unit-data.mjs (Node ≥ 23)
import { registerHooks } from 'node:module';

// Lõi game import không ghi đuôi ('./units'): thử thêm .ts khi Node không tìm thấy
registerHooks({
  resolve(spec, ctx, next) {
    try {
      return next(spec, ctx);
    } catch (e) {
      if (spec.startsWith('.') && !spec.endsWith('.ts')) return next(`${spec}.ts`, ctx);
      throw e;
    }
  },
});

const root = new URL('../../packages/core/src/', import.meta.url);
const { FACTION_ORDER } = await import(new URL('factions.ts', root).href);
const { ARCH_ORDER, UNITS, kindOf } = await import(new URL('units.ts', root).href);

const out = FACTION_ORDER.map((f) => ({
  faction: f,
  units: ARCH_ORDER.map((a) => {
    const u = UNITS[kindOf(f, a)];
    return { arch: a, name: u.name, desc: u.desc, scale: u.scale ?? 1, look: u.look ?? {} };
  }),
}));
process.stdout.write(JSON.stringify(out));
