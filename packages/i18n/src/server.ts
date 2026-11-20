import { lang } from './index';

/**
 * Chữ máy chủ gửi về (báo lỗi, dòng hệ thống trong phòng chờ) luôn là tiếng Việt; khi chọn tiếng Anh thì
 * dịch ở đây theo mẫu. Thêm câu mới ở máy chủ thì thêm mẫu ở đây (test web kiểm tra đủ).
 */
export const SERVER_EN: [RegExp, (...m: string[]) => string][] = [
  [/^(.+) chưa sẵn sàng$/, (n) => `${n} is not ready`],
  [/^Cược ít nhất (\d+) xu$/, (n) => `Bet at least ${n} coins`],
  [/^Không tìm thấy phòng (.+)$/, (c) => `Room ${c} not found`],
  [/^Phòng thoại đã đủ (\d+) người$/, (n) => `Voice chat is full (${n} people)`],
  [/^Bạn đã bắt kèo trận này rồi$/, () => 'You already bet on this battle'],
  [/^Bạn đang chơi trận này$/, () => 'You are playing in this battle'],
  [/^Cần đủ 2 người chơi$/, () => 'Need 2 players'],
  [/^Chỉ chủ phòng mới làm được$/, () => 'Only the host can do that'],
  [/^Chỉ người xem mới bắt kèo được$/, () => 'Only spectators can bet'],
  [/^Chủ phòng đã mời bạn ra khỏi phòng này$/, () => 'The host removed you from this room'],
  [/^Đã khoá kèo trận này$/, () => 'Betting on this battle is closed'],
  [/^Hết ghế trống$/, () => 'No free seats'],
  [/^Không đủ xu$/, () => 'Not enough coins'],
  [/^Máy chủ đang quá tải, thử lại sau$/, () => 'The server is busy, try again later'],
  [/^Phòng đã đủ người xem$/, () => 'The room is full of spectators'],
  [/^Trận đang diễn ra$/, () => 'A battle is in progress'],
  [/^Đổi người chơi: hoàn lại toàn bộ tiền kèo$/, () => 'Players changed: all bets refunded'],
  [/^(.+) cược (\d+) xu vào (.+)$/, (n, a, s) => `${n} bet ${a} coins on ${s}`],
  [/^(.+) đã ngồi vào ghế$/, (n) => `${n} took a seat`],
  [/^(.+) đã vào phòng$/, (n) => `${n} joined the room`],
  [/^(.+) vào xem$/, (n) => `${n} is watching`],
  [/^(.+) ra ghế xem$/, (n) => `${n} moved to spectators`],
  [/^🏆 (.+) thắng!$/, (n) => `🏆 ${n} wins!`],
  [/^🤝 Hoà$/, () => '🤝 Draw'],
  [/^(.+) đã rời phòng$/, (n) => `${n} left the room`],
  [/^👑 (.+) giờ là chủ phòng$/, (n) => `👑 ${n} is now the host`],
  [/^✅ (.+) đã sẵn sàng$/, (n) => `✅ ${n} is ready`],
  [/^(.+) huỷ sẵn sàng$/, (n) => `${n} is no longer ready`],
  [/^⚔️ Trận đấu bắt đầu!$/, () => '⚔️ The battle begins!'],
  [/^⚙️ Luật mới: (\d+) vàng ban đầu · (\d+) phút$/, (g, m) => `⚙️ New rules: ${g} starting gold · ${m} min`],
  [/^(.+) bị mời ra khỏi phòng$/, (n) => `${n} was removed from the room`],
  // Lỗi API (đăng nhập, trang admin)
  [/^Cần đăng nhập quản trị$/, () => 'Admin sign-in required'],
  [/^Chưa đăng nhập$/, () => 'Not signed in'],
  [/^Đăng nhập Google không hợp lệ$/, () => 'Invalid Google sign-in'],
  [/^Dữ liệu không hợp lệ$/, () => 'Invalid data'],
  [/^Không có tài khoản này$/, () => 'No such account'],
  [/^Máy chủ chưa bật đăng nhập Google$/, () => 'Google sign-in is not enabled on the server'],
  [/^Máy chủ chưa đặt ADMIN_TOKEN$/, () => 'ADMIN_TOKEN is not set on the server'],
  [/^Máy chủ chưa kết nối được Google, thử lại sau ít giây$/, () => 'The server cannot reach Google yet, try again in a few seconds'],
  [/^Sai mã quá nhiều lần, thử lại sau 15 phút$/, () => 'Too many wrong tokens, try again in 15 minutes'],
  [/^Sai mã quản trị$/, () => 'Wrong admin token'],
];

/** Chữ máy chủ theo ngôn ngữ đang chọn (câu lạ thì giữ nguyên). */
export function serverText(text: string): string {
  if (lang.value !== 'en') return text;
  for (const [re, fn] of SERVER_EN) {
    const m = re.exec(text);
    if (m) return fn(...m.slice(1));
  }
  return text;
}
