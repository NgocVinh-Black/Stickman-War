<script setup lang="ts">
import { FACTIONS, type FactionId } from '@stickman-war/core';
import { computed } from 'vue';
import { t } from '@stickman-war/i18n';

/** Thẻ đối đầu trước trận: nền văn minh hai bên (chi tiết xem trong Cẩm nang). */
const props = defineProps<{ mine: FactionId; theirs: FactionId }>();
const a = computed(() => FACTIONS[props.mine]);
const b = computed(() => FACTIONS[props.theirs]);
</script>

<template>
  <div class="matchup">
    <div :style="{ '--faction': a.color }">
      <span>{{ a.icon }}</span><b>{{ a.name }}</b
      ><small>{{ t('civ.you') }}</small>
    </div>
    <i>VS</i>
    <div :style="{ '--faction': b.color }">
      <span>{{ b.icon }}</span><b>{{ b.name }}</b
      ><small>{{ t('civ.enemy') }}</small>
    </div>
  </div>
</template>
