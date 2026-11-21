<script setup lang="ts">
import { civName } from '@stickman-war/i18n/content';
import { FACTIONS, FACTION_ORDER, type FactionId } from '@stickman-war/core';
import { t } from '@stickman-war/i18n';
import { sound } from '../lib/sound';
import CivEmblem from './CivEmblem.vue';

/** Hàng chọn nền văn minh gọn: 12 nút biểu tượng, dùng trước trận và trong phòng chờ. */
const props = defineProps<{ modelValue: FactionId }>();
const emit = defineEmits<{ 'update:modelValue': [id: FactionId] }>();

function pick(id: FactionId): void {
  if (id === props.modelValue) return;
  sound.click();
  emit('update:modelValue', id);
}
</script>

<template>
  <div class="faction-row" role="radiogroup" :aria-label="t('civ.pickTitle')">
    <button
      v-for="id in FACTION_ORDER"
      :key="id"
      class="faction-chip"
      :class="{ active: id === modelValue }"
      :style="{ '--faction': FACTIONS[id].color }"
      role="radio"
      :aria-checked="id === modelValue"
      :title="civName(id)"
      @click="pick(id)"
    >
      <CivEmblem :faction="id" :size="30" /><small>{{ civName(id) }}</small>
    </button>
  </div>
</template>
