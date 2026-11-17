<script setup lang="ts">
import { MIN_BET, betOdds, type Team } from '@stickman-war/core';
import { computed, ref, watch } from 'vue';
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
        🎲 Đã cược <b>{{ pool.mine.amount }}</b> 🪙 vào
        <b :class="pool.mine.side ? 'enemy-name' : 'ally-name'">{{ players[pool.mine.side] }}</b> · ăn ×{{
          betOdds(pool.totals, pool.mine.side, 0).toFixed(2)
        }}
      </span>
    </template>
    <span v-else-if="!watcher" class="bet-mine">🎲 Người xem đang bắt kèo</span>
    <span v-else-if="!pool.open" class="bet-mine">🔒 Đã khoá kèo</span>
    <template v-else>
      <div class="bet-row">
        <span class="bet-wallet">
          🎲 Kèo · 🪙 <b>{{ xu }}</b>
          <small v-if="inRoom">· mở đến giây {{ pool.closesAt }} của trận</small>
          <small v-else-if="closesIn !== null">· khoá sau {{ closesIn }}s</small>
        </span>
        <div class="bet-chips">
          <button v-for="c in CHIPS" :key="c" class="chip" :class="{ active: online.betAmount === c }" :disabled="c > xu" @click="chip(c)">
            {{ c }}
          </button>
          <button class="chip" :class="{ active: online.betAmount === -1 }" @click="chip(-1)">Tất tay</button>
        </div>
      </div>
      <div class="bet-row">
        <button
          v-for="t in [0, 1] as Team[]"
          :key="t"
          class="btn bet-side"
          :class="t ? 'enemy' : 'ally'"
          :disabled="amount < MIN_BET || sent"
          @click="bet(t)"
        >
          <b :class="t ? 'enemy-name' : 'ally-name'">{{ players[t] }}</b> <small>×{{ betOdds(pool.totals, t, amount).toFixed(2) }}</small>
        </button>
      </div>
    </template>
    <span class="bet-pool">
      Quỹ kèo: <b class="ally-name">{{ players[0] }}</b> {{ pool.totals[0] }} 🪙 ({{ pool.counts[0] }}) ·
      <b class="enemy-name">{{ players[1] }}</b> {{ pool.totals[1] }} 🪙 ({{ pool.counts[1] }})
    </span>
  </div>
</template>
