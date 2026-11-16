import { FACTION_ORDER, type FactionId } from '../core/factions';
import {
  ARCH_ORDER,
  MAX_QUEUE,
  POP_CAP,
  UNITS,
  UNIT_ORDER,
  type Formation,
  type ProjectileKind,
  type Stance,
  type Team,
  type UnitKind,
} from '../core/units';
import { WORLD_WIDTH, type TeamSetup, type World, type WorldEvent } from '../core/world';

/** Cấu hình trận 1v1 online: hai bên giống hệt nhau. */
export const PVP_SETUP: TeamSetup = {
  gold: 500,
  statueHp: 3000,
  unlocked: ARCH_ORDER,
  start: ['miner', 'miner', 'sword'],
};
export const PVP_MAX_SECONDS = 20 * 60;
export const NAME_MAX = 16;
export const STANCES: Stance[] = ['garrison', 'defend', 'attack'];
export const PROJECTILES: ProjectileKind[] = [
  'arrow', 'bullet', 'bolt', 'axe', 'boulder', 'cannonball', 'fireball', 'poison', 'spark', 'sun', 'wind',
];
export const FORMATIONS: Formation[] = ['free', 'line', 'spread'];
export const validFaction = (f: unknown): f is FactionId => FACTION_ORDER.includes(f as FactionId);
export const MAX_SPECTATORS = 20;
export const LOBBY_MAX_ROOMS = 50;
/** Bắt kèo: mở từ lúc đếm ngược đến giây thứ BET_SECONDS của trận. */
export const BET_SECONDS = 60;
export const MIN_BET = 10;
/** Luật phòng chủ phòng được chọn. */
export const ROOM_GOLD = [300, 500, 1000];
export const ROOM_MINUTES = [10, 20, 30];
export const CHAT_MAX = 120;
export const CHAT_KEEP = 40;
/** Thoại: mỗi người nối thẳng tới từng người khác (WebRTC mesh) nên giới hạn số người. */
export const MAX_VOICE = 10;
export const SIGNAL_MAX_BYTES = 12 * 1024;

// ---------- Tin nhắn ----------

export type ClientMsg =
  | { t: 'hello'; name: string; wallet?: string; faction?: FactionId; session?: string }
  | { t: 'faction'; id: FactionId }
  | { t: 'formation'; mode: Formation }
  | { t: 'quick' }
  | { t: 'create' }
  | { t: 'join'; code: string; as?: JoinAs }
  | { t: 'lobby'; on: boolean }
  | { t: 'bet'; side: Team; amount: number }
  // Phòng chờ (phòng tạo bằng "Tạo phòng")
  | { t: 'ready'; on: boolean }
  | { t: 'begin' }
  | { t: 'settings'; gold: number; minutes: number }
  | { t: 'kick'; seat: Team }
  | { t: 'seat'; as: 'play' | 'watch' }
  | { t: 'chat'; text: string }
  // Thoại
  | { t: 'voice'; on: boolean }
  | { t: 'voiceMute'; muted: boolean }
  | { t: 'signal'; to: string; data: SignalData }
  | { t: 'leave' }
  | { t: 'train'; kind: UnitKind }
  | { t: 'stance'; stance: Stance }
  | { t: 'centerMine'; on: boolean }
  | { t: 'surrender' }
  | { t: 'rematch' }
  | { t: 'ping'; c: number };

export type EndReason = 'statue' | 'surrender' | 'disconnect' | 'timeout';
/** Vào phòng để chơi (phòng đầy thì máy chủ trả 'full' để hỏi có muốn xem không) hoặc để xem. */
export type JoinAs = 'play' | 'watch';
export type RoomState = 'waiting' | 'countdown' | 'playing' | 'ended';

/** Một dòng trong danh sách Đấu trường. */
export type LobbyRoom = {
  code: string;
  private: boolean;
  state: RoomState;
  players: string[];
  watchers: number;
  time: number;
};

/** Quỹ kèo của trận đang xem. Bên 0 là người chơi bên trái. */
export type BetPool = {
  open: boolean;
  closesAt: number; // giây của trận
  totals: [number, number];
  counts: [number, number];
  mine: { side: Team; amount: number } | null;
};

export type BetOutcome = 'win' | 'lose' | 'refund';

/** Tin bắt tay WebRTC máy chủ chỉ chuyển tiếp, không đọc. */
export type SignalData = {
  description?: { type: string; sdp?: string };
  candidate?: { candidate: string; sdpMid?: string | null; sdpMLineIndex?: number | null };
};
export type VoicePeer = { id: string; name: string; muted: boolean; role: 'player' | 'watcher' };

