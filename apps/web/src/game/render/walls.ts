import type { FactionId } from '@stickman-war/core';
import { ENERGY, night, rgba } from './palette';

/**
 * Tường thành có cổng của từng nền văn minh. Gốc (0, 0) ở chân tường, giữa bề dày; cao WALL_H, dày 2·HALF.
 * `gate`: 0 = cổng đóng, 1 = mở hết (quân nhà đang đi qua). `flash`: vừa trúng đòn (vẽ trắng).
 */
const WALL_H = 74;
const HALF = 16;
const GATE_W = 11;
const GATE_H = 38;

type Ctx = CanvasRenderingContext2D;

/** Màu tường chìm vào bóng đêm; hoa văn phát sáng (lò rèn, san hô, dung nham…) giữ nguyên. */
const n = (c: string) => night(c, 0.6);
type Style = {
  body: string;
  dark: string;
  gate: string;
  /** Họa tiết riêng vẽ lên thân tường (khối đá, cọc gỗ, gai, vết nứt dung nham…). */
  pattern: (ctx: Ctx, t: number) => void;
  /** Đỉnh tường (răng cưa, mái, gai…). */
  top: (ctx: Ctx) => void;
};

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, w, h);
}

function blocks(ctx: Ctx, rows: number, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  const rh = WALL_H / rows;
  for (let r = 1; r < rows; r++) {
    ctx.beginPath();
    ctx.moveTo(-HALF, -r * rh);
    ctx.lineTo(HALF, -r * rh);
    ctx.stroke();
    const off = r % 2 ? 0 : 8;
    for (let x = -HALF + off; x < HALF; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, -r * rh);
      ctx.lineTo(x, -(r + 1) * rh);
      ctx.stroke();
    }
  }
}

function crenels(ctx: Ctx, color: string): void {
  for (let x = -HALF; x < HALF; x += 8) rect(ctx, x, -WALL_H - 7, 5, 7, color);
}

function stakes(ctx: Ctx, color: string, tip: string): void {
  for (let x = -HALF; x < HALF; x += 6.4) {
    ctx.fillStyle = color;
    ctx.fillRect(x, -WALL_H, 5.4, WALL_H);
    ctx.fillStyle = tip;
    ctx.beginPath();
    ctx.moveTo(x, -WALL_H);
    ctx.lineTo(x + 2.7, -WALL_H - 9);
    ctx.lineTo(x + 5.4, -WALL_H);
    ctx.closePath();
    ctx.fill();
  }
}

