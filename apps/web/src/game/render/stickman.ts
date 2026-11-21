import type { FactionId, Head, Machine, Mount, Weapon } from '@stickman-war/core';
import { UNITS, type Arch, type UnitKind, type UnitStats } from '@stickman-war/core';
import { ENERGY, GEAR, GEAR_HI, NIGHT, SIL, mix, night, rgba } from './palette';
import { drawWall } from './walls';

/**
 * Stickman phong cách "bóng đêm neon" (theo ảnh nền màn đăng nhập):
 * - thân đen tuyền, viền sáng màu phe (ánh trăng hắt sau lưng), mắt xếch phát sáng;
 * - áo choàng / khăn màu phe bay theo gió;
 * - mũ, giáp, cán vũ khí là bóng đen sáng hơn thân, viền hoa văn màu năng lượng của nền văn minh;
 * - lưỡi kiếm, mũi giáo, quả cầu phép… toả sáng màu năng lượng.
 */
export type StickPose = {
  kind: UnitKind;
  walk: number; // pha bước chân (radian)
  moving: boolean;
  attack: number; // -1 = không đánh, 0..1 = vung tay, 1..2 = thu về
  mining: number; // -1 = không đào, còn lại là pha
  carrying: boolean;
  /** Đang vác kim cương từ mỏ giữa (thay cho túi vàng). */
  gem?: boolean;
  /** Đang vác quặng bạc từ mỏ bạc (túi màu bạc thay cho túi vàng). */
  silver?: boolean;
  ink: string;
  /** Màu phe: viền sáng thân, mắt, áo choàng, cờ. */
  accent: string;
  flash: boolean;
  /** Vẽ tượng đá: giữ màu ink người gọi đưa vào, bỏ màu thân riêng của tộc. */
  stone?: boolean;
  /** Vẽ icon nhỏ: viền sáng dày hơn cho dễ nhìn. */
  icon?: boolean;
  /** Tường thành: cổng mở bao nhiêu (0..1). */
  gate?: number;
  /** Thời gian (giây) cho hoạt ảnh áo choàng, cờ, dung nham… */
  time?: number;
};

const THIGH = 11;
const SHIN = 11;
const TORSO = 18;
const UPPER = 9;
const FORE = 9;
const HEAD = 5.5;

type V = { x: number; y: number };

/** Góc tính từ phương thẳng đứng hướng xuống, dương = về phía trước (+x). */
const along = (p: V, angle: number, len: number): V => ({
  x: p.x + Math.sin(angle) * len,
  y: p.y + Math.cos(angle) * len,
});

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOut = (t: number) => 1 - (1 - t) * (1 - t);

/** Màu gốc thú cưỡi (được pha tối thành bóng đen ánh màu). */
const MOUNT_COLOR: Record<Mount, string> = {
  horse: '#6b4a2b',
  bonehorse: '#d6d0bf',
  elk: '#8a6a43',
  wolf: '#6b7280',
  boar: '#4a3426',
  chariot: '#6b4a2b',
  shark: '#5b7a93',
  lizard: '#b45309',
  bear: '#e5e7eb',
};
/** Màu đá tháp canh theo tộc (pha tối). */
const TOWER_COLOR: Record<FactionId, string> = {
  tribe: '#e8e2d0',
  orc: '#9fc9b8',
  elf: '#5b7f3a',
  undead: '#3a2f4a',
  samurai: '#5a5a78',
  viking: '#6b2a30',
  desert: '#b07ac0',
  steam: '#8a7560',
  dwarf: '#6b717c',
  tide: '#2a6fa8',
  dragon: '#8b2e1f',
  frost: '#cfe3f5',
};

/** Vũ khí mặc định của từng khung khi tộc không ghi đè. */
const DEFAULT_WEAPON: Partial<Record<Arch, Weapon>> = {
  miner: 'pick',
  sword: 'sword',
  archer: 'bow',
  ninja: 'dagger',
  spear: 'spear',
  healer: 'staff',
  mage: 'staff',
  giant: 'club',
  builder: 'hammer',
};
/** Khung cầm vũ khí kiểu chém (vung qua đầu). */
const SWING: Arch[] = ['sword', 'miner', 'ninja', 'giant', 'builder'];

/** Kiểu áo choàng sau lưng: dài (kiếm sĩ, kỵ binh…), khăn hai đuôi (còn lại). */
const CAPE: Partial<Record<Arch, [number, number]>> = {
  sword: [26, 12],
  giant: [20, 15],
  cavalry: [22, 10],
  banner: [18, 9],
};

/** Màu năng lượng của một loại quân: màu riêng của quân, không thì màu nền văn minh. */
const energyOf = (s: UnitStats, p: StickPose) => (p.flash ? '#ffffff' : (s.look.tint ?? ENERGY[s.faction] ?? p.accent));
const clock = (p: StickPose) => p.time ?? performance.now() / 1000;

/**
 * Vẽ một stickman tại gốc toạ độ (chân chạm đất ở y = 0), mặt hướng +x.
 * Người gọi lo translate / scale / lật hướng.
 */
