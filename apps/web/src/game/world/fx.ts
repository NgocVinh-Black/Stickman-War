/**
 * Hiệu ứng cho demo thế giới nhìn từ trên: tư thế đánh (nghiêng / nhún / lao) dựng từ 1 sprite bằng cách dời từng
 * hàng pixel (giữ nét pixel, không xoay ảnh), hạt sáng, số sát thương chữ pixel, vệt chém, mũi tên.
 */

export type ActionKind =
  'mine' | 'slash' | 'shoot' | 'stab' | 'thrust' | 'charge' | 'cast' | 'drum' | 'heal' | 'smash' | 'launch' | 'build' | 'skill';

/**
 * Làm tròn toạ độ vẽ về điểm ảnh THẬT của màn hình (1/Z pixel nghệ thuật) thay vì cả ô pixel nghệ thuật: chuyển động
 * (nghiêng, nhún, thở, rung, camera) đi từng điểm ảnh nên mượt, mỗi ô pixel vẫn vuông nét vì Z là số nguyên.
 */
let Z = 1;
export const setSnap = (z: number) => {
  Z = Math.max(1, Math.round(z));
};
export const q = (v: number) => Math.round(v * Z) / Z;

/** Thời lượng (giây) và các mốc ra đòn (tỉ lệ 0..1) của từng kiểu hành động. */
export const ACTIONS: Record<ActionKind, { dur: number; hits: number[] }> = {
  mine: { dur: 0.5, hits: [0.5] },
  slash: { dur: 0.56, hits: [0.5] }, // giơ kiếm cao đủ lâu để thấy rồi mới chém
  shoot: { dur: 0.78, hits: [0.6] }, // nâng cung, kéo dây ngắm lâu hơn rồi mới bắn
  stab: { dur: 0.44, hits: [0.32, 0.62] },
  thrust: { dur: 0.5, hits: [0.46] }, // giáo binh: thu giáo về sau khiên rồi đâm một nhát dài
  charge: { dur: 0.62, hits: [0.5] }, // kỵ binh: thúc ngựa lao tới, chĩa giáo kỵ đâm ở cuối đà
  cast: { dur: 0.6, hits: [0.5] }, // pháp sư: giơ gậy tụ sáng rồi phóng cầu ánh sáng
  drum: { dur: 0.42, hits: [0.5] }, // tay trống: giơ dùi rồi nện trống, sóng âm toả quanh người
  build: { dur: 0.5, hits: [0.5] }, // thợ xây: giơ búa rồi nện
  launch: { dur: 1, hits: [0.56] }, // máy phóng: kéo cần ra sau rồi hất quả cầu sáng bay vòng cung
  smash: { dur: 0.82, hits: [0.6] }, // khổng lồ: giơ chuỳ cao qua đầu rồi nện xuống đất
  heal: { dur: 0.7, hits: [0.5] }, // tu sĩ: giơ gậy tụ thánh quang rồi toả vòng hồi máu quanh người
  skill: { dur: 1.3, hits: [0.42] }, // kỹ năng riêng (dải khung vẽ sẵn anim.skill): bùng sáng ở khung 4
};

export interface Pose {
  /** Nghiêng thân (pixel ở đỉnh đầu), dương = ngả về phía trước. */
  lean: number;
  /** Co giãn chiều cao: dương = vươn cao, âm = nhún xuống. */
  stretch: number;
  /** Đẩy cả hình về phía trước (pixel). */
  lunge: number;
}

const ease = (t: number) => t * t * (3 - 2 * t);
const seg = (p: number, a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));

