<script setup lang="ts">
import { lang } from '@stickman-war/i18n';

/** Cách chơi (Cẩm nang và nút "Cách chơi" trong trận), mỗi ngôn ngữ một bản vì có chữ đậm, phím tắt. */
</script>

<template>
  <ul v-if="lang === 'en'" class="howto">
    <li><b>Miners</b> dig gold at the mines near your statue. More miners, more gold.</li>
    <li>
      Spend gold to <b>train units</b> from the bottom bar (keys <kbd>1</kbd>–<kbd>9</kbd>, <kbd>0</kbd>, <kbd>-</kbd>, <kbd>=</kbd>). Hover
      a button to see what that unit <b>counters</b>.
    </li>
    <li>
      <b>Counters</b>: spears deal ×2 to cavalry, arrows ×1.5 to giants, magic burns heavy armor, swords cut light units. Don’t build just
      one type.
    </li>
    <li>
      🏳️ <b>Civilizations</b>: 12 civilizations, each with 12 units, its own look and passive. Each has strengths and weaknesses and none
      hard-counters another: check the enemy’s weakness before the battle and pick units that exploit it.
    </li>
    <li>
      🧱 <b>Formations</b> (button or <kbd>F</kbd>): Free / Line (the army moves at the slowest unit’s speed) / Spread (dodges splash) /
      Wedge (fast units lead) / Shield wall (melee in the front row).
    </li>
    <li>
      🔨 <b>Builders</b> (<kbd>=</kbd>) raise up to 2 gold depots at fixed spots (by the gold mine, on the way to the diamond mine): miners
      drop gold there instead of walking back to the statue, and depots shoot enemies. 🥁 The <b>Drummer</b> (<kbd>8</kbd>) makes nearby
      units hit harder and faster.
    </li>
    <li>
      ⛏️ <b>Miner split</b> (<kbd>R</kbd> to cycle): 🥈 silver next to home, safe, no miner limit · 🥇 gold ~20% more than silver, up to 4
      miners · 💎 diamond mid-map ~50% more than silver, up to 6 miners, but almost a minute for the first trip and easy to raid (while
      Defending, troops guard the mine). Killed miners drop gold bags; whichever side touches one first picks it up.
    </li>
    <li>
      🧱 <b>Wall</b> (<kbd>T</kbd>): pick a spot in your half (green ghost = OK), tap or release to place; a miner walks out and builds it.
      Your troops pass through the gate, enemies must break the wall first, so you can hold while retraining. Siege deals ×3 to walls. Each
      civilization’s wall has its own trait (spikes, regrowth, fire, ice…).
    </li>
    <li>★ <b>Veterans</b>: units that get enough kills earn stars, each star +15% HP and damage.</li>
    <li>
      Orders: 🏰 <b>Retreat</b> (<kbd>Q</kbd>) · 🛡️ <b>Defend</b> (<kbd>W</kbd>) · 🚩 <b>Hold</b> (<kbd>S</kbd>, then tap the battlefield:
      the army and new units hold there) · ⚔️ <b>Attack</b> (<kbd>E</kbd>). The statue shoots arrows at nearby enemies.
    </li>
    <li>Drag the screen, scroll, press <kbd>A</kbd>/<kbd>D</kbd> or tap the minimap to look around. <kbd>Space</kbd> pauses (solo).</li>
    <li>
      <b>Online</b>: quick match, or create a room and send the code to a friend. <b>Arena</b>: watch others and bet virtual coins 🪙.
    </li>
    <li>
      <b>Earning coins 🪙</b>: each new campaign star +10 coins (all 100★ of a civilization +100 more); online win +60, draw +30, loss 0
      (battles of 2+ minutes); solo loss +15 (battles of 2+ minutes).
    </li>
  </ul>
  <ul v-else class="howto">
    <li><b>Thợ mỏ</b> đào vàng ở mỏ gần tượng. Càng nhiều thợ mỏ, càng nhiều vàng.</li>
    <li>
      Dùng vàng để <b>xây quân</b> ở thanh dưới cùng (phím <kbd>1</kbd>–<kbd>9</kbd>, <kbd>0</kbd>, <kbd>-</kbd>, <kbd>=</kbd>). Giữ chuột
      lên nút để xem quân đó <b>khắc</b> ai.
    </li>
    <li><b>Khắc chế</b>: giáo đâm kỵ binh ×2, tên xuyên khổng lồ ×1.5, phép đốt giáp nặng, kiếm chém quân nhẹ. Đừng chỉ xây một loại.</li>
    <li>
      🏳️ <b>Nền văn minh</b>: 12 nền văn minh, mỗi nền 12 loại quân, hình dáng và nội tại riêng. Mỗi nền văn minh có điểm mạnh và điểm yếu
      riêng, không nền nào khắc cứng nền nào: xem điểm yếu của địch trước trận rồi chọn quân đánh vào đó.
    </li>
    <li>
      🧱 <b>Đội hình</b> (bấm nút hoặc <kbd>F</kbd>): Tự do / Hàng lối (cả đội đi cùng tốc độ quân chậm nhất) / Tản rộng (đỡ bị phép nổ) /
      Mũi nhọn (quân nhanh mở đường) / Tường khiên (cận chiến dàn hàng đầu).
    </li>
    <li>
      🔨 <b>Thợ xây</b> (<kbd>=</kbd>) dựng tối đa 2 trạm vàng ở chỗ cố định (cạnh mỏ vàng, đường tới mỏ kim cương): thợ mỏ nộp vàng ở trạm
      thay vì vác về tượng, trạm còn bắn địch. 🥁 <b>Cờ hiệu</b> (<kbd>8</kbd>) làm quân quanh đó đánh mạnh và nhanh hơn.
    </li>
    <li>
      ⛏️ <b>Chia thợ mỏ</b> (<kbd>R</kbd> đổi nhanh): 🥈 mỏ bạc sát nhà, an toàn, không giới hạn thợ · 🥇 mỏ vàng hơn bạc ~20%, tối đa 4 thợ
      · 💎 mỏ kim cương giữa bản đồ hơn bạc ~50%, tối đa 6 thợ, nhưng gần 1 phút mới về lần đầu và dễ bị đánh (đang Phòng thủ thì lính ra
      chắn trước mỏ). Thợ mỏ chết rơi túi vàng, quân phe nào chạm trước thì nhặt.
    </li>
    <li>
      🧱 <b>Tường thành</b> (<kbd>T</kbd>): chọn chỗ ở nửa bản đồ nhà (bóng xanh = được), chạm hoặc thả tay để đặt, một thợ mỏ đi ra dựng.
      Quân nhà đi qua cổng, quân địch phải phá tường mới qua, nên giữ được nhà trong lúc xây lại quân. Công thành phá tường ×3. Tường mỗi
      nền văn minh có nét riêng (gai, tự mọc lại, lửa, băng…).
    </li>
    <li>★ <b>Kỳ cựu</b>: quân hạ đủ địch thì lên sao, mỗi sao +15% máu và sát thương.</li>
    <li>
      Ra lệnh: 🏰 <b>Rút về</b> (<kbd>Q</kbd>) · 🛡️ <b>Phòng thủ</b> (<kbd>W</kbd>) · 🚩 <b>Cắm cờ</b> (<kbd>S</kbd>, rồi chạm chiến trường:
      cả đội và quân mới xây ra đó đứng giữ) · ⚔️ <b>Tấn công</b> (<kbd>E</kbd>). Tượng tự bắn tên vào địch đến gần.
    </li>
    <li>
      Kéo màn hình, lăn chuột, phím <kbd>A</kbd>/<kbd>D</kbd> hoặc chạm bản đồ nhỏ để nhìn quanh. <kbd>Space</kbd> tạm dừng (chơi đơn).
    </li>
    <li><b>Online</b>: tìm trận nhanh hoặc tạo phòng gửi mã cho bạn. <b>Đấu trường</b>: xem trận người khác và bắt kèo bằng xu ảo 🪙.</li>
    <li>
      <b>Kiếm xu 🪙</b>: mỗi sao mới ở chiến dịch +10 xu (đủ 100★ một nền văn minh thêm 100 xu); online thắng +60, hoà +30, thua 0 (trận từ
      2 phút); chơi đơn thua +15 (trận từ 2 phút).
    </li>
  </ul>
</template>
