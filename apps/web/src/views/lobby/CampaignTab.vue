<script setup lang="ts">
import { CAMPAIGN, DIFFS, FACTIONS, LEVELS, SKIRMISH, type Difficulty, type FactionId } from '@stickman-war/core';
import { sound } from '../../lib/sound';
import { useGame } from '../../stores/game';
import { useSettings } from '../../stores/settings';

/** Chơi đơn: chiến dịch 16 màn × 3 độ khó, tộc địch xáo ngẫu nhiên, đấu với máy. Mỗi màn ghi tộc địch; tộc của mình chọn ngay trước khi vào trận. */
const settings = useSettings();
const game = useGame();
const skirmishDiffs = Object.keys(SKIRMISH) as Difficulty[];

const enemyOf = (i: number): FactionId => settings.enemyFactions[i];

/** Chiến dịch chia 2 phần: làm quen từng loại quân, rồi chinh phạt với đủ quân và lối đánh khác nhau. */
const TUTORIAL = 8;
const PARTS = [
  { title: '📘 Làm quen', desc: 'mỗi màn mở thêm quân mới', levels: LEVELS.slice(0, TUTORIAL).map((_, i) => i) },
  { title: '⚔️ Chinh phạt', desc: 'đủ quân, mỗi màn máy một lối đánh', levels: LEVELS.slice(TUTORIAL).map((_, i) => i + TUTORIAL) },
];

function pickDiff(d: Difficulty): void {
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
      :class="[`diff-${d}`, { active: d === settings.campDiff }]"
      role="radio"
      :aria-checked="d === settings.campDiff"
      @click="pickDiff(d)"
    >
      {{ CAMPAIGN[d].label }}{{ settings.progress[d].completed ? ' 👑' : '' }}
    </button>
  </div>
  <button class="btn btn-primary wide" @click="game.startCampaign(settings.nextLevel)">
    {{
      settings.current.unlocked > 0
        ? `⚔️ Chơi tiếp · Màn ${settings.nextLevel + 1}`
        : `⚔️ Bắt đầu chiến dịch ${CAMPAIGN[settings.campDiff].label}`
    }}
  </button>
  <template v-for="part in PARTS" :key="part.title">
    <h3 class="level-part">
      {{ part.title }} <small>{{ part.desc }}</small>
    </h3>
    <div class="level-grid">
      <button
        v-for="i in part.levels"
        :key="i"
        class="level"
        :class="{ locked: i > settings.current.unlocked }"
        :disabled="i > settings.current.unlocked"
        :title="`${LEVELS[i].name}: gặp ${FACTIONS[enemyOf(i)].name}`"
        @click="game.startCampaign(i)"
      >
        <span class="level-num">{{ i > settings.current.unlocked ? '🔒 ' : '' }}{{ i + 1 }}</span>
        <span class="level-enemy">{{ FACTIONS[enemyOf(i)].icon }} {{ FACTIONS[enemyOf(i)].name }}</span>
        <span class="level-stars"
          >{{ '★'.repeat(settings.current.stars[i] ?? 0) }}<i>{{ '★'.repeat(3 - (settings.current.stars[i] ?? 0)) }}</i></span
        >
      </button>
    </div>
  </template>
  <h2 class="section-title">Đấu với máy</h2>
  <div class="diff-row">
    <button v-for="d in skirmishDiffs" :key="d" class="btn diff" :class="`diff-${d}`" @click="game.startSkirmish(d)">
      {{ SKIRMISH[d].label }}
    </button>
  </div>
</template>