/** Tư thế theo tiến độ p (0..1) của hành động: lấy đà → ra đòn → thu về. */
// [lấy đà kết thúc, ra đòn kết thúc], tư thế lấy đà, tư thế ra đòn
const SPEC: Record<ActionKind, [number, number, Pose, Pose]> = {
  mine: [0.42, 0.56, { lean: -3, stretch: 0.07, lunge: -1 }, { lean: 5, stretch: -0.09, lunge: 3 }],
  slash: [0.4, 0.56, { lean: -2, stretch: 0.03, lunge: -1 }, { lean: 5, stretch: -0.04, lunge: 5 }],
  shoot: [0.4, 0.66, { lean: -2, stretch: 0.02, lunge: -2 }, { lean: -4, stretch: 0, lunge: -3 }],
  stab: [0.18, 0.3, { lean: 2, stretch: -0.08, lunge: 0 }, { lean: 5, stretch: -0.02, lunge: 4 }],
  thrust: [0.36, 0.48, { lean: -2, stretch: -0.04, lunge: -2 }, { lean: 4, stretch: -0.03, lunge: 6 }],
  charge: [0.4, 0.52, { lean: 3, stretch: -0.03, lunge: 0 }, { lean: 5, stretch: -0.02, lunge: 5 }],
  cast: [0.42, 0.54, { lean: -2, stretch: 0.05, lunge: -1 }, { lean: 3, stretch: -0.02, lunge: 2 }],
  drum: [0.4, 0.52, { lean: -1, stretch: 0.04, lunge: 0 }, { lean: 2, stretch: -0.06, lunge: 0 }],
  build: [0.42, 0.56, { lean: -3, stretch: 0.06, lunge: -1 }, { lean: 5, stretch: -0.08, lunge: 3 }],
  launch: [0.46, 0.56, { lean: 0, stretch: -0.02, lunge: 0 }, { lean: 1, stretch: 0.02, lunge: 0 }],
  smash: [0.48, 0.6, { lean: -4, stretch: 0.06, lunge: -2 }, { lean: 6, stretch: -0.08, lunge: 4 }],
  heal: [0.44, 0.58, { lean: -1, stretch: 0.06, lunge: 0 }, { lean: 1, stretch: 0.03, lunge: 0 }],
  skill: [0.42, 0.6, { lean: 0, stretch: 0, lunge: 0 }, { lean: 0, stretch: 0, lunge: 0 }],
};

/** Các pha của hành động tại tiến độ p: w = lấy đà, s = ra đòn, r = thu về (đều 0..1), follow = quán tính khi thu về. */
function phases(kind: ActionKind, p: number) {
  const [a, b] = SPEC[kind];
  const w = ease(seg(p, 0, a));
  const s = 1 - Math.pow(1 - seg(p, a, b), 3); // ra đòn: bật nhanh rồi chậm lại
  const r = ease(seg(p, b, 1));
  // Thu về có quán tính: vượt nhẹ sang phía ngược rồi mới đứng lại (follow-through)
  const follow = Math.sin(r * Math.PI) * (1 - r) * 0.45;
  return { w, s, r, follow, strikeEnd: b };
}

/** Tư thế thân theo tiến độ p (0..1) của hành động: lấy đà → ra đòn → thu về. */
export function actionPose(kind: ActionKind, p: number): Pose {
  const [, , wind, hit] = SPEC[kind];
  const { w, s, r, follow } = phases(kind, p);
  const mix = (k: keyof Pose) => (wind[k] * w + (hit[k] - wind[k]) * s) * (1 - r) - hit[k] * follow;
  return { lean: mix('lean'), stretch: mix('stretch'), lunge: mix('lunge') };
}

/** Mức "giữ tư thế" (0..1): lên dần khi lấy đà, giữ suốt lúc ra đòn, hạ dần khi thu về. */
export function actionHold(kind: ActionKind, p: number): number {
  const { w, r } = phases(kind, p);
  return w * (1 - r);
}

/** Khung chân lúc đánh: bước tấn (khung 1) từ lúc lấy đà tới hết ra đòn, rồi đứng lại (khung 0). */
export function actionLegFrame(kind: ActionKind, p: number): number {
  const { strikeEnd } = phases(kind, p);
  return p < (kind === 'stab' ? 0.75 : strikeEnd + 0.12) ? 1 : 0;
}

/**
 * Tay cầm vũ khí: góc xoay quanh vai (radian) và độ đâm tới dọc theo vũ khí, nội suy giữa góc lấy đà `aw` và góc
 * ra đòn `as` (độ, theo rigs.json). Sát thủ đâm 2 nhát: rút tay về rồi phóng ra ở mỗi mốc ra đòn.
 */