export function drawStickman(ctx: CanvasRenderingContext2D, p: StickPose): void {
  const s = UNITS[p.kind] ?? UNITS.sword;
  const a = s.arch;
  const e = energyOf(s, p);
  const time = clock(p);
  if (a === 'tower') {
    drawTower(ctx, p, s, e, time);
    return;
  }
  if (a === 'wall') {
    drawWall(ctx, s.faction, p.gate ?? 0, p.flash, time);
    return;
  }
  if (a === 'catapult') {
    drawMachine(ctx, p, s, s.look.machine ?? 'catapult', e, time);
    return;
  }
  const weapon: Weapon | undefined = s.look.weapon ?? DEFAULT_WEAPON[a];
  const throwing = a === 'archer' && weapon === 'throw';
  // Kỵ binh: vẽ thú cưỡi rồi đặt người cưỡi ngồi trên lưng
  const seated = a === 'cavalry';
  if (seated) {
    const seat = drawMount(ctx, p, s.look.mount ?? 'horse', e);
    ctx.save();
    ctx.translate(seat.x, seat.y + (p.moving ? Math.abs(Math.sin(p.walk)) * -2 : 0));
  }
  const ink = p.flash ? '#ffffff' : p.stone ? p.ink : s.look.ink ? night(s.look.ink, 0.7) : SIL;
  const rim = p.flash ? '#ffffff' : p.accent;
  const walking = p.moving && !seated;
  const t = walking ? p.walk : 0;
  const bob = walking ? Math.abs(Math.cos(t)) * 1.5 : 0;

  // ---- Chân ----
  let legA: [number, number];
  let legB: [number, number];
  if (seated) {
    legA = [1.25, 0.15]; // ngồi trên lưng thú, chân buông hai bên
    legB = [0.95, 0.35];
  } else if (walking) {
    const sn = Math.sin(t);
    legA = [0.55 * sn, 0.55 * sn - 0.5 * Math.max(0, Math.cos(t))];
    legB = [-0.55 * sn, -0.55 * sn - 0.5 * Math.max(0, -Math.cos(t))];
  } else if (p.attack >= 0 || p.mining >= 0) {
    legA = [0.45, 0.2]; // thế đứng tấn
    legB = [-0.35, -0.35];
  } else {
    legA = [0.18, 0.1];
    legB = [-0.18, -0.1];
  }
  const kneeBend = Math.cos(legA[0]) * THIGH + Math.cos(legA[1]) * SHIN;
  const kneeBendB = Math.cos(legB[0]) * THIGH + Math.cos(legB[1]) * SHIN;
  const hipY = -Math.max(kneeBend, kneeBendB) + bob * 0.3;

  // ---- Thân ----
  const thrust = a === 'spear' || a === 'cavalry';
  let lean = walking ? 0.12 : 0;
  const at = p.attack;
  if (at >= 0) {
    if (thrust) lean = at < 1 ? lerp(0, -0.25, at) : lerp(0.35, 0, at - 1);
    else lean = at < 1 ? lerp(0, -0.15, at) : lerp(0.25, 0, at - 1);
  }
  if (p.mining >= 0) lean = 0.25 + Math.sin(p.mining) * 0.1;
  const hip: V = { x: 0, y: hipY };
  const neck = along(hip, Math.PI - lean, TORSO);
  const shoulder = along(hip, Math.PI - lean, TORSO - 3);
  const head = along(neck, Math.PI - lean, HEAD + 1);

  // ---- Tay: [cánh tay, cẳng tay] cho tay vũ khí (trước) và tay còn lại (sau) ----
  let front: [number, number] = [0.25, 0.7];
  let back: [number, number] = [-0.25, 0.3];
  if (walking && at < 0) {
    const sn = Math.sin(t);
    front = [-0.6 * sn, -0.6 * sn + 0.6];
    back = [0.6 * sn, 0.6 * sn + 0.6];
  }
  if (a === 'archer' && !throwing) front = [1.45, 1.55];
  if (thrust) front = [0.9, 1.5];
  if ((a === 'mage' || a === 'healer') && at < 0) front = [0.5, 0.0];
  if (a === 'banner') front = [0.5, -0.2];
  if (weapon === 'bomb' && at < 0) front = [0.9, 0.2];

  if (at >= 0) {
    if (SWING.includes(a) || throwing) {
      const ang = at < 1 ? lerp(0.3, -2.7, easeOut(at)) : lerp(1.7, 0.4, at - 1);
      front = [ang, ang + (at < 1 ? 0.5 : 0.2)];
    } else if (thrust) {
      const ext = at < 1 ? lerp(0, -1, easeOut(at)) : lerp(1, 0, at - 1);
      front = [1.2 + ext * 0.4, 1.57 + ext * 0.1];
    } else if (a === 'archer') {
      const pull = at < 1 ? easeOut(at) : 1 - (at - 1);
      if (weapon === 'musket') front = [1.45 - pull * 0.15, 1.55 - pull * 0.2];
      else back = [lerp(1.2, 1.9, pull), lerp(1.8, -0.4, pull)];
    } else if (a === 'mage' || a === 'healer') {
      const ang = at < 1 ? lerp(0.5, -2.8, easeOut(at)) : lerp(1.4, 0.5, at - 1);
      front = [ang, ang];
    }
  }
  if (p.mining >= 0) {
    const ph = (Math.sin(p.mining * 1.4) + 1) / 2;
    const ang = lerp(-2.4, 1.6, ph);
    front = [ang, ang + 0.4];
  }
  if (p.carrying) back = [-0.9, -2.2];
  if (weapon === 'musket' && a === 'archer') back = [1.1, 1.7];

  const elbowF = along(shoulder, front[0], UPPER);
  const handF = along(elbowF, front[1], FORE);
  const elbowB = along(shoulder, back[0], UPPER);
  const handB = along(elbowB, back[1], FORE);
  const kneeA = along(hip, legA[0], THIGH);
  const footA = along(kneeA, legA[1], SHIN);
  const kneeB = along(hip, legB[0], THIGH);
  const footB = along(kneeB, legB[1], SHIN);
  const width = a === 'giant' ? 4.4 : 3.4;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Áo choàng / khăn màu phe bay sau lưng (vẽ trước để nằm sau thân)
  if (!p.stone) {
    const c = CAPE[a];
    const windy = p.moving || at >= 0;
    if (c) cape(ctx, neck, lean, c[0], c[1], rim, time + p.walk * 0.15, windy);
    else scarf(ctx, neck, lean, rim, time + p.walk * 0.15, windy);
  }

  const limbs = [
    [shoulder, elbowB, handB],
    [footB, kneeB, hip, kneeA, footA],
    [hip, neck],
    [shoulder, elbowF, handF],
  ];
  // Viền sáng: vẽ toàn thân bằng nét màu phe to hơn, mờ, ngay dưới lớp thân đen
  if (!p.flash && !p.stone) {
    const ga = ctx.globalAlpha;
    ctx.strokeStyle = rim;
    ctx.fillStyle = rim;
    ctx.globalAlpha = ga * (p.icon ? 0.9 : 0.55);
    ctx.lineWidth = width + (p.icon ? 3.4 : 2.6);
    for (const l of limbs) polyline(ctx, l);
    ctx.beginPath();
    ctx.arc(head.x, head.y, HEAD + (p.icon ? 1.7 : 1.3), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = ga;
  }

  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = width;

  // Tay sau + túi vàng / viên kim cương (phát sáng)
  if (p.carrying) carry(ctx, { x: shoulder.x - 7, y: shoulder.y - 2 }, p);
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = width;
  polyline(ctx, limbs[0]);
  polyline(ctx, limbs[1]);
  polyline(ctx, limbs[2]);
  ctx.beginPath();
  ctx.arc(head.x, head.y, HEAD, 0, Math.PI * 2);
  ctx.fill();

  // Áo choàng pháp sư / thầy thuốc: bóng đen viền năng lượng
  if (a === 'mage' || a === 'healer') robe(ctx, shoulder, p.flash ? '#ffffff' : GEAR, e);

  const g: Gear = { ctx, p, s, a, weapon, head, shoulder, hand: handF, handB, fore: front[1], ink, e, rim, time };
  let eyes = true;
  if (!p.stone || a === 'sword') eyes = drawHead(g, s.look.head ?? 'halo');
  if (eyes && !p.stone && !p.flash) glowEyes(ctx, head, rim);
  drawWeaponGear(g);

  // Tay trước (vẽ sau cùng để nằm trên vũ khí)
  ctx.strokeStyle = ink;
  ctx.lineWidth = width;
  polyline(ctx, limbs[3]);
  if (seated) ctx.restore();
}

type Gear = {
  ctx: CanvasRenderingContext2D;
  p: StickPose;
  s: UnitStats;
  a: Arch;
  weapon: Weapon | undefined;
  head: V;
  shoulder: V;
  hand: V;
  handB: V;
  fore: number;
  ink: string;
  /** Màu năng lượng (vũ khí, hoa văn). */
  e: string;
  /** Màu phe (viền sáng, cờ, khăn). */
  rim: string;
  time: number;
};

// ---------- Nét vẽ dùng chung ----------

/** Nhân độ trong suốt hiện tại trong lúc vẽ `draw`. */
function faded(ctx: CanvasRenderingContext2D, k: number, draw: () => void): void {
  const ga = ctx.globalAlpha;
  ctx.globalAlpha = ga * k;
  draw();
  ctx.globalAlpha = ga;
}

/** Nét phát sáng: quầng mờ rộng, nét màu, lõi trắng — thay cho shadowBlur (rẻ hơn nhiều khi có cả trăm quân). */
function neonPath(ctx: CanvasRenderingContext2D, build: () => void, color: string, w: number): void {
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  faded(ctx, 0.28, () => {
    ctx.strokeStyle = color;
    ctx.lineWidth = w + 3.6;
    ctx.beginPath();
    build();
    ctx.stroke();
  });
  ctx.strokeStyle = color;
  ctx.lineWidth = w;
  ctx.beginPath();
  build();
  ctx.stroke();
  faded(ctx, 0.85, () => {
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = Math.max(0.5, w * 0.38);
    ctx.beginPath();
    build();
    ctx.stroke();
  });
}

function neonLine(ctx: CanvasRenderingContext2D, a: V, b: V, color: string, w: number): void {
  neonPath(
    ctx,
    () => {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    },
    color,
    w,
  );
}

/** Khối đặc phát sáng (mũi giáo, lưỡi rìu…): tô màu + quầng mờ quanh mép. */
function neonFill(ctx: CanvasRenderingContext2D, build: () => void, color: string): void {
  faded(ctx, 0.3, () => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    build();
    ctx.closePath();
    ctx.stroke();
  });
  ctx.fillStyle = color;
  ctx.beginPath();
  build();
  ctx.closePath();
  ctx.fill();
}

/** Khối bóng đen viền hoa văn năng lượng (mũ, giáp, khiên…). */
function gearFill(ctx: CanvasRenderingContext2D, build: () => void, fill: string, trim: string, trimW = 0.9): void {
  ctx.fillStyle = fill;
  ctx.beginPath();
  build();
  ctx.fill();
  ctx.strokeStyle = trim;
  ctx.lineWidth = trimW;
  ctx.beginPath();
  build();
  ctx.stroke();
}

