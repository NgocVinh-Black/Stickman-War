<script setup lang="ts">
import { FACTIONS, FACTION_ORDER, counteredBy, kindOf, type FactionId } from '@stickman-war/core';
import { sound } from '../lib/sound';
import { auth, updateProfile } from '../net/account';
import { useOnline } from '../stores/online';
import { useSettings } from '../stores/settings';
import { useUi } from '../stores/ui';
import UnitIcon from './UnitIcon.vue';

/** Bảng chọn tộc: mỗi tộc kèm nội tại, khắc / bị khắc và hình vài quân tiêu biểu. */
const props = defineProps<{ onPick?: () => void }>();
const settings = useSettings();
const online = useOnline();
const ui = useUi();
const preview = ['sword', 'cavalry', 'catapult', 'giant'] as const;
const names = (ids: FactionId[]) => ids.map((x) => `${FACTIONS[x].icon} ${FACTIONS[x].name}`).join(', ');

function pick(id: FactionId): void {
  settings.faction = id;
  online.send({ t: 'faction', id });
  if (auth.account) void updateProfile({ faction: id }).catch(() => {});
  sound.click();
  ui.toast(`${FACTIONS[id].icon} Đã chọn ${FACTIONS[id].name}`, 1500);
  ui.close();
  props.onPick?.();
}
</script>

<template>
  <h2>Chọn tộc</h2>
  <p class="muted">Mỗi tộc có 12 loại quân riêng, nội tại riêng. Tộc khắc được tộc khác thì gây thêm 20% sát thương.</p>
  <div class="faction-grid">
    <button
      v-for="id in FACTION_ORDER"
      :key="id"
      class="faction-card"
      :class="{ active: id === settings.faction }"
      :style="{ '--faction': FACTIONS[id].color }"
      @click="pick(id)"
    >
      <div class="faction-head">
        <span class="faction-icon">{{ FACTIONS[id].icon }}</span><b>{{ FACTIONS[id].name }}</b>
      </div>
      <div class="faction-preview"><UnitIcon v-for="a in preview" :key="a" :kind="kindOf(id, a)" /></div>
      <p>{{ FACTIONS[id].desc }}</p>
      <p class="faction-passive">✨ {{ FACTIONS[id].passive }}</p>
      <p class="faction-vs">
        <span class="good">Khắc: {{ names(FACTIONS[id].counters) }}</span>
        <span class="bad">Sợ: {{ names(counteredBy(id)) }}</span>
      </p>
    </button>
  </div>
</template>
