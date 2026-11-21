<script setup lang="ts">
import type { UnitKind } from '@stickman-war/core';
import { onMounted, ref, watch } from 'vue';
import { drawIcon } from '../game/icons';

/** Icon một loại quân vẽ bằng Canvas (bóng stickman viền sáng; `accent` = màu viền, mặc định màu vải của nền văn minh). */
const props = defineProps<{ kind: UnitKind; accent?: string }>();
const canvas = ref<HTMLCanvasElement>();
const paint = () => canvas.value && drawIcon(canvas.value, props.kind, props.accent);
onMounted(paint);
watch(() => [props.kind, props.accent], paint);
</script>

<template>
  <canvas ref="canvas" />
</template>
