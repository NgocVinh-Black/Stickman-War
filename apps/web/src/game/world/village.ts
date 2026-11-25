/**
 * Demo thế giới nhìn từ trên (top-down 2D pixel art): một ngôi làng vẽ hoàn toàn bằng code, cố định theo seed.
 * Mặt đất (cỏ, đường đất, ao) vẽ sẵn một lần vào canvas lớn; vật (nhà, cây, đá…) vẽ sẵn thành sprite, mỗi khung
 * chỉ xếp theo độ sâu (chân thấp hơn vẽ sau) cùng nhân vật. Không phải luật chơi nên không đặt trong packages/core.
 */
export const TILE = 24;
export const MAP_W = 56;
export const MAP_H = 36;
export const WORLD_W = MAP_W * TILE;
export const WORLD_H = MAP_H * TILE;

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}
export interface Prop {
  sprite: HTMLCanvasElement;
  /** Toạ độ đặt góc trên trái của sprite trong thế giới. */
  x: number;
  y: number;
  /** Độ sâu để xếp thứ tự vẽ: y của chân vật. */
  depth: number;
  /** Lấp lánh (quặng vàng): các điểm sáng nhấp nháy. */
  sparkle?: { x: number; y: number }[];
  /** Vật đánh / đào được (mỏ vàng, hình nộm): rung khi trúng đòn. */
  target?: Target;
}
/** Mục tiêu tương tác: `hit` là vùng trúng đòn trong thế giới, `hitAt` / `hitDir` do màn chơi ghi lúc trúng. */
export interface Target {
  kind: 'mine' | 'dummy';
  hit: Rect;
  /** Bóng trắng cùng hình (chớp sáng lúc trúng). */
  flash: HTMLCanvasElement;
  hitAt: number;
  hitDir: number;
}
export interface Village {
  ground: HTMLCanvasElement;
  props: Prop[];
  solids: Rect[];
  water: (x: number, y: number) => boolean;
  spawn: { x: number; y: number };
  targets: Target[];
}