/** Đốm sáng tròn (quả cầu phép, đèn, mắt thú). */
function glowDot(ctx: CanvasRenderingContext2D, at: V, r: number, color: string): void {
  faded(ctx, 0.25, () => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(at.x, at.y, r * 2.2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(at.x, at.y, r, 0, Math.PI * 2);
  ctx.fill();
  faded(ctx, 0.9, () => {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(at.x, at.y, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  });
}

/** Hai mắt xếch phát sáng như nhân vật trong ảnh nền. */
function glowEyes(ctx: CanvasRenderingContext2D, h: V, color: string): void {
  const eye = (pts: [number, number][]) => {
    ctx.beginPath();
    ctx.moveTo(h.x + pts[0][0], h.y + pts[0][1]);
    for (const [x, y] of pts.slice(1)) ctx.lineTo(h.x + x, h.y + y);
    ctx.closePath();
  };
  const shapes: [number, number][][] = [
    [
      [0.4, -1.9],
      [3, -0.5],
      [2.7, 0.6],
      [0.3, -0.4],
    ],
    [
      [3.7, -0.6],
      [5.5, -1.8],
      [5.4, -0.2],
      [3.8, 0.5],
    ],
  ];
  faded(ctx, 0.75, () => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.8;
    for (const s of shapes) {
      eye(s);
      ctx.stroke();
    }
  });
  ctx.fillStyle = '#ffffff';
  for (const s of shapes) {
    eye(s);
    ctx.fill();
  }
}

/** Áo choàng dài rách mép, bay về sau theo gió (mạnh hơn khi chạy / ra đòn). */
function cape(
  ctx: CanvasRenderingContext2D,
  neck: V,
  lean: number,
  len: number,
  wide: number,
  color: string,
  time: number,
  windy: boolean,
): void {
  const flow = windy ? 1 : 0.3;
  const theta = lerp(1.3, 0.38, flow) - lean * 0.6; // góc so với phương ngang, hướng ra sau
  const d = { x: -Math.cos(theta), y: Math.sin(theta) };
  const n = { x: -d.y, y: d.x };
  const sp = windy ? 8 : 3;
  const w1 = Math.sin(time * sp) * (windy ? 3.5 : 1.5);
  const w2 = Math.sin(time * sp + 1.4) * (windy ? 3 : 1.2);
  const A = { x: neck.x + 1, y: neck.y + 0.5 };
  const B = { x: neck.x - 1.5, y: neck.y + 5 };
  const T = { x: neck.x + d.x * len, y: neck.y + d.y * len + 3 };
  const T1 = { x: T.x + n.x * (wide / 2) + n.x * w1, y: T.y + n.y * (wide / 2) + n.y * w1 };
  const T2 = { x: T.x - n.x * (wide / 2) + n.x * w2, y: T.y - n.y * (wide / 2) + n.y * w2 };
  const C1 = { x: A.x + d.x * len * 0.55 + n.x * (wide * 0.15 + w2), y: A.y + d.y * len * 0.55 + n.y * (wide * 0.15 + w2) };
  const C2 = { x: B.x + d.x * len * 0.5 - n.x * (wide * 0.25 - w1), y: B.y + d.y * len * 0.5 - n.y * (wide * 0.25 - w1) };
  const g = ctx.createLinearGradient(A.x, A.y, T.x, T.y);
  g.addColorStop(0, mix(color, '#ffffff', 0.08));
  g.addColorStop(0.55, color);
  g.addColorStop(1, mix(color, NIGHT, 0.55));
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(A.x, A.y);
  ctx.quadraticCurveTo(C1.x, C1.y, T1.x, T1.y);
  // Mép rách răng cưa
  const teeth = 4;
  for (let i = 1; i <= teeth; i++) {
    const k = i / teeth;
    const bx = lerp(T1.x, T2.x, k);
    const by = lerp(T1.y, T2.y, k);
    const inset = i % 2 ? 3.5 + Math.sin(time * 5 + i) : 0;
    ctx.lineTo(bx - d.x * inset, by - d.y * inset);
  }
  ctx.quadraticCurveTo(C2.x, C2.y, B.x, B.y);
  ctx.closePath();
  ctx.fill();
  // Nếp gấp tối
  faded(ctx, 0.35, () => {
    ctx.strokeStyle = NIGHT;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(neck.x, neck.y + 2);
    ctx.quadraticCurveTo(lerp(C1.x, C2.x, 0.5), lerp(C1.y, C2.y, 0.5), T.x - d.x * 2, T.y - d.y * 2);
    ctx.stroke();
  });
}

/** Khăn quàng hai đuôi màu phe. */
function scarf(ctx: CanvasRenderingContext2D, neck: V, lean: number, color: string, time: number, windy: boolean): void {
  const flow = windy ? 1 : 0.25;
  const tail = (len: number, w: number, phase: number, c: string) => {
    const theta = lerp(1.35, 0.25, flow) - lean * 0.6 + Math.sin(time * (windy ? 9 : 3) + phase) * 0.15;
    const d = { x: -Math.cos(theta), y: Math.sin(theta) };
    const n = { x: -d.y, y: d.x };
    const wave = Math.sin(time * (windy ? 10 : 3) + phase + 1) * (windy ? 2.5 : 1);
    const A = { x: neck.x - 0.5, y: neck.y + 1.5 };
    const T = { x: A.x + d.x * len + n.x * wave, y: A.y + d.y * len + n.y * wave };
    const M = { x: A.x + d.x * len * 0.5 - n.x * wave, y: A.y + d.y * len * 0.5 - n.y * wave };
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(A.x + n.x * w, A.y + n.y * w);
    ctx.quadraticCurveTo(M.x + n.x * w * 0.7, M.y + n.y * w * 0.7, T.x, T.y);
    ctx.quadraticCurveTo(M.x - n.x * w * 0.7, M.y - n.y * w * 0.7, A.x - n.x * w, A.y - n.y * w);
    ctx.closePath();
    ctx.fill();
  };
  tail(14, 2.2, 0, color);
  tail(10, 1.6, 1.7, mix(color, NIGHT, 0.35));
  // Vòng khăn quanh cổ
  ctx.strokeStyle = color;
  ctx.lineWidth = 2.6;
  ctx.beginPath();
  ctx.moveTo(neck.x - 2, neck.y + 1.5);
  ctx.lineTo(neck.x + 2.5, neck.y + 1);
  ctx.stroke();
}

/** Túi vàng / quặng bạc / viên kim cương thợ mỏ vác sau lưng (phát sáng). */
function carry(ctx: CanvasRenderingContext2D, at: V, p: StickPose): void {
  if (p.gem) {
    neonFill(
      ctx,
      () => {
        ctx.moveTo(at.x, at.y - 7);
        ctx.lineTo(at.x + 5.5, at.y - 1);
        ctx.lineTo(at.x, at.y + 6);
        ctx.lineTo(at.x - 5.5, at.y - 1);
      },
      '#6fe7ff',
    );
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.beginPath();
    ctx.moveTo(at.x - 1, at.y - 5);
    ctx.lineTo(at.x + 2, at.y - 1.5);
    ctx.lineTo(at.x - 1, at.y - 1);
    ctx.closePath();
    ctx.fill();
    return;
  }
  const ore = p.silver ? '#d7deea' : '#ffc93a';
  gearFill(ctx, () => ctx.arc(at.x, at.y, 5.5, 0, Math.PI * 2), GEAR, ore, 1.2);
  glowDot(ctx, { x: at.x + 1, y: at.y - 1.5 }, 2, ore);
  glowDot(ctx, { x: at.x - 2, y: at.y + 1.5 }, 1.4, ore);
}

// ---------- Đầu / tóc theo hệ ----------

/**
 * Đầu người que theo hệ (phong cách 2 ảnh mẫu docs/art/reference): tóc / mũ là bóng đen nối liền thân,
 * chỉ viền màu năng lượng; trả về có vẽ đôi mắt sáng chuẩn hay không.
 */
function drawHead(g: Gear, style: Head): boolean {
  const { ctx, head: h, p, e, rim, time } = g;
  const ink = p.flash ? '#ffffff' : g.ink;
  const hi = p.flash ? '#ffffff' : GEAR_HI;
  const sway = Math.sin(time * 6 + h.x * 0.3);
  switch (style) {
    case 'halo': {
      // Hệ Quang: tóc dựng + vầng hào quang sau đầu
      if (!p.flash) {
        ctx.save();
        ctx.strokeStyle = rgba(e, 0.85);
        ctx.lineWidth = 1.4;
        ctx.shadowColor = e;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.ellipse(h.x - 2, h.y - HEAD - 3, 6.5, 2.2, -0.25, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
      spikyHair(g, [
        [-7, -4],
        [-4, -11],
        [0, -12],
        [4, -9],
      ]);
      return true;
    }
    case 'gale': {
      // Hệ Phong: tóc dài bay ngược gió
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x + HEAD - 1, h.y - 3);
          ctx.quadraticCurveTo(h.x, h.y - HEAD - 4, h.x - HEAD, h.y - 3);
          ctx.quadraticCurveTo(h.x - 12, h.y - 6 + sway, h.x - 19, h.y - 2 + sway * 2);
          ctx.quadraticCurveTo(h.x - 12, h.y + 1 + sway, h.x - HEAD, h.y + 2);
          ctx.closePath();
        },
        ink,
        e,
        0.7,
      );
      return true;
    }
    case 'leafhood': {
      // Hệ Mộc: mũ trùm lá + tai nhọn
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x - HEAD - 1.5, h.y + 3);
          ctx.quadraticCurveTo(h.x - 3, h.y - HEAD * 2.6, h.x + HEAD + 1, h.y - 1);
          ctx.lineTo(h.x + HEAD, h.y + 1);
          ctx.closePath();
        },
        ink,
        e,
      );
      line(ctx, { x: h.x + 1, y: h.y }, { x: h.x - 3, y: h.y - 7 }, ink, 1.6);
      return true;
    }
    case 'shade': {
      // Hệ Ám: mũ trùm kín có hai sừng nhỏ, khói tím bốc nhẹ
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x - HEAD - 2, h.y + 5);
          ctx.quadraticCurveTo(h.x - HEAD - 2, h.y - HEAD - 3, h.x + 1, h.y - HEAD - 1.5);
          ctx.quadraticCurveTo(h.x + HEAD + 2, h.y - HEAD + 1, h.x + HEAD + 1, h.y + 1);
          ctx.lineTo(h.x + 2, h.y + 4);
          ctx.closePath();
          ctx.moveTo(h.x - 3, h.y - HEAD);
          ctx.lineTo(h.x - 6, h.y - HEAD - 6);
          ctx.lineTo(h.x - 1, h.y - HEAD - 1);
          ctx.closePath();
          ctx.moveTo(h.x + 2, h.y - HEAD - 0.5);
          ctx.lineTo(h.x + 2, h.y - HEAD - 6.5);
          ctx.lineTo(h.x + 5, h.y - HEAD + 0.5);
          ctx.closePath();
        },
        ink,
        e,
        0.8,
      );
      if (!p.flash) glowDot(ctx, { x: h.x - 7 + sway, y: h.y - HEAD - 4 - ((time * 6) % 4) }, 0.9, rgba(e, 0.6));
      return true;
    }
    case 'bolt': {
      // Hệ Lôi: tóc dựng gấp khúc như tia sét, tia điện nhỏ
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x - HEAD, h.y + 1);
          ctx.lineTo(h.x - 9, h.y - 5);
          ctx.lineTo(h.x - 5, h.y - 6);
          ctx.lineTo(h.x - 8, h.y - 13);
          ctx.lineTo(h.x - 1, h.y - 7.5);
          ctx.lineTo(h.x, h.y - 14);
          ctx.lineTo(h.x + 3, h.y - 7);
          ctx.lineTo(h.x + 8, h.y - 9);
          ctx.lineTo(h.x + HEAD, h.y - 3);
          ctx.quadraticCurveTo(h.x, h.y - HEAD - 1, h.x - HEAD, h.y + 1);
          ctx.closePath();
        },
        ink,
        e,
        0.8,
      );
      if (!p.flash && sway > 0.6) glowDot(ctx, { x: h.x - 8, y: h.y - 13 }, 1.2, e);
      return true;
    }
    case 'blood': {
      // Hệ Huyết: tóc dài rối bù + băng trán màu vải bay
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x + HEAD - 1, h.y - 3);
          ctx.lineTo(h.x + 2, h.y - 11);
          ctx.lineTo(h.x - 2, h.y - 8);
          ctx.lineTo(h.x - 6, h.y - 12);
          ctx.lineTo(h.x - 7, h.y - 6);
          ctx.lineTo(h.x - 13, h.y - 5 + sway);
          ctx.lineTo(h.x - 8, h.y - 1);
          ctx.lineTo(h.x - 12, h.y + 4 + sway);
          ctx.lineTo(h.x - HEAD, h.y + 3);
          ctx.closePath();
        },
        ink,
        e,
        0.7,
      );
      if (!p.flash) headband(ctx, h, rim, time, 9);
      return true;
    }
    case 'crystal': {
      // Hệ Tinh thể: ba mảnh tinh thể mọc trên đầu
      spikyHair(g, [
        [-6, -5],
        [-3, -9],
        [2, -8],
      ]);
      for (const [dx, len, tilt] of [
        [-3, 9, -0.35],
        [1, 12, 0.05],
        [4.5, 7, 0.45],
      ]) {
        neonFill(
          ctx,
          () => {
            const bx = h.x + dx;
            const by = h.y - HEAD + 1.5;
            const tx = bx + Math.sin(tilt) * len;
            const ty = by - Math.cos(tilt) * len;
            ctx.moveTo(bx - 1.6, by);
            ctx.lineTo(tx - 0.4, ty + 2);
            ctx.lineTo(tx, ty);
            ctx.lineTo(tx + 0.6, ty + 2);
            ctx.lineTo(bx + 1.6, by);
          },
          rgba(e, 0.85),
        );
      }
      return true;
    }
    case 'rock': {
      // Hệ Thạch: mũ đá thô gồ ghề, vết nứt sáng
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x - HEAD - 2, h.y + 1);
          ctx.lineTo(h.x - HEAD - 1, h.y - 4);
          ctx.lineTo(h.x - 3, h.y - HEAD - 3);
          ctx.lineTo(h.x + 2, h.y - HEAD - 2);
          ctx.lineTo(h.x + HEAD + 1, h.y - 3);
          ctx.lineTo(h.x + HEAD + 2, h.y - 0.5);
          ctx.closePath();
        },
        hi,
        e,
        0.7,
      );
      if (!p.flash)
        neonPath(
          ctx,
          () => {
            ctx.moveTo(h.x - 3, h.y - HEAD - 2);
            ctx.lineTo(h.x - 1, h.y - 4);
            ctx.lineTo(h.x - 3, h.y - 1.5);
          },
          e,
          0.8,
        );
      return true;
    }
    case 'iron': {
      // Hệ Kim: mũ sắt có mào và tấm che mũi
      gearFill(
        ctx,
        () => {
          ctx.arc(h.x, h.y - 0.5, HEAD + 1.3, Math.PI * 0.95, Math.PI * 2.05);
          ctx.rect(h.x + HEAD - 1, h.y - 1, 1.8, 5);
        },
        hi,
        e,
        0.8,
      );
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x - 5, h.y - HEAD - 1);
          ctx.quadraticCurveTo(h.x - 2, h.y - HEAD - 8, h.x + 4, h.y - HEAD - 2);
          ctx.closePath();
        },
        hi,
        e,
        0.6,
      );
      return true;
    }
    case 'wave': {
      // Hệ Thủy: tóc dài uốn như con sóng, giọt nước sáng
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x + HEAD - 1, h.y - 3);
          ctx.quadraticCurveTo(h.x, h.y - HEAD - 5, h.x - HEAD - 1, h.y - 2);
          ctx.quadraticCurveTo(h.x - 12, h.y - 7 + sway, h.x - 14, h.y - 2);
          ctx.quadraticCurveTo(h.x - 13, h.y + 4, h.x - 9, h.y + 3 + sway);
          ctx.quadraticCurveTo(h.x - 7, h.y + 5, h.x - HEAD, h.y + 3);
          ctx.closePath();
        },
        ink,
        e,
        0.7,
      );
      if (!p.flash) glowDot(ctx, { x: h.x - 14, y: h.y + 1 + ((time * 8) % 5) }, 0.9, e);
      return true;
    }
    case 'flame': {
      // Hệ Hỏa: tóc dựng như ngọn lửa, đầu tóc cháy sáng
      const f = (k: number) => Math.sin(time * 9 + k) * 1.2;
      gearFill(
        ctx,
        () => {
          ctx.moveTo(h.x - HEAD, h.y + 1);
          ctx.quadraticCurveTo(h.x - 10, h.y - 4, h.x - 11 + f(1), h.y - 10);
          ctx.quadraticCurveTo(h.x - 6, h.y - 7, h.x - 4 + f(2), h.y - 14);
          ctx.quadraticCurveTo(h.x - 1, h.y - 9, h.x + 2 + f(3), h.y - 15);
          ctx.quadraticCurveTo(h.x + 4, h.y - 8, h.x + 8 + f(4), h.y - 9);
          ctx.quadraticCurveTo(h.x + 6, h.y - 5, h.x + HEAD, h.y - 3);
          ctx.quadraticCurveTo(h.x, h.y - HEAD - 1, h.x - HEAD, h.y + 1);
          ctx.closePath();
        },
        ink,
        e,
        0.9,
      );
      if (!p.flash) {
        glowDot(ctx, { x: h.x - 4 + f(2), y: h.y - 14 }, 1.1, e);
        glowDot(ctx, { x: h.x + 2 + f(3), y: h.y - 15 }, 1.2, e);
      }
      return true;
    }
    case 'icecrown': {
      // Hệ Băng: tóc dựng + vương miện băng nhọn phát sáng
      spikyHair(g, [
        [-7, -4],
        [-4, -9],
        [1, -8],
      ]);
      neonFill(
        ctx,
        () => {
          ctx.moveTo(h.x - HEAD, h.y - HEAD + 2);
          for (let i = 0; i <= 4; i++) ctx.lineTo(h.x - HEAD + (i * HEAD * 2) / 4, h.y - HEAD - (i % 2 ? 2 : 8));
          ctx.lineTo(h.x + HEAD, h.y - HEAD + 2);
        },
        rgba(e, 0.9),
      );
      return true;
    }
  }
  return true;
}

