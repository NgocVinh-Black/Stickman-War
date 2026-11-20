<script setup lang="ts">
import { LANGS, lang } from '@stickman-war/i18n';

/** Nút đổi ngôn ngữ (dùng chung lựa chọn với game). */
</script>

<template>
  <div class="lang-switch" role="radiogroup" aria-label="Language">
    <button
      v-for="l in LANGS"
      :key="l.id"
      class="btn ghost"
      :class="{ active: lang === l.id }"
      role="radio"
      :aria-checked="lang === l.id"
      :title="l.label"
      @click="lang = l.id"
    >
      {{ l.flag }} {{ l.id.toUpperCase() }}
    </button>
  </div>
</template>