// ---------- ngẫu nhiên tất định ----------
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function hash(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
/** Nhiễu giá trị mượt (0..1) theo ô cỡ `s`. */
function noise(x: number, y: number, s: number): number {
  const gx = x / s;
  const gy = y / s;
  const x0 = Math.floor(gx);
  const y0 = Math.floor(gy);
  const fx = gx - x0;
  const fy = gy - y0;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const a = hash(x0, y0);
  const b = hash(x0 + 1, y0);
  const c = hash(x0, y0 + 1);
  const d = hash(x0 + 1, y0 + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

type RGB = [number, number, number];
const hex = (h: string): RGB => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const C = {
  grass: ['#4a7f2e', '#5a9338', '#6aa642', '#7fba4e'].map(hex),
  dirt: ['#a9824f', '#bf9862', '#d1ad77', '#dfc08e'].map(hex),
  sand: ['#d6bc84', '#e6cf9a'].map(hex),
  water: ['#2f5f9e', '#3b74b8', '#4f8fd0', '#7fb6e6'].map(hex),
  outline: hex('#2a1d14'),
};

// ---------- bố cục làng ----------
const POND = { cx: 9.5 * TILE, cy: 27.5 * TILE, rx: 6.2 * TILE, ry: 4.4 * TILE };
const PLAZA = { x0: 22 * TILE, y0: 12 * TILE, x1: 35 * TILE, y1: 20.5 * TILE };
const HOUSES: { tx: number; ty: number; kind: 'thatch' | 'tile' }[] = [
  { tx: 12, ty: 5, kind: 'thatch' },
  { tx: 21, ty: 3, kind: 'tile' },
  { tx: 39, ty: 4, kind: 'thatch' },
  { tx: 40, ty: 23, kind: 'tile' },
  { tx: 22, ty: 25, kind: 'thatch' },
  { tx: 31, ty: 26, kind: 'tile' },
];
const HOUSE_W = 5 * TILE;
const HOUSE_WALL = 2 * TILE; // chiều cao tường (phần chạm đất có va chạm)

function onPath(x: number, y: number): boolean {
  const j = (noise(x, y, 18) - 0.5) * 10; // mép đường lởm chởm
  const xx = x + j;
  const yy = y + j;
  if (xx > PLAZA.x0 && xx < PLAZA.x1 && yy > PLAZA.y0 && yy < PLAZA.y1) return true;
  if (yy > 15 * TILE && yy < 18 * TILE) return true; // đường ngang
  if (xx > 27 * TILE && xx < 29.6 * TILE) return true; // đường dọc
  for (const h of HOUSES) {
    // lối nhỏ từ cửa nhà ra đường
    const dx = (h.tx + 2.5) * TILE;
    const doorY = (h.ty + 4) * TILE;
    const toY = doorY < 16 * TILE ? 15.5 * TILE : 17.5 * TILE;
    if (Math.abs(xx - dx) < TILE * 0.8 && yy > Math.min(doorY, toY) - 4 && yy < Math.max(doorY, toY) + 4) return true;
  }
  return false;
}
function pondValue(x: number, y: number): number {
  const j = (noise(x, y, 22) - 0.5) * 0.25;
  return ((x - POND.cx) / POND.rx) ** 2 + ((y - POND.cy) / POND.ry) ** 2 + j;
}
const isWater = (x: number, y: number) => pondValue(x, y) < 1;

// ---------- mặt đất ----------
function paintGround(): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(WORLD_W, WORLD_H);
  const d = img.data;
  for (let y = 0; y < WORLD_H; y++) {
    for (let x = 0; x < WORLD_W; x++) {
      const pv = pondValue(x, y);
      let col: RGB;
      const n = noise(x, y, 26) * 0.7 + noise(x, y, 7) * 0.3; // vệt màu to, mịn: đỡ lốm đốm
      const speck = hash(x, y);
      if (pv < 1) {
        const depth = Math.min(1, (1 - pv) * 2.2);
        col = C.water[depth > 0.75 ? 0 : depth > 0.4 ? 1 : depth > 0.12 ? 2 : 3];
      } else if (pv < 1.16) {
        col = C.sand[n > 0.5 ? 1 : 0];
      } else if (onPath(x, y)) {
        col = C.dirt[n < 0.3 ? 1 : n < 0.72 ? 2 : 3];
        if (speck > 0.994) col = C.dirt[0];
      } else {
        col = C.grass[n < 0.3 ? 1 : n < 0.7 ? 2 : 3];
        if (speck > 0.988) col = C.grass[3];
        else if (speck < 0.01) col = C.grass[0];
      }
      const i = (y * WORLD_W + x) * 4;
      d[i] = col[0];
      d[i + 1] = col[1];
      d[i + 2] = col[2];
      d[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  // Điểm trang trí: cụm cỏ, hoa, sỏi
  const r = rng(11);
  for (let k = 0; k < 900; k++) {
    const x = Math.floor(r() * WORLD_W);
    const y = Math.floor(r() * WORLD_H);
    if (pondValue(x, y) < 1.25) continue;
    if (onPath(x, y)) {
      if (r() < 0.5) pebble(ctx, x, y, r);
      continue;
    }
    const t = r();
    if (t < 0.6) tuft(ctx, x, y);
    else flower(ctx, x, y, ['#f4e04d', '#ffffff', '#e86a8e', '#9ec8ff'][Math.floor(r() * 4)]);
  }
  return c;
}
function px(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w = 1, h = 1): void {
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), w, h);
}
function tuft(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  px(ctx, '#3f6f26', x, y + 1, 1, 2);
  px(ctx, '#3f6f26', x + 2, y, 1, 3);
  px(ctx, '#3f6f26', x + 4, y + 1, 1, 2);
  px(ctx, '#8fcc5c', x + 2, y);
}
function flower(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
  px(ctx, '#3f6f26', x + 1, y + 2, 1, 2);
  px(ctx, color, x, y + 1);
  px(ctx, color, x + 2, y + 1);
  px(ctx, color, x + 1, y);
  px(ctx, color, x + 1, y + 2);
  px(ctx, '#f7c948', x + 1, y + 1);
}
function pebble(ctx: CanvasRenderingContext2D, x: number, y: number, r: () => number): void {
  const w = 2 + Math.floor(r() * 3);
  px(ctx, '#8a7a66', x, y + 1, w, 1);
  px(ctx, '#b3a48e', x, y, w - 1, 1);
}

// ---------- sprite vật ----------
function sprite(w: number, h: number, draw: (ctx: CanvasRenderingContext2D) => void): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = w + 2;
  c.height = h + 2;
  const ctx = c.getContext('2d')!;
  ctx.translate(1, 1);
  draw(ctx);
  outline(ctx, c.width, c.height);
  return c;
}
/** Viền tối 1px quanh hình (phong cách pixel art). */
function outline(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  const img = ctx.getImageData(0, 0, w, h);
  const a = img.data;
  const solid = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) solid[i] = a[i * 4 + 3] > 0 ? 1 : 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (solid[i]) continue;
      if ((x > 0 && solid[i - 1]) || (x < w - 1 && solid[i + 1]) || (y > 0 && solid[i - w]) || (y < h - 1 && solid[i + w])) {
        a[i * 4] = C.outline[0];
        a[i * 4 + 1] = C.outline[1];
        a[i * 4 + 2] = C.outline[2];
        a[i * 4 + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}
/** Hình tròn pixel tô theo 3 bậc sáng: sáng phía trên trái, tối phía dưới phải. */
function blob(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number, cols: string[], seed: number): void {
  for (let y = -r; y <= r; y++) {
    for (let x = -r; x <= r; x++) {
      const dd = (x * x + y * y) / (r * r);
      const edge = hash(x + seed, y - seed) * 0.18;
      if (dd > 1 - edge) continue;
      const lit = (-x - y) / (r * 1.6) + (hash(x * 3 + seed, y * 5) - 0.5) * 0.35;
      ctx.fillStyle = cols[lit > 0.45 ? 3 : lit > 0.05 ? 2 : lit > -0.45 ? 1 : 0];
      ctx.fillRect(cx + x, cy + y, 1, 1);
    }
  }
}
function treeSprite(seed: number): HTMLCanvasElement {
  const r = rng(seed);
  const pine = r() < 0.3;
  return sprite(44, 60, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(10, 54, 24, 4);
    ctx.fillRect(13, 58, 18, 2);
    px(ctx, '#5a3a20', 19, 40, 6, 17);
    px(ctx, '#7a5230', 19, 40, 2, 17);
    px(ctx, '#3e2814', 24, 40, 1, 17);
    if (pine) {
      const cols = ['#1f4d2c', '#2b6639', '#3c8048', '#5aa060'];
      for (let i = 0; i < 4; i++) {
        const top = 2 + i * 10;
        const half = 8 + i * 4;
        for (let y = 0; y < 14; y++) {
          const w = Math.round((half * y) / 14);
          for (let x = -w; x <= w; x++) {
            const lit = -x / (half + 1) + (hash(x + seed, y + i * 20) - 0.5) * 0.5;
            ctx.fillStyle = cols[lit > 0.4 ? 3 : lit > 0 ? 2 : lit > -0.45 ? 1 : 0];
            ctx.fillRect(22 + x, top + y, 1, 1);
          }
        }
      }
    } else {
      const cols = ['#24562a', '#337a35', '#4a9a40', '#79c255'];
      blob(ctx, 14, 28, 11, cols, seed);
      blob(ctx, 30, 28, 11, cols, seed + 7);
      blob(ctx, 22, 18, 14, cols, seed + 3);
      blob(ctx, 22, 32, 10, cols, seed + 5);
      if (r() < 0.4) for (let i = 0; i < 5; i++) px(ctx, '#d8423a', 10 + r() * 24, 12 + r() * 24, 2, 2); // quả
    }
  });
}
function houseSprite(kind: 'thatch' | 'tile', seed: number): HTMLCanvasElement {
  const r = rng(seed);
  const W = HOUSE_W;
  const roofH = 46;
  const wallH = HOUSE_WALL;
  return sprite(W, roofH + wallH + 6, (ctx) => {
    const wy = roofH - 6;
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(6, wy + wallH, W - 4, 6);
    // Tường: vữa sáng, khung gỗ
    px(ctx, '#e6d2aa', 4, wy, W - 8, wallH);
    for (let y = wy; y < wy + wallH; y += 3) for (let x = 4; x < W - 4; x += 1) if (hash(x, y + seed) > 0.9) px(ctx, '#cfb88c', x, y);
    px(ctx, '#7a5232', 4, wy, 3, wallH);
    px(ctx, '#7a5232', W - 7, wy, 3, wallH);
    px(ctx, '#7a5232', 4, wy + wallH - 4, W - 8, 4);
    px(ctx, '#6b4a2e', W / 2 - 18, wy, 2, wallH - 4);
    px(ctx, '#6b4a2e', W / 2 + 16, wy, 2, wallH - 4);
    // Đá móng
    for (let x = 4; x < W - 4; x += 6) px(ctx, hash(x, seed) > 0.5 ? '#8f949a' : '#a9aeb4', x, wy + wallH - 3, 5, 3);
    // Cửa
    px(ctx, '#4a2f1a', W / 2 - 8, wy + 14, 16, wallH - 14);
    px(ctx, '#6e4628', W / 2 - 6, wy + 16, 12, wallH - 17);
    px(ctx, '#4a2f1a', W / 2 - 1, wy + 16, 1, wallH - 17);
    px(ctx, '#e8c050', W / 2 + 3, wy + 30, 2, 2);
    px(ctx, '#8c8c8c', W / 2 - 10, wy + wallH - 2, 20, 2);
    // Cửa sổ
    for (const wx of [16, W - 34]) {
      px(ctx, '#5a3a22', wx - 2, wy + 12, 22, 18);
      px(ctx, '#2f4f73', wx, wy + 14, 18, 14);
      px(ctx, '#5f8fbf', wx, wy + 14, 8, 6);
      px(ctx, '#5a3a22', wx + 8, wy + 14, 2, 14);
      px(ctx, '#5a3a22', wx, wy + 20, 18, 2);
      if (r() < 0.6) {
        px(ctx, '#7a5232', wx - 2, wy + 30, 22, 3);
        for (let i = 0; i < 5; i++) px(ctx, ['#e8604c', '#f4d24d', '#f29bb8'][i % 3], wx + i * 4, wy + 28, 3, 2);
      }
    }
    // Mái
    if (kind === 'thatch') {
      const cols = ['#8f6a2c', '#b48a3e', '#d4ad58', '#e8c878'];
      for (let y = 0; y < roofH; y++) {
        const inset = Math.max(0, 14 - y);
        for (let x = inset; x < W - inset; x++) {
          const band = (y + Math.floor(hash(x >> 2, seed) * 3)) % 7;
          const lit = band < 2 ? 3 : band < 4 ? 2 : band < 6 ? 1 : 0;
          const shade = y > roofH - 5 ? 0 : lit;
          ctx.fillStyle = cols[hash(x, y + seed) > 0.93 ? Math.max(0, shade - 1) : shade];
          ctx.fillRect(x, y, 1, 1);
        }
      }
      for (let x = 2; x < W - 2; x += 3) px(ctx, '#6e5020', x, roofH - 1, 2, 2 + Math.floor(hash(x, seed) * 3)); // tua rơm
    } else {
      const cols = ['#6a3420', '#8c4a2a', '#b5653a', '#d88a55'];
      for (let y = 0; y < roofH; y++) {
        const inset = Math.max(0, 14 - y);
        const row = Math.floor(y / 5);
        for (let x = inset; x < W - inset; x++) {
          const tileEdge = (x + (row % 2) * 4) % 8 === 0;
          const yIn = y % 5;
          const c = yIn === 4 ? 0 : tileEdge ? 1 : yIn === 0 ? 3 : 2;
          ctx.fillStyle = cols[y > roofH - 4 ? 0 : c];
          ctx.fillRect(x, y, 1, 1);
        }
      }
    }
    // Ống khói
    if (r() < 0.6) {
      px(ctx, '#7c838c', W - 30, 0, 10, 14);
      px(ctx, '#9aa0a8', W - 30, 0, 4, 14);
      px(ctx, '#5e646c', W - 31, 0, 12, 2);
    }
  });
}
function rockSprite(seed: number, gold: boolean): { c: HTMLCanvasElement; sparkle: { x: number; y: number }[] } {
  const r = rng(seed);
  const sparkle: { x: number; y: number }[] = [];
  const c = sprite(22, 18, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(2, 14, 20, 3);
    blob(ctx, 11, 9, 8, ['#5e646c', '#7c838c', '#9aa0a8', '#c4c9cf'], seed);
    if (gold) {
      for (let i = 0; i < 5; i++) {
        const x = 5 + Math.floor(r() * 12);
        const y = 4 + Math.floor(r() * 9);
        px(ctx, '#c9921e', x, y + 1, 2, 1);
        px(ctx, '#ffd34a', x, y, 2, 1);
        sparkle.push({ x: x + 1, y: y + 1 });
      }
    }
  });
  return { c, sparkle };
}
const barrelSprite = () =>
  sprite(12, 15, (ctx) => {
    px(ctx, '#7a4e2a', 0, 2, 12, 12);
    px(ctx, '#9c6a3a', 2, 2, 3, 12);
    px(ctx, '#5a5f66', 0, 4, 12, 1);
    px(ctx, '#5a5f66', 0, 10, 12, 1);
    px(ctx, '#5e3a1e', 0, 0, 12, 3);
    px(ctx, '#3e2612', 2, 1, 8, 1);
  });
const crateSprite = () =>
  sprite(14, 14, (ctx) => {
    px(ctx, '#a8763e', 0, 0, 14, 14);
    px(ctx, '#c89458', 0, 0, 14, 2);
    px(ctx, '#7a5230', 0, 6, 14, 2);
    px(ctx, '#7a5230', 6, 0, 2, 14);
  });
const logsSprite = () =>
  sprite(30, 16, (ctx) => {
    for (const [x, y] of [
      [0, 8],
      [10, 8],
      [5, 1],
    ]) {
      px(ctx, '#6b4426', x, y + 1, 18, 6);
      px(ctx, '#8a5a32', x, y + 1, 18, 2);
      px(ctx, '#d9b47a', x + 16, y, 4, 8);
      px(ctx, '#b48a52', x + 17, y + 2, 2, 4);
    }
  });
const fenceSprite = (len: number) =>
  sprite(len, 14, (ctx) => {
    px(ctx, '#8a5a32', 0, 4, len, 2);
    px(ctx, '#8a5a32', 0, 9, len, 2);
    for (let x = 0; x < len; x += 8) {
      px(ctx, '#a8763e', x, 0, 3, 14);
      px(ctx, '#6b4426', x + 2, 0, 1, 14);
    }
  });
const wellSprite = () =>
  sprite(30, 40, (ctx) => {
    px(ctx, '#6b4426', 2, 6, 3, 22);
    px(ctx, '#6b4426', 25, 6, 3, 22);
    for (let y = 0; y < 8; y++) px(ctx, y < 6 ? '#b5653a' : '#6a3420', -1 + y, y, 32 - y * 2, 1); // mái nhỏ
    px(ctx, '#3a2a1a', 13, 8, 2, 12); // dây
    px(ctx, '#7a5232', 11, 18, 6, 5);
    for (let x = 0; x < 30; x += 5) {
      px(ctx, hash(x, 1) > 0.5 ? '#8f949a' : '#a9aeb4', x, 24, 5, 6);
      px(ctx, hash(x, 2) > 0.5 ? '#7c838c' : '#9aa0a8', x + 2, 30, 5, 6);
    }
    px(ctx, '#2f5f9e', 6, 24, 18, 3);
  });
const signSprite = () =>
  sprite(16, 22, (ctx) => {
    px(ctx, '#6b4426', 7, 8, 3, 14);
    px(ctx, '#a8763e', 0, 0, 16, 10);
    px(ctx, '#c89458', 0, 0, 16, 2);
    px(ctx, '#5a3a22', 3, 4, 10, 1);
    px(ctx, '#5a3a22', 3, 7, 7, 1);
  });
/** Mỏ vàng: ụ đá có cửa hầm khung gỗ, mạch vàng và đống quặng trước cửa. */
function mineSprite(): { c: HTMLCanvasElement; sparkle: { x: number; y: number }[] } {
  const sparkle: { x: number; y: number }[] = [];
  const rock = ['#4e535a', '#6b7179', '#8a9099', '#b3b9c0'];
  const c = sprite(64, 50, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(4, 44, 58, 5);
    blob(ctx, 18, 28, 16, rock, 11);
    blob(ctx, 44, 28, 16, rock, 12);
    blob(ctx, 31, 20, 18, rock, 13);
    // Cửa hầm tối + khung gỗ
    px(ctx, '#17110c', 21, 24, 20, 22);
    px(ctx, '#2a1d12', 23, 26, 16, 3);
    px(ctx, '#7a4e2a', 18, 22, 4, 24);
    px(ctx, '#7a4e2a', 40, 22, 4, 24);
    px(ctx, '#a8763e', 19, 22, 1, 24);
    px(ctx, '#a8763e', 41, 22, 1, 24);
    px(ctx, '#6b4426', 15, 19, 32, 4);
    px(ctx, '#9c6a3a', 15, 19, 32, 1);
    // Ray xe goòng ra khỏi hầm
    px(ctx, '#5a5f66', 25, 44, 1, 4);
    px(ctx, '#5a5f66', 36, 44, 1, 4);
    for (let y = 45; y < 49; y += 2) px(ctx, '#6b4426', 23, y, 16, 1);
    // Mạch vàng trên đá
    const veins = [
      [8, 24],
      [12, 32],
      [27, 8],
      [35, 11],
      [50, 22],
      [54, 31],
      [45, 15],
    ];
    for (const [x, y] of veins) {
      px(ctx, '#a8741a', x, y + 1, 3, 1);
      px(ctx, '#ffd34a', x, y, 3, 1);
      px(ctx, '#fff3a8', x + 1, y, 1, 1);
      sparkle.push({ x: x + 2, y: y + 1 });
    }
    // Đống quặng vàng bên phải cửa hầm
    blob(ctx, 51, 43, 4, ['#8a5a10', '#c9921e', '#ffd34a', '#fff3a8'], 21);
    blob(ctx, 57, 44, 3, ['#8a5a10', '#c9921e', '#ffd34a', '#fff3a8'], 22);
    sparkle.push({ x: 52, y: 41 });
  });
  return { c, sparkle };
}
/** Hình nộm tập đánh: cọc gỗ, thân bao rơm có hồng tâm, đầu bao bố. */
const dummySprite = () =>
  sprite(22, 38, (ctx) => {
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.fillRect(3, 34, 16, 3);
    px(ctx, '#6b4426', 10, 14, 3, 22); // cọc
    px(ctx, '#8a5a32', 10, 14, 1, 22);
    px(ctx, '#6b4426', 1, 14, 20, 3); // xà ngang làm tay
    px(ctx, '#8a5a32', 1, 14, 20, 1);
    px(ctx, '#d9b25a', 0, 13, 3, 5); // túm rơm ở đầu tay
    px(ctx, '#d9b25a', 19, 13, 3, 5);
    px(ctx, '#c79a48', 5, 12, 12, 16); // thân bao rơm
    px(ctx, '#e0bc6a', 5, 12, 4, 16);
    px(ctx, '#9c7434', 5, 19, 12, 1); // dây buộc
    px(ctx, '#9c7434', 5, 25, 12, 1);
    px(ctx, '#c0392b', 8, 15, 6, 6); // hồng tâm
    px(ctx, '#f2efe6', 9, 16, 4, 4);
    px(ctx, '#c0392b', 10, 17, 2, 2);
    px(ctx, '#bfa070', 6, 1, 10, 10); // đầu bao bố
    px(ctx, '#d6bb8a', 7, 1, 4, 9);
    px(ctx, '#3a2a1a', 8, 5, 2, 1); // mắt khâu chữ thập
    px(ctx, '#3a2a1a', 12, 5, 2, 1);
    px(ctx, '#3a2a1a', 9, 8, 4, 1);
    px(ctx, '#9c7434', 7, 11, 8, 1);
    px(ctx, '#d9b25a', 9, 0, 4, 1); // rơm thò trên đầu
  });