/** Tóc dựng nhọn kiểu anime (bóng đen viền năng lượng): các đỉnh tóc tính từ tâm đầu, hướng ra sau và lên. */
function spikyHair(g: Gear, tips: [number, number][]): void {
  const { ctx, head: h, p, e } = g;
  gearFill(
    ctx,
    () => {
      ctx.moveTo(h.x - HEAD, h.y + 2);
      let bx = h.x - HEAD;
      for (const [dx, dy] of tips) {
        ctx.lineTo(h.x + dx, h.y + dy);
        bx += (HEAD * 2) / (tips.length + 1);
        ctx.lineTo(bx, h.y - HEAD + 1.5);
      }
      ctx.lineTo(h.x + HEAD, h.y - 2);
      ctx.quadraticCurveTo(h.x, h.y - HEAD - 1, h.x - HEAD, h.y + 2);
      ctx.closePath();
    },
    p.flash ? '#ffffff' : g.ink,
    e,
    0.7,
  );
}

function headband(ctx: CanvasRenderingContext2D, head: V, color: string, time: number, tail = 7): void {
  const wave = Math.sin(time * 7 + head.x) * 1.5;
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(head.x - HEAD, head.y - 1.5);
  ctx.lineTo(head.x + HEAD, head.y - 1.5);
  ctx.moveTo(head.x - HEAD, head.y - 1.5);
  ctx.quadraticCurveTo(head.x - HEAD - tail * 0.5, head.y - 3 + wave, head.x - HEAD - tail, head.y + 1 + wave);
  ctx.stroke();
}

// ---------- Vũ khí ----------

