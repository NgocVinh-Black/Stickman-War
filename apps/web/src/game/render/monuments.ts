import type { FactionId } from '@stickman-war/core';
import { night } from './palette';

/**
 * Tượng nhà của từng nền văn minh (theo hệ): một công trình đặc trưng (không phải lính mặc đồ hệ).
 * Vẽ quanh gốc (0, 0) là mặt đất, hướng lên là y âm, rộng khoảng ±50, cao khoảng 170 (đơn vị thế giới).
 * `stone` / `dark`: màu đá theo phong cảnh; `glow`: màu chủ đạo của nền văn minh; `t`: thời gian (hoạt ảnh nhẹ).
 */
export type MonumentColors = { stone: string; dark: string; glow: string };

type Ctx = CanvasRenderingContext2D;

/** Màu gốc của chi tiết công trình chìm vào bóng đêm (đốm sáng, lửa giữ nguyên để toả sáng). */
const n = (c: string) => night(c, 0.58);

function poly(ctx: Ctx, pts: [number, number][], fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (const [x, y] of pts.slice(1)) ctx.lineTo(x, y);
  ctx.closePath();
  ctx.fill();
}

function circle(ctx: Ctx, x: number, y: number, r: number, fill: string): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}

/** Bệ đá chung (thấp) cho các công trình cần đặt trên bệ. */
function plinth(ctx: Ctx, c: MonumentColors, w = 46, h = 22): void {
  ctx.fillStyle = c.dark;
  ctx.fillRect(-w, -h, w * 2, h);
  ctx.fillStyle = c.stone;
  ctx.fillRect(-w + 6, -h - 6, (w - 6) * 2, 7);
}

/** Đốm sáng nhấp nháy. */
function glowDot(ctx: Ctx, x: number, y: number, r: number, color: string, t: number, phase = 0): void {
  ctx.save();
  ctx.globalAlpha = 0.55 + 0.45 * Math.sin(t * 3 + phase);
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  circle(ctx, x, y, r, color);
  ctx.restore();
}

