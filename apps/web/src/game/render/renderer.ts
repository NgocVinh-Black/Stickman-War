import { UNITS, kindOf, type ProjectileKind, type Team } from '@stickman-war/core';
import {
  CENTER_MINE_X,
  LANE_DEPTH,
  MINE_OFFSETS,
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

export const TEAM_COLORS: Record<Team, { ink: string; accent: string; stone: string; dark: string }> = {
  0: { ink: '#161a24', accent: '#3e8bff', stone: '#9aa7b8', dark: '#5d6a7c' },
  1: { ink: '#24151a', accent: '#e5484d', stone: '#b89a94', dark: '#7c5a55' },
};

const VIEW_HEIGHT = 340; // chiều cao thế giới nhìn thấy (đơn vị thế giới)
const GROUND_BELOW = 100; // phần đất dưới đường chân (đủ cho các hàng quân)
const RECOVERY = 0.25;
/** Chiều cao đỉnh đầu theo loại quân (để đặt thanh máu, sao kỳ cựu). */
const TOP: Partial<Record<string, number>> = { cavalry: 82, catapult: 50, tower: 100 };
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
    this.scale = Math.max(0.35, Math.min(rect.height / VIEW_HEIGHT, rect.width / 520));
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
          if (e.team === playerTeam) this.texts.push({ x: e.x, y: -110, text: '🏰 Tháp xây xong', life: 1.4, color: '#ffffff' });
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
    if (this.shake > 0) {
      ctx.translate((Math.random() - 0.5) * this.shake, (Math.random() - 0.5) * this.shake);
      this.shake = Math.max(0, this.shake - dt * 20);
    }
    this.drawBackground();
    for (const team of [0, 1] as Team[]) {
      MINE_OFFSETS.forEach((_, i) => this.drawMine(mineX(team, i)));
    }
    this.drawMine(CENTER_MINE_X, 1.6, true);
    for (const d of world.drops) this.drawDrop(d);
    for (const team of [0, 1] as Team[]) this.drawStatue(world, team);

    const units = world.units.filter((u) => !u.inside).sort((a, b) => a.lane - b.lane);
    for (const u of units) this.drawUnit(u);
    for (const p of world.projectiles) this.drawProjectile(p);
    this.drawParticles(dt);
    ctx.restore();
  }

  private drawBackground(): void {
    const { ctx, width, height, groundY, scale } = this;
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#f7d9a8');
    sky.addColorStop(0.6, '#f3e5c6');
    sky.addColorStop(1, '#e8dcc0');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, groundY + 2);

    // Mặt trời
    ctx.fillStyle = 'rgba(255, 196, 92, 0.75)';
    ctx.beginPath();
    ctx.arc(width * 0.78, groundY * 0.28, 38 * scale, 0, Math.PI * 2);
    ctx.fill();

    this.drawRidge(0.15, 210, 70, '#cdb79b', 0.0021, 11);
    this.drawRidge(0.35, 140, 55, '#b39b7e', 0.004, 23);
    this.drawRidge(0.6, 70, 30, '#8f8a5c', 0.007, 37);

    // Đất
    const ground = ctx.createLinearGradient(0, groundY - 8 * scale, 0, height);
    ground.addColorStop(0, '#7c9a4a');
    ground.addColorStop(0.08, '#6b8740');
    ground.addColorStop(0.1, '#a88b5f');
    ground.addColorStop(1, '#7d6443');
    ctx.fillStyle = ground;
    ctx.fillRect(0, groundY - 8 * scale, width, height);
    // Đường đất nơi quân đi
    ctx.fillStyle = 'rgba(255, 240, 200, 0.12)';
    ctx.fillRect(0, groundY + 4 * scale, width, LANE_DEPTH * scale);
  }

  /** Dãy núi thị sai, sinh bằng tổng các sóng sin để không cần ảnh. */
  private drawRidge(parallax: number, base: number, amp: number, color: string, freq: number, seed: number): void {
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

  private drawMine(x: number, size = 1, diamond = false): void {
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
      ctx.fillStyle = diamond ? '#6fe7ff' : '#f2c230';
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
    ctx.fillStyle = diamond ? `rgba(220, 250, 255, ${tw})` : `rgba(255, 250, 200, ${tw})`;
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

    // Bệ
    ctx.fillStyle = c.dark;
    ctx.fillRect(-48, -34, 96, 34);
    ctx.fillStyle = c.stone;
    ctx.fillRect(-42, -40, 84, 8);

    // Tượng chiến binh đá cầm kiếm giơ cao
    ctx.save();
    ctx.translate(0, -40);
    ctx.scale(3.2 * f, 3.2);
    drawStickman(ctx, {
      kind: kindOf(t.faction, 'sword'),
      walk: 0,
      moving: false,
      attack: 0.85,
      mining: -1,
      carrying: false,
      ink: c.stone,
      accent: c.accent,
      flash: false,
      stone: true,
    });
    ctx.restore();

    // Cờ
    ctx.strokeStyle = '#4b3a2a';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-f * 40, -40);
    ctx.lineTo(-f * 40, -185);
    ctx.stroke();
    const wave = Math.sin(this.time * 4) * 4;
    ctx.fillStyle = c.accent;
    ctx.beginPath();
    ctx.moveTo(-f * 40, -185);
    ctx.quadraticCurveTo(-f * 40 + f * 22, -178 + wave, -f * 40 + f * 44, -172);
    ctx.lineTo(-f * 40, -158);
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
      ink: c.ink,
      accent: c.accent,
      flash: u.hitFlash > 0,
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
        ctx.fillStyle = '#f2c230';
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
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(this.camX * k + 0.75, 0.75, this.viewW * k - 1.5, h - 1.5);
  }
}
