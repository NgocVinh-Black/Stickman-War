<script setup lang="ts">
import type { UnitKind } from '@stickman-war/core';
import { onMounted, ref, watch } from 'vue';
import { drawIcon } from '../game/icons';

/** Icon một loại quân vẽ bằng Canvas (stickman thân sáng). */
const props = defineProps<{ kind: UnitKind }>();
const canvas = ref<HTMLCanvasElement>();
const paint = () => canvas.value && drawIcon(canvas.value, props.kind);
onMounted(paint);
watch(() => props.kind, paint);
</script>

<template>
  <canvas ref="canvas" />
</template>
