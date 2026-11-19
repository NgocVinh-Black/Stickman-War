<script setup lang="ts">
import { CAMPAIGN, FACTIONS, LEVELS } from '@stickman-war/core';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import BgBattle from '../components/BgBattle.vue';
import PlayerAvatar from '../components/PlayerAvatar.vue';
import { sound } from '../lib/sound';
import { auth } from '../net/account';
import { useGame } from '../stores/game';
import { useOnline } from '../stores/online';
import { MENU_TABS, useSettings, type MenuTab } from '../stores/settings';
import { useUi } from '../stores/ui';
import AccountTab from './lobby/AccountTab.vue';
import ArenaTab from './lobby/ArenaTab.vue';
import CampaignTab from './lobby/CampaignTab.vue';
import GuideTab from './lobby/GuideTab.vue';
import HomeTab from './lobby/HomeTab.vue';
import OnlineTab from './lobby/OnlineTab.vue';

/** Sảnh kiểu game di động: hồ sơ, tiền, tab gỗ, nút tròn, nút xanh "Bắt đầu chiến đấu", trận đánh làm nền. */
const settings = useSettings();
const online = useOnline();
const game = useGame();
const ui = useUi();

const TABS = { home: HomeTab, offline: CampaignTab, online: OnlineTab, arena: ArenaTab, guide: GuideTab, account: AccountTab };
const tabLabel = computed(() => MENU_TABS.find((t) => t.id === settings.tab)!.label);
const faction = computed(() => FACTIONS[settings.faction]);
const name = computed(() => auth.account?.name ?? settings.name);
const next = computed(() => settings.nextLevel);
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
  `Tộc của bạn: ${faction.value.icon} ${faction.value.name}. Xem điểm mạnh / yếu từng tộc trong Cẩm nang.`,
  'Mẹo: bấm F trong trận để đổi đội hình, Hàng lối giữ cả đội đi cùng nhau.',
  'Mẹo: Thợ xây dựng tháp canh trước nhà, chặn được kỵ binh đánh úp.',
  'Mẹo: thợ mỏ chết sẽ rơi túi vàng, quân phe nào chạm trước thì nhặt được.',
  'Đăng nhập Google để lưu điểm xếp hạng và xu trên mọi máy.',
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
      <button class="lb-profile wood" title="Tài khoản" @click="goTab('account')">
        <span class="lb-avatar"><PlayerAvatar :picture="auth.account?.picture" :name="name" /></span>
        <span class="lb-profile-text">
          <b>{{ name }}</b>
          <span class="lb-chips">
            <span class="lb-chip"
              >🏆 <i>{{ auth.account ? auth.account.rating : 'Khách' }}</i></span
            >
            <span class="lb-chip"
              >⭐ <i>{{ settings.stars }}/{{ LEVELS.length * 3 }}</i></span
            >
          </span>
          <span class="lb-bar" title="Tiến độ chiến dịch">
            <i :style="{ width: `${Math.round((Math.min(settings.current.unlocked, LEVELS.length) / LEVELS.length) * 100)}%` }" />
          </span>
        </span>
        <span class="lb-badge">{{ faction.icon }}</span>
      </button>
      <picture class="lb-title">
        <source :srcset="asset('logo.webp')" type="image/webp" />
        <img :src="asset('logo.png')" alt="Stickman War" />
      </picture>
      <div class="lb-top-right">
        <span class="lb-pill wood" title="Xu bắt kèo"
          ><span class="coin">🪙</span><b>{{ auth.xu ?? online.xu ?? '—' }}</b></span
        >
        <span class="lb-pill wood" title="Người đang online"
          ><span class="coin">🟢</span><b>{{ online.lastOnline || '—' }}</b></span
        >
        <button class="lb-square wood" title="Âm thanh" @click="settings.toggleSound()">{{ settings.muted ? '🔇' : '🔊' }}</button>
        <button class="lb-square wood" title="Cẩm nang" @click="goTab('guide')">📖</button>
      </div>
    </header>

    <nav class="lb-tabs" role="tablist">
      <button
        v-for="t in MENU_TABS"
        :key="t.id"
        class="lb-tab wood"
        :class="{ active: settings.tab === t.id }"
        role="tab"
        :aria-selected="settings.tab === t.id"
        @click="goTab(t.id)"
      >
        {{ t.label }}
      </button>
    </nav>

    <section class="lb-stage">
      <HomeTab v-if="settings.tab === 'home'" @go="goTab" />
      <div v-else class="lb-panel wood">
        <div class="lb-panel-head">
          <h2>{{ tabLabel }}</h2>
          <button class="lb-close" title="Về sảnh" @click="goTab('home')">✕</button>
        </div>
        <div class="lb-panel-body">
          <div class="tab-body"><component :is="TABS[settings.tab]" /></div>
        </div>
      </div>
    </section>

    <aside class="lb-side">
      <button class="lb-round" :style="{ '--faction': faction.color }" @click="(sound.click(), ui.show({ kind: 'faction' }))">
        <span>{{ faction.icon }}</span><small>Đổi tộc</small>
      </button>
      <button class="lb-round" @click="goTab('arena')"><span>🏆</span><small>Xếp hạng</small></button>
      <button class="lb-round" @click="goTab('account')"><span>👤</span><small>Tài khoản</small></button>
    </aside>

    <footer class="lb-bottom">
      <div :key="tick" class="lb-ticker fade">
        <span class="lb-ticker-label">Thông báo:</span> {{ tickerLines[tick % tickerLines.length] }}
      </div>
      <button class="lb-start" @click="game.startCampaign(next)">
        <span>Bắt đầu chiến đấu</span>
        <small>Màn {{ next + 1 }}: {{ LEVELS[next].name }} · {{ CAMPAIGN[settings.campDiff].label }}</small>
      </button>
      <div class="lb-corner">
        <button class="lb-big wood" @click="goTab('offline')"><span>🗺️</span><b>Chiến dịch</b></button>
        <button class="lb-big wood orange" @click="goTab('online')"><span>⚔️</span><b>PvP</b></button>
      </div>
    </footer>
  </main>
</template>
