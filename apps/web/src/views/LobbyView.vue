<script setup lang="ts">
import { FACTIONS, LEVELS } from '@stickman-war/core';
import { t, type Key } from '@stickman-war/i18n';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BgBattle from '../components/BgBattle.vue';
import PlayerAvatar from '../components/PlayerAvatar.vue';
import { sound } from '../lib/sound';
import { auth } from '../net/account';
import { useGame } from '../stores/game';
import { useOnline } from '../stores/online';
import { useSettings, type MenuTab } from '../stores/settings';
import { useUi } from '../stores/ui';
import AccountTab from './lobby/AccountTab.vue';
import ArenaTab from './lobby/ArenaTab.vue';
import CampaignTab from './lobby/CampaignTab.vue';
import GuideTab from './lobby/GuideTab.vue';
import HomeTab from './lobby/HomeTab.vue';
import OnlineTab from './lobby/OnlineTab.vue';
import CivEmblem from '../components/CivEmblem.vue';

/** Sảnh kiểu game di động: hồ sơ, tiền, tab gỗ, nút tròn, nút xanh "Bắt đầu chiến đấu", trận đánh làm nền. */
const settings = useSettings();
const online = useOnline();
const game = useGame();
const ui = useUi();

const TABS = { home: HomeTab, offline: CampaignTab, online: OnlineTab, arena: ArenaTab, guide: GuideTab, account: AccountTab };
const tabLabel = computed(() => t(`menu.${settings.tab}` as Key));
const faction = computed(() => FACTIONS[settings.faction]);
const name = computed(() => auth.account?.name ?? settings.name);
const asset = (f: string) => import.meta.env.BASE_URL + f;

function goTab(t: MenuTab): void {
  sound.click();
  settings.tab = t;
}
watch(
  () => settings.tab,
  (t) => {
    if (t !== 'arena') online.send({ t: 'lobby', on: false });
  },
);

// Dòng thông báo chạy ở chân sảnh
const tickerLines = computed(() => [
  t('lobby.ticker.civ', { icon: faction.value.icon, name: faction.value.name }),
  t('lobby.ticker.formation'),
  t('lobby.ticker.depot'),
  t('lobby.ticker.bag'),
  t('lobby.ticker.login'),
]);
const tick = ref(0);
let timer = 0;
onMounted(() => {
  online.leave();
  game.unmount();
  timer = window.setInterval(() => tick.value++, 6000);
});
onBeforeUnmount(() => clearInterval(timer));
</script>

<template>
  <BgBattle />
  <div class="lb-shade" />
  <main class="lobby" :data-view="settings.tab">
    <header class="lb-top">
      <button class="lb-profile wood" :title="t('lobby.profile')" @click="goTab('account')">
        <span class="lb-avatar"><PlayerAvatar :picture="auth.account?.picture" :name="name" /></span>
        <span class="lb-profile-text">
          <b>{{ name }}</b>
          <span class="lb-chips">
            <span class="lb-chip"
              >🏆 <i>{{ auth.account ? auth.account.rating : t('lobby.guest') }}</i></span
            >
            <span class="lb-chip"
              >⭐ <i>{{ settings.stars }}/{{ settings.maxStars }}</i></span
            >
          </span>
          <span class="lb-bar" :title="t('lobby.campaignProgress')">
            <i :style="{ width: `${Math.round((Math.min(settings.current.unlocked, LEVELS.length) / LEVELS.length) * 100)}%` }" />
          </span>
        </span>
        <CivEmblem class="lb-badge" :faction="settings.faction" :size="30" />
      </button>
      <picture class="lb-title">
        <source :srcset="asset('logo.webp')" type="image/webp" />
        <img :src="asset('logo.png')" alt="Stickman War" />
      </picture>
      <div class="lb-top-right">
        <span class="lb-pill wood" :title="t('lobby.xu')"
          ><span class="coin">🪙</span><b>{{ auth.xu ?? online.xu ?? '—' }}</b></span
        >
        <span class="lb-pill wood" :title="t('lobby.online')"
          ><span class="coin">🟢</span><b>{{ online.lastOnline || '—' }}</b></span
        >
        <button class="lb-square wood" :title="t('lobby.settings')" @click="(sound.click(), ui.show({ kind: 'settings' }))">⚙️</button>
        <button class="lb-square wood" :title="t('lobby.guide')" @click="goTab('guide')">📖</button>
      </div>
    </header>

    <!-- Hàng nút tròn dưới khung tên: sảnh, đổi văn minh, xếp hạng (đấu trường), tài khoản -->
    <nav class="lb-rounds">
      <button class="lb-round" :class="{ active: settings.tab === 'home' }" @click="goTab('home')">
        <span>🏠</span><small>{{ t('lobby.home') }}</small>
      </button>
      <button class="lb-round" :style="{ '--faction': faction.color }" @click="(sound.click(), ui.show({ kind: 'faction' }))">
        <span><CivEmblem :faction="settings.faction" :size="48" /></span><small>{{ t('civ.change') }}</small>
      </button>
      <button class="lb-round" :class="{ active: settings.tab === 'arena' }" @click="goTab('arena')">
        <span>🏆</span><small>{{ t('lobby.ranking') }}</small>
      </button>
      <button class="lb-round" :class="{ active: settings.tab === 'account' }" @click="goTab('account')">
        <span>👤</span><small>{{ t('lobby.profile') }}</small>
      </button>
    </nav>

    <section class="lb-stage">
      <HomeTab v-if="settings.tab === 'home'" @go="goTab" />
      <div v-else class="lb-panel wood">
        <div class="lb-panel-head">
          <h2>{{ tabLabel }}</h2>
          <button class="lb-close" :title="t('lobby.backHome')" @click="goTab('home')">✕</button>
        </div>
        <div class="lb-panel-body">
          <div class="tab-body"><component :is="TABS[settings.tab]" /></div>
        </div>
      </div>
    </section>

    <footer class="lb-bottom">
      <div :key="tick" class="lb-ticker fade">
        <span class="lb-ticker-label">{{ t('lobby.news') }}</span> {{ tickerLines[tick % tickerLines.length] }}
      </div>
    </footer>
  </main>
</template>
