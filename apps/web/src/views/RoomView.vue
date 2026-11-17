<script setup lang="ts">
import { CHAT_MAX, FACTIONS, ROOM_GOLD, ROOM_MINUTES, type ClientMsg, type Team } from '@nguoi-que/core';
import { computed, nextTick, onMounted, ref, watch } from 'vue';
import { useRouter } from 'vue-router';
import BetPanel from '../components/BetPanel.vue';
import BgBattle from '../components/BgBattle.vue';
import { sound } from '../lib/sound';
import { useOnline } from '../stores/online';

/** Phòng chờ: luật phòng, 2 ghế, người xem, kèo, chat; chủ phòng bấm Bắt đầu. */
const online = useOnline();
const router = useRouter();
const wait = computed(() => online.wait);
const you = computed(() => wait.value?.you);
const full = computed(() => !!wait.value?.seats.every((x) => x));
const allReady = computed(() => full.value && !!wait.value?.seats.every((x) => x!.ready));
const players = computed<[string, string]>(() => [wait.value?.seats[0]?.name ?? '…', wait.value?.seats[1]?.name ?? '…']);
const myReady = computed(() => (you.value?.seat != null ? !!wait.value?.seats[you.value.seat]?.ready : false));
const chatText = ref('');
const log = ref<HTMLElement>();
const hint = computed(() => {
  if (!you.value) return '';
  if (you.value.host)
    return !full.value ? 'Chờ đủ 2 người chơi' : allReady.value ? 'Mọi người đã sẵn sàng, bấm Bắt đầu!' : 'Chờ người chơi bấm Sẵn sàng';
  return you.value.role === 'player' ? 'Bấm Sẵn sàng rồi chờ chủ phòng bắt đầu' : 'Chủ phòng bắt đầu thì bạn được xem trận ngay';
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
          <small>Phòng chờ</small><b>{{ wait.code }}</b>
        </div>
        <button class="btn" @click="online.copyInvite(wait.code)">📋 Mời bạn</button>
      </header>
      <div class="room-rules">
        <template v-if="you.host">
          <label title="Số vàng mỗi người có khi bắt đầu trận">
            💰 Vàng ban đầu
            <select
              :value="wait.settings.gold"
              @change="setRules(Number(($event.target as HTMLSelectElement).value), wait.settings.minutes)"
            >
              <option v-for="v in ROOM_GOLD" :key="v" :value="v">{{ v }} vàng</option>
            </select>
          </label>
          <label title="Hết giờ mà chưa phá được tượng thì bên còn nhiều máu tượng hơn thắng">
            ⏱ Thời gian trận
            <select
              :value="wait.settings.minutes"
              @change="setRules(wait.settings.gold, Number(($event.target as HTMLSelectElement).value))"
            >
              <option v-for="v in ROOM_MINUTES" :key="v" :value="v">{{ v }} phút</option>
            </select>
          </label>
        </template>
        <template v-else>
          <span
            >💰 Vàng ban đầu: <b>{{ wait.settings.gold }}</b></span
          ><span
            >⏱ Thời gian trận: <b>{{ wait.settings.minutes }} phút</b></span
          >
        </template>
      </div>

      <div class="seats">
        <template v-for="t in [0, 1] as Team[]" :key="t">
          <div v-if="t === 1" class="vs">VS</div>
          <div v-if="!wait.seats[t]" class="seat empty" :class="t ? 'enemy' : 'ally'">
            <span class="seat-name">Ghế trống</span><small>Chờ người chơi…</small>
            <button v-if="you.role === 'watcher'" class="btn btn-primary" @click="send({ t: 'seat', as: 'play' })">Ngồi vào</button>
          </div>
          <div v-else class="seat" :class="[t ? 'enemy' : 'ally', { ready: wait.seats[t]!.ready, mine: you.seat === t }]">
            <button
              v-if="you.host && !wait.seats[t]!.host"
              class="seat-kick"
              title="Mời ra khỏi phòng"
              @click="send({ t: 'kick', seat: t })"
            >
              ✕
            </button>
            <span class="seat-name">
              {{ FACTIONS[wait.seats[t]!.faction]?.icon }} {{ wait.seats[t]!.name }}<small v-if="you.seat === t"> (bạn)</small>
            </span>
            <small>
              {{ FACTIONS[wait.seats[t]!.faction]?.name }} ·
              {{ wait.seats[t]!.host ? '👑 Chủ phòng' : wait.seats[t]!.ready ? '✅ Sẵn sàng' : '⏳ Chưa sẵn sàng' }}
            </small>
          </div>
        </template>
      </div>

      <div class="room-watchers">
        <template v-if="wait.watchers.length">
          👁 {{ wait.watchers.length }} người xem:
          <template v-for="(n, i) in wait.watchers" :key="i"
            ><template v-if="i">, </template><b>{{ n }}{{ n === wait.host ? ' 👑' : '' }}</b></template
          >
        </template>
        <template v-else>👁 Chưa có người xem · gửi mã phòng để bạn bè vào xem và bắt kèo</template>
      </div>

      <BetPanel v-if="full" class="room-bet" :players="players" :watcher="you.role === 'watcher'" :in-room="true" />

      <section class="chat">
        <div ref="log" class="chat-log" aria-live="polite">
          <p v-for="(l, i) in online.chat" :key="i" :class="{ 'chat-sys': l.kind === 'system' }">
            <template v-if="l.kind === 'system'">{{ l.text }}</template>
            <template v-else
              ><b :class="`chat-${l.kind}`">{{ l.kind === 'watcher' ? '👁 ' : '' }}{{ l.from }}</b> {{ l.text }}</template
            >
          </p>
        </div>
        <form class="chat-form" @submit.prevent="sendChat">
          <input v-model="chatText" :maxlength="CHAT_MAX" autocomplete="off" placeholder="Nhắn cho cả phòng…" />
          <button class="btn" type="submit">Gửi</button>
        </form>
      </section>

      <div class="room-actions">
        <p class="small room-hint">{{ hint }}</p>
        <div class="room-buttons">
          <button v-if="you.host" class="btn btn-primary" :disabled="!allReady" @click="send({ t: 'begin' })">▶ Bắt đầu</button>
          <button v-else-if="you.role === 'player'" class="btn btn-primary" @click="send({ t: 'ready', on: !myReady })">
            {{ myReady ? 'Huỷ sẵn sàng' : '✅ Sẵn sàng' }}
          </button>
          <button v-if="you.role === 'player'" class="btn" @click="send({ t: 'seat', as: 'watch' })">👁 Ra xem</button>
          <button class="btn btn-ghost" @click="leaveRoom">Rời phòng</button>
        </div>
      </div>
    </div>
  </main>
</template>
