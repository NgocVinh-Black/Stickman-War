<script setup lang="ts">
import { civName } from '@stickman-war/i18n/content';
import { FACTIONS } from '@stickman-war/core';
import { computed, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import PlayerAvatar from '../../components/PlayerAvatar.vue';
import { lang, t } from '@stickman-war/i18n';
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
const reason = computed(() => (!auth.reachable ? t('account.noServer') : !auth.clientId ? t('account.noGoogle') : ''));

async function doLogout(): Promise<void> {
  sound.click();
  await logout();
  ui.toast(t('account.loggedOut'), 1500);
  settings.guest = false;
  void router.push('/login');
}
function saveName(): void {
  updateProfile({ name: accName.value })
    .then(() => ui.toast(t('account.nameSaved'), 1200))
    .catch(() => ui.toast(t('account.saveFail'), 2000));
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
        <b>{{ a.name }}</b><small>{{ t('account.google') }}</small>
      </div>
      <button class="btn btn-small" @click="doLogout">{{ t('account.logout') }}</button>
    </div>
    <div class="stat-grid">
      <div>
        <b>{{ a.rating }}</b><small>{{ t('account.rating') }}</small>
      </div>
      <div>
        <b>{{ a.wins }}</b><small>{{ t('account.wins') }}</small>
      </div>
      <div>
        <b>{{ a.losses }}</b><small>{{ t('account.losses') }}</small>
      </div>
      <div>
        <b>{{ rate }}%</b><small>{{ t('account.rate') }}</small>
      </div>
      <div>
        <b>{{ auth.xu ?? '–' }}</b><small>{{ t('account.xu') }}</small>
      </div>
      <div>
        <b>{{ FACTIONS[a.faction]?.icon }}</b><small>{{ FACTIONS[a.faction] ? civName(a.faction) : a.faction }}</small>
      </div>
    </div>
    <label class="field">
      <span>{{ t('account.displayName') }}</span>
      <div class="join-row">
        <input v-model="accName" maxlength="16" /><button class="btn" @click="saveName">{{ t('common.save') }}</button>
      </div>
    </label>
    <h2 class="section-title">{{ t('account.recent') }}</h2>
    <ul v-if="a.history.length" class="history">
      <li v-for="(h, i) in a.history" :key="i" :class="h.result">
        <span>{{ h.result === 'win' ? t('account.resWin') : h.result === 'lose' ? t('account.resLose') : t('account.resDraw') }}</span>
        <span
          >{{ FACTIONS[h.faction]?.icon }} vs {{ FACTIONS[h.vsFaction]?.icon }} <b>{{ h.vs }}</b></span
        >
        <small
          >{{ h.rating > 0 ? '+' : '' }}{{ h.rating }} · {{ new Date(h.at).toLocaleDateString(lang === 'en' ? 'en-GB' : 'vi-VN') }}</small
        >
      </li>
    </ul>
    <p v-else class="muted">{{ t('account.noMatches') }}</p>
  </template>
  <template v-else>
    <div class="login-box">
      <h3>{{ t('account.loginTitle') }}</h3>
      <ul class="news">
        <li>{{ t('account.perk1') }}</li>
        <li>{{ t('account.perk2') }}</li>
        <li>{{ t('account.perk3') }}</li>
      </ul>
      <div ref="gbtn" class="google-btn" />
      <p class="muted">{{ reason || t('account.privacy') }}</p>
    </div>
    <label class="field">
      <span>{{ t('account.guestName') }}</span>
      <input v-model="guestName" maxlength="16" @change="saveGuest" />
    </label>
  </template>
</template>
