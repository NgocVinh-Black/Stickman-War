<script setup lang="ts">
import {
  DAMAGE_TABLE,
  FACTIONS,
  FACTION_COUNTER_MULT,
  FACTION_ORDER,
  UNITS,
  counteredBy,
  kindOf,
  roster,
  type ArmorType,
  type DamageType,
  type FactionId,
} from '@stickman-war/core';
import { computed, ref } from 'vue';
import HowToContent from '../../components/HowToContent.vue';
import UnitIcon from '../../components/UnitIcon.vue';
import { ARMOR_LABEL, DMG_LABEL, GUIDE_PAGES, traits, type GuidePage } from '../../lib/guide';
import { sound } from '../../lib/sound';
import { useSettings } from '../../stores/settings';

/** Cẩm nang: cách chơi, bảng quân 8 tộc, bảng khắc chế, chiến thuật. */
const settings = useSettings();
const page = ref<GuidePage>('basics');
const faction = ref<FactionId>(settings.faction);
const fd = computed(() => FACTIONS[faction.value]);
const units = computed(() => [...roster(faction.value), kindOf(faction.value, 'tower')]);
const armors = Object.keys(ARMOR_LABEL) as ArmorType[];
const dmgs = (Object.keys(DMG_LABEL) as DamageType[]).filter((d) => d !== 'none');
const pct = Math.round((FACTION_COUNTER_MULT - 1) * 100);
const names = (ids: FactionId[]) => ids.map((x) => `${FACTIONS[x].icon} ${FACTIONS[x].name}`).join(', ');
const cellClass = (v: number) => (v >= 1.2 ? 'good' : v <= 0.8 ? 'bad' : '');
const go = (p: GuidePage) => {
  sound.click();
  page.value = p;
};
</script>

<template>
  <div class="guide-nav">
    <button v-for="g in GUIDE_PAGES" :key="g.id" class="pill" :class="{ active: g.id === page }" @click="go(g.id)">{{ g.label }}</button>
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
          {{ FACTIONS[id].icon }} {{ FACTIONS[id].name }}
        </button>
      </div>
      <div class="guide-faction-head" :style="{ '--faction': fd.color }">
        <span class="faction-icon">{{ fd.icon }}</span>
        <div>
          <h3>{{ fd.name }}</h3>
          <p>{{ fd.desc }}</p>
          <p class="faction-passive">✨ {{ fd.passive }}</p>
          <p>
            <span class="good">Khắc (+{{ pct }}%): {{ names(fd.counters) }}</span> ·
            <span class="bad">Sợ: {{ names(counteredBy(faction)) }}</span>
          </p>
        </div>
      </div>
      <div class="table-wrap">
        <table class="unit-table">
          <thead>
            <tr>
              <th></th>
              <th>Quân</th>
              <th>Vàng</th>
              <th>Máu</th>
              <th>Đánh</th>
              <th>Tầm</th>
              <th>Đòn / Giáp</th>
              <th>Đặc biệt</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="k in units" :key="k">
              <td><UnitIcon :kind="k" /></td>
              <td>
                <b>{{ UNITS[k].name }}</b><small>{{ UNITS[k].desc }}</small>
              </td>
              <td>{{ UNITS[k].cost || '—' }}</td>
              <td>{{ Math.round(UNITS[k].hp) }}</td>
              <td>{{ UNITS[k].damage ? Math.round(UNITS[k].damage) : UNITS[k].heal ? `+${UNITS[k].heal}` : '—' }}</td>
              <td>{{ UNITS[k].projectile || UNITS[k].heal ? Math.round(UNITS[k].range) : 'gần' }}</td>
              <td>{{ DMG_LABEL[UNITS[k].dmgType] }} / {{ ARMOR_LABEL[UNITS[k].armorType] }}</td>
              <td class="traits">{{ traits(UNITS[k]).join(' · ') }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

    <template v-else-if="page === 'counters'">
      <h3>Kiểu đòn đánh vào kiểu giáp</h3>
      <p class="muted">Mỗi quân có một kiểu đòn và một kiểu giáp. Xanh: gây thêm sát thương. Đỏ: bị giảm.</p>
      <div class="table-wrap">
        <table class="counter-table">
          <thead>
            <tr>
              <th>Đòn \ Giáp</th>
              <th v-for="a in armors" :key="a">{{ ARMOR_LABEL[a] }}</th>
              <th>Tượng</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="d in dmgs" :key="d">
              <td>
                <b>{{ DMG_LABEL[d] }}</b>
              </td>
              <td v-for="a in armors" :key="a" :class="cellClass(DAMAGE_TABLE[d][a] ?? 1)">×{{ DAMAGE_TABLE[d][a] ?? 1 }}</td>
              <td :class="cellClass(d === 'siege' ? 3 : 1)">×{{ d === 'siege' ? 3 : 1 }}</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3>Tộc khắc tộc</h3>
      <p class="muted">Quân của tộc khắc gây thêm {{ pct }}% sát thương lên mọi quân của tộc bị khắc.</p>
      <div class="table-wrap">
        <table class="counter-table">
          <thead>
            <tr>
              <th>Tộc</th>
              <th>Khắc</th>
              <th>Sợ</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="id in FACTION_ORDER" :key="id">
              <td>{{ FACTIONS[id].icon }} {{ FACTIONS[id].name }}</td>
              <td class="good">{{ names(FACTIONS[id].counters) }}</td>
              <td class="bad">{{ names(counteredBy(id)) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </template>

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
      <li><b>Làm giàu</b>: nhiều thợ mỏ + mỏ kim cương (lính phòng thủ ra giữ mỏ) + tháp canh giữ nhà, rồi ra quân đắt tiền.</li>
      <li><b>Quấy rối</b>: ninja / kỵ binh săn thợ mỏ, nhặt túi vàng rơi.</li>
      <li><b>Công thành</b>: máy bắn đá / đại bác / xe phá thành phá tượng ×3, nhưng cần giáo binh che chắn.</li>
      <li>Nhìn tộc của địch trước trận: chọn quân có kiểu đòn khắc kiểu giáp của chúng (xem mục Khắc chế).</li>
      <li>Quân lên ★★★ rất mạnh: rút về tượng hồi máu khi trận bất lợi thay vì để mất.</li>
    </ul>
  </div>
</template>
