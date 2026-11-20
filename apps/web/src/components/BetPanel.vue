<script setup lang="ts">
import { MIN_BET, betOdds, type Team } from '@stickman-war/core';
import { computed, ref, watch } from 'vue';
import { t } from '@stickman-war/i18n';
import { sound } from '../lib/sound';
import { useOnline } from '../stores/online';

/**
 * Bắt kèo bằng xu ảo: người xem chọn mức cược rồi chọn bên thắng.
 * players: tên hai bên (bên trái trước). watcher: người đang xem (được cược). inRoom: đang ở phòng chờ.
 */
const props = defineProps<{ players: [string, string]; watcher: boolean; inRoom?: boolean; time?: number }>();
const online = useOnline();
const CHIPS = [50, 100, 250, 500];
const sent = ref(false);
watch(
  () => online.pool?.mine,
  () => (sent.value = false),
);

const pool = computed(() => online.pool);
const xu = computed(() => online.xu ?? 0);
const amount = computed(() => (online.betAmount < 0 ? xu.value : Math.min(online.betAmount, xu.value)));
const closesIn = computed(() => (pool.value && props.time !== undefined ? Math.max(0, Math.ceil(pool.value.closesAt - props.time)) : null));

function chip(v: number): void {
  sound.click();
  online.betAmount = v;
}
function bet(side: Team): void {
  sent.value = true;
  online.placeBet(side, amount.value);
}
</script>

<template>
  <div v-if="pool" class="bet">
    <template v-if="pool.mine">
      <span class="bet-mine">
        {{ t('bet.placed') }} <b>{{ pool.mine.amount }}</b> {{ t('bet.on') }}
        <b :class="pool.mine.side ? 'enemy-name' : 'ally-name'">{{ players[pool.mine.side] }}</b> ·
        {{ t('bet.odds', { odds: betOdds(pool.totals, pool.mine.side, 0).toFixed(2) }) }}
      </span>
    </template>
    <span v-else-if="!watcher" class="bet-mine">{{ t('bet.others') }}</span>
    <span v-else-if="!pool.open" class="bet-mine">{{ t('bet.locked') }}</span>
    <template v-else>
      <div class="bet-row">
        <span class="bet-wallet">
          {{ t('bet.label') }} · 🪙 <b>{{ xu }}</b>
          <small v-if="inRoom">{{ t('bet.openUntil', { s: pool.closesAt }) }}</small>
          <small v-else-if="closesIn !== null">{{ t('bet.closesIn', { s: closesIn }) }}</small>
        </span>
        <div class="bet-chips">
          <button v-for="c in CHIPS" :key="c" class="chip" :class="{ active: online.betAmount === c }" :disabled="c > xu" @click="chip(c)">
            {{ c }}
          </button>
          <button class="chip" :class="{ active: online.betAmount === -1 }" @click="chip(-1)">{{ t('bet.allIn') }}</button>
        </div>
      </div>
      <div class="bet-row">
        <button
          v-for="side in [0, 1] as Team[]"
          :key="side"
          class="btn bet-side"
          :class="side ? 'enemy' : 'ally'"
          :disabled="amount < MIN_BET || sent"
          @click="bet(side)"
        >
          <b :class="side ? 'enemy-name' : 'ally-name'">{{ players[side] }}</b>
          <small>×{{ betOdds(pool.totals, side, amount).toFixed(2) }}</small>
        </button>
      </div>
    </template>
    <span class="bet-pool">
      {{ t('bet.pool') }} <b class="ally-name">{{ players[0] }}</b> {{ pool.totals[0] }} 🪙 ({{ pool.counts[0] }}) ·
      <b class="enemy-name">{{ players[1] }}</b> {{ pool.totals[1] }} 🪙 ({{ pool.counts[1] }})
    </span>
  </div>
</template>
