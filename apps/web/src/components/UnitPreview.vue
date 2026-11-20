<script setup lang="ts">
import { FACTIONS, UNITS, type UnitKind } from '@stickman-war/core';
import { onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { drawShowcase, unitBox } from '../game/showcase';

/** Một quân vẽ động (đi bộ → ra đòn → đứng, lặp lại), co giãn vừa khung và không tràn mép. */
const props = defineProps<{ kind: UnitKind }>();
const canvas = ref<HTMLCanvasElement>();
const LOOP = 3.2;
let raf = 0;
let start = performance.now();
watch(
  () => props.kind,
  () => (start = performance.now()),
);

function frame(now: number): void {
  const el = canvas.value;
  const ctx = el?.getContext('2d');
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
    const k = props.kind;
    const b = unitBox(k);
    const s = Math.min(3.2, (w - 16) / (b.x1 - b.x0), (h - 18) / (b.y1 - b.y0));
    const x = w / 2 - ((b.x0 + b.x1) / 2) * s;
    const y = h - 10 - b.y1 * s;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.beginPath();
    ctx.ellipse(w / 2, y, Math.max(18, ((b.x1 - b.x0) * s) / 2.4), 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.translate(x, y);
    ctx.scale(s, s);
    const sec = ((now - start) / 1000) % LOOP;
    drawShowcase(ctx, k, sec, now, { accent: FACTIONS[UNITS[k].faction].color, ink: '#f1f4fa', icon: true, time: now / 1000 });
  }
  raf = requestAnimationFrame(frame);
}

onMounted(() => (raf = requestAnimationFrame(frame)));
onBeforeUnmount(() => cancelAnimationFrame(raf));
</script>

<template>
  <canvas ref="canvas" class="unit-preview" />
</template>
