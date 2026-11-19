import { WORLD_WIDTH } from '@stickman-war/core';
import type { Renderer } from './render/renderer';

// Nhấc tay khi mới kéo chưa quá chừng này px thì tính là chạm (không phải kéo màn hình)
const TAP_SLOP = 8;

/**
 * Kéo màn hình, lăn chuột, chạm bản đồ nhỏ để di chuyển góc nhìn. Trả về hàm gỡ sự kiện.
 * onTap(x): chạm (không kéo) vào chiến trường hoặc bản đồ nhỏ tại toạ độ x; trả về true nếu đã xử lý
 * (vd. cắm cờ), khi đó chạm bản đồ nhỏ không lia góc nhìn nữa.
 */
export function bindCamera(
  view: HTMLCanvasElement,
  mini: HTMLCanvasElement,
  renderer: () => Renderer | null,
  onTap: (x: number) => boolean = () => false,
): () => void {
  let drag: { x: number; cam: number; moved: number } | null = null;
  const down = (e: PointerEvent) => {
    const r = renderer();
    if (!r) return;
    drag = { x: e.clientX, cam: r.camX, moved: 0 };
    view.setPointerCapture(e.pointerId);
  };
  const move = (e: PointerEvent) => {
    const r = renderer();
    if (!drag || !r) return;
    drag.moved = Math.max(drag.moved, Math.abs(e.clientX - drag.x));
    r.setCamera(drag.cam - (e.clientX - drag.x) / r.scale);
  };
  const up = (e: PointerEvent) => {
    const r = renderer();
    if (drag && r && e.type === 'pointerup' && drag.moved < TAP_SLOP) {
      const rect = view.getBoundingClientRect();
      onTap(r.camX + (e.clientX - rect.left) / r.scale);
    }
    drag = null;
  };
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
    const rect = mini.getBoundingClientRect();
    if (onTap(((e.clientX - rect.left) / rect.width) * WORLD_WIDTH)) return;
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