function drawWeaponGear(g: Gear): void {
  const { ctx, p, s, a, weapon, hand, handB, shoulder, fore, e, rim, time } = g;
  const gear = p.flash ? '#ffffff' : GEAR;
  const hi = p.flash ? '#ffffff' : GEAR_HI;
  const dir = { x: Math.sin(fore), y: Math.cos(fore) };
  const tip = (len: number): V => ({ x: hand.x + dir.x * len, y: hand.y + dir.y * len });
  const perp = { x: -dir.y, y: dir.x };
  const swinging = p.attack >= 1 && p.attack < 1.45;

  if (a === 'banner') {
    // Cán cờ cao + lá cờ màu phe bay theo gió, ấn năng lượng giữa cờ
    const top = { x: hand.x + 2, y: hand.y - 38 };
    line(ctx, { x: hand.x, y: hand.y + 6 }, top, gear, 2);
    glowDot(ctx, { x: top.x, y: top.y - 1 }, 1.4, e);
    const wave = Math.sin((p.walk + time * 3.3) * 1.3) * 2;
    ctx.fillStyle = rim;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.quadraticCurveTo(top.x - 9, top.y + 3 + wave, top.x - 18, top.y + 2);
    ctx.lineTo(top.x - 15, top.y + 8);
    ctx.lineTo(top.x - 18, top.y + 14);
    ctx.quadraticCurveTo(top.x - 9, top.y + 15 + wave, top.x, top.y + 12);
    ctx.closePath();
    ctx.fill();
    const cx = top.x - 9;
    const cy = top.y + 7 + wave * 0.5;
    neonFill(
      ctx,
      () => {
        ctx.moveTo(cx, cy - 3.5);
        ctx.lineTo(cx + 2.5, cy);
        ctx.lineTo(cx, cy + 3.5);
        ctx.lineTo(cx - 2.5, cy);
      },
      e,
    );
    return;
  }

  if (a === 'cavalry') {
    lance(ctx, tip, dir, perp, gear, e, rim);
    return;
  }

  if (a === 'spear') {
    const shield = s.look.shield ?? (s.faction === 'tribe' ? 'oval' : 'none');
    if (weapon === 'club') club(ctx, hand, tip(18), gear, e);
    else polearm(ctx, tip, dir, perp, weapon ?? 'spear', gear, e);
    if (shield !== 'none') drawShield(ctx, shoulder, shield, hi, e, rim);
    return;
  }

  switch (weapon) {
    case 'trident':
      polearm(ctx, tip, dir, perp, 'trident', gear, e);
      return;
    case 'pick': {
      const end = tip(14);
      line(ctx, hand, end, gear, 2.2);
      neonPath(
        ctx,
        () => {
          ctx.moveTo(end.x + perp.x * 6 - dir.x * 2, end.y + perp.y * 6 - dir.y * 2);
          ctx.quadraticCurveTo(end.x + dir.x * 1.5, end.y + dir.y * 1.5, end.x - perp.x * 6 - dir.x * 2, end.y - perp.y * 6 - dir.y * 2);
        },
        e,
        1.8,
      );
      return;
    }
    case 'drill': {
      const end = tip(16);
      gearFill(
        ctx,
        () => {
          ctx.moveTo(hand.x + perp.x * 3, hand.y + perp.y * 3);
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(hand.x - perp.x * 3, hand.y - perp.y * 3);
          ctx.closePath();
        },
        hi,
        e,
      );
      // Rãnh xoắn sáng
      for (let i = 1; i <= 3; i++) {
        const q = tip(i * 4);
        const w = 3 * (1 - (i * 4) / 16);
        line(
          ctx,
          { x: q.x + perp.x * w, y: q.y + perp.y * w },
          { x: q.x - perp.x * w + dir.x * 2, y: q.y - perp.y * w + dir.y * 2 },
          e,
          0.8,
        );
      }
      return;
    }
    case 'hammer': {
      const end = tip(13);
      line(ctx, hand, end, gear, 2.2);
      {
        gearFill(
          ctx,
          () => {
            ctx.moveTo(end.x + perp.x * 5 - dir.x * 2.5, end.y + perp.y * 5 - dir.y * 2.5);
            ctx.lineTo(end.x + perp.x * 5 + dir.x * 2.5, end.y + perp.y * 5 + dir.y * 2.5);
            ctx.lineTo(end.x - perp.x * 5 + dir.x * 2.5, end.y - perp.y * 5 + dir.y * 2.5);
            ctx.lineTo(end.x - perp.x * 5 - dir.x * 2.5, end.y - perp.y * 5 - dir.y * 2.5);
            ctx.closePath();
          },
          hi,
          e,
          1,
        );
        // Rune sáng trên đầu búa
        glowDot(ctx, end, 1, e);
      }
      if (a === 'healer') orb(ctx, tip(-12), e, p.attack);
      return;
    }
    case 'sword':
    case 'saber': {
      const len = weapon === 'saber' ? 17 : 20;
      const end = tip(len);
      // Lưỡi kiếm năng lượng; vung đòn thì để lại vệt chém
      if (swinging) slashTrail(ctx, shoulder, len + 16, p.attack, e);
      neonLine(ctx, tip(2), end, e, weapon === 'saber' ? 1.7 : 2.3);
      line(ctx, hand, tip(-3), gear, 2.4);
      const guard = tip(2);
      line(
        ctx,
        { x: guard.x + perp.x * 3.5, y: guard.y + perp.y * 3.5 },
        { x: guard.x - perp.x * 3.5, y: guard.y - perp.y * 3.5 },
        hi,
        2.2,
      );
      return;
    }
    case 'katana': {
      const end = tip(21);
      if (swinging) slashTrail(ctx, shoulder, 36, p.attack, e);
      const mid = tip(11);
      neonPath(
        ctx,
        () => {
          ctx.moveTo(hand.x, hand.y);
          ctx.quadraticCurveTo(mid.x + perp.x * 2, mid.y + perp.y * 2, end.x, end.y);
        },
        e,
        1.7,
      );
      line(ctx, hand, tip(-4), gear, 2.4);
      return;
    }
    case 'khopesh': {
      const mid = tip(10);
      const end = tip(15);
      if (swinging) slashTrail(ctx, shoulder, 30, p.attack, e);
      neonPath(
        ctx,
        () => {
          ctx.moveTo(hand.x, hand.y);
          ctx.lineTo(mid.x, mid.y);
          ctx.quadraticCurveTo(end.x + perp.x * 7, end.y + perp.y * 7, end.x - perp.x * 2, end.y - perp.y * 2);
        },
        e,
        2,
      );
      return;
    }
    case 'axe': {
      const end = tip(16);
      if (swinging) slashTrail(ctx, shoulder, 30, p.attack, e);
      line(ctx, hand, end, gear, 2.2);
      gearFill(
        ctx,
        () => {
          ctx.moveTo(end.x, end.y);
          ctx.lineTo(end.x + perp.x * 7 - dir.x * 3, end.y + perp.y * 7 - dir.y * 3);
          ctx.lineTo(end.x + perp.x * 7 + dir.x * 4, end.y + perp.y * 7 + dir.y * 4);
          ctx.closePath();
        },
        hi,
        e,
        0.6,
      );
      neonLine(
        ctx,
        { x: end.x + perp.x * 7 - dir.x * 3, y: end.y + perp.y * 7 - dir.y * 3 },
        { x: end.x + perp.x * 7 + dir.x * 4, y: end.y + perp.y * 7 + dir.y * 4 },
        e,
        1.2,
      );
      return;
    }
    case 'cleaver': {
      const end = tip(16);
      if (swinging) slashTrail(ctx, shoulder, 30, p.attack, e);
      line(ctx, hand, tip(3), gear, 2.4);
      gearFill(
        ctx,
        () => {
          ctx.moveTo(tip(3).x, tip(3).y);
          ctx.lineTo(end.x, end.y);
          ctx.lineTo(end.x + perp.x * 6, end.y + perp.y * 6);
          ctx.lineTo(tip(3).x + perp.x * 6, tip(3).y + perp.y * 6);
          ctx.closePath();
        },
        hi,
        e,
        0.6,
      );
      neonLine(ctx, { x: tip(3).x + perp.x * 6, y: tip(3).y + perp.y * 6 }, { x: end.x + perp.x * 6, y: end.y + perp.y * 6 }, e, 1.2);
      return;
    }
    case 'scythe': {
      const end = tip(20);
      line(ctx, tip(-6), end, gear, 2);
      neonPath(
        ctx,
        () => {
          ctx.moveTo(end.x, end.y);
          ctx.quadraticCurveTo(
            end.x + perp.x * 10 - dir.x * 2,
            end.y + perp.y * 10 - dir.y * 2,
            end.x + perp.x * 12 + dir.x * 6,
            end.y + perp.y * 12 + dir.y * 6,
          );
        },
        e,
        1.6,
      );
      return;
    }
    case 'club': {
      if (swinging) slashTrail(ctx, shoulder, a === 'giant' ? 40 : 32, p.attack, e);
      club(ctx, hand, tip(a === 'giant' ? 22 : 16), gear, e);
      return;
    }
    case 'dagger': {
      if (swinging) slashTrail(ctx, shoulder, 22, p.attack, e);
      neonLine(ctx, hand, tip(12), e, 1.7);
      return;
    }
    case 'bomb': {
      const c = { x: hand.x + 2, y: hand.y - 2 };
      gearFill(ctx, () => ctx.arc(c.x, c.y, 5, 0, Math.PI * 2), gear, e, 1);
      line(ctx, { x: hand.x + 4, y: hand.y - 6 }, { x: hand.x + 7, y: hand.y - 10 }, hi, 1.4);
      glowDot(ctx, { x: hand.x + 7, y: hand.y - 11 }, 1.6, Math.sin(time * 16) > 0 ? '#fde047' : '#ff6a1a');
      return;
    }
    case 'bow': {
      // Cánh cung đen viền năng lượng, dây sáng mảnh, mũi tên phát sáng khi giương
      neonPath(ctx, () => ctx.arc(hand.x - 4, hand.y, 12, -1.15, 1.15), hi, 2);
      const top = { x: hand.x - 4 + Math.cos(-1.15) * 12, y: hand.y + Math.sin(-1.15) * 12 };
      const bot = { x: hand.x - 4 + Math.cos(1.15) * 12, y: hand.y + Math.sin(1.15) * 12 };
      const drawing = p.attack >= 0 && p.attack < 1;
      const pull = drawing ? handB : { x: bot.x - 0.5, y: hand.y };
      ctx.strokeStyle = rgba(e, 0.85);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(pull.x, pull.y);
      ctx.lineTo(bot.x, bot.y);
      ctx.stroke();
      if (drawing) neonLine(ctx, handB, { x: hand.x + 7, y: hand.y }, e, 1.2);
      return;
    }
    case 'musket': {
      const end = tip(a === 'mage' ? 16 : 24);
      line(ctx, tip(-8), end, gear, 3);
      line(ctx, tip(2), end, hi, 1.8);
      neonLine(ctx, tip(-2), tip(1), e, 1); // vòng đồng
      if (a === 'mage') {
        // Súng phun lửa: bình nhiên liệu sau lưng, có vạch sáng
        gearFill(ctx, () => ctx.rect(shoulder.x - 9, shoulder.y + 1, 5, 12), hi, e, 0.8);
        glowDot(ctx, { x: shoulder.x - 6.5, y: shoulder.y + 4 }, 1, e);
      }
      if (p.attack >= 1 && p.attack < 1.3)
        glowDot(ctx, { x: end.x + dir.x * 3, y: end.y + dir.y * 3 }, a === 'mage' ? 5 : 3, a === 'mage' ? '#ff8a3a' : '#ffe08a');
      return;
    }
    case 'throw': {
      if (p.attack >= 1) return; // đã ném đi
      if (s.projectile === 'axe') {
        const end = tip(10);
        line(ctx, hand, end, gear, 2);
        neonFill(
          ctx,
          () => {
            ctx.moveTo(end.x, end.y);
            ctx.lineTo(end.x + perp.x * 5, end.y + perp.y * 5);
            ctx.lineTo(end.x + perp.x * 5 + dir.x * 4, end.y + perp.y * 5 + dir.y * 4);
          },
          e,
        );
      } else {
        line(ctx, tip(-10), tip(16), gear, 1.8);
        neonLine(ctx, tip(14), tip(19), e, 1.8);
      }
      return;
    }
    case 'staff': {
      const top = tip(-12);
      line(ctx, top, tip(16), gear, 2.2);
      if (a === 'healer' && s.faction === 'tribe') {
        healCross(ctx, top, p.attack);
        return;
      }
      // Vòng đỡ quanh quả cầu
      ctx.strokeStyle = hi;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(top.x, top.y, 4.5, Math.PI * 0.15, Math.PI * 0.85);
      ctx.stroke();
      orb(ctx, top, e, p.attack);
      return;
    }
  }
}

