<script setup lang="ts">
import { CHAT_MAX, FACTIONS, ROOM_GOLD, ROOM_MINUTES, type ClientMsg, type Team } from '@stickman-war/core';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BetPanel from '../components/BetPanel.vue';
import BgBattle from '../components/BgBattle.vue';
import FactionRow from '../components/FactionRow.vue';
import { t } from '@stickman-war/i18n';
import { serverText } from '@stickman-war/i18n/server';
import { chooseFaction } from '../lib/faction';
import { sound } from '../lib/sound';
import { useOnline } from '../stores/online';
import { useSettings } from '../stores/settings';

/** Phòng chờ: luật phòng, 2 ghế (mỗi người tự chọn nền văn minh, không thấy của đối thủ), người xem, kèo, chat; chủ phòng bấm Bắt đầu. */
const online = useOnline();
const router = useRouter();
const wait = computed(() => online.wait);
const you = computed(() => wait.value?.you);
const full = computed(() => !!wait.value?.seats.every((x) => x));
const allReady = computed(() => full.value && !!wait.value?.seats.every((x) => x!.ready));
const players = computed<[string, string]>(() => [wait.value?.seats[0]?.name ?? '…', wait.value?.seats[1]?.name ?? '…']);
const settings = useSettings();
/** Nền văn minh ở ghế: máy chủ giấu tộc đối thủ với người chơi (chỉ người xem thấy cả hai). */
const factionOf = (seat: Team) => {
  const f = wait.value?.seats[seat]?.faction;
  return f ? FACTIONS[f] : { icon: '❓', name: t('civ.secret') };
};
const myReady = computed(() => (you.value?.seat != null ? !!wait.value?.seats[you.value.seat]?.ready : false));
const chatText = ref('');
const log = ref<HTMLElement>();
const hint = computed(() => {
  if (!you.value) return '';
  if (you.value.host) return !full.value ? t('room.waitTwo') : allReady.value ? t('room.allReady') : t('room.waitReady');
  return you.value.role === 'player' ? t('room.pressReady') : t('room.hostStarts');
});

function send(m: ClientMsg): void {
  sound.click();
  online.send(m);
}
function setRules(gold: number, minutes: number): void {
  send({ t: 'settings', gold, minutes });
}
function sendChat(): void {
  const text = chatText.value.trim();
  if (!text) return;
  online.send({ t: 'chat', text });
  chatText.value = '';
}
function leaveRoom(): void {
  sound.click();
  online.toMenu();
}

// Cuộn chat xuống cuối khi có tin mới (nếu đang ở cuối)
watch(
  () => online.chat.length,
  async () => {
    const el = log.value;
    const stick = !el || el.scrollTop + el.clientHeight >= el.scrollHeight - 8;
    await nextTick();
    if (stick && log.value) log.value.scrollTop = log.value.scrollHeight;
  },
);
onMounted(() => {
  if (!online.wait) void router.replace('/');
  online.voiceVisible = true;
});
watch(wait, (w) => !w && void router.replace('/'));
</script>

