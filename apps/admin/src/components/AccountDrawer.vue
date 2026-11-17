<script setup lang="ts">
import { ref, watch } from 'vue';
import { getAccount, type AccountDetail } from '../api';
import { RESULT_LABEL, ago, faction, fmtDate, fmtNum } from '../format';
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
  <aside class="drawer" aria-label="Chi tiết tài khoản" @keydown.esc="emit('close')">
    <header class="drawer-head">
      <h2>Chi tiết tài khoản</h2>
      <button class="btn ghost icon" aria-label="Đóng" @click="emit('close')">✕</button>
    </header>

    <p v-if="error" class="error">{{ error }}</p>
    <p v-else-if="!detail" class="muted pad">Đang tải…</p>

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
          <dt>Mã tài khoản</dt>
          <dd class="mono">{{ detail.account.id }}</dd>
        </div>
        <div>
          <dt>Mã Google (sub)</dt>
          <dd class="mono">{{ detail.account.googleSub }}</dd>
        </div>
        <div>
          <dt>Đăng ký</dt>
          <dd>{{ fmtDate(detail.account.createdAt) }}</dd>
        </div>
        <div>
          <dt>Lần cuối vào</dt>
          <dd>{{ fmtDate(detail.account.lastSeen) }} ({{ ago(detail.account.lastSeen) }})</dd>
        </div>
        <div>
          <dt>Elo</dt>
          <dd class="strong">{{ detail.account.rating }}</dd>
        </div>
        <div>
          <dt>Thắng / Thua / Hoà</dt>
          <dd>{{ detail.account.wins }} / {{ detail.account.losses }} / {{ detail.account.draws }} · tỉ lệ thắng {{ winRate(detail) }}</dd>
        </div>
        <div>
          <dt>Xu ảo</dt>
          <dd>{{ fmtNum(detail.account.xu) }} 🪙</dd>
        </div>
        <div>
          <dt>Phiên đăng nhập còn hạn</dt>
          <dd>{{ detail.sessions.length }}</dd>
        </div>
      </dl>

      <h3>Phiên đăng nhập</h3>
      <ul v-if="detail.sessions.length" class="sessions">
        <li v-for="(s, i) in detail.sessions" :key="i">Đăng nhập {{ fmtDate(s.createdAt) }} · hết hạn {{ fmtDate(s.expiresAt) }}</li>
      </ul>
      <p v-else class="muted">Không còn phiên nào (đã đăng xuất hoặc hết hạn).</p>

      <h3>Lịch sử trận online ({{ detail.account.matches }})</h3>
      <table v-if="detail.history.length" class="history">
        <thead>
          <tr>
            <th>Lúc</th>
            <th>Kết quả</th>
            <th>Đối thủ</th>
            <th class="num">Elo</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(m, i) in detail.history" :key="i">
            <td>{{ fmtDate(m.at) }}</td>
            <td>
              <span :class="m.result">{{ RESULT_LABEL[m.result] }}</span>
              <span class="muted small"> {{ faction(m.faction).icon }} vs {{ faction(m.vsFaction).icon }}</span>
            </td>
            <td>{{ m.vs }}</td>
            <td class="num" :class="m.rating > 0 ? 'win' : m.rating < 0 ? 'lose' : ''">{{ m.rating > 0 ? '+' : '' }}{{ m.rating }}</td>
          </tr>
        </tbody>
      </table>
      <p v-else class="muted">Chưa chơi trận online nào.</p>
      <p class="muted small">Máy chủ không lưu email Google của người chơi.</p>
    </div>
  </aside>
</template>