/**
 * Vệt chém hình cung (như vệt sáng trong ảnh nền): hiện ngay sau khi vung — pha 1..2 của đòn, khi tay đã quét
 * từ sau đầu (−2.7) xuống trước (1.7) — rồi mờ dần.
 */
function slashTrail(ctx: CanvasRenderingContext2D, shoulder: V, r: number, attack: number, color: string): void {
  if (attack < 1 || attack > 1.45) return;
  const fade = 1 - (attack - 1) / 0.45;
  // Từ sau đầu (−2.7 ≡ 2π − 2.7) quét qua đỉnh đầu (π) xuống trước (1.7): θ giảm dần
  const from = Math.PI * 2 - 2.7;
  const to = 1.7 + (attack - 1) * 0.8;
  faded(ctx, 0.6 * fade, () => {
    ctx.strokeStyle = color;
    ctx.lineCap = 'round';
    for (const [w, a] of [
      [6, 0.3],
      [2.2, 1],
    ] as const) {
      faded(ctx, a, () => {
        ctx.lineWidth = w;
        ctx.beginPath();
        // along(): x = sin(θ)·r, y = cos(θ)·r  →  góc arc chuẩn φ = π/2 − θ (θ giảm = φ tăng, quay xuôi)
        ctx.arc(shoulder.x, shoulder.y, r, Math.PI / 2 - from, Math.PI / 2 - to);
        ctx.stroke();
      });
    }
  });
}

function orb(ctx: CanvasRenderingContext2D, at: V, color: string, attack: number): void {
  const r = attack >= 0 && attack < 1 ? 3.2 + attack * 3 : 3;
  glowDot(ctx, at, r, color);
}

function healCross(ctx: CanvasRenderingContext2D, top: V, attack: number): void {
  const c = '#3ddc84';
  const big = attack >= 0 && attack < 1 ? 1.25 : 1;
  neonPath(
    ctx,
    () => {
      ctx.moveTo(top.x, top.y - 5 * big);
      ctx.lineTo(top.x, top.y + 5 * big);
      ctx.moveTo(top.x - 4.5 * big, top.y);
      ctx.lineTo(top.x + 4.5 * big, top.y);
    },
    c,
    2.4,
  );
}

function robe(ctx: CanvasRenderingContext2D, shoulder: V, color: string, trim: string): void {
  gearFill(
    ctx,
    () => {
      ctx.moveTo(shoulder.x - 2, shoulder.y);
      ctx.lineTo(shoulder.x - 9, shoulder.y + 26);
      ctx.lineTo(shoulder.x + 4, shoulder.y + 24);
      ctx.closePath();
    },
    color,
    rgba(trim, 0.8),
    0.8,
  );
  // Hoa văn sáng dọc vạt áo
  ctx.strokeStyle = rgba(trim, 0.6);
  ctx.lineWidth = 0.8;
  ctx.beginPath();
  ctx.moveTo(shoulder.x - 2.5, shoulder.y + 6);
  ctx.lineTo(shoulder.x - 5, shoulder.y + 22);
  ctx.stroke();
}

function lance(ctx: CanvasRenderingContext2D, tip: (l: number) => V, dir: V, perp: V, gear: string, e: string, rim: string): void {
  const end = tip(32);
  line(ctx, tip(-10), end, gear, 2.2);
  neonFill(
    ctx,
    () => {
      ctx.moveTo(end.x + dir.x * 9, end.y + dir.y * 9);
      ctx.lineTo(end.x + perp.x * 2.5, end.y + perp.y * 2.5);
      ctx.lineTo(end.x - perp.x * 2.5, end.y - perp.y * 2.5);
    },
    e,
  );
  ctx.fillStyle = rim;
  const f = tip(24);
  ctx.beginPath();
  ctx.moveTo(f.x, f.y);
  ctx.lineTo(f.x - 8, f.y - 4);
  ctx.lineTo(f.x - 5, f.y - 2);
  ctx.lineTo(f.x - 8, f.y);
  ctx.lineTo(f.x - 2, f.y - 0.5);
  ctx.closePath();
  ctx.fill();
}

function polearm(ctx: CanvasRenderingContext2D, tip: (l: number) => V, dir: V, perp: V, kind: Weapon, gear: string, e: string): void {
  const end = tip(26);
  line(ctx, tip(-14), end, gear, 2.2);
  if (kind === 'trident') {
    // Đinh ba: thanh ngang + ba mũi phát sáng
    const a = { x: end.x + perp.x * 5, y: end.y + perp.y * 5 };
    const b = { x: end.x - perp.x * 5, y: end.y - perp.y * 5 };
    neonPath(
      ctx,
      () => {
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        for (const q of [a, end, b]) {
          ctx.moveTo(q.x, q.y);
          ctx.lineTo(q.x + dir.x * 7, q.y + dir.y * 7);
        }
      },
      e,
      1.5,
    );
    return;
  }
  neonFill(
    ctx,
    () => {
      if (kind === 'naginata') {
        ctx.moveTo(end.x, end.y);
        ctx.quadraticCurveTo(end.x + dir.x * 6 + perp.x * 4, end.y + dir.y * 6 + perp.y * 4, end.x + dir.x * 12, end.y + dir.y * 12);
        ctx.lineTo(end.x - perp.x * 2, end.y - perp.y * 2);
      } else if (kind === 'halberd') {
        ctx.moveTo(end.x + dir.x * 8, end.y + dir.y * 8);
        ctx.lineTo(end.x + perp.x * 7, end.y + perp.y * 7);
        ctx.lineTo(end.x + perp.x * 7 - dir.x * 6, end.y + perp.y * 7 - dir.y * 6);
        ctx.lineTo(end.x - perp.x * 2, end.y - perp.y * 2);
      } else {
        ctx.moveTo(end.x + dir.x * 8, end.y + dir.y * 8);
        ctx.lineTo(end.x + perp.x * 2.6, end.y + perp.y * 2.6);
        ctx.lineTo(end.x - perp.x * 2.6, end.y - perp.y * 2.6);
      }
    },
    e,
  );
}

function drawShield(
  ctx: CanvasRenderingContext2D,
  shoulder: V,
  shape: 'oval' | 'round' | 'square',
  fill: string,
  e: string,
  rim: string,
): void {
  const cx = shoulder.x + 7;
  const cy = shoulder.y + 9;
  const path = () => {
    if (shape === 'round') ctx.arc(cx, cy, 9, 0, Math.PI * 2);
    else if (shape === 'square') ctx.rect(cx - 5, cy - 10, 10, 20);
    else ctx.ellipse(cx, cy, 5, 11, 0, 0, Math.PI * 2);
  };
  gearFill(ctx, path, fill, e, 1.4);
  // Huy hiệu màu phe giữa khiên
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.moveTo(cx, cy - 4);
  ctx.lineTo(cx + 2.5, cy);
  ctx.lineTo(cx, cy + 4);
  ctx.lineTo(cx - 2.5, cy);
  ctx.closePath();
  ctx.fill();
}

