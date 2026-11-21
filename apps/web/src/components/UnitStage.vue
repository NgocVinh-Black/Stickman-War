<script setup lang="ts">
import { FACTIONS, UNITS, roster, type FactionId } from '@stickman-war/core';
import { unitName } from '@stickman-war/i18n/content';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { CLOTH } from '../game/render/palette';
import { viewScale } from '../game/render/renderer';
import { drawShowcase, unitBox } from '../game/showcase';

/**
 * Sân khấu giữa sảnh: lần lượt đủ 12 quân của nền văn minh, vẽ đúng cỡ như trong trận (cùng tỉ lệ với chiến
 * trường nền sảnh, quân to vẽ to) để người xem hình dung. Quân quá to so với khung mới thu lại cho vừa.
 * Mỗi quân SHOW_SECONDS giây (đi bộ → ra đòn → đứng), bấm để sang quân tiếp.
 */
const props = defineProps<{ faction: FactionId }>();
const fd = computed(() => FACTIONS[props.faction]);
const units = computed(() => roster(props.faction));
const idx = ref(0);
const kind = computed(() => units.value[idx.value % units.value.length]);
const canvas = ref<HTMLCanvasElement>();
const SHOW_SECONDS = 3.2;
const LABEL = 26; // chừa chỗ nhãn tên dưới chân
let raf = 0;
let shownAt = performance.now();

watch(
  () => props.faction,
  () => {
    idx.value = 0;
    shownAt = performance.now();
  },
);

function next(): void {
  idx.value = (idx.value + 1) % units.value.length;
  shownAt = performance.now();
}

function frame(now: number): void {
  const el = canvas.value;
  const ctx = el?.getContext('2d');
  const sec = (now - shownAt) / 1000;
  if (sec > SHOW_SECONDS) next();
  if (el && ctx && el.clientWidth > 0) {
    const w = el.clientWidth;
    const h = el.clientHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    if (el.width !== Math.round(w * dpr) || el.height !== Math.round(h * dpr)) {
      el.width = Math.round(w * dpr);
      el.height = Math.round(h * dpr);
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const k = kind.value;
    const b = unitBox(k);
    // Cỡ trong trận = tỉ lệ chiến trường (theo cửa sổ, như nền sảnh) × cỡ riêng của quân
    let s = viewScale(window.innerWidth, window.innerHeight) * UNITS[k].scale;
    s = Math.min(s, (w - 16) / (b.x1 - b.x0), (h - LABEL - 6) / (b.y1 - b.y0));
    const x = w / 2 - ((b.x0 + b.x1) / 2) * s;
    const y = h - LABEL - b.y1 * s;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.beginPath();
    ctx.ellipse(w / 2, y, Math.max(20, ((b.x1 - b.x0) * s) / 2.4), 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(x, y);
    ctx.scale(s, s);
    drawShowcase(ctx, k, sec, now, { accent: CLOTH[UNITS[k].faction] ?? fd.value.color });
  }
  raf = requestAnimationFrame(frame);
}

onMounted(() => (raf = requestAnimationFrame(frame)));
onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>

<template>
  <button class="unit-stage" :style="{ '--faction': fd.color }" :title="unitName(kind)" @click="next">
    <canvas ref="canvas" />
    <span class="unit-stage-name">
      <b>{{ unitName(kind) }}</b> <small>{{ (idx % units.length) + 1 }}/{{ units.length }}</small>
    </span>
  </button>
</template>
