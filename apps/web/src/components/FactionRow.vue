<script setup lang="ts">
import { FACTIONS, FACTION_ORDER, type FactionId } from '@stickman-war/core';
import { sound } from '../lib/sound';

/** Hàng chọn tộc gọn: 8 nút biểu tượng, dùng trước trận và trong phòng chờ. */
const props = defineProps<{ modelValue: FactionId }>();
const emit = defineEmits<{ 'update:modelValue': [id: FactionId] }>();

function pick(id: FactionId): void {
  if (id === props.modelValue) return;
  sound.click();
  emit('update:modelValue', id);
}
</script>

<template>
  <div class="faction-row" role="radiogroup" aria-label="Chọn tộc">
    <button
      v-for="id in FACTION_ORDER"
      :key="id"
      class="faction-chip"
      :class="{ active: id === modelValue }"
      :style="{ '--faction': FACTIONS[id].color }"
      role="radio"
      :aria-checked="id === modelValue"
      :title="FACTIONS[id].name"
      @click="pick(id)"
    >
      <span>{{ FACTIONS[id].icon }}</span><small>{{ FACTIONS[id].name }}</small>
    </button>
  </div>
</template>
