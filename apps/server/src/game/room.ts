import type { ChatLine, EndReason, FactionId, RoomSettings, RoomState, Team, World, WorldEvent } from '@stickman-war/core';
import type { WebSocket } from 'ws';

/** Kiểu dữ liệu và hằng số của sảnh online (dùng trong LobbyService). */

export const TICK_HZ = 30;
export const SEND_EVERY = 2; // gửi trạng thái 15 lần/giây
export const COUNTDOWN = 3;
export const MAX_MSG_PER_SEC = 40;
// Bắt tay WebRTC gửi dồn nhiều ứng viên ICE cho từng người: đếm riêng, ngưỡng cao hơn
export const MAX_SIGNAL_PER_SEC = 200;
export const MAX_ROOMS = 500;
export const LOBBY_EVERY_MS = 2000;
export const HEARTBEAT_MS = 15_000;
export const CHAT_GAP_MS = 600;
export const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

export type Player = {
  ws: WebSocket;
  name: string;
  /** Mã ví xu (trình duyệt gửi lên, hoặc ví theo tài khoản); không hợp lệ thì dùng ví tạm theo kết nối. */
  wallet: string;
  room: Room | null;
  /** Trong phòng với tư cách người chơi hay người xem. */
  role: 'player' | 'watcher';
  /** Đang mở tab Đấu trường, nhận danh sách phòng. */
  lobby: boolean;
  team: Team;
  faction: FactionId;
  /** Mã tài khoản khi đã đăng nhập Google; null = khách. */
  account: string | null;
  alive: boolean;
  msgWindow: number;
  msgCount: number;
  lastChat: number;
  /** Mã thoại công khai (không lộ mã ví). */
  vid: string;
  voice: boolean;
  muted: boolean;
  sigWindow: number;
  sigCount: number;
  /** Hàng đợi xử lý tin nhắn: tin sau chờ tin trước (hello cần đọc DB). */
  queue: Promise<void>;
};

export type Room = {
  code: string;
  /**
   * Phòng tạo bằng "Tạo phòng": có phòng chờ, chủ phòng bấm bắt đầu, đánh xong quay về phòng chờ.
   * Phòng ghép nhanh (private = false) tự vào trận khi đủ 2 người, đánh xong bỏ phiếu đấu lại.
   */
  private: boolean;
  host: Player | null;
  /** Người chơi (không phải chủ phòng) đã bấm sẵn sàng. */
  ready: Set<Player>;
  settings: RoomSettings;
  chat: ChatLine[];
  /** Ví bị chủ phòng mời ra, không vào lại được. */
  banned: Set<string>;
  players: Player[];
  watchers: Set<Player>;
  state: RoomState;
  startedAt: number;
  lastEnd: { winner: Team | null; reason: EndReason } | null;
  world: World | null;
  events: WorldEvent[];
  timer: NodeJS.Timeout | null;
  tick: number;
  rematch: Set<Player>;
  /** Kèo của người xem theo mã ví; side là team người chơi được cược. */
  bets: Map<string, { side: Team; amount: number }>;
  betsClosed: boolean;
};