/** Bóng trắng cùng dáng sprite để chớp sáng khi trúng đòn. */
function whiteOf(src: HTMLCanvasElement): HTMLCanvasElement {
  const c = document.createElement('canvas');
  c.width = src.width;
  c.height = src.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(src, 0, 0);
  ctx.globalCompositeOperation = 'source-in';
  ctx.fillStyle = '#fffbe6';
  ctx.fillRect(0, 0, c.width, c.height);
  return c;
}
const bushSprite = (seed: number) =>
  sprite(20, 14, (ctx) => {
    blob(ctx, 7, 8, 6, ['#24562a', '#337a35', '#4a9a40', '#79c255'], seed);
    blob(ctx, 13, 8, 6, ['#24562a', '#337a35', '#4a9a40', '#79c255'], seed + 1);
  });

// ---------- dựng làng ----------
export function buildVillage(): Village {
  const ground = paintGround();
  const props: Prop[] = [];
  const solids: Rect[] = [];
  const targets: Target[] = [];
  const add = (c: HTMLCanvasElement, x: number, y: number, solid?: Rect, sparkle?: { x: number; y: number }[]) => {
    const p: Prop = { sprite: c, x: Math.round(x), y: Math.round(y), depth: y + c.height - 2, sparkle };
    props.push(p);
    if (solid) solids.push(solid);
    return p;
  };
  const addTarget = (p: Prop, kind: Target['kind'], hit: Rect) => {
    p.target = { kind, hit, flash: whiteOf(p.sprite), hitAt: -1e9, hitDir: 1 };
    targets.push(p.target);
  };
  const blocked = (x: number, y: number, w: number, h: number) =>
    solids.some((s) => x < s.x + s.w + 6 && x + w + 6 > s.x && y < s.y + s.h + 6 && y + h + 6 > s.y);

  HOUSES.forEach((h, i) => {
    const c = houseSprite(h.kind, 40 + i);
    const x = h.tx * TILE;
    const y = (h.ty + 4) * TILE - c.height + 6;
    add(c, x, y, { x: x + 5, y: y + c.height - HOUSE_WALL - 6, w: HOUSE_W - 8, h: HOUSE_WALL - 2 });
  });
  // Giếng giữa quảng trường, biển chỉ đường, đồ đạc
  const well = wellSprite();
  add(well, 31 * TILE, 12 * TILE, { x: 31 * TILE + 1, y: 12 * TILE + 26, w: 30, h: 14 });
  add(signSprite(), 25 * TILE, 13 * TILE, { x: 25 * TILE + 7, y: 13 * TILE + 18, w: 4, h: 4 });
  const things: [HTMLCanvasElement, number, number][] = [
    [barrelSprite(), 17.4, 8.6],
    [barrelSprite(), 18, 9],
    [crateSprite(), 26.6, 7.2],
    [crateSprite(), 44.6, 8.2],
    [logsSprite(), 46, 27],
    [logsSprite(), 18, 29],
    [barrelSprite(), 36.6, 27.4],
  ];
  for (const [c, tx, ty] of things) add(c, tx * TILE, ty * TILE, { x: tx * TILE, y: ty * TILE + c.height - 7, w: c.width - 2, h: 6 });
  // Mỏ vàng bên phải quảng trường, 2 hình nộm ở góc dưới quảng trường (gần chỗ xuất phát)
  {
    const { c, sparkle } = mineSprite();
    const x = 36.4 * TILE;
    const y = 10.2 * TILE;
    const p = add(c, x, y, { x: x + 4, y: y + 22, w: c.width - 8, h: c.height - 26 }, sparkle);
    addTarget(p, 'mine', { x: x + 2, y: y + 8, w: c.width - 4, h: c.height - 8 });
  }
  for (const tx of [32.2, 34]) {
    const c = dummySprite();
    const x = tx * TILE;
    const y = 19.5 * TILE - c.height + 4; // chân ngang hàng chỗ xuất phát
    const p = add(c, x, y, { x: x + 7, y: y + c.height - 6, w: 8, h: 4 });
    addTarget(p, 'dummy', { x: x + 1, y: y + 1, w: c.width - 2, h: c.height - 2 });
    p.depth = y + c.height - 7; // đứng ngang hàng thì nhân vật vẽ đè lên (đòn đánh không bị che)
  }
  // Hàng rào quanh vườn
  for (let i = 0; i < 4; i++) {
    const f = fenceSprite(TILE);
    add(f, (44 + i) * TILE, 21 * TILE, { x: (44 + i) * TILE, y: 21 * TILE + 8, w: TILE, h: 5 });
    add(fenceSprite(TILE), (5 + i) * TILE, 9 * TILE, { x: (5 + i) * TILE, y: 9 * TILE + 8, w: TILE, h: 5 });
  }
  // Mỏ đá có quặng vàng ở góc trên phải
  const r = rng(5);
  for (let i = 0; i < 14; i++) {
    const x = (46 + r() * 8) * TILE;
    const y = (10 + r() * 8) * TILE;
    const { c, sparkle } = rockSprite(100 + i, i % 2 === 0);
    if (blocked(x, y + 10, c.width, 8)) continue;
    add(c, x, y, { x: x + 2, y: y + 10, w: c.width - 4, h: 6 }, sparkle);
  }
  // Cây: viền rừng quanh làng + rải rác, tránh đường, nước, nhà
  const tryTree = (x: number, y: number, seed: number) => {
    const c = treeSprite(seed);
    const fx = x + 22;
    const fy = y + 56;
    if (fx < 0 || fy > WORLD_H + 20) return;
    if (onPath(fx, fy) || onPath(fx - 12, fy) || onPath(fx + 12, fy) || pondValue(fx, fy) < 1.35) return;
    if (blocked(x + 14, y + 50, 16, 8)) return;
    // Chừa trống quanh mỏ vàng / hình nộm để tán cây không che
    if (targets.some((t) => fx > t.hit.x - 30 && fx < t.hit.x + t.hit.w + 30 && fy > t.hit.y - 10 && fy < t.hit.y + t.hit.h + 60)) return;
    add(c, x, y, { x: x + 17, y: y + 50, w: 10, h: 6 });
  };
  for (let x = -10; x < WORLD_W; x += 26 + Math.floor(r() * 10)) {
    tryTree(x, -24 + r() * 10, 300 + x);
    tryTree(x, WORLD_H - 50 + r() * 10, 500 + x);
  }
  for (let y = 20; y < WORLD_H - 40; y += 30 + Math.floor(r() * 12)) {
    tryTree(-14 + r() * 8, y, 700 + y);
    tryTree(WORLD_W - 34 + r() * 8, y, 900 + y);
  }
  for (let i = 0; i < 70; i++) tryTree(r() * WORLD_W, r() * WORLD_H, 1000 + i);
  for (let i = 0; i < 30; i++) {
    const x = r() * WORLD_W;
    const y = r() * WORLD_H;
    if (onPath(x, y + 12) || pondValue(x, y) < 1.4 || blocked(x, y + 8, 20, 6)) continue;
    if (targets.some((t) => x > t.hit.x - 24 && x < t.hit.x + t.hit.w + 4 && y > t.hit.y - 16 && y < t.hit.y + t.hit.h + 8)) continue;
    add(bushSprite(2000 + i), x, y);
  }
  props.sort((a, b) => a.depth - b.depth);
  // Viền thế giới
  solids.push(
    { x: -20, y: 0, w: 20, h: WORLD_H },
    { x: WORLD_W, y: 0, w: 20, h: WORLD_H },
    { x: 0, y: -20, w: WORLD_W, h: 20 },
    { x: 0, y: WORLD_H, w: WORLD_W, h: 20 },
  );
  return { ground, props, solids, water: isWater, spawn: { x: 28.3 * TILE, y: 19.5 * TILE }, targets };
}
