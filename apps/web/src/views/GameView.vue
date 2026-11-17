<script setup lang="ts">
import { FACTIONS, POP_CAP, TRAIN_KEYS, UNITS, type UnitKind } from '@stickman-war/core';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BetPanel from '../components/BetPanel.vue';
import UnitIcon from '../components/UnitIcon.vue';
import { bindCamera, panByKeys } from '../game/camera';
import { isNet } from '../game/session';
import { sound } from '../lib/sound';
import { FORMATION_INFO, STANCES, archIndex, useGame } from '../stores/game';
import { useOnline } from '../stores/online';
import { useUi } from '../stores/ui';

/** Màn trận đánh: canvas chiến trường, HUD, bản đồ nhỏ, nút xây quân / ra lệnh, phím tắt. */
const game = useGame();
const online = useOnline();
const ui = useUi();
const router = useRouter();
const view = ref<HTMLCanvasElement>();
const mini = ref<HTMLCanvasElement>();
const session = computed(() => game.session);
const mode = computed(() => game.session?.mode);
const watching = computed(() => mode.value?.type === 'watch');
const netMode = computed(() => !!mode.value && isNet(mode.value));
const kinds = computed<UnitKind[]>(() => [...(game.session?.match.unlocked ?? [])].sort((a, b) => archIndex(a) - archIndex(b)));
const speed = ref(1);
const time = ref(0);
const keys = new Set<string>();
let raf = 0;
let last = performance.now();
let unbind: () => void = () => {};

function frame(t: number): void {
  const dt = Math.min((t - last) / 1000, 0.1);
  last = t;
  const s = game.session;
  if (s?.renderer) {
    s.tick(dt);
    if (mini.value) s.renderer.drawMinimap(mini.value, s.view);
    panByKeys(keys, s.renderer, dt);
    game.syncHud();
    time.value = s.view.time;
  }
  raf = requestAnimationFrame(frame);
}

function openMenu(): void {
  if (netMode.value) online.openNetMenu();
  else game.pause();
}
function toggleSpeed(): void {
  game.toggleSpeed();
  speed.value = game.session?.speed ?? 1;
}
function leaveWatch(): void {
  sound.click();
  online.toMenu();
}

const onKey = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement) return;
  const k = e.key.toLowerCase();
  keys.add(k);
  const s = game.session;
  if (!s) return;
  if (k === ' ' || k === 'escape' || k === 'p') {
    e.preventDefault();
    if (ui.dialog) {
      if (!s.endShown && (netMode.value || s.view.time > 0)) game.resume();
    } else openMenu();
    return;
  }
  if (e.repeat) return;
  const slot = TRAIN_KEYS.indexOf(k);
  if (slot >= 0) game.trainSlot(slot);
  if (k === 'r') game.toggleCenterMine();
  if (k === 'f') game.cycleFormation();
  const st = STANCES.find((x) => x.key.toLowerCase() === k);
  if (st) game.setStance(st.id);
};
const onKeyUp = (e: KeyboardEvent) => keys.delete(e.key.toLowerCase());
const onBlur = () => keys.clear();
const onResize = () => game.session?.renderer?.resize();
const onHidden = () => {
  const s = game.session;
  if (document.hidden && s && !netMode.value && s.running) game.pause();
};

onMounted(() => {
  const s = game.session;
  if (!s || !view.value || !mini.value) {
    void router.replace('/');
    return;
  }
  s.attach(view.value);
  unbind = bindCamera(view.value, mini.value, () => game.session?.renderer ?? null);
  raf = requestAnimationFrame(frame);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('visibilitychange', onHidden);
  window.addEventListener('blur', onBlur);
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  unbind();
  document.removeEventListener('keydown', onKey);
  document.removeEventListener('keyup', onKeyUp);
  document.removeEventListener('visibilitychange', onHidden);
  window.removeEventListener('blur', onBlur);
  window.removeEventListener('resize', onResize);
});
</script>