export function armSwing(
  kind: ActionKind,
  p: number,
  aw: number,
  as: number,
  push: number,
  /** Sát thủ 2 dao: chỉ tính nhát đâm thứ `only` (dao 0 đâm nhát đầu, dao 1 đâm nhát sau). */
  only?: number,
): { angle: number; push: number } {
  // Dao thứ hai chậm một nhịp: dùng tiến độ lùi lại bằng khoảng cách giữa 2 nhát
  const lag = kind === 'stab' && only ? ACTIONS.stab.hits[only] - ACTIONS.stab.hits[0] : 0;
  const { w, s, r, follow } = phases(kind, Math.max(0, p - lag));
  const deg = (aw * w + (as - aw) * s) * (1 - r) - as * follow * 0.6;
  let d: number;
  if (kind === 'stab') {
    d = 0;
    for (const [i, h] of ACTIONS.stab.hits.entries()) {
      if (only !== undefined && i !== only) continue;
      const k = (p - h) / 0.07;
      d += push * Math.exp(-k * k) - push * 0.4 * Math.exp(-((k + 1.6) * (k + 1.6))); // rút về rồi đâm ra
    }
  } else if (kind === 'shoot') {
    // Cung: nâng lên ngang tầm ngắm, giữ suốt lúc kéo dây và bắn, rồi hạ xuống (hơi quá đà)
    d = push * w * (1 - r) - push * follow * 0.8;
  } else d = (-push * 0.5 * w + push * 1.5 * s) * (1 - r);
  return { angle: (deg * Math.PI) / 180, push: d };
}

// ---------- hạt & số bay lên ----------
export interface Particle {
  x: number;
  y: number;
  /** Độ cao so với mặt đất (vẽ lệch lên trên). */
  z: number;
  vx: number;
  vy: number;
  vz: number;
  life: number;
  max: number;
  color: string;
  size: number;
  /** Trọng lực theo trục z (px/s²); 0 = trôi lơ lửng. */
  g: number;
}
export interface Floater {
  x: number;
  y: number;
  text: string;
  color: string;
  t: number;
}

export function burst(
  list: Particle[],
  x: number,
  y: number,
  z: number,
  n: number,
  colors: string[],
  speed: number,
  up = 60,
  g = 260,
): void {
  for (let i = 0; i < n; i++) {
    const a = Math.random() * Math.PI * 2;
    const v = speed * (0.4 + Math.random() * 0.6);
    list.push({
      x,
      y,
      z,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v * 0.6,
      vz: up * (0.5 + Math.random()),
      life: 0,
      max: 0.35 + Math.random() * 0.35,
      color: colors[i % colors.length],
      size: Math.random() < 0.3 ? 2 : 1,
      g,
    });
  }
}

export function stepParticles(list: Particle[], dt: number): void {
  for (let i = list.length - 1; i >= 0; i--) {
    const p = list[i];
    p.life += dt;
    if (p.life >= p.max) {
      list.splice(i, 1);
      continue;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.vz -= p.g * dt;
    p.z = Math.max(0, p.z + p.vz * dt);
    if (p.z === 0 && p.g > 0) {
      p.vx *= 0.6;
      p.vy *= 0.6;
    }
  }
}

export function drawParticles(ctx: CanvasRenderingContext2D, list: Particle[], camX: number, camY: number): void {
  for (const p of list) {
    // Nhấp nháy ở cuối đời
    if (p.life > p.max * 0.7 && Math.floor(p.life * 30) % 2) continue;
    ctx.fillStyle = p.color;
    ctx.fillRect(q(p.x - camX), q(p.y - p.z - camY), p.size, p.size);
  }
}

// Chữ số pixel 3x5 (đủ cho số sát thương và "+N")
const GLYPHS: Record<string, string> = {
  '0': '111101101101111',
  '1': '010110010010111',
  '2': '111001111100111',
  '3': '111001111001111',
  '4': '101101111001001',
  '5': '111100111001111',
  '6': '111100111101111',
  '7': '111001010010010',
  '8': '111101111101111',
  '9': '111101111001111',
  '+': '000010111010000',
  '!': '010010010000010',
  '%': '101001010100101',
};

export function drawPixelText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, color: string): void {
  const w = text.length * 4 - 1;
  let cx = q(x - w / 2);
  const cy = q(y);
  for (const ch of text) {
    const g = GLYPHS[ch];
    if (g) {
      // Viền tối 1px rồi chữ
      for (const [ox, oy, col] of [
        [-1, 0, '#1b1209'],
        [1, 0, '#1b1209'],
        [0, -1, '#1b1209'],
        [0, 1, '#1b1209'],
        [0, 0, color],
      ] as [number, number, string][]) {
        ctx.fillStyle = col;
        for (let i = 0; i < 15; i++) if (g[i] === '1') ctx.fillRect(cx + (i % 3) + ox, cy + Math.floor(i / 3) + oy, 1, 1);
      }
    }
    cx += 4;
  }
}

