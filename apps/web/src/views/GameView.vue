<script setup lang="ts">
import { FACTIONS, POP_CAP, TRAIN_KEYS, UNITS, type UnitKind } from '@stickman-war/core';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import { useRouter } from 'vue-router';
import BetPanel from '../components/BetPanel.vue';
import UnitIcon from '../components/UnitIcon.vue';
import { bindCamera, panByKeys } from '../game/camera';
import { isNet } from '../game/session';
import { sound } from '../lib/sound';
import { FORMATION_CYCLE, FORMATION_INFO, MINE_INFO, MINE_PRESETS, STANCES, archIndex, useGame } from '../stores/game';
import { MINES, MINE_KINDS, type MineSplit } from '@stickman-war/core';
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
const formationMenu = ref(false);
function pickFormation(f: (typeof FORMATION_CYCLE)[number]): void {
  formationMenu.value = false;
  game.setFormation(f);
}
/**
 * Bảng chia thợ mỏ theo số thợ thật. Thêm 1 thợ cho mỏ i thì rút từ mỏ khác đông thợ nhất;
 * bớt 1 thợ thì đưa về mỏ bạc (đang bớt bạc thì sang vàng). Tổng số thợ không đổi;
 * số thợ mới xây sau đó được chia theo đúng tỉ lệ này.
 */
