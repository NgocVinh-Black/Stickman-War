<script setup lang="ts">
import { t } from '@stickman-war/i18n';
import { onMounted, ref, watchEffect } from 'vue';
import { restore, state } from './lib/api';
import DashboardView from './views/DashboardView.vue';
import LoginView from './views/LoginView.vue';

const ready = ref(false);
// Tiêu đề tab theo ngôn ngữ
watchEffect(() => (document.title = t('admin.pageTitle')));
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
