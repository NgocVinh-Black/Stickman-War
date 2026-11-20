import { FACTIONS, UNITS, wallBlockOf, wallKind, type ProjectileKind, type Team } from '@stickman-war/core';
import { t } from '@stickman-war/i18n';
import { prefs } from '../../lib/prefs';
import { THEMES, type Deco, type Theme } from './themes';
import { drawMonument } from './monuments';
import { drawWallGhost } from './walls';
import {
  CENTER_MINE_X,
  LANE_DEPTH,
  WORLD_WIDTH,
  dirOf,
  mineX,
  statueX,
  type Drop,
  type Projectile,
  type Unit,
  type WorldView,
  type WorldEvent,
} from '@stickman-war/core';
import { drawStickman } from './stickman';

/** Màu quặng của từng loại mỏ. */
const MINE_ORE = { silver: '#cfd6de', gold: '#f2c230', diamond: '#6fe7ff' } as const;

export const TEAM_COLORS: Record<Team, { ink: string; accent: string; stone: string; dark: string }> = {
  0: { ink: '#161a24', accent: '#3e8bff', stone: '#9aa7b8', dark: '#5d6a7c' },
  1: { ink: '#24151a', accent: '#e5484d', stone: '#b89a94', dark: '#7c5a55' },
};

const VIEW_HEIGHT = 340; // chiều cao thế giới nhìn thấy (đơn vị thế giới)
const GROUND_BELOW = 100; // phần đất dưới đường chân (đủ cho các hàng quân)
const RECOVERY = 0.25;
/** Nửa bề rộng vùng chuyển phong cảnh giữa hai nền văn minh (đơn vị thế giới). */
export const BLEND = 650;
/** Chiều cao đỉnh đầu theo loại quân (để đặt thanh máu, sao kỳ cựu). */
const TOP: Partial<Record<string, number>> = { cavalry: 82, catapult: 50, tower: 100, wall: 92 };
/** Màu quả cầu phép / nổ theo loại đạn. */
const GLOW: Partial<Record<ProjectileKind, [string, string]>> = {
  fireball: ['#ffb347', '#ff7b00'],
  poison: ['#a3e635', '#4d7c0f'],
  spark: ['#e0f2fe', '#38bdf8'],
  sun: ['#fef08a', '#f59e0b'],
  wind: ['#ecfdf5', '#6ee7b7'],
};

type Particle = { x: number; y: number; vx: number; vy: number; life: number; max: number; color: string; size: number };
type FloatText = { x: number; y: number; text: string; life: number; color: string };

/** Tỉ lệ vẽ chiến trường theo kích thước khung (dùng chung để ô giới thiệu quân ở sảnh vẽ đúng cỡ trong trận). */
export const viewScale = (width: number, height: number) => Math.max(0.35, Math.min(height / VIEW_HEIGHT, width / 520));

export class Renderer {
  private ctx: CanvasRenderingContext2D;
  camX = 0;
  scale = 1;
  width = 0;
  height = 0;
  groundY = 0;
  private particles: Particle[] = [];
  private texts: FloatText[] = [];
  private shake = 0;
  private time = 0;

