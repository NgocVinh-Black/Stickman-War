import { UNITS, type UnitKind } from '@stickman-war/core';
import { TEAM_COLORS } from './render/renderer';
import { drawStickman } from './render/stickman';

/** Vẽ icon một loại quân (thân sáng trên nền tối) vào canvas 48×48. */
export function drawIcon(canvas: HTMLCanvasElement, kind: UnitKind): void {
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
    ink: '#f1f4fa',
    accent: TEAM_COLORS[0].accent,
    flash: false,
    icon: true,
  });
}