export function drawFloaters(ctx: CanvasRenderingContext2D, list: Floater[], camX: number, camY: number, dt: number): void {
  for (let i = list.length - 1; i >= 0; i--) {
    const f = list[i];
    f.t += dt;
    if (f.t > 0.9) {
      list.splice(i, 1);
      continue;
    }
    // Bật lên nhanh rồi trôi chậm
    const rise = 14 * (1 - Math.pow(1 - Math.min(1, f.t / 0.35), 3)) + f.t * 6;
    if (f.t > 0.7 && Math.floor(f.t * 30) % 2) continue;
    drawPixelText(ctx, f.text, f.x - camX, f.y - rise - camY, f.color);
  }
}

/**
 * Vệt chém hình cung quanh tâm (cx, cy), hướng `angle`, quét từ -span..+span. `head` (0..1) là đầu vệt đang quét
 * tới; phần đuôi mờ dần. Vẽ bằng ô pixel nên vẫn nét khi phóng to.
 */
export function drawArc(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  angle: number,
  span: number,
  head: number,
  tail: number,
  colors: string[],
): void {
  const from = Math.max(0, head - tail);
  const steps = Math.ceil(r * Math.abs(span) * 2); // span âm: quét ngược chiều
  for (let i = 0; i <= steps; i++) {
    const u = (i / steps) * head;
    if (u < from) continue;
    const a = angle - span + u * span * 2;
    const k = (u - from) / Math.max(0.001, head - from); // 0 ở đuôi, 1 ở đầu
    const thick = Math.round(1 + k * (colors.length - 1));
    for (let j = 0; j < thick; j++) {
      const rr = r - j;
      ctx.fillStyle = colors[Math.min(colors.length - 1, j + (k < 0.4 ? 1 : 0))];
      ctx.fillRect(q(cx + Math.cos(a) * rr), q(cy + Math.sin(a) * rr * 0.8), 1, 1);
    }
  }
}

/**
 * Vẽ một khung sprite theo từng hàng pixel để tạo tư thế mà không làm nhoè: mỗi hàng dời ngang theo độ nghiêng
 * (tỉ lệ với độ cao so với chân), co giãn chiều cao, phần thân trên (trên `legRows` hàng chân) nhún `bob` pixel
 * (lẻ được, tính theo điểm ảnh thật).
 * Toạ độ cục bộ của sprite: hướng "phía trước" của hàng nhìn ngang là -x (ảnh quay mặt sang trái); hàm gọi lo lật gương.
 */
/**
 * Mũi tên pixel: mũi trắng có ngạnh, thân gỗ vàng, lông đuôi sáng. (x, y) là đầu mũi, (ux, uy) hướng bay.
 */
export function drawArrowSprite(ctx: CanvasRenderingContext2D, x: number, y: number, ux: number, uy: number, len = 12): void {
  const nx = -uy;
  const ny = ux;
  const dot = (i: number, side: number, color: string) => {
    ctx.fillStyle = color;
    ctx.fillRect(q(x - ux * i + nx * side), q(y - uy * i + ny * side), 1, 1);
  };
  for (let i = 0; i < len; i++) dot(i, 0, i < 2 ? '#ffffff' : i % 3 === 0 ? '#a8741a' : '#d9a441');
  dot(2, 1, '#e8ecf2'); // ngạnh mũi tên
  dot(2, -1, '#e8ecf2');
  for (let i = len - 3; i < len; i++) {
    dot(i + 1, 1, '#fff3a8'); // lông đuôi
    dot(i + 1, -1, '#fff3a8');
  }
}

/** Bàn tay pixel 3x3 (găng đen viền vàng) — tay thứ hai nắm chuôi kiếm, tay kéo dây cung, tay nhặt vàng. */
export function drawGlove(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = q(x) - 1;
  const cy = q(y) - 1;
  ctx.fillStyle = '#120c06';
  ctx.fillRect(cx - 1, cy, 5, 3);
  ctx.fillRect(cx, cy - 1, 3, 5);
  ctx.fillStyle = '#2a1d12';
  ctx.fillRect(cx, cy, 3, 3);
  ctx.fillStyle = '#ffd34a';
  ctx.fillRect(cx, cy, 2, 1);
  ctx.fillStyle = '#c9921e';
  ctx.fillRect(cx + 2, cy + 1, 1, 1);
}