  constructor(private canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  get viewW(): number {
    return this.width / this.scale;
  }

  resize(): void {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = Math.round(rect.width * dpr);
    this.canvas.height = Math.round(rect.height * dpr);
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = viewScale(rect.width, rect.height);
    this.groundY = rect.height - GROUND_BELOW * this.scale;
    this.setCamera(this.camX);
  }

  setCamera(x: number): void {
    this.camX = Math.max(0, Math.min(WORLD_WIDTH - this.viewW, x));
  }

  centerOn(x: number): void {
    this.setCamera(x - this.viewW / 2);
  }

  private sx(x: number): number {
    return (x - this.camX) * this.scale;
  }
  private sy(lane: number, h = 0): number {
    return this.groundY + (lane * LANE_DEPTH + h) * this.scale;
  }

  // ---------- Hiệu ứng từ sự kiện mô phỏng ----------

  consume(events: WorldEvent[], playerTeam: Team = 0): void {
    for (const e of events) {
      switch (e.type) {
        case 'hit':
          this.burst(e.x, e.lane, e.h, e.big ? 10 : 5, '#7a1020', e.big ? 3 : 2);
          break;
        case 'death':
          this.burst(e.x, e.lane, -20, 10, '#7a1020', 2.5);
          break;
        case 'explode': {
          const [core, edge] = (e.kind && GLOW[e.kind]) || ['#ffe066', '#ff9a2e'];
          this.burst(e.x, e.lane, -10, 18, edge, 3.5, 160);
          this.burst(e.x, e.lane, -10, 8, core, 2.5, 120);
          this.shake = Math.max(this.shake, 4);
          break;
        }
        case 'raise':
          this.burst(e.x, e.lane, -15, 16, '#a78bfa', 3, 90);
          break;
        case 'built':
          this.burst(e.x, 0.5, -30, 20, '#b8a07a', 3, 110);
          if (e.team === playerTeam) this.texts.push({ x: e.x, y: -110, text: t('game.towerBuilt'), life: 1.4, color: '#ffffff' });
          break;
        case 'statueHit':
          this.burst(e.x + (Math.random() - 0.5) * 50, 0.2, -60 - Math.random() * 80, 3, '#8d8478', 2.5);
          if (e.team === playerTeam) this.shake = Math.max(this.shake, 2);
          break;
        case 'gold':
          if (e.team === playerTeam) this.texts.push({ x: e.x, y: -60, text: `+${e.amount}`, life: 1, color: '#ffd23f' });
          else if (e.amount >= 60) this.texts.push({ x: e.x, y: -60, text: `-${e.amount}`, life: 1, color: '#f87171' });
          break;
        case 'heal':
          this.burst(e.x, e.lane, -30, 4, '#3ddc84', 2.2, 50);
          break;
        case 'blink':
          this.burst(e.x0, e.lane, -25, 10, '#4a4f5c', 3, 70);
          this.burst(e.x, e.lane, -25, 10, '#4a4f5c', 3, 70);
          break;
        case 'promote':
          this.burst(e.x, e.lane, -45, 14, '#ffd23f', 2.5, 110);
          this.texts.push({ x: e.x, y: -80, text: '★'.repeat(e.rank), life: 1.4, color: '#ffd23f' });
          break;
        case 'drop':
          this.burst(e.x, e.lane, -10, 10, '#f2c230', 2.5, 90);
          this.texts.push({ x: e.x, y: -45, text: `💰 ${e.amount}`, life: 1.2, color: '#ffe08a' });
          break;
      }
    }
  }

  private burst(x: number, lane: number, h: number, n: number, color: string, size: number, speed = 90): void {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      this.particles.push({
        x,
        y: lane * LANE_DEPTH + h,
        vx: Math.cos(a) * v,
        vy: Math.sin(a) * v - 60,
        life: 0.5 + Math.random() * 0.4,
        max: 0.9,
        color,
        size,
      });
    }
  }

  // ---------- Vẽ ----------

  draw(world: WorldView, dt: number): void {
    this.time += dt;
    const ctx = this.ctx;
    ctx.save();
    if (this.shake > 0 && !prefs.shake) this.shake = 0;
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake = Math.max(0, this.shake - dt * 20);
    }
    this.drawBackground(world);
    for (const team of [0, 1] as Team[]) {
      this.drawMine(mineX(team, 0), 0.9, 'silver');
      this.drawMine(mineX(team, 1), 1.15, 'gold');
    }
    this.drawMine(CENTER_MINE_X, 1.6, 'diamond');
    for (const d of world.drops) this.drawDrop(d);
    for (const team of [0, 1] as Team[]) this.drawStatue(world, team);
    for (const team of [0, 1] as Team[]) if (world.teams[team].stance === 'hold') this.drawRallyFlag(world.teams[team].holdX, team);
    this.drawWallPlans(world);

