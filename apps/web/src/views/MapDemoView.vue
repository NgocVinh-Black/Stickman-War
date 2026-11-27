<script setup lang="ts">
import { t } from '@stickman-war/i18n';
import { useRouter } from 'vue-router';
import MapDemo from '../components/MapDemo.vue';

/** Trang riêng demo bản đồ nhìn từ trên (#/map-demo): máy đấu máy trên nền map Quang / Phong. */
const router = useRouter();
</script>

<template>
  <div class="world-page">
    <header class="world-head">
      <button class="btn btn-ghost" @click="router.push('/')">{{ t('worldDemo.back') }}</button>
      <h1>{{ t('mapDemo.title') }}</h1>
    </header>
    <MapDemo />
  </div>
</template>
