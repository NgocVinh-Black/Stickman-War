<script setup lang="ts">
import { ARCH_ORDER, FACTIONS, UNITS, kindOf, roster, wallKind, type FactionId, type UnitKind } from '@stickman-war/core';
import { t } from '@stickman-war/i18n';
import { unitCounter, unitDesc, unitName } from '@stickman-war/i18n/content';
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { armorLabel, dmgLabel, roleKey, traits } from '../lib/guide';
import { sound } from '../lib/sound';
import UnitIcon from './UnitIcon.vue';
import UnitPreview from './UnitPreview.vue';

/**
 * Cẩm nang: lướt từng quân của một nền văn minh (12 quân + trạm vàng + tường), mỗi quân một thẻ lớn:
 * hình động, vai trò & cách dùng, đủ chỉ số kèm thanh so sánh với mọi quân trong game, kỹ năng, khắc chế.
 * Lướt bằng nút ‹ ›, phím ← →, vuốt ngang hoặc bấm hình nhỏ.
 */
const props = defineProps<{ faction: FactionId }>();
const units = computed<UnitKind[]>(() => [...roster(props.faction), kindOf(props.faction, 'tower'), wallKind(props.faction)]);
const idx = ref(0);
watch(
  () => props.faction,
  () => (idx.value = 0),
);
const kind = computed(() => units.value[idx.value]);
const s = computed(() => UNITS[kind.value]);
const color = computed(() => FACTIONS[props.faction].color);

function go(d: number): void {
  sound.click();
  idx.value = (idx.value + d + units.value.length) % units.value.length;
}

// Giá trị lớn nhất mỗi chỉ số trong toàn bộ quân (để vẽ thanh so sánh)
const all = Object.values(UNITS).filter((u) => ARCH_ORDER.includes(u.arch));
const dps = (u: (typeof all)[number]) => ((u.damage || u.heal || 0) * (u.spawnCount ?? 1)) / Math.max(0.1, u.cooldown);
const MAX = {
  hp: Math.max(...all.map((u) => u.hp)),
  dps: Math.max(...all.map(dps)),
  range: Math.max(...all.map((u) => u.range)),
  speed: Math.max(...all.map((u) => u.speed)),
};
const pct = (v: number, max: number) => `${Math.round(Math.min(1, v / max) * 100)}%`;
const melee = (u: (typeof all)[number]) => !u.projectile && !u.heal && u.range < 100;

/** Các dòng chỉ số: nhãn, giá trị hiển thị, độ dài thanh (nếu có). */
const rows = computed(() => {
  const u = s.value;
  const out: { label: string; value: string; bar?: string }[] = [];
  out.push({ label: t('guide.stat.cost'), value: u.cost ? `${u.cost} 💰` : t('guide.stat.free') });
  out.push({ label: t('guide.stat.hp'), value: String(Math.round(u.hp)), bar: pct(u.hp, MAX.hp) });
  if (u.damage) out.push({ label: t('guide.stat.dmg'), value: String(Math.round(u.damage) * (u.spawnCount ?? 1)) });
  if (u.damage || u.heal) {
    out.push({ label: t('guide.stat.dps'), value: dps(u).toFixed(1), bar: pct(dps(u), MAX.dps) });
    out.push({ label: t('guide.stat.rate'), value: t('guide.stat.perSec', { n: (1 / u.cooldown).toFixed(2) }) });
    out.push({
      label: t('guide.stat.range'),
      value: melee(u) ? t('guide.stat.melee') : String(Math.round(u.range)),
      bar: pct(u.range, MAX.range),
    });
  }
  if (u.speed) out.push({ label: t('guide.stat.speed'), value: String(Math.round(u.speed)), bar: pct(u.speed, MAX.speed) });
  out.push({ label: t('guide.stat.armor'), value: `${Math.round((u.armor ?? 0) * 100)}%` });
  out.push({ label: t('guide.stat.type'), value: dmgLabel(u.dmgType) });
  out.push({ label: t('guide.stat.armorType'), value: armorLabel(u.armorType) });
  if (u.pop) out.push({ label: t('guide.stat.pop'), value: String(u.pop * (u.spawnCount ?? 1)) });
  const time = u.trainTime || u.buildTime;
  if (time) out.push({ label: t('guide.stat.train'), value: t('guide.stat.sec', { n: time }) });
  return out;
});

const onKey = (e: KeyboardEvent) => {
  if (e.target instanceof HTMLInputElement) return;
  if (e.key === 'ArrowLeft') go(-1);
  if (e.key === 'ArrowRight') go(1);
};
let swipeX: number | null = null;
const down = (e: PointerEvent) => (swipeX = e.clientX);
const up = (e: PointerEvent) => {
  if (swipeX !== null && Math.abs(e.clientX - swipeX) > 40) go(e.clientX < swipeX ? 1 : -1);
  swipeX = null;
};
onMounted(() => document.addEventListener('keydown', onKey));
onBeforeUnmount(() => document.removeEventListener('keydown', onKey));
</script>

<template>
  <div class="unit-card" :style="{ '--faction': color }" @pointerdown="down" @pointerup="up">
    <button class="uc-nav uc-prev" :aria-label="t('guide.prev')" @click="go(-1)">‹</button>
    <div class="uc-hero">
      <UnitPreview :kind="kind" />
      <span class="uc-count">{{ idx + 1 }}/{{ units.length }}</span>
    </div>
    <div class="uc-info">
      <h3>{{ unitName(kind) }}</h3>
      <p class="uc-desc">{{ unitDesc(kind) }}</p>
      <h4>{{ t('guide.roleTitle') }}</h4>
      <p>{{ t(roleKey(s)) }}</p>
      <h4>{{ t('guide.statsTitle') }}</h4>
      <dl class="uc-stats">
        <div v-for="r in rows" :key="r.label">
          <dt>{{ r.label }}</dt>
          <dd>
            <b>{{ r.value }}</b>
            <i v-if="r.bar" class="uc-bar"><i :style="{ width: r.bar }" /></i>
          </dd>
        </div>
      </dl>
      <h4>{{ t('guide.specialTitle') }}</h4>
      <p>{{ traits(s).join(' · ') || t('guide.none') }}</p>
      <h4>{{ t('guide.counterTitle') }}</h4>
      <p>{{ unitCounter(kind) || t('guide.none') }}</p>
    </div>
    <button class="uc-nav uc-next" :aria-label="t('guide.next')" @click="go(1)">›</button>
  </div>
  <div class="uc-thumbs" role="tablist">
    <button
      v-for="(k, i) in units"
      :key="k"
      class="uc-thumb"
      :class="{ active: i === idx }"
      role="tab"
      :aria-selected="i === idx"
      :title="unitName(k)"
      @click="(sound.click(), (idx = i))"
    >
      <UnitIcon :kind="k" />
    </button>
  </div>
</template>
