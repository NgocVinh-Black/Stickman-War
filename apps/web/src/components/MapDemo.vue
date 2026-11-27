<script setup lang="ts">
import {
  LEVELS,
  ARCH_ORDER,
  EnemyAI,
  UNITS,
  World,
  WORLD_WIDTH,
  statueX,
  type Unit,
  type UnitKind,
  type Projectile,
} from '@stickman-war/core';
import { t } from '@stickman-war/i18n';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';

/**
 * Demo bản đồ nhìn từ trên (#/map-demo): chạy đúng mô phỏng trận của packages/core (máy đấu máy, tượng không vỡ),
 * vẽ lên nền bản đồ Quang / Phong dựng từ ảnh mẫu (docs/art/demo). Tạm dùng sprite lính hệ Quang cho cả hai phe,
 * phân biệt phe bằng vòng dưới chân và thanh máu. Toạ độ x thế giới = x ảnh nền (rộng WORLD_WIDTH).
 */
const MAP_H = 1000; // chiều cao ảnh nền
const LANE_Y0 = 440; // chân quân ở lane 0 (mép trên đường đánh 400..700)
const LANE_Y1 = 670; // chân quân ở lane 1
const K = 2; // phóng sprite lính
const TEAM = ['#46aaff', '#f04646'];

interface Anim {
  w: number;
  h: number;
  frames: number;
  footX: number;
  footY: number;
  y: number;
  rows: string[];
}
interface Meta {
  w: number;
  h: number;
  frames: number;
  footX: number;
  footY: number;
  anim?: Record<string, Anim>;
}
interface Sheet {
  meta: Meta;
  img: HTMLImageElement;
  anim?: HTMLImageElement;
}
/** Khung quân (arch) -> sprite trong public/art/topdown/light. */
const SPRITE: Record<string, string> = {
  miner: 'miner-v1',
  sword: 'warrior',
  archer: 'archer',
  ninja: 'assassin',
  spear: 'spearton',
  cavalry: 'cavalry',
  healer: 'healer',
  banner: 'drummer',
  mage: 'mage',
  catapult: 'catapult',
  giant: 'giant',
  builder: 'builder',
};

const civ = ref<'light' | 'wind'>('light');
const speed = ref(1);
/** Mức thu phóng: phần của chiều cao khung (1 = map vừa khít chiều cao), 0 = thấy cả bề ngang map. */
const zoom = ref(0.75);
const ZOOMS = [1, 0.75, 0.6, 0];
const follow = ref(true);
const loading = ref(true);
const failed = ref(false);
const canvas = ref<HTMLCanvasElement | null>(null);
const gold = ref<[number, number]>([0, 0]);

const base = import.meta.env.BASE_URL;
const sheets = new Map<string, Sheet>();
const maps = new Map<string, { bg: HTMLImageElement; tower: HTMLImageElement; wall: HTMLImageElement }>();
const img = (src: string) =>
  new Promise<HTMLImageElement>((ok, bad) => {
    const i = new Image();
    i.onload = () => ok(i);
    i.onerror = bad;
    i.src = src;
  });

async function load(): Promise<void> {
  const jobs = Object.values(SPRITE).map(async (name) => {
    const url = `${base}art/topdown/light/${name}`;
    const meta = (await (await fetch(`${url}.json`)).json()) as Meta;
    sheets.set(name, { meta, img: await img(`${url}.png`), anim: meta.anim ? await img(`${url}-anim.png`) : undefined });
  });
  for (const c of ['light', 'wind']) {
    jobs.push(
      (async () => {
        const u = `${base}art/topdown/maps/${c}`;
        maps.set(c, { bg: await img(`${u}.webp`), tower: await img(`${u}-tower.png`), wall: await img(`${u}-wall.png`) });
      })(),
    );
  }
  await Promise.all(jobs);
}

