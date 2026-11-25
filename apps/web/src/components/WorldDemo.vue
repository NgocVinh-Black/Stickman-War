<script setup lang="ts">
import { t } from '@stickman-war/i18n';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import {
  ACTIONS,
  actionPose,
  burst,
  drawArc,
  drawArrowSprite,
  drawGlove,
  drawLine,
  drawSack,
  drawFloaters,
  drawParticles,
  actionHold,
  actionLegFrame,
  armSwing,
  drawRows,
  rowPos,
  type RowOpt,
  q,
  setSnap,
  stepParticles,
  type ActionKind,
  type Floater,
  type Particle,
} from '../game/world/fx';
import { buildVillage, WORLD_H, WORLD_W, type Prop, type Rect, type Target, type Village } from '../game/world/village';

/**
 * Demo thế giới nhìn từ trên: nhân vật hệ Ánh sáng đi trong làng bằng phím mũi tên / WASD (Shift để chạy), Space / J
 * để hành động (thợ mỏ đào vàng ở mỏ, lính đánh hình nộm), hoặc nút trên màn hình cảm ứng.
 * Sprite 4 hướng do docs/art/topdown/build_topdown_sprite.py cắt từ ảnh mẫu; tư thế đánh, nhún thở dựng lúc vẽ
 * bằng cách dời từng hàng pixel (xem game/world/fx.ts).
 */
interface SpriteMeta {
  w: number;
  h: number;
  frames: number;
  rows: string[];
  footX: number;
  footY: number;
  /** Số hàng pixel của chân theo từng hướng (phần thân trên nhún khi thở). */
  legRows: Record<string, number>;
  /** Tay cầm vũ khí: điểm vai (px, py), tâm vũ khí (cx, cy), hướng vũ khí (ux, uy), góc lấy đà / ra đòn, độ đâm. */
  /** Vạt áo choàng bay theo gió (null: hướng đó không có vạt áo thò ra ngoài thân). */
  cape: Record<string, { cut: number; top: number; bottom: number }[] | null>;
  arm: Record<
    string,
    {
      px: number;
      py: number;
      cx: number;
      cy: number;
      ux: number;
      uy: number;
      aw: number;
      as: number;
      push: number;
      /** Hai đầu vũ khí (đầu cung để mắc dây) và chỗ bàn tay thứ hai nắm (kiếm 2 tay). */
      tips: [number, number][];
      hand2?: [number, number];
      /** Dời cung vào giữa người khi ngắm (nhìn trước / sau) và có vẽ sau thân không. */
      shiftX?: number;
      shiftY?: number;
      behind?: boolean;
    }
  >;
}
/** Sheet có 3 lớp × 3 hướng: đi bộ, thân không tay vũ khí, tay vũ khí (xem build_topdown_sprite.py). */
const LAYERS = 3;
type Dir = 'down' | 'up' | 'left' | 'right';
interface Sprite {
  meta: SpriteMeta;
  sheet: HTMLImageElement;
}
interface Arrow {
  x: number;
  y: number;
  /** Độ cao so với mặt đất: bay vòng cung lên rồi rơi xuống. */
  z: number;
  vx: number;
  vy: number;
  vz: number;
  dist: number;
  /** Đã cắm (xuống đất / vào tường): còn hiện bao lâu nữa, và hướng lúc cắm. */
  stuck?: number;
  dx?: number;
  dy?: number;
}
interface Ghost {
  x: number;
  y: number;
  dir: Dir;
  life: number;
}

/** Nhân vật chọn được: tên file trong public/art/topdown, khoá i18n tên, kiểu hành động */
const HEROES = [
  { id: 'light-miner', name: 'worldDemo.heroMiner', action: 'mine' },
  { id: 'light-warrior', name: 'worldDemo.heroWarrior', action: 'slash' },
  { id: 'light-archer', name: 'worldDemo.heroArcher', action: 'shoot' },
  { id: 'light-assassin', name: 'worldDemo.heroAssassin', action: 'stab' },
] as const;
type HeroId = (typeof HEROES)[number]['id'];

const SPEED = 72; // px / giây
const ARROW_Z = 26; // độ cao mũi tên lúc rời dây = ngang tầm cung lúc nâng lên ngắm
const ARROW_VH = 210; // tốc độ ngang của mũi tên (px/s)
const ARROW_G = 420; // trọng lực kéo mũi tên rơi (px/s²)
const FEET = { w: 14, h: 6 }; // hộp va chạm ở chân
const GOLD = ['#fff3a8', '#ffd34a', '#c9921e'];
const LIGHT = ['#ffffff', '#fff3a8', '#ffd34a', '#c9921e'];
const STRAW = ['#e0bc6a', '#c79a48', '#9c7434'];
const DIRS: Record<Dir, [number, number]> = { down: [0, 1], up: [0, -1], left: [-1, 0], right: [1, 0] };

// zoom = số pixel THẬT của màn hình cho 1 pixel nghệ thuật (luôn số nguyên → mọi ô vuông đều nhau, nét căng
// kể cả màn hình HiDPI / scale 125%). Canvas vẽ theo pixel thật, CSS thu lại theo devicePixelRatio.
const ZOOM_KEY = 'worldDemo.zoom';
const zoom = ref(0); // 0 = tự chọn
const autoZoom = ref(2);
const dpr = ref(1);
const VW = ref(640); // khung nhìn 1x (pixel nghệ thuật), giãn theo cửa sổ
const VH = ref(360);

const wrap = ref<HTMLDivElement>();
const canvas = ref<HTMLCanvasElement>();
const failed = ref(false);
const gold = ref(0);
const held = new Set<string>();
const sprites = new Map<HeroId, Sprite>();
const heroId = ref<HeroId>('light-miner');

