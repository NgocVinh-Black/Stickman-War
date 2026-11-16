import { randomUUID } from 'node:crypto';
import { createServer, type Server } from 'node:http';
import { WebSocketServer, type WebSocket } from 'ws';
import type { FactionId } from '../src/core/factions';
import { UNIT_ORDER, type Team, type UnitKind } from '../src/core/units';
import { World, type WorldEvent } from '../src/core/world';
import {
  BET_SECONDS,
  CHAT_KEEP,
  LOBBY_MAX_ROOMS,
  MIN_BET,
  MAX_SPECTATORS,
  MAX_VOICE,
  PVP_MAX_SECONDS,
  PVP_SETUP,
  ROOM_GOLD,
  ROOM_MINUTES,
  SIGNAL_MAX_BYTES,
  STANCES,
  cleanChat,
  cleanName,
  encodeSnapshot,
  type ChatLine,
  type ClientMsg,
  type BetOutcome,
  type EndReason,
  type LobbyRoom,
  type RoomSettings,
  type RoomState,
  type Seat,
  type ServerMsg,
  FORMATIONS,
  validFaction,
} from '../src/net/protocol';
import { Accounts, type Side } from './accounts';
import { googleKeys, verifyGoogleIdToken, type GoogleProfile } from './google-auth';
import { Wallets, validWalletId } from './wallets';

const TICK_HZ = 30;
const SEND_EVERY = 2; // gửi trạng thái 15 lần/giây
const COUNTDOWN = 3;
const MAX_MSG_PER_SEC = 40;
// Bắt tay WebRTC gửi dồn nhiều ứng viên ICE cho từng người: đếm riêng, ngưỡng cao hơn
const MAX_SIGNAL_PER_SEC = 200;
const MAX_ROOMS = 500;
const LOBBY_EVERY_MS = 2000;
const CHAT_GAP_MS = 600;
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

type Player = {
  ws: WebSocket;
  name: string;
  /** Mã ví xu (trình duyệt gửi lên); không hợp lệ thì dùng ví tạm theo kết nối. */
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
};

