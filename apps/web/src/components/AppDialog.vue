<script setup lang="ts">
import { UNITS } from '@stickman-war/core';
import { computed } from 'vue';
import { t } from '@stickman-war/i18n';
import { unitCounter, unitDesc, unitName } from '@stickman-war/i18n/content';
import { sound } from '../lib/sound';
import { useUi } from '../stores/ui';
import FactionPicker from './FactionPicker.vue';
import FactionRow from './FactionRow.vue';
import HowToContent from './HowToContent.vue';
import LegalContent from './LegalContent.vue';
import MatchupCard from './MatchupCard.vue';
import SettingsPanel from './SettingsPanel.vue';
import UnitIcon from './UnitIcon.vue';

/** Một hộp thoại dùng chung cho cả game: nội dung dựng từ dữ liệu trong store ui (không chèn HTML). */
const ui = useUi();
const d = computed(() => ui.dialog);

function back(): void {
  sound.click();
  const cur = ui.dialog;
  ui.close();
  if (cur?.kind === 'howto') cur.back?.();
}
</script>

<template>
  <div v-if="d" class="overlay" :class="{ 'wide-overlay': d.kind === 'faction' }">
    <div class="dialog">
      <template v-if="d.kind === 'generic'">
        <div v-if="d.spinner" class="spinner" />
        <div v-if="d.emoji" class="big-emoji">{{ d.emoji }}</div>
        <div v-if="d.stars" class="stars">
          {{ '★'.repeat(d.stars) }}<i>{{ '★'.repeat(3 - d.stars) }}</i>
        </div>
        <p v-if="d.eyebrow" class="eyebrow">{{ d.eyebrow }}</p>
        <h2>{{ d.title }}</h2>
        <p v-for="(line, i) in d.lines" :key="i">{{ line }}</p>
        <template v-if="d.code">
          <div class="room-code">{{ d.code }}</div>
          <p class="small">
            {{ t('online.orLink') }}<br /><span class="link">{{ d.link }}</span>
          </p>
        </template>
        <MatchupCard v-if="d.matchup" :mine="d.matchup[0]" :theirs="d.matchup[1]" />
        <template v-if="d.matchup && d.pickFaction">
          <p class="small">{{ t('civ.pickForMatch') }}</p>
          <FactionRow :model-value="d.matchup[0]" @update:model-value="d.pickFaction" />
        </template>
        <div v-for="unit in d.newUnits" :key="unit" class="new-unit">
          <UnitIcon :kind="unit" />
          <div>
            <small>{{ t('game.newUnit') }}</small><b>{{ unitName(unit) }}</b>
            <span>{{ unitDesc(unit) }} · {{ t('common.gold', { n: UNITS[unit].cost }) }}</span>
            <span class="counter">{{ unitCounter(unit) }}</span>
          </div>
        </div>
        <div v-if="d.stats" class="stats">
          <div>
            <b>{{ d.stats.time }}</b><small>{{ t('game.stats.time') }}</small>
          </div>
          <div>
            <b>{{ d.stats.kills }}</b><small>{{ t('game.stats.kills') }}</small>
          </div>
          <div>
            <b>{{ d.stats.statue }}%</b><small>{{ t('game.stats.statue') }}</small>
          </div>
        </div>
        <p v-if="d.status" class="bet-result">{{ d.status }}</p>
        <p v-if="d.small" class="small">{{ d.small }}</p>
        <div class="dialog-actions">
          <button
            v-for="b in d.buttons"
            :key="b.label"
            class="btn"
            :class="{ 'btn-primary': b.primary }"
            :disabled="b.disabled"
            @click="ui.press(b)"
          >
            {{ b.label }}
          </button>
        </div>
      </template>

      <template v-else-if="d.kind === 'faction'">
        <FactionPicker :on-pick="d.onPick" />
        <div class="dialog-actions">
          <button class="btn" @click="ui.close()">{{ t('common.close') }}</button>
        </div>
      </template>

      <template v-else-if="d.kind === 'howto'">
        <h2>{{ t('common.howto') }}</h2>
        <HowToContent />
        <div class="dialog-actions">
          <button class="btn btn-primary" @click="back">{{ t('common.gotIt') }}</button>
        </div>
      </template>

      <template v-else-if="d.kind === 'legal'">
        <h2>{{ d.which === 'terms' ? t('legal.terms') : t('legal.privacy') }}</h2>
        <LegalContent :which="d.which" />
        <div class="dialog-actions">
          <button class="btn btn-primary" @click="ui.close()">{{ t('common.gotIt') }}</button>
        </div>
      </template>

      <SettingsPanel v-else-if="d.kind === 'settings'" />
    </div>
  </div>
</template>
