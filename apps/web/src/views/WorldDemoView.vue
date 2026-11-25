<script setup lang="ts">
import { t } from '@stickman-war/i18n';
import { useRouter } from 'vue-router';
import WorldDemo from '../components/WorldDemo.vue';

/** Trang riêng demo thế giới nhìn từ trên (#/world): Thợ mỏ đi lại trong làng pixel art. */
const router = useRouter();
</script>

<template>
  <div class="world-page">
    <header class="world-head">
      <button class="btn btn-ghost" @click="router.push('/')">{{ t('worldDemo.back') }}</button>
      <h1>{{ t('worldDemo.title') }}</h1>
    </header>
    <WorldDemo />
  </div>
</template>
