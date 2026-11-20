import { UNITS, type UnitKind } from '@stickman-war/core';
import { TEAM_COLORS } from './render/renderer';
import { drawStickman, type StickPose } from './render/stickman';

/** Tư thế dùng cho ô giới thiệu quân ở sảnh: đi bộ tại chỗ, ra đòn (thợ mỏ: đào), đứng thở. */
export function showcasePose(kind: UnitKind, sec: number, now: number, accent: string): StickPose {
  const walking = sec < 1.4;
  const act = sec >= 1.4 && sec < 2.2 ? ((sec - 1.4) / 0.8) * 2 : -1;
  const miner = UNITS[kind].arch === 'miner';
  return {
    kind,
    walk: walking ? now / 120 : 0,
    moving: walking,
    attack: miner ? -1 : act,
    mining: miner && act >= 0 ? act * Math.PI : -1,
    carrying: false,
    ink: TEAM_COLORS[0].ink,
    accent,
    flash: false,
  };
}

type Box = { x0: number; y0: number; x1: number; y1: number };
const boxes = new Map<UnitKind, Box>();
const PROBE = 1.5; // tỉ lệ vẽ thử khi đo
const SIZE = 600;

/**
 * Vùng bao thật (đơn vị vẽ, gốc ở chân) của một quân qua mọi tư thế trong ô giới thiệu:
 * vẽ thử lên canvas ẩn rồi quét điểm ảnh. Đo một lần cho mỗi loại quân.
 */
export function unitBox(kind: UnitKind): Box {
  const cached = boxes.get(kind);
  if (cached) return cached;
  const c = document.createElement('canvas');
  c.width = SIZE;
  c.height = SIZE;
  const ctx = c.getContext('2d', { willReadFrequently: true })!;
  const ox = SIZE / 2;
  const oy = SIZE * 0.7;
  const poses: [number, number][] = [];
  for (let i = 0; i < 24; i++) poses.push([0.1, i * 13]); // các pha bước chân
  for (let i = 0; i <= 32; i++) poses.push([1.4 + (i / 32) * 0.8, 0]); // vung đòn / đào (dày để bắt cả tia lửa nòng)
  poses.push([3, 0]);
  for (const [sec, now] of poses) {
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(PROBE, PROBE);
    drawStickman(ctx, showcasePose(kind, sec, now, '#888'));
    ctx.restore();
  }
  const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
  let x0 = SIZE;
  let y0 = SIZE;
  let x1 = 0;
  let y1 = 0;
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++)
      if (data[(y * SIZE + x) * 4 + 3] > 8) {
        if (x < x0) x0 = x;
        if (x > x1) x1 = x;
        if (y < y0) y0 = y;
        if (y > y1) y1 = y;
      }
  // Chừa thêm 2 đơn vị mỗi phía cho khung hình xen giữa các tư thế đã đo
  const box =
    x1 < x0
      ? { x0: -20, y0: -60, x1: 20, y1: 0 }
      : { x0: (x0 - ox) / PROBE - 2, y0: (y0 - oy) / PROBE - 2, x1: (x1 + 1 - ox) / PROBE + 2, y1: (y1 + 1 - oy) / PROBE };
  boxes.set(kind, box);
  return box;
}

/** Quân lướt: đứng chờ tới DASH_START rồi lướt vút tới trong khoảng [DASH_START, DASH_END] trước khi ra đòn. */
const DASH_START = 0.8;
const DASH_END = 1.25;
/** Quãng lướt (đơn vị vẽ) tính tới chỗ đứng ra đòn. */
const DASH_DIST = 70;

/**
 * Vẽ một quân trong ô giới thiệu đúng như trong trận: quân lướt (ninja…) có pha lướt kèm vệt bóng mờ và người
 * chúi về trước; quân tàng hình mờ gần trong suốt, chỉ hiện rõ lúc ra đòn. Gốc toạ độ ở chân quân.
 */
export function drawShowcase(ctx: CanvasRenderingContext2D, kind: UnitKind, sec: number, now: number, pose: Partial<StickPose> = {}): void {
  const s = UNITS[kind];
  const base = { ...showcasePose(kind, sec, now, pose.accent ?? '#888'), ...pose };
  if (s.blink && sec < DASH_END) {
    if (sec < DASH_START) {
      // Đứng thủ thế chờ lướt
      ctx.save();
      if (s.stealth) ctx.globalAlpha = 0.3;
      drawStickman(ctx, { ...base, moving: false, walk: 0, attack: -1 });
      ctx.restore();
      return;
    }
    const k = (sec - DASH_START) / (DASH_END - DASH_START);
    const x = -DASH_DIST * (1 - k * k);
    const dash = { ...base, moving: true, walk: now / 60, attack: -1 };
    for (let i = 3; i >= 1; i--) {
      ctx.save();
      ctx.globalAlpha = 0.14 * (4 - i);
      ctx.translate(x - i * 16, 0);
      ctx.rotate(0.35);
      drawStickman(ctx, dash);
      ctx.restore();
    }
    ctx.save();
    ctx.translate(x, 0);
    ctx.rotate(0.35);
    drawStickman(ctx, dash);
    ctx.restore();
    return;
  }
  // Quân tự nổ: chạy tới, châm ngòi rồi nổ tung thành quả cầu lửa, sau đó chỉ còn khói
  if (s.kamikaze && sec >= 1.4) {
    const k = Math.min(1, (sec - 1.4) / 0.5);
    if (sec < 1.55) drawStickman(ctx, { ...base, attack: 0.5 });
    const r = 14 + k * 46;
    ctx.save();
    ctx.globalAlpha = sec < 1.9 ? 1 - k * 0.4 : Math.max(0, 0.5 - (sec - 1.9));
    const g = ctx.createRadialGradient(0, -24, 2, 0, -24, r);
    g.addColorStop(0, sec < 1.9 ? '#fff4c2' : '#6b6560');
    g.addColorStop(0.45, sec < 1.9 ? '#ff9a1f' : '#55504b');
    g.addColorStop(1, 'rgba(120, 60, 20, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, -24, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    return;
  }
  ctx.save();
  if (s.stealth && base.attack < 0) ctx.globalAlpha = 0.3;
  drawStickman(ctx, base);
  ctx.restore();
}