export type RoomSettings = { gold: number; minutes: number };
export type Seat = { name: string; host: boolean; ready: boolean; faction: FactionId };
export type ChatLine = { from: string; text: string; kind: 'player' | 'watcher' | 'system' };

/** Phòng chờ nhìn từ phía người nhận. Ghế 0 là bên trái khi vào trận. */
export type WaitRoom = {
  code: string;
  seats: [Seat | null, Seat | null];
  watchers: string[];
  host: string;
  settings: RoomSettings;
  you: { role: 'player' | 'watcher'; host: boolean; seat: Team | null };
};

/** Một trận online đã đấu, lưu trong lịch sử tài khoản. rating: điểm thay đổi. */
export type MatchRecord = {
  at: number;
  vs: string;
  result: 'win' | 'lose' | 'draw';
  faction: FactionId;
  vsFaction: FactionId;
  rating: number;
};

/** Tài khoản người chơi (đăng nhập Google). id là mã nội bộ, không phải email. */
export type AccountInfo = {
  id: string;
  name: string;
  picture: string;
  faction: FactionId;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  history: MatchRecord[];
};

export type ServerMsg =
  | { t: 'welcome'; online: number }
  // Trả lời hello: tài khoản gắn với phiên đăng nhập (null = khách)
  | { t: 'account'; account: AccountInfo | null }
  | { t: 'room'; code: string; private: boolean; players: string[]; watching: boolean }
  // factions: [tộc của mình, tộc đối thủ]; người xem: [bên trái, bên phải]
  | { t: 'start'; opponent: string; countdown: number; minutes: number; factions: [FactionId, FactionId] }
  | {
      t: 'spectate';
      code: string;
      players: [string, string];
      countdown: number;
      minutes: number;
      factions: [FactionId, FactionId];
    }
  | ({ t: 'waitroom' } & WaitRoom)
  | { t: 'chat'; line: ChatLine }
  | { t: 'chatLog'; lines: ChatLine[] }
  | { t: 'kicked' }
  // Danh sách người đang trong thoại của phòng; you là mã thoại của người nhận (null nếu chưa vào thoại)
  | { t: 'voicePeers'; you: string | null; peers: VoicePeer[] }
  | { t: 'signal'; from: string; data: SignalData }
  | { t: 'full'; code: string; players: string[] }
  | { t: 'lobby'; rooms: LobbyRoom[]; online: number }
  | { t: 'watchers'; n: number }
  | { t: 'wallet'; xu: number }
  | ({ t: 'pool' } & BetPool)
  // payout: số xu nhận về (gồm cả tiền cược) khi thắng hoặc được hoàn
  | { t: 'betResult'; outcome: BetOutcome; amount: number; payout: number; xu: number }
  | { t: 'closed' }
  | { t: 'state'; s: Snapshot }
  // Người xem nhận kết quả theo góc nhìn của team 0 (bên trái); winner là tên người thắng
  | { t: 'end'; result: 'win' | 'lose' | 'draw'; reason: EndReason; winner: string | null }
  | { t: 'rematch'; votes: number }
  | { t: 'left' }
  | { t: 'error'; msg: string }
  | { t: 'pong'; c: number };

// ---------- Ảnh chụp trạng thái (luôn nhìn từ phía người nhận: mình là team 0, bên trái) ----------

export type TeamSnap = {
  gold: number;
  hp: number;
  max: number;
  stance: number;
  queue: [number, number][]; // [loại, tiến độ giây]
  pop: number;
  kills: number;
  cm: number; // 1 = đang đào mỏ giữa
  f: number; // chỉ số tộc trong FACTION_ORDER
  fm: number; // chỉ số đội hình trong FORMATIONS
};

export type Snapshot = {
  time: number;
  winner: Team | null;
  teams: [TeamSnap, TeamSnap];
  // [id, loại, team, x, lane, hp, maxHp, facing, cờ, walk, attackT, deadT, mineT, hitFlash, sao]
  units: number[][];
  // [loại, team, x0, h0, x1, lane, t, duration, arc]
  projectiles: number[][];
  // túi vàng rơi: [id, x, lane, số vàng]
  drops: number[][];
  events: WorldEvent[];
};

export const FLAG = { moving: 1, dying: 2, inside: 4, mining: 8, carrying: 16, hidden: 32, slowed: 64, poisoned: 128 } as const;

const r1 = (n: number) => Math.round(n * 10) / 10;
const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Đóng gói trạng thái cho người chơi `viewer`; team 1 được lật gương để luôn thấy mình bên trái.
 * Người xem (`spectator`) nhìn từ team 0 và thấy vàng của cả hai bên.
 */