<template>
  <main v-if="session" class="game" :style="{ '--faction': FACTIONS[game.hud.factions[0]].color }">
    <header class="topbar">
      <button class="icon-btn" :title="netMode ? 'Menu' : 'Tạm dừng (Space)'" @click="openMenu">{{ netMode ? '☰' : '⏸' }}</button>
      <div class="level-name">
        <b>{{ game.meta.title }}</b><span>{{ game.meta.subtitle }}</span>
      </div>
      <div class="faction-tag" title="Tộc hai bên">
        {{ FACTIONS[game.hud.factions[0]].icon }} vs {{ FACTIONS[game.hud.factions[1]].icon }}
      </div>
      <template v-if="watching">
        <div class="stat ally-stat">
          <span>💰</span><b>{{ game.hud.gold }}</b>
        </div>
        <div class="stat enemy-stat">
          <span>💰</span><b>{{ game.hud.goldEnemy }}</b>
        </div>
      </template>
      <template v-else>
        <div class="stat">
          <span>💰</span><b>{{ game.hud.gold }}</b>
        </div>
        <div class="stat">
          <span>👥</span><b>{{ game.hud.pop }}</b
          ><small>/{{ POP_CAP }}</small>
        </div>
      </template>
      <div class="statues">
        <div class="statue-bar ally"><i :style="{ transform: `scaleX(${game.hud.hpAlly})` }" /></div>
        <div class="statue-bar enemy"><i :style="{ transform: `scaleX(${game.hud.hpEnemy})` }" /></div>
      </div>
      <div v-if="netMode" class="ping">{{ online.ping }} ms{{ online.watchers ? ` · 👁 ${online.watchers}` : '' }}</div>
      <button v-else class="icon-btn" title="Tốc độ" @click="toggleSpeed">×{{ speed }}</button>
    </header>
    <canvas ref="mini" class="minimap" />
    <section class="stage">
      <canvas ref="view" />
      <div :key="game.hud.countdown" class="countdown" :class="{ pop: !!game.hud.countdown }">{{ game.hud.countdown }}</div>
    </section>

    <footer v-if="watching && online.watching" class="controls watch-bar">
      <span class="watch-label">
        👁 Đang xem · <b class="ally-name">{{ online.watching[0] }}</b> vs <b class="enemy-name">{{ online.watching[1] }}</b>
      </span>
      <BetPanel :players="online.watching" :watcher="true" :time="time" />
      <button class="btn" @click="leaveWatch">Rời phòng</button>
    </footer>
    <footer v-else class="controls">
      <div class="units">
        <button
          v-for="k in kinds"
          :key="k"
          class="unit-btn"
          :class="{ disabled: !game.hud.units[k]?.can }"
          :title="`${UNITS[k].name}: ${UNITS[k].desc}\n${UNITS[k].counter}`"
          @click="game.train(k)"
        >
          <UnitIcon class="unit-icon" :kind="k" />
          <span class="unit-cost">{{ UNITS[k].cost }}</span>
          <span class="unit-key">{{ TRAIN_KEYS[archIndex(k)] }}</span>
          <span class="unit-badge">{{ game.hud.units[k]?.queued || '' }}</span>
          <span class="unit-progress" :style="{ transform: `scaleX(${game.hud.units[k]?.progress ?? 0})` }" />
        </button>
      </div>
      <div class="stances">
        <button
          v-for="st in STANCES"
          :key="st.id"
          class="stance-btn"
          :class="{ active: game.hud.stance === st.id }"
          :title="`${st.label} (${st.key})`"
          @click="game.setStance(st.id)"
        >
          <span>{{ st.icon }}</span><small>{{ st.label }}</small>
        </button>
        <button
          class="stance-btn formation-btn"
          :class="{ active: game.hud.formation !== 'free' }"
          title="Đội hình (F)"
          @click="game.cycleFormation()"
        >
          <span>{{ FORMATION_INFO[game.hud.formation].icon }}</span><small>{{ FORMATION_INFO[game.hud.formation].label }}</small>
        </button>
        <button
          class="stance-btn center-btn"
          :class="{ active: game.hud.centerMine }"
          title="Mỏ giữa (R): một nửa thợ mỏ sang đào mỏ vàng giữa bản đồ. Giàu gấp 4 nhưng phải đi qua chiến trường, chết thì rơi vàng cho địch nhặt"
          @click="game.toggleCenterMine()"
        >
          <span>💰</span><small>Mỏ giữa</small>
        </button>
      </div>
    </footer>
  </main>
</template>
