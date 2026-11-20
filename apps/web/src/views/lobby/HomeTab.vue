<script setup lang="ts">
import { FACTIONS, LEVELS } from '@stickman-war/core';
import { computed } from 'vue';
import CivShowcase from '../../components/CivShowcase.vue';
import UnitStage from '../../components/UnitStage.vue';
import { auth } from '../../net/account';
import { t } from '@stickman-war/i18n';
import { levelName } from '@stickman-war/i18n/content';
import { useSettings, type MenuTab } from '../../stores/settings';
import { useUi } from '../../stores/ui';

/** Trang chủ sảnh, 3 cột: tên nền văn minh (trái dưới) · sân khấu quân + "Nhiệm vụ & Ghi chú" (giữa) · Chiến dịch / PvP. */
const emit = defineEmits<{ go: [tab: MenuTab] }>();
const settings = useSettings();
const ui = useUi();
const f = computed(() => FACTIONS[settings.faction]);
const camp = computed(() => FACTIONS[settings.campFaction]);
const enemy = computed(() => FACTIONS[settings.enemyFactions[settings.nextLevel]]);
</script>

<template>
  <div class="lb-home">
    <CivShowcase :faction="settings.faction" />
    <div class="lb-center">
      <UnitStage :faction="settings.faction" />
      <div class="lb-quests">
        <h3>{{ t('home.quests') }}</h3>
        <button class="lb-quest" @click="emit('go', 'offline')">
          <span class="check" :class="{ done: settings.current.completed }">{{ settings.current.completed ? '✔' : '📜' }}</span>
          <span>
            {{ t('home.campaign', { icon: camp.icon, name: camp.name }) }}
            <b>{{ t('home.level', { n: settings.nextLevel + 1, total: LEVELS.length }) }}</b>{{
              t('home.vs', { icon: enemy.icon, name: enemy.name })
            }}
          </span>
        </button>
        <button class="lb-quest" @click="emit('go', 'offline')">
          <span class="check" :class="{ done: settings.stars >= settings.maxStars }">⭐</span>
          <span>
            {{ t('home.stars') }} <b>{{ settings.stars }}/{{ settings.maxStars }}</b>
          </span>
        </button>
        <button class="lb-quest" @click="ui.show({ kind: 'faction' })">
          <span class="check">{{ f.icon }}</span>
          <span>
            {{ t('home.civ') }} <b>{{ f.name }}</b>
          </span>
        </button>
        <button class="lb-quest" @click="emit('go', 'account')">
          <span class="check" :class="{ done: auth.account }">{{ auth.account ? '✔' : '👤' }}</span>
          <span v-if="auth.account">
            {{ t('home.rank') }} <b>{{ auth.account.rating }}</b>
            {{ t('home.record', { wins: auth.account.wins, losses: auth.account.losses }) }}
          </span>
          <span v-else>{{ t('home.login') }}</span>
        </button>
      </div>
    </div>
    <div class="lb-actions">
      <button class="lb-big wood" @click="emit('go', 'offline')">
        <span>🗺️</span><b>{{ t('lobby.campaign') }}</b>
        <small>{{ t('lobby.startLevel', { icon: camp.icon, n: settings.nextLevel + 1, name: levelName(settings.nextLevel) }) }}</small>
      </button>
      <button class="lb-big wood orange" @click="emit('go', 'online')">
        <span>⚔️</span><b>{{ t('lobby.pvp') }}</b>
        <small>{{ t('lobby.pvpSub') }}</small>
      </button>
    </div>
  </div>
</template>