let village: Village | null = null;
let raf = 0;
let last = performance.now();
let clock = 0; // giây kể từ lúc vào trang
let walkT = 0;
let shake = 0;
let moteT = 0;
let freeze = 0; // khựng hình ngắn lúc đòn trúng (hit-stop)
let sackPulse = 0; // túi vàng phồng lên khi vàng rơi vào
let gatherAt = -1e9; // lúc thợ mỏ đào ra vàng: tay kia nhặt vàng bỏ vào túi
/** Cục vàng bay từ chỗ đào vào túi sau lưng (t < 0: chờ tới lượt). */
const loot: { sx: number; sy: number; t: number }[] = [];
const LOOT_DUR = 0.55;
const cam = { x: -1, y: -1 };
const hero = { x: 0, y: 0, dir: 'down' as Dir, moving: false };
let act: { kind: ActionKind; t: number; done: number; aimVz: number } | null = null;
const particles: Particle[] = [];
const floaters: Floater[] = [];
const arrows: Arrow[] = [];
const ghosts: Ghost[] = [];

const KEYS: Record<string, Dir> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
};
const ACT_KEYS = new Set(['Space', 'KeyJ', 'Enter']);
/** Nút cảm ứng: 4 hướng + hành động */
const PAD: Record<string, string> = { up: '▲', left: '◀', down: '▼', right: '▶', act: '⚔' };
const pressed = (d: Dir) => [...held].some((k) => KEYS[k] === d || k === `pad-${d}`);
const acting = () => [...ACT_KEYS].some((k) => held.has(k)) || held.has('pad-act');
const heroAction = (): ActionKind => HEROES.find((h) => h.id === heroId.value)!.action;

function onKey(e: KeyboardEvent, down: boolean): void {
  if (KEYS[e.code] || ACT_KEYS.has(e.code) || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
    e.preventDefault();
    if (down) held.add(e.code);
    else held.delete(e.code);
  }
}
const onKeyDown = (e: KeyboardEvent) => onKey(e, true);
const onKeyUp = (e: KeyboardEvent) => onKey(e, false);
const onBlur = () => held.clear();
const pad = (k: string, down: boolean) => (down ? held.add(`pad-${k}`) : held.delete(`pad-${k}`));

const inRect = (x: number, y: number, r: Rect, pad = 0) => x > r.x - pad && x < r.x + r.w + pad && y > r.y - pad && y < r.y + r.h + pad;

function hits(x: number, y: number): boolean {
  if (!village) return false;
  const box: Rect = { x: x - FEET.w / 2, y: y - FEET.h, w: FEET.w, h: FEET.h };
  if (village.solids.some((s) => box.x < s.x + s.w && box.x + box.w > s.x && box.y < s.y + s.h && box.y + box.h > s.y)) return true;
  // Nước: thử 4 góc hộp chân
  return [
    [box.x, box.y],
    [box.x + box.w, box.y],
    [box.x, box.y + box.h],
    [box.x + box.w, box.y + box.h],
  ].some(([px, py]) => village!.water(px, py));
}

/** Đòn cận chiến trúng mục tiêu nào: thử vài điểm dọc tầm đánh trước mặt (ngang ngực). */
function meleeTarget(reach: number): Target | null {
  if (!village) return null;
  const [fx, fy] = DIRS[hero.dir];
  for (const k of [0.4, 0.7, 1]) {
    const x = hero.x + fx * reach * k;
    const y = hero.y - 10 + fy * reach * k;
    const tg = village.targets.find((tt) => inRect(x, y, tt.hit, 4));
    if (tg) return tg;
  }
  return null;
}

function strike(tg: Target, x: number, y: number, dmg: number, crit = false): void {
  tg.hitAt = clock;
  tg.hitDir = DIRS[hero.dir][0] || (x > tg.hit.x + tg.hit.w / 2 ? -1 : 1);
  shake = Math.max(shake, crit ? 3 : 2);
  freeze = crit ? 0.09 : 0.06;
  if (tg.kind === 'dummy') {
    burst(particles, x, y, 12, 10, STRAW, 70);
    floaters.push({ x, y: tg.hit.y + 4, text: crit ? `${dmg}!` : `${dmg}`, color: crit ? '#ff9b3d' : '#ffffff', t: 0 });
  } else {
    burst(particles, x, y, 10, 12, ['#ffffff', ...GOLD, '#8a9099'], 90);
  }
}

/** Mốc ra đòn thứ `i` của hành động hiện tại. */
function fire(kind: ActionKind): void {
  const [fx, fy] = DIRS[hero.dir];
  if (kind === 'shoot') {
    const vz = act?.aimVz ?? 150;
    arrows.push({ x: hero.x + fx * 12, y: hero.y + fy * 4, z: ARROW_Z, vx: fx * ARROW_VH, vy: fy * ARROW_VH, vz, dist: 0 });
    burst(particles, hero.x + fx * 12, hero.y + fy * 6, 16, 5, LIGHT, 40, 20, 0);
    return;
  }
  const reach = kind === 'mine' ? 22 : kind === 'slash' ? 28 : 22;
  const tg = meleeTarget(reach);
  const px = hero.x + fx * reach * 0.8;
  const py = hero.y + fy * reach * 0.8;
  if (!tg) {
    if (kind === 'mine') burst(particles, px, py, 0, 6, ['#8a6a44', '#b08a5a', '#6b4e30'], 40, 50);
    return;
  }
  if (kind === 'mine') {
    if (tg.kind === 'mine') {
      const n = 1 + Math.floor(Math.random() * 3);
      gold.value += n;
      strike(tg, px, py, 0);
      // Vụn vàng văng ra, rồi tay kia nhặt từng cục bỏ vào túi sau lưng
      burst(particles, px, py, 14, 6, GOLD, 50, 80, 320);
      for (let i = 0; i < n * 2; i++)
        loot.push({ sx: px + (Math.random() - 0.5) * 8, sy: py + (Math.random() - 0.5) * 4, t: -0.08 - i * 0.07 });
      gatherAt = clock;
      floaters.push({ x: px, y: tg.hit.y + 10, text: `+${n}`, color: '#ffd34a', t: 0 });
    } else strike(tg, px, py, 4 + Math.floor(Math.random() * 4));
  } else if (kind === 'slash') {
    strike(tg, px, py, 14 + Math.floor(Math.random() * 7));
  } else {
    const crit = Math.random() < 0.25;
    strike(tg, px, py, (7 + Math.floor(Math.random() * 4)) * (crit ? 2 : 1), crit);
  }
}

