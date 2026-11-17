<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { restore, state } from './api';
import Dashboard from './components/Dashboard.vue';
import LoginScreen from './components/LoginScreen.vue';

const ready = ref(false);
onMounted(async () => {
  await restore();
  ready.value = true;
});
</script>

<template>
  <template v-if="ready">
    <Dashboard v-if="state.who" />
    <LoginScreen v-else />
  </template>
</template>
