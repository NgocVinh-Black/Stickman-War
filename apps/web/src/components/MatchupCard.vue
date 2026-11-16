<script setup lang="ts">
import { FACTIONS, type FactionId } from '@stickman-war/core';
import { computed } from 'vue';

/** Thẻ đối đầu trước trận: tộc hai bên và ai khắc ai. */
const props = defineProps<{ mine: FactionId; theirs: FactionId }>();
const a = computed(() => FACTIONS[props.mine]);
const b = computed(() => FACTIONS[props.theirs]);
</script>

<template>
  <div class="matchup">
    <div :style="{ '--faction': a.color }">
      <span>{{ a.icon }}</span><b>{{ a.name }}</b
      ><small>Bạn</small>
    </div>
    <i>VS</i>
    <div :style="{ '--faction': b.color }">
      <span>{{ b.icon }}</span><b>{{ b.name }}</b
      ><small>Địch</small>
    </div>
    <p>
      <span v-if="a.counters.includes(theirs)" class="good">Tộc bạn <b>khắc</b> {{ b.name }}: +20% sát thương</span>
      <span v-else-if="b.counters.includes(mine)" class="bad">{{ b.name }} <b>khắc</b> tộc bạn: địch +20% sát thương</span>
      <span v-else>Không bên nào khắc bên nào</span>
    </p>
  </div>
</template>
