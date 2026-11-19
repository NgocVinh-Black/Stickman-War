<script setup lang="ts">
import { CAMPAIGN, FACTIONS, LEVELS } from '@stickman-war/core';
import { computed } from 'vue';
import { auth } from '../../net/account';
import { useGame } from '../../stores/game';
import { useSettings, type MenuTab } from '../../stores/settings';
import { useUi } from '../../stores/ui';

/** Trang chủ sảnh: ô lớn bên trái, bảng "Nhiệm vụ & Ghi chú" ở giữa. */
const emit = defineEmits<{ go: [tab: MenuTab] }>();
const settings = useSettings();
const game = useGame();
const ui = useUi();
const f = computed(() => FACTIONS[settings.faction]);
const enemy = computed(() => FACTIONS[settings.enemyFactions[settings.nextLevel]]);
const total = LEVELS.length * 3;
</script>

<template>
  <div class="lb-tiles">
    <button class="lb-tile wood" @click="emit('go', 'guide')"><span class="lb-tile-icon">📜</span><b>Cẩm nang</b></button>
    <button class="lb-tile wood" @click="emit('go', 'arena')"><span class="lb-tile-icon">🏟️</span><b>Đấu trường</b></button>
    <button class="lb-tile wood" @click="game.startSkirmish('normal')"><span class="lb-tile-icon">🤖</span><b>Đấu máy</b></button>
  </div>
  <div class="lb-quests">
    <h3>Nhiệm vụ &amp; Ghi chú</h3>
    <button class="lb-quest" @click="emit('go', 'offline')">
      <span class="check" :class="{ done: settings.current.completed }">{{ settings.current.completed ? '✔' : '📜' }}</span>
      <span>
        Chiến dịch {{ CAMPAIGN[settings.campDiff].label }}: <b>màn {{ settings.nextLevel + 1 }}/{{ LEVELS.length }}</b
        >, đánh {{ enemy.icon }} {{ enemy.name }}
      </span>
    </button>
    <button class="lb-quest" @click="emit('go', 'offline')">
      <span class="check" :class="{ done: settings.stars >= total }">⭐</span>
      <span
        >Gom sao chiến dịch: <b>{{ settings.stars }}/{{ total }}</b></span
      >
    </button>
    <button class="lb-quest" @click="ui.show({ kind: 'faction' })">
      <span class="check">{{ f.icon }}</span>
      <span>
        Tộc của bạn: <b>{{ f.name }}</b>
      </span>
    </button>
    <button class="lb-quest" @click="emit('go', 'account')">
      <span class="check" :class="{ done: auth.account }">{{ auth.account ? '✔' : '👤' }}</span>
      <span v-if="auth.account"
        >Xếp hạng <b>{{ auth.account.rating }}</b> · {{ auth.account.wins }} thắng · {{ auth.account.losses }} thua</span
      >
      <span v-else>Đăng nhập Google để lưu thành tích</span>
    </button>
  </div>
</template>
