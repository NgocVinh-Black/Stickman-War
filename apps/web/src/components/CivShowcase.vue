<script setup lang="ts">
import { FACTIONS, type FactionId } from '@stickman-war/core';
import { civDesc } from '@stickman-war/i18n/content';
import { computed } from 'vue';
import CivEmblem from './CivEmblem.vue';

/** Góc trái dưới sảnh: biểu tượng, tên và mô tả nền văn minh đang chọn (quân xem ở sân khấu giữa). */
const props = defineProps<{ faction: FactionId }>();
const fd = computed(() => FACTIONS[props.faction]);
</script>

<template>
  <div class="civ-show" :style="{ '--faction': fd.color }">
    <CivEmblem class="civ-show-icon" :faction="faction" :size="58" />
    <div class="civ-show-text">
      <h2>{{ fd.name }}</h2>
      <p>{{ civDesc(faction) }}</p>
    </div>
  </div>
</template>