/**
 * Cánh tay pixel từ vai (x0, y0) tới bàn tay (x1, y1): tay áo đen dày 3px, lõi nâu sáng và viền vàng ở mép trên
 * (như vân sáng trên thân) để cánh tay nổi lên cả khi nằm đè trên thân áo đen. Bàn tay vẽ riêng bằng drawGlove.
 */
export function drawLimb(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))));
  const at = (t: number) => ({ x: q(x0 + (x1 - x0) * t), y: q(y0 + (y1 - y0) * t) });
  // Pháp tuyến hướng lên trên (mép được ánh sáng chiếu), làm tròn về 1 ô pixel
  const len = Math.hypot(x1 - x0, y1 - y0) || 1;
  let nx = (y1 - y0) / len;
  let ny = -(x1 - x0) / len;
  if (ny > 0 || (ny === 0 && nx > 0)) {
    nx = -nx;
    ny = -ny;
  }
  const ex = Math.round(nx);
  const ey = Math.round(ny);
  ctx.fillStyle = '#120c06';
  for (let i = 0; i <= n; i++) {
    const p = at(i / n);
    ctx.fillRect(p.x - 1, p.y - 1, 3, 3);
  }
  ctx.fillStyle = '#5a3e1e';
  for (let i = 1; i < n; i++) {
    const p = at(i / n);
    ctx.fillRect(p.x, p.y, 1, 1);
  }
  ctx.fillStyle = '#c9921e';
  for (let i = 1; i < n; i++) {
    const p = at(i / n);
    ctx.fillRect(p.x + ex, p.y + ey, 1, 1);
  }
}

/**
 * Cánh tay 2 đoạn (vai → khuỷu → bàn tay), mỗi đoạn dài `seg` pixel: giải IK 2 khớp, khuỷu chĩa xuống và ra ngoài
 * thân (toạ độ cục bộ: x = 0 là giữa người) nên 2 tay cùng nắm 1 cán vẫn tách hình, không chập thành 1 đường.
 * Bàn tay xa quá tầm với thì tay duỗi thẳng tới đó (luôn dính vào cán).
 */
export function drawArmIK(ctx: CanvasRenderingContext2D, sx: number, sy: number, hx: number, hy: number, seg = 5): void {
  const d = Math.hypot(hx - sx, hy - sy);
  if (d >= seg * 2 - 0.5 || d < 0.5) {
    drawLimb(ctx, sx, sy, hx, hy);
    return;
  }
  const base = Math.atan2(hy - sy, hx - sx);
  const bend = Math.acos(Math.min(1, d / (2 * seg)));
  const side = sx >= 0 ? 1 : -1;
  const elbow = (k: number) => ({ x: sx + Math.cos(base + k * bend) * seg, y: sy + Math.sin(base + k * bend) * seg });
  const e1 = elbow(1);
  const e2 = elbow(-1);
  const score = (e: { x: number; y: number }) => e.y + e.x * side * 0.6;
  const e = score(e1) >= score(e2) ? e1 : e2;
  drawLimb(ctx, sx, sy, e.x, e.y);
  drawLimb(ctx, e.x, e.y, hx, hy);
}

/** Đoạn thẳng pixel 1px (dây cung). */
export function drawLine(ctx: CanvasRenderingContext2D, x0: number, y0: number, x1: number, y1: number, color: string): void {
  const n = Math.max(1, Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) * Z));
  ctx.fillStyle = color;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    ctx.fillRect(q(x0 + (x1 - x0) * t), q(y0 + (y1 - y0) * t), 1 / Z, 1 / Z);
  }
}

/** Túi vàng vác sau lưng thợ mỏ: bao da phồng theo bán kính r, miệng buộc dây, vàng + kim cương ló ra. */
/**
 * Trống đeo hông nhìn ngang (ảnh gốc góc nghiêng bị thân che mất trống): thân trống tròn sẫm có đai vàng, mặt trống
 * quay về phía trước (bên trái, hướng mặt nhân vật) như một elip đứng. (x, y): tâm thân trống; hit 0..1: mặt trống loé
 * sáng ngay lúc dùi nện.
 */
