<script setup lang="ts">
import { CAMPAIGN, DIFFS, LEVELS, SKIRMISH, type Difficulty } from '@nguoi-que/core';
import { sound } from '../../lib/sound';
import { useGame } from '../../stores/game';
import { useSettings } from '../../stores/settings';
import { useUi } from '../../stores/ui';

/** Chơi đơn: chiến dịch 8 màn × 3 độ khó, đấu với máy. */
const settings = useSettings();
const game = useGame();
const ui = useUi();
const skirmishDiffs = Object.keys(SKIRMISH) as Difficulty[];

function pickDiff(d: Difficulty): void {
  if (!settings.diffOpen(d)) {
    const prev = CAMPAIGN[DIFFS[DIFFS.indexOf(d) - 1]].label;
    ui.toast(`Thắng hết ${LEVELS.length} màn ${prev} để mở mức ${CAMPAIGN[d].label}`, 2500);
    return;
  }
  sound.click();
  settings.campDiff = d;
}
</script>

<template>
  <h2 class="section-title">Chiến dịch</h2>
  <div class="diff-row camp-diff" role="radiogroup" aria-label="Độ khó chiến dịch">
    <button
      v-for="d in DIFFS"
      :key="d"
      class="btn diff"
      :class="[`diff-${d}`, { active: d === settings.campDiff, locked: !settings.diffOpen(d) }]"
      role="radio"
      :aria-checked="d === settings.campDiff"
      @click="pickDiff(d)"
    >
      {{ settings.diffOpen(d) ? '' : '🔒 ' }}{{ CAMPAIGN[d].label }}{{ settings.progress[d].completed ? ' 👑' : '' }}
    </button>
  </div>
  <button class="btn btn-primary wide" @click="game.startCampaign(settings.nextLevel)">
    {{
      settings.current.unlocked > 0
        ? `⚔️ Chơi tiếp · Màn ${settings.nextLevel + 1}`
        : `⚔️ Bắt đầu chiến dịch ${CAMPAIGN[settings.campDiff].label}`
    }}
  </button>
  <div class="level-grid">
    <button
      v-for="(lv, i) in LEVELS"
      :key="i"
      class="level"
      :class="{ locked: i > settings.current.unlocked }"
      :disabled="i > settings.current.unlocked"
      :title="lv.name"
      @click="game.startCampaign(i)"
    >
      <span class="level-num">{{ i > settings.current.unlocked ? '🔒' : i + 1 }}</span>
      <span class="level-stars"
        >{{ '★'.repeat(settings.current.stars[i] ?? 0) }}<i>{{ '★'.repeat(3 - (settings.current.stars[i] ?? 0)) }}</i></span
      >
    </button>
  </div>
  <h2 class="section-title">Đấu với máy</h2>
  <div class="diff-row">
    <button v-for="d in skirmishDiffs" :key="d" class="btn diff" :class="`diff-${d}`" @click="game.startSkirmish(d)">
      {{ SKIRMISH[d].label }}
    </button>
  </div>
</template>
