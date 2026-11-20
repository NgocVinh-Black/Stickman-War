<script setup lang="ts">
import { ref } from 'vue';
import { LANGS, lang, t } from '@stickman-war/i18n';
import { sound } from '../lib/sound';
import { auth } from '../net/account';
import { useSettings } from '../stores/settings';
import { useUi } from '../stores/ui';

/** Cài đặt: ngôn ngữ, âm thanh, âm lượng, mẹo trong trận, rung màn hình, tên khi chơi khách. */
const settings = useSettings();
const ui = useUi();
const guestName = ref(settings.name);

function toggleSound(): void {
  settings.toggleSound();
  sound.click();
}

function save(): void {
  if (!auth.account) settings.setName(guestName.value);
  sound.click();
  const cur = ui.dialog;
  ui.close();
  if (cur?.kind === 'settings') cur.back?.();
}
</script>

<template>
  <h2>⚙️ {{ t('settings.title') }}</h2>
  <div class="settings">
    <div class="set-row">
      <span>🌐 {{ t('settings.language') }}</span>
      <div class="set-seg" role="radiogroup" :aria-label="t('settings.language')">
        <button
          v-for="l in LANGS"
          :key="l.id"
          class="pill"
          :class="{ active: lang === l.id }"
          role="radio"
          :aria-checked="lang === l.id"
          @click="(sound.click(), (lang = l.id))"
        >
          {{ l.flag }} {{ l.label }}
        </button>
      </div>
    </div>
    <div class="set-row">
      <span>{{ settings.muted ? '🔇' : '🔊' }} {{ t('settings.sound') }}</span>
      <button class="pill" :class="{ active: !settings.muted }" role="switch" :aria-checked="!settings.muted" @click="toggleSound">
        {{ settings.muted ? t('settings.off') : t('settings.on') }}
      </button>
    </div>
    <label class="set-row">
      <span>🎚️ {{ t('settings.volume') }}</span>
      <span class="set-range">
        <input
          v-model.number="settings.volume"
          type="range"
          min="0"
          max="1"
          step="0.05"
          :disabled="settings.muted"
          @change="sound.click()"
        />
        <b>{{ Math.round(settings.volume * 100) }}%</b>
      </span>
    </label>
    <div class="set-row">
      <span
        >💡 {{ t('settings.tips') }}<small>{{ t('settings.tipsDesc') }}</small></span
      >
      <button
        class="pill"
        :class="{ active: settings.tips }"
        role="switch"
        :aria-checked="settings.tips"
        @click="(sound.click(), (settings.tips = !settings.tips))"
      >
        {{ settings.tips ? t('settings.on') : t('settings.off') }}
      </button>
    </div>
    <div class="set-row">
      <span
        >📳 {{ t('settings.shake') }}<small>{{ t('settings.shakeDesc') }}</small></span
      >
      <button
        class="pill"
        :class="{ active: settings.shake }"
        role="switch"
        :aria-checked="settings.shake"
        @click="(sound.click(), (settings.shake = !settings.shake))"
      >
        {{ settings.shake ? t('settings.on') : t('settings.off') }}
      </button>
    </div>
    <label v-if="!auth.account" class="field">
      <span>{{ t('settings.guestName') }}</span>
      <input v-model="guestName" maxlength="16" autocomplete="nickname" @keydown.enter="save" />
    </label>
  </div>
  <div class="dialog-actions">
    <button class="btn btn-primary" @click="save">{{ t('common.save') }}</button>
  </div>
</template>