function update(dt: number): void {
  clock += dt;
  shake = Math.max(0, shake - dt * 14);
  stepParticles(particles, dt);
  sackPulse = Math.max(0, sackPulse - dt);
  for (let i = loot.length - 1; i >= 0; i--) {
    if ((loot[i].t += dt) >= LOOT_DUR) {
      loot.splice(i, 1);
      sackPulse = 0.22;
    }
  }
  for (let i = ghosts.length - 1; i >= 0; i--) if ((ghosts[i].life -= dt) <= 0) ghosts.splice(i, 1);
  updateArrows(dt);

  if (freeze > 0) {
    freeze -= dt;
    return;
  }
  if (!act && acting()) act = { kind: heroAction(), t: 0, done: 0, aimVz: heroAction() === 'shoot' ? aimLob() : 0 };
  if (act) {
    hero.moving = false;
    act.t += dt;
    const spec = ACTIONS[act.kind];
    const p = act.t / spec.dur;
    while (act.done < spec.hits.length && p >= spec.hits[act.done]) {
      fire(act.kind);
      act.done++;
    }
    // Sát thủ lướt tới trước khi đâm
    if (act.kind === 'stab' && p > 0.16 && p < 0.3) {
      const [fx, fy] = DIRS[hero.dir];
      const step = 170 * dt;
      if (!hits(hero.x + fx * step, hero.y + fy * step)) {
        hero.x += fx * step;
        hero.y += fy * step;
      }
      ghosts.push({ x: hero.x, y: hero.y, dir: hero.dir, life: 0.18 });
    }
    if (p >= 1) act = null;
    return;
  }

  let dx = (pressed('right') ? 1 : 0) - (pressed('left') ? 1 : 0);
  let dy = (pressed('down') ? 1 : 0) - (pressed('up') ? 1 : 0);
  hero.moving = dx !== 0 || dy !== 0;
  if (!hero.moving) {
    // Đứng yên: hạt sáng hệ Ánh sáng bay lên quanh người
    moteT -= dt;
    if (moteT <= 0) {
      moteT = 0.22 + Math.random() * 0.2;
      particles.push({
        x: hero.x + (Math.random() - 0.5) * 22,
        y: hero.y + 1,
        z: 2 + Math.random() * 20,
        vx: 0,
        vy: 0,
        vz: 10 + Math.random() * 8,
        life: 0,
        max: 0.9 + Math.random() * 0.6,
        color: Math.random() < 0.3 ? '#ffffff' : '#ffd34a',
        size: 1,
        g: 0,
      });
    }
    return;
  }
  if (dx) hero.dir = dx > 0 ? 'right' : 'left';
  else hero.dir = dy > 0 ? 'down' : 'up';
  const len = Math.hypot(dx, dy);
  const run = held.has('ShiftLeft') || held.has('ShiftRight') ? 1.7 : 1;
  dx = (dx / len) * SPEED * run * dt;
  dy = (dy / len) * SPEED * run * dt;
  // Đi từng trục để trượt dọc tường thay vì dính cứng
  if (!hits(hero.x + dx, hero.y)) hero.x += dx;
  if (!hits(hero.x, hero.y + dy)) hero.y += dy;
  walkT += dt * run;
}

/**
 * Cung thủ bắn vòng cung: tìm hình nộm / mỏ ở phía trước (cùng hàng) trong tầm, tính vận tốc bay lên để mũi tên
 * rơi trúng ngang thân mục tiêu. Không có mục tiêu thì bắn vòng cung mặc định.
 */
function aimLob(): number {
  const [fx, fy] = DIRS[hero.dir];
  let best = Infinity;
  for (const tt of village?.targets ?? []) {
    const cx = tt.hit.x + tt.hit.w / 2;
    const feet = tt.hit.y + tt.hit.h;
    const along = fx ? (cx - hero.x) * fx : (feet - hero.y) * fy;
    const across = fx ? Math.abs(feet - hero.y) : Math.abs(cx - hero.x);
    if (along > 16 && along < 330 && across < 14 && along < best) best = along;
  }
  if (best === Infinity) return 150;
  const t = (best - 12) / ARROW_VH;
  return Math.min(320, Math.max(70, (18 - ARROW_Z + (ARROW_G * t * t) / 2) / t));
}

