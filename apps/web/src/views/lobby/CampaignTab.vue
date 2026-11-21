<script setup lang="ts">
import { FACTIONS, FACTION_ORDER, ROUND, SKIRMISH, isBoss, type Difficulty, type FactionId } from '@stickman-war/core';
import { computed } from 'vue';
import { sound } from '../../lib/sound';
import { t } from '@stickman-war/i18n';
import { levelName } from '@stickman-war/i18n/content';
import { useGame } from '../../stores/game';
import { useSettings } from '../../stores/settings';
import CivEmblem from '../../components/CivEmblem.vue';

/**
 * Chơi đơn: chiến dịch chia 12 tab theo tộc. Ở tab nào thì cầm đúng tộc đó, đi 3 vòng × 11 màn từ dễ tới khó,
 * mỗi vòng gặp đủ 11 tộc còn lại (thứ tự xáo riêng cho từng tộc).
 */
const settings = useSettings();
const game = useGame();
const skirmishDiffs = Object.keys(SKIRMISH) as Difficulty[];

const mine = computed(() => FACTIONS[settings.campFaction]);
const enemyOf = (i: number): FactionId => settings.enemyFactions[i];

/** 3 vòng, mỗi vòng gặp đủ 11 tộc còn lại. */
const range = (from: number) => Array.from({ length: ROUND }, (_, k) => from + k);
const PARTS = [
  { title: 'campaign.round1', desc: 'campaign.round1Desc', levels: range(0) },
  { title: 'campaign.round2', desc: 'campaign.round2Desc', levels: range(ROUND) },
  { title: 'campaign.round3', desc: 'campaign.round3Desc', levels: range(2 * ROUND) },
] as const;

function pickFaction(f: FactionId): void {
  sound.click();
  settings.campFaction = f;
}
</script>

<template>
  <h2 class="section-title">{{ t('campaign.title') }}</h2>
  <div class="camp-tabs" role="tablist" :aria-label="t('campaign.pick')">
    <button
      v-for="f in FACTION_ORDER"
      :key="f"
      class="camp-tab"
      :class="{ active: f === settings.campFaction }"
      :style="{ '--faction': FACTIONS[f].color }"
      role="tab"
      :aria-selected="f === settings.campFaction"
      @click="pickFaction(f)"
    >
      <CivEmblem class="camp-tab-icon" :faction="f" :size="36" />
      <span class="camp-tab-name">{{ FACTIONS[f].name }}</span>
      <small>{{ settings.progress[f].completed ? '👑' : '★' }} {{ settings.factionStars(f) }}/{{ settings.tabMax }}</small>
    </button>
  </div>
  <button class="btn btn-primary wide" @click="game.startCampaign(settings.nextLevel)">
    {{
      settings.current.unlocked > 0
        ? t('campaign.continue', { icon: mine.icon, name: mine.name, n: settings.nextLevel + 1 })
        : t('campaign.start', { icon: mine.icon, name: mine.name })
    }}
  </button>
  <template v-for="part in PARTS" :key="part.title">
    <h3 class="level-part">
      {{ t(part.title) }} <small>{{ t(part.desc) }}</small>
    </h3>
    <div class="level-grid">
      <button
        v-for="i in part.levels"
        :key="i"
        class="level"
        :class="{ locked: i > settings.current.unlocked }"
        :disabled="i > settings.current.unlocked"
        :title="
          t('campaign.levelTitle', { name: levelName(i), boss: isBoss(i) ? t('campaign.boss') : '', enemy: FACTIONS[enemyOf(i)].name })
        "
        @click="game.startCampaign(i)"
      >
        <span class="level-num">{{ i > settings.current.unlocked ? '🔒 ' : isBoss(i) ? '👑 ' : '' }}{{ i + 1 }}</span>
        <span class="level-enemy">{{ FACTIONS[enemyOf(i)].icon }} {{ FACTIONS[enemyOf(i)].name }}</span>
        <span class="level-stars"
          >{{ '★'.repeat(settings.current.stars[i] ?? 0) }}<i>{{ '★'.repeat(3 - (settings.current.stars[i] ?? 0)) }}</i></span
        >
      </button>
    </div>
  </template>
  <h2 class="section-title">{{ t('campaign.vsAi') }}</h2>
  <div class="diff-row">
    <button v-for="d in skirmishDiffs" :key="d" class="btn diff" :class="`diff-${d}`" @click="game.startSkirmish(d)">
      {{ t(`skirmish.${d}`) }}
    </button>
  </div>
</template>