    this.updateGates(world, dt);
    const units = world.units.filter((u) => !u.inside).sort((a, b) => a.lane - b.lane);
    for (const u of units) this.drawUnit(u);
    for (const p of world.projectiles) this.drawProjectile(p);
    this.drawParticles(dt);
    ctx.restore();
  }

  /** Bóng tường người chơi đang chọn chỗ đặt (toạ độ thế giới, null = không đặt). */
  wallGhost: number | null = null;
  /** Độ mở cổng (0..1) của từng tường, theo id. */
  private gates = new Map<number, number>();

  /** Cổng mở dần khi quân nhà ở sát tường, đóng lại khi không còn ai đi qua. */
  private updateGates(world: WorldView, dt: number): void {
    for (const w of world.units) {
      if (w.dying || !UNITS[w.kind].wall) continue;
      const near = world.units.some(
        (u) => u.team === w.team && u !== w && !u.dying && !u.inside && !UNITS[u.kind].stationary && Math.abs(u.x - w.x) < 34,
      );
      const g = this.gates.get(w.id) ?? 0;
      this.gates.set(w.id, Math.max(0, Math.min(1, g + (near ? 4 : -2) * dt)));
    }
  }

  /** Tường đang chờ dựng (khung nét đứt + tiến độ) và bóng tường lúc chọn chỗ đặt. */
  private drawWallPlans(world: WorldView): void {
    const { ctx, scale } = this;
    const at = (x: number, draw: () => void) => {
      ctx.save();
      ctx.translate(this.sx(x), this.sy(0.5));
      ctx.scale(scale, scale);
      draw();
      ctx.restore();
    };
    for (const team of [0, 1] as Team[]) {
      const t = world.teams[team];
      if (Number.isNaN(t.wallPlan)) continue;
      const build = UNITS[wallKind(t.faction)].buildTime ?? 6;
      at(t.wallPlan, () => drawWallGhost(ctx, true, Math.min(1, t.wallT / build)));
    }
    if (this.wallGhost !== null) {
      const ok = wallBlockOf(world, 0, this.wallGhost) === null;
      at(this.wallGhost, () => drawWallGhost(ctx, ok));
    }
  }

  /** Phần theme bên phải (team 1) tại điểm màn hình px: 0 = hẳn bên trái, 1 = hẳn bên phải, chuyển dần quanh giữa bản đồ. */
  private blendAt(px: number): number {
    const wx = px / this.scale + this.camX;
    const k = Math.min(1, Math.max(0, (wx - (WORLD_WIDTH / 2 - BLEND)) / (2 * BLEND)));
    return k * k * (3 - 2 * k);
  }

  /** Canvas phụ để vẽ lớp phong cảnh bên phải rồi làm mờ dần bằng gradient (không lộ vạch như chia dải). */
  private overlay: HTMLCanvasElement | null = null;

  /**
   * Vẽ `paint(ctx)` (tô theo theme bên phải) lên canvas phụ, xoá dần phần bên trái bằng mặt nạ gradient ngang
   * quanh giữa bản đồ, rồi đè lên khung hình chính.
   */
  private overlayRight(paint: (c: CanvasRenderingContext2D) => void): void {
    const { width, height } = this;
    const left = this.sx(WORLD_WIDTH / 2 - BLEND);
    const right = this.sx(WORLD_WIDTH / 2 + BLEND);
    if (left >= width) return;
    if (right <= 0) {
      paint(this.ctx);
      return;
    }
    const dpr = this.canvas.width / Math.max(1, width);
    this.overlay ??= document.createElement('canvas');
    const o = this.overlay;
    if (o.width !== this.canvas.width || o.height !== this.canvas.height) {
      o.width = this.canvas.width;
      o.height = this.canvas.height;
    }
    const c = o.getContext('2d')!;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.globalCompositeOperation = 'source-over';
    c.clearRect(0, 0, width, height);
    paint(c);
    // Mặt nạ: trong suốt bên trái, đậm dần (gần smoothstep) tới hẳn bên phải
    const mask = c.createLinearGradient(left, 0, right, 0);
    for (let i = 0; i <= 8; i++) {
      const k = i / 8;
      mask.addColorStop(k, `rgba(0,0,0,${k * k * (3 - 2 * k)})`);
    }
    c.globalCompositeOperation = 'destination-in';
    c.fillStyle = mask;
    c.fillRect(0, 0, width, height);
    c.globalCompositeOperation = 'source-over';
    this.ctx.drawImage(o, 0, 0, width, height);
  }

  private drawBackground(world: WorldView): void {
    const { ctx, width, height, groundY, scale } = this;
    const a = THEMES[world.teams[0].faction] ?? THEMES.tribe;
    const b = THEMES[world.teams[1].faction] ?? THEMES.tribe;
    const same = a === b;
    const mid = this.blendAt(width / 2);

    // Trời
    const sky = (th: Theme) => {
      const g = ctx.createLinearGradient(0, 0, 0, groundY);
      g.addColorStop(0, th.sky[0]);
      g.addColorStop(0.6, th.sky[1]);
      g.addColorStop(1, th.sky[2]);
      return g;
    };
    ctx.fillStyle = sky(a);
    ctx.fillRect(0, 0, width, groundY + 2);
    if (!same)
      this.overlayRight((c) => {
        c.fillStyle = sky(b);
        c.fillRect(0, 0, width, groundY + 2);
      });

    // Mặt trời / trăng
    for (const [th, alpha] of same
      ? ([[a, 1]] as const)
      : ([
          [a, 1 - mid],
          [b, mid],
        ] as const)) {
      if (alpha <= 0.01) continue;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = th.sun;
      ctx.beginPath();
      ctx.arc(width * 0.78, groundY * 0.28, 38 * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Núi: màu chuyển theo chiều ngang từ nền văn minh bên trái sang bên phải
    const amp = a.amp * (1 - mid) + b.amp * mid;
    const ridge = (i: 0 | 1 | 2) => {
      if (same) return a.ridges[i];
      const g = ctx.createLinearGradient(this.sx(WORLD_WIDTH / 2 - BLEND), 0, this.sx(WORLD_WIDTH / 2 + BLEND), 0);
      g.addColorStop(0, a.ridges[i]);
      g.addColorStop(1, b.ridges[i]);
      return g;
    };
    this.drawRidge(0.15, 210, 70 * amp, ridge(0), 0.0021, 11);
    this.drawRidge(0.35, 140, 55 * amp, ridge(1), 0.004, 23);
    this.drawRidge(0.6, 70, 30 * amp, ridge(2), 0.007, 37);

    // Đất
    const ground = (th: Theme) => {
      const g = ctx.createLinearGradient(0, groundY - 8 * scale, 0, height);
      g.addColorStop(0, th.grass[0]);
      g.addColorStop(0.08, th.grass[1]);
      g.addColorStop(0.1, th.dirt[0]);
      g.addColorStop(1, th.dirt[1]);
      return g;
    };
    ctx.fillStyle = ground(a);
    ctx.fillRect(0, groundY - 8 * scale, width, height);
    if (!same)
      this.overlayRight((c) => {
        c.fillStyle = ground(b);
        c.fillRect(0, groundY - 8 * scale, width, height);
      });
    // Đường đất nơi quân đi
    ctx.fillStyle = 'rgba(255, 240, 200, 0.12)';
    ctx.fillRect(0, groundY + 4 * scale, width, LANE_DEPTH * scale);

    this.drawDeco(a.deco, (px) => 1 - this.blendAt(px), same);
    if (!same) this.drawDeco(b.deco, (px) => this.blendAt(px), false);
  }

  /** Hạt trang trí nền (tuyết, tàn lửa, lá…): vị trí tính từ thời gian nên không cần lưu trạng thái. */
  private drawDeco(deco: Deco, weight: (px: number) => number, full: boolean): void {
    if (deco === 'none') return;
    const { ctx, width, groundY, scale, time } = this;
    const n = deco === 'dust' || deco === 'smoke' ? 10 : deco === 'bubbles' ? 16 : 40;
    const rnd = (i: number, k: number) => {
      const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
      return v - Math.floor(v);
    };
    const wrap = (v: number, m: number) => ((v % m) + m) % m;
    for (let i = 0; i < n; i++) {
      const r1 = rnd(i, 1);
      const r2 = rnd(i, 2);
      const r3 = rnd(i, 3);
      let x = r1 * width;
      let y = r2 * groundY;
      let size = (1.5 + r3 * 1.8) * scale;
      let color = '#ffffff';
      let alpha = 0.8;
      switch (deco) {
        case 'snow':
          x = wrap(x + Math.sin(time * 0.8 + r1 * 6) * 14 * scale - time * 8 * scale, width);
          y = wrap(y + time * (18 + r3 * 22) * scale, groundY + 20 * scale);
          break;
        case 'embers':
          x = wrap(x + Math.sin(time * 1.3 + r1 * 6) * 10 * scale, width);
          y = groundY - wrap(r2 * groundY + time * (22 + r3 * 26) * scale, groundY);
          color = r3 > 0.5 ? '#ffb347' : '#ff6a1a';
          alpha = 0.75;
          size *= 0.9;
          break;
        case 'leaves':
        case 'petals':
          x = wrap(x + Math.sin(time * 1.1 + r1 * 6) * 22 * scale + time * 12 * scale, width);
          y = wrap(y + time * (14 + r3 * 14) * scale, groundY + 20 * scale);
          color = deco === 'leaves' ? (r3 > 0.5 ? '#6fae4f' : '#a9c95a') : r3 > 0.5 ? '#ffb7c5' : '#ffd4dd';
          size *= 1.4;
          break;
        case 'bubbles':
          x = wrap(x + Math.sin(time * 1.6 + r1 * 6) * 6 * scale, width);
          y = groundY - wrap(r2 * groundY * 0.45 + time * (16 + r3 * 18) * scale, groundY * 0.45);
          size *= 0.55;
          alpha = 0.45;
          break;
        case 'dust':
        case 'smoke':
          x = wrap(x + time * (10 + r3 * 14) * scale, width + 200 * scale) - 100 * scale;
          y = groundY * (0.35 + r2 * 0.55);
          size = (40 + r3 * 60) * scale;
          color = deco === 'smoke' ? '#5a5650' : '#c9a77a';
          alpha = 0.1;
          break;
      }
      const w = full ? 1 : weight(x);
      if (w <= 0.02) continue;
      ctx.globalAlpha = alpha * w;
      ctx.fillStyle = color;
      ctx.beginPath();
      if (deco === 'bubbles') {
        ctx.strokeStyle = color;
        ctx.lineWidth = Math.max(1, scale);
        ctx.arc(x, y, size * 1.3, 0, Math.PI * 2);
        ctx.stroke();
      } else if (deco === 'leaves' || deco === 'petals') {
        ctx.ellipse(x, y, size, size * 0.55, time * 2 + r1 * 6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
  }

  /** Dãy núi thị sai, sinh bằng tổng các sóng sin để không cần ảnh. */
  private drawRidge(parallax: number, base: number, amp: number, color: string | CanvasGradient, freq: number, seed: number): void {
    const { ctx, width, groundY, scale } = this;
    const offset = this.camX * parallax;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    for (let px = 0; px <= width + 8; px += 8) {
      const wx = px / scale + offset;
      const h =
        base +
        amp * (Math.sin(wx * freq + seed) * 0.6 + Math.sin(wx * freq * 2.3 + seed * 2) * 0.3 + Math.sin(wx * freq * 5.1 + seed * 3) * 0.1);
      ctx.lineTo(px, groundY - h * scale);
    }
    ctx.lineTo(width, groundY);
    ctx.closePath();
    ctx.fill();
  }

  private drawDrop(d: Drop): void {
    const { ctx, scale } = this;
    const sx = this.sx(d.x);
    if (sx < -30 * scale || sx > this.width + 30 * scale) return;
    const bob = Math.sin(this.time * 5 + d.id) * 1.5;
    ctx.save();
    ctx.translate(sx, this.sy(d.lane));
    ctx.scale(scale, scale);
    ctx.fillStyle = '#c99a2e';
    ctx.beginPath();
    ctx.ellipse(0, -6 + bob, 7, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f2c230';
    ctx.beginPath();
    ctx.arc(-1.5, -8 + bob, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#7a5a1c';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-3, -12 + bob);
    ctx.lineTo(3, -12 + bob);
    ctx.stroke();
    ctx.restore();
  }

  private drawMine(x: number, size = 1, kind: 'silver' | 'gold' | 'diamond' = 'gold'): void {
    const diamond = kind === 'diamond';
    const ore = MINE_ORE[kind];
    const { ctx, scale } = this;
    const sx = this.sx(x);
    if (sx < -80 * scale * size || sx > this.width + 80 * scale * size) return;
    const sy = this.sy(0.05);
    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale * size, scale * size);
    const rocks: [number, number, number][] = [
      [-22, -2, 16],
      [0, -6, 22],
      [22, -1, 14],
    ];
    for (const [rx, ry, r] of rocks) {
      ctx.fillStyle = '#6f6458';
      ctx.beginPath();
      ctx.moveTo(rx - r, ry + 4);
      ctx.lineTo(rx - r * 0.6, ry - r * 0.8);
      ctx.lineTo(rx + r * 0.3, ry - r);
      ctx.lineTo(rx + r, ry - r * 0.2);
      ctx.lineTo(rx + r * 0.9, ry + 4);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = ore;
      ctx.beginPath();
      ctx.moveTo(rx - r * 0.3, ry - r * 0.3);
      ctx.lineTo(rx, ry - r * 0.75);
      ctx.lineTo(rx + r * 0.35, ry - r * 0.35);
      ctx.lineTo(rx, ry - r * 0.05);
      ctx.closePath();
      ctx.fill();
    }
    // Lấp lánh
    const tw = (Math.sin(this.time * 3 + x) + 1) / 2;
    ctx.fillStyle = diamond
      ? `rgba(220, 250, 255, ${tw})`
      : kind === 'silver'
        ? `rgba(245, 248, 255, ${tw})`
        : `rgba(255, 250, 200, ${tw})`;
    ctx.beginPath();
    ctx.arc(4, -22, 2.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawStatue(world: WorldView, team: Team): void {
    const { ctx, scale } = this;
    const x = statueX(team);
    const sx = this.sx(x);
    if (sx < -150 * scale || sx > this.width + 150 * scale) return;
    const c = TEAM_COLORS[team];
    const t = world.teams[team];
    const ratio = t.statueHp / t.statueMax;
    const f = dirOf(team);

    ctx.save();
    ctx.translate(sx, this.sy(0.1));
    ctx.scale(scale, scale);

    // Công trình đặc trưng của nền văn minh (bên phải lật gương để quay vào giữa bản đồ), viền màu phe dưới chân
    const th = THEMES[t.faction] ?? THEMES.tribe;
    ctx.save();
    ctx.scale(f, 1);
    drawMonument(ctx, t.faction, { stone: th.stone, dark: th.stoneDark, glow: FACTIONS[t.faction]?.color ?? c.accent }, this.time);
    ctx.restore();
    ctx.fillStyle = c.accent;
    ctx.fillRect(-50, -4, 100, 4);

    // Cờ
    ctx.strokeStyle = '#4b3a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-f * 62, 0);
    ctx.lineTo(-f * 62, -185);
    ctx.stroke();
    const wave = Math.sin(this.time * 4) * 4;
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.moveTo(-f * 62, -185);
    ctx.quadraticCurveTo(-f * 62 - f * 22, -178 + wave, -f * 62 - f * 44, -172);
    ctx.lineTo(-f * 62, -158);
    ctx.closePath();
    ctx.fill();

    // Vết nứt khi máu thấp
    if (ratio < 0.66) {
      ctx.strokeStyle = 'rgba(40, 30, 25, 0.7)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-20, -34);
      ctx.lineTo(-8, -18);
      ctx.lineTo(-14, -6);
      if (ratio < 0.33) {
        ctx.moveTo(18, -40);
        ctx.lineTo(6, -24);
        ctx.lineTo(14, -10);
        ctx.lineTo(4, 0);
      }
      ctx.stroke();
    }

    // Thanh máu
    const bw = 100;
    ctx.fillStyle = 'rgba(0,0,0,0.45)';
    ctx.fillRect(-bw / 2, -205, bw, 9);
    ctx.fillStyle = ratio > 0.5 ? '#4ade80' : ratio > 0.25 ? '#facc15' : '#ef4444';
    ctx.fillRect(-bw / 2 + 1, -204, (bw - 2) * ratio, 7);

    // Số quân đang trú trong tượng
    const inside = world.units.filter((u) => u.team === team && u.inside).length;
    if (inside > 0) {
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 16px system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`🛡 ${inside}`, 0, -12);
    }
    ctx.restore();
  }

  private drawUnit(u: Unit): void {
    const { ctx, scale } = this;
    const s = UNITS[u.kind];
    const sx = this.sx(u.x);
    if (sx < -60 * scale * s.scale || sx > this.width + 60 * scale * s.scale) return;
    const sy = this.sy(u.lane);
    const c = TEAM_COLORS[u.team];

    // Đang lướt: vệt bóng mờ phía sau và người chúi về trước
    if (u.dashT > 0 && !u.dying) {
      for (let i = 3; i >= 1; i--) {
        ctx.save();
        ctx.globalAlpha = 0.12 * (4 - i);
        ctx.translate(sx - u.facing * i * 16 * scale, sy);
        ctx.scale(scale * s.scale * u.facing, scale * s.scale);
        ctx.rotate(0.35);
        drawStickman(ctx, {
          kind: u.kind,
          walk: u.walk,
          moving: true,
          attack: -1,
          mining: -1,
          carrying: false,
          ink: c.ink,
          accent: c.accent,
          flash: false,
        });
        ctx.restore();
      }
    }

    // Bóng
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    const wide = s.arch === 'cavalry' || s.arch === 'catapult' || s.arch === 'tower' ? 2.1 : 1;
    // Quân tàng hình: mờ gần như trong suốt
    ctx.globalAlpha = u.hidden ? 0.28 : 1;
    ctx.ellipse(sx, sy, 12 * scale * s.scale * wide, 3 * scale * s.scale, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.save();
    ctx.translate(sx, sy);
    ctx.scale(scale * s.scale * (s.stationary ? dirOf(u.team) : u.facing), scale * s.scale);
    if (u.hidden) ctx.globalAlpha = 0.28;
    if (u.dashT > 0 && !u.dying) ctx.rotate(0.35);
    if (u.dying) {
      const fall = Math.min(1, u.deadT / 0.4);
      ctx.rotate(-fall * Math.PI * 0.5);
      ctx.globalAlpha = u.deadT > 1.6 ? Math.max(0, 1 - (u.deadT - 1.6) / 0.9) : 1;
    }
    const attack = u.attackT < 0 ? -1 : u.attackT < s.windup ? u.attackT / s.windup : 1 + Math.min(1, (u.attackT - s.windup) / RECOVERY);
    drawStickman(ctx, {
      kind: u.kind,
      walk: u.walk,
      moving: u.moving,
      attack,
      mining: u.mining ? u.mineT * 4 : -1,
      carrying: u.carrying > 0,
      gem: u.toCenter,
      silver: u.mine === 0,
      ink: c.ink,
      accent: c.accent,
      flash: u.hitFlash > 0,
      gate: this.gates.get(u.id) ?? 0,
      time: this.time,
    });
    ctx.restore();

    // Thanh máu khi bị thương, sao kỳ cựu phía trên
    ctx.globalAlpha = 1;
    // Trúng độc: bọt xanh; bị làm chậm: tinh thể băng
    if (!u.dying && (u.poisonT > 0 || u.slowT > 0) && Math.random() < 0.25) {
      this.burst(u.x, u.lane, -20 * s.scale, 1, u.poisonT > 0 ? '#84cc16' : '#7dd3fc', 2, 25);
    }
    const y = sy - (TOP[s.arch] ?? 62) * scale * s.scale;
    if (!u.dying && u.rank > 0) {
      ctx.font = `bold ${Math.round(9 * scale + 4)}px system-ui, sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText('★'.repeat(u.rank), sx + 1, y - 3);
      ctx.fillStyle = '#ffd23f';
      ctx.fillText('★'.repeat(u.rank), sx, y - 4);
    }
    if (!u.dying && u.hp < u.maxHp) {
      const w = 22 * scale * Math.min(s.scale, 1.6);
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillRect(sx - w / 2, y, w, 3.5);
      ctx.fillStyle = u.team === 0 ? '#4ade80' : '#f87171';
      ctx.fillRect(sx - w / 2, y, w * (u.hp / u.maxHp), 3.5);
    }
  }

  private drawProjectile(p: Projectile): void {
    const { ctx, scale } = this;
    const k = Math.min(1, p.t / p.duration);
    const x = p.x0 + (p.x1 - p.x0) * k;
    const hEnd = -28;
    const h = p.h0 + (hEnd - p.h0) * k - p.arc * 4 * k * (1 - k);
    const sx = this.sx(x);
    const sy = this.sy(p.lane, h);
    if (p.kind === 'axe') {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.t * 14 * Math.sign(p.x1 - p.x0));
      ctx.strokeStyle = '#7a5230';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6 * scale, 0);
      ctx.lineTo(6 * scale, 0);
      ctx.stroke();
      ctx.fillStyle = '#d8dee8';
      ctx.beginPath();
      ctx.moveTo(6 * scale, 0);
      ctx.lineTo(9 * scale, -5 * scale);
      ctx.lineTo(11 * scale, 3 * scale);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'bullet') {
      ctx.strokeStyle = 'rgba(255, 240, 200, 0.7)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(sx - Math.sign(p.x1 - p.x0) * 14 * scale, sy);
      ctx.lineTo(sx, sy);
      ctx.stroke();
      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.arc(sx, sy, 2 * scale, 0, Math.PI * 2);
      ctx.fill();
    } else if (p.kind === 'arrow' || p.kind === 'bolt') {
      const big = p.kind === 'bolt' ? 1.7 : 1;
      const dx = (p.x1 - p.x0) / p.duration;
      const dh = (hEnd - p.h0) / p.duration - (p.arc * 4 * (1 - 2 * k)) / p.duration;
      const ang = Math.atan2(dh, dx);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(ang);
      ctx.scale(big, big);
      ctx.strokeStyle = '#3b2a1a';
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(-9 * scale, 0);
      ctx.lineTo(9 * scale, 0);
      ctx.stroke();
      ctx.fillStyle = '#cfd6df';
      ctx.beginPath();
      ctx.moveTo(12 * scale, 0);
      ctx.lineTo(8 * scale, -2.5 * scale);
      ctx.lineTo(8 * scale, 2.5 * scale);
      ctx.fill();
      ctx.restore();
    } else if (p.kind === 'boulder' || p.kind === 'cannonball') {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(p.t * 8);
      ctx.fillStyle = p.kind === 'cannonball' ? '#1f2937' : '#7d756b';
      ctx.beginPath();
      ctx.arc(0, 0, 6.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5c554c';
      ctx.beginPath();
      ctx.arc(2 * scale, -1.5 * scale, 2 * scale, 0, Math.PI * 2);
      ctx.arc(-2.5 * scale, 2 * scale, 1.5 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else {
      const [core, edge] = GLOW[p.kind] ?? GLOW.fireball!;
      ctx.save();
      ctx.shadowColor = edge;
      ctx.shadowBlur = 14;
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.arc(sx, sy, 6 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fff3b0';
      ctx.beginPath();
      ctx.arc(sx, sy, 3 * scale, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (Math.random() < 0.6) {
        this.particles.push({
          x,
          y: p.lane * LANE_DEPTH + h,
          vx: (Math.random() - 0.5) * 30,
          vy: -20,
          life: 0.35,
          max: 0.35,
          color: edge,
          size: 2.5,
        });
      }
    }
  }

  private drawParticles(dt: number): void {
    const { ctx, scale } = this;
    for (const p of this.particles) {
      p.life -= dt;
      p.vy += 300 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      ctx.globalAlpha = Math.max(0, p.life / p.max);
      ctx.fillStyle = p.color;
      ctx.fillRect(this.sx(p.x) - p.size / 2, this.groundY + p.y * scale - p.size / 2, p.size * scale, p.size * scale);
    }
    ctx.globalAlpha = 1;
    this.particles = this.particles.filter((p) => p.life > 0);

    ctx.font = `bold ${Math.round(14 * scale + 4)}px system-ui, sans-serif`;
    ctx.textAlign = 'center';
    for (const t of this.texts) {
      t.life -= dt;
      t.y -= 30 * dt;
      ctx.globalAlpha = Math.max(0, t.life);
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillText(t.text, this.sx(t.x) + 1, this.groundY + t.y * scale + 1);
      ctx.fillStyle = t.color;
      ctx.fillText(t.text, this.sx(t.x), this.groundY + t.y * scale);
    }
    ctx.globalAlpha = 1;
    this.texts = this.texts.filter((t) => t.life > 0);
  }

  // ---------- Bản đồ nhỏ ----------

  /** Cờ tập hợp (Cắm cờ): cột cờ cắm xuống đất, lá cờ màu phe, phấp phới nhẹ. */
  private drawRallyFlag(x: number, team: Team): void {
    const { ctx, scale } = this;
    const sx = this.sx(x);
    if (sx < -40 * scale || sx > this.width + 40 * scale) return;
    const base = this.sy(0.15, 0);
    const pole = 70 * scale;
    ctx.save();
    ctx.strokeStyle = '#3b2a1a';
    ctx.lineWidth = Math.max(2, 3 * scale);
    ctx.beginPath();
    ctx.moveTo(sx, base);
    ctx.lineTo(sx, base - pole);
    ctx.stroke();
    const wave = Math.sin(this.time * 6) * 3 * scale;
    const w = 30 * scale * dirOf(team);
    ctx.fillStyle = TEAM_COLORS[team].accent;
    ctx.beginPath();
    ctx.moveTo(sx, base - pole);
    ctx.quadraticCurveTo(sx + w * 0.5, base - pole - 4 * scale + wave, sx + w, base - pole + 2 * scale);
    ctx.lineTo(sx + w, base - pole + 18 * scale);
    ctx.quadraticCurveTo(sx + w * 0.5, base - pole + 14 * scale + wave, sx, base - pole + 18 * scale);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(sx, base, 8 * scale, 2.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  drawMinimap(mini: HTMLCanvasElement, world: WorldView): void {
    const rect = mini.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (mini.width !== Math.round(rect.width * dpr)) {
      mini.width = Math.round(rect.width * dpr);
      mini.height = Math.round(rect.height * dpr);
    }
    const ctx = mini.getContext('2d')!;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = rect.width;
    const h = rect.height;
    const k = w / WORLD_WIDTH;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(20, 24, 32, 0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(124, 154, 74, 0.6)';
    ctx.fillRect(0, h - 5, w, 5);
    for (const team of [0, 1] as Team[]) {
      ctx.fillStyle = TEAM_COLORS[team].accent;
      ctx.fillRect(statueX(team) * k - 3, 3, 6, h - 8);
      for (let i = 0; i < 2; i++) {
        ctx.fillStyle = i === 0 ? MINE_ORE.silver : MINE_ORE.gold;
        ctx.fillRect(mineX(team, i) * k - 1.5, h - 8, 3, 3);
      }
    }
    ctx.fillStyle = '#6fe7ff';
    ctx.fillRect(CENTER_MINE_X * k - 3, h - 9, 6, 4);
    ctx.fillStyle = '#f2c230';
    for (const d of world.drops) ctx.fillRect(d.x * k - 1.5, h - 12, 3, 3);
    for (const u of world.units) {
      if (u.dying || u.inside) continue;
      ctx.fillStyle = TEAM_COLORS[u.team].accent;
      const a = UNITS[u.kind].arch;
      if (u.hidden && u.team !== 0) continue;
      const size = a === 'giant' || a === 'catapult' || a === 'tower' ? 4 : a === 'cavalry' ? 3.2 : 2.5;
      ctx.fillRect(u.x * k - size / 2, 6 + u.lane * (h - 16), size, size);
    }
    for (const team of [0, 1] as Team[]) {
      if (world.teams[team].stance !== 'hold') continue;
      ctx.fillStyle = TEAM_COLORS[team].accent;
      const fx = world.teams[team].holdX * k;
      ctx.fillRect(fx - 0.75, 2, 1.5, h - 7);
      ctx.fillRect(fx, 2, 6 * dirOf(team), 4);
    }
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.camX * k + 0.75, 0.75, this.viewW * k - 1.5, h - 1.5);
  }
}
