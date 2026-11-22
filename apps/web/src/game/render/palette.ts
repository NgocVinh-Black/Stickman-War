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
  light: '#ffe08a',
  wind: '#c6fff0',
  wood: '#7dff6a',
  shadow: '#b388ff',
  thunder: '#fff36b',
  blood: '#ff2d3c',
  crystal: '#ff8af0',
  stone: '#e8b46a',
  metal: '#ff8c3a',
  water: '#4fd2ff',
  fire: '#ff7a1a',
  ice: '#e3f6ff',
};

/**
 * Màu vải (áo choàng, khăn), mắt và viền sáng của lính từng nền văn minh — cùng bộ màu với docs/art/unit-prompts.md.
 * Phe không phân biệt bằng màu lính nữa mà bằng thanh máu (xanh lá phe mình, đỏ phe địch).
 */
export const CLOTH: Record<FactionId, string> = {
  light: '#f1ead2',
  wind: '#3fae86',
  wood: '#2e8b3a',
  shadow: '#4a1f7a',
  thunder: '#e0b400',
  blood: '#a3101e',
  crystal: '#b0249e',
  stone: '#7a5c3e',
  metal: '#56606e',
  water: '#1d5fd1',
  fire: '#d9381e',
  ice: '#9cc9f5',
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