/**
 * Chuỳ vàng vẽ bằng pixel (khổng lồ: ảnh gốc bị đầu che mất khúc giữa chuỳ nên lúc vung vẽ lại cả cây cho liền):
 * từ chỗ nắm (x0, y0) theo hướng (ux, uy) dài L, bán kính r0 ở chuôi phình dần tới r1 ở đầu chuỳ; núm vàng sau
 * nắm tay, đai sẫm, mép trên sáng, đầu chuỳ loé.
 */
export function drawClub(
  ctx: CanvasRenderingContext2D,
  x0: number,
  y0: number,
  ux: number,
  uy: number,
  L: number,
  r0: number,
  r1: number,
): void {
  let nx = -uy;
  let ny = ux;
  if (ny > 0 || (ny === 0 && nx > 0)) {
    nx = -nx;
    ny = -ny;
  }
  const ox = q(x0);
  const oy = q(y0);
  const T0 = -3; // núm chuôi thò ra sau nắm tay
  const steps = Math.ceil((L - T0) * 1.6);
  // Chuôi nhỏ tới hết nắm tay rồi phình nhanh thành thân trụ to đều như chuỳ trong ảnh gốc
  const rad = (t: number) => (t < 0 ? 1.8 : r0 + (r1 - r0) * Math.min(1, Math.max(0, (t - 6) / 8)));
  for (const pass of [0, 1]) {
    for (let i = 0; i <= steps; i++) {
      const t = T0 + (i / steps) * (L - T0);
      // Đầu chuỳ bo tròn
      const r = t > L - 2 ? rad(t) * Math.sqrt(Math.max(0, 1 - ((t - (L - 2)) / 2.5) ** 2)) : rad(t);
      for (let s = -r - 1; s <= r + 1; s += 0.5) {
        const d = Math.abs(s);
        if (d > (pass === 0 ? r + 1 : r)) continue;
        let c = '#120c06';
        if (pass === 1) {
          const k = -s / Math.max(0.5, r); // 1 = mép trên (ánh sáng), -1 = mép dưới
          // Núm chuôi vàng, chuôi bọc da, đầu chuỳ loé sáng, 2 đai sẫm, còn lại thân vàng sáng dần lên mép trên
          const band = Math.abs(t - L * 0.45) < 0.8 || Math.abs(t - L * 0.78) < 0.8;
          if (t < 0) c = k > 0 ? '#ffd34a' : '#c9921e';
          else if (t < 8) c = k > 0.3 ? '#8a5a2a' : '#5a3a1a';
          else if (t > L - 2.5) c = k > -0.3 ? '#fff3a8' : '#ffd34a';
          else if (band) c = '#6b4410';
          else c = k > 0.55 ? '#fff3a8' : k > 0.15 ? '#ffd34a' : k > -0.4 ? '#e0a020' : '#a8700f';
        }
        ctx.fillStyle = c;
        ctx.fillRect(ox + Math.round(ux * t + nx * s), oy + Math.round(uy * t + ny * s), 1, 1);
      }
    }
  }
}

/** Nắm tay to (khổng lồ) nắm cán vũ khí: khối tối viền đen, đốt tay vàng. */
export function drawFist(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  const cx = q(x);
  const cy = q(y);
  ctx.fillStyle = '#120c06';
  ctx.fillRect(cx - 3, cy - 2, 7, 5);
  ctx.fillRect(cx - 2, cy - 3, 5, 7);
  ctx.fillStyle = '#2a1a0c';
  ctx.fillRect(cx - 2, cy - 2, 5, 5);
  ctx.fillStyle = '#c9921e';
  ctx.fillRect(cx - 2, cy - 2, 5, 1);
  ctx.fillStyle = '#ffd34a';
  ctx.fillRect(cx - 1, cy - 2, 1, 1);
  ctx.fillRect(cx + 1, cy - 2, 1, 1);
}

