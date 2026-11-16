<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';
import { demoMatch } from '../game/match';
import { GameSession } from '../game/session';

/** Nền sảnh / phòng chờ: hai tộc ngẫu nhiên do máy đánh nhau, camera trôi theo giao tranh. */
const canvas = ref<HTMLCanvasElement>();
let session: GameSession | null = null;
let raf = 0;
let last = performance.now();

function fresh(): void {
  session = new GameSession({ type: 'menu' }, demoMatch());
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
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <canvas ref="canvas" class="bg-canvas" />
</template>
