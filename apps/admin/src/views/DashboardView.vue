<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { getStats, listAccounts, logout, state, type AccountPage, type Sort, type Stats } from '../lib/api';
import AccountDrawer from '../components/AccountDrawer.vue';
import AccountsTable from '../components/AccountsTable.vue';
import Avatar from '../components/Avatar.vue';
import StatsCards from '../components/StatsCards.vue';

const SORTS: { id: Sort; label: string }[] = [
  { id: 'createdAt', label: 'Mới đăng ký' },
  { id: 'lastSeen', label: 'Mới vào gần đây' },
  { id: 'rating', label: 'Elo cao nhất' },
  { id: 'name', label: 'Tên A → Z' },
];

const stats = ref<Stats | null>(null);
const page = ref<AccountPage | null>(null);
const q = ref('');
const sort = ref<Sort>('createdAt');
const pageNo = ref(1);
const loading = ref(false);
const error = ref('');
const selected = ref<string | null>(null);

const pages = computed(() => (page.value ? Math.max(1, Math.ceil(page.value.total / page.value.pageSize)) : 1));

let seq = 0;
async function load() {
  const my = ++seq;
  loading.value = true;
  error.value = '';
  try {
    const [s, p] = await Promise.all([getStats(), listAccounts(q.value.trim(), sort.value, pageNo.value)]);
    if (my !== seq) return;
    stats.value = s;
    page.value = p;
  } catch (e) {
    if (my === seq) error.value = (e as Error).message;
  } finally {
    if (my === seq) loading.value = false;
  }
}

let debounce: ReturnType<typeof setTimeout> | undefined;
watch(q, () => {
  clearTimeout(debounce);
  debounce = setTimeout(() => {
    pageNo.value = 1;
    void load();
  }, 300);
});
watch(sort, () => {
  pageNo.value = 1;
  void load();
});
watch(pageNo, () => void load());

// Số online đổi liên tục: tự làm mới mỗi 30 giây khi tab đang mở
let timer: ReturnType<typeof setInterval> | undefined;
onMounted(() => {
  void load();
  timer = setInterval(() => document.visibilityState === 'visible' && void load(), 30_000);
});
onBeforeUnmount(() => {
  clearInterval(timer);
  clearTimeout(debounce);
});
</script>

<template>
  <div class="shell" :class="{ 'with-drawer': selected }">
    <header class="topbar">
      <div class="brand">
        <span class="brand-mark">⚔</span>
        <span>Stickman War <small>Quản trị</small></span>
      </div>
      <div class="me">
        <template v-if="state.who?.via === 'google'">
          <Avatar :name="state.who.name" :picture="state.who.picture" :size="28" />
          <span class="me-name">{{ state.who.name }}</span>
        </template>
        <span v-else class="me-name muted">Đăng nhập bằng mã quản trị</span>
        <button class="btn ghost" @click="logout">Đăng xuất</button>
      </div>
    </header>

    <main class="content">
      <StatsCards :stats="stats" />

      <section class="panel">
        <div class="toolbar">
          <h1>
            Tài khoản đã đăng ký <span v-if="page" class="count">{{ page.total }}</span>
          </h1>
          <div class="filters">
            <input v-model="q" class="search" type="search" placeholder="Tìm theo tên hoặc mã tài khoản…" aria-label="Tìm tài khoản" />
            <select v-model="sort" aria-label="Sắp xếp">
              <option v-for="s in SORTS" :key="s.id" :value="s.id">{{ s.label }}</option>
            </select>
            <button class="btn ghost" :disabled="loading" @click="load">Làm mới</button>
          </div>
        </div>

        <p v-if="error" class="error" role="alert">{{ error }}</p>
        <AccountsTable :accounts="page?.accounts ?? []" :loading="loading" :selected="selected" @open="selected = $event" />

        <nav v-if="pages > 1" class="pager" aria-label="Trang">
          <button class="btn ghost" :disabled="pageNo <= 1" @click="pageNo--">‹ Trước</button>
          <span>Trang {{ pageNo }} / {{ pages }}</span>
          <button class="btn ghost" :disabled="pageNo >= pages" @click="pageNo++">Sau ›</button>
        </nav>
      </section>
    </main>

    <AccountDrawer v-if="selected" :id="selected" @close="selected = null" />
  </div>
</template>