function updateArrows(dt: number): void {
  if (!village) return;
  for (let i = arrows.length - 1; i >= 0; i--) {
    const a = arrows[i];
    if (a.stuck !== undefined) {
      if ((a.stuck -= dt) <= 0) arrows.splice(i, 1);
      continue;
    }
    a.x += a.vx * dt;
    a.y += a.vy * dt;
    a.vz -= ARROW_G * dt;
    a.z += a.vz * dt;
    a.dist += ARROW_VH * dt;
    // Vệt sáng sau đuôi tên
    if (Math.random() < 0.6)
      particles.push({ x: a.x, y: a.y, z: a.z, vx: 0, vy: 0, vz: 0, life: 0, max: 0.2, color: '#ffd34a', size: 1, g: 0 });
    const tg = village.targets.find(
      (tt) => a.x > tt.hit.x - 2 && a.x < tt.hit.x + tt.hit.w + 2 && Math.abs(a.y - (tt.hit.y + tt.hit.h)) < 10 && a.z < tt.hit.h - 2,
    );
    const stick = () => {
      const len = Math.hypot(a.vx, a.vy - a.vz) || 1;
      a.dx = a.vx / len;
      a.dy = (a.vy - a.vz) / len;
      a.stuck = 1.2;
    };
    if (tg) {
      strike(tg, a.x, a.y, 10 + Math.floor(Math.random() * 6));
      arrows.splice(i, 1);
    } else if (a.z <= 0) {
      // Cắm xuống đất
      a.z = 0;
      burst(particles, a.x, a.y, 0, 5, ['#8a6a44', '#b08a5a', '#ffd34a'], 30, 40);
      stick();
    } else if (a.z < 12 && village.solids.some((s) => inRect(a.x, a.y, s))) {
      burst(particles, a.x, a.y, a.z, 5, LIGHT, 40, 30);
      stick();
    } else if (a.dist > 600) arrows.splice(i, 1);
  }
}

