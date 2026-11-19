<script setup lang="ts">
import { UNITS } from '@stickman-war/core';
import { computed, ref, watch } from 'vue';
import { sound } from '../lib/sound';
import { useSettings } from '../stores/settings';
import { useUi } from '../stores/ui';
import FactionPicker from './FactionPicker.vue';
import FactionRow from './FactionRow.vue';
import HowToContent from './HowToContent.vue';
import MatchupCard from './MatchupCard.vue';
import UnitIcon from './UnitIcon.vue';

/** Một hộp thoại dùng chung cho cả game: nội dung dựng từ dữ liệu trong store ui (không chèn HTML). */
const ui = useUi();
const settings = useSettings();
const d = computed(() => ui.dialog);
const guestName = ref(settings.name);
watch(
  () => ui.dialog?.kind,
  (k) => {
    if (k === 'settings') guestName.value = settings.name;
  },
);

function back(): void {
  sound.click();
  const cur = ui.dialog;
  ui.close();
  if (cur?.kind === 'howto') cur.back?.();
}

function saveSettings(): void {
  settings.setName(guestName.value);
  ui.close();
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
            hoặc gửi đường link:<br /><span class="link">{{ d.link }}</span>
          </p>
        </template>
        <MatchupCard v-if="d.matchup" :mine="d.matchup[0]" :theirs="d.matchup[1]" />
        <template v-if="d.matchup && d.pickFaction">
          <p class="small">Chọn tộc của bạn cho trận này:</p>
          <FactionRow :model-value="d.matchup[0]" @update:model-value="d.pickFaction" />
        </template>
        <div v-for="unit in d.newUnits" :key="unit" class="new-unit">
          <UnitIcon :kind="unit" />
          <div>
            <small>Quân mới</small><b>{{ UNITS[unit].name }}</b>
            <span>{{ UNITS[unit].desc }} · {{ UNITS[unit].cost }} vàng</span>
            <span class="counter">{{ UNITS[unit].counter }}</span>
          </div>
        </div>
        <div v-if="d.stats" class="stats">
          <div>
            <b>{{ d.stats.time }}</b><small>Thời gian</small>
          </div>
          <div>
            <b>{{ d.stats.kills }}</b><small>Hạ gục</small>
          </div>
          <div>
            <b>{{ d.stats.statue }}%</b><small>Máu tượng</small>
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
        <div class="dialog-actions"><button class="btn" @click="ui.close()">Đóng</button></div>
      </template>

      <template v-else-if="d.kind === 'howto'">
        <h2>Cách chơi</h2>
        <HowToContent />
        <div class="dialog-actions"><button class="btn btn-primary" @click="back">Đã hiểu</button></div>
      </template>

      <template v-else-if="d.kind === 'legal' && d.which === 'terms'">
        <h2>Điều khoản dịch vụ</h2>
        <ul class="howto">
          <li>Stickman War là trò chơi miễn phí, chơi trên trình duyệt.</li>
          <li><b>Xu 🪙</b> trong game là xu ảo dùng để bắt kèo cho vui, không mua bán, không đổi ra tiền thật.</li>
          <li>Không dùng tên hiển thị hoặc chat để xúc phạm, quấy rối người khác. Chủ phòng có thể mời người vi phạm ra khỏi phòng.</li>
          <li>Không gian lận, không phá máy chủ. Tài khoản vi phạm có thể bị xoá.</li>
          <li>Game có thể thay đổi, cân bằng lại quân lính hoặc dừng máy chủ online bất cứ lúc nào.</li>
        </ul>
        <div class="dialog-actions"><button class="btn btn-primary" @click="ui.close()">Đã hiểu</button></div>
      </template>

      <template v-else-if="d.kind === 'legal'">
        <h2>Chính sách bảo mật</h2>
        <ul class="howto">
          <li>
            Khi <b>đăng nhập Google</b>, máy chủ chỉ lưu: mã định danh Google, tên hiển thị, ảnh đại diện. <b>Không lưu email</b>, không lưu
            mật khẩu.
          </li>
          <li>Kèm theo là dữ liệu chơi: tộc ưa thích, số trận thắng / thua, điểm xếp hạng, lịch sử trận và số xu.</li>
          <li>Tên hiển thị và điểm xếp hạng hiện công khai trên bảng xếp hạng.</li>
          <li>Khi <b>chơi khách</b>, tiến độ chiến dịch và cài đặt chỉ nằm trong trình duyệt của bạn (localStorage).</li>
          <li>Thoại trong phòng đi thẳng giữa các trình duyệt (WebRTC), máy chủ không ghi âm.</li>
          <li>Muốn xoá tài khoản: liên hệ chủ máy chủ game.</li>
        </ul>
        <div class="dialog-actions"><button class="btn btn-primary" @click="ui.close()">Đã hiểu</button></div>
      </template>

      <template v-else-if="d.kind === 'settings'">
        <h2>Cài đặt</h2>
        <label class="field"
          ><span>Tên khi chơi khách</span>
          <input v-model="guestName" maxlength="16" autocomplete="nickname" />
        </label>
        <div class="dialog-actions">
          <button class="btn" @click="settings.toggleSound()">
            {{ settings.muted ? '🔇 Đang tắt tiếng · bật lại' : '🔊 Đang có tiếng · tắt' }}
          </button>
          <button class="btn btn-primary" @click="saveSettings">Lưu</button>
        </div>
      </template>
    </div>
  </div>
</template>