// ---------- trận ----------
let world: World;
let ais: EnemyAI[];
function newMatch(): void {
  const setup = () => ({
    faction: 'light' as const,
    gold: 1500,
    statueHp: 999999,
    incomeMult: 1.5,
    unlocked: ARCH_ORDER,
    start: ['miner', 'miner', 'miner', 'miner', 'sword', 'sword', 'archer', 'spear'] as UnitKind[],
  });
  world = new World([setup(), setup()]);
  const lv = LEVELS[6];
  const wall = { at: 25, dist: 980 };
  ais = [
    new EnemyAI({ ...lv.ai, forceAttackAt: 70, wall, edge: 1.15 }, 0),
    new EnemyAI({ ...lv.ai, forceAttackAt: 85, wall, edge: 1.15 }, 1),
  ];
}

// ---------- camera ----------
let camX = 0; // x thế giới ở mép trái màn hình
let scale = 1;
let offY = 0; // map thấp hơn khung thì căn giữa theo chiều dọc
const view = () => (canvas.value ? canvas.value.width / scale : 1000);
function clampCam(): void {
  camX = view() >= WORLD_WIDTH ? (WORLD_WIDTH - view()) / 2 : Math.max(0, Math.min(WORLD_WIDTH - view(), camX));
}
/** Chỗ camera nhìn: giữa hai mũi quân nếu đã gần nhau (đang / sắp giao tranh), không thì mũi quân phe trái. */
function front(): number {
  const fighter = (u: Unit) => !u.dying && !u.inside && !['miner', 'tower', 'wall', 'builder'].includes(UNITS[u.kind].arch);
  let lead0 = -Infinity;
  let lead1 = Infinity;
  for (const u of world.units) {
    if (!fighter(u)) continue;
    if (u.team === 0) lead0 = Math.max(lead0, u.x);
    else lead1 = Math.min(lead1, u.x);
  }
  if (lead0 === -Infinity) lead0 = statueX(0) + 400;
  if (lead1 === Infinity) lead1 = statueX(1) - 400;
  return lead1 - lead0 < view() * 0.9 ? (lead0 + lead1) / 2 : lead0;
}
let drag: { x: number; cam: number } | null = null;
function down(e: PointerEvent): void {
  drag = { x: e.clientX, cam: camX };
  follow.value = false;
}
function move(e: PointerEvent): void {
  if (!drag || !canvas.value) return;
  const r = canvas.value.width / canvas.value.clientWidth;
  camX = drag.cam - ((e.clientX - drag.x) * r) / scale;
  clampCam();
}
const up = () => (drag = null);
function wheel(e: WheelEvent): void {
  follow.value = false;
  camX += (e.deltaY + e.deltaX) / scale;
  clampCam();
}
function key(e: KeyboardEvent): void {
  if (e.key === 'ArrowLeft' || e.key === 'a') camX -= 120 / scale;
  else if (e.key === 'ArrowRight' || e.key === 'd') camX += 120 / scale;
  else return;
  follow.value = false;
  clampCam();
}

