import type { FactionId } from '@stickman-war/core';

/**
 * Bảng màu phong cách "bóng đêm neon" lấy từ ảnh nền màn đăng nhập: stickman là bóng đen tuyền, viền sáng
 * màu phe, mắt phát sáng; mũ giáp là bóng đen sáng hơn một chút; vũ khí và phép toả sáng theo màu nền văn minh.
 */

/** Thân stickman. */
export const SIL = '#0a0811';
/** Mũ, giáp, cán vũ khí, khung máy: bóng đen sáng hơn thân để còn thấy chi tiết. */
export const GEAR = '#1d1729';
/** Mặt sáng của giáp, đầu búa, lưỡi rìu… */
export const GEAR_HI = '#352c4a';
/** Màu đêm dùng để pha tối mọi màu gốc. */
export const NIGHT = '#0d0a16';

/** Màu năng lượng của từng hệ (vũ khí, phép, cửa sổ, hoa văn): sáng, bão hoà hơn màu giao diện. */
export const ENERGY: Record<FactionId, string> = {
  light: '#ffd84a',
  wind: '#a8ecff',
  wood: '#7dff6a',
  shadow: '#b77bff',
  thunder: '#ffe94a',
  blood: '#ff2d3c',
  crystal: '#b98cff',
  stone: '#ffb43a',
  metal: '#ffd34a',
  water: '#6fe0ff',
  fire: '#ff7a1a',
  ice: '#bfeaff',
};

/**
 * Màu vải (áo choàng, khăn) của lính từng nền văn minh — cùng bộ màu với docs/art/unit-prompts.md.
 * Phe không phân biệt bằng màu lính nữa mà bằng thanh máu (xanh lá phe mình, đỏ phe địch).
 */
export const CLOTH: Record<FactionId, string> = {
  light: '#e8a91c',
  wind: '#2f8fc4',
  wood: '#1f6b26',
  shadow: '#3d1a66',
  thunder: '#1d4fa0',
  blood: '#9c0f1c',
  crystal: '#5a28a8',
  stone: '#8a7442',
  metal: '#9e1c22',
  water: '#3aa6e6',
  fire: '#e0401c',
  ice: '#2b67b8',
};

/** Chi tiết riêng trên thân lính từng hệ (theo ảnh mẫu docs/art/demo/<hệ>.png). */
export type Trait = 'motes' | 'bandage' | 'bark' | 'smoke' | 'bolt' | 'veins' | 'shards' | 'stone' | 'armor' | 'water' | 'embers' | 'ice';

/**
 * "Bộ da" lính từng hệ theo 12 ảnh mẫu `docs/art/demo/<hệ>.png`:
 * màu thân, viền sáng quanh thân và mắt, màu + viền tóc, chi tiết trên thân, độ trong của vải.
 */
export type Skin = {
  /** Màu thân (vẫn rất tối, chỉ ánh màu hệ; riêng Thủy là thân nước trong). */
  body: string;
  /** Viền sáng quanh thân, quầng mắt. */
  rim: string;
  /** Màu tóc / mũ trên đầu và nét viền của nó. */
  hair: string;
  hairRim: string;
  trait: Trait;
  /** Vải trong suốt (dải nước của hệ Thủy). */
  clothAlpha?: number;
};

export const SKIN: Record<FactionId, Skin> = {
  light: { body: '#1a1206', rim: '#ffcf3a', hair: '#f5c033', hairRim: '#fff1a0', trait: 'motes' },
  wind: { body: '#141c2c', rim: '#8fdcff', hair: '#dfe9f2', hairRim: '#9fe6ff', trait: 'bandage' },
  wood: { body: '#0f2a12', rim: '#5cff5a', hair: '#1f5a1f', hairRim: '#7dff6a', trait: 'bark' },
  shadow: { body: '#120a1c', rim: '#a35cff', hair: '#1c0f2c', hairRim: '#b388ff', trait: 'smoke' },
  thunder: { body: '#081224', rim: '#ffd52a', hair: '#0f2a5c', hairRim: '#ffe14a', trait: 'bolt' },
  blood: { body: '#1e0608', rim: '#ff2a3a', hair: '#2a0508', hairRim: '#ff2d3c', trait: 'veins' },
  crystal: { body: '#1c0f38', rim: '#9c6bff', hair: '#3a1f78', hairRim: '#c9a8ff', trait: 'shards' },
  stone: { body: '#22201d', rim: '#ffb43a', hair: '#45423f', hairRim: '#c9b48a', trait: 'stone' },
  metal: { body: '#0c0c10', rim: '#ffcc3a', hair: '#b8bec8', hairRim: '#ffd34a', trait: 'armor' },
  water: { body: '#14609e', rim: '#5fd4ff', hair: '#1c78c4', hairRim: '#8ae6ff', trait: 'water', clothAlpha: 0.65 },
  fire: { body: '#140604', rim: '#ff7a1a', hair: '#ff6a14', hairRim: '#ffd36a', trait: 'embers' },
  ice: { body: '#0c1a30', rim: '#7fd0ff', hair: '#5fb4f0', hairRim: '#e2f6ff', trait: 'ice' },
};

type RGB = [number, number, number];
const parsed = new Map<string, RGB | null>();

function parse(c: string): RGB | null {
  const hit = parsed.get(c);
  if (hit !== undefined) return hit;
  let v: RGB | null = null;
  const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(c);
  if (m) {
    const h = m[1].length === 3 ? [...m[1]].map((x) => x + x).join('') : m[1];
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
  }
  parsed.set(c, v);
  return v;
}

const hex = (n: number) =>
  Math.round(Math.max(0, Math.min(255, n)))
    .toString(16)
    .padStart(2, '0');

const mixed = new Map<string, string>();

/** Pha màu a với b theo tỉ lệ t (0 = a, 1 = b). Màu không phải hex thì giữ nguyên a. */
export function mix(a: string, b: string, t: number): string {
  const key = `${a}|${b}|${t}`;
  const hit = mixed.get(key);
  if (hit) return hit;
  const x = parse(a);
  const y = parse(b);
  const out = x && y ? `#${hex(x[0] + (y[0] - x[0]) * t)}${hex(x[1] + (y[1] - x[1]) * t)}${hex(x[2] + (y[2] - x[2]) * t)}` : a;
  mixed.set(key, out);
  return out;
}

/** Màu gốc chìm vào bóng đêm (giữ chút sắc độ để còn phân biệt). */
export const night = (c: string, k = 0.62) => mix(c, NIGHT, k);

/** Màu hex kèm độ trong suốt. */
export function rgba(c: string, a: number): string {
  const x = parse(c);
  return x ? `rgba(${x[0]}, ${x[1]}, ${x[2]}, ${a})` : c;
}