export function drawSideDrum(ctx: CanvasRenderingContext2D, x: number, y: number, hit: number): void {
  const cx = q(x);
  const cy = q(y);
  const H = 6; // nửa chiều cao
  const px = (dx: number, dy: number, w: number, h: number, c: string) => {
    ctx.fillStyle = c;
    ctx.fillRect(cx + dx, cy + dy, w, h);
  };
  // Viền ngoài, bo góc cho tròn như thùng trống
  px(-3, -H - 1, 7, 2 * H + 3, '#120c06');
  px(-4, -H, 9, 2 * H + 1, '#120c06');
  // Thân trống: sẫm, sáng dần lên phía trên; đai vàng trên / dưới và dây chéo
  px(-1, -H, 4, 2 * H + 1, '#3a2410');
  px(-1, -H, 4, 3, '#5a3a1a');
  px(-1, -H, 4, 1, '#ffd34a');
  px(-1, H, 4, 1, '#c9921e');
  px(3, -H + 1, 1, 2 * H - 1, '#3a2410');
  for (let i = 0; i < 2 * H - 1; i += 4) {
    px(0 + (i % 8 ? 2 : 0), -H + 2 + i, 1, 1, '#c9921e');
    px(1, -H + 3 + i, 1, 1, '#c9921e');
  }
  // Vành mặt trống (vàng) + mặt trống (kem; trắng loé khi nện)
  px(-3, -H + 1, 2, 2 * H - 1, '#c9921e');
  px(-3, -H + 2, 1, 2 * H - 3, hit > 0 ? '#ffffff' : '#fff3a8');
  px(-2, -H + 2, 1, 2 * H - 3, '#ffd34a');
  if (hit > 0.4) {
    px(-5, -2, 1, 5, '#ffffff');
    px(-6, -1, 1, 3, '#fff3a8');
  }
}

export function drawSack(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, full = true): void {
  const cx = q(x);
  const cy = q(y);
  const rx = Math.round(r);
  const ry = Math.round(r * 0.9);
  for (let j = -ry - 1; j <= ry + 1; j++) {
    for (let i = -rx - 1; i <= rx + 1; i++) {
      const d = (i * i) / ((rx + 0.5) * (rx + 0.5)) + (j * j) / ((ry + 0.5) * (ry + 0.5));
      const dOut = (i * i) / ((rx + 1.5) * (rx + 1.5)) + (j * j) / ((ry + 1.5) * (ry + 1.5));
      if (d <= 1) {
        const lit = (-i - j) / (r * 1.6);
        ctx.fillStyle = lit > 0.35 ? '#b88552' : lit > -0.2 ? '#8f5f33' : '#6b4426';
      } else if (dOut <= 1) ctx.fillStyle = '#1b1209';
      else continue;
      ctx.fillRect(cx + i, cy + j, 1, 1);
    }
  }
  // Miệng túi buộc dây + vàng ló ra
  ctx.fillStyle = '#1b1209';
  ctx.fillRect(cx - 2, cy - ry - 3, 5, 2);
  ctx.fillStyle = '#5a3a22';
  ctx.fillRect(cx - 1, cy - ry - 1, 3, 1);
  if (!full) return; // túi rỗng: không có vàng ló ra
  ctx.fillStyle = '#ffd34a';
  ctx.fillRect(cx - 1, cy - ry - 3, 2, 1);
  ctx.fillStyle = '#fff3a8';
  ctx.fillRect(cx, cy - ry - 3, 1, 1);
  if (r >= 5) {
    ctx.fillStyle = '#7fd3ff';
    ctx.fillRect(cx + 1, cy - ry - 2, 1, 1);
  }
}

export interface RowOpt {
  lean: number;
  stretch: number;
  bob: number;
  legRows: number;
  sway: number;
  wave: number;
  phase: number;
  /** Vạt áo choàng: các cột từ `cut` trở đi trong hàng top..bottom bay theo gió (mạnh dần về phía gấu áo). */
  /**
   * flag: lá cờ treo trên cán (bên phải cán; left: bên trái) — cột pole..cut-1 là cán cờ, vẽ như thanh cứng theo hàng
   * nắm `anchor` (chỉ nghiêng theo thân, không uốn theo gió / tóc); lá cờ dính vào cán và chỉ bay ra xa cán.
   * spanTop..spanBottom: cả lá cờ (biên độ bay tăng dần liền mạch qua các khúc).
   */
  cape?:
    | {
        cut: number;
        top: number;
        bottom: number;
        amp: number;
        flag?: boolean;
        left?: boolean;
        pole?: number;
        anchor?: number;
        spanTop?: number;
        spanBottom?: number;
      }[]
    | null;
  flap?: number;
  flapPhase?: number;
}