// ---------- vẽ ----------
const footY = (lane: number) => LANE_Y0 + lane * (LANE_Y1 - LANE_Y0);
function drawUnit(ctx: CanvasRenderingContext2D, u: Unit, now: number): void {
  const s = UNITS[u.kind];
  if (u.inside) return;
  const y = footY(u.lane);
  const m = maps.get(civ.value)!;
  ctx.save();
  if (u.dying) ctx.globalAlpha = Math.max(0, 1 - u.deadT / 2.5);
  else if (u.hidden) ctx.globalAlpha = 0.35;
  // Vòng phe dưới chân
  const big = s.arch === 'cavalry' || s.arch === 'catapult' || s.arch === 'giant';
  ctx.strokeStyle = TEAM[u.team];
  ctx.fillStyle = 'rgba(0,0,0,0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(u.x, y, big ? 34 : 20, big ? 11 : 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  let top: number;
  if (s.wall) {
    const k = 330 / m.wall.height;
    const w = m.wall.width * k;
    ctx.drawImage(m.wall, u.x - w / 2, 410 + 300 - 330 + 20, w, 330);
    top = 380;
  } else if (s.arch === 'tower') {
    const w = m.tower.width;
    ctx.drawImage(m.tower, u.x - w / 2, y - m.tower.height + 6);
    top = y - m.tower.height;
  } else {
    const sh = sheets.get(SPRITE[s.arch] ?? 'warrior')!;
    const meta = sh.meta;
    let src: HTMLImageElement = sh.img;
    let fw = meta.w;
    let fh = meta.h;
    let fx = meta.footX;
    let fy = meta.footY;
    let sy = 2 * meta.h; // hàng nhìn ngang (quay trái) của lớp đi bộ
    let f = u.moving ? Math.floor(now * 8 + u.id) % meta.frames : 0;
    const pick = (name: string, k: number) => {
      const a = meta.anim?.[name];
      if (!a || !sh.anim) return false;
      src = sh.anim;
      fw = a.w;
      fh = a.h;
      fx = a.footX;
      fy = a.footY;
      sy = a.y + a.rows.indexOf('left') * a.h;
      f = Math.min(a.frames - 1, Math.floor(k * a.frames));
      return true;
    };
    let lunge = 0;
    if (u.attackT >= 0) {
      const k = Math.min(0.999, u.attackT / (s.windup + 0.25));
      if (!pick('slash', k) && !pick('smash', k)) lunge = Math.sin(k * Math.PI) * 6;
    } else if (u.mining) pick('mine', (now * 1.2 + u.id * 0.37) % 1);
    else if (u.moving && s.arch === 'cavalry') pick('walk', (now * 1.6 + u.id * 0.3) % 1);
    const dx = u.facing * lunge;
    ctx.save();
    ctx.translate(u.x + dx, y);
    if (u.facing === 1) ctx.scale(-1, 1); // sprite gốc quay trái
    ctx.drawImage(src, f * fw, sy, fw, fh, -fx * K, -fy * K, fw * K, fh * K);
    if (u.hitFlash > 0) {
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha *= 0.35;
      ctx.drawImage(src, f * fw, sy, fw, fh, -fx * K, -fy * K, fw * K, fh * K);
    }
    ctx.restore();
    top = y - fy * K;
  }
  // Thanh máu
  if (!u.dying && u.hp < u.maxHp) {
    const w = 36;
    ctx.fillStyle = 'rgba(30,22,14,0.85)';
    ctx.fillRect(u.x - w / 2 - 2, top - 12, w + 4, 8);
    ctx.fillStyle = TEAM[u.team];
    ctx.fillRect(u.x - w / 2, top - 10, w * Math.max(0, u.hp / u.maxHp), 4);
  }
  ctx.restore();
}
function drawProjectile(ctx: CanvasRenderingContext2D, p: Projectile): void {
  const k = Math.min(1, p.t / p.duration);
  const x = p.x0 + (p.x1 - p.x0) * k;
  const h = p.h0 + (-28 - p.h0) * k - p.arc * 4 * k * (1 - k); // âm = trên mặt đất (như renderer cạnh bên)
  const y = footY(p.lane) + h * 0.9;
  const arrow = p.kind === 'arrow' || p.kind === 'bolt' || p.kind === 'bullet' || p.kind === 'axe';
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.fillRect(x - 3, footY(p.lane) - 1, 6, 3);
  if (arrow) {
    const dir = Math.sign(p.x1 - p.x0) || 1;
    ctx.fillStyle = '#6e4a28';
    ctx.fillRect(x - dir * 14, y - 1, 14 * dir, 3);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x, y - 2, 3 * dir, 5);
  } else {
    const r = p.kind === 'boulder' || p.kind === 'cannonball' ? 9 : 7;
    ctx.fillStyle = 'rgba(255,211,74,0.45)';
    ctx.fillRect(x - r - 3, y - r - 3, 2 * r + 6, 2 * r + 6);
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(x - r, y - r, 2 * r, 2 * r);
    ctx.fillStyle = '#fffbe6';
    ctx.fillRect(x - r / 2, y - r / 2, r, r);
  }
}
function draw(now: number): void {
  const c = canvas.value;
  const m = maps.get(civ.value);
  if (!c || !m) return;
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const w = Math.round(c.clientWidth * dpr);
  const h = Math.round(c.clientHeight * dpr);
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  // Không thu nhỏ quá bề ngang map (khỏi lộ khoảng trống hai bên)
  scale = Math.max(w / WORLD_WIDTH, zoom.value ? (h / MAP_H) * zoom.value : 0);
  offY = Math.max(0, (h - MAP_H * scale) / 2);
  if (follow.value) camX += (front() - view() / 2 - camX) * 0.05;
  clampCam();
  const ctx = c.getContext('2d')!;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#14101c';
  ctx.fillRect(0, 0, w, h);
  ctx.imageSmoothingEnabled = scale < 0.9; // thu nhỏ nhiều thì làm mượt cho đỡ rỗ
  ctx.setTransform(scale, 0, 0, scale, -camX * scale, offY);
  ctx.drawImage(m.bg, 0, 0);
  for (const d of world.drops) {
    ctx.fillStyle = '#c9921e';
    ctx.fillRect(d.x - 7, footY(d.lane) - 10, 14, 12);
    ctx.fillStyle = '#ffd34a';
    ctx.fillRect(d.x - 5, footY(d.lane) - 8, 10, 6);
  }
  const list = [...world.units].sort((a, b) => a.lane - b.lane);
  for (const u of list) drawUnit(ctx, u, now);
  for (const p of world.projectiles) drawProjectile(ctx, p);
  // Máu tượng hai phe
  for (const team of [0, 1] as const) {
    const ts = world.teams[team];
    const x = statueX(team);
    ctx.fillStyle = 'rgba(30,22,14,0.85)';
    ctx.fillRect(x - 82, 112, 164, 16);
    ctx.fillStyle = TEAM[team];
    ctx.fillRect(x - 80, 114, 160 * (ts.statueHp / ts.statueMax), 12);
  }
}

