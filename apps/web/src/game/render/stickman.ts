import type { FactionId, Head, Machine, Mount, Weapon } from '@stickman-war/core';
import { UNITS, type Arch, type UnitKind, type UnitStats } from '@stickman-war/core';
import { drawWall } from './walls';

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
  accent: string;
  flash: boolean;
  /** Vẽ tượng đá: giữ màu ink người gọi đưa vào, bỏ màu thân riêng của tộc. */
  stone?: boolean;
  /** Vẽ icon trên nền tối: giữ màu ink sáng người gọi đưa vào. */
  icon?: boolean;
  /** Tường thành: cổng mở bao nhiêu (0..1) và thời gian (hoạt ảnh dung nham…). */
  gate?: number;
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

const STEEL = '#d8dee8';
const WOOD = '#7a5230';
const DARK_WOOD = '#4b3220';

/** Màu gỗ / khung máy móc theo tộc. */
const MACHINE_WOOD: Partial<Record<FactionId, string>> = {
  undead: '#8a8378',
  desert: '#b08a4f',
  steam: '#4b5563',
  elf: '#5b7f3a',
};
/** Màu thân tháp canh theo tộc. */
const TOWER_COLOR: Record<FactionId, string> = {
  tribe: '#9aa7b8',
  orc: '#6b4a2b',
  elf: '#5b7f3a',
  undead: '#cfc8b4',
  samurai: '#7a3b2e',
  viking: '#7a5230',
  desert: '#c9a25b',
  steam: '#6b7280',
  dwarf: '#8b6b4a',
  tide: '#2a9d8f',
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

/**
 * Vẽ một stickman tại gốc toạ độ (chân chạm đất ở y = 0), mặt hướng +x.
 * Người gọi lo translate / scale / lật hướng.
 */
export function drawStickman(ctx: CanvasRenderingContext2D, p: StickPose): void {
  const s = UNITS[p.kind] ?? UNITS.sword;
  const a = s.arch;
  if (a === 'tower') {
    drawTower(ctx, p, s);
    return;
  }
  if (a === 'wall') {
    drawWall(ctx, s.faction, p.gate ?? 0, p.flash, p.time ?? 0);
    return;
  }
  if (a === 'catapult') {
    drawMachine(ctx, p, s, s.look.machine ?? 'catapult');
    return;
  }
  const weapon: Weapon | undefined = s.look.weapon ?? DEFAULT_WEAPON[a];
  const throwing = a === 'archer' && weapon === 'throw';
  // Kỵ binh: vẽ thú cưỡi rồi đặt người cưỡi ngồi trên lưng
  const seated = a === 'cavalry';
  if (seated) {
    const seat = drawMount(ctx, p, s.look.mount ?? 'horse');
    ctx.save();
    ctx.translate(seat.x, seat.y + (p.moving ? Math.abs(Math.sin(p.walk)) * -2 : 0));
  }
  const ink = p.flash ? '#ffffff' : p.stone || p.icon ? p.ink : (s.look.ink ?? p.ink);
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
  const width = a === 'giant' ? 4 : 3.2;

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.strokeStyle = ink;
  ctx.fillStyle = ink;
  ctx.lineWidth = width;

  // Tay sau + túi vàng / viên kim cương
  if (p.carrying && p.gem) {
    const gx = shoulder.x - 7;
    const gy = shoulder.y - 2;
    ctx.fillStyle = '#6fe7ff';
    ctx.beginPath();
    ctx.moveTo(gx, gy - 7);
    ctx.lineTo(gx + 5.5, gy - 1);
    ctx.lineTo(gx, gy + 6);
    ctx.lineTo(gx - 5.5, gy - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.beginPath();
    ctx.moveTo(gx - 1, gy - 5);
    ctx.lineTo(gx + 2, gy - 1.5);
    ctx.lineTo(gx - 1, gy - 1);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = ink;
  } else if (p.carrying) {
    ctx.fillStyle = p.silver ? '#cfd6de' : '#e8b830';
    ctx.beginPath();
    ctx.arc(shoulder.x - 7, shoulder.y - 2, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = ink;
  }
  polyline(ctx, [shoulder, elbowB, handB]);

  // Chân
  const kneeA = along(hip, legA[0], THIGH);
  const footA = along(kneeA, legA[1], SHIN);
  const kneeB = along(hip, legB[0], THIGH);
  const footB = along(kneeB, legB[1], SHIN);
  polyline(ctx, [footB, kneeB, hip, kneeA, footA]);

  // Thân + đầu
  polyline(ctx, [hip, neck]);
  ctx.beginPath();
  ctx.arc(head.x, head.y, HEAD, 0, Math.PI * 2);
  ctx.fill();

  // Áo choàng cho pháp sư / thầy thuốc
  if (a === 'mage' || a === 'healer') robe(ctx, shoulder, a === 'healer' && s.faction === 'tribe' ? '#f4f1ea' : p.accent);

  const g: Gear = { ctx, p, s, a, weapon, head, shoulder, hand: handF, handB, fore: front[1], ink };
  if (!p.stone || a === 'sword') drawHead(g, s.look.head ?? 'tribe');
  drawWeaponGear(g);

  // Tay trước (vẽ sau cùng để nằm trên vũ khí)
  ctx.strokeStyle = ink;
  ctx.lineWidth = width;
  polyline(ctx, [shoulder, elbowF, handF]);
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
};

// ---------- Đầu / mũ ----------

function drawHead(g: Gear, style: Head): void {
  const { ctx, head, p, a } = g;
  const h = head;
  switch (style) {
    case 'tribe':
      tribeHat(g);
      return;
    case 'horned': {
      ctx.fillStyle = '#8d96a3';
      ctx.beginPath();
      ctx.arc(h.x, h.y - 0.5, HEAD + 1, Math.PI, 0);
      ctx.fill();
      ctx.strokeStyle = '#f1ead8';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(h.x - 5, h.y - 3);
      ctx.quadraticCurveTo(h.x - 11, h.y - 6, h.x - 10, h.y - 13);
      ctx.moveTo(h.x + 5, h.y - 3);
      ctx.quadraticCurveTo(h.x + 11, h.y - 6, h.x + 10, h.y - 13);
      ctx.stroke();
      // Râu
      ctx.fillStyle = '#c2622d';
      ctx.beginPath();
      ctx.moveTo(h.x - 1, h.y + 2);
      ctx.lineTo(h.x + 6, h.y + 2);
      ctx.lineTo(h.x + 2, h.y + 10);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'skull': {
      ctx.fillStyle = p.flash ? '#fff' : '#ece6d4';
      ctx.beginPath();
      ctx.arc(h.x, h.y - 0.5, HEAD + 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillRect(h.x - 1, h.y + 3, 5, 3);
      ctx.fillStyle = '#1b1b20';
      ctx.beginPath();
      ctx.arc(h.x + 1, h.y - 1, 1.5, 0, Math.PI * 2);
      ctx.arc(h.x + 4.2, h.y - 1, 1.3, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'leafhood': {
      ctx.fillStyle = '#2f7d4a';
      ctx.beginPath();
      ctx.moveTo(h.x - HEAD - 1.5, h.y + 3);
      ctx.quadraticCurveTo(h.x - 3, h.y - HEAD * 2.6, h.x + HEAD + 1, h.y - 1);
      ctx.lineTo(h.x + HEAD, h.y + 1);
      ctx.closePath();
      ctx.fill();
      // Tai nhọn
      line(ctx, { x: h.x + 1, y: h.y }, { x: h.x - 3, y: h.y - 7 }, g.ink, 1.6);
      return;
    }
    case 'leafcrown': {
      ctx.fillStyle = '#4caf50';
      for (let i = -2; i <= 2; i++) {
        ctx.beginPath();
        ctx.ellipse(h.x + i * 3, h.y - HEAD - 1, 2.2, 4, i * 0.35, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case 'kabuto': {
      ctx.fillStyle = '#23262f';
      ctx.beginPath();
      ctx.arc(h.x, h.y - 0.5, HEAD + 1.3, Math.PI * 0.95, Math.PI * 2.05);
      ctx.fill();
      ctx.fillRect(h.x - HEAD - 3, h.y - 1, 3, 6); // tấm che gáy
      ctx.strokeStyle = '#e8b830';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(h.x - 4, h.y - 12);
      ctx.lineTo(h.x + 1, h.y - 6);
      ctx.lineTo(h.x + 6, h.y - 12);
      ctx.stroke();
      return;
    }
    case 'kasa': {
      ctx.fillStyle = '#c9a86a';
      ctx.beginPath();
      ctx.moveTo(h.x - 11, h.y - 1);
      ctx.lineTo(h.x + 11, h.y - 1);
      ctx.lineTo(h.x, h.y - 10);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'nemes': {
      ctx.fillStyle = '#e8b830';
      ctx.beginPath();
      ctx.moveTo(h.x - HEAD - 1, h.y + 7);
      ctx.lineTo(h.x - HEAD - 1, h.y - 3);
      ctx.quadraticCurveTo(h.x, h.y - HEAD - 4, h.x + HEAD + 1, h.y - 2);
      ctx.lineTo(h.x + 1, h.y + 1);
      ctx.lineTo(h.x - 2, h.y + 8);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#2563eb';
      ctx.lineWidth = 1.2;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(h.x - HEAD - 1, h.y - 1 + i * 3);
        ctx.lineTo(h.x - 2, h.y - 1 + i * 3);
        ctx.stroke();
      }
      return;
    }
    case 'jackal': {
      ctx.fillStyle = '#16181d';
      ctx.beginPath();
      ctx.arc(h.x, h.y, HEAD + 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath(); // mõm dài
      ctx.moveTo(h.x + 3, h.y - 2);
      ctx.lineTo(h.x + 12, h.y + 1);
      ctx.lineTo(h.x + 3, h.y + 3);
      ctx.fill();
      ctx.beginPath(); // tai
      ctx.moveTo(h.x - 3, h.y - 3);
      ctx.lineTo(h.x - 1, h.y - 14);
      ctx.lineTo(h.x + 2, h.y - 4);
      ctx.fill();
      ctx.fillStyle = '#e8b830';
      ctx.fillRect(h.x - HEAD, h.y + 3, HEAD * 2, 2);
      return;
    }
    case 'goggles': {
      ctx.fillStyle = '#1f2937';
      ctx.fillRect(h.x - 5, h.y - HEAD - 8, 10, 8); // mũ chóp cao
      ctx.fillRect(h.x - 8, h.y - HEAD - 1, 16, 2);
      ctx.fillStyle = '#b45309';
      ctx.fillRect(h.x - 5, h.y - HEAD - 3, 10, 1.6);
      ctx.fillStyle = '#fbbf24';
      ctx.beginPath();
      ctx.arc(h.x + 3, h.y - 1, 2.2, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'orc': {
      ctx.fillStyle = '#7f1d1d';
      ctx.beginPath(); // mào tóc
      ctx.moveTo(h.x - 5, h.y - 4);
      ctx.lineTo(h.x - 1, h.y - 12);
      ctx.lineTo(h.x + 3, h.y - 5);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = '#f5f0e1';
      ctx.beginPath(); // nanh
      ctx.moveTo(h.x + 2, h.y + 3);
      ctx.lineTo(h.x + 3, h.y - 1);
      ctx.lineTo(h.x + 4, h.y + 3);
      ctx.fill();
      if (a === 'miner') {
        ctx.fillStyle = '#d9a520';
        ctx.beginPath();
        ctx.arc(h.x, h.y - 1, HEAD + 0.5, Math.PI, 0);
        ctx.fill();
      }
      return;
    }
    case 'beard': {
      // Mũ sắt tròn + râu dài của người lùn
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.arc(h.x, h.y - 0.5, HEAD + 1.2, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(h.x - 1, h.y - HEAD - 4, 2, 4);
      ctx.fillStyle = '#b45309';
      ctx.beginPath();
      ctx.moveTo(h.x - 3, h.y + 1);
      ctx.lineTo(h.x + 7, h.y + 1);
      ctx.lineTo(h.x + 3, h.y + 14);
      ctx.lineTo(h.x - 1, h.y + 9);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'fin': {
      // Vây cá trên đầu + mang
      ctx.fillStyle = '#2dd4bf';
      ctx.beginPath();
      ctx.moveTo(h.x - 6, h.y - 3);
      ctx.quadraticCurveTo(h.x - 4, h.y - 15, h.x + 4, h.y - HEAD - 1);
      ctx.lineTo(h.x + 2, h.y - 3);
      ctx.closePath();
      ctx.fill();
      line(ctx, { x: h.x - 2, y: h.y + 1 }, { x: h.x - 3, y: h.y + 4 }, '#0f766e', 1.2);
      return;
    }
    case 'dragon': {
      // Sừng cong ra sau + mắt lửa
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(h.x - 2, h.y - HEAD + 1);
      ctx.quadraticCurveTo(h.x - 8, h.y - 12, h.x - 13, h.y - 9);
      ctx.moveTo(h.x + 2, h.y - HEAD);
      ctx.quadraticCurveTo(h.x - 2, h.y - 15, h.x - 8, h.y - 14);
      ctx.stroke();
      ctx.fillStyle = '#f97316';
      ctx.fillRect(h.x + 1.5, h.y - 1.5, 3, 1.5);
      return;
    }
    case 'icecrown': {
      // Vương miện băng nhọn
      ctx.fillStyle = '#bae6fd';
      ctx.beginPath();
      ctx.moveTo(h.x - HEAD, h.y - HEAD + 2);
      for (let i = 0; i <= 4; i++) {
        const x = h.x - HEAD + (i * HEAD * 2) / 4;
        ctx.lineTo(x, h.y - HEAD - (i % 2 ? 2 : 8));
      }
      ctx.lineTo(h.x + HEAD, h.y - HEAD + 2);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'oni': {
      ctx.fillStyle = '#f5f0e1';
      ctx.beginPath();
      ctx.moveTo(h.x - 4, h.y - 4);
      ctx.lineTo(h.x - 3, h.y - 12);
      ctx.lineTo(h.x - 1, h.y - 5);
      ctx.moveTo(h.x + 2, h.y - 5);
      ctx.lineTo(h.x + 4, h.y - 12);
      ctx.lineTo(h.x + 5, h.y - 4);
      ctx.fill();
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(h.x + 1, h.y - 1.5, 3.5, 1.5);
      return;
    }
  }
}

/** Mũ riêng từng loại quân của Blade Clan (bản gốc). */
function tribeHat(g: Gear): void {
  const { ctx, head, p, a, shoulder } = g;
  switch (a) {
    case 'miner':
      ctx.fillStyle = '#d9a520';
      ctx.beginPath();
      ctx.arc(head.x, head.y - 1, HEAD + 1, Math.PI, 0);
      ctx.fill();
      ctx.fillStyle = '#fff6a8';
      ctx.fillRect(head.x + 4, head.y - 4, 2.5, 2.5);
      return;
    case 'builder':
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(head.x, head.y - 1, HEAD + 1.2, Math.PI, 0);
      ctx.fill();
      ctx.fillRect(head.x - HEAD - 2, head.y - 1.5, HEAD * 2 + 5, 1.6);
      return;
    case 'sword':
    case 'giant':
    case 'banner':
      headband(ctx, head, p.accent);
      return;
    case 'archer':
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(head.x - HEAD - 1, head.y + 2);
      ctx.quadraticCurveTo(head.x - 2, head.y - HEAD * 2.4, head.x + HEAD + 1, head.y - 1);
      ctx.lineTo(head.x + HEAD, head.y + 1);
      ctx.closePath();
      ctx.fill();
      return;
    case 'spear':
      ctx.fillStyle = '#b8a05a';
      ctx.beginPath();
      ctx.arc(head.x, head.y, HEAD + 1.2, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(head.x - 6, head.y - 5);
      ctx.quadraticCurveTo(head.x - 1, head.y - 15, head.x + 5, head.y - 6);
      ctx.quadraticCurveTo(head.x - 1, head.y - 9, head.x - 6, head.y - 5);
      ctx.fill();
      return;
    case 'mage':
      ctx.fillStyle = p.accent;
      ctx.beginPath();
      ctx.moveTo(head.x - 8, head.y - 2);
      ctx.lineTo(head.x + 8, head.y - 2);
      ctx.lineTo(head.x - 4, head.y - 17);
      ctx.closePath();
      ctx.fill();
      return;
    case 'healer':
      ctx.fillStyle = '#f4f1ea';
      ctx.beginPath();
      ctx.arc(head.x, head.y - 0.5, HEAD + 1.5, Math.PI * 0.85, Math.PI * 2.15);
      ctx.fill();
      return;
    case 'ninja':
      ctx.fillStyle = '#0d0f14';
      ctx.beginPath();
      ctx.arc(head.x, head.y, HEAD + 0.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f1f4fa';
      ctx.fillRect(head.x + 0.5, head.y - 1.8, 4.5, 1.6);
      ctx.strokeStyle = p.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(head.x - HEAD, head.y - 2);
      ctx.quadraticCurveTo(head.x - HEAD - 6, head.y - 4, head.x - HEAD - 11, head.y + 1);
      ctx.stroke();
      return;
    case 'cavalry':
      ctx.fillStyle = '#9aa3ae';
      ctx.beginPath();
      ctx.arc(head.x, head.y, HEAD + 1, Math.PI * 0.9, Math.PI * 2.1);
      ctx.fill();
      ctx.fillStyle = p.accent;
      ctx.fillRect(head.x - 1.5, head.y - HEAD - 5, 3, 5);
      return;
  }
  void shoulder;
}

// ---------- Vũ khí ----------

function drawWeaponGear(g: Gear): void {
  const { ctx, p, s, a, weapon, hand, handB, shoulder, fore } = g;
  const dir = { x: Math.sin(fore), y: Math.cos(fore) };
  const tip = (len: number): V => ({ x: hand.x + dir.x * len, y: hand.y + dir.y * len });
  const perp = { x: -dir.y, y: dir.x };
  const tint = s.look.tint;

  if (a === 'banner') {
    // Cán cờ cao + lá cờ bay theo gió, vạch màu tộc
    const top = { x: hand.x + 2, y: hand.y - 38 };
    line(ctx, { x: hand.x, y: hand.y + 6 }, top, DARK_WOOD, 2);
    const wave = Math.sin((p.walk + performance.now() / 300) * 1.3) * 2;
    ctx.fillStyle = p.accent;
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.quadraticCurveTo(top.x - 9, top.y + 3 + wave, top.x - 18, top.y + 2);
    ctx.lineTo(top.x - 18, top.y + 14);
    ctx.quadraticCurveTo(top.x - 9, top.y + 15 + wave, top.x, top.y + 12);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = tint ?? '#f8f3e6';
    ctx.fillRect(top.x - 13, top.y + 5 + wave * 0.5, 7, 4);
    return;
  }

  if (a === 'cavalry') {
    lance(ctx, tip, dir, p.accent);
    return;
  }

  if (a === 'spear') {
    const shield = s.look.shield ?? (s.faction === 'tribe' ? 'oval' : 'none');
    if (weapon === 'club') club(ctx, hand, tip(18), '#6b4426');
    else polearm(ctx, tip, dir, perp, weapon ?? 'spear');
    if (shield !== 'none') drawShield(ctx, shoulder, shield, p.accent);
    return;
  }

  switch (weapon) {
    case 'trident':
      polearm(ctx, tip, dir, perp, 'trident');
      return;
    case 'pick': {
      const end = tip(14);
      line(ctx, hand, end, '#7a5230', 2.2);
      line(ctx, { x: end.x + perp.x * 6, y: end.y + perp.y * 6 }, { x: end.x - perp.x * 6, y: end.y - perp.y * 6 }, '#8d96a3', 2.4);
      return;
    }
    case 'drill': {
      const end = tip(16);
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.moveTo(hand.x + perp.x * 3, hand.y + perp.y * 3);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(hand.x - perp.x * 3, hand.y - perp.y * 3);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'hammer':
    case 'wrench': {
      const end = tip(13);
      line(ctx, hand, end, weapon === 'wrench' ? '#9ca3af' : WOOD, 2.2);
      if (weapon === 'hammer') {
        line(ctx, { x: end.x + perp.x * 4, y: end.y + perp.y * 4 }, { x: end.x - perp.x * 4, y: end.y - perp.y * 4 }, '#6b7280', 4);
      } else {
        ctx.strokeStyle = '#9ca3af';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(end.x, end.y, 3, 0, Math.PI * 1.5);
        ctx.stroke();
      }
      if (a === 'healer') orb(ctx, tip(-12), tint ?? '#fbbf24', p.attack);
      return;
    }
    case 'sword':
    case 'saber': {
      const end = tip(weapon === 'saber' ? 17 : 19);
      line(ctx, hand, end, tint ?? STEEL, weapon === 'saber' ? 1.8 : 2.4);
      const guard = tip(2);
      line(
        ctx,
        { x: guard.x + perp.x * 3.5, y: guard.y + perp.y * 3.5 },
        { x: guard.x - perp.x * 3.5, y: guard.y - perp.y * 3.5 },
        p.accent,
        2.2,
      );
      return;
    }
    case 'katana': {
      const end = tip(21);
      ctx.strokeStyle = STEEL;
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(hand.x, hand.y);
      ctx.quadraticCurveTo(tip(11).x + perp.x * 2, tip(11).y + perp.y * 2, end.x, end.y);
      ctx.stroke();
      line(ctx, hand, tip(-4), '#1f2937', 2.4);
      return;
    }
    case 'khopesh': {
      const mid = tip(10);
      const end = tip(15);
      ctx.strokeStyle = '#e8b830';
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.moveTo(hand.x, hand.y);
      ctx.lineTo(mid.x, mid.y);
      ctx.quadraticCurveTo(end.x + perp.x * 7, end.y + perp.y * 7, end.x - perp.x * 2, end.y - perp.y * 2);
      ctx.stroke();
      return;
    }
    case 'axe': {
      const end = tip(16);
      line(ctx, hand, end, WOOD, 2.2);
      ctx.fillStyle = STEEL;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.lineTo(end.x + perp.x * 7 - dir.x * 3, end.y + perp.y * 7 - dir.y * 3);
      ctx.lineTo(end.x + perp.x * 7 + dir.x * 4, end.y + perp.y * 7 + dir.y * 4);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'cleaver': {
      const end = tip(16);
      line(ctx, hand, tip(3), WOOD, 2.4);
      ctx.fillStyle = '#9ca3af';
      ctx.beginPath();
      ctx.moveTo(tip(3).x, tip(3).y);
      ctx.lineTo(end.x, end.y);
      ctx.lineTo(end.x + perp.x * 6, end.y + perp.y * 6);
      ctx.lineTo(tip(3).x + perp.x * 6, tip(3).y + perp.y * 6);
      ctx.closePath();
      ctx.fill();
      return;
    }
    case 'scythe': {
      const end = tip(20);
      line(ctx, tip(-6), end, '#3f3a35', 2);
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(end.x, end.y);
      ctx.quadraticCurveTo(
        end.x + perp.x * 10 - dir.x * 2,
        end.y + perp.y * 10 - dir.y * 2,
        end.x + perp.x * 12 + dir.x * 6,
        end.y + perp.y * 12 + dir.y * 6,
      );
      ctx.stroke();
      return;
    }
    case 'club': {
      club(ctx, hand, tip(a === 'giant' ? 22 : 16), s.look.ink === '#4b5563' ? '#6b7280' : '#6b4426');
      return;
    }
    case 'dagger': {
      line(ctx, hand, tip(12), '#e6ebf2', 2);
      return;
    }
    case 'bomb': {
      ctx.fillStyle = '#111827';
      ctx.beginPath();
      ctx.arc(hand.x + 2, hand.y - 2, 5, 0, Math.PI * 2);
      ctx.fill();
      line(ctx, { x: hand.x + 4, y: hand.y - 6 }, { x: hand.x + 7, y: hand.y - 10 }, '#a16207', 1.4);
      ctx.fillStyle = Math.sin(performance.now() / 60) > 0 ? '#fde047' : '#f97316';
      ctx.beginPath();
      ctx.arc(hand.x + 7, hand.y - 11, 1.8, 0, Math.PI * 2);
      ctx.fill();
      return;
    }
    case 'bow': {
      ctx.strokeStyle = s.faction === 'undead' ? '#d6d0bf' : '#7a5230';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(hand.x - 4, hand.y, 12, -1.15, 1.15);
      ctx.stroke();
      const top = { x: hand.x - 4 + Math.cos(-1.15) * 12, y: hand.y + Math.sin(-1.15) * 12 };
      const bot = { x: hand.x - 4 + Math.cos(1.15) * 12, y: hand.y + Math.sin(1.15) * 12 };
      const drawing = p.attack >= 0 && p.attack < 1;
      const pull = drawing ? handB : { x: bot.x - 0.5, y: hand.y };
      ctx.strokeStyle = 'rgba(230,230,230,0.8)';
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(top.x, top.y);
      ctx.lineTo(pull.x, pull.y);
      ctx.lineTo(bot.x, bot.y);
      ctx.stroke();
      if (drawing) line(ctx, handB, { x: hand.x + 6, y: hand.y }, '#c9b48a', 1.4);
      return;
    }
    case 'musket': {
      const end = tip(a === 'mage' ? 16 : 24);
      line(ctx, tip(-8), end, '#3f2a1a', 3);
      line(ctx, tip(2), end, '#4b5563', 1.8);
      if (a === 'mage') {
        // Súng phun lửa: bình nhiên liệu sau lưng
        ctx.fillStyle = '#b45309';
        ctx.fillRect(shoulder.x - 9, shoulder.y + 1, 5, 12);
      }
      if (p.attack >= 1 && p.attack < 1.3) {
        ctx.fillStyle = a === 'mage' ? '#fb923c' : '#fde68a';
        ctx.beginPath();
        ctx.arc(end.x + dir.x * 3, end.y + dir.y * 3, a === 'mage' ? 6 : 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      return;
    }
    case 'throw': {
      if (p.attack >= 1) return; // đã ném đi
      if (s.projectile === 'axe') {
        const end = tip(10);
        line(ctx, hand, end, WOOD, 2);
        ctx.fillStyle = STEEL;
        ctx.beginPath();
        ctx.moveTo(end.x, end.y);
        ctx.lineTo(end.x + perp.x * 5, end.y + perp.y * 5);
        ctx.lineTo(end.x + perp.x * 5 + dir.x * 4, end.y + perp.y * 5 + dir.y * 4);
        ctx.closePath();
        ctx.fill();
      } else {
        line(ctx, tip(-10), tip(16), '#8a6a3e', 1.8);
        line(ctx, tip(14), tip(19), STEEL, 2.2);
      }
      return;
    }
    case 'staff': {
      const top = tip(-12);
      line(ctx, top, tip(16), '#5b3b22', 2.2);
      if (a === 'healer' && s.faction === 'tribe') {
        healCross(ctx, top, p.attack);
        return;
      }
      orb(ctx, top, tint ?? (a === 'mage' ? '#ffb347' : '#3ddc84'), p.attack);
      return;
    }
  }
}

function orb(ctx: CanvasRenderingContext2D, at: V, color: string, attack: number): void {
  const glow = attack >= 0 && attack < 1 ? 4 + attack * 4 : 3.5;
  ctx.fillStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 8;
  ctx.beginPath();
  ctx.arc(at.x, at.y, glow, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
}

function healCross(ctx: CanvasRenderingContext2D, top: V, attack: number): void {
  ctx.fillStyle = '#3ddc84';
  if (attack >= 0 && attack < 1) {
    ctx.shadowColor = '#3ddc84';
    ctx.shadowBlur = 10;
  }
  ctx.fillRect(top.x - 1.5, top.y - 5, 3, 10);
  ctx.fillRect(top.x - 5, top.y - 1.5, 10, 3);
  ctx.shadowBlur = 0;
}

function robe(ctx: CanvasRenderingContext2D, shoulder: V, color: string): void {
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(shoulder.x - 2, shoulder.y);
  ctx.lineTo(shoulder.x - 9, shoulder.y + 26);
  ctx.lineTo(shoulder.x + 4, shoulder.y + 24);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 1;
}

function lance(ctx: CanvasRenderingContext2D, tip: (l: number) => V, dir: V, accent: string): void {
  const end = tip(32);
  line(ctx, tip(-10), end, WOOD, 2.2);
  ctx.fillStyle = STEEL;
  ctx.beginPath();
  ctx.moveTo(end.x + dir.x * 8, end.y + dir.y * 8);
  ctx.lineTo(end.x - dir.y * 2.5, end.y + dir.x * 2.5);
  ctx.lineTo(end.x + dir.y * 2.5, end.y - dir.x * 2.5);
  ctx.fill();
  ctx.fillStyle = accent;
  const f = tip(24);
  ctx.beginPath();
  ctx.moveTo(f.x, f.y);
  ctx.lineTo(f.x - 7, f.y - 4);
  ctx.lineTo(f.x - 2, f.y - 1);
  ctx.closePath();
  ctx.fill();
}

function polearm(ctx: CanvasRenderingContext2D, tip: (l: number) => V, dir: V, perp: V, kind: Weapon): void {
  const end = tip(26);
  line(ctx, tip(-14), end, kind === 'trident' ? '#0f766e' : WOOD, 2.2);
  if (kind === 'trident') {
    // Đinh ba: thanh ngang + ba mũi
    const a = { x: end.x + perp.x * 5, y: end.y + perp.y * 5 };
    const b = { x: end.x - perp.x * 5, y: end.y - perp.y * 5 };
    line(ctx, a, b, '#d4af37', 1.8);
    for (const q of [a, end, b]) line(ctx, q, { x: q.x + dir.x * 7, y: q.y + dir.y * 7 }, '#d4af37', 1.6);
    return;
  }
  ctx.fillStyle = STEEL;
  ctx.beginPath();
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
    ctx.moveTo(end.x + dir.x * 7, end.y + dir.y * 7);
    ctx.lineTo(end.x - dir.y * 2.5, end.y + dir.x * 2.5);
    ctx.lineTo(end.x + dir.y * 2.5, end.y - dir.x * 2.5);
  }
  ctx.closePath();
  ctx.fill();
}

function drawShield(ctx: CanvasRenderingContext2D, shoulder: V, shape: 'oval' | 'round' | 'square', accent: string): void {
  const cx = shoulder.x + 7;
  const cy = shoulder.y + 9;
  ctx.fillStyle = shape === 'square' ? '#6b7280' : shape === 'round' ? '#8a5a2b' : '#b8a05a';
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  if (shape === 'round') ctx.arc(cx, cy, 9, 0, Math.PI * 2);
  else if (shape === 'square') ctx.rect(cx - 5, cy - 10, 10, 20);
  else ctx.ellipse(cx, cy, 5, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  if (shape === 'round') {
    ctx.fillStyle = '#d1d5db';
    ctx.beginPath();
    ctx.arc(cx, cy, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}

function club(ctx: CanvasRenderingContext2D, from: V, to: V, color: string): void {
  line(ctx, from, to, color, 4);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(to.x, to.y, 5, 0, Math.PI * 2);
  ctx.fill();
}

// ---------- Thú cưỡi ----------

const MOUNT_COLOR: Record<Mount, string> = {
  horse: '#6b4a2b',
  bonehorse: '#d6d0bf',
  elk: '#8a6a43',
  wolf: '#6b7280',
  boar: '#4a3426',
  chariot: '#6b4a2b',
  bike: '#374151',
  shark: '#5b7a93',
  lizard: '#b45309',
  bear: '#e5e7eb',
};

/** Vẽ thú cưỡi / xe; trả về chỗ đặt hông người cưỡi. */
function drawMount(ctx: CanvasRenderingContext2D, p: StickPose, mount: Mount): V {
  if (mount === 'bike') return drawBike(ctx, p);
  const color = p.flash ? '#ffffff' : MOUNT_COLOR[mount];
  const low = mount === 'wolf' || mount === 'boar' || mount === 'shark' || mount === 'lizard' || mount === 'bear';
  const bulky = mount === 'boar' || mount === 'bear';
  const t = p.moving ? p.walk * 1.3 : 0;
  const lift = p.moving ? Math.abs(Math.sin(t)) * 2 : 0;
  const legLen = low ? 8 : 12;
  const bodyY = -(legLen * 2 + 3) - lift;
  ctx.lineCap = 'round';
  ctx.strokeStyle = color;
  ctx.fillStyle = color;

  // Chiến xa: thùng xe hai bánh phía sau ngựa
  if (mount === 'chariot') {
    const wheel = { x: -26, y: -9 };
    ctx.strokeStyle = '#4b3220';
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(wheel.x, wheel.y, 9, 0, Math.PI * 2);
    ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const r = p.walk + (i * Math.PI) / 3;
      line(
        ctx,
        { x: wheel.x + Math.cos(r) * 9, y: wheel.y + Math.sin(r) * 9 },
        { x: wheel.x - Math.cos(r) * 9, y: wheel.y - Math.sin(r) * 9 },
        '#4b3220',
        1.2,
      );
    }
    ctx.fillStyle = '#c9a25b';
    ctx.fillRect(-36, -24, 20, 9);
    line(ctx, { x: -16, y: -20 }, { x: -2, y: bodyY + 2 }, '#4b3220', 1.6);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
  }

  ctx.lineWidth = low ? 3 : 2.6;
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
  // Thân
  ctx.beginPath();
  ctx.ellipse(0, bodyY, bulky ? 16 : mount === 'lizard' ? 19 : 17, bulky ? 9 : 7, 0, 0, Math.PI * 2);
  ctx.fill();
  if (mount === 'shark') {
    ctx.beginPath(); // vây lưng
    ctx.moveTo(-4, bodyY - 6);
    ctx.lineTo(2, bodyY - 17);
    ctx.lineTo(7, bodyY - 6);
    ctx.fill();
  }
  if (mount === 'lizard') {
    ctx.fillStyle = '#fbbf24'; // gai lưng
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * 6 - 2, bodyY - 6);
      ctx.lineTo(i * 6, bodyY - 11);
      ctx.lineTo(i * 6 + 2, bodyY - 6);
      ctx.fill();
    }
    ctx.fillStyle = color;
  }
  if (mount === 'bonehorse') {
    ctx.strokeStyle = '#3b3b44';
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
  if (low) {
    ctx.beginPath();
    ctx.ellipse(20, bodyY - 3, 7, 5, 0.2, 0, Math.PI * 2);
    ctx.fill();
    if (mount === 'wolf') {
      ctx.beginPath(); // mõm + tai nhọn
      ctx.moveTo(24, bodyY - 5);
      ctx.lineTo(31, bodyY - 1);
      ctx.lineTo(24, bodyY + 1);
      ctx.moveTo(16, bodyY - 6);
      ctx.lineTo(18, bodyY - 14);
      ctx.lineTo(21, bodyY - 7);
      ctx.fill();
    } else if (mount === 'shark' || mount === 'lizard') {
      ctx.beginPath(); // mõm dài nhọn
      ctx.moveTo(24, bodyY - 5);
      ctx.lineTo(34, bodyY);
      ctx.lineTo(24, bodyY + 2);
      ctx.fill();
      ctx.fillStyle = mount === 'shark' ? '#f8fafc' : '#facc15';
      ctx.beginPath();
      ctx.arc(23, bodyY - 4, 1.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
    } else if (mount === 'bear') {
      ctx.beginPath(); // tai tròn
      ctx.arc(17, bodyY - 8, 2.6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#1f2937';
      ctx.beginPath(); // mũi
      ctx.arc(27, bodyY - 2, 1.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = color;
    } else {
      ctx.fillStyle = '#f5f0e1'; // nanh lợn rừng
      ctx.beginPath();
      ctx.moveTo(25, bodyY);
      ctx.quadraticCurveTo(30, bodyY - 1, 29, bodyY - 6);
      ctx.lineTo(26, bodyY - 2);
      ctx.fill();
      ctx.fillStyle = color;
    }
  } else {
    ctx.lineWidth = 6;
    polyline(ctx, [
      { x: 12, y: bodyY - 2 },
      { x: 19, y: bodyY - 14 },
    ]);
    ctx.beginPath();
    ctx.ellipse(23, bodyY - 14, 7, 3.6, 0.45, 0, Math.PI * 2);
    ctx.fill();
    if (mount === 'elk') {
      ctx.strokeStyle = '#e8dcc0';
      ctx.lineWidth = 1.6;
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
    if (mount === 'bonehorse') {
      ctx.fillStyle = '#7c3aed'; // mắt ma
      ctx.beginPath();
      ctx.arc(24, bodyY - 15, 1.3, 0, Math.PI * 2);
      ctx.fill();
    }
    // Bờm theo màu phe
    ctx.strokeStyle = p.accent;
    ctx.lineWidth = 2.2;
    polyline(ctx, [
      { x: 11, y: bodyY - 6 },
      { x: 16, y: bodyY - 17 },
    ]);
  }
  // Đuôi
  const wave = p.moving ? Math.sin(t * 2) * 3 : 0;
  ctx.strokeStyle = color;
  ctx.lineWidth = mount === 'wolf' ? 3.5 : 2.2;
  ctx.beginPath();
  ctx.moveTo(-16, bodyY - 2);
  ctx.quadraticCurveTo(-24, bodyY + 2 + wave, -22, bodyY + (low ? 6 : 12));
  ctx.stroke();

  if (mount === 'chariot') return { x: -26, y: -20 };
  return { x: -3, y: bodyY + 3 };
}

function drawBike(ctx: CanvasRenderingContext2D, p: StickPose): V {
  const frame = p.flash ? '#ffffff' : '#374151';
  for (const wx of [-15, 15]) {
    ctx.strokeStyle = '#111827';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wx, -8, 8, 0, Math.PI * 2);
    ctx.stroke();
    const r = p.walk * 2;
    line(ctx, { x: wx + Math.cos(r) * 8, y: -8 + Math.sin(r) * 8 }, { x: wx - Math.cos(r) * 8, y: -8 - Math.sin(r) * 8 }, '#6b7280', 1.2);
  }
  line(ctx, { x: -15, y: -8 }, { x: 0, y: -20 }, frame, 3);
  line(ctx, { x: 0, y: -20 }, { x: 15, y: -8 }, frame, 3);
  line(ctx, { x: 10, y: -24 }, { x: 15, y: -8 }, frame, 2.4);
  ctx.fillStyle = '#b45309'; // nồi hơi
  ctx.fillRect(-8, -24, 12, 8);
  line(ctx, { x: -6, y: -24 }, { x: -9, y: -32 }, '#4b5563', 2.4);
  if (p.moving) {
    ctx.fillStyle = 'rgba(220,220,220,0.6)';
    ctx.beginPath();
    ctx.arc(-11 - Math.sin(p.walk) * 2, -36, 3, 0, Math.PI * 2);
    ctx.fill();
  }
  return { x: -2, y: -21 };
}

// ---------- Máy công thành ----------

function drawMachine(ctx: CanvasRenderingContext2D, p: StickPose, s: UnitStats, kind: Machine): void {
  const wood = p.flash ? '#ffffff' : (MACHINE_WOOD[s.faction] ?? WOOD);
  const dark = p.flash ? '#ffffff' : DARK_WOOD;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const wheels = kind === 'ram' ? [-20, 0, 20] : [-17, 17];
  for (const wx of wheels) {
    ctx.strokeStyle = dark;
    ctx.lineWidth = 2.4;
    ctx.beginPath();
    ctx.arc(wx, -7, 7, 0, Math.PI * 2);
    ctx.stroke();
    const r = p.walk;
    line(ctx, { x: wx + Math.cos(r) * 7, y: -7 + Math.sin(r) * 7 }, { x: wx - Math.cos(r) * 7, y: -7 - Math.sin(r) * 7 }, dark, 1.4);
  }
  const a = p.attack;

  if (kind === 'ram') {
    // Mái che + khúc gỗ lớn đầu bịt sắt, giật lùi rồi húc tới
    const swing = a < 0 ? 0 : a < 1 ? lerp(0, -10, easeOut(a)) : lerp(12, 0, a - 1);
    ctx.fillStyle = wood;
    ctx.beginPath();
    ctx.moveTo(-30, -14);
    ctx.lineTo(-22, -40);
    ctx.lineTo(18, -40);
    ctx.lineTo(26, -14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = p.accent;
    ctx.fillRect(-20, -38, 36, 4);
    line(ctx, { x: -26 + swing, y: -22 }, { x: 30 + swing, y: -22 }, '#5a3a1f', 7);
    ctx.fillStyle = '#6b7280';
    ctx.beginPath();
    ctx.arc(32 + swing, -22, 5, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (kind === 'cannon') {
    const recoil = a >= 1 && a < 1.5 ? (1.5 - a) * 8 : 0;
    ctx.fillStyle = wood;
    ctx.fillRect(-22, -14, 34, 6);
    ctx.save();
    ctx.translate(-recoil, 0);
    ctx.rotate(-0.25);
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(-14, -26, 40, 10);
    ctx.fillStyle = '#e8b830';
    ctx.fillRect(22, -27, 4, 12);
    ctx.restore();
    if (a >= 1 && a < 1.25) {
      ctx.fillStyle = '#fde68a';
      ctx.beginPath();
      ctx.arc(30, -32, 7, 0, Math.PI * 2);
      ctx.fill();
    }
    flag(ctx, dark, p.accent);
    return;
  }

  if (kind === 'ballista') {
    ctx.fillStyle = wood;
    ctx.fillRect(-24, -14, 46, 5);
    line(ctx, { x: -4, y: -13 }, { x: 0, y: -26 }, wood, 3);
    const pull = a < 0 ? 1 : a < 1 ? 1 : Math.max(0, 1 - (a - 1) * 3);
    // Cánh cung lớn
    ctx.strokeStyle = '#3f2a1a';
    ctx.lineWidth = 2.6;
    ctx.beginPath();
    ctx.moveTo(14, -42);
    ctx.quadraticCurveTo(22, -28, 14, -14);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(230,230,230,0.9)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(14, -42);
    ctx.lineTo(14 - pull * 14, -28);
    ctx.lineTo(14, -14);
    ctx.stroke();
    line(ctx, { x: -14, y: -28 }, { x: 22, y: -28 }, '#3f2a1a', 2.4);
    if (pull > 0.5) line(ctx, { x: 0, y: -28 }, { x: 28, y: -28 }, STEEL, 2);
    flag(ctx, dark, p.accent);
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
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.arc(tipP.x, tipP.y, 4, 0, Math.PI * 2);
  ctx.fill();
  if (a < 1) {
    ctx.fillStyle = s.projectile === 'poison' ? '#65a30d' : '#8d8478';
    ctx.beginPath();
    ctx.arc(tipP.x, tipP.y - 3, s.damage > 65 ? 5.5 : 4.5, 0, Math.PI * 2);
    ctx.fill();
  }
  flag(ctx, dark, p.accent);
}

function flag(ctx: CanvasRenderingContext2D, pole: string, accent: string): void {
  line(ctx, { x: -24, y: -13 }, { x: -24, y: -38 }, pole, 1.6);
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.moveTo(-24, -38);
  ctx.lineTo(-14, -35);
  ctx.lineTo(-24, -31);
  ctx.closePath();
  ctx.fill();
}

// ---------- Tháp canh ----------

function drawTower(ctx: CanvasRenderingContext2D, p: StickPose, s: UnitStats): void {
  const body = p.flash ? '#ffffff' : TOWER_COLOR[s.faction];
  const shade = 'rgba(0,0,0,0.22)';
  ctx.fillStyle = body;
  ctx.beginPath();
  ctx.moveTo(-16, 0);
  ctx.lineTo(-12, -60);
  ctx.lineTo(12, -60);
  ctx.lineTo(16, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = shade;
  ctx.fillRect(-3, -42, 6, 10); // khe bắn
  for (let y = -50; y < 0; y += 12) ctx.fillRect(-14, y, 28, 1.2);
  // Sàn trên + răng cưa
  ctx.fillStyle = body;
  ctx.fillRect(-17, -66, 34, 7);
  for (let x = -17; x < 17; x += 8) ctx.fillRect(x, -72, 5, 7);
  if (s.faction === 'elf') {
    ctx.fillStyle = '#4caf50';
    ctx.beginPath();
    ctx.arc(0, -76, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  if (s.faction === 'undead') {
    ctx.fillStyle = '#1b1b20';
    ctx.beginPath();
    ctx.arc(-4, -52, 2, 0, Math.PI * 2);
    ctx.arc(4, -52, 2, 0, Math.PI * 2);
    ctx.fill();
  }
  // Cờ phe
  line(ctx, { x: 0, y: -72 }, { x: 0, y: -94 }, DARK_WOOD, 1.8);
  ctx.fillStyle = p.accent;
  ctx.beginPath();
  ctx.moveTo(0, -94);
  ctx.lineTo(12, -90);
  ctx.lineTo(0, -85);
  ctx.closePath();
  ctx.fill();
  if (p.attack >= 0 && p.attack < 0.5) {
    ctx.fillStyle = '#fde68a';
    ctx.beginPath();
    ctx.arc(8, -38, 3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function headband(ctx: CanvasRenderingContext2D, head: V, color: string): void {
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(head.x - HEAD, head.y - 1.5);
  ctx.lineTo(head.x + HEAD, head.y - 1.5);
  ctx.moveTo(head.x - HEAD, head.y - 1.5);
  ctx.lineTo(head.x - HEAD - 6, head.y + 2);
  ctx.stroke();
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
