import { UNITS, WORLD_WIDTH, type Difficulty, type FactionId, type Team, type WorldEvent, type WorldView } from '@stickman-war/core';
import { sound } from '../lib/sound';
import type { Match } from './match';
import { BLEND, Renderer } from './render/renderer';

/** Tốc độ lia camera nền sảnh (đơn vị thế giới / giây). */
const MENU_PAN = 300;

export type Mode =
  | { type: 'menu' }
  | { type: 'campaign'; level: number; faction: FactionId }
  | { type: 'skirmish'; diff: Difficulty }
  | { type: 'online'; opponent: string }
  | { type: 'watch'; players: [string, string] };

/** Trận do máy chủ chạy (chơi online hoặc đang xem): không tạm dừng được, kết quả do máy chủ báo. */
export const isNet = (m: Mode) => m.type === 'online' || m.type === 'watch';

/**
 * Một phiên chơi gắn với một canvas: chạy mô phỏng, vẽ, phát âm thanh.
 * Không phụ thuộc Vue; component gọi tick() mỗi khung hình.
 */
export class GameSession {
  renderer: Renderer | null = null;
  running = false;
  speed = 1;
  endShown = false;
  endT = 0;
  tips: { at: number; text: string }[] = [];
  /** Trận cục bộ vừa có người thắng (sau 1.2 giây cho kịp thấy tượng vỡ). */
  onLocalEnd: (winner: Team) => void = () => {};
  onTip: (text: string) => void = () => {};

  constructor(
    readonly mode: Mode,
    readonly match: Match,
  ) {}

  attach(canvas: HTMLCanvasElement): Renderer {
    this.renderer = new Renderer(canvas);
    // Nền sảnh bắt đầu ở phía địch (bên phải) rồi lia dần về phía nền văn minh người chơi
    if (this.mode.type === 'menu') this.renderer.setCamera(WORLD_WIDTH);
    else if (this.mode.type === 'watch') this.renderer.centerOn(WORLD_WIDTH / 2);
    else this.renderer.centerOn(170 + 450);
    return this.renderer;
  }

  get view(): WorldView {
    return this.match.view;
  }

  tick(dt: number): void {
    const r = this.renderer;
    if (!r) return;
    if (this.running) {
      const events = this.match.step(dt * this.speed);
      r.consume(events);
      if (this.mode.type !== 'menu') this.playSounds(events);
    }
    if (this.mode.type === 'menu') this.followAction(dt);
    r.draw(this.match.view, this.running ? dt * this.speed : 0);
    if (this.mode.type === 'menu') return;

    while (this.running && this.tips.length && this.view.time >= this.tips[0].at) this.onTip(this.tips.shift()!.text);
    if (!isNet(this.mode) && this.view.winner !== null && !this.endShown) {
      this.endT += dt;
      if (this.endT > 1.2) {
        this.endShown = true;
        this.running = false;
        this.onLocalEnd(this.view.winner);
      }
    }
  }

  /** Đã lia về tới tượng nhà chưa (sau đó camera mới theo giao tranh). */
  private arrived = false;

  /**
   * Camera nền sảnh: lia từ phải sang trái với tốc độ đều (MENU_PAN đơn vị / giây) về sát tượng nhà bên trái,
   * rồi trôi theo giao tranh nhưng chỉ trong nửa bản đồ nhà (dừng trước vùng chuyển sang phong cảnh địch).
   */
  private followAction(dt: number): void {
    const r = this.renderer!;
    let target = 0;
    if (this.arrived) {
      const fighters = this.view.units.filter((u) => !u.dying && UNITS[u.kind].arch !== 'miner');
      const xs = fighters.map((u) => u.x).sort((a, b) => a - b);
      const fight = xs.length ? xs[Math.floor(xs.length / 2)] - r.viewW / 2 : 0;
      target = Math.max(0, Math.min(WORLD_WIDTH / 2 - BLEND - r.viewW, fight));
    }
    const step = (this.arrived ? MENU_PAN * 0.5 : MENU_PAN) * dt;
    r.setCamera(r.camX + Math.max(-step, Math.min(step, target - r.camX)));
    if (r.camX <= 1) this.arrived = true;
  }

  private playSounds(events: WorldEvent[]): void {
    const r = this.renderer!;
    const visible = (x: number) => x > r.camX - 150 && x < r.camX + r.viewW + 150;
    for (const e of events) {
      switch (e.type) {
        case 'hit':
          if (visible(e.x)) sound.hit();
          break;
        case 'swing':
          if (visible(e.x) && UNITS[e.kind]?.arch !== 'miner') sound.swing();
          break;
        case 'shoot':
          if (visible(e.x)) sound.arrow();
          break;
        case 'explode':
          if (visible(e.x)) sound.explode();
          break;
        case 'death':
        case 'raise':
          if (visible(e.x)) sound.death();
          break;
        case 'gold':
          if (e.team === 0 && visible(e.x)) sound.coin();
          break;
        case 'drop':
          if (visible(e.x)) sound.coin();
          break;
        case 'trained':
        case 'promote':
        case 'built':
          if (e.team === 0) sound.trained();
          break;
        case 'statueHit':
          if (e.team === 0) sound.statueHit();
          break;
        case 'blink':
          if (visible(e.x)) sound.swing();
          break;
      }
    }
  }
}

export function starsFor(v: WorldView): number {
  const t = v.teams[0];
  const ratio = t.statueHp / t.statueMax;
  return ratio >= 0.7 ? 3 : ratio >= 0.35 ? 2 : 1;
}

export function formatTime(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

export type MatchStats = { time: string; kills: number; statue: number };
export const statsOf = (v: WorldView): MatchStats => ({
  time: formatTime(v.time),
  kills: v.teams[0].kills,
  statue: Math.round((v.teams[0].statueHp / v.teams[0].statueMax) * 100),
});