let raf = 0;
let last = 0;
let tick = 0;
function frame(ms: number): void {
  const dt = Math.min(0.1, (ms - last) / 1000);
  last = ms;
  for (let i = 0; i < speed.value; i++) {
    let acc = dt;
    while (acc > 0) {
      const st = Math.min(1 / 60, acc);
      for (const ai of ais) ai.update(world, st);
      world.update(st);
      acc -= st;
    }
    world.drainEvents();
  }
  if (++tick % 10 === 0) gold.value = [Math.floor(world.teams[0].gold), Math.floor(world.teams[1].gold)];
  draw(ms / 1000);
  raf = requestAnimationFrame(frame);
}

watch(civ, () => draw(last / 1000));
onMounted(async () => {
  try {
    await load();
  } catch {
    failed.value = true;
    return;
  } finally {
    loading.value = false;
  }
  newMatch();
  camX = 0;
  window.addEventListener('keydown', key);
  last = performance.now();
  raf = requestAnimationFrame(frame);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('keydown', key);
});
function restart(): void {
  newMatch();
  follow.value = true;
}
</script>

<template>
  <div class="map-demo">
    <div class="map-demo-bar">
      <button class="btn" :class="{ 'btn-primary': civ === 'light' }" @click="civ = 'light'">{{ t('mapDemo.light') }}</button>
      <button class="btn" :class="{ 'btn-primary': civ === 'wind' }" @click="civ = 'wind'">{{ t('mapDemo.wind') }}</button>
      <span class="map-demo-sep" />
      <button v-for="z in ZOOMS" :key="'z' + z" class="btn" :class="{ 'btn-primary': zoom === z }" @click="zoom = z">
        {{ z ? `🔍 ${Math.round(z * 100)}%` : t('mapDemo.whole') }}
      </button>
      <span class="map-demo-sep" />
      <button v-for="s in [1, 2, 4]" :key="s" class="btn" :class="{ 'btn-primary': speed === s }" @click="speed = s">x{{ s }}</button>
      <button class="btn" :class="{ 'btn-primary': follow }" @click="follow = !follow">{{ t('mapDemo.follow') }}</button>
      <button class="btn" @click="restart">{{ t('mapDemo.restart') }}</button>
      <span class="map-demo-gold">💰 {{ gold[0] }} · {{ gold[1] }}</span>
    </div>
    <p class="map-demo-hint">{{ t('mapDemo.hint') }}</p>
    <p v-if="loading">…</p>
    <p v-if="failed" class="bad">⚠️ art/topdown/maps</p>
    <canvas
      ref="canvas"
      class="map-demo-canvas"
      @pointerdown="down"
      @pointermove="move"
      @pointerup="up"
      @pointerleave="up"
      @wheel.prevent="wheel"
    />
  </div>
</template>
