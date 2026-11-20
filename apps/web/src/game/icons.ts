import { UNITS, kindOf, type FactionId, type UnitKind } from '@stickman-war/core';
import { ENERGY } from './render/palette';
import { TEAM_COLORS } from './render/renderer';
import { drawStickman } from './render/stickman';

/**
 * Vẽ icon một loại quân vào canvas 48×48 theo phong cách ảnh nền: quầng sáng màu năng lượng nền văn minh phía sau,
 * bóng stickman đen viền sáng (mặc định màu phe mình), mắt và vũ khí phát sáng.
 */
export function drawIcon(canvas: HTMLCanvasElement, kind: UnitKind, accent: string = TEAM_COLORS[0].accent): void {
  const size = 48;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const s = UNITS[kind];
  const a = s.arch;
  // Quầng sáng phía sau
  const e = s.look.tint ?? ENERGY[s.faction];
  const g = ctx.createRadialGradient(size / 2, size * 0.55, 2, size / 2, size * 0.55, size * 0.5);
  g.addColorStop(0, `${e}66`);
  g.addColorStop(1, `${e}00`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const k =
    (a === 'giant' ? 0.62 : a === 'cavalry' ? 0.6 : a === 'catapult' ? 0.72 : a === 'tower' ? 0.5 : 0.78) /
    Math.max(0.85, s.scale > 1.5 ? 1 : s.scale);
  ctx.translate(size / 2 - (a === 'cavalry' ? 0 : 2), size - 3);
  ctx.scale(k, k);
  drawStickman(ctx, {
    kind,
    walk: 0,
    moving: false,
    attack: a === 'archer' ? 0.9 : -1,
    mining: -1,
    carrying: false,
    ink: TEAM_COLORS[0].ink,
    accent,
    flash: false,
    icon: true,
    time: 0.4,
  });
}

/**
 * Huy hiệu nền văn minh (thay emoji): đĩa tối viền vòng năng lượng, chiến binh kiếm của nền văn minh đang vung
 * đòn, viền sáng và vệt chém màu năng lượng — như các nhân vật toả sáng trong ảnh nền.
 */
export function drawEmblem(canvas: HTMLCanvasElement, faction: FactionId, size: number): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.round(size * dpr);
  canvas.height = Math.round(size * dpr);
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, size, size);
  const e = ENERGY[faction];
  const r = size / 2;
  const bg = ctx.createRadialGradient(r, r * 0.8, 1, r, r, r);
  bg.addColorStop(0, `${e}88`);
  bg.addColorStop(0.55, '#1a1430');
  bg.addColorStop(1, '#07050d');
  ctx.fillStyle = bg;
  ctx.beginPath();
  ctx.arc(r, r, r - 1, 0, Math.PI * 2);
  ctx.fill();
  ctx.save();
  ctx.beginPath();
  ctx.arc(r, r, r - 2, 0, Math.PI * 2);
  ctx.clip();
  const k = size / 66;
  ctx.translate(r - 2 * k, size * 0.98);
  ctx.scale(k, k);
  drawStickman(ctx, {
    kind: kindOf(faction, 'sword'),
    walk: 0,
    moving: false,
    attack: 0.62,
    mining: -1,
    carrying: false,
    ink: TEAM_COLORS[0].ink,
    accent: e,
    flash: false,
    icon: true,
    time: 0.8,
  });
  ctx.restore();
  ctx.strokeStyle = e;
  ctx.lineWidth = Math.max(1.5, size / 26);
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(r, r, r - ctx.lineWidth / 2 - 0.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.globalAlpha = 1;
}