export function encodeSnapshot(world: World, viewer: Team, events: WorldEvent[], spectator = false): Snapshot {
  const mirror = viewer === 1;
  const mx = (x: number) => (mirror ? WORLD_WIDTH - x : x);
  const mt = (t: Team): Team => (mirror ? ((1 - t) as Team) : t);

  const team = (t: Team, hideGold: boolean): TeamSnap => {
    const s = world.teams[t];
    return {
      gold: hideGold ? -1 : Math.floor(s.gold),
      hp: Math.ceil(s.statueHp),
      max: s.statueMax,
      stance: STANCES.indexOf(s.stance),
      queue: s.queue.map((q) => [UNIT_ORDER.indexOf(q.kind), r2(q.t)]),
      pop: world.pop(t),
      kills: s.kills,
      cm: s.centerMine ? 1 : 0,
      f: FACTION_ORDER.indexOf(s.faction),
      fm: FORMATIONS.indexOf(s.formation),
    };
  };
  const other = (1 - viewer) as Team;

  return {
    time: r1(world.time),
    winner: world.winner === null ? null : mt(world.winner),
    teams: [team(viewer, false), team(other, !spectator)],
    units: world.units.map((u) => [
      u.id,
      UNIT_ORDER.indexOf(u.kind),
      mt(u.team),
      r1(mx(u.x)),
      r2(u.lane),
      Math.ceil(u.hp),
      u.maxHp,
      mirror ? -u.facing : u.facing,
      (u.moving ? FLAG.moving : 0) |
        (u.dying ? FLAG.dying : 0) |
        (u.inside ? FLAG.inside : 0) |
        (u.mining ? FLAG.mining : 0) |
        (u.carrying > 0 ? FLAG.carrying : 0) |
        (u.hidden ? FLAG.hidden : 0) |
        (u.slowT > 0 ? FLAG.slowed : 0) |
        (u.poisonT > 0 ? FLAG.poisoned : 0),
      r2(u.walk),
      r2(u.attackT),
      r2(u.deadT),
      r2(u.mineT),
      r2(u.hitFlash),
      u.rank,
    ]),
    projectiles: world.projectiles.map((p) => [
      PROJECTILES.indexOf(p.kind),
      mt(p.team),
      r1(mx(p.x0)),
      r1(p.h0),
      r1(mx(p.x1)),
      r2(p.lane),
      r2(p.t),
      r2(p.duration),
      r1(p.arc),
    ]),
    drops: world.drops.map((d) => [d.id, r1(mx(d.x)), r2(d.lane), d.amount]),
    events: events.map((e) => mirrorEvent(e, mirror)),
  };
}

function mirrorEvent(e: WorldEvent, mirror: boolean): WorldEvent {
  if (!mirror) return e;
  const flip = (t: Team): Team => (1 - t) as Team;
  if (e.type === 'trained') return { ...e, team: flip(e.team) };
  const x = WORLD_WIDTH - e.x;
  switch (e.type) {
    case 'death':
    case 'gold':
    case 'statueHit':
    case 'promote':
      return { ...e, x, team: flip(e.team) };
    case 'blink':
      return { ...e, x, x0: WORLD_WIDTH - e.x0 };
    case 'built':
      return { ...e, x, team: flip(e.team) };
    default:
      return { ...e, x };
  }
}

/** Kiểm tra lệnh xây quân phía client, dùng đúng luật của World.canTrain. */
export function canTrainSnap(team: TeamSnap, kind: UnitKind, ended: boolean): boolean {
  const s = UNITS[kind];
  return !ended && team.gold >= s.cost && team.queue.length < MAX_QUEUE && team.pop + s.pop <= POP_CAP;
}

/** Hệ số trả thưởng ước tính nếu đặt thêm `amount` vào bên `side` (kèo chia quỹ). */
export function betOdds(totals: [number, number], side: Team, amount: number): number {
  const mine = totals[side] + amount;
  return mine > 0 ? (totals[0] + totals[1] + amount) / mine : 1;
}

/** Làm sạch tin nhắn chat (server gọi; client vẫn escape khi hiển thị). */
export function cleanChat(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, CHAT_MAX);
}

/** Làm sạch tên người chơi (server cũng gọi). */
export function cleanName(raw: unknown): string {
  const s = typeof raw === 'string' ? raw : '';
  // eslint-disable-next-line no-control-regex
  const name = s.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, NAME_MAX);
  return name || 'Người que';
}
