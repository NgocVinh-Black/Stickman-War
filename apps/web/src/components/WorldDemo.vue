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
  drawArmIK,
  drawLine,
  drawSack,
  drawSideDrum,
  drawClub,
  drawFist,
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
/**
 * Dải khung vẽ sẵn (rig "anim", ghép ở <tên>-anim.png): đòn đánh vẽ thật từng khung (khổng lồ nện chuỳ) hoặc chạy
 * (walk: ngựa phi), đứng yên (idle: thở lặp). Hàng thứ i của dải ứng với hướng rows[i]; times: mốc bắt đầu từng khung
 * theo tiến độ đòn 0..1; fps: tốc độ khung khi chạy / đứng yên.
 */
interface AnimMeta {
  w: number;
  h: number;
  frames: number;
  footX: number;
  footY: number;
  y: number;
  rows: string[];
  times?: number[];
  fps?: number;
}
interface SpriteMeta {
  w: number;
  h: number;
  frames: number;
  anim?: Record<string, AnimMeta>;
  rows: string[];
  footX: number;
  footY: number;
  /** Số hàng pixel của chân theo từng hướng (phần thân trên nhún khi thở). */
  legRows: Record<string, number>;
  /** Tay cầm vũ khí: điểm vai (px, py), tâm vũ khí (cx, cy), hướng vũ khí (ux, uy), góc lấy đà / ra đòn, độ đâm. */
  /** Vạt áo choàng bay theo gió (null: hướng đó không có vạt áo thò ra ngoài thân). */
  cape: Record<
    string,
    | {
        cut: number;
        top: number;
        bottom: number;
        flag?: boolean;
        left?: boolean;
        pole?: number;
        anchor?: number;
        spanTop?: number;
        spanBottom?: number;
      }[]
    | null
  >;
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
      /** Hai đầu vũ khí (đầu cung để mắc dây) và chỗ bàn tay thứ hai nắm (kiếm / cuốc 2 tay). */
      tips: [number, number][];
      hand2?: [number, number];
      /** Chuỳ khổng lồ: lúc đánh vẽ lại cả cây liền một khối từ bàn tay tới tip (ảnh gốc bị đầu che khúc giữa). */
      club?: { tip: [number, number]; r0: number; r1: number };
      /** Khiên tách lớp riêng (khung thứ hai của hàng tay vũ khí): lúc đánh dời theo `raise` [dx, dy] — giơ lên che người. */
      shield?: { raise: [number, number] };
      /** Vai của tay cầm vũ khí (toạ độ lớp thân): có thì lúc đánh bàn tay vung theo vũ khí quanh vai, vẽ cả cánh tay. */
      shoulder1?: [number, number];
      /** Vai của tay thứ hai (toạ độ lớp thân): lúc đánh vẽ cánh tay từ đây tới hand2 (lớp thân đã bỏ bàn tay đó). */
      shoulder2?: [number, number];
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
  /** Dải khung vẽ sẵn (meta.anim), nếu có. */
  anim?: HTMLImageElement;
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
/** Cầu ánh sáng của pháp sư: bay thẳng ngang tầm ngực, nổ khi trúng mục tiêu / tường / hết tầm. */
interface Orb {
  x: number;
  y: number;
  /** Độ cao so với mặt đất: bay vòng cung lên rồi rơi xuống như mũi tên. */
  z: number;
  vx: number;
  vy: number;
  vz: number;
  dist: number;
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
  { id: 'light-spearton', name: 'worldDemo.heroSpearton', action: 'thrust' },
  { id: 'light-cavalry', name: 'worldDemo.heroCavalry', action: 'charge' },
  { id: 'light-mage', name: 'worldDemo.heroMage', action: 'cast' },
  { id: 'light-drummer', name: 'worldDemo.heroDrummer', action: 'drum' },
  { id: 'light-healer', name: 'worldDemo.heroHealer', action: 'heal' },
  { id: 'light-giant', name: 'worldDemo.heroGiant', action: 'smash' },
  { id: 'light-catapult', name: 'worldDemo.heroCatapult', action: 'launch' },
  { id: 'light-builder', name: 'worldDemo.heroBuilder', action: 'build' },
] as const;
type HeroId = (typeof HEROES)[number]['id'];

const SPEED = 72; // px / giây
const ARM_REACH = 8; // độ dài cánh tay duỗi (vai → bàn tay) lúc vung vũ khí, pixel nghệ thuật
const ARROW_Z = 26; // độ cao mũi tên lúc rời dây = ngang tầm cung lúc nâng lên ngắm
const ARROW_VH = 210; // tốc độ ngang của mũi tên (px/s)
const ARROW_G = 420; // trọng lực kéo mũi tên rơi (px/s²)
const ORB_Z = 46; // độ cao đầu gậy khi chưa biết vị trí thật (cầu tụ / phóng từ đầu gậy)
const ORB_V = 150; // tốc độ ngang của cầu ánh sáng (px/s)
const ORB_G = 420; // trọng lực kéo cầu rơi xuống (px/s²): bay vòng cung rõ
const ORB_RANGE = 280; // tầm bay tối đa
const SHOT_VH = 150; // tốc độ ngang của quả cầu máy phóng (px/s)
const SHOT_G = 300; // trọng lực kéo quả cầu rơi
const SHOT_Z = 34; // độ cao lúc rời cần
const SHOT_R = 30; // bán kính nổ khi chạm đất
const WAVE_R = 46; // bán kính sóng trống (mục tiêu trong vòng này đều trúng)
const WAVE_DUR = 0.4;
const SMASH_R = 34; // bán kính chấn động chuỳ khổng lồ nện đất
const HEAL_R = 30; // bán kính vòng hồi máu
const HEAL_DUR = 0.7;
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
const orbs: Orb[] = [];
/** Quả cầu sáng của máy phóng: bay vòng cung (z: độ cao), nổ khi chạm đất. */
const shots: { x: number; y: number; z: number; vx: number; vy: number; vz: number }[] = [];
/** Đầu gậy pháp sư (toạ độ thế giới, z = độ cao) lúc đang thi phép: cầu ánh sáng tụ và phóng ra từ đây. */
let staffTip: { x: number; y: number; z: number } | null = null;
/** Sóng âm của tay trống: vòng sáng nở ra quanh chỗ nện trống (t: giây đã qua). */
const waves: { x: number; y: number; t: number; r: number }[] = [];
/** Vòng hồi máu của tu sĩ: elip thánh quang nở ra quanh người, dấu thập sáng bay lên. */
const heals: { x: number; y: number; t: number }[] = [];
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
  if (kind === 'build') {
    // Búa thợ xây: nện trước mặt, toé tia lửa vàng và vụn gỗ
    const tg = meleeTarget(20);
    const bx = hero.x + fx * 16;
    const by = hero.y + fy * 12;
    burst(particles, bx, by, 4, 6, ['#ffffff', '#ffd34a', '#c9921e'], 70, 60, 260);
    burst(particles, bx, by, 2, 4, ['#9c7434', '#c79a48', '#6b4e30'], 40, 70, 320);
    shake = Math.max(shake, 1.2);
    if (tg) strike(tg, bx, by, 9 + Math.floor(Math.random() * 5));
    return;
  }
  if (kind === 'launch') {
    // Ngắm mục tiêu gần nhất phía trước (cùng hàng) trong tầm, tính vận tốc bay lên để rơi trúng; không có thì bắn xa vừa
    let best = 180;
    for (const tt of village?.targets ?? []) {
      const cx = tt.hit.x + tt.hit.w / 2;
      const feet = tt.hit.y + tt.hit.h;
      const along = fx ? (cx - hero.x) * fx : (feet - hero.y) * fy;
      const across = fx ? Math.abs(feet - hero.y) : Math.abs(cx - hero.x);
      if (along > 50 && along < 380 && across < 20 && (best === 180 || along < best)) best = along;
    }
    const sx = hero.x + fx * 16;
    const sy = hero.y + fy * 6;
    const t = (best - 16) / SHOT_VH;
    shots.push({ x: sx, y: sy, z: SHOT_Z, vx: fx * SHOT_VH, vy: fy * SHOT_VH, vz: (SHOT_G * t * t) / 2 / t - SHOT_Z / t });
    burst(particles, sx, sy, SHOT_Z, 8, LIGHT, 50, 40, 0);
    shake = Math.max(shake, 1.5);
    return;
  }
  if (kind === 'smash') {
    // Chuỳ nện đất trước mặt: sóng chấn động, đất đá văng, đánh mạnh mọi mục tiêu quanh chỗ nện
    const ix = hero.x + fx * 30;
    const iy = hero.y + fy * 18 + (fx ? 2 : 0);
    waves.push({ x: ix, y: iy, t: 0, r: SMASH_R });
    shake = Math.max(shake, 5);
    freeze = 0.08;
    burst(particles, ix, iy, 0, 14, ['#8a6a44', '#b08a5a', '#6b4e30'], 70, 90, 320);
    burst(particles, ix, iy, 2, 10, LIGHT, 60, 50, 120);
    for (const tg of village?.targets ?? []) {
      const cx = tg.hit.x + tg.hit.w / 2;
      const cy = tg.hit.y + tg.hit.h;
      if (Math.hypot(cx - ix, (cy - iy) * 1.6) < SMASH_R + tg.hit.w / 2) strike(tg, cx, cy - 6, 22 + Math.floor(Math.random() * 9));
    }
    return;
  }
  if (kind === 'drum') {
    // Nện trống: sóng âm toả ra, đánh nhẹ mọi mục tiêu quanh người; nốt nhạc sáng bay lên
    waves.push({ x: hero.x, y: hero.y, t: 0, r: WAVE_R });
    shake = Math.max(shake, 1.5);
    for (const tg of village?.targets ?? []) {
      const cx = tg.hit.x + tg.hit.w / 2;
      const cy = tg.hit.y + tg.hit.h;
      if (Math.hypot(cx - hero.x, (cy - hero.y) * 1.6) < WAVE_R + tg.hit.w / 2) strike(tg, cx, cy - 4, 5 + Math.floor(Math.random() * 4));
    }
    burst(particles, hero.x + fx * 6, hero.y + fy * 3, 14, 6, LIGHT, 40, 70, 0);
    return;
  }
  if (kind === 'heal') {
    // Toả thánh quang: vòng hồi máu nở quanh người, dấu thập sáng bay lên, số máu hồi hiện trên đầu
    const tip = staffTip ?? { x: hero.x, y: hero.y, z: ORB_Z };
    heals.push({ x: hero.x, y: hero.y, t: 0 });
    burst(particles, tip.x, tip.y, tip.z, 10, LIGHT, 40, 30, 0);
    floaters.push({ x: hero.x, y: hero.y - 52, text: `+${16 + Math.floor(Math.random() * 6)}`, color: '#b8ff7a', t: 0 });
    return;
  }
  if (kind === 'cast') {
    // Bay vòng cung: phóng chếch lên từ đầu gậy, rơi trúng mục tiêu gần nhất phía trước (không có thì rơi ở tầm vừa)
    const tip = staffTip ?? { x: hero.x + fx * 12, y: hero.y + fy * 4, z: ORB_Z };
    const vz = aimLob(ORB_V, tip.z, ORB_G, 12);
    orbs.push({ x: tip.x, y: tip.y, z: tip.z, vx: fx * ORB_V, vy: fy * ORB_V, vz, dist: 0 });
    burst(particles, tip.x, tip.y, tip.z, 8, LIGHT, 50, 20, 0);
    return;
  }
  if (kind === 'shoot') {
    const vz = act?.aimVz ?? 150;
    arrows.push({ x: hero.x + fx * 12, y: hero.y + fy * 4, z: ARROW_Z, vx: fx * ARROW_VH, vy: fy * ARROW_VH, vz, dist: 0 });
    burst(particles, hero.x + fx * 12, hero.y + fy * 6, 16, 5, LIGHT, 40, 20, 0);
    return;
  }
  const reach = kind === 'mine' ? 22 : kind === 'slash' ? 28 : kind === 'thrust' ? 34 : kind === 'charge' ? 36 : 22;
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
  } else if (kind === 'thrust') {
    strike(tg, px, py, 12 + Math.floor(Math.random() * 6));
  } else if (kind === 'charge') {
    strike(tg, px, py, 16 + Math.floor(Math.random() * 8));
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
  updateOrbs(dt);
  // Quả cầu máy phóng: bay vòng cung, chạm đất thì nổ sáng, đánh mọi mục tiêu trong vùng nổ
  for (let i = shots.length - 1; i >= 0; i--) {
    const s = shots[i];
    s.x += s.vx * dt;
    s.y += s.vy * dt;
    s.vz -= SHOT_G * dt;
    s.z += s.vz * dt;
    if (Math.random() < 0.7)
      particles.push({ x: s.x, y: s.y, z: s.z, vx: 0, vy: 0, vz: 0, life: 0, max: 0.3, color: '#ffd34a', size: 1, g: 0 });
    if (s.z > 0) continue;
    shots.splice(i, 1);
    waves.push({ x: s.x, y: s.y, t: 0, r: SHOT_R });
    shake = Math.max(shake, 3.5);
    burst(particles, s.x, s.y, 2, 14, LIGHT, 80, 80, 200);
    burst(particles, s.x, s.y, 0, 8, ['#8a6a44', '#b08a5a', '#6b4e30'], 60, 70, 320);
    for (const tg of village?.targets ?? []) {
      const cx = tg.hit.x + tg.hit.w / 2;
      const cy = tg.hit.y + tg.hit.h;
      if (Math.hypot(cx - s.x, (cy - s.y) * 1.6) < SHOT_R + tg.hit.w / 2) strike(tg, cx, cy - 6, 18 + Math.floor(Math.random() * 9));
    }
  }
  for (let i = waves.length - 1; i >= 0; i--) if ((waves[i].t += dt) >= WAVE_DUR) waves.splice(i, 1);
  for (let i = heals.length - 1; i >= 0; i--) if ((heals[i].t += dt) >= HEAL_DUR) heals.splice(i, 1);

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
    // Kỵ binh thúc ngựa lao tới (đà mạnh rồi chậm dần), bụi tung sau vó ngựa
    if (act.kind === 'charge' && p > 0.08 && p < 0.5) {
      const [fx, fy] = DIRS[hero.dir];
      const step = 230 * (1 - (p - 0.08) / 0.42) * dt;
      if (!hits(hero.x + fx * step, hero.y + fy * step)) {
        hero.x += fx * step;
        hero.y += fy * step;
      }
      if (Math.random() < 0.5) burst(particles, hero.x - fx * 14, hero.y - fy * 4, 0, 2, ['#8a6a44', '#b08a5a', '#c9921e'], 30, 25);
      if (Math.random() < 0.35) ghosts.push({ x: hero.x, y: hero.y, dir: hero.dir, life: 0.14 });
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
function aimLob(vh = ARROW_VH, z0 = ARROW_Z, g = ARROW_G, zHit = 18): number {
  const [fx, fy] = DIRS[hero.dir];
  let best = Infinity;
  for (const tt of village?.targets ?? []) {
    const cx = tt.hit.x + tt.hit.w / 2;
    const feet = tt.hit.y + tt.hit.h;
    const along = fx ? (cx - hero.x) * fx : (feet - hero.y) * fy;
    const across = fx ? Math.abs(feet - hero.y) : Math.abs(cx - hero.x);
    if (along > 16 && along < 330 && across < 14 && along < best) best = along;
  }
  // Vận tốc bay lên để tới độ cao zHit (ngang thân mục tiêu) đúng lúc tới nơi
  if (best === Infinity) return vh === ARROW_VH ? 150 : 140;
  const t = (best - 12) / vh;
  return Math.min(320, Math.max(70, (zHit - z0 + (g * t * t) / 2) / t));
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

function updateOrbs(dt: number): void {
  if (!village) return;
  for (let i = orbs.length - 1; i >= 0; i--) {
    const o = orbs[i];
    o.x += o.vx * dt;
    o.y += o.vy * dt;
    o.z += o.vz * dt;
    o.vz -= ORB_G * dt;
    o.dist += ORB_V * dt;
    // Vệt sáng lấp lánh bay sau cầu
    if (Math.random() < 0.8)
      particles.push({
        x: o.x + (Math.random() - 0.5) * 4,
        y: o.y,
        z: o.z + (Math.random() - 0.5) * 4,
        vx: 0,
        vy: 0,
        vz: 6,
        life: 0,
        max: 0.3,
        color: Math.random() < 0.4 ? '#ffffff' : '#ffd34a',
        size: 1,
        g: 0,
      });
    // Trúng khi cầu ở ngang thân mục tiêu (đang rơi xuống tới tầm người)
    const tg = o.z < 34 ? village.targets.find((tt) => inRect(o.x, o.y - 6, tt.hit, 3)) : undefined;
    const pop = (n: number) => {
      burst(particles, o.x, o.y, Math.max(2, o.z), n, LIGHT, 80, 40, 60);
      orbs.splice(i, 1);
    };
    if (tg) {
      strike(tg, o.x, o.y, 14 + Math.floor(Math.random() * 6));
      pop(16);
    } else if (o.z <= 0) {
      // Rơi chạm đất: nổ toé sáng, rung nhẹ
      shake = Math.max(shake, 1);
      pop(12);
    } else if (o.z < 20 && village.solids.some((sd) => inRect(o.x, o.y, sd))) pop(10);
    else if (o.dist > ORB_RANGE) pop(6);
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
    // Lá cờ (khúc flag) tính riêng: hướng chỉ có cờ mà không có vạt áo thò ra vẫn được lay vạt dưới như thường
    cape: [
      ...(capeMeta ?? []).filter((c) => c.flag).map((c) => ({ ...c, amp: 1 })),
      ...(capeMeta?.some((c) => !c.flag)
        ? capeMeta.filter((c) => !c.flag).map((c) => ({ ...c, amp: 1 }))
        : [{ cut: 0, top: legTop - Math.round(meta.h * 0.28), bottom: legTop - 1, amp: 0.45 }]),
    ],
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
  // Dải khung vẽ sẵn: đòn đánh (theo mốc tiến độ) hoặc chạy (walk, lặp theo fps) cho hướng này, nếu có
  let animDraw: { a: AnimMeta; f: number; r: number } | null = null;
  if (sp.anim && meta.anim) {
    // Đánh: dải của đòn đó; chạy: walk; đứng yên: idle (thở lặp theo đồng hồ)
    const aa = act && !ghost ? meta.anim[act.kind] : hero.moving || ghost ? meta.anim.walk : meta.anim.idle;
    const r = aa ? aa.rows.indexOf(key) : -1;
    if (aa && r >= 0) {
      let f = 0;
      if (act && !ghost && aa.times) {
        const p = act.t / ACTIONS[act.kind].dur;
        while (f + 1 < aa.frames && p >= aa.times[f + 1]) f++;
      } else if (!ghost) f = Math.floor((hero.moving ? walkT : clock) * (aa.fps ?? 10)) % aa.frames;
      animDraw = { a: aa, f, r };
      lunge = 0; // khung vẽ sẵn đã có chuyển động
    }
  }
  const x = q(hx - camX + fx * lunge);
  const y = q(hy - camY + fy * lunge * 0.6);
  if (!ghost) {
    // Bóng dưới chân, rộng theo cỡ nhân vật (kỵ binh cưỡi ngựa bóng to gấp đôi)
    const sw = Math.round(meta.w * 0.19);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
    ctx.fillRect(x - sw, y - 2, sw * 2, 3);
    ctx.fillRect(x - sw + 2, y + 1, sw * 2 - 4, 1);
  }
  ctx.save();
  if (ghost) ctx.globalAlpha = 0.35;
  // Vẽ quanh điểm chân (lật gương khi quay phải). Toạ độ cục bộ: chân ở (0, 0).
  ctx.translate(x, y);
  if (dir === 'right') ctx.scale(-1, 1);
  if (animDraw && sp.anim) {
    const { a, f, r } = animDraw;
    ctx.drawImage(sp.anim, f * a.w, a.y + r * a.h, a.w, a.h, -a.footX, -a.footY, a.w, a.h);
    ctx.restore();
    return;
  }
  const dx = -meta.footX;
  const rows = meta.rows.length;
  // Lúc đánh: vẽ thân không có tay vũ khí + tay vũ khí xoay quanh vai (thường đè lên thân; cung thủ quay lưng
  // giơ cung ra trước mặt nên cung nằm sau thân → vẽ trước)
  const kind = heroAction();
  /**
   * Vẽ lớp tay vũ khí xoay quanh vai theo `st`; trả về hàm đổi một điểm của lớp tay (toạ độ khung) ra toạ độ cục bộ
   * sau khi xoay / đâm / dời — để gắn bàn tay thứ hai, dây cung… đúng chỗ.
   */
  const weaponPose = (st: { angle: number; push: number }) => {
    const a = meta.arm[key];
    const p = act ? act.t / ACTIONS[act.kind].dur : 1;
    // Mức "giữ" tư thế đánh (0..1): tay vũ khí dời theo aimShift (cung vào giữa người; vũ khí nâng qua đầu khi quay lưng)
    const hold = act ? actionHold(act.kind, p) : 0;
    const c = Math.cos(st.angle);
    const sn = Math.sin(st.angle);
    // Bàn tay cầm vũ khí (điểm xoay của vũ khí)
    const hr = rowPos(a.py, meta.footY, 0, opt);
    let pvx = dx + a.px + hr.x + (a.shiftX ?? 0) * hold;
    let pvy = hr.y + (a.shiftY ?? 0) * hold;
    // Có vai: lúc đánh bàn tay rời chỗ vác, duỗi ra theo hướng vũ khí, cách vai một cánh tay — giơ cuốc / kiếm lên thì
    // tay giơ lên theo, bổ xuống thì tay hạ theo
    const shoulder = a.shoulder1 ? bodyPoint(a.shoulder1) : null;
    if (a.shoulder1 && shoulder) {
      // Tay duỗi khi vung: ít nhất bằng tay buông ở hông (bàn tay cầm vũ khí trong sprite có thể nằm sát vai)
      const len = Math.max(ARM_REACH, Math.hypot(a.px - a.shoulder1[0], a.py - a.shoulder1[1]));
      const ex = shoulder.x + (a.ux * c - a.uy * sn) * len;
      const ey = shoulder.y + (a.ux * sn + a.uy * c) * len;
      pvx += (ex - pvx) * hold;
      pvy += (ey - pvy) * hold;
    }
    const at = (px: number, py: number) => {
      const vx = px - a.px + a.ux * st.push;
      const vy = py - a.py + a.uy * st.push;
      return { x: pvx + vx * c - vy * sn, y: pvy + vx * sn + vy * c };
    };
    return { at, hold, p, pvx, pvy, shoulder };
  };
  const drawWeapon = (st: { angle: number; push: number }) => {
    const a = meta.arm[key];
    const w = weaponPose(st);
    const { pvx, pvy } = w;
    // Cánh tay cầm vũ khí: vai → bàn tay (bàn tay nằm trong lớp vũ khí, vẽ đè lên đầu cánh tay)
    drawSecondHand('arm');
    if (w.shoulder) drawArmIK(ctx, w.shoulder.x, w.shoulder.y, pvx, pvy);
    if (a.club) {
      // Khổng lồ: chuỳ liền một khối từ nắm tay, xoay theo đòn; nắm tay vẽ đè lên chuôi
      const bx = a.club.tip[0] - a.px;
      const by = a.club.tip[1] - a.py;
      const L = Math.hypot(bx, by);
      const c = Math.cos(st.angle);
      const sn = Math.sin(st.angle);
      drawClub(ctx, pvx, pvy, (bx * c - by * sn) / L, (bx * sn + by * c) / L, L, a.club.r0, a.club.r1);
      drawFist(ctx, pvx, pvy);
      return w;
    }
    ctx.save();
    ctx.translate(q(pvx), q(pvy));
    ctx.rotate(st.angle);
    ctx.translate(q(a.ux * st.push), q(a.uy * st.push));
    ctx.drawImage(sheet, 0, (row + rows * 2) * meta.h, meta.w, meta.h, -a.px, -a.py, meta.w, meta.h);
    ctx.restore();
    return w;
  };
  /** Điểm trên lớp thân (toạ độ khung) → toạ độ cục bộ, theo thân đang nghiêng / nhún. */
  function bodyPoint(pt: [number, number]): { x: number; y: number } {
    const r = rowPos(pt[1], meta.footY, 0, opt);
    return { x: dx + pt[0] + r.x, y: r.y };
  }
  /**
   * Tay thứ hai (kiếm / cuốc cầm 2 tay): vai bên kia → chỗ nắm trên cán; thợ mỏ vừa đào ra vàng thì tay này rời cán
   * đi nhặt vàng (drawGather vẽ bàn tay). Cánh tay (`arm`) vẽ trước tay cầm vũ khí, bàn tay (`hand`) vẽ đè lên cán.
   */
  const drawSecondHand = (part: 'arm' | 'hand') => {
    const a = meta.arm[key];
    if (!arm || !a.hand2 || !a.shoulder2) return;
    const h = weaponPose(arm).at(a.hand2[0], a.hand2[1]);
    const g = gatherPos();
    if (part === 'arm') {
      const s2 = bodyPoint(a.shoulder2);
      const end = g ?? h;
      drawArmIK(ctx, s2.x, s2.y, end.x, end.y);
    } else if (!g) drawGlove(ctx, h.x, h.y);
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
    // Pháp sư: nhớ vị trí đầu gậy (đỉnh lớp vũ khí, lùi xuống giữa quả cầu trên gậy) để tụ / phóng phép đúng chỗ
    if (!ghost && (act?.kind === 'cast' || act?.kind === 'heal')) {
      const t = w.at(a.tips[0][0], a.tips[0][1] + 5);
      staffTip = { x: hx + fx * lunge + (dir === 'right' ? -t.x : t.x), y: hy + fy * lunge * 0.6, z: -t.y };
    }
    drawBowString(w);
    // Cầm 2 tay (kiếm sĩ, thợ mỏ): tay thứ hai nắm chuôi kiếm / cán cuốc, đi theo vũ khí khi vung
    if (a.shoulder2) drawSecondHand('hand');
    else if (a.hand2) {
      const h = w.at(a.hand2[0], a.hand2[1]);
      drawGlove(ctx, h.x, h.y);
    }
  };
  // Kiếm sĩ lúc không đánh: tay thứ hai vẫn nắm chuôi kiếm (cầm kiếm 2 tay); thợ mỏ lúc nghỉ vác cuốc 1 tay
  const drawIdleGrip = () => {
    const a = meta.arm[key];
    if (arm || !a.hand2 || ghost || kind === 'mine') return;
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
  /** Chỗ bàn tay nhặt vàng của thợ mỏ lúc này (null: không nhặt). */
  function gatherPos(): { x: number; y: number } | null {
    if (kind !== 'mine' || ghost) return null;
    const t = (clock - gatherAt) / 0.55;
    if (t < 0 || t > 1) return null;
    // Tay đưa từ chỗ đào (trước mặt, thấp) lên miệng túi theo đường vòng, cầm theo một cục vàng
    const from = key === 'left' ? { x: -14, y: -6 } : key === 'down' ? { x: -6, y: -4 } : { x: 6, y: -14 };
    const e = t * t * (3 - 2 * t);
    return {
      x: from.x + (sackAt.x - from.x) * e,
      y: from.y + (sackAt.y - 6 - from.y) * e - Math.sin(Math.PI * t) * 6,
    };
  }
  const drawGather = () => {
    const g = gatherPos();
    if (!g) return;
    const { x, y } = g;
    drawGlove(ctx, x, y);
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(q(x) - 1, q(y) - 3, 2, 2);
  };

  // Giáo binh: lúc đánh giơ khiên lên che người (khiên đi theo thân đang nghiêng / nhún), giáo đâm ra phía trên khiên
  const drawShield = () => {
    const a = meta.arm[key];
    if (!arm || !a.shield || ghost) return;
    const hold = act ? actionHold(act.kind, act.t / ACTIONS[act.kind].dur) : 0;
    const r = rowPos(a.py, meta.footY, 0, opt);
    const x = q(dx + r.x + a.shield.raise[0] * hold);
    const y = q(r.y - a.py + a.shield.raise[1] * hold);
    ctx.drawImage(sheet, meta.w, (row + rows * 2) * meta.h, meta.w, meta.h, x, y, meta.w, meta.h);
  };
  // Tay trống nhìn ngang: ảnh gốc bị thân che mất trống nên vẽ trống đeo hông, đi theo thân; mặt trống loé khi dùi nện
  const drawDrum = () => {
    if (kind !== 'drum' || key !== 'left') return;
    const c = bodyPoint(DRUM_AT);
    const p = act ? act.t / ACTIONS.drum.dur : -1;
    const hit = p >= 0 ? Math.max(0, 1 - Math.abs(p - ACTIONS.drum.hits[0]) / 0.12) : 0;
    drawSideDrum(ctx, c.x + (hit > 0.5 ? 1 : 0), c.y, hit);
  };

  const behind = !!arm && !!meta.arm[key].behind;
  if (sackR && key !== 'up') drawSack(ctx, sackAt.x, sackAt.y, sackR);
  if (key === 'left' || key === 'up') drawSecondBlade();
  if (behind) drawArm();
  drawRows(ctx, sheet, frame * meta.w, (arm ? row + rows : row) * meta.h, meta.w, meta.h, dx, meta.footY, 0, opt);
  drawShield();
  drawDrum();
  if (!behind) drawArm();
  if (key === 'down') drawSecondBlade();
  drawIdleGrip();
  if (sackR && key === 'up') drawSack(ctx, sackAt.x, sackAt.y, sackR);
  drawGather();
  ctx.restore();
}

/** Tâm trống đeo hông của tay trống khi nhìn ngang (toạ độ khung sprite light-drummer, trước bụng ngang hông). */
const DRUM_AT: [number, number] = [14, 57];

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
  } else if ((act.kind === 'mine' || act.kind === 'build') && p > 0.4 && p < 0.66) {
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
  } else if (act.kind === 'thrust' || act.kind === 'charge') {
    // Giáo đâm: tia sáng thẳng phóng dài theo mũi giáo rồi tắt dần từ gốc
    const h = ACTIONS[act.kind].hits[0];
    if (p > h - 0.06 && p < h + 0.16) {
      const k = (p - h + 0.06) / 0.22;
      for (let d = 8 + k * 14; d < 14 + Math.min(1, k * 3) * 22; d++) {
        ctx.fillStyle = d > 30 - k * 6 ? '#ffffff' : '#ffd34a';
        ctx.fillRect(q(cx + fx * d), q(cy + (fx ? 0 : 2) + fy * d * 0.8), 1, 1);
      }
    }
  } else if ((act.kind === 'cast' || act.kind === 'heal') && p > 0.12 && p < ACTIONS[act.kind].hits[0]) {
    // Tụ sáng trước mặt: các hạt sáng hút vào một điểm, điểm sáng lớn dần tới lúc phóng
    const k = (p - 0.12) / (ACTIONS[act.kind].hits[0] - 0.12);
    // Tụ ở đầu gậy (vị trí thật lúc vẽ nhân vật), không thì trước mặt
    const tip = staffTip ?? { x: hero.x + fx * 12, y: hero.y + fy * 4, z: ORB_Z };
    const gx = tip.x - camX;
    const gy = tip.y - tip.z - camY;
    for (let i = 0; i < 6; i++) {
      const a = clock * 6 + (i * Math.PI) / 3;
      const d = 12 * (1 - k);
      ctx.fillStyle = i % 2 ? '#ffffff' : '#ffd34a';
      ctx.fillRect(q(gx + Math.cos(a) * d), q(gy + Math.sin(a) * d * 0.7), 1, 1);
    }
    const r = Math.round(k * 3);
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(q(gx) - r, q(gy) - r, r * 2 + 1, r * 2 + 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(q(gx) - 1, q(gy) - 1, 3, 3);
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

/** Sóng trống: vòng elip (mặt đất nhìn nghiêng) nở rộng và mờ dần, viền trắng ở mép trước. */
function drawWaves(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  for (const w of waves) {
    const k = w.t / WAVE_DUR;
    const r = 6 + (w.r - 6) * (1 - (1 - k) * (1 - k));
    const n = Math.ceil(r * 2.2);
    ctx.globalAlpha = 1 - k;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillStyle = Math.sin(a) > 0.3 ? '#ffffff' : i % 3 ? '#ffd34a' : '#fff3a8';
      ctx.fillRect(q(w.x - camX + Math.cos(a) * r), q(w.y - camY - 2 + Math.sin(a) * r * 0.45), 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}

/** Vòng hồi máu: elip thánh quang nở quanh chân rồi mờ dần, các dấu thập sáng trên vòng bay dần lên. */
function drawHeals(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  for (const h of heals) {
    const k = h.t / HEAL_DUR;
    const r = 8 + (HEAL_R - 8) * (1 - (1 - k) * (1 - k));
    const n = Math.ceil(r * 2.2);
    ctx.globalAlpha = 1 - k * k;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.fillStyle = i % 4 ? '#fff3a8' : '#ffffff';
      ctx.fillRect(q(h.x - camX + Math.cos(a) * r), q(h.y - camY - 1 + Math.sin(a) * r * 0.45), 1, 1);
    }
    // 6 dấu thập sáng trên vòng, bay lên theo thời gian
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 + 0.4;
      const x = q(h.x - camX + Math.cos(a) * r * 0.8);
      const y = q(h.y - camY - 1 + Math.sin(a) * r * 0.36 - k * (18 + (i % 3) * 6));
      ctx.fillStyle = '#ffd34a';
      ctx.fillRect(x - 1, y, 3, 1);
      ctx.fillRect(x, y - 1, 1, 3);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(x, y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
}

/** Cầu ánh sáng: lõi trắng, vành vàng, quầng mờ nhấp nháy; bóng nhỏ dưới đất. */
/** Quả cầu máy phóng: cầu vàng sáng có viền, bóng dưới đất nhỏ dần theo độ cao. */
function drawShots(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  for (const s of shots) {
    const x = q(s.x - camX);
    const gy = q(s.y - camY);
    const y = q(s.y - s.z - camY);
    const sw = Math.max(2, 5 - Math.round(s.z / 20));
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.fillRect(x - sw, gy - 1, sw * 2 + 1, 2);
    ctx.fillStyle = '#120c06';
    ctx.fillRect(x - 3, y - 4, 7, 9);
    ctx.fillRect(x - 4, y - 3, 9, 7);
    ctx.fillStyle = '#c9921e';
    ctx.fillRect(x - 2, y - 3, 5, 7);
    ctx.fillRect(x - 3, y - 2, 7, 5);
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(x - 2, y - 2, 4, 4);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, y - 2, 2, 2);
  }
}

function drawOrbs(ctx: CanvasRenderingContext2D, camX: number, camY: number): void {
  for (const o of orbs) {
    const x = q(o.x - camX);
    const y = q(o.y - camY);
    const z = q(o.y - o.z - camY);
    const r = Math.sin(clock * 30 + o.dist) > 0 ? 4 : 3;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.22)';
    ctx.fillRect(x - 2, y - 1, 5, 2);
    ctx.fillStyle = 'rgba(255, 243, 168, 0.35)';
    ctx.fillRect(x - r - 1, z - r + 1, r * 2 + 3, r * 2 - 1);
    ctx.fillRect(x - r + 1, z - r - 1, r * 2 - 1, r * 2 + 3);
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(x - 2, z - 1, 5, 3);
    ctx.fillRect(x - 1, z - 2, 3, 5);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 1, z - 1, 3, 3);
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
  drawOrbs(ctx, camX, camY);
  drawShots(ctx, camX, camY);
  drawWaves(ctx, camX, camY);
  drawHeals(ctx, camX, camY);
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
        let anim: HTMLImageElement | undefined;
        if (meta.anim) {
          anim = new Image();
          anim.src = `${base}-anim.png`;
          await anim.decode();
        }
        sprites.set(id, { meta, sheet, anim });
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
