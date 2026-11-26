// In ra JSON dữ liệu 144 lính (12 hệ × 12 loại) lấy thẳng từ lõi game: tên, mô tả, tỉ lệ, vũ khí, khiên, thú cưỡi, máy,
// kỹ năng riêng (tham số + tên tiếng Anh). gen_prompts.py gọi file này để prompt vẽ luôn khớp game.
// Chạy: node docs/art/prompts/unit-data.mjs (Node ≥ 23)
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

const root = new URL('../../../packages/core/src/', import.meta.url);
const { FACTION_ORDER } = await import(new URL('factions.ts', root).href);
const { ARCH_ORDER, UNITS, kindOf } = await import(new URL('units.ts', root).href);
const { SKILLS } = await import(new URL('skills.ts', root).href);
const i18n = new URL('../../../packages/i18n/src/', import.meta.url);
const { SKILL_EN } = await import(new URL('content-en.ts', i18n).href);

const out = FACTION_ORDER.map((f) => ({
  faction: f,
  units: ARCH_ORDER.map((a) => {
    const u = UNITS[kindOf(f, a)];
    const skill = { ...SKILLS[f][a], en: SKILL_EN[f][a] };
    return { arch: a, name: u.name, desc: u.desc, scale: u.scale ?? 1, look: u.look ?? {}, skill };
  }),
}));
process.stdout.write(JSON.stringify(out));