/** Vị trí vẽ của hàng `row` theo tư thế: độ dời ngang và toạ độ y trên màn hình (dùng chung cho thân và vai). */
export function rowPos(row: number, footY: number, baseY: number, opt: RowOpt): { x: number; y: number } {
  const up = (footY - row) / footY; // 0 ở chân, 1 ở đỉnh đầu
  // Nghiêng thân + đầu lắc + sóng gió lướt qua tóc / áo choàng (mạnh dần lên phía trên)
  const ox = -opt.lean * up + opt.sway * up * up + opt.wave * up * Math.sin(opt.phase - row * 0.32);
  const y = baseY - q((footY - row) * (1 + opt.stretch)) + (row < footY - opt.legRows ? opt.bob : 0);
  return { x: q(ox), y };
}

export function drawRows(
  ctx: CanvasRenderingContext2D,
  img: CanvasImageSource,
  sx: number,
  sy: number,
  w: number,
  h: number,
  dx: number,
  footY: number,
  baseY: number,
  opt: RowOpt,
): void {
  for (let row = 0; row < h; row++) {
    const { x, y: y0 } = rowPos(row, footY, baseY, opt);
    const y1 = rowPos(row + 1, footY, baseY, opt).y;
    const hh = Math.max(1 / Z, y1 - y0);
    const c = opt.cape?.find((k) => row >= k.top && row <= k.bottom);
    if (c?.flag && opt.flap && c.pole !== undefined) {
      // Cán cờ cứng: độ dời của hàng nắm, cộng phần nghiêng thân (tuyến tính theo độ cao nên cán vẫn thẳng)
      const a = c.anchor ?? c.bottom;
      const lean = (r: number) => -opt.lean * ((footY - r) / footY);
      const px = rowPos(a, footY, baseY, opt).x + q(lean(row) - lean(a));
      const t = (row - (c.spanTop ?? c.top)) / Math.max(1, (c.spanBottom ?? c.bottom) - (c.spanTop ?? c.top));
      const f = Math.max(0, q(opt.flap * c.amp * (0.2 + t) * (Math.sin((opt.flapPhase ?? 0) - row * 0.45) + 0.35)));
      // Lá cờ [a0, a1) bay ra xa cán; phần còn lại của hàng [b0, b1) theo thân như thường
      const [a0, a1, b0, b1] = c.left ? [0, c.pole, c.cut, w] : [c.cut, w, 0, c.pole];
      if (b1 > b0) ctx.drawImage(img, sx + b0, sy + row, b1 - b0, 1, dx + x + b0, y0, b1 - b0, hh);
      if (a1 > a0) {
        ctx.drawImage(img, sx + a0, sy + row, a1 - a0, 1, dx + px + a0, y0, a1 - a0, hh); // lấp khe khi cờ bay ra
        ctx.drawImage(img, sx + a0, sy + row, a1 - a0, 1, dx + px + a0 + (c.left ? -f : f), y0, a1 - a0, hh);
      }
      ctx.drawImage(img, sx + c.pole, sy + row, c.cut - c.pole, 1, dx + px + c.pole, y0, c.cut - c.pole, hh);
    } else if (c && opt.flap && c.cut < w) {
      // Gió lùa: sóng chạy từ vai xuống gấu áo, biên độ tăng dần, hơi dạt về phía sau
      const t = (row - c.top) / Math.max(1, c.bottom - c.top);
      const f = q(opt.flap * c.amp * (0.2 + t) * (Math.sin((opt.flapPhase ?? 0) - row * 0.45) + 0.35));
      if (c.cut > 0) ctx.drawImage(img, sx, sy + row, c.cut, 1, dx + x, y0, c.cut, hh);
      const cw = w - c.cut;
      if (f > 0) ctx.drawImage(img, sx + c.cut, sy + row, cw, 1, dx + x + c.cut, y0, cw, hh); // lấp khe khi vạt bay ra
      ctx.drawImage(img, sx + c.cut, sy + row, cw, 1, dx + x + c.cut + f, y0, cw, hh);
    } else ctx.drawImage(img, sx, sy + row, w, 1, dx + x, y0, w, hh);
  }
}
