<script setup lang="ts">
import type { UnitKind } from '@nguoi-que/core';
import { onMounted, ref, watch } from 'vue';
import { drawIcon } from '../game/icons';

/** Icon một loại quân vẽ bằng Canvas (người que thân sáng). */
const props = defineProps<{ kind: UnitKind }>();
const canvas = ref<HTMLCanvasElement>();
const paint = () => canvas.value && drawIcon(canvas.value, props.kind);
onMounted(paint);
watch(() => props.kind, paint);
</script>

<template>
  <canvas ref="canvas" />
</template>