const STYLES: Record<FactionId, Style> = {
  // Quang: đá trắng, răng cưa, viền vàng
  tribe: {
    body: n('#e8e2d0'),
    dark: n('#a8a090'),
    gate: n('#b89a52'),
    pattern: (ctx) => {
      blocks(ctx, 6, 'rgba(0,0,0,0.16)');
      rect(ctx, -HALF, -WALL_H + 6, HALF * 2, 2, '#ffe08a');
    },
    top: (ctx) => crenels(ctx, n('#e8e2d0')),
  },
  // Phong: cọc gỗ ngọc bích vót nhọn, gai chĩa ra phía địch
  orc: {
    body: n('#5f8f80'),
    dark: n('#3a5a50'),
    gate: n('#2f4a42'),
    pattern: (ctx) => {
      ctx.fillStyle = n('#d9f5ea');
      for (let y = -60; y < -10; y += 16) {
        ctx.beginPath();
        ctx.moveTo(HALF, y);
        ctx.lineTo(HALF + 10, y + 3);
        ctx.lineTo(HALF, y + 6);
        ctx.fill();
      }
    },
    top: (ctx) => stakes(ctx, n('#5f8f80'), n('#d9f5ea')),
  },
  elf: {
    body: n('#5b7f3a'),
    dark: n('#3f5f28'),
    gate: n('#6b4a2b'),
    pattern: (ctx) => {
      ctx.strokeStyle = n('#6b4a2b');
      ctx.lineWidth = 2;
      for (let x = -HALF + 4; x < HALF; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.quadraticCurveTo(x + 6, -WALL_H / 2, x, -WALL_H);
        ctx.stroke();
      }
    },
    top: (ctx) => {
      ctx.fillStyle = n('#62b052');
      for (let x = -HALF; x <= HALF; x += 9) {
        ctx.beginPath();
        ctx.arc(x, -WALL_H, 7, 0, Math.PI * 2);
        ctx.fill();
      }
    },
  },
  // Ám: đá hắc thạch, vân tím phát sáng
  undead: {
    body: n('#2a2233'),
    dark: n('#18121f'),
    gate: n('#120c18'),
    pattern: (ctx, t) => {
      blocks(ctx, 5, 'rgba(179,136,255,0.25)');
      ctx.strokeStyle = `rgba(179, 136, 255, ${0.55 + 0.35 * Math.sin(t * 2)})`;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-8, -66);
      ctx.lineTo(-3, -50);
      ctx.lineTo(-9, -34);
      ctx.stroke();
    },
    top: (ctx) => {
      ctx.fillStyle = n('#2a2233');
      for (let x = -HALF; x < HALF; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, -WALL_H);
        ctx.lineTo(x + 4, -WALL_H - 11);
        ctx.lineTo(x + 8, -WALL_H);
        ctx.fill();
      }
    },
  },
  // Lôi: tường đá xám tím, nẹp kim loại, vạch sét vàng
  samurai: {
    body: n('#4a4866'),
    dark: n('#2c2b40'),
    gate: n('#24233a'),
    pattern: (ctx, t) => {
      rect(ctx, -HALF, -WALL_H, 3, WALL_H, n('#9aa0b8'));
      rect(ctx, HALF - 3, -WALL_H, 3, WALL_H, n('#9aa0b8'));
      ctx.strokeStyle = `rgba(255, 243, 107, ${0.6 + 0.4 * Math.sin(t * 9)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, -70);
      ctx.lineTo(2, -60);
      ctx.lineTo(-4, -58);
      ctx.lineTo(5, -46);
      ctx.stroke();
    },
    top: (ctx) => rect(ctx, -HALF - 3, -WALL_H - 4, HALF * 2 + 6, 4, n('#9aa0b8')),
  },
  // Huyết: cọc gỗ đỏ thẫm, đai sẫm, đầu cọc nhuốm máu
  viking: {
    body: n('#6b2a30'),
    dark: n('#42181c'),
    gate: n('#3a1418'),
    pattern: (ctx) => {
      rect(ctx, -HALF, -22, HALF * 2, 4, n('#42181c'));
      rect(ctx, -HALF, -54, HALF * 2, 4, n('#42181c'));
    },
    top: (ctx) => stakes(ctx, n('#6b2a30'), '#a3101e'),
  },
  // Tinh thể: khối pha lê hồng tím, mảnh tinh thể nhọn trên đỉnh
  desert: {
    body: n('#9a5ab0'),
    dark: n('#5e3270'),
    gate: n('#4a2558'),
    pattern: (ctx) => {
      blocks(ctx, 5, 'rgba(255,200,250,0.35)');
      ctx.fillStyle = 'rgba(255, 200, 250, 0.35)';
      ctx.fillRect(-HALF + 3, -WALL_H + 4, 4, WALL_H - 8);
    },
    top: (ctx) => {
      ctx.fillStyle = n('#d7a0e8');
      for (let x = -HALF; x < HALF; x += 7) {
        ctx.beginPath();
        ctx.moveTo(x, -WALL_H);
        ctx.lineTo(x + 3.5, -WALL_H - 10);
        ctx.lineTo(x + 7, -WALL_H);
        ctx.fill();
      }
    },
  },
  // Thạch: đá tảng thô, khe nứt hổ phách
  steam: {
    body: n('#8a7560'),
    dark: n('#5a4a3c'),
    gate: n('#3f342a'),
    pattern: (ctx, t) => {
      blocks(ctx, 4, 'rgba(0,0,0,0.25)');
      ctx.strokeStyle = `rgba(232, 180, 106, ${0.55 + 0.35 * Math.sin(t * 2)})`;
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(8, -70);
      ctx.lineTo(3, -56);
      ctx.lineTo(9, -42);
      ctx.stroke();
    },
    top: (ctx) => rect(ctx, -HALF - 3, -WALL_H - 5, HALF * 2 + 6, 5, n('#a08a70')),
  },
  // Kim: tấm thép tán đinh, khe lò rèn cam
  dwarf: {
    body: n('#7d8590'),
    dark: n('#4b5260'),
    gate: n('#3f444c'),
    pattern: (ctx) => {
      ctx.fillStyle = n('#c8ccd2');
      for (let y = -66; y < -4; y += 12) for (const x of [-HALF + 3, HALF - 3]) ctx.fillRect(x - 1, y, 2, 2);
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(-2, -64, 4, 8);
    },
    top: (ctx) => crenels(ctx, n('#7d8590')),
  },
  tide: {
    body: n('#2fa596'),
    dark: n('#1d6b62'),
    gate: n('#1d4b47'),
    pattern: (ctx) => {
      for (const [x, y, r, c] of [
        [-8, -58, 6, '#f08a9a'],
        [7, -40, 5, '#ffb38a'],
        [-6, -22, 5, '#f08a9a'],
        [9, -66, 4, '#ffb38a'],
      ] as [number, number, number, string][]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    },
    top: (ctx) => {
      ctx.fillStyle = n('#2fa596');
      for (let x = -HALF; x <= HALF; x += 8) {
        ctx.beginPath();
        ctx.arc(x, -WALL_H, 5, Math.PI, 0);
        ctx.fill();
      }
    },
  },
  dragon: {
    body: n('#3a2a2a'),
    dark: n('#1e1414'),
    gate: n('#2a1a14'),
    pattern: (ctx, t) => {
      ctx.strokeStyle = `rgba(255, ${110 + Math.round(40 * Math.sin(t * 3))}, 30, 0.9)`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -70);
      ctx.lineTo(-4, -52);
      ctx.lineTo(-11, -36);
      ctx.moveTo(8, -64);
      ctx.lineTo(4, -46);
      ctx.lineTo(11, -26);
      ctx.stroke();
    },
    top: (ctx) => {
      ctx.fillStyle = n('#3a2a2a');
      for (let x = -HALF; x < HALF; x += 8) {
        ctx.beginPath();
        ctx.moveTo(x, -WALL_H);
        ctx.lineTo(x + 4, -WALL_H - 10);
        ctx.lineTo(x + 8, -WALL_H);
        ctx.fill();
      }
    },
  },
  frost: {
    body: n('#cfe3f5'),
    dark: n('#8aa8c2'),
    gate: n('#6f8fa8'),
    pattern: (ctx) => {
      blocks(ctx, 5, 'rgba(255,255,255,0.7)');
      ctx.fillStyle = 'rgba(255,255,255,0.45)';
      ctx.fillRect(-HALF + 3, -WALL_H + 4, 4, WALL_H - 8);
    },
    top: (ctx) => {
      ctx.fillStyle = n('#e8f4ff');
      for (let x = -HALF; x < HALF; x += 6) {
        ctx.beginPath();
        ctx.moveTo(x, -WALL_H);
        ctx.lineTo(x + 3, -WALL_H - 7);
        ctx.lineTo(x + 6, -WALL_H);
        ctx.fill();
      }
    },
  },
};

export function drawWall(ctx: Ctx, faction: FactionId, gate: number, flash: boolean, t: number): void {
  const st = STYLES[faction] ?? STYLES.tribe;
  ctx.save();
  if (flash) ctx.globalAlpha = 0.85;
  // Thân + bóng mặt bên
  rect(ctx, -HALF, -WALL_H, HALF * 2, WALL_H, flash ? '#ffffff' : st.body);
  rect(ctx, HALF - 5, -WALL_H, 5, WALL_H, 'rgba(0,0,0,0.18)');
  if (!flash) st.pattern(ctx, t);
  st.top(ctx);
  // Cổng: khung tối, hai cánh cửa mở dần sang hai bên
  ctx.fillStyle = st.dark;
  ctx.beginPath();
  ctx.moveTo(-GATE_W - 2, 0);
  ctx.lineTo(-GATE_W - 2, -GATE_H);
  ctx.arc(0, -GATE_H, GATE_W + 2, Math.PI, 0);
  ctx.lineTo(GATE_W + 2, 0);
  ctx.closePath();
  ctx.fill();
  rect(ctx, -GATE_W, -GATE_H, GATE_W * 2, GATE_H, 'rgba(10,8,6,0.85)');
  const leaf = GATE_W * (1 - gate * 0.85);
  ctx.fillStyle = st.gate;
  ctx.fillRect(-GATE_W, -GATE_H, leaf, GATE_H);
  ctx.fillRect(GATE_W - leaf, -GATE_H, leaf, GATE_H);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  for (const x of [-GATE_W + leaf - 1.5, GATE_W - leaf]) ctx.fillRect(x, -GATE_H, 1.5, GATE_H);
  if (!flash) {
    // Viền năng lượng quanh thân tường + khe sáng giữa hai cánh cổng
    const e = ENERGY[faction] ?? '#ffffff';
    ctx.strokeStyle = rgba(e, 0.55);
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-HALF, -WALL_H, HALF * 2, WALL_H);
    ctx.fillStyle = rgba(e, 0.25 + gate * 0.5);
    ctx.fillRect(-GATE_W + leaf, -GATE_H, Math.max(1, (GATE_W - leaf) * 2), GATE_H);
  }
  ctx.restore();
}

/** Bóng tường lúc chọn chỗ đặt (xanh = được, đỏ = không) hoặc khung tường đang dựng (tiến độ 0..1). */
export function drawWallGhost(ctx: Ctx, ok: boolean, progress = -1): void {
  ctx.save();
  ctx.fillStyle = ok ? 'rgba(74, 222, 128, 0.35)' : 'rgba(239, 68, 68, 0.35)';
  ctx.strokeStyle = ok ? '#4ade80' : '#ef4444';
  ctx.lineWidth = 2;
  ctx.setLineDash([5, 4]);
  ctx.fillRect(-HALF, -WALL_H, HALF * 2, WALL_H);
  ctx.strokeRect(-HALF, -WALL_H, HALF * 2, WALL_H);
  ctx.setLineDash([]);
  if (progress >= 0) {
    rect(ctx, -HALF - 6, -WALL_H - 14, HALF * 2 + 12, 6, 'rgba(0,0,0,0.5)');
    rect(ctx, -HALF - 5, -WALL_H - 13, (HALF * 2 + 10) * progress, 4, '#facc15');
  }
  ctx.restore();
}
