<script setup lang="ts">
import { t } from '@stickman-war/i18n';
import { ref, watch } from 'vue';
import { getAccount, type AccountDetail } from '../lib/api';
import { ago, faction, fmtDate, fmtNum, resultLabel } from '../lib/format';
import Avatar from './Avatar.vue';

const props = defineProps<{ id: string }>();
const emit = defineEmits<{ close: [] }>();

const detail = ref<AccountDetail | null>(null);
const error = ref('');

watch(
  () => props.id,
  async (id) => {
    detail.value = null;
    error.value = '';
    try {
      const d = await getAccount(id);
      if (props.id === id) detail.value = d;
    } catch (e) {
      error.value = (e as Error).message;
    }
  },
  { immediate: true },
);

const winRate = (d: AccountDetail) => {
  const n = d.account.wins + d.account.losses + d.account.draws;
  return n ? `${Math.round((d.account.wins / n) * 100)}%` : '—';
};
</script>

<template>
  <aside class="drawer" :aria-label="t('admin.drawer.title')" @keydown.esc="emit('close')">
    <header class="drawer-head">
      <h2>{{ t('admin.drawer.title') }}</h2>
      <button class="btn ghost icon" :aria-label="t('common.close')" @click="emit('close')">✕</button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="!detail" class="muted pad">{{ t('common.loading') }}</p>

    <div v-else class="drawer-body">
      <div class="profile">
        <Avatar :name="detail.account.name" :picture="detail.account.picture" :size="64" />
        <div>
          <div class="profile-name">
            {{ detail.account.name }}
            <span v-if="detail.account.isAdmin" class="badge">Admin</span>
          </div>
          <div class="faction" :style="{ '--fc': faction(detail.account.faction).color }">
            {{ faction(detail.account.faction).icon }} {{ faction(detail.account.faction).name }}
          </div>
        </div>
      </div>

      <dl class="facts">
        <div>
          <dt>{{ t('admin.drawer.id') }}</dt>
          <dd class="mono">{{ detail.account.id }}</dd>
        </div>
        <div>
          <dt>{{ t('admin.drawer.sub') }}</dt>
          <dd class="mono">{{ detail.account.googleSub }}</dd>
        </div>
        <div>
          <dt>{{ t('admin.col.created') }}</dt>
          <dd>{{ fmtDate(detail.account.createdAt) }}</dd>
        </div>
        <div>
          <dt>{{ t('admin.col.lastSeen') }}</dt>
          <dd>{{ fmtDate(detail.account.lastSeen) }} ({{ ago(detail.account.lastSeen) }})</dd>
        </div>
        <div>
          <dt>Elo</dt>
          <dd class="strong">{{ detail.account.rating }}</dd>
        </div>
        <div>
          <dt>{{ t('admin.col.wld') }}</dt>
          <dd>
            {{ detail.account.wins }} / {{ detail.account.losses }} / {{ detail.account.draws }} ·
            {{ t('admin.drawer.winRate', { r: winRate(detail) }) }}
          </dd>
        </div>
        <div>
          <dt>{{ t('admin.drawer.xu') }}</dt>
          <dd>{{ fmtNum(detail.account.xu) }} 🪙</dd>
        </div>
        <div>
          <dt>{{ t('admin.drawer.activeSessions') }}</dt>
          <dd>{{ detail.sessions.length }}</dd>
        </div>
      </dl>

      <h3>{{ t('admin.drawer.sessions') }}</h3>
      <ul v-if="detail.sessions.length" class="sessions">
        <li v-for="(s, i) in detail.sessions" :key="i">
          {{ t('admin.drawer.session', { a: fmtDate(s.createdAt), b: fmtDate(s.expiresAt) }) }}
        </li>
      </ul>
      <p v-else class="muted">{{ t('admin.drawer.noSessions') }}</p>

      <h3>{{ t('admin.drawer.history', { n: detail.account.matches }) }}</h3>
      <table v-if="detail.history.length" class="history">
        <thead>
          <tr>
            <th>{{ t('admin.drawer.at') }}</th>
            <th>{{ t('admin.drawer.result') }}</th>
            <th>{{ t('admin.drawer.opponent') }}</th>
            <th class="num">Elo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in detail.history" :key="i">
            <td>{{ fmtDate(m.at) }}</td>
            <td>
              <span :class="m.result">{{ resultLabel(m.result) }}</span>
              <span class="muted small"> {{ faction(m.faction).icon }} vs {{ faction(m.vsFaction).icon }}</span>
            </td>
            <td>{{ m.vs }}</td>
            <td class="num" :class="m.rating > 0 ? 'win' : m.rating < 0 ? 'lose' : ''">{{ m.rating > 0 ? '+' : '' }}{{ m.rating }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">{{ t('admin.drawer.noHistory') }}</p>
      <p class="muted small">{{ t('admin.drawer.noEmail') }}</p>
    </div>
  </aside>
</template>