function drawHeroAt(ctx: CanvasRenderingContext2D, camX: number, camY: number, hx: number, hy: number, dir: Dir, ghost = false): void {
  const sp = sprites.get(heroId.value);
  if (!sp) return;
  const { meta, sheet } = sp;
  const key = dir === 'right' ? 'left' : dir;
  const row = meta.rows.indexOf(key);
  const side = dir === 'left' || dir === 'right';
  const [fx, fy] = DIRS[dir];
  const legTop = meta.footY - meta.legRows[key];
  const capeMeta = meta.cape[key];
  const opt: RowOpt = {
    lean: 0,
    stretch: 0,
    bob: 0,
    legRows: meta.legRows[key],
    sway: 0,
    wave: 0,
    phase: clock * 3,
    // Quay lưng: áo choàng che cả thân → cả vạt dưới lay nhẹ; các hướng khác: phần vạt thò ra ngoài thân bay mạnh
    cape: capeMeta
      ? capeMeta.map((c) => ({ ...c, amp: 1 }))
      : [{ cut: 0, top: legTop - Math.round(meta.h * 0.28), bottom: legTop - 1, amp: 0.45 }],
    flap: ghost ? 0 : 2.3,
    flapPhase: clock * 5,
  };
  let frame = 0;
  let lunge = 0;
  let arm: { angle: number; push: number } | null = null;
  // Dao thứ hai của sát thủ (tay kia): đứng yên vẫn cầm, lúc đánh đâm chậm một nhịp sau dao đầu
  let armB: { angle: number; push: number } | null = heroAction() === 'stab' && !ghost ? { angle: 0, push: 0 } : null;
  if (ghost) {
    frame = 0;
  } else if (act) {
    const p = act.t / ACTIONS[act.kind].dur;
    const pose = actionPose(act.kind, p);
    lunge = pose.lunge;
    opt.stretch = pose.stretch;
    opt.lean = side ? pose.lean : 0;
    if (!side) opt.stretch += pose.lean * 0.012; // nhìn trước / sau: nghiêng thành nhún / vươn
    opt.wave = 0.5; // áo choàng giật theo đòn
    opt.phase = clock * 9;
    opt.flap = 2.4;
    opt.flapPhase = clock * 11;
    // Chân bước tấn, tay vũ khí vung quanh vai
    frame = actionLegFrame(act.kind, p);
    const a = meta.arm[key];
    arm = armSwing(act.kind, p, a.aw, a.as, a.push, act.kind === 'stab' ? 0 : undefined);
    if (act.kind === 'stab') armB = armSwing(act.kind, p, a.aw, a.as, a.push, 1);
  } else if (hero.moving) {
    frame = Math.floor(walkT * 8) % meta.frames;
    opt.wave = 0.6; // gió lùa áo choàng khi đi
    opt.phase = clock * 7;
    opt.flap = 2.8; // đi nhanh: vạt áo bay mạnh và nhanh hơn
    opt.flapPhase = clock * 10;
  } else {
    // Đứng yên: thở đều (thân trên hạ / nâng êm tới 1px), đầu lắc nhẹ, tóc và áo choàng lay theo gió
    opt.bob = (1 - Math.cos(clock * 2.4)) * 0.5;
    opt.stretch = Math.sin(clock * 2.4) * 0.008;
    opt.sway = Math.sin(clock * 1.3) * 0.9;
    opt.wave = 0.45 + 0.25 * Math.sin(clock * 0.7);
  }
  const x = q(hx - camX + fx * lunge);
  const y = q(hy - camY + fy * lunge * 0.6);
  if (!ghost) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(x - 8, y - 2, 16, 3);
    ctx.fillRect(x - 6, y + 1, 12, 1);
  }
  ctx.save();
  if (ghost) ctx.globalAlpha = 0.35;
  // Vẽ quanh điểm chân (lật gương khi quay phải). Toạ độ cục bộ: chân ở (0, 0).
  ctx.translate(x, y);
  if (dir === 'right') ctx.scale(-1, 1);
  const dx = -meta.footX;
  const rows = meta.rows.length;
  // Lúc đánh: vẽ thân không có tay vũ khí + tay vũ khí xoay quanh vai (thường đè lên thân; cung thủ quay lưng
  // giơ cung ra trước mặt nên cung nằm sau thân → vẽ trước)
  const kind = heroAction();
  /**
   * Vẽ lớp tay vũ khí xoay quanh vai theo `st`; trả về hàm đổi một điểm của lớp tay (toạ độ khung) ra toạ độ cục bộ
   * sau khi xoay / đâm / dời — để gắn bàn tay thứ hai, dây cung… đúng chỗ.
   */
  const drawWeapon = (st: { angle: number; push: number }) => {
    const a = meta.arm[key];
    const sh = rowPos(a.py, meta.footY, 0, opt);
    const p = act ? act.t / ACTIONS[act.kind].dur : 1;
    // Mức "giữ" tư thế đánh (0..1): tay vũ khí dời theo aimShift (cung vào giữa người; vũ khí nâng qua đầu khi quay lưng)
    const hold = act ? actionHold(act.kind, p) : 0;
    const pvx = dx + a.px + sh.x + (a.shiftX ?? 0) * hold;
    const pvy = sh.y + (a.shiftY ?? 0) * hold;
    const c = Math.cos(st.angle);
    const sn = Math.sin(st.angle);
    const at = (px: number, py: number) => {
      const vx = px - a.px + a.ux * st.push;
      const vy = py - a.py + a.uy * st.push;
      return { x: pvx + vx * c - vy * sn, y: pvy + vx * sn + vy * c };
    };
    ctx.save();
    ctx.translate(q(pvx), q(pvy));
    ctx.rotate(st.angle);
    ctx.translate(q(a.ux * st.push), q(a.uy * st.push));
    ctx.drawImage(sheet, 0, (row + rows * 2) * meta.h, meta.w, meta.h, -a.px, -a.py, meta.w, meta.h);
    ctx.restore();
    return { at, hold, p };
  };

  // Cung thủ: mũi tên lắp dây + dây cung + tay kéo dây (tay kia giữ cung)
  const drawBowString = (w: ReturnType<typeof drawWeapon>) => {
    if (!act || act.kind !== 'shoot') return;
    const a = meta.arm[key];
    const { at, hold, p } = w;
    const release = ACTIONS.shoot.hits[0];
    const b = at(a.cx, a.cy);
    const tA = at(a.tips[0][0], a.tips[0][1]);
    const tB = at(a.tips[1][0], a.tips[1][1]);
    const string = '#fff3a8';
    if (p > 0.06 && p < release) {
      const pull = Math.min(1, p / (release * 0.8)) * 5;
      let tail: { x: number; y: number };
      if (key === 'left') {
        // Hướng ngắm chếch lên trời theo vận tốc bay lên đã tính (ảnh gốc quay mặt sang trái)
        const vz = act.aimVz * hold;
        const al = Math.hypot(ARROW_VH, vz);
        const ax = -ARROW_VH / al;
        const ay = -vz / al;
        const tip = { x: b.x + ax * (5 - pull), y: b.y + ay * (5 - pull) };
        drawArrowSprite(ctx, tip.x, tip.y, ax, ay, 13);
        tail = { x: tip.x - ax * 12, y: tip.y - ay * 12 };
      } else if (key === 'down') {
        // Chĩa thẳng về phía người xem: chỉ thấy mũi và đuôi lông ngắn; tay kéo dây lên phía mặt
        drawArrowSprite(ctx, b.x, b.y + 2, 0, 1, 4);
        tail = { x: b.x, y: b.y - 2 - pull * 0.6 };
      } else {
        // Quay lưng: mũi tên chĩa lên ló khỏi đầu, tay kéo dây xuống phía sau gáy
        drawArrowSprite(ctx, b.x, b.y - 12 + pull, 0, -1, 12);
        tail = { x: b.x, y: b.y - 1 + pull };
      }
      drawLine(ctx, tA.x, tA.y, tail.x, tail.y, string);
      drawLine(ctx, tB.x, tB.y, tail.x, tail.y, string);
      drawGlove(ctx, tail.x, tail.y);
    } else {
      // Buông dây: dây bật về thẳng, rung nhẹ vài nhịp
      const k = p >= release ? Math.max(0, 1 - (p - release) / 0.18) : 0;
      const nx = -(tB.y - tA.y);
      const ny = tB.x - tA.x;
      const nl = Math.hypot(nx, ny) || 1;
      const v = Math.sin(clock * 90) * 1.2 * k;
      const mx = (tA.x + tB.x) / 2 + (nx / nl) * v;
      const my = (tA.y + tB.y) / 2 + (ny / nl) * v;
      drawLine(ctx, tA.x, tA.y, mx, my, string);
      drawLine(ctx, mx, my, tB.x, tB.y, string);
    }
  };

  // Tay vũ khí chính (đang đánh) + phụ kiện theo nhân vật
  const drawArm = () => {
    if (!arm) return;
    const a = meta.arm[key];
    // Nhìn ngang: nghiêng cung theo góc ngắm chếch lên
    if (act?.kind === 'shoot' && key === 'left')
      arm.angle += Math.atan2(act.aimVz, ARROW_VH) * actionHold('shoot', act.t / ACTIONS.shoot.dur);
    const w = drawWeapon(arm);
    drawBowString(w);
    // Kiếm sĩ: tay thứ hai nắm chuôi kiếm, đi theo kiếm khi vung
    if (a.hand2) {
      const h = w.at(a.hand2[0], a.hand2[1]);
      drawGlove(ctx, h.x, h.y);
    }
  };
  // Kiếm sĩ lúc không đánh: tay thứ hai vẫn nắm chuôi kiếm (cầm kiếm 2 tay)
  const drawIdleGrip = () => {
    const a = meta.arm[key];
    if (arm || !a.hand2 || ghost) return;
    const r = rowPos(a.hand2[1], meta.footY, 0, opt);
    drawGlove(ctx, dx + a.hand2[0] + r.x, r.y);
  };
  // Sát thủ: dao thứ hai ở tay kia — nhìn trước / sau lật gương sang bên kia người, nhìn ngang nằm sau thân
  const drawSecondBlade = () => {
    if (!armB) return;
    ctx.save();
    if (key === 'left') ctx.translate(5, -1);
    else ctx.scale(-1, 1);
    drawWeapon(armB);
    ctx.restore();
  };
  // Thợ mỏ: túi vàng vác sau lưng (phồng theo số vàng) + tay kia nhặt vàng bỏ vào túi
  const sackAt = SACK_AT[key];
  const sackR = kind === 'mine' && gold.value > 0 && !ghost ? Math.min(8, 2.5 + Math.sqrt(gold.value) * 0.9) * (1 + sackPulse * 1.2) : 0;
  const drawGather = () => {
    if (kind !== 'mine' || ghost) return;
    const t = (clock - gatherAt) / 0.55;
    if (t < 0 || t > 1) return;
    // Tay đưa từ chỗ đào (trước mặt, thấp) lên miệng túi theo đường vòng, cầm theo một cục vàng
    const from = key === 'left' ? { x: -14, y: -6 } : key === 'down' ? { x: -6, y: -4 } : { x: 6, y: -14 };
    const e = t * t * (3 - 2 * t);
    const x = from.x + (sackAt.x - from.x) * e;
    const y = from.y + (sackAt.y - 6 - from.y) * e - Math.sin(Math.PI * t) * 6;
    drawGlove(ctx, x, y);
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(q(x) - 1, q(y) - 3, 2, 2);
  };

  const behind = !!arm && !!meta.arm[key].behind;
  if (sackR && key !== 'up') drawSack(ctx, sackAt.x, sackAt.y, sackR);
  if (key === 'left' || key === 'up') drawSecondBlade();
  if (behind) drawArm();
  drawRows(ctx, sheet, frame * meta.w, (arm ? row + rows : row) * meta.h, meta.w, meta.h, dx, meta.footY, 0, opt);
  if (!behind) drawArm();
  if (key === 'down') drawSecondBlade();
  drawIdleGrip();
  if (sackR && key === 'up') drawSack(ctx, sackAt.x, sackAt.y, sackR);
  drawGather();
  ctx.restore();
}

