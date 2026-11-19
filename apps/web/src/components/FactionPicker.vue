<script setup lang="ts">
import { FACTIONS, FACTION_ORDER, kindOf, type FactionId } from '@stickman-war/core';
import { sound } from '../lib/sound';
import { chooseFaction } from '../lib/faction';
import { useSettings } from '../stores/settings';
import { useUi } from '../stores/ui';
import UnitIcon from './UnitIcon.vue';

/** Bảng chọn tộc: mỗi tộc kèm điểm mạnh, điểm yếu và hình vài quân tiêu biểu. */
const props = defineProps<{ onPick?: () => void }>();
const settings = useSettings();
const ui = useUi();
const preview = ['sword', 'cavalry', 'catapult', 'giant'] as const;

function pick(id: FactionId): void {
  chooseFaction(id);
  sound.click();
  ui.toast(`${FACTIONS[id].icon} Đã chọn ${FACTIONS[id].name}`, 1500);
  ui.close();
  props.onPick?.();
}
</script>

<template>
  <h2>Chọn tộc</h2>
  <p class="muted">
    Mỗi tộc có 12 loại quân riêng, điểm mạnh và điểm yếu riêng. Không có tộc nào khắc cứng tộc nào: thắng thua do chọn quân và chiến thuật.
  </p>
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
        <span class="bad">⚠️ {{ FACTIONS[id].weakness }}</span>
      </p>
    </button>
  </div>
</template>
