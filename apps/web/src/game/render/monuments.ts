import type { FactionId } from '@stickman-war/core';

/**
 * Tượng nhà của từng nền văn minh: một công trình đặc trưng (không phải lính mặc đồ tộc).
 * Vẽ quanh gốc (0, 0) là mặt đất, hướng lên là y âm, rộng khoảng ±50, cao khoảng 170 (đơn vị thế giới).
 * `stone` / `dark`: màu đá theo phong cảnh; `glow`: màu chủ đạo của nền văn minh; `t`: thời gian (hoạt ảnh nhẹ).
 */
export type MonumentColors = { stone: string; dark: string; glow: string };

type Ctx = CanvasRenderingContext2D;

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
  /** Blade Clan: thanh kiếm khổng lồ cắm xuống tảng đá. */
  tribe(ctx, c) {
    poly(
      ctx,
      [
        [-46, 0],
        [-36, -34],
        [-12, -46],
        [16, -44],
        [38, -30],
        [46, 0],
      ],
      c.dark,
    );
    poly(
      ctx,
      [
        [-30, -30],
        [-10, -42],
        [14, -40],
        [30, -28],
        [8, -24],
      ],
      c.stone,
    );
    poly(
      ctx,
      [
        [-7, -40],
        [7, -40],
        [7, -150],
        [0, -160],
        [-7, -150],
      ],
      '#dfe4ea',
    );
    ctx.fillStyle = '#aeb6c2';
    ctx.fillRect(-1, -150, 2, 108);
    ctx.fillStyle = '#7a5a2a';
    ctx.fillRect(-30, -152, 60, 9);
    ctx.fillStyle = '#5a3e1c';
    ctx.fillRect(-4, -178, 8, 26);
    circle(ctx, 0, -182, 7, c.glow);
  },

  /** Orc Horde: cột totem ba mặt quỷ có nanh. */
  orc(ctx, c, t) {
    for (let i = 0; i < 3; i++) {
      const y = -i * 48;
      ctx.fillStyle = i % 2 ? c.stone : c.dark;
      ctx.fillRect(-26 + i * 2, y - 48, 52 - i * 4, 48);
      // mắt
      glowDot(ctx, -10, y - 32, 4, '#ff4a1a', t, i);
      glowDot(ctx, 10, y - 32, 4, '#ff4a1a', t, i + 1);
      // nanh
      poly(
        ctx,
        [
          [-14, y - 14],
          [-10, y - 14],
          [-12, y - 2],
        ],
        '#f5efe0',
      );
      poly(
        ctx,
        [
          [10, y - 14],
          [14, y - 14],
          [12, y - 2],
        ],
        '#f5efe0',
      );
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-12, y - 20, 24, 4);
    }
    // sừng trên đỉnh
    poly(
      ctx,
      [
        [-22, -144],
        [-40, -176],
        [-14, -150],
      ],
      '#efe3c6',
    );
    poly(
      ctx,
      [
        [22, -144],
        [40, -176],
        [14, -150],
      ],
      '#efe3c6',
    );
  },

  /** Forest Elves: cây thiêng tán xanh, đốm sáng bay. */
  elf(ctx, c, t) {
    ctx.fillStyle = '#6b4a2b';
    ctx.beginPath();
    ctx.moveTo(-26, 0);
    ctx.quadraticCurveTo(-8, -30, -10, -90);
    ctx.lineTo(10, -90);
    ctx.quadraticCurveTo(8, -30, 26, 0);
    ctx.closePath();
    ctx.fill();
    for (const [x, y, r, col] of [
      [-30, -110, 32, '#3f7a3a'],
      [28, -112, 30, '#3f7a3a'],
      [0, -140, 36, '#4f9a45'],
      [-18, -160, 22, '#62b052'],
      [20, -158, 22, '#62b052'],
    ] as [number, number, number, string][])
      circle(ctx, x, y, r, col);
    for (let i = 0; i < 6; i++) glowDot(ctx, -34 + i * 14, -120 - ((i * 23) % 50), 3, '#eaffb0', t, i * 1.3);
    ctx.fillStyle = c.dark;
    ctx.fillRect(-36, -6, 72, 6);
  },

  /** Undead Legion: bia mộ lớn, đầu lâu mắt tím phát sáng. */
  undead(ctx, c, t) {
    ctx.fillStyle = c.dark;
    ctx.beginPath();
    ctx.moveTo(-34, 0);
    ctx.lineTo(-34, -100);
    ctx.arc(0, -100, 34, Math.PI, 0);
    ctx.lineTo(34, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = c.stone;
    ctx.fillRect(-4, -110, 8, 70);
    ctx.fillRect(-20, -92, 40, 8);
    // đầu lâu
    circle(ctx, 0, -150, 22, '#eee8d8');
    ctx.fillStyle = '#eee8d8';
    ctx.fillRect(-12, -136, 24, 14);
    glowDot(ctx, -8, -152, 5, '#a855f7', t);
    glowDot(ctx, 8, -152, 5, '#a855f7', t, 1);
    ctx.fillStyle = '#3a3030';
    for (let i = -2; i <= 2; i++) ctx.fillRect(i * 5 - 1, -130, 2, 7);
  },

  /** Ronin Order: chùa tháp ba tầng mái cong. */
  samurai(ctx, c) {
    plinth(ctx, c, 40, 14);
    const roof = (y: number, w: number) => {
      ctx.fillStyle = '#7a2b22';
      ctx.beginPath();
      ctx.moveTo(-w - 10, y + 4);
      ctx.quadraticCurveTo(-w * 0.5, y - 4, 0, y - 16);
      ctx.quadraticCurveTo(w * 0.5, y - 4, w + 10, y + 4);
      ctx.lineTo(w, y + 8);
      ctx.lineTo(-w, y + 8);
      ctx.closePath();
      ctx.fill();
    };
    const tiers: [number, number][] = [
      [-20, 34],
      [-66, 28],
      [-108, 22],
    ];
    for (const [y, w] of tiers) {
      ctx.fillStyle = c.stone;
      ctx.fillRect(-w + 6, y - 36, (w - 6) * 2, 36);
      ctx.fillStyle = c.dark;
      ctx.fillRect(-6, y - 26, 12, 26);
      roof(y - 40, w);
    }
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(-2, -190, 4, 34);
    circle(ctx, 0, -192, 4, '#d4a017');
  },

  /** Storm Raiders: đá khắc rune, đội mũ sừng. */
  viking(ctx, c, t) {
    poly(
      ctx,
      [
        [-30, 0],
        [-24, -120],
        [0, -132],
        [24, -120],
        [30, 0],
      ],
      c.dark,
    );
    ctx.strokeStyle = c.glow;
    ctx.lineWidth = 3;
    ctx.globalAlpha = 0.6 + 0.3 * Math.sin(t * 2);
    ctx.beginPath();
    for (let i = 0; i < 4; i++) {
      const y = -30 - i * 22;
      ctx.moveTo(-10, y);
      ctx.lineTo(0, y - 12);
      ctx.lineTo(10, y);
      ctx.moveTo(0, y - 12);
      ctx.lineTo(0, y + 6);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    // mũ sừng
    ctx.fillStyle = '#9aa3ad';
    ctx.beginPath();
    ctx.arc(0, -132, 26, Math.PI, 0);
    ctx.fill();
    ctx.fillStyle = '#6b7480';
    ctx.fillRect(-28, -134, 56, 8);
    for (const s of [-1, 1]) {
      ctx.strokeStyle = '#efe3c6';
      ctx.lineWidth = 8;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 24, -140);
      ctx.quadraticCurveTo(s * 50, -150, s * 44, -186);
      ctx.stroke();
    }
    ctx.lineCap = 'butt';
  },

  /** Desert Nomads: kim tự tháp, đĩa mặt trời vàng phía trên. */
  desert(ctx, c, t) {
    poly(
      ctx,
      [
        [-56, 0],
        [0, -120],
        [56, 0],
      ],
      c.stone,
    );
    poly(
      ctx,
      [
        [0, -120],
        [56, 0],
        [14, 0],
      ],
      c.dark,
    );
    ctx.strokeStyle = 'rgba(0,0,0,0.15)';
    ctx.lineWidth = 2;
    for (let i = 1; i < 5; i++) {
      const y = -i * 24;
      const w = 56 - (i * 56) / 5;
      ctx.beginPath();
      ctx.moveTo(-w, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.save();
    ctx.shadowColor = '#ffb020';
    ctx.shadowBlur = 16 + 6 * Math.sin(t * 2);
    circle(ctx, 0, -150, 20, '#f6c445');
    ctx.restore();
    circle(ctx, 0, -150, 8, '#c8811a');
  },

  /** Iron Empire: tháp sắt với bánh răng quay và ống khói. */
  steam(ctx, c, t) {
    ctx.fillStyle = c.dark;
    ctx.fillRect(-34, -110, 68, 110);
    ctx.fillStyle = c.stone;
    ctx.fillRect(-28, -104, 56, 8);
    ctx.fillRect(-28, -20, 56, 8);
    // ống khói + khói
    ctx.fillStyle = '#3f444c';
    ctx.fillRect(14, -160, 14, 52);
    for (let i = 0; i < 3; i++) {
      const k = (t * 0.5 + i / 3) % 1;
      ctx.globalAlpha = 0.45 * (1 - k);
      circle(ctx, 21 + k * 18, -166 - k * 40, 7 + k * 10, '#8a8a8a');
    }
    ctx.globalAlpha = 1;
    // bánh răng
    ctx.save();
    ctx.translate(-4, -62);
    ctx.rotate(t * 0.8);
    ctx.fillStyle = '#b08a3a';
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.fillRect(-5, -30, 10, 10);
    }
    circle(ctx, 0, 0, 22, '#c99a3e');
    circle(ctx, 0, 0, 8, c.dark);
    ctx.restore();
  },

  /** Mountain Dwarves: đe sắt trên tảng đá, búa lớn, rune phát sáng. */
  dwarf(ctx, c, t) {
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
    ctx.fillStyle = '#4b4f57';
    ctx.fillRect(-18, -80, 36, 26);
    poly(
      ctx,
      [
        [-40, -104],
        [36, -104],
        [26, -82],
        [-28, -82],
      ],
      '#5d626b',
    );
    poly(
      ctx,
      [
        [36, -104],
        [54, -98],
        [36, -92],
      ],
      '#5d626b',
    );
    // búa dựng
    ctx.fillStyle = '#6b4a2b';
    ctx.fillRect(-4, -170, 8, 68);
    ctx.fillStyle = '#7d828b';
    ctx.fillRect(-20, -180, 40, 22);
    glowDot(ctx, -18, -30, 4, '#ffb347', t);
    glowDot(ctx, 4, -40, 4, '#ffb347', t, 1);
    glowDot(ctx, 26, -28, 4, '#ffb347', t, 2);
  },

  /** Tide Folk: đinh ba khổng lồ trên vỏ ốc. */
  tide(ctx, c, t) {
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
    ctx.fillStyle = '#d4a017';
    ctx.fillRect(-3, -170, 6, 118);
    for (const x of [-18, 0, 18]) {
      poly(
        ctx,
        [
          [x - 4, -160],
          [x, -184],
          [x + 4, -160],
        ],
        '#d4a017',
      );
    }
    ctx.fillRect(-20, -164, 40, 6);
    ctx.fillRect(-20, -164, 4, 14);
    ctx.fillRect(16, -164, 4, 14);
    glowDot(ctx, 0, -110, 5, '#7df9ff', t);
  },

  /** Dragon Brood: đầu rồng đá há miệng, lửa bập bùng. */
  dragon(ctx, c, t) {
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
      '#d9cbb0',
    );
    poly(
      ctx,
      [
        [8, -140],
        [-6, -184],
        [16, -140],
      ],
      '#d9cbb0',
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

  /** Frost Kin: cụm tinh thể băng trong suốt. */
  frost(ctx, c, t) {
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
  (DRAW[faction] ?? DRAW.tribe)(ctx, c, t);
  ctx.restore();
}
