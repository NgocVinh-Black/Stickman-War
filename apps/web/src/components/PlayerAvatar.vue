<script setup lang="ts">
import { computed } from 'vue';

/** Ảnh đại diện Google, không có thì chữ cái đầu của tên. */
const props = defineProps<{ picture?: string; name: string }>();
const url = computed(() => (props.picture?.startsWith('https://') ? props.picture : ''));
const initial = computed(() => (props.name.trim()[0] ?? '?').toUpperCase());
</script>

<template>
  <img v-if="url" class="avatar" :src="url" alt="" referrerpolicy="no-referrer" />
  <span v-else class="avatar">{{ initial }}</span>
</template>
