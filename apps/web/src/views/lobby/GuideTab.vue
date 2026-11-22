<script setup lang="ts">
import { DAMAGE_TABLE, FACTIONS, FACTION_ORDER, type FactionId } from '@stickman-war/core';
import { computed, ref } from 'vue';
import HowToContent from '../../components/HowToContent.vue';
import UnitCarousel from '../../components/UnitCarousel.vue';
import { lang, t } from '@stickman-war/i18n';
import { civBeat, civDesc, civName, civPassive, ultDesc, ultName, civWeakness } from '@stickman-war/i18n/content';
import { ARMOR_TYPES, DMG_TYPES, GUIDE_PAGES, armorLabel, dmgLabel, type GuidePage } from '../../lib/guide';
import { sound } from '../../lib/sound';
import { useSettings } from '../../stores/settings';
import CivEmblem from '../../components/CivEmblem.vue';

/** Cẩm nang: cách chơi, bảng quân 12 nền văn minh, bảng khắc chế, điểm mạnh / yếu từng nền văn minh, chiến thuật. */
const settings = useSettings();
const page = ref<GuidePage>('basics');
const faction = ref<FactionId>(settings.faction);
const fd = computed(() => FACTIONS[faction.value]);
const cellClass = (v: number) => (v >= 1.2 ? 'good' : v <= 0.8 ? 'bad' : '');
const go = (p: GuidePage) => {
  sound.click();
  page.value = p;
};
</script>

