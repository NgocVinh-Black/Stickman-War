<script setup lang="ts">
import type { FactionId } from '@stickman-war/core';
import { onMounted, ref, watch } from 'vue';
import { drawEmblem } from '../game/icons';

/** Huy hiệu nền văn minh vẽ bằng Canvas (chiến binh bóng đen toả sáng màu nền văn minh trong vòng tròn). */
const props = withDefaults(defineProps<{ faction: FactionId; size?: number }>(), { size: 40 });
const canvas = ref<HTMLCanvasElement>();
const paint = () => canvas.value && drawEmblem(canvas.value, props.faction, props.size);
onMounted(paint);
watch(() => [props.faction, props.size], paint);
</script>

<template>
  <canvas ref="canvas" class="civ-emblem" :style="{ width: `${size}px`, height: `${size}px` }" />
</template>