const DRAW: Record<FactionId, (ctx: Ctx, c: MonumentColors, t: number) => void> = {
  /** Hệ Quang (Thánh Quang Điện): cột đá trắng đỡ đĩa mặt trời toả tia sáng. */
  light(ctx, c, t) {
    plinth(ctx, c, 40, 20);
    poly(
      ctx,
      [
        [-14, -26],
        [14, -26],
        [10, -130],
        [-10, -130],
      ],
      n('#e8e2d0'),
    );
    ctx.fillStyle = c.dark;
    for (let y = -40; y > -130; y -= 18) ctx.fillRect(-12, y, 24, 2);
    ctx.fillStyle = n('#e8e2d0');
    ctx.fillRect(-20, -138, 40, 9);
    // Tia sáng xoay chậm
    ctx.save();
    ctx.translate(0, -160);
    ctx.rotate(t * 0.25);
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = c.glow;
    for (let i = 0; i < 12; i++) {
      ctx.rotate(Math.PI / 6);
      ctx.beginPath();
      ctx.moveTo(-3, -24);
      ctx.lineTo(0, -40);
      ctx.lineTo(3, -24);
      ctx.fill();
    }
    ctx.restore();
    glowDot(ctx, 0, -160, 20, c.glow, t);
    circle(ctx, 0, -160, 13, '#fff6d6');
  },

  /** Hệ Phong (Cuồng Phong Trại): tháp đá xoắn, cánh chong chóng gió quay trên đỉnh. */
  wind(ctx, c, t) {
    plinth(ctx, c, 38, 18);
    poly(
      ctx,
      [
        [-22, -24],
        [22, -24],
        [8, -140],
        [-8, -140],
      ],
      c.stone,
    );
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 3;
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.moveTo(-18 + i * 2.5, -32 - i * 22);
      ctx.quadraticCurveTo(0, -42 - i * 22, 16 - i * 2.5, -30 - i * 22);
      ctx.stroke();
    }
    // Cánh gió
    ctx.save();
    ctx.translate(0, -146);
    ctx.rotate(t * 1.6);
    for (let i = 0; i < 4; i++) {
      ctx.rotate(Math.PI / 2);
      poly(
        ctx,
        [
          [0, 0],
          [6, -10],
          [3, -46],
          [-4, -40],
        ],
        n('#cfe8df'),
      );
    }
    ctx.restore();
    glowDot(ctx, 0, -146, 6, c.glow, t);
    // Vệt gió
    ctx.save();
    ctx.strokeStyle = c.glow;
    ctx.globalAlpha = 0.35;
    ctx.lineWidth = 2;
    for (let i = 0; i < 3; i++) {
      const y = -60 - i * 35;
      const x = ((t * 60 + i * 40) % 120) - 60;
      ctx.beginPath();
      ctx.moveTo(x - 20, y);
      ctx.quadraticCurveTo(x, y - 6, x + 20, y);
      ctx.stroke();
    }
    ctx.restore();
  },

  /** Hệ Mộc (Thanh Mộc Lâm): cây thiêng tán xanh, đốm sáng bay. */
  wood(ctx, c, t) {
    ctx.fillStyle = n('#6b4a2b');
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(-8, -30, -10, -90);
    ctx.lineTo(10, -90);
    ctx.quadraticCurveTo(8, -30, 26, 0);
    ctx.closePath();
    ctx.fill();
    for (const [x, y, r, col] of [
      [-30, -110, 32, n('#3f7a3a')],
      [28, -112, 30, n('#3f7a3a')],
      [0, -140, 36, n('#4f9a45')],
      [-18, -160, 22, n('#62b052')],
      [20, -158, 22, n('#62b052')],
    ] as [number, number, number, string][])
      circle(ctx, x, y, r, col);
    for (let i = 0; i < 6; i++) glowDot(ctx, -34 + i * 14, -120 - ((i * 23) % 50), 3, '#eaffb0', t, i * 1.3);
    ctx.fillStyle = c.dark;
    ctx.fillRect(-36, -6, 72, 6);
  },

  /** Hệ Ám (Hội Bóng Đêm): tháp đá đen nhọn, con mắt tím mở giữa thân, khói bóng tối. */
  shadow(ctx, c, t) {
    plinth(ctx, c, 36, 16);
    poly(
      ctx,
      [
        [-24, -20],
        [24, -20],
        [12, -150],
        [0, -176],
        [-12, -150],
      ],
      n('#2a2233'),
    );
    poly(
      ctx,
      [
        [-6, -22],
        [6, -22],
        [2, -168],
        [0, -172],
      ],
      c.dark,
    );
    // Con mắt
    ctx.save();
    ctx.fillStyle = c.glow;
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 14;
    const open = 0.6 + 0.4 * Math.abs(Math.sin(t * 0.8));
    ctx.beginPath();
    ctx.ellipse(0, -100, 13, 6 * open, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    circle(ctx, 0, -100, 3.5, '#120a1c');
    for (let i = 0; i < 4; i++) glowDot(ctx, -20 + i * 13, -40 - ((t * 20 + i * 30) % 100), 2, c.glow, t, i);
  },

  /** Hệ Lôi (Lôi Kiếm Các): cột thu lôi ba tầng, tia sét chớp giữa hai sừng kim loại. */
  thunder(ctx, c, t) {
    plinth(ctx, c, 36, 18);
    for (let i = 0; i < 3; i++) {
      const w = 22 - i * 5;
      const y = -24 - i * 40;
      ctx.fillStyle = i % 2 ? c.stone : c.dark;
      ctx.fillRect(-w, y - 36, w * 2, 36);
      ctx.fillStyle = n('#3a3a52');
      ctx.fillRect(-w - 6, y - 40, w * 2 + 12, 5);
    }
    ctx.strokeStyle = n('#9aa0b8');
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(-12, -144);
    ctx.lineTo(-18, -178);
    ctx.moveTo(12, -144);
    ctx.lineTo(18, -178);
    ctx.stroke();
    // Tia sét nhấp nháy giữa hai sừng
    if (Math.sin(t * 7) > -0.3) {
      ctx.save();
      ctx.strokeStyle = c.glow;
      ctx.shadowColor = c.glow;
      ctx.shadowBlur = 12;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.moveTo(-18, -176);
      const j = Math.sin(t * 23) * 5;
      ctx.lineTo(-8, -166 + j);
      ctx.lineTo(-2, -176 - j);
      ctx.lineTo(6, -166 + j);
      ctx.lineTo(18, -176);
      ctx.stroke();
      ctx.restore();
    }
    glowDot(ctx, 0, -110, 4, c.glow, t);
  },

  /** Hệ Huyết (Huyết Nguyệt Giáo): bàn thờ đá, vầng trăng máu lơ lửng phía trên, máu chảy theo rãnh. */
  blood(ctx, c, t) {
    poly(
      ctx,
      [
        [-44, 0],
        [-34, -40],
        [34, -40],
        [44, 0],
      ],
      c.dark,
    );
    ctx.fillStyle = c.stone;
    ctx.fillRect(-38, -50, 76, 12);
    for (const x of [-26, 26]) {
      ctx.fillStyle = c.stone;
      ctx.fillRect(x - 6, -110, 12, 62);
      poly(
        ctx,
        [
          [x - 9, -110],
          [x, -124],
          [x + 9, -110],
        ],
        c.dark,
      );
    }
    // Rãnh máu
    ctx.fillStyle = n('#a3101e');
    ctx.fillRect(-2, -40, 4, 40);
    // Trăng máu
    ctx.save();
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 24;
    circle(ctx, 0, -150 + Math.sin(t) * 3, 24, c.glow);
    ctx.restore();
    circle(ctx, 9, -156 + Math.sin(t) * 3, 21, c.dark);
  },

  /** Hệ Tinh thể (Tinh Thạch Cốc): viên pha lê khổng lồ lơ lửng xoay trên đế đá, mảnh vụn bay quanh. */
  crystal(ctx, c, t) {
    plinth(ctx, c, 40, 20);
    poly(
      ctx,
      [
        [-24, -26],
        [24, -26],
        [14, -44],
        [-14, -44],
      ],
      c.dark,
    );
    const y = -112 + Math.sin(t * 1.3) * 5;
    const w = 26 * Math.abs(Math.cos(t * 0.6)) + 8;
    ctx.save();
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 22;
    poly(
      ctx,
      [
        [0, y - 56],
        [w, y - 10],
        [0, y + 50],
        [-w, y - 10],
      ],
      c.glow,
    );
    ctx.restore();
    poly(
      ctx,
      [
        [0, y - 56],
        [w * 0.35, y - 10],
        [0, y + 50],
      ],
      'rgba(255,255,255,0.35)',
    );
    for (let i = 0; i < 4; i++) {
      const a = t * 0.9 + (i * Math.PI) / 2;
      glowDot(ctx, Math.cos(a) * 40, y + Math.sin(a) * 12, 3, c.glow, t, i);
    }
  },

  /** Hệ Thạch (Bàn Thạch Bảo): cổng đá cự thạch hai cột một xà, khe nứt hổ phách phát sáng. */
  stone(ctx, c, t) {
    for (const x of [-30, 30]) {
      poly(
        ctx,
        [
          [x - 16, 0],
          [x - 13, -120],
          [x + 12, -124],
          [x + 16, 0],
        ],
        x < 0 ? c.stone : c.dark,
      );
    }
    poly(
      ctx,
      [
        [-52, -118],
        [50, -126],
        [52, -146],
        [-48, -144],
      ],
      c.stone,
    );
    ctx.save();
    ctx.strokeStyle = c.glow;
    ctx.shadowColor = c.glow;
    ctx.shadowBlur = 8;
    ctx.globalAlpha = 0.6 + 0.4 * Math.sin(t * 2);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-34, -20);
    ctx.lineTo(-28, -55);
    ctx.lineTo(-34, -80);
    ctx.moveTo(28, -40);
    ctx.lineTo(34, -70);
    ctx.lineTo(29, -100);
    ctx.moveTo(-20, -132);
    ctx.lineTo(0, -136);
    ctx.lineTo(14, -130);
    ctx.stroke();
    ctx.restore();
    glowDot(ctx, 0, -70, 6, c.glow, t);
  },

  /** Hệ Kim (Thiết Lò Môn): đe sắt trên tảng đá, búa lớn, ấn phát sáng. */
  metal(ctx, c, t) {
    poly(
      ctx,
      [
        [-50, 0],
        [-40, -40],
        [-10, -56],
        [24, -52],
        [46, -30],
        [50, 0],
      ],
      c.dark,
    );
    // đe
    ctx.fillStyle = n('#4b4f57');
    ctx.fillRect(-18, -80, 36, 26);
    poly(
      ctx,
      [
        [-40, -104],
        [36, -104],
        [26, -82],
        [-28, -82],
      ],
      n('#5d626b'),
    );
    poly(
      ctx,
      [
        [36, -104],
        [54, -98],
        [36, -92],
      ],
      n('#5d626b'),
    );
    // búa dựng
    ctx.fillStyle = n('#6b4a2b');
    ctx.fillRect(-4, -170, 8, 68);
    ctx.fillStyle = n('#7d828b');
    ctx.fillRect(-20, -180, 40, 22);
    glowDot(ctx, -18, -30, 4, '#ffb347', t);
    glowDot(ctx, 4, -40, 4, '#ffb347', t, 1);
    glowDot(ctx, 26, -28, 4, '#ffb347', t, 2);
  },

  /** Hệ Thủy (Thủy Nguyệt Cung): đinh ba khổng lồ trên vỏ ốc. */
  water(ctx, c, t) {
    ctx.fillStyle = c.stone;
    ctx.beginPath();
    ctx.moveTo(-44, 0);
    ctx.quadraticCurveTo(-46, -50, 0, -56);
    ctx.quadraticCurveTo(46, -50, 44, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = c.dark;
    ctx.lineWidth = 3;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 8, -54);
      ctx.lineTo(i * 18, 0);
      ctx.stroke();
    }
    ctx.fillStyle = n('#d4a017');
    ctx.fillRect(-3, -170, 6, 118);
    for (const x of [-18, 0, 18]) {
      poly(
        ctx,
        [
          [x - 4, -160],
          [x, -184],
          [x + 4, -160],
        ],
        n('#d4a017'),
      );
    }
    ctx.fillRect(-20, -164, 40, 6);
    ctx.fillRect(-20, -164, 4, 14);
    ctx.fillRect(16, -164, 4, 14);
    glowDot(ctx, 0, -110, 5, '#7df9ff', t);
  },

  /** Hệ Hỏa (Viêm Long Môn): đầu rồng đá há miệng, lửa bập bùng. */
  fire(ctx, c, t) {
    plinth(ctx, c, 42, 24);
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(-26, -30);
    ctx.quadraticCurveTo(-34, -110, -4, -140);
    ctx.lineTo(40, -128);
    ctx.lineTo(48, -110);
    ctx.lineTo(14, -104);
    ctx.lineTo(40, -92);
    ctx.lineTo(20, -84);
    ctx.quadraticCurveTo(4, -60, 12, -30);
    ctx.closePath();
    ctx.fill();
    // sừng
    poly(
      ctx,
      [
        [-6, -138],
        [-30, -178],
        [4, -142],
      ],
      n('#d9cbb0'),
    );
    poly(
      ctx,
      [
        [8, -140],
        [-6, -184],
        [16, -140],
      ],
      n('#d9cbb0'),
    );
    glowDot(ctx, 16, -124, 4, '#ffcc33', t);
    // lửa trong miệng
    const flick = 1 + 0.25 * Math.sin(t * 9);
    ctx.save();
    ctx.shadowColor = '#ff6a1a';
    ctx.shadowBlur = 14;
    poly(
      ctx,
      [
        [18, -100],
        [56 * flick, -104],
        [44 * flick, -96],
        [62 * flick, -92],
        [20, -90],
      ],
      '#ff7a1a',
    );
    ctx.restore();
  },

  /** Hệ Băng (Hàn Băng Cung): cụm tinh thể băng trong suốt. */
  ice(ctx, c, t) {
    const crystal = (x: number, h: number, w: number, tilt: number) => {
      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate(tilt);
      ctx.globalAlpha = 0.9;
      poly(
        ctx,
        [
          [-w, 0],
          [-w, -h + w * 1.6],
          [0, -h],
          [w, -h + w * 1.6],
          [w, 0],
        ],
        c.stone,
      );
      poly(
        ctx,
        [
          [0, -h],
          [w, -h + w * 1.6],
          [w, 0],
          [w * 0.2, 0],
        ],
        c.dark,
      );
      ctx.restore();
    };
    crystal(-28, 100, 12, -0.25);
    crystal(26, 110, 12, 0.22);
    crystal(0, 176, 17, 0);
    crystal(-12, 70, 9, -0.1);
    crystal(14, 76, 9, 0.12);
    ctx.globalAlpha = 1;
    glowDot(ctx, 0, -120, 4, '#ffffff', t);
    glowDot(ctx, -26, -70, 3, '#ffffff', t, 2);
  },
};

export function drawMonument(ctx: Ctx, faction: FactionId, c: MonumentColors, t: number): void {
  ctx.save();
  (DRAW[faction] ?? DRAW.light)(ctx, c, t);
  ctx.restore();
}