function club(ctx: CanvasRenderingContext2D, from: V, to: V, color: string, e: string): void {
  line(ctx, from, to, color, 4);
  gearFill(ctx, () => ctx.arc(to.x, to.y, 5, 0, Math.PI * 2), color, e, 1);
  // Gai sáng
  for (let i = 0; i < 4; i++) {
    const r = (i / 4) * Math.PI * 2 + 0.4;
    line(
      ctx,
      { x: to.x + Math.cos(r) * 4.5, y: to.y + Math.sin(r) * 4.5 },
      { x: to.x + Math.cos(r) * 7, y: to.y + Math.sin(r) * 7 },
      e,
      1.1,
    );
  }
}

// ---------- Thú cưỡi ----------

/**
 * Vẽ thú cưỡi / xe; trả về chỗ đặt hông người cưỡi.
 * Vẽ hai lượt: lượt viền sáng màu phe (nét to, mờ) rồi lượt thân bóng đen.
 */
function drawMount(ctx: CanvasRenderingContext2D, p: StickPose, mount: Mount, e: string): V {
  const body = p.flash ? '#ffffff' : night(MOUNT_COLOR[mount], 0.72);
  if (!p.flash) faded(ctx, 0.5, () => mountShape(ctx, p, mount, p.accent, 2.6, e));
  return mountShape(ctx, p, mount, body, 0, e);
}

function mountShape(ctx: CanvasRenderingContext2D, p: StickPose, mount: Mount, color: string, extra: number, e: string): V {
  const rimPass = extra > 0;
  const low = mount === 'wolf' || mount === 'boar' || mount === 'shark' || mount === 'lizard' || mount === 'bear';
  const bulky = mount === 'boar' || mount === 'bear';
  const t = p.moving ? p.walk * 1.3 : 0;
  const lift = p.moving ? Math.abs(Math.sin(t)) * 2 : 0;
  const legLen = low ? 8 : 12;
  const bodyY = -(legLen * 2 + 3) - lift;
  const fill = () => {
    ctx.fill();
    if (rimPass) ctx.stroke();
  };
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  // Chiến xa: thùng xe hai bánh phía sau ngựa
  if (mount === 'chariot') {
    const wheel = { x: -26, y: -9 };
    const wc = rimPass ? color : GEAR_HI;
    ctx.strokeStyle = wc;
    ctx.lineWidth = 2.4 + extra;
    ctx.beginPath();
    ctx.arc(wheel.x, wheel.y, 9, 0, Math.PI * 2);
    ctx.stroke();
    if (!rimPass) {
      for (let i = 0; i < 3; i++) {
        const r = p.walk + (i * Math.PI) / 3;
        line(
          ctx,
          { x: wheel.x + Math.cos(r) * 9, y: wheel.y + Math.sin(r) * 9 },
          { x: wheel.x - Math.cos(r) * 9, y: wheel.y - Math.sin(r) * 9 },
          rgba(e, 0.8),
          1,
        );
      }
    }
    ctx.lineWidth = extra;
    ctx.fillStyle = rimPass ? color : GEAR_HI;
    ctx.strokeStyle = color;
    ctx.beginPath();
    ctx.rect(-36, -24, 20, 9);
    fill();
    if (!rimPass) neonLine(ctx, { x: -35, y: -21 }, { x: -17, y: -21 }, e, 1);
    line(ctx, { x: -16, y: -20 }, { x: -2, y: bodyY + 2 }, rimPass ? color : GEAR_HI, 1.6 + extra);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
  }

  ctx.lineWidth = (low ? 3 : 2.6) + extra;
  const legs: [number, number][] = [
    [11, 0],
    [8, Math.PI],
    [-10, Math.PI * 0.5],
    [-13, Math.PI * 1.5],
  ];
  for (const [lx, ph] of legs) {
    const sw = p.moving ? Math.sin(t + ph) * 0.6 : 0;
    const knee = along({ x: lx, y: bodyY + 4 }, sw, legLen);
    const hoof = along(knee, sw * 0.4 - (p.moving ? Math.max(0, Math.cos(t + ph)) * 0.8 : 0), legLen);
    polyline(ctx, [{ x: lx, y: bodyY + 4 }, knee, hoof]);
  }
  ctx.lineWidth = extra;
  // Thân
  ctx.beginPath();
  ctx.ellipse(0, bodyY, bulky ? 16 : mount === 'lizard' ? 19 : 17, bulky ? 9 : 7, 0, 0, Math.PI * 2);
  fill();
  if (mount === 'shark') {
    ctx.beginPath(); // vây lưng
    ctx.moveTo(-4, bodyY - 6);
    ctx.lineTo(2, bodyY - 17);
    ctx.lineTo(7, bodyY - 6);
    fill();
  }
  if (mount === 'lizard') {
    ctx.fillStyle = rimPass ? color : rgba(e, 0.9); // gai lưng phát sáng
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6 - 2, bodyY - 6);
      ctx.lineTo(i * 6, bodyY - 11);
      ctx.lineTo(i * 6 + 2, bodyY - 6);
      fill();
    }
    ctx.fillStyle = color;
  }
  if (mount === 'bonehorse' && !rimPass) {
    ctx.strokeStyle = rgba(e, 0.55); // xương sườn ánh ma
    ctx.lineWidth = 1;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 5, bodyY - 5);
      ctx.lineTo(i * 5 - 1, bodyY + 5);
      ctx.stroke();
    }
    ctx.strokeStyle = color;
  }

  // Cổ + đầu
  let eye: V;
  if (low) {
    ctx.beginPath();
    ctx.ellipse(20, bodyY - 3, 7, 5, 0.2, 0, Math.PI * 2);
    fill();
    eye = { x: 22, y: bodyY - 5 };
    if (mount === 'wolf') {
      ctx.beginPath(); // mõm + tai nhọn
      ctx.moveTo(24, bodyY - 5);
      ctx.lineTo(31, bodyY - 1);
      ctx.lineTo(24, bodyY + 1);
      ctx.moveTo(16, bodyY - 6);
      ctx.lineTo(18, bodyY - 14);
      ctx.lineTo(21, bodyY - 7);
      fill();
    } else if (mount === 'shark' || mount === 'lizard') {
      ctx.beginPath(); // mõm dài nhọn
      ctx.moveTo(24, bodyY - 5);
      ctx.lineTo(34, bodyY);
      ctx.lineTo(24, bodyY + 2);
      fill();
      eye = { x: 23, y: bodyY - 4 };
    } else if (mount === 'bear') {
      ctx.beginPath(); // tai tròn
      ctx.arc(17, bodyY - 8, 2.6, 0, Math.PI * 2);
      fill();
    } else if (!rimPass) {
      ctx.fillStyle = mix('#f5f0e1', NIGHT, 0.25); // nanh lợn rừng
      ctx.beginPath();
      ctx.moveTo(25, bodyY);
      ctx.quadraticCurveTo(30, bodyY - 1, 29, bodyY - 6);
      ctx.lineTo(26, bodyY - 2);
      ctx.fill();
      ctx.fillStyle = color;
    }
  } else {
    ctx.lineWidth = 6 + extra;
    polyline(ctx, [
      { x: 12, y: bodyY - 2 },
      { x: 19, y: bodyY - 14 },
    ]);
    ctx.lineWidth = extra;
    ctx.beginPath();
    ctx.ellipse(23, bodyY - 14, 7, 3.6, 0.45, 0, Math.PI * 2);
    fill();
    eye = { x: 24, y: bodyY - 15.5 };
    if (mount === 'elk') {
      ctx.strokeStyle = rimPass ? color : GEAR_HI;
      ctx.lineWidth = 1.6 + extra;
      ctx.beginPath();
      ctx.moveTo(19, bodyY - 17);
      ctx.lineTo(15, bodyY - 28);
      ctx.moveTo(17, bodyY - 23);
      ctx.lineTo(11, bodyY - 25);
      ctx.moveTo(21, bodyY - 17);
      ctx.lineTo(24, bodyY - 28);
      ctx.moveTo(23, bodyY - 23);
      ctx.lineTo(28, bodyY - 26);
      ctx.stroke();
    }
    if (!rimPass) {
      // Bờm màu phe
      ctx.strokeStyle = p.flash ? '#fff' : p.accent;
      ctx.lineWidth = 2.4;
      polyline(ctx, [
        { x: 11, y: bodyY - 6 },
        { x: 13.5, y: bodyY - 11 },
        { x: 16, y: bodyY - 17 },
      ]);
    }
  }
  // Đuôi
  const wave = p.moving ? Math.sin(t * 2) * 3 : 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = (mount === 'wolf' ? 3.5 : 2.2) + extra;
  ctx.beginPath();
  ctx.moveTo(-16, bodyY - 2);
  ctx.quadraticCurveTo(-24, bodyY + 2 + wave, -22, bodyY + (low ? 6 : 12));
  ctx.stroke();
  // Mắt thú phát sáng
  if (!rimPass && !p.flash) glowDot(ctx, eye, 1, e);

  if (mount === 'chariot') return { x: -26, y: -20 };
  return { x: -3, y: bodyY + 3 };
}

