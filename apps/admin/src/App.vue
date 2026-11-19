<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { restore, state } from './lib/api';
import DashboardView from './views/DashboardView.vue';
import LoginView from './views/LoginView.vue';

const ready = ref(false);
onMounted(async () => {
  await restore();
  ready.value = true;
});
</script>

<template>
  <template v-if="ready">
    <DashboardView v-if="state.who" />
    <LoginView v-else />
  </template>
</template>
