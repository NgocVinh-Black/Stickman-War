<script setup lang="ts">
import { FACTIONS, FACTION_ORDER, kindOf, type FactionId } from '@stickman-war/core';
import { t } from '@stickman-war/i18n';
import { civDesc, civName, civPassive, ultDesc, ultName, civWeakness } from '@stickman-war/i18n/content';
import { sound } from '../lib/sound';
import { chooseFaction } from '../lib/faction';
import { useSettings } from '../stores/settings';
import { useUi } from '../stores/ui';
import UnitIcon from './UnitIcon.vue';
import { ENERGY } from '../game/render/palette';
import CivEmblem from './CivEmblem.vue';

/** Bảng chọn nền văn minh: mỗi nền văn minh kèm điểm mạnh, điểm yếu và hình vài quân tiêu biểu. */
const props = defineProps<{ onPick?: () => void }>();
const settings = useSettings();
const ui = useUi();
const preview = ['sword', 'cavalry', 'catapult', 'giant'] as const;

function pick(id: FactionId): void {
  chooseFaction(id);
  sound.click();
  ui.toast(t('civ.picked', { icon: FACTIONS[id].icon, name: civName(id) }), 1500);
  ui.close();
  props.onPick?.();
}
</script>

<template>
  <h2>{{ t('civ.pickTitle') }}</h2>
  <p class="muted">
    {{ t('civ.pickIntro') }}
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
        <CivEmblem :faction="id" :size="36" /><b>{{ civName(id) }}</b>
      </div>
      <div class="faction-preview"><UnitIcon v-for="a in preview" :key="a" :kind="kindOf(id, a)" :accent="ENERGY[id]" /></div>
      <p>{{ civDesc(id) }}</p>
      <p class="faction-passive">✨ {{ civPassive(id) }}</p>
      <p class="faction-passive">🌟 {{ ultName(id) }}: {{ ultDesc(id) }}</p>
      <p class="faction-vs">
        <span class="bad">⚠️ {{ civWeakness(id) }}</span>
      </p>
    </button>
  </div>
</template>
