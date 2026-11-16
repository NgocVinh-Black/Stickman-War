<script setup lang="ts">
import { ref } from 'vue';

defineProps<{ name: string; picture: string; size?: number }>();
const broken = ref(false);
</script>

<template>
  <span class="avatar" :style="{ width: `${size ?? 32}px`, height: `${size ?? 32}px` }">
    <img v-if="picture && !broken" :src="picture" alt="" referrerpolicy="no-referrer" @error="broken = true" />
    <span v-else>{{ name.slice(0, 1).toUpperCase() }}</span>
  </span>
</template>
