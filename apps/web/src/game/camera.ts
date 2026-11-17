import { WORLD_WIDTH } from '@nguoi-que/core';
import type { Renderer } from './render/renderer';

/** Kéo màn hình, lăn chuột, chạm bản đồ nhỏ để di chuyển góc nhìn. Trả về hàm gỡ sự kiện. */
export function bindCamera(view: HTMLCanvasElement, mini: HTMLCanvasElement, renderer: () => Renderer | null): () => void {
  let drag: { x: number; cam: number } | null = null;
  const down = (e: PointerEvent) => {
    const r = renderer();
    if (!r) return;
    drag = { x: e.clientX, cam: r.camX };
    view.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const r = renderer();
    if (drag && r) r.setCamera(drag.cam - (e.clientX - drag.x) / r.scale);
  };
  const up = () => (drag = null);
  const wheel = (e: WheelEvent) => {
    const r = renderer();
    if (!r) return;
    e.preventDefault();
    const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
    r.setCamera(r.camX + d / r.scale);
  };
  let miniDrag = false;
  const jump = (e: PointerEvent) => {
    const r = renderer();
    if (!r) return;
    const rect = mini.getBoundingClientRect();
    r.centerOn(((e.clientX - rect.left) / rect.width) * WORLD_WIDTH);
  };
  const miniDown = (e: PointerEvent) => {
    miniDrag = true;
    mini.setPointerCapture(e.pointerId);
    jump(e);
  };
  const miniMove = (e: PointerEvent) => miniDrag && jump(e);
  const miniUp = () => (miniDrag = false);

  view.addEventListener('pointerdown', down);
  view.addEventListener('pointermove', move);
  view.addEventListener('pointerup', up);
  view.addEventListener('pointercancel', up);
  view.addEventListener('wheel', wheel, { passive: false });
  mini.addEventListener('pointerdown', miniDown);
  mini.addEventListener('pointermove', miniMove);
  mini.addEventListener('pointerup', miniUp);
  return () => {
    view.removeEventListener('pointerdown', down);
    view.removeEventListener('pointermove', move);
    view.removeEventListener('pointerup', up);
    view.removeEventListener('pointercancel', up);
    view.removeEventListener('wheel', wheel);
    mini.removeEventListener('pointerdown', miniDown);
    mini.removeEventListener('pointermove', miniMove);
    mini.removeEventListener('pointerup', miniUp);
  };
}

/** Phím A / D hoặc mũi tên để lia góc nhìn. */
export function panByKeys(keys: Set<string>, r: Renderer, dt: number): void {
  let d = 0;
  if (keys.has('a') || keys.has('arrowleft')) d -= 1;
  if (keys.has('d') || keys.has('arrowright')) d += 1;
  if (d) r.setCamera(r.camX + (d * 900 * dt) / Math.max(0.6, r.scale));
}
