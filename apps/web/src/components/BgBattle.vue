<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { demoMatch } from '../game/match';
import { GameSession } from '../game/session';
import { useSettings } from '../stores/settings';

/**
 * Nền sảnh / phòng chờ: nền văn minh người chơi đang chọn (bên trái) đánh đối thủ ở màn chiến dịch kế tiếp
 * (bên phải), bản đồ chia đôi phong cảnh hai bên. Camera trôi theo giao tranh; đổi nền văn minh thì dựng lại.
 */
const settings = useSettings();
const BG_SPEED = 1.35;
const canvas = ref<HTMLCanvasElement>();
let session: GameSession | null = null;
let raf = 0;
let last = performance.now();

function fresh(): void {
  const enemy = settings.campFaction === settings.faction ? settings.enemyFactions[settings.nextLevel] : undefined;
  session = new GameSession({ type: 'menu' }, demoMatch(settings.faction, enemy));
  session.running = true;
  // Trận nền chạy nhanh hơn trận thật một chút cho đỡ chậm
  session.speed = BG_SPEED;
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
