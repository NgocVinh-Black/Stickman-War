<script setup lang="ts">
import { useUi } from '../stores/ui';

const ui = useUi();
</script>

<template>
  <div v-if="ui.toastMsg" :key="ui.toastMsg.id" class="toast" :style="{ animationDuration: `${ui.toastMsg.ms}ms` }">
    {{ ui.toastMsg.text }}
  </div>
</template>