<template>
  <div class="guide-nav">
    <button v-for="g in GUIDE_PAGES" :key="g.id" class="pill" :class="{ active: g.id === page }" @click="go(g.id)">{{ t(g.key) }}</button>
  </div>
  <div class="guide-body">
    <HowToContent v-if="page === 'basics'" />

    <template v-else-if="page === 'factions'">
      <div class="guide-faction-pills">
        <button
          v-for="id in FACTION_ORDER"
          :key="id"
          class="pill"
          :class="{ active: id === faction }"
          :style="{ '--faction': FACTIONS[id].color }"
          @click="(sound.click(), (faction = id))"
        >
          {{ FACTIONS[id].icon }} {{ civName(id) }}
        </button>
      </div>
      <div class="guide-faction-head" :style="{ '--faction': fd.color }">
        <CivEmblem :faction="faction" :size="56" />
        <div>
          <h3>{{ civName(faction) }}</h3>
          <p>{{ civDesc(faction) }}</p>
          <p class="faction-passive">✨ {{ civPassive(faction) }}</p>
          <p class="faction-passive">
            🌟 {{ t('civ.ult') }}: <b>{{ ultName(faction) }}</b> — {{ ultDesc(faction) }}
          </p>
          <p class="bad">{{ t('guide.weakness', { text: civWeakness(faction) }) }}</p>
          <p class="good">{{ t('guide.beat', { text: civBeat(faction) }) }}</p>
        </div>
      </div>
      <UnitCarousel :faction="faction" />
    </template>

    <template v-else-if="page === 'counters'">
      <h3>{{ t('guide.tableTitle') }}</h3>
      <p class="muted">{{ t('guide.tableDesc') }}</p>
      <div class="table-wrap">
        <table class="counter-table">
          <thead>
            <tr>
              <th>{{ t('guide.col.dmgArmor') }}</th>
              <th v-for="a in ARMOR_TYPES" :key="a">{{ armorLabel(a) }}</th>
              <th>{{ t('guide.col.statue') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in DMG_TYPES" :key="d">
              <td>
                <b>{{ dmgLabel(d) }}</b>
              </td>
              <td v-for="a in ARMOR_TYPES" :key="a" :class="cellClass(DAMAGE_TABLE[d][a] ?? 1)">×{{ DAMAGE_TABLE[d][a] ?? 1 }}</td>
              <td :class="cellClass(d === 'siege' ? 3 : 1)">×{{ d === 'siege' ? 3 : 1 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>{{ t('guide.civTitle') }}</h3>
      <p class="muted">{{ t('guide.civDesc') }}</p>
      <div class="table-wrap">
        <table class="counter-table">
          <thead>
            <tr>
              <th>{{ t('guide.col.civ') }}</th>
              <th>{{ t('guide.col.strong') }}</th>
              <th>{{ t('guide.col.weak') }}</th>
              <th>{{ t('guide.col.beat') }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="id in FACTION_ORDER" :key="id">
              <td>{{ FACTIONS[id].icon }} {{ civName(id) }}</td>
              <td class="good">{{ civPassive(id) }}</td>
              <td class="bad">{{ civWeakness(id) }}</td>
              <td>{{ civBeat(id) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <ul v-else-if="lang === 'en'" class="howto">
      <li>
        🧱 <b>Line</b>: the army moves at the slowest unit’s speed and arrives together. Shields and giants lead, melee next, ranged behind,
        support and siege last.
      </li>
      <li>↔️ <b>Spread</b>: like Line but spaced out. Use it against many mages, giants and catapults with splash damage.</li>
      <li>🌀 <b>Free</b>: fast units rush ahead. Good for cavalry and ninjas raiding the enemy back row.</li>
      <li>🔺 <b>Wedge</b>: cavalry, ninjas and giants lead, the army stays tight to punch through a defensive line.</li>
      <li>🛡️ <b>Shield wall</b>: all melee units share the front row with archers right behind. Solid but weak to splash.</li>
      <li><b>Rush</b>: cavalry + swordsmen before minute 2 punish players who go greedy.</li>
      <li>
        <b>Get rich</b>: many miners + the diamond mine (defending troops guard it) + gold depots by the mines (miners drop gold closer,
        depots shoot), then expensive units.
      </li>
      <li><b>Harass</b>: ninjas / cavalry hunt miners and grab dropped gold bags.</li>
      <li><b>Siege</b>: catapults / cannons / rams deal ×3 to statues but need spearmen to cover them.</li>
      <li>Check the enemy civilization before the battle: pick units whose attack type beats their armor (see Counters).</li>
      <li>★★★ veterans are very strong: pull them back to the statue to heal when a fight goes badly instead of losing them.</li>
    </ul>
    <ul v-else class="howto">
      <li>
        🧱 <b>Hàng lối</b>: cả đội đi cùng tốc độ quân chậm nhất, tới nơi cùng lúc. Khiên và khổng lồ đi đầu, cận chiến sau, bắn xa sau nữa,
        hỗ trợ và công thành ở cuối.
      </li>
      <li>↔️ <b>Tản rộng</b>: như hàng lối nhưng giãn cách xa. Dùng khi địch có nhiều pháp sư, khổng lồ, máy bắn đá đánh lan.</li>
      <li>🌀 <b>Tự do</b>: quân nhanh lao trước. Hợp với kỵ binh, ninja đánh úp hàng sau địch.</li>
      <li>🔺 <b>Mũi nhọn</b>: kỵ binh, ninja, khổng lồ đi đầu, cả đội đứng sát nhau để chọc thủng phòng tuyến.</li>
      <li>🛡️ <b>Tường khiên</b>: mọi quân cận chiến dàn chung hàng đầu, cung thủ núp ngay sau. Chắc nhưng sợ phép nổ.</li>
      <li><b>Đánh sớm</b>: kỵ binh + kiếm sĩ trước phút thứ 2, ăn thua với người làm giàu.</li>
      <li>
        <b>Làm giàu</b>: nhiều thợ mỏ + mỏ kim cương (lính phòng thủ ra giữ mỏ) + trạm vàng cạnh mỏ (thợ nộp vàng gần, trạm bắn địch), rồi
        ra quân đắt tiền.
      </li>
      <li><b>Quấy rối</b>: ninja / kỵ binh săn thợ mỏ, nhặt túi vàng rơi.</li>
      <li><b>Công thành</b>: máy bắn đá / đại bác / xe phá thành phá tượng ×3, nhưng cần giáo binh che chắn.</li>
      <li>Nhìn nền văn minh của địch trước trận: chọn quân có kiểu đòn khắc kiểu giáp của chúng (xem mục Khắc chế).</li>
      <li>Quân lên ★★★ rất mạnh: rút về tượng hồi máu khi trận bất lợi thay vì để mất.</li>
    </ul>
  </div>
</template>