type Room = {
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

export type GameServer = { port: number; close: () => Promise<void>; stats: () => { players: number; rooms: number } };

export type ServerOptions = {
  /** File lưu ví xu; bỏ trống thì chỉ giữ trong bộ nhớ. */
  walletFile?: string;
  /** Số giây đầu trận còn được bắt kèo (test dùng số nhỏ). */
  betSeconds?: number;
  /** File lưu tài khoản; bỏ trống thì chỉ giữ trong bộ nhớ. */
  accountFile?: string;
  /** Client ID OAuth của Google; bỏ trống thì tắt đăng nhập Google. */
  googleClientId?: string;
  /** Thay bộ kiểm tra token Google (test). */
  verifyGoogle?: (credential: string) => Promise<GoogleProfile>;
};

const API_BODY_MAX = 8 * 1024;

export function startGameServer(
  port = 0,
  log: (msg: string) => void = () => {},
  opts: ServerOptions = {},
): Promise<GameServer> {
  const players = new Set<Player>();
  const rooms = new Map<string, Room>();
  const wallets = new Wallets(opts.walletFile);
  const accounts = new Accounts(opts.accountFile);
  const betSeconds = opts.betSeconds ?? BET_SECONDS;
  const clientId = opts.googleClientId ?? '';
  const keys = googleKeys();
  const verifyGoogle = opts.verifyGoogle ?? ((cred: string) => verifyGoogleIdToken(cred, clientId, keys));
  /** Ví xu của tài khoản đi theo tài khoản (đăng nhập máy nào cũng thấy). */
  const accountWallet = (id: string) => `acct-${id}`.slice(0, 64);

  const json = (res: import('node:http').ServerResponse, status: number, body: unknown) => {
    res.writeHead(status, { 'content-type': 'application/json', 'cache-control': 'no-store' });
    res.end(JSON.stringify(body));
  };
  const readBody = (req: import('node:http').IncomingMessage): Promise<Record<string, unknown>> =>
    new Promise((resolve, reject) => {
      let size = 0;
      const chunks: Buffer[] = [];
      req.on('data', (c: Buffer) => {
        size += c.length;
        if (size > API_BODY_MAX) {
          reject(new Error('too large'));
          req.destroy();
        } else chunks.push(c);
      });
      req.on('end', () => {
        try {
          resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {});
        } catch {
          reject(new Error('json'));
        }
      });
      req.on('error', reject);
    });
  const bearer = (req: import('node:http').IncomingMessage) => /^Bearer (\S+)$/.exec(req.headers.authorization ?? '')?.[1] ?? '';

  /** API tài khoản: phục vụ dưới mọi tiền tố (/api/… khi dev, /nguoi-que/api/… sau nginx). */
  const api = async (route: string, req: import('node:http').IncomingMessage, res: import('node:http').ServerResponse) => {
    const method = req.method ?? 'GET';
    if (route === 'config' && method === 'GET') return json(res, 200, { googleClientId: clientId });
    if (route === 'leaderboard' && method === 'GET') return json(res, 200, { players: accounts.leaderboard() });
    if (route === 'auth/google' && method === 'POST') {
      if (!clientId && !opts.verifyGoogle) return json(res, 503, { error: 'Máy chủ chưa bật đăng nhập Google' });
      const body = await readBody(req);
      try {
        const profile = await verifyGoogle(String(body.credential ?? ''));
        const out = accounts.signIn(profile);
        log(`login ${out.account.id}`);
        return json(res, 200, out);
      } catch (e) {
        log(`login failed: ${(e as Error).message}`);
        return json(res, 401, { error: 'Đăng nhập Google không hợp lệ' });
      }
    }
    if (route === 'logout' && method === 'POST') {
      accounts.signOut(bearer(req));
      return json(res, 200, { ok: true });
    }
    if (route === 'me') {
      const me = accounts.bySession(bearer(req));
      if (!me) return json(res, 401, { error: 'Chưa đăng nhập' });
      if (method === 'GET') return json(res, 200, { account: me, xu: wallets.get(accountWallet(me.id)) });
      if (method === 'POST') {
        const body = await readBody(req);
        const faction = validFaction(body.faction) ? body.faction : undefined;
        const account = accounts.update(me.id, { name: typeof body.name === 'string' ? body.name : undefined, faction });
        for (const p of players) if (p.account === me.id && account) p.name = account.name;
        return json(res, 200, { account });
      }
    }
    return json(res, 404, { error: 'Không có' });
  };

  const http: Server = createServer((req, res) => {
    const path = (req.url ?? '').split('?')[0];
    if (path.endsWith('/health')) {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ ok: true, players: players.size, rooms: rooms.size }));
      return;
    }
    const at = path.lastIndexOf('/api/');
    if (at >= 0) {
      api(path.slice(at + 5), req, res).catch(() => json(res, 400, { error: 'Yêu cầu không hợp lệ' }));
      return;
    }
    res.writeHead(426, { 'content-type': 'text/plain' });
    res.end('WebSocket only');
  });
  const wss = new WebSocketServer({ server: http, maxPayload: 16 * 1024 });

  const send = (p: Player, msg: ServerMsg) => {
    if (p.ws.readyState === p.ws.OPEN) p.ws.send(JSON.stringify(msg));
  };

  const newCode = (): string => {
    for (;;) {
      let code = '';
      for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      if (!rooms.has(code)) return code;
    }
  };

  const everyone = (room: Room) => [...room.players, ...room.watchers];

  const sendWatchers = (room: Room) => {
    for (const p of everyone(room)) send(p, { t: 'watchers', n: room.watchers.size });
  };

  // ---------- Phòng chờ ----------

  /** Gửi trạng thái phòng: phòng chờ cho phòng tạo, thông tin chờ ghép cho phòng ghép nhanh. */
  const sendRoom = (room: Room) => {
    if (!room.private) {
      const info = { code: room.code, private: false, players: room.players.map((x) => x.name) };
      for (const p of room.players) send(p, { t: 'room', ...info, watching: false });
      for (const p of room.watchers) send(p, { t: 'room', ...info, watching: true });
      return;
    }
    const seat = (t: Team): Seat | null => {
      const x = room.players.find((q) => q.team === t);
      return x ? { name: x.name, host: x === room.host, ready: x === room.host || room.ready.has(x), faction: x.faction } : null;
    };
    const base = {
      code: room.code,
      seats: [seat(0), seat(1)] as [Seat | null, Seat | null],
      watchers: [...room.watchers].map((x) => x.name),
      host: room.host?.name ?? '',
      settings: room.settings,
    };
    for (const p of everyone(room)) {
      send(p, {
        t: 'waitroom',
        ...base,
        you: { role: p.role, host: p === room.host, seat: p.role === 'player' ? p.team : null },
      });
    }
  };

  // ---------- Thoại: máy chủ chỉ chuyển tin bắt tay, âm thanh đi thẳng giữa các trình duyệt ----------

  const sendVoice = (room: Room) => {
    const members = everyone(room);
    const peers = members.filter((x) => x.voice).map((x) => ({ id: x.vid, name: x.name, muted: x.muted, role: x.role }));
    for (const p of members) send(p, { t: 'voicePeers', you: p.voice ? p.vid : null, peers });
  };

  const setVoice = (p: Player, on: boolean) => {
    const room = p.room;
    if (!room || p.voice === on) return;
    if (on && everyone(room).filter((x) => x.voice).length >= MAX_VOICE) {
      return send(p, { t: 'error', msg: `Phòng thoại đã đủ ${MAX_VOICE} người` });
    }
    p.voice = on;
    p.muted = true;
    sendVoice(room);
  };

  const relaySignal = (p: Player, to: unknown, data: unknown) => {
    const room = p.room;
    if (!room || !p.voice || typeof to !== 'string' || !data || typeof data !== 'object') return;
    if (JSON.stringify(data).length > SIGNAL_MAX_BYTES) return;
    const target = everyone(room).find((x) => x.vid === to && x.voice);
    if (target) send(target, { t: 'signal', from: p.vid, data: data as never });
  };

  const say = (room: Room, line: ChatLine) => {
    room.chat.push(line);
    if (room.chat.length > CHAT_KEEP) room.chat.shift();
    for (const p of everyone(room)) send(p, { t: 'chat', line });
  };
  const system = (room: Room, text: string) => say(room, { from: '', text, kind: 'system' });

  // ---------- Bắt kèo ----------

  const betOpen = (room: Room) =>
    !room.betsClosed &&
    ((room.state === 'waiting' && room.players.length === 2) ||
      room.state === 'countdown' ||
      (room.state === 'playing' && (room.world?.time ?? 0) < betSeconds));

  /** Quỹ kèo gửi cho cả phòng (người chơi cũng thấy được cược thế nào). */
  const sendPool = (room: Room) => {
    const totals: [number, number] = [0, 0];
    const counts: [number, number] = [0, 0];
    for (const b of room.bets.values()) {
      totals[b.side] += b.amount;
      counts[b.side]++;
    }
    const open = betOpen(room);
    for (const p of everyone(room)) {
      const mine = p.role === 'watcher' ? (room.bets.get(p.wallet) ?? null) : null;
      send(p, { t: 'pool', open, closesAt: betSeconds, totals, counts, mine });
    }
  };

  /** Chia quỹ: bên thắng nhận lại tiền cược + phần của bên thua theo tỉ lệ; hoà hoặc kèo một phía thì hoàn tiền. */
  const settleBets = (room: Room, winner: Team | null) => {
    if (!room.bets.size) return;
    const totals = [0, 0];
    for (const b of room.bets.values()) totals[b.side] += b.amount;
    const refund = winner === null || totals[0] === 0 || totals[1] === 0;
    for (const [id, b] of room.bets) {
      let outcome: BetOutcome = 'lose';
      let payout = 0;
      if (refund) {
        outcome = 'refund';
        payout = b.amount;
      } else if (b.side === winner) {
        outcome = 'win';
        payout = b.amount + Math.floor((b.amount * totals[1 - winner]) / totals[winner]);
      }
      const xu = payout ? wallets.add(id, payout) : wallets.get(id);
      // Báo mọi kết nối dùng ví này (kể cả đã rời phòng)
      for (const p of players) if (p.wallet === id) send(p, { t: 'betResult', outcome, amount: b.amount, payout, xu });
    }
    log(`room ${room.code}: settled ${room.bets.size} bets (${refund ? 'refund' : `pool ${totals[0] + totals[1]}`})`);
    room.bets.clear();
  };

  /** Ghế trong phòng chờ thay đổi: kèo đã đặt cho cặp đấu cũ được hoàn lại, mở / khoá kèo theo số người ngồi. */
  const seatsChanged = (room: Room) => {
    if (!room.private || room.state !== 'waiting') return;
    if (room.bets.size) {
      settleBets(room, null);
      system(room, 'Đổi người chơi: hoàn lại toàn bộ tiền kèo');
    }
    room.betsClosed = room.players.length < 2;
    sendPool(room);
  };

  const placeBet = (p: Player, room: Room | null, side: unknown, rawAmount: unknown) => {
    if (!room || p.role !== 'watcher') return send(p, { t: 'error', msg: 'Chỉ người xem mới bắt kèo được' });
    if (!betOpen(room)) return send(p, { t: 'error', msg: 'Đã khoá kèo trận này' });
    if (side !== 0 && side !== 1) return;
    // Không cho người đang đánh trận này cược bằng tab khác
    if (room.players.some((x) => x.wallet === p.wallet)) return send(p, { t: 'error', msg: 'Bạn đang chơi trận này' });
    if (room.bets.has(p.wallet)) return send(p, { t: 'error', msg: 'Bạn đã bắt kèo trận này rồi' });
    const amount = Math.floor(Number(rawAmount));
    if (!(amount >= MIN_BET)) return send(p, { t: 'error', msg: `Cược ít nhất ${MIN_BET} xu` });
    if (amount > wallets.get(p.wallet)) return send(p, { t: 'error', msg: 'Không đủ xu' });
    const xu = wallets.add(p.wallet, -amount);
    room.bets.set(p.wallet, { side, amount });
    for (const x of players) if (x.wallet === p.wallet) send(x, { t: 'wallet', xu });
    const name = room.players.find((x) => x.team === side)?.name ?? '';
    if (room.private) system(room, `${p.name} cược ${amount} xu vào ${name}`);
    sendPool(room);
  };

  // ---------- Trận đấu ----------

  const endFor = (room: Room, viewer: Team): ServerMsg | null => {
    if (!room.lastEnd) return null;
    const { winner, reason } = room.lastEnd;
    return {
      t: 'end',
      result: winner === null ? 'draw' : winner === viewer ? 'win' : 'lose',
      reason,
      winner: winner === null ? null : (room.players.find((x) => x.team === winner)?.name ?? null),
    };
  };

  const lobbyList = (): LobbyRoom[] => {
    const order: Record<RoomState, number> = { waiting: 0, countdown: 1, playing: 1, ended: 2 };
    return [...rooms.values()]
      .filter((r) => everyone(r).length > 0)
      .sort((a, b) => order[a.state] - order[b.state] || b.watchers.size - a.watchers.size)
      .slice(0, LOBBY_MAX_ROOMS)
      .map((r) => ({
        code: r.code,
        private: r.private,
        state: r.state,
        players: r.players.map((x) => x.name),
        watchers: r.watchers.size,
        time: Math.floor(r.world?.time ?? 0),
      }));
  };

  const sendLobby = (only?: Player) => {
    const targets = only ? [only] : [...players].filter((p) => p.lobby && !p.room);
    if (!targets.length) return;
    const msg = JSON.stringify({ t: 'lobby', rooms: lobbyList(), online: players.size } satisfies ServerMsg);
    for (const p of targets) if (p.ws.readyState === p.ws.OPEN) p.ws.send(msg);
  };

  const createRoom = (isPrivate: boolean): Room | null => {
    if (rooms.size >= MAX_ROOMS) return null;
    const room: Room = {
      code: newCode(),
      private: isPrivate,
      host: null,
      ready: new Set(),
      settings: { gold: PVP_SETUP.gold, minutes: PVP_MAX_SECONDS / 60 },
      chat: [],
      banned: new Set(),
      players: [],
      watchers: new Set(),
      state: 'waiting',
      startedAt: 0,
      lastEnd: null,
      world: null,
      events: [],
      timer: null,
      tick: 0,
      rematch: new Set(),
      bets: new Map(),
      betsClosed: true,
    };
    rooms.set(room.code, room);
    return room;
  };

  const stopTimer = (room: Room) => {
    if (room.timer) clearInterval(room.timer);
    room.timer = null;
  };

  const joinRoom = (p: Player, room: Room) => {
    const wasWatcher = p.room === room && p.role === 'watcher';
    if (wasWatcher) {
      // Người xem ngồi vào ghế trống
      room.watchers.delete(p);
      sendWatchers(room);
    } else leaveRoom(p);
    p.room = room;
    p.role = 'player';
    p.team = room.players.some((x) => x.team === 0) ? 1 : 0;
    room.players.push(p);
    if (!room.private) {
      sendRoom(room);
      if (room.players.length === 2) startMatch(room);
      return;
    }
    room.host ??= p;
    if (!wasWatcher) send(p, { t: 'chatLog', lines: room.chat });
    system(room, wasWatcher ? `${p.name} đã ngồi vào ghế` : `${p.name} đã vào phòng`);
    sendRoom(room);
    seatsChanged(room);
  };

  const watchRoom = (p: Player, room: Room) => {
    if (p.room === room && p.role === 'watcher') return;
    if (room.watchers.size >= MAX_SPECTATORS) return send(p, { t: 'error', msg: 'Phòng đã đủ người xem' });
    leaveRoom(p);
    p.room = room;
    p.role = 'watcher';
    room.watchers.add(p);
    sendWatchers(room);
    if (room.private) {
      send(p, { t: 'chatLog', lines: room.chat });
      system(room, `${p.name} vào xem`);
    }
    if (room.state === 'waiting' || !room.world) {
      sendRoom(room);
      if (room.private) sendPool(room);
      return;
    }
    const left = room.state === 'countdown' ? Math.ceil(COUNTDOWN - (Date.now() - room.startedAt) / 1000) : 0;
    send(p, {
      t: 'spectate',
      code: room.code,
      players: spectateNames(room),
      countdown: Math.max(0, left),
      minutes: room.settings.minutes,
      factions: spectateFactions(room),
    });
    send(p, { t: 'state', s: encodeSnapshot(room.world, 0, [], true) });
    sendPool(room);
    const end = endFor(room, 0);
    if (room.state === 'ended' && end) send(p, end);
  };

  /** Người chơi trong phòng chờ đứng dậy sang xem. */
  const standUp = (p: Player, room: Room) => {
    room.players = room.players.filter((x) => x !== p);
    room.ready.delete(p);
    p.role = 'watcher';
    room.watchers.add(p);
    system(room, `${p.name} ra ghế xem`);
    sendWatchers(room);
    sendRoom(room);
    seatsChanged(room);
  };

  const spectateFactions = (room: Room): [FactionId, FactionId] => [room.world!.teams[0].faction, room.world!.teams[1].faction];

  /** Tên hai bên theo góc nhìn người xem: team 0 bên trái. */
  const spectateNames = (room: Room): [string, string] => {
    const by = (t: Team) => room.players.find((x) => x.team === t)?.name ?? '';
    return [by(0), by(1)];
  };

  const startMatch = (room: Room) => {
    stopTimer(room);
    room.state = 'countdown';
    room.startedAt = Date.now();
    room.lastEnd = null;
    room.rematch.clear();
    room.ready.clear();
    // Kèo đặt từ phòng chờ được giữ nguyên, mở tiếp đến hết BET_SECONDS đầu trận
    room.betsClosed = false;
    const factionOf = (t: Team) => room.players.find((x) => x.team === t)?.faction ?? 'tribe';
    const setup = (t: Team) => ({ ...PVP_SETUP, gold: room.settings.gold, faction: factionOf(t) });
    room.world = new World([setup(0), setup(1)]);
    room.events = [];
    room.tick = 0;
    const [a, b] = room.players;
    const minutes = room.settings.minutes;
    send(a, { t: 'start', opponent: b.name, countdown: COUNTDOWN, minutes, factions: [a.faction, b.faction] });
    send(b, { t: 'start', opponent: a.name, countdown: COUNTDOWN, minutes, factions: [b.faction, a.faction] });
    for (const w of room.watchers) {
      send(w, {
        t: 'spectate', code: room.code, players: spectateNames(room), countdown: COUNTDOWN, minutes,
        factions: spectateFactions(room),
      });
    }
    broadcastState(room);
    sendPool(room);
    log(`room ${room.code}: ${a.name} vs ${b.name}`);
    room.timer = setTimeout(() => {
      room.state = 'playing';
      room.timer = setInterval(() => step(room), 1000 / TICK_HZ);
    }, COUNTDOWN * 1000);
  };

  const step = (room: Room) => {
    const world = room.world;
    if (!world || room.state !== 'playing') return;
    world.update(1 / TICK_HZ);
    room.events.push(...world.drainEvents());
    room.tick++;
    if (room.tick % SEND_EVERY === 0 || world.winner !== null) broadcastState(room);
    if (!room.betsClosed && !betOpen(room)) {
      room.betsClosed = true;
      sendPool(room);
    }
    if (world.winner !== null) endMatch(room, world.winner, 'statue');
    else if (world.time >= room.settings.minutes * 60) {
      // Hết giờ: bên còn nhiều máu tượng hơn thắng
      const [t0, t1] = world.teams;
      const r0 = t0.statueHp / t0.statueMax;
      const r1 = t1.statueHp / t1.statueMax;
      endMatch(room, r0 === r1 ? null : r0 > r1 ? 0 : 1, 'timeout');
    }
  };

  const broadcastState = (room: Room) => {
    if (!room.world) return;
    for (const p of room.players) send(p, { t: 'state', s: encodeSnapshot(room.world, p.team, room.events) });
    if (room.watchers.size) {
      // Mọi người xem nhận cùng một ảnh chụp: đóng gói một lần
      const data = JSON.stringify({ t: 'state', s: encodeSnapshot(room.world, 0, room.events, true) } satisfies ServerMsg);
      for (const w of room.watchers) if (w.ws.readyState === w.ws.OPEN) w.ws.send(data);
    }
    room.events = [];
  };

  const endMatch = (room: Room, winner: Team | null, reason: EndReason) => {
    if (room.state === 'ended' || room.state === 'waiting') return;
    stopTimer(room);
    room.state = 'ended';
    room.lastEnd = { winner, reason };
    for (const p of room.players) send(p, endFor(room, p.team)!);
    for (const w of room.watchers) send(w, endFor(room, 0)!);
    room.betsClosed = true;
    sendPool(room);
    settleBets(room, winner);
    {
      const side = (t: Team): Side => {
        const x = room.players.find((q) => q.team === t);
        return { id: x?.account ?? null, name: x?.name ?? '?', faction: room.world?.teams[t].faction ?? 'tribe' };
      };
      accounts.recordMatch([side(0), side(1)], winner);
    }
    log(`room ${room.code}: end (${reason})`);
    if (room.private) {
      // Phòng tạo: về lại phòng chờ, chủ phòng bấm bắt đầu trận mới
      const name = winner === null ? null : room.players.find((x) => x.team === winner)?.name;
      system(room, name ? `🏆 ${name} thắng!` : '🤝 Hoà');
      room.state = 'waiting';
      room.world = null;
      room.ready.clear();
      room.betsClosed = room.players.length < 2;
      sendRoom(room);
      sendPool(room);
    }
  };

  /** Đóng phòng: người xem còn lại được báo về sảnh. */
  const closeRoom = (room: Room) => {
    stopTimer(room);
    settleBets(room, null);
    for (const w of room.watchers) {
      w.room = null;
      send(w, { t: 'closed' });
    }
    room.watchers.clear();
    rooms.delete(room.code);
  };

  const leaveRoom = (p: Player) => {
    const room = p.room;
    if (!room) return;
    if (p.voice) {
      p.voice = false;
      p.room = null;
      sendVoice(room);
    }
    p.room = null;
    if (p.role === 'watcher') {
      room.watchers.delete(p);
      sendWatchers(room);
    } else {
      const rest = room.players.find((x) => x !== p);
      // Rời trận giữa chừng thì người còn lại thắng
      if (room.state === 'playing' || room.state === 'countdown') endMatch(room, rest ? rest.team : null, 'disconnect');
      stopTimer(room);
      room.players = room.players.filter((x) => x !== p);
      room.ready.delete(p);
      room.rematch.clear();
      if (rest) send(rest, { t: 'left' });
      if (!room.private) {
        // Phòng ghép nhanh: một người đi là đóng phòng
        if (rest) rest.room = null;
        closeRoom(room);
        return;
      }
    }
    if (!room.private) return;
    if (!everyone(room).length) {
      closeRoom(room);
      return;
    }
    system(room, `${p.name} đã rời phòng`);
    if (room.host === p) {
      // Chuyển quyền chủ phòng: ưu tiên người đang ngồi ghế
      room.host = room.players[0] ?? [...room.watchers][0];
      room.ready.delete(room.host);
      system(room, `👑 ${room.host.name} giờ là chủ phòng`);
    }
    sendRoom(room);
    if (p.role === 'player') seatsChanged(room);
  };

  /** Lệnh chỉ chủ phòng chờ được dùng; trả về phòng nếu hợp lệ. */
  const hostRoom = (p: Player, room: Room | null): Room | null => {
    if (!room?.private || room.host !== p) {
      send(p, { t: 'error', msg: 'Chỉ chủ phòng mới làm được' });
      return null;
    }
    if (room.state !== 'waiting') {
      send(p, { t: 'error', msg: 'Trận đang diễn ra' });
      return null;
    }
    return room;
  };

  const handle = (p: Player, msg: ClientMsg) => {
    const room = p.room;
    switch (msg.t) {
      case 'hello':
        p.name = cleanName(msg.name);
        if (validWalletId(msg.wallet)) p.wallet = msg.wallet;
        if (validFaction(msg.faction)) p.faction = msg.faction;
        {
          const acc = accounts.bySession(msg.session);
          p.account = acc?.id ?? null;
          if (acc) {
            p.name = acc.name;
            p.wallet = accountWallet(acc.id);
          }
          send(p, { t: 'account', account: acc });
        }
        wallets.relief(p.wallet);
        send(p, { t: 'wallet', xu: wallets.get(p.wallet) });
        break;
      case 'ping':
        send(p, { t: 'pong', c: Number(msg.c) || 0 });
        break;
      case 'quick': {
        if (room) leaveRoom(p);
        const open = [...rooms.values()].find((r) => !r.private && r.state === 'waiting' && r.players.length === 1);
        const target = open ?? createRoom(false);
        if (!target) return send(p, { t: 'error', msg: 'Máy chủ đang quá tải, thử lại sau' });
        joinRoom(p, target);
        break;
      }
      case 'create': {
        const target = createRoom(true);
        if (!target) return send(p, { t: 'error', msg: 'Máy chủ đang quá tải, thử lại sau' });
        joinRoom(p, target);
        break;
      }
      case 'join': {
        const code = String(msg.code ?? '').toUpperCase().trim();
        const target = rooms.get(code);
        if (!target || !everyone(target).length) return send(p, { t: 'error', msg: `Không tìm thấy phòng ${code}` });
        if (target.banned.has(p.wallet)) return send(p, { t: 'error', msg: 'Chủ phòng đã mời bạn ra khỏi phòng này' });
        if (msg.as === 'watch') return watchRoom(p, target);
        if (target === room && p.role === 'player') return;
        // Phòng đã có đủ 2 người: hỏi lại người vào có muốn xem không
        if (target.players.length >= 2 || target.state !== 'waiting') {
          return send(p, { t: 'full', code: target.code, players: target.players.map((x) => x.name) });
        }
        joinRoom(p, target);
        break;
      }
      case 'seat':
        if (!room?.private || room.state !== 'waiting') return;
        if (msg.as === 'watch' && p.role === 'player') standUp(p, room);
        else if (msg.as === 'play' && p.role === 'watcher') {
          if (room.players.length >= 2) return send(p, { t: 'error', msg: 'Hết ghế trống' });
          joinRoom(p, room);
        }
        break;
      case 'ready':
        if (!room?.private || room.state !== 'waiting' || p.role !== 'player' || p === room.host) return;
        if (msg.on === room.ready.has(p)) return;
        if (msg.on) room.ready.add(p);
        else room.ready.delete(p);
        system(room, msg.on ? `✅ ${p.name} đã sẵn sàng` : `${p.name} huỷ sẵn sàng`);
        sendRoom(room);
        break;
      case 'begin': {
        const r = hostRoom(p, room);
        if (!r) return;
        if (r.players.length < 2) return send(p, { t: 'error', msg: 'Cần đủ 2 người chơi' });
        const notReady = r.players.find((x) => x !== r.host && !r.ready.has(x));
        if (notReady) return send(p, { t: 'error', msg: `${notReady.name} chưa sẵn sàng` });
        system(r, '⚔️ Trận đấu bắt đầu!');
        startMatch(r);
        break;
      }
      case 'settings': {
        const r = hostRoom(p, room);
        if (!r || !ROOM_GOLD.includes(msg.gold) || !ROOM_MINUTES.includes(msg.minutes)) return;
        if (r.settings.gold === msg.gold && r.settings.minutes === msg.minutes) return;
        r.settings = { gold: msg.gold, minutes: msg.minutes };
        // Đổi luật thì khách phải xác nhận sẵn sàng lại
        r.ready.clear();
        system(r, `⚙️ Luật mới: ${msg.gold} vàng ban đầu · ${msg.minutes} phút`);
        sendRoom(r);
        break;
      }
      case 'kick': {
        const r = hostRoom(p, room);
        const target = r?.players.find((x) => x.team === msg.seat);
        if (!r || !target || target === p) return;
        r.banned.add(target.wallet);
        send(target, { t: 'kicked' });
        system(r, `${target.name} bị mời ra khỏi phòng`);
        leaveRoom(target);
        break;
      }
      case 'chat': {
        if (!room?.private) return;
        const text = cleanChat(msg.text);
        const now = Date.now();
        if (!text || now - p.lastChat < CHAT_GAP_MS) return;
        p.lastChat = now;
        say(room, { from: p.name, text, kind: p.role });
        break;
      }
      case 'bet':
        placeBet(p, room, msg.side, msg.amount);
        break;
      case 'voice':
        setVoice(p, !!msg.on);
        break;
      case 'voiceMute':
        if (!room || !p.voice) return;
        p.muted = !!msg.muted;
        sendVoice(room);
        break;
      case 'signal':
        relaySignal(p, msg.to, msg.data);
        break;
      case 'lobby':
        p.lobby = !!msg.on;
        if (p.lobby) sendLobby(p);
        break;
      case 'leave':
        leaveRoom(p);
        break;
      case 'train':
        if (p.role === 'player' && room?.state === 'playing' && UNIT_ORDER.includes(msg.kind as UnitKind)) {
          room.world!.train(p.team, msg.kind);
        }
        break;
      case 'stance':
        if (p.role === 'player' && room?.state === 'playing' && STANCES.includes(msg.stance)) {
          room.world!.setStance(p.team, msg.stance);
        }
        break;
      case 'faction':
        // Đổi tộc khi chưa vào trận; phòng chờ thấy ngay
        if (validFaction(msg.id) && (!room || room.state === 'waiting' || room.state === 'ended')) {
          p.faction = msg.id;
          if (room) sendRoom(room);
        }
        break;
      case 'formation':
        if (p.role === 'player' && room?.state === 'playing' && FORMATIONS.includes(msg.mode)) {
          room.world!.setFormation(p.team, msg.mode);
        }
        break;
      case 'centerMine':
        if (p.role === 'player' && room?.state === 'playing') room.world!.setCenterMine(p.team, msg.on === true);
        break;
      case 'surrender':
        if (p.role === 'player' && room && (room.state === 'playing' || room.state === 'countdown')) {
          endMatch(room, (1 - p.team) as Team, 'surrender');
        }
        break;
      case 'rematch':
        // Chỉ phòng ghép nhanh; phòng tạo thì quay về phòng chờ
        if (!room?.private && p.role === 'player' && room?.state === 'ended' && room.players.length === 2) {
          room.rematch.add(p);
          for (const x of room.players) send(x, { t: 'rematch', votes: room.rematch.size });
          if (room.rematch.size === 2) startMatch(room);
        }
        break;
    }
  };

  wss.on('connection', (ws) => {
    const p: Player = {
      ws,
      name: 'Người que',
      wallet: `tmp-${randomUUID()}`,
      room: null,
      role: 'player',
      lobby: false,
      team: 0,
      faction: 'tribe',
      account: null,
      alive: true,
      msgWindow: Date.now(),
      msgCount: 0,
      lastChat: 0,
      vid: randomUUID().slice(0, 8),
      voice: false,
      muted: true,
      sigWindow: Date.now(),
      sigCount: 0,
    };
    players.add(p);
    send(p, { t: 'welcome', online: players.size });
    ws.on('pong', () => (p.alive = true));
    ws.on('message', (data) => {
      let msg: ClientMsg;
      try {
        msg = JSON.parse(String(data));
      } catch {
        return;
      }
      if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return;
      const now = Date.now();
      if (msg.t === 'signal') {
        if (now - p.sigWindow > 1000) {
          p.sigWindow = now;
          p.sigCount = 0;
        }
        if (++p.sigCount > MAX_SIGNAL_PER_SEC) return;
      } else {
        if (now - p.msgWindow > 1000) {
          p.msgWindow = now;
          p.msgCount = 0;
        }
        if (++p.msgCount > MAX_MSG_PER_SEC) return;
      }
      handle(p, msg);
    });
    ws.on('close', () => {
      leaveRoom(p);
      players.delete(p);
    });
  });

  // Ngắt kết nối chết (mất mạng không báo)
  const heartbeat = setInterval(() => {
    for (const p of players) {
      if (!p.alive) {
        p.ws.terminate();
        continue;
      }
      p.alive = false;
      p.ws.ping();
    }
  }, 15000);

  // Danh sách Đấu trường cập nhật đều đặn cho ai đang mở tab
  const lobbyTimer = setInterval(() => sendLobby(), LOBBY_EVERY_MS);

  return new Promise((resolve) => {
    http.listen(port, () => {
      const addr = http.address();
      resolve({
        port: typeof addr === 'object' && addr ? addr.port : port,
        stats: () => ({ players: players.size, rooms: rooms.size }),
        close: () =>
          new Promise<void>((done) => {
            clearInterval(heartbeat);
            clearInterval(lobbyTimer);
            wallets.close();
            accounts.close();
            for (const r of rooms.values()) stopTimer(r);
            for (const p of players) p.ws.terminate();
            wss.close();
            http.close(() => done());
          }),
      });
    });
  });
}
