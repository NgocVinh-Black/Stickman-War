<script setup lang="ts">
import { t } from '@stickman-war/i18n';
import { computed } from 'vue';
import type { Stats } from '../lib/api';
import { fmtNum } from '../lib/format';

const props = defineProps<{ stats: Stats | null }>();

const cards = computed(() => {
  const s = props.stats;
  if (!s) return [];
  return [
    { label: t('admin.stats.accounts'), value: s.accounts, sub: t('admin.stats.admins', { n: fmtNum(s.admins) }) },
    { label: t('admin.stats.newToday'), value: s.newToday, sub: t('admin.stats.new7d', { n: fmtNum(s.new7d) }) },
    { label: t('admin.stats.active7d'), value: s.active7d, sub: t('admin.stats.sessions', { n: fmtNum(s.activeSessions) }) },
    { label: t('admin.stats.online'), value: s.online.players, sub: t('admin.stats.rooms', { n: fmtNum(s.online.rooms) }) },
    { label: t('admin.stats.matches'), value: s.matches, sub: t('admin.stats.perAccount') },
  ];
});
</script>

<template>
  <section class="stats" :aria-label="t('admin.statsLabel')">
    <article v-for="c in cards" :key="c.label" class="stat">
      <span class="stat-label">{{ c.label }}</span>
      <strong class="stat-value">{{ fmtNum(c.value) }}</strong>
      <span class="stat-sub">{{ c.sub }}</span>
    </article>
    <template v-if="!stats">
      <article v-for="i in 5" :key="i" class="stat skeleton" />
    </template>
  </section>
</template>
