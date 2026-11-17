<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { demoMatch } from '../game/match';
import { GameSession } from '../game/session';
import { useSettings } from '../stores/settings';

/**
 * Nền sảnh / phòng chờ: hai phe cùng tộc người chơi đang chọn đánh nhau do máy điều khiển,
 * camera trôi theo giao tranh. Đổi tộc thì trận nền dựng lại ngay theo tộc mới.
 */
const settings = useSettings();
const canvas = ref<HTMLCanvasElement>();
let session: GameSession | null = null;
let raf = 0;
let last = performance.now();

function fresh(): void {
  session = new GameSession({ type: 'menu' }, demoMatch(settings.faction));
  session.running = true;
  if (canvas.value) session.attach(canvas.value);
}

function frame(t: number): void {
  const dt = Math.min((t - last) / 1000, 0.1);
  last = t;
  session?.tick(dt);
  if (session && session.view.winner !== null) fresh();
  raf = requestAnimationFrame(frame);
}

const onResize = () => session?.renderer?.resize();

onMounted(() => {
  fresh();
  raf = requestAnimationFrame(frame);
  window.addEventListener('resize', onResize);
});
watch(
  () => settings.faction,
  () => fresh(),
);
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <canvas ref="canvas" class="bg-canvas" />
</template>
