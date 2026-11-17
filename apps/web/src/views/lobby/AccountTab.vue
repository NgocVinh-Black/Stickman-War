<script setup lang="ts">
import { FACTIONS } from '@stickman-war/core';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import PlayerAvatar from '../../components/PlayerAvatar.vue';
import { sound } from '../../lib/sound';
import { auth, logout, refreshMe, renderGoogleButton, updateProfile } from '../../net/account';
import { useSettings } from '../../stores/settings';
import { useUi } from '../../stores/ui';

/** Tài khoản: hồ sơ Google, điểm, lịch sử trận, đổi tên, đăng xuất; chưa đăng nhập thì nút Google + tên khách. */
const settings = useSettings();
const ui = useUi();
const router = useRouter();
const a = computed(() => auth.account);
const rate = computed(() => {
  const x = a.value;
  const games = x ? x.wins + x.losses + x.draws : 0;
  return games ? Math.round((x!.wins / games) * 100) : 0;
});
const accName = ref(a.value?.name ?? '');
watch(a, (x) => (accName.value = x?.name ?? ''));
const guestName = ref(settings.name);
const gbtn = ref<HTMLElement>();
const reason = computed(() =>
  !auth.reachable
    ? 'Không kết nối được máy chủ online, nên chưa đăng nhập được. Bạn vẫn chơi offline bình thường.'
    : !auth.clientId
      ? 'Máy chủ chưa bật đăng nhập Google (chưa đặt GOOGLE_CLIENT_ID). Bạn vẫn chơi được bằng tài khoản khách.'
      : '',
);

async function doLogout(): Promise<void> {
  sound.click();
  await logout();
  ui.toast('Đã đăng xuất', 1500);
  settings.guest = false;
  void router.push('/login');
}
function saveName(): void {
  updateProfile({ name: accName.value })
    .then(() => ui.toast('Đã lưu tên', 1200))
    .catch(() => ui.toast('Không lưu được, thử lại sau', 2000));
}
function saveGuest(): void {
  settings.setName(guestName.value);
  guestName.value = settings.name;
}
const paintGoogle = () => {
  if (!a.value && auth.clientId && gbtn.value) void renderGoogleButton(gbtn.value, (msg) => ui.toast(msg, 3000));
};
onMounted(() => {
  if (a.value) void refreshMe();
  paintGoogle();
});
watch(() => auth.clientId, paintGoogle);
</script>

<template>
  <template v-if="a">
    <div class="home-profile" :style="{ '--faction': FACTIONS[a.faction]?.color ?? 'var(--ally)' }">
      <PlayerAvatar :picture="a.picture" :name="a.name" />
      <div class="home-profile-text">
        <b>{{ a.name }}</b><small>Đăng nhập bằng Google</small>
      </div>
      <button class="btn btn-small" @click="doLogout">Đăng xuất</button>
    </div>
    <div class="stat-grid">
      <div>
        <b>{{ a.rating }}</b><small>Điểm xếp hạng</small>
      </div>
      <div>
        <b>{{ a.wins }}</b><small>Thắng</small>
      </div>
      <div>
        <b>{{ a.losses }}</b><small>Thua</small>
      </div>
      <div>
        <b>{{ rate }}%</b><small>Tỉ lệ thắng</small>
      </div>
      <div>
        <b>{{ auth.xu ?? '–' }}</b><small>Xu 🪙</small>
      </div>
      <div>
        <b>{{ FACTIONS[a.faction]?.icon }}</b><small>{{ FACTIONS[a.faction]?.name }}</small>
      </div>
    </div>
    <label class="field">
      <span>Tên hiển thị</span>
      <div class="join-row"><input v-model="accName" maxlength="16" /><button class="btn" @click="saveName">Lưu</button></div>
    </label>
    <h2 class="section-title">Trận gần đây</h2>
    <ul v-if="a.history.length" class="history">
      <li v-for="(h, i) in a.history" :key="i" :class="h.result">
        <span>{{ h.result === 'win' ? '🏆 Thắng' : h.result === 'lose' ? '💀 Thua' : '🤝 Hoà' }}</span>
        <span
          >{{ FACTIONS[h.faction]?.icon }} vs {{ FACTIONS[h.vsFaction]?.icon }} <b>{{ h.vs }}</b></span
        >
        <small>{{ h.rating > 0 ? '+' : '' }}{{ h.rating }} · {{ new Date(h.at).toLocaleDateString('vi-VN') }}</small>
      </li>
    </ul>
    <p v-else class="muted">Chưa có trận online nào. Vào mục Online để đấu!</p>
  </template>
  <template v-else>
    <div class="login-box">
      <h3>Đăng nhập để lưu thành tích</h3>
      <ul class="news">
        <li>🏆 Điểm xếp hạng và lịch sử trận online</li>
        <li>🪙 Xu bắt kèo đi theo tài khoản, đổi máy vẫn còn</li>
        <li>🏳️ Nhớ tộc ưa thích và tên hiển thị</li>
      </ul>
      <div ref="gbtn" class="google-btn" />
      <p class="muted">{{ reason || 'Game chỉ lưu tên và ảnh đại diện Google, không lưu email.' }}</p>
    </div>
    <label class="field">
      <span>Tên khi chơi khách</span>
      <input v-model="guestName" maxlength="16" @change="saveGuest" />
    </label>
  </template>
</template>