const mineMenu = ref(false);
const mineCap = (i: number) => MINES[MINE_KINDS[i]].cap;
const canAddMiner = (i: number) => game.hud.miners[i] < mineCap(i) && game.hud.miners.some((n, j) => j !== i && n > 0);
const canRemoveMiner = (i: number) => game.hud.miners[i] > 0 && (i !== 0 || [1, 2].some((j) => game.hud.miners[j] < mineCap(j)));
function bumpMine(i: number, d: number): void {
  const next = [...game.hud.miners] as MineSplit;
  if (d > 0) {
    // Thêm vàng / kim cương: rút từ mỏ bạc trước (bạc là chỗ chứa thợ dư), hết bạc mới rút mỏ còn lại.
    // Thêm bạc: rút từ mỏ đông hơn trong vàng / kim cương.
    const order = i === 0 ? [1, 2].sort((a, b) => next[b] - next[a]) : [0, 3 - i];
    const from = order.find((j) => next[j] > 0);
    if (from === undefined) return;
    next[from]--;
    next[i]++;
  } else {
    if (next[i] <= 0) return;
    next[i]--;
    // Bớt vàng / kim cương: về bạc. Bớt bạc: sang mỏ vàng / kim cương còn chỗ
    const to = i !== 0 ? 0 : [1, 2].find((j) => next[j] < mineCap(j));
    if (to === undefined) return;
    next[to]++;
  }
  game.setMineSplit(next);
}
/** Kiểu chia có sẵn đang dùng (so theo tỉ lệ, vd. 3·3·0 vẫn là Cân bằng 1·1·0). */
const isPreset = (split: MineSplit) => {
  const cur = game.hud.mineSplit;
  return [0, 1, 2].every((a) => [0, 1, 2].every((b) => split[a] * cur[b] === split[b] * cur[a]));
};
const closeFormationMenu = (e: PointerEvent) => {
  if (!(e.target instanceof Element && e.target.closest('.mine-wrap'))) mineMenu.value = false;
  if (!(e.target instanceof Element && e.target.closest('.formation-wrap'))) formationMenu.value = false;
};
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
  if (k === 'escape' && game.cancelPlacing()) return;
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
  if (k === 'r') game.cycleMinePreset();
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
  unbind = bindCamera(
    view.value,
    mini.value,
    () => game.session?.renderer ?? null,
    (x) => game.placeAt(x),
  );
  raf = requestAnimationFrame(frame);
  document.addEventListener('pointerdown', closeFormationMenu);
  document.addEventListener('keydown', onKey);
  document.addEventListener('keyup', onKeyUp);
  document.addEventListener('visibilitychange', onHidden);
  window.addEventListener('blur', onBlur);
  window.addEventListener('resize', onResize);
});
onBeforeUnmount(() => {
  cancelAnimationFrame(raf);
  unbind();
  document.removeEventListener('pointerdown', closeFormationMenu);
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
      <canvas ref="view" :class="{ 'flag-cursor': game.flagMode || game.buildMode }" />
      <div v-if="game.flagMode" class="flag-hint">🚩 Chạm vào chiến trường hoặc bản đồ nhỏ để cắm cờ · Esc để huỷ</div>
      <div v-else-if="game.buildMode" class="flag-hint">
        🔨 Chạm chỗ muốn dựng tháp (trên sân nhà) · bấm thợ xây lần nữa để dựng chỗ mặc định · Esc để huỷ
      </div>
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
          :class="{ disabled: !game.hud.units[k]?.can, picking: game.buildMode === k }"
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
          :class="{
            active: st.id === 'hold' ? game.flagMode || game.hud.stance === 'hold' : game.hud.stance === st.id,
            picking: st.id === 'hold' && game.flagMode,
          }"
          :title="
            st.id === 'hold'
              ? `Cắm cờ (${st.key}): bấm rồi chạm vào chiến trường hoặc bản đồ nhỏ, cả đội và quân mới xây ra đó đứng giữ`
              : `${st.label} (${st.key})`
          "
          @click="game.setStance(st.id)"
        >
          <span>{{ st.icon }}</span><small>{{ st.label }}</small>
        </button>
        <div class="formation-wrap">
          <button
            class="stance-btn formation-btn"
            :class="{ active: game.hud.formation !== 'free' || formationMenu }"
            title="Đội hình (F)"
            @click="formationMenu = !formationMenu"
          >
            <span>{{ FORMATION_INFO[game.hud.formation].icon }}</span><small>{{ FORMATION_INFO[game.hud.formation].label }}</small>
          </button>
          <div v-if="formationMenu" class="formation-menu" role="menu">
            <button
              v-for="f in FORMATION_CYCLE"
              :key="f"
              role="menuitemradio"
              :aria-checked="game.hud.formation === f"
              :class="{ active: game.hud.formation === f }"
              @click="pickFormation(f)"
            >
              <span class="fm-icon">{{ FORMATION_INFO[f].icon }}</span>
              <span class="fm-text"
                ><b>{{ FORMATION_INFO[f].label }}</b
                ><small>{{ FORMATION_INFO[f].tip }}</small></span
              >
            </button>
          </div>
        </div>
        <div class="mine-wrap">
          <button
            class="stance-btn center-btn"
            :class="{ active: mineMenu || game.hud.centerMine }"
            title="Chia thợ mỏ (R đổi nhanh): bạc sát nhà, vàng xa hơn, kim cương giữa bản đồ"
            @click="mineMenu = !mineMenu"
          >
            <span>⛏️</span><small>{{ game.hud.miners.join(' · ') }}</small>
          </button>
          <div v-if="mineMenu" class="formation-menu mine-menu" role="dialog" aria-label="Chia thợ mỏ">
            <b class="mine-title">Chia thợ mỏ</b>
            <div v-for="(m, i) in MINE_INFO" :key="m.label" class="mine-row">
              <span class="fm-icon">{{ m.icon }}</span>
              <span class="fm-text"
                ><b>{{ m.label }}</b
                ><small>{{ m.tip }}</small></span
              >
              <span class="mine-step">
                <button :aria-label="`Bớt 1 thợ ${m.label}`" :disabled="!canRemoveMiner(i)" @click="bumpMine(i, -1)">−</button>
                <b :aria-label="`${game.hud.miners[i]} thợ`"
                  >{{ game.hud.miners[i] }}<small v-if="Number.isFinite(mineCap(i))">/{{ mineCap(i) }}</small></b
                >
                <button :aria-label="`Thêm 1 thợ ${m.label}`" :disabled="!canAddMiner(i)" @click="bumpMine(i, 1)">+</button>
              </span>
            </div>
            <div class="mine-presets">
              <button
                v-for="p in MINE_PRESETS"
                :key="p.label"
                :class="{ active: isPreset(p.split) }"
                :title="p.tip"
                @click="game.setMineSplit(p.split)"
              >
                {{ p.label }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </footer>
  </main>
</template>