/** Vị trí túi vàng sau lưng thợ mỏ (toạ độ cục bộ quanh chân; nhìn ngang +x là phía sau lưng). */
const SACK_AT: Record<string, { x: number; y: number }> = { left: { x: 9, y: -19 }, down: { x: 7, y: -27 }, up: { x: 0, y: -20 } };

/** Vàng bay từ chỗ đào theo đường vòng vào miệng túi sau lưng (túi đi theo người). */
function drawLoot(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  if (!loot.length) return;
  const key = hero.dir === 'right' ? 'left' : hero.dir;
  const s = SACK_AT[key];
  const tx = hero.x + (hero.dir === 'right' ? -s.x : s.x);
  const ty = hero.y + s.y - 6;
  for (const l of loot) {
    if (l.t < 0) continue;
    const k = l.t / LOOT_DUR;
    const e = k * k * (3 - 2 * k);
    const x = l.sx + (tx - l.sx) * e;
    const y = l.sy - 8 + (ty - l.sy + 8) * e - Math.sin(Math.PI * k) * 14;
    ctx.fillStyle = '#c9921e';
    ctx.fillRect(q(x - camX), q(y - camY) + 1, 2, 1);
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(q(x - camX), q(y - camY), 2, 1);
    if (Math.sin(clock * 30 + l.sx) > 0.6) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(q(x - camX), q(y - camY), 1, 1);
    }
  }
}

