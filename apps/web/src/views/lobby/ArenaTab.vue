<script setup lang="ts">
import { FACTIONS, type AccountInfo, type LobbyRoom } from '@stickman-war/core';
import { onBeforeUnmount, onMounted, ref } from 'vue';
import PlayerAvatar from '../../components/PlayerAvatar.vue';
import { formatTime } from '../../game/session';
import { auth, leaderboard } from '../../net/account';
import { useOnline } from '../../stores/online';

/** Đấu trường: danh sách phòng đang mở (vào chơi / vào xem) và bảng xếp hạng. */
const online = useOnline();
const board = ref<AccountInfo[] | null>(null);
const boardError = ref(false);

const isOpen = (r: LobbyRoom) => r.state === 'waiting' && r.players.length < 2;
function stateText(r: LobbyRoom): string {
  if (isOpen(r)) return r.players.length ? '🟢 Còn ghế' : '🟢 Còn 2 ghế';
  if (r.state === 'waiting') return '⏳ Chờ chủ phòng bắt đầu';
  if (r.state === 'ended') return '🏁 Vừa xong';
  return `⚔️ Đang đấu · ${formatTime(r.time)}`;
}

onMounted(() => {
  void online.ensure().then((c) => c?.send({ t: 'lobby', on: true }));
  leaderboard()
    .then((list) => (board.value = list))
    .catch(() => (boardError.value = true));
});
onBeforeUnmount(() => online.send({ t: 'lobby', on: false }));
</script>

<template>
  <div class="arena-list">
    <p v-if="!online.lobby" class="arena-empty">Đang tải danh sách phòng…</p>
    <template v-else-if="!online.lobby.length">
      <p class="arena-empty">Chưa có phòng nào đang mở.</p>
      <button class="btn btn-primary wide" @click="online.go({ t: 'create' })">➕ Tạo phòng</button>
    </template>
    <div v-for="r in online.lobby" v-else :key="r.code" class="arena-room" :class="{ open: isOpen(r) }">
      <div class="arena-info">
        <div class="arena-names">
          <template v-if="r.players.length">
            <template v-for="(n, i) in r.players" :key="i"
              ><i v-if="i">vs</i><b>{{ n }}</b></template
            >
          </template>
          <b v-else>Phòng trống</b>
        </div>
        <small
          >{{ stateText(r) }}{{ r.watchers ? ` · 👁 ${r.watchers}` : '' }}{{ r.private ? ' · 🔒 Phòng riêng' : '' }} · {{ r.code }}</small
        >
      </div>
      <div class="arena-actions">
        <button v-if="isOpen(r)" class="btn btn-primary" @click="online.go({ t: 'join', code: r.code, as: 'play' })">▶ Chơi</button>
        <button class="btn" @click="online.go({ t: 'join', code: r.code, as: 'watch' })">👁 Xem</button>
      </div>
    </div>
  </div>
  <p class="online-status">{{ online.status }}</p>
  <h2 class="section-title">🏆 Bảng xếp hạng</h2>
  <div class="leaderboard">
    <p v-if="boardError" class="muted">Không tải được bảng xếp hạng (máy chủ online chưa chạy?)</p>
    <p v-else-if="!board" class="muted">Đang tải…</p>
    <p v-else-if="!board.length" class="muted">Chưa có ai xếp hạng. Đăng nhập Google rồi đấu online để lên bảng!</p>
    <ol v-else>
      <li v-for="(a, i) in board" :key="a.id" :class="{ me: a.id === auth.account?.id }">
        <span class="rank">{{ i + 1 }}</span>
        <PlayerAvatar :picture="a.picture" :name="a.name" />
        <b>{{ a.name }}</b><span>{{ FACTIONS[a.faction]?.icon }}</span> <span class="rating">{{ a.rating }}</span><small
          >{{ a.wins }}T · {{ a.losses }}B</small
        >
      </li>
    </ol>
  </div>
</template>
