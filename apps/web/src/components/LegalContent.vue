<script setup lang="ts">
import { lang } from '@stickman-war/i18n';

/** Điều khoản dịch vụ / chính sách bảo mật, mỗi ngôn ngữ một bản (có chữ đậm nên viết thẳng trong template). */
defineProps<{ which: 'terms' | 'privacy' }>();
</script>

<template>
  <template v-if="lang === 'en'">
    <ul v-if="which === 'terms'" class="howto">
      <li>Stickman War is a free game played in the browser.</li>
      <li>In-game <b>coins 🪙</b> are virtual coins for fun betting only: they cannot be bought, sold or exchanged for real money.</li>
      <li>Do not use your display name or chat to insult or harass others. Room hosts can remove offenders from their room.</li>
      <li>No cheating, no attacking the server. Offending accounts may be deleted.</li>
      <li>The game may change, rebalance units or shut down the online server at any time.</li>
    </ul>
    <ul v-else class="howto">
      <li>
        When you <b>sign in with Google</b>, the server only stores: your Google ID, display name and avatar. <b>No email</b>, no password.
      </li>
      <li>Along with game data: favorite civilization, wins / losses, rating, battle history and coins.</li>
      <li>Your display name and rating are public on the leaderboard.</li>
      <li>When you <b>play as a guest</b>, campaign progress and settings stay in your browser (localStorage).</li>
      <li>Room voice chat goes directly between browsers (WebRTC); the server records nothing.</li>
      <li>To delete your account, contact the game server owner.</li>
    </ul>
  </template>
  <template v-else>
    <ul v-if="which === 'terms'" class="howto">
      <li>Stickman War là trò chơi miễn phí, chơi trên trình duyệt.</li>
      <li><b>Xu 🪙</b> trong game là xu ảo dùng để bắt kèo cho vui, không mua bán, không đổi ra tiền thật.</li>
      <li>Không dùng tên hiển thị hoặc chat để xúc phạm, quấy rối người khác. Chủ phòng có thể mời người vi phạm ra khỏi phòng.</li>
      <li>Không gian lận, không phá máy chủ. Tài khoản vi phạm có thể bị xoá.</li>
      <li>Game có thể thay đổi, cân bằng lại quân lính hoặc dừng máy chủ online bất cứ lúc nào.</li>
    </ul>
    <ul v-else class="howto">
      <li>
        Khi <b>đăng nhập Google</b>, máy chủ chỉ lưu: mã định danh Google, tên hiển thị, ảnh đại diện. <b>Không lưu email</b>, không lưu mật
        khẩu.
      </li>
      <li>Kèm theo là dữ liệu chơi: nền văn minh ưa thích, số trận thắng / thua, điểm xếp hạng, lịch sử trận và số xu.</li>
      <li>Tên hiển thị và điểm xếp hạng hiện công khai trên bảng xếp hạng.</li>
      <li>Khi <b>chơi khách</b>, tiến độ chiến dịch và cài đặt chỉ nằm trong trình duyệt của bạn (localStorage).</li>
      <li>Thoại trong phòng đi thẳng giữa các trình duyệt (WebRTC), máy chủ không ghi âm.</li>
      <li>Muốn xoá tài khoản: liên hệ chủ máy chủ game.</li>
    </ul>
  </template>
</template>