/** Vệt chém / vung cuốc / tia đâm / ánh tụ cung vẽ đè lên trên cảnh. */
function drawActionFx(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  if (!act) return;
  const p = act.t / ACTIONS[act.kind].dur;
  const [fx, fy] = DIRS[hero.dir];
  const ang = Math.atan2(fy, fx);
  const cx = hero.x - camX + fx * 6;
  const cy = hero.y - camY - 16 + fy * 4;
  const seg = (a: number, b: number) => Math.min(1, Math.max(0, (p - a) / (b - a)));
  if (act.kind === 'slash' && p > 0.4 && p < 0.78) {
    // Vệt kiếm quét từ trên đầu qua phía trước xuống dưới (cùng chiều tay vung)
    const head = seg(0.4, 0.56);
    // Nhìn ngang: quét từ trên đầu xuống trước mặt. Nhìn trước / sau: quét ngang nửa vòng trước mặt (kiểu Zelda)
    const sweep = fx ? ang - fx * 0.45 : ang;
    drawArc(ctx, cx, cy + (fy > 0 ? 6 : fy < 0 ? -4 : -2), fx ? 21 : 24, sweep, fx ? 1.5 : -1.5, head, head - seg(0.5, 0.78), LIGHT);
  } else if (act.kind === 'mine' && p > 0.4 && p < 0.66) {
    const head = seg(0.4, 0.54);
    if (fx) drawArc(ctx, cx, cy + 4, 15, ang + (fx < 0 ? -0.5 : 0.5) * Math.abs(fx), 1.1, head, head - seg(0.5, 0.66), GOLD);
    // Nhìn trước: cuốc bổ dọc bên phải người (từ trên xuống); nhìn sau: bên trái
    else drawArc(ctx, cx + (fy > 0 ? 4 : -4), cy + 2, 17, fy > 0 ? 0 : Math.PI, fy > 0 ? 1.3 : -1.3, head, head - seg(0.5, 0.66), GOLD);
  } else if (act.kind === 'stab') {
    for (const h of ACTIONS.stab.hits) {
      if (p < h - 0.02 || p > h + 0.1) continue;
      const k = (p - h + 0.02) / 0.12;
      ctx.fillStyle = k < 0.5 ? '#ffffff' : '#ffd34a';
      for (let d = 6 + k * 4; d < 24 - k * 6; d++) {
        const ox = fy ? (h > 0.5 ? 2 : -2) : 0;
        const oy = fx ? (h > 0.5 ? 2 : -2) : 0;
        ctx.fillRect(q(cx + fx * d + ox), q(cy + 2 + fy * d * 0.8 + oy), 1, 1);
      }
    }
  } else if (act.kind === 'shoot' && p > 0.3 && p < ACTIONS.shoot.hits[0]) {
    // Ánh sáng tụ ở đầu mũi tên trên dây cung
    const r = Math.round(1 + p * 4);
    const gx = q(hero.x - camX + fx * 16);
    const gy = q(hero.y - camY - ARROW_Z + fy * 8 - (fx ? 6 : 0));
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(gx - r, gy, r * 2 + 1, 1);
    ctx.fillRect(gx, gy - r, 1, r * 2 + 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(gx - 1, gy - 1, 3, 3);
  }
}

function drawArrows(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  for (const a of arrows) {
    if (a.stuck !== undefined) {
      if (a.stuck < 0.3 && Math.floor(a.stuck * 30) % 2) continue; // nhấp nháy rồi biến mất
      drawArrowSprite(ctx, a.x - camX, a.y - a.z - camY, a.dx ?? 1, a.dy ?? 0, 13);
      continue;
    }
    // Hướng mũi tên theo vận tốc trên màn hình: chúc lên lúc mới bắn, chúc xuống khi rơi
    const sx = a.vx;
    const sy = a.vy - a.vz;
    const len = Math.hypot(sx, sy) || 1;
    drawArrowSprite(ctx, a.x - camX, a.y - a.z - camY, sx / len, sy / len, 13);
  }
}

/** Vật đánh được: hình nộm lắc (dời hàng, gốc đứng yên), mỏ rung; chớp trắng ngay lúc trúng. */
function drawTargetProp(ctx: CanvasRenderingContext2D, p: Prop, tg: Target, camX: number, camY: number): boolean {
  const e = clock - tg.hitAt;
  if (e > 0.7) return false;
  const x = p.x - camX;
  const y = p.y - camY;
  const h = p.sprite.height;
  const w = p.sprite.width;
  if (tg.kind === 'dummy') {
    const wob = Math.sin(e * 26) * Math.exp(-e * 6) * 4 * tg.hitDir;
    for (const img of e < 0.07 ? [p.sprite, tg.flash] : [p.sprite])
      for (let row = 0; row < h; row++) ctx.drawImage(img, 0, row, w, 1, x + q(wob * (1 - row / h)), y + row, w, 1);
  } else {
    const s = q(Math.sin(e * 70) * Math.exp(-e * 9) * 1.6);
    ctx.drawImage(p.sprite, x + s, y);
    if (e < 0.06) {
      ctx.globalAlpha = 0.6;
      ctx.drawImage(tg.flash, x + s, y);
      ctx.globalAlpha = 1;
    }
  }
  return true;
}

function render(dt: number): void {
  const el = canvas.value;
  const out = el?.getContext('2d');
  const ctx = out;
  if (!el || !ctx || !village) return;
  const vw = VW.value;
  const vh = VH.value;
  const z = px();
  setSnap(z);
  // Camera đuổi theo nhân vật êm (không giật theo từng bước), làm tròn theo điểm ảnh thật
  const tx = Math.min(Math.max(hero.x - vw / 2, 0), WORLD_W - vw);
  const ty = Math.min(Math.max(hero.y - 20 - vh / 2, 0), WORLD_H - vh);
  if (cam.x < 0) Object.assign(cam, { x: tx, y: ty });
  const k = Math.min(1, dt * 9);
  cam.x += (tx - cam.x) * k;
  cam.y += (ty - cam.y) * k;
  const camX = q(cam.x + (shake ? (Math.random() - 0.5) * shake * 2 : 0));
  const camY = q(cam.y + (shake ? (Math.random() - 0.5) * shake * 2 : 0));
  const now = clock * 1000;
  // Vẽ thẳng lên canvas theo điểm ảnh thật: phóng z lần, toạ độ lẻ tới 1/z pixel nghệ thuật
  ctx.setTransform(z, 0, 0, z, 0, 0);
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = '#2f6b2a';
  ctx.fillRect(0, 0, vw, vh);
  ctx.drawImage(village.ground, -camX, -camY);

  // Mặt nước lấp lánh: vài vệt sáng trôi chậm
  ctx.fillStyle = 'rgba(220, 240, 255, 0.75)';
  for (let i = 0; i < 40; i++) {
    const wx = (i * 97.3 + now * 0.006 * ((i % 3) + 1)) % 160;
    const wy = (i * 53.7) % 110;
    const x = 80 + wx;
    const y = 560 + wy;
    if (village.water(x, y) && village.water(x + 4, y) && Math.sin(now * 0.003 + i) > 0.2) ctx.fillRect(q(x - camX), q(y - camY), 3, 1);
  }

  // Vật + nhân vật theo độ sâu (chân thấp hơn vẽ sau)
  let heroDrawn = false;
  const drawHero = () => {
    for (const g of ghosts) drawHeroAt(ctx, camX, camY, g.x, g.y, g.dir, true);
    drawHeroAt(ctx, camX, camY, hero.x, hero.y, hero.dir);
    heroDrawn = true;
  };
  for (const p of village.props) {
    if (!heroDrawn && p.depth > hero.y) drawHero();
    if (p.x - camX > vw || p.y - camY > vh || p.x + p.sprite.width - camX < 0 || p.y + p.sprite.height - camY < 0) continue;
    if (!(p.target && drawTargetProp(ctx, p, p.target, camX, camY))) ctx.drawImage(p.sprite, p.x - camX, p.y - camY);
    if (p.sparkle) {
      for (const [i, s] of p.sparkle.entries()) {
        if (Math.sin(now * 0.004 + i * 1.7 + p.x) < 0.75) continue;
        const sx2 = p.x - camX + s.x;
        const sy2 = p.y - camY + s.y;
        ctx.fillStyle = '#fff6c0';
        ctx.fillRect(sx2, sy2 - 1, 1, 3);
        ctx.fillRect(sx2 - 1, sy2, 3, 1);
      }
    }
  }
  if (!heroDrawn) drawHero();

  drawArrows(ctx, camX, camY);
  drawActionFx(ctx, camX, camY);
  drawLoot(ctx, camX, camY);
  drawParticles(ctx, particles, camX, camY);
  drawFloaters(ctx, floaters, camX, camY, dt);
}

function loop(now: number): void {
  raf = requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  update(dt);
  render(dt);
}

const px = () => zoom.value || autoZoom.value;

function fit(): void {
  // Tự chọn: khung nhìn cao ~400 pixel nghệ thuật; rồi giãn khung nhìn lấp đầy chỗ trống theo pixel thật
  dpr.value = window.devicePixelRatio || 1;
  const w = (wrap.value?.clientWidth ?? 1280) * dpr.value;
  const h = Math.max(240, window.innerHeight - 150) * dpr.value;
  autoZoom.value = Math.max(1, Math.min(6, Math.floor(h / 400)));
  VW.value = Math.min(WORLD_W, Math.floor(w / px()));
  VH.value = Math.min(WORLD_H, Math.floor(h / px()));
}

function setZoom(step: number): void {
  zoom.value = Math.max(1, Math.min(8, px() + step));
  try {
    localStorage.setItem(ZOOM_KEY, String(zoom.value));
  } catch {
    /* bỏ qua: chỉ là tiện ích nhớ cỡ */
  }
  fit();
}

function pickHero(id: HeroId): void {
  heroId.value = id;
  act = null;
  ghosts.length = 0;
}

onMounted(async () => {
  try {
    zoom.value = Number(localStorage.getItem(ZOOM_KEY)) || 0;
  } catch {
    zoom.value = 0;
  }
  fit();
  window.addEventListener('resize', fit);
  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  window.addEventListener('blur', onBlur);
  try {
    await Promise.all(
      HEROES.map(async ({ id }) => {
        const base = `${import.meta.env.BASE_URL}art/topdown/${id}`;
        const meta = (await (await fetch(`${base}.json`)).json()) as SpriteMeta;
        const sheet = new Image();
        sheet.src = `${base}.png`;
        await sheet.decode();
        if (sheet.width !== meta.w * meta.frames || sheet.height !== meta.h * meta.rows.length * LAYERS)
          throw new Error(`${id}.png không khớp json`);
        sprites.set(id, { meta, sheet });
      }),
    );
    village = buildVillage();
    hero.x = village.spawn.x;
    hero.y = village.spawn.y;
  } catch (err) {
    console.error(err);
    failed.value = true;
    return;
  }
  raf = requestAnimationFrame(loop);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('resize', fit);
  window.removeEventListener('keydown', onKeyDown);
  window.removeEventListener('keyup', onKeyUp);
  window.removeEventListener('blur', onBlur);
});
</script>

<template>
  <div ref="wrap" class="world-demo">
    <canvas
      ref="canvas"
      class="world-canvas"
      :width="VW * px()"
      :height="VH * px()"
      :style="{ width: `${(VW * px()) / dpr}px`, height: `${(VH * px()) / dpr}px` }"
    />
    <p v-if="failed" class="bad">⚠️ art/topdown</p>
    <div class="world-zoom">
      <span class="muted">{{ t('worldDemo.hero') }}</span>
      <button v-for="h in HEROES" :key="h.id" class="btn" :class="heroId === h.id ? 'btn-primary' : 'btn-ghost'" @click="pickHero(h.id)">
        {{ t(h.name) }}
      </button>
      <span class="world-zoom-gap" />
      <span class="world-gold">🪙 {{ t('worldDemo.gold') }}: {{ gold }}</span>
      <span class="world-zoom-gap" />
      <span class="muted">{{ t('worldDemo.zoom') }}</span>
      <button class="btn btn-ghost" :disabled="px() <= 1" @click="setZoom(-1)">−</button>
      <b>{{ px() }}×</b>
      <button class="btn btn-ghost" :disabled="px() >= 8" @click="setZoom(1)">+</button>
    </div>
    <p class="muted world-hint">{{ t('worldDemo.hint') }}</p>
    <div class="world-pad">
      <button
        v-for="d in Object.keys(PAD)"
        :key="d"
        class="world-pad-btn"
        :class="`world-pad-${d}`"
        @pointerdown.prevent="pad(d, true)"
        @pointerup="pad(d, false)"
        @pointerleave="pad(d, false)"
        @pointercancel="pad(d, false)"
      >
        {{ PAD[d] }}
      </button>
    </div>
  </div>
</template>
