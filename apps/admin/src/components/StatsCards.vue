<script setup lang="ts">
import { computed } from 'vue';
import type { Stats } from '../lib/api';
import { fmtNum } from '../lib/format';

const props = defineProps<{ stats: Stats | null }>();

const cards = computed(() => {
  const s = props.stats;
  if (!s) return [];
  return [
    { label: 'Tài khoản Google', value: s.accounts, sub: `${fmtNum(s.admins)} quản trị viên` },
    { label: 'Mới hôm nay', value: s.newToday, sub: `${fmtNum(s.new7d)} trong 7 ngày` },
    { label: 'Hoạt động 7 ngày', value: s.active7d, sub: `${fmtNum(s.activeSessions)} phiên còn hạn` },
    { label: 'Đang online', value: s.online.players, sub: `${fmtNum(s.online.rooms)} phòng đang mở` },
    { label: 'Lượt trận đã ghi', value: s.matches, sub: 'tính theo từng tài khoản' },
  ];
});
</script>

<template>
  <section class="stats" aria-label="Thống kê">
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