<template>
  <BgBattle />
  <main v-if="wait && you" class="menu">
    <div class="menu-card room-card">
      <header class="room-head">
        <div class="room-title">
          <small>{{ t('room.waitroom') }}</small><b>{{ wait.code }}</b>
        </div>
        <button class="btn" @click="online.copyInvite(wait.code)">{{ t('room.invite') }}</button>
      </header>
      <div class="room-rules">
        <template v-if="you.host">
          <label :title="t('room.goldTip')">
            {{ t('room.startGold') }}
            <select
              :value="wait.settings.gold"
              @change="setRules(Number(($event.target as HTMLSelectElement).value), wait.settings.minutes)"
            >
              <option v-for="v in ROOM_GOLD" :key="v" :value="v">{{ t('common.gold', { n: v }) }}</option>
            </select>
          </label>
          <label :title="t('room.timeTip')">
            {{ t('room.matchTime') }}
            <select
              :value="wait.settings.minutes"
              @change="setRules(wait.settings.gold, Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="v in ROOM_MINUTES" :key="v" :value="v">{{ t('common.minutes', { n: v }) }}</option>
            </select>
          </label>
        </template>
        <template v-else>
          <span>
            {{ t('room.startGold') }}: <b>{{ wait.settings.gold }}</b>
          </span>
          <span>
            {{ t('room.matchTime') }}: <b>{{ t('common.minutes', { n: wait.settings.minutes }) }}</b>
          </span>
        </template>
      </div>

      <div class="seats">
        <template v-for="seat in [0, 1] as Team[]" :key="seat">
          <div v-if="seat === 1" class="vs">VS</div>
          <div v-if="!wait.seats[seat]" class="seat empty" :class="seat ? 'enemy' : 'ally'">
            <span class="seat-name">{{ t('room.emptySeat') }}</span><small>{{ t('room.waitPlayer') }}</small>
            <button v-if="you.role === 'watcher'" class="btn btn-primary" @click="send({ t: 'seat', as: 'play' })">
              {{ t('room.sit') }}
            </button>
          </div>
          <div v-else class="seat" :class="[seat ? 'enemy' : 'ally', { ready: wait.seats[seat]!.ready, mine: you.seat === seat }]">
            <button v-if="you.host && !wait.seats[seat]!.host" class="seat-kick" :title="t('room.kick')" @click="send({ t: 'kick', seat })">
              ✕
            </button>
            <span class="seat-name">
              {{ factionOf(seat).icon }} {{ wait.seats[seat]!.name }}<small v-if="you.seat === seat"> ({{ t('common.you') }})</small>
            </span>
            <small>
              {{ factionOf(seat).name }} ·
              {{ wait.seats[seat]!.host ? t('room.host') : wait.seats[seat]!.ready ? t('room.ready') : t('room.notReady') }}
            </small>
            <FactionRow
              v-if="you.seat === seat"
              class="seat-factions"
              :model-value="settings.faction"
              @update:model-value="chooseFaction"
            />
          </div>
        </template>
      </div>

      <div class="room-watchers">
        <template v-if="wait.watchers.length">
          {{ t('room.watchers', { n: wait.watchers.length }) }}
          <template v-for="(n, i) in wait.watchers" :key="i"
            ><template v-if="i">, </template><b>{{ n }}{{ n === wait.host ? ' 👑' : '' }}</b></template
          >
        </template>
        <template v-else>{{ t('room.noWatchers') }}</template>
      </div>

      <BetPanel v-if="full" class="room-bet" :players="players" :watcher="you.role === 'watcher'" :in-room="true" />

      <section class="chat">
        <div ref="log" class="chat-log" aria-live="polite">
          <p v-for="(l, i) in online.chat" :key="i" :class="{ 'chat-sys': l.kind === 'system' }">
            <template v-if="l.kind === 'system'">{{ serverText(l.text) }}</template>
            <template v-else
              ><b :class="`chat-${l.kind}`">{{ l.kind === 'watcher' ? '👁 ' : '' }}{{ l.from }}</b> {{ l.text }}</template
            >
          </p>
        </div>
        <form class="chat-form" @submit.prevent="sendChat">
          <input v-model="chatText" :maxlength="CHAT_MAX" autocomplete="off" :placeholder="t('room.chatPh')" />
          <button class="btn" type="submit">{{ t('room.send') }}</button>
        </form>
      </section>

      <div class="room-actions">
        <p class="small room-hint">{{ hint }}</p>
        <div class="room-buttons">
          <button v-if="you.host" class="btn btn-primary" :disabled="!allReady" @click="send({ t: 'begin' })">{{ t('room.start') }}</button>
          <button v-else-if="you.role === 'player'" class="btn btn-primary" @click="send({ t: 'ready', on: !myReady })">
            {{ myReady ? t('room.unready') : t('room.ready') }}
          </button>
          <button v-if="you.role === 'player'" class="btn" @click="send({ t: 'seat', as: 'watch' })">{{ t('room.toWatch') }}</button>
          <button class="btn btn-ghost" @click="leaveRoom">{{ t('online.leave') }}</button>
        </div>
      </div>
    </div>
  </main>
</template>