// ---------- Máy công thành ----------

function drawMachine(ctx: CanvasRenderingContext2D, p: StickPose, s: UnitStats, kind: Machine, e: string, time: number): void {
  const wood = p.flash ? '#ffffff' : GEAR_HI;
  const dark = p.flash ? '#ffffff' : GEAR;
  const rim = p.flash ? '#ffffff' : p.accent;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const wheels = kind === 'ram' ? [-20, 0, 20] : [-17, 17];
  for (const wx of wheels) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.arc(wx, -7, 7, 0, Math.PI * 2);
    ctx.stroke();
    const r = p.walk;
    line(ctx, { x: wx + Math.cos(r) * 7, y: -7 + Math.sin(r) * 7 }, { x: wx - Math.cos(r) * 7, y: -7 - Math.sin(r) * 7 }, rgba(e, 0.7), 1);
    glowDot(ctx, { x: wx, y: -7 }, 1, e);
  }
  const a = p.attack;

  if (kind === 'ram') {
    // Mái che + khúc gỗ lớn đầu bịt sắt, giật lùi rồi húc tới
    const swing = a < 0 ? 0 : a < 1 ? lerp(0, -10, easeOut(a)) : lerp(12, 0, a - 1);
    gearFill(
      ctx,
      () => {
        ctx.moveTo(-30, -14);
        ctx.lineTo(-22, -40);
        ctx.lineTo(18, -40);
        ctx.lineTo(26, -14);
        ctx.closePath();
      },
      wood,
      e,
      1,
    );
    ctx.fillStyle = rim;
    ctx.fillRect(-20, -38, 36, 4);
    line(ctx, { x: -26 + swing, y: -22 }, { x: 30 + swing, y: -22 }, dark, 7);
    gearFill(ctx, () => ctx.arc(32 + swing, -22, 5, 0, Math.PI * 2), wood, e, 1.2);
    glowDot(ctx, { x: 33 + swing, y: -22 }, 1.6, e);
    return;
  }

  if (kind === 'cannon') {
    const recoil = a >= 1 && a < 1.5 ? (1.5 - a) * 8 : 0;
    ctx.fillStyle = wood;
    ctx.fillRect(-22, -14, 34, 6);
    ctx.save();
    ctx.translate(-recoil, 0);
    ctx.rotate(-0.25);
    gearFill(ctx, () => ctx.rect(-14, -26, 40, 10), dark, e, 1);
    neonLine(ctx, { x: 24, y: -27 }, { x: 24, y: -15 }, e, 2);
    ctx.restore();
    if (a >= 1 && a < 1.25) glowDot(ctx, { x: 30, y: -32 }, 6, '#ffd27a');
    flag(ctx, dark, rim, time);
    return;
  }

  if (kind === 'ballista') {
    ctx.fillStyle = wood;
    ctx.fillRect(-24, -14, 46, 5);
    line(ctx, { x: -4, y: -13 }, { x: 0, y: -26 }, wood, 3);
    const pull = a < 0 ? 1 : a < 1 ? 1 : Math.max(0, 1 - (a - 1) * 3);
    // Cánh cung lớn
    neonPath(
      ctx,
      () => {
        ctx.moveTo(14, -42);
        ctx.quadraticCurveTo(22, -28, 14, -14);
      },
      wood,
      2.6,
    );
    ctx.strokeStyle = rgba(e, 0.9);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(14, -42);
    ctx.lineTo(14 - pull * 14, -28);
    ctx.lineTo(14, -14);
    ctx.stroke();
    line(ctx, { x: -14, y: -28 }, { x: 22, y: -28 }, dark, 2.4);
    if (pull > 0.5) neonLine(ctx, { x: 0, y: -28 }, { x: 28, y: -28 }, e, 1.6);
    flag(ctx, dark, rim, time);
    return;
  }

  // Máy bắn đá
  ctx.fillStyle = wood;
  ctx.fillRect(-26, -13, 52, 5);
  line(ctx, { x: -10, y: -12 }, { x: 0, y: -34 }, wood, 3);
  line(ctx, { x: 10, y: -12 }, { x: 0, y: -34 }, wood, 3);
  // Cần ném: góc tính từ phương thẳng đứng hướng lên, dương = về phía trước
  const ang = a < 0 ? -1.15 : a < 1 ? lerp(-1.15, -1.35, a) : lerp(0.9, -1.15, a - 1);
  const pivot = { x: 0, y: -32 };
  const tipP = { x: pivot.x + Math.sin(ang) * 30, y: pivot.y - Math.cos(ang) * 30 };
  const tail = { x: pivot.x - Math.sin(ang) * 9, y: pivot.y + Math.cos(ang) * 9 };
  line(ctx, tail, tipP, wood, 3.2);
  glowDot(ctx, pivot, 1.4, e);
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(tipP.x, tipP.y, 4, 0, Math.PI * 2);
  ctx.fill();
  if (a < 1) {
    // Tảng đá nạp sẵn: đá đen nứt sáng (độc thì xanh)
    const glow = s.projectile === 'poison' ? '#a3e635' : e;
    gearFill(ctx, () => ctx.arc(tipP.x, tipP.y - 3, s.damage > 65 ? 5.5 : 4.5, 0, Math.PI * 2), GEAR_HI, glow, 1.2);
  }
  flag(ctx, dark, rim, time);
}

function flag(ctx: CanvasRenderingContext2D, pole: string, accent: string, time: number): void {
  line(ctx, { x: -24, y: -13 }, { x: -24, y: -38 }, pole, 1.6);
  const wave = Math.sin(time * 5) * 1.5;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-24, -38);
  ctx.quadraticCurveTo(-19, -37 + wave, -13, -35);
  ctx.lineTo(-17, -33);
  ctx.lineTo(-13, -31 + wave * 0.5);
  ctx.lineTo(-24, -31);
  ctx.closePath();
  ctx.fill();
}

// ---------- Tháp canh ----------

function drawTower(ctx: CanvasRenderingContext2D, p: StickPose, s: UnitStats, e: string, time: number): void {
  const body = p.flash ? '#ffffff' : night(TOWER_COLOR[s.faction], 0.68);
  const rim = p.flash ? '#ffffff' : p.accent;
  const shape = () => {
    ctx.moveTo(-16, 0);
    ctx.lineTo(-12, -60);
    ctx.lineTo(-17, -60);
    ctx.lineTo(-17, -72);
    for (let x = -17; x < 17; x += 8) {
      ctx.lineTo(x, -72);
      ctx.lineTo(x + 5, -72);
      ctx.lineTo(x + 5, -66);
      ctx.lineTo(x + 8, -66);
    }
    ctx.lineTo(17, -72);
    ctx.lineTo(17, -60);
    ctx.lineTo(12, -60);
    ctx.lineTo(16, 0);
    ctx.closePath();
  };
  // Viền sáng màu phe quanh bóng tháp
  if (!p.flash) {
    faded(ctx, 0.5, () => {
      ctx.strokeStyle = rim;
      ctx.lineWidth = 3;
      ctx.lineJoin = 'round';
      ctx.beginPath();
      shape();
      ctx.stroke();
    });
  }
  ctx.fillStyle = body;
  ctx.beginPath();
  shape();
  ctx.fill();
  // Mạch đá
  ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
  for (let y = -50; y < 0; y += 12) ctx.fillRect(-14, y, 28, 1.2);
  // Khe bắn phát sáng (chớp sáng khi bắn)
  const fire = p.attack >= 0 && p.attack < 0.5;
  const flick = 0.75 + Math.sin(time * 6) * 0.15;
  faded(ctx, fire ? 1 : flick, () => {
    neonFill(ctx, () => ctx.rect(-2.5, -44, 5, 11), e);
    neonFill(ctx, () => ctx.rect(-8, -24, 3, 7), e);
    neonFill(ctx, () => ctx.rect(5, -24, 3, 7), e);
  });
  if (s.faction === 'elf') {
    ctx.fillStyle = p.flash ? '#fff' : night('#4caf50', 0.6);
    ctx.beginPath();
    ctx.arc(0, -78, 14, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 5; i++) glowDot(ctx, { x: Math.cos(i * 1.3 + time) * 8, y: -78 + Math.sin(i * 2.1) * 7 }, 0.9, e);
  }
  if (s.faction === 'undead') {
    glowDot(ctx, { x: -4, y: -54 }, 1.6, e);
    glowDot(ctx, { x: 4, y: -54 }, 1.6, e);
  }
  // Cờ phe
  line(ctx, { x: 0, y: -72 }, { x: 0, y: -94 }, GEAR, 1.8);
  const wave = Math.sin(time * 4) * 1.5;
  ctx.fillStyle = rim;
  ctx.beginPath();
  ctx.moveTo(0, -94);
  ctx.quadraticCurveTo(6, -93 + wave, 13, -90);
  ctx.lineTo(0, -85);
  ctx.closePath();
  ctx.fill();
  if (fire) glowDot(ctx, { x: 8, y: -38 }, 3, '#ffe08a');
}

function polyline(ctx: CanvasRenderingContext2D, pts: V[]): void {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
  ctx.stroke();
}

function line(ctx: CanvasRenderingContext2D, a: V, b: V, color: string, width: number): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
}
