import { randomUUID } from 'node:crypto';
import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import {
  BET_SECONDS,
  CHAT_KEEP,
  DEPOT_SLOTS,
  FORMATIONS,
  LOBBY_MAX_ROOMS,
  MAX_SPECTATORS,
  MAX_VOICE,
  MIN_BET,
  PVP_MAX_SECONDS,
  PVP_SETUP,
  PVP_XU,
  PVP_XU_MIN_SECONDS,
  ROOM_GOLD,
  ROOM_MINUTES,
  SIGNAL_MAX_BYTES,
  STANCES,
  UNIT_ORDER,
  WORLD_WIDTH,
  World,
  cleanChat,
  cleanName,
  encodeSnapshot,
  toFactionId,
  type ChatLine,
  type ClientMsg,
  type EndReason,
  type FactionId,
  type LobbyRoom,
  type RoomState,
  type Seat,
  type ServerMsg,
  type Team,
  type UnitKind,
} from '@stickman-war/core';
import type { WebSocket } from 'ws';
import { AccountsService, accountWallet, type Side } from '../accounts/accounts.service';
import { OPTIONS, type ServerOptions } from '../common/tokens';
import { WalletsService, validWalletId } from '../wallets/wallets.service';
import { settleBets } from './bets';
import {
  TICK_HZ,
  SEND_EVERY,
  COUNTDOWN,
  MAX_MSG_PER_SEC,
  MAX_SIGNAL_PER_SEC,
  MAX_ROOMS,
  LOBBY_EVERY_MS,
  HEARTBEAT_MS,
  CHAT_GAP_MS,
  CODE_CHARS,
  type Player,
  type Room,
} from './room';

/**
 * Sảnh online: phòng, ghép trận, chạy trận (server-authoritative), người xem, bắt kèo,
 * chat phòng chờ, chuyển tin bắt tay thoại WebRTC. Nhận kết nối từ GameGateway.
 */
@Injectable()
export class LobbyService implements OnModuleDestroy {
  private readonly players = new Set<Player>();
  private readonly rooms = new Map<string, Room>();
  private readonly betSeconds: number;
  private readonly heartbeat: NodeJS.Timeout;
  private readonly lobbyTimer: NodeJS.Timeout;

  constructor(
    @Inject(OPTIONS) private readonly opts: ServerOptions,
    @Inject(WalletsService) private readonly wallets: WalletsService,
    @Inject(AccountsService) private readonly accounts: AccountsService,
  ) {
    this.betSeconds = opts.betSeconds ?? BET_SECONDS;
    // Ngắt kết nối chết (mất mạng không báo)
    this.heartbeat = setInterval(() => {
      for (const p of this.players) {
        if (!p.alive) {
          p.ws.terminate();
          continue;
        }
        p.alive = false;
        p.ws.ping();
      }
    }, HEARTBEAT_MS);
    // Danh sách Đấu trường cập nhật đều đặn cho ai đang mở tab
    this.lobbyTimer = setInterval(() => this.sendLobby(), LOBBY_EVERY_MS);
  }

  stats() {
    return { players: this.players.size, rooms: this.rooms.size };
  }

  /** Đổi tên hiển thị của mọi kết nối thuộc tài khoản (sau khi sửa hồ sơ). */
  renameAccount(id: string, name: string): void {
    for (const p of this.players) if (p.account === id) p.name = name;
  }

  onModuleDestroy(): void {
    clearInterval(this.heartbeat);
    clearInterval(this.lobbyTimer);
    for (const r of this.rooms.values()) this.stopTimer(r);
    for (const p of this.players) p.ws.terminate();
  }

  // ---------- Kết nối ----------

  connect(ws: WebSocket): void {
    const p: Player = {
      ws,
      name: 'Stickman',
      wallet: `tmp-${randomUUID()}`,
      room: null,
      role: 'player',
      lobby: false,
      team: 0,
      faction: 'light',
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
      queue: Promise.resolve(),
    };
    this.players.add(p);
    this.send(p, { t: 'welcome', online: this.players.size });
    ws.on('pong', () => (p.alive = true));
    ws.on('message', (data) => {
      let msg: ClientMsg;
      try {
        msg = JSON.parse(String(data));
      } catch {
        return;
      }
      if (!msg || typeof msg !== 'object' || typeof msg.t !== 'string') return;
      if (!this.allow(p, msg.t === 'signal')) return;
      p.queue = p.queue.then(() => this.handle(p, msg)).catch((e: Error) => this.opts.log(`lỗi xử lý "${msg.t}": ${e.message}`));
    });
    ws.on('close', () => {
      this.leaveRoom(p);
      this.players.delete(p);
    });
  }

  /** Chống spam: tối đa MAX_MSG_PER_SEC tin/giây (tin bắt tay thoại đếm riêng). */
  private allow(p: Player, signal: boolean): boolean {
    const now = Date.now();
    if (signal) {
      if (now - p.sigWindow > 1000) {
        p.sigWindow = now;
        p.sigCount = 0;
      }
      return ++p.sigCount <= MAX_SIGNAL_PER_SEC;
    }
    if (now - p.msgWindow > 1000) {
      p.msgWindow = now;
      p.msgCount = 0;
    }
    return ++p.msgCount <= MAX_MSG_PER_SEC;
  }

  private send(p: Player, msg: ServerMsg): void {
    if (p.ws.readyState === p.ws.OPEN) p.ws.send(JSON.stringify(msg));
  }

  private newCode(): string {
    for (;;) {
      let code = '';
      for (let i = 0; i < 4; i++) code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
      if (!this.rooms.has(code)) return code;
    }
  }

  private everyone(room: Room): Player[] {
    return [...room.players, ...room.watchers];
  }

  private sendWatchers(room: Room): void {
    for (const p of this.everyone(room)) this.send(p, { t: 'watchers', n: room.watchers.size });
  }

  // ---------- Phòng chờ ----------

  /** Gửi trạng thái phòng: phòng chờ cho phòng tạo, thông tin chờ ghép cho phòng ghép nhanh. */
  private sendRoom(room: Room): void {
    if (!room.private) {
      const info = { code: room.code, private: false, players: room.players.map((x) => x.name) };
      for (const p of room.players) this.send(p, { t: 'room', ...info, watching: false });
      for (const p of room.watchers) this.send(p, { t: 'room', ...info, watching: true });
      return;
    }
    // Người chơi chỉ thấy hệ của mình; người xem thấy hệ cả hai bên
    const seat = (t: Team, viewer: Player): Seat | null => {
      const x = room.players.find((q) => q.team === t);
      if (!x) return null;
      const hidden = viewer.role === 'player' && viewer !== x;
      return { name: x.name, host: x === room.host, ready: x === room.host || room.ready.has(x), faction: hidden ? null : x.faction };
    };
    const base = {
      code: room.code,
      watchers: [...room.watchers].map((x) => x.name),
      host: room.host?.name ?? '',
      settings: room.settings,
    };
    for (const p of this.everyone(room)) {
      this.send(p, {
        t: 'waitroom',
        ...base,
        seats: [seat(0, p), seat(1, p)],
        you: { role: p.role, host: p === room.host, seat: p.role === 'player' ? p.team : null },
      });
    }
  }

  // ---------- Thoại: máy chủ chỉ chuyển tin bắt tay, âm thanh đi thẳng giữa các trình duyệt ----------

  private sendVoice(room: Room): void {
    const members = this.everyone(room);
    const peers = members.filter((x) => x.voice).map((x) => ({ id: x.vid, name: x.name, muted: x.muted, role: x.role }));
    for (const p of members) this.send(p, { t: 'voicePeers', you: p.voice ? p.vid : null, peers });
  }

  private setVoice(p: Player, on: boolean): void {
    const room = p.room;
    if (!room || p.voice === on) return;
    if (on && this.everyone(room).filter((x) => x.voice).length >= MAX_VOICE) {
      return this.send(p, { t: 'error', msg: `Phòng thoại đã đủ ${MAX_VOICE} người` });
    }
    p.voice = on;
    p.muted = true;
    this.sendVoice(room);
  }

  private relaySignal(p: Player, to: unknown, data: unknown): void {
    const room = p.room;
    if (!room || !p.voice || typeof to !== 'string' || !data || typeof data !== 'object') return;
    if (JSON.stringify(data).length > SIGNAL_MAX_BYTES) return;
    const target = this.everyone(room).find((x) => x.vid === to && x.voice);
    if (target) this.send(target, { t: 'signal', from: p.vid, data: data as never });
  }

  private say(room: Room, line: ChatLine): void {
    room.chat.push(line);
    if (room.chat.length > CHAT_KEEP) room.chat.shift();
    for (const p of this.everyone(room)) this.send(p, { t: 'chat', line });
  }

  private system(room: Room, text: string): void {
    this.say(room, { from: '', text, kind: 'system' });
  }

  // ---------- Bắt kèo ----------

  private betOpen(room: Room): boolean {
    return (
      !room.betsClosed &&
      ((room.state === 'waiting' && room.players.length === 2) ||
        room.state === 'countdown' ||
        (room.state === 'playing' && (room.world?.time ?? 0) < this.betSeconds))
    );
  }

  /** Quỹ kèo gửi cho cả phòng (người chơi cũng thấy được cược thế nào). */
  private sendPool(room: Room): void {
    const totals: [number, number] = [0, 0];
    const counts: [number, number] = [0, 0];
    for (const b of room.bets.values()) {
      totals[b.side] += b.amount;
      counts[b.side]++;
    }
    const open = this.betOpen(room);
    for (const p of this.everyone(room)) {
      const mine = p.role === 'watcher' ? (room.bets.get(p.wallet) ?? null) : null;
      this.send(p, { t: 'pool', open, closesAt: this.betSeconds, totals, counts, mine });
    }
  }

  /** Chia quỹ kèo (cách chia ở bets.ts) rồi báo kết quả cho mọi kết nối dùng ví đó, kể cả đã rời phòng. */
  private settleBets(room: Room, winner: Team | null): void {
    if (!room.bets.size) return;
    const { refund, pool, results } = settleBets(room.bets, winner);
    for (const r of results) {
      const xu = r.payout ? this.wallets.add(r.wallet, r.payout) : this.wallets.get(r.wallet);
      for (const p of this.players)
        if (p.wallet === r.wallet) this.send(p, { t: 'betResult', outcome: r.outcome, amount: r.amount, payout: r.payout, xu });
    }
    this.opts.log(`room ${room.code}: settled ${room.bets.size} bets (${refund ? 'refund' : `pool ${pool}`})`);
    room.bets.clear();
  }

  /** Ghế trong phòng chờ thay đổi: kèo đã đặt cho cặp đấu cũ được hoàn lại, mở / khoá kèo theo số người ngồi. */
  private seatsChanged(room: Room): void {
    if (!room.private || room.state !== 'waiting') return;
    if (room.bets.size) {
      this.settleBets(room, null);
      this.system(room, 'Đổi người chơi: hoàn lại toàn bộ tiền kèo');
    }
    room.betsClosed = room.players.length < 2;
    this.sendPool(room);
  }

  private placeBet(p: Player, room: Room | null, side: unknown, rawAmount: unknown): void {
    if (!room || p.role !== 'watcher') return this.send(p, { t: 'error', msg: 'Chỉ người xem mới bắt kèo được' });
    if (!this.betOpen(room)) return this.send(p, { t: 'error', msg: 'Đã khoá kèo trận này' });
    if (side !== 0 && side !== 1) return;
    // Không cho người đang đánh trận này cược bằng tab khác
    if (room.players.some((x) => x.wallet === p.wallet)) return this.send(p, { t: 'error', msg: 'Bạn đang chơi trận này' });
    if (room.bets.has(p.wallet)) return this.send(p, { t: 'error', msg: 'Bạn đã bắt kèo trận này rồi' });
    const amount = Math.floor(Number(rawAmount));
    if (!(amount >= MIN_BET)) return this.send(p, { t: 'error', msg: `Cược ít nhất ${MIN_BET} xu` });
    if (amount > this.wallets.get(p.wallet)) return this.send(p, { t: 'error', msg: 'Không đủ xu' });
    const xu = this.wallets.add(p.wallet, -amount);
    room.bets.set(p.wallet, { side, amount });
    for (const x of this.players) if (x.wallet === p.wallet) this.send(x, { t: 'wallet', xu });
    const name = room.players.find((x) => x.team === side)?.name ?? '';
    if (room.private) this.system(room, `${p.name} cược ${amount} xu vào ${name}`);
    this.sendPool(room);
  }

  // ---------- Trận đấu ----------

  private endFor(room: Room, viewer: Team): ServerMsg | null {
    if (!room.lastEnd) return null;
    const { winner, reason } = room.lastEnd;
    return {
      t: 'end',
      result: winner === null ? 'draw' : winner === viewer ? 'win' : 'lose',
      reason,
      winner: winner === null ? null : (room.players.find((x) => x.team === winner)?.name ?? null),
    };
  }

  private lobbyList(): LobbyRoom[] {
    const order: Record<RoomState, number> = { waiting: 0, countdown: 1, playing: 1, ended: 2 };
    return [...this.rooms.values()]
      .filter((r) => this.everyone(r).length > 0)
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
  }

  private sendLobby(only?: Player): void {
    const targets = only ? [only] : [...this.players].filter((p) => p.lobby && !p.room);
    if (!targets.length) return;
    const msg = JSON.stringify({ t: 'lobby', rooms: this.lobbyList(), online: this.players.size } satisfies ServerMsg);
    for (const p of targets) if (p.ws.readyState === p.ws.OPEN) p.ws.send(msg);
  }

  private createRoom(isPrivate: boolean): Room | null {
    if (this.rooms.size >= MAX_ROOMS) return null;
    const room: Room = {
      code: this.newCode(),
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
    this.rooms.set(room.code, room);
    return room;
  }

  private stopTimer(room: Room): void {
    if (room.timer) clearInterval(room.timer);
    room.timer = null;
  }

  private joinRoom(p: Player, room: Room): void {
    const wasWatcher = p.room === room && p.role === 'watcher';
    if (wasWatcher) {
      // Người xem ngồi vào ghế trống
      room.watchers.delete(p);
      this.sendWatchers(room);
    } else this.leaveRoom(p);
    p.room = room;
    p.role = 'player';
    p.team = room.players.some((x) => x.team === 0) ? 1 : 0;
    room.players.push(p);
    if (!room.private) {
      this.sendRoom(room);
      if (room.players.length === 2) this.startMatch(room);
      return;
    }
    room.host ??= p;
    if (!wasWatcher) this.send(p, { t: 'chatLog', lines: room.chat });
    this.system(room, wasWatcher ? `${p.name} đã ngồi vào ghế` : `${p.name} đã vào phòng`);
    this.sendRoom(room);
    this.seatsChanged(room);
  }

  private watchRoom(p: Player, room: Room): void {
    if (p.room === room && p.role === 'watcher') return;
    if (room.watchers.size >= MAX_SPECTATORS) return this.send(p, { t: 'error', msg: 'Phòng đã đủ người xem' });
    this.leaveRoom(p);
    p.room = room;
    p.role = 'watcher';
    room.watchers.add(p);
    this.sendWatchers(room);
    if (room.private) {
      this.send(p, { t: 'chatLog', lines: room.chat });
      this.system(room, `${p.name} vào xem`);
    }
    if (room.state === 'waiting' || !room.world) {
      this.sendRoom(room);
      if (room.private) this.sendPool(room);
      return;
    }
    const left = room.state === 'countdown' ? Math.ceil(COUNTDOWN - (Date.now() - room.startedAt) / 1000) : 0;
    this.send(p, {
      t: 'spectate',
      code: room.code,
      players: this.spectateNames(room),
      countdown: Math.max(0, left),
      minutes: room.settings.minutes,
      factions: this.spectateFactions(room),
    });
    this.send(p, { t: 'state', s: encodeSnapshot(room.world, 0, [], true) });
    this.sendPool(room);
    const end = this.endFor(room, 0);
    if (room.state === 'ended' && end) this.send(p, end);
  }

  /** Người chơi trong phòng chờ đứng dậy sang xem. */
  private standUp(p: Player, room: Room): void {
    room.players = room.players.filter((x) => x !== p);
    room.ready.delete(p);
    p.role = 'watcher';
    room.watchers.add(p);
    this.system(room, `${p.name} ra ghế xem`);
    this.sendWatchers(room);
    this.sendRoom(room);
    this.seatsChanged(room);
  }

  private spectateFactions(room: Room): [FactionId, FactionId] {
    return [room.world!.teams[0].faction, room.world!.teams[1].faction];
  }

  /** Tên hai bên theo góc nhìn người xem: team 0 bên trái. */
  private spectateNames(room: Room): [string, string] {
    const by = (t: Team) => room.players.find((x) => x.team === t)?.name ?? '';
    return [by(0), by(1)];
  }

  private startMatch(room: Room): void {
    this.stopTimer(room);
    room.state = 'countdown';
    room.startedAt = Date.now();
    room.lastEnd = null;
    room.rematch.clear();
    room.ready.clear();
    // Kèo đặt từ phòng chờ được giữ nguyên, mở tiếp đến hết betSeconds đầu trận
    room.betsClosed = false;
    const factionOf = (t: Team) => room.players.find((x) => x.team === t)?.faction ?? 'light';
    const setup = (t: Team) => ({ ...PVP_SETUP, gold: room.settings.gold, faction: factionOf(t) });
    room.world = new World([setup(0), setup(1)]);
    room.events = [];
    room.tick = 0;
    const [a, b] = room.players;
    const minutes = room.settings.minutes;
    this.send(a, { t: 'start', opponent: b.name, countdown: COUNTDOWN, minutes, factions: [a.faction, b.faction] });
    this.send(b, { t: 'start', opponent: a.name, countdown: COUNTDOWN, minutes, factions: [b.faction, a.faction] });
    for (const w of room.watchers) {
      this.send(w, {
        t: 'spectate',
        code: room.code,
        players: this.spectateNames(room),
        countdown: COUNTDOWN,
        minutes,
        factions: this.spectateFactions(room),
      });
    }
    this.broadcastState(room);
    this.sendPool(room);
    this.opts.log(`room ${room.code}: ${a.name} vs ${b.name}`);
    room.timer = setTimeout(() => {
      room.state = 'playing';
      room.timer = setInterval(() => this.step(room), 1000 / TICK_HZ);
    }, COUNTDOWN * 1000);
  }

  private step(room: Room): void {
    const world = room.world;
    if (!world || room.state !== 'playing') return;
    world.update(1 / TICK_HZ);
    room.events.push(...world.drainEvents());
    room.tick++;
    if (room.tick % SEND_EVERY === 0 || world.winner !== null) this.broadcastState(room);
    if (!room.betsClosed && !this.betOpen(room)) {
      room.betsClosed = true;
      this.sendPool(room);
    }
    if (world.winner !== null) this.endMatch(room, world.winner, 'statue');
    else if (world.time >= room.settings.minutes * 60) {
      // Hết giờ: bên còn nhiều máu tượng hơn thắng
      const [t0, t1] = world.teams;
      const r0 = t0.statueHp / t0.statueMax;
      const r1 = t1.statueHp / t1.statueMax;
      this.endMatch(room, r0 === r1 ? null : r0 > r1 ? 0 : 1, 'timeout');
    }
  }

  private broadcastState(room: Room): void {
    if (!room.world) return;
    for (const p of room.players) this.send(p, { t: 'state', s: encodeSnapshot(room.world, p.team, room.events) });
    if (room.watchers.size) {
      // Mọi người xem nhận cùng một ảnh chụp: đóng gói một lần
      const data = JSON.stringify({ t: 'state', s: encodeSnapshot(room.world, 0, room.events, true) } satisfies ServerMsg);
      for (const w of room.watchers) if (w.ws.readyState === w.ws.OPEN) w.ws.send(data);
    }
    room.events = [];
  }

  private endMatch(room: Room, winner: Team | null, reason: EndReason): void {
    if (room.state === 'ended' || room.state === 'waiting') return;
    this.stopTimer(room);
    room.state = 'ended';
    room.lastEnd = { winner, reason };
    const rewards = this.matchRewards(room, winner);
    for (const p of room.players) {
      const reward = rewards.get(p);
      this.send(p, { ...this.endFor(room, p.team)!, ...(reward ? { reward } : {}) } as ServerMsg);
    }
    for (const [p, gain] of rewards) this.sendWallet(p.wallet, gain);
    for (const w of room.watchers) this.send(w, this.endFor(room, 0)!);
    room.betsClosed = true;
    this.sendPool(room);
    this.settleBets(room, winner);
    const side = (t: Team): Side => {
      const x = room.players.find((q) => q.team === t);
      return { id: x?.account ?? null, name: x?.name ?? '?', faction: room.world?.teams[t].faction ?? 'light' };
    };
    this.accounts.recordMatch([side(0), side(1)], winner).catch((e: Error) => this.opts.log(`không ghi được kết quả trận: ${e.message}`));
    this.opts.log(`room ${room.code}: end (${reason})`);
    if (room.private) {
      // Phòng tạo: về lại phòng chờ, chủ phòng bấm bắt đầu trận mới
      const name = winner === null ? null : room.players.find((x) => x.team === winner)?.name;
      this.system(room, name ? `🏆 ${name} thắng!` : '🤝 Hoà');
      room.state = 'waiting';
      room.world = null;
      room.ready.clear();
      room.betsClosed = room.players.length < 2;
      this.sendRoom(room);
      this.sendPool(room);
    }
  }

  /**
   * Xu thưởng sau trận online: thắng / hoà theo PVP_XU (thua không có). Không thưởng khi trận ngắn hơn
   * PVP_XU_MIN_SECONDS hoặc hai bên cùng một ví (tự đánh với mình).
   */
  private matchRewards(room: Room, winner: Team | null): Map<Player, number> {
    const out = new Map<Player, number>();
    const [a, b] = room.players;
    if (!a || !b || a.wallet === b.wallet || (room.world?.time ?? 0) < (this.opts.pvpXuMinSeconds ?? PVP_XU_MIN_SECONDS)) return out;
    for (const p of room.players) {
      const gain = PVP_XU[winner === null ? 'draw' : winner === p.team ? 'win' : 'lose'];
      if (!gain) continue;
      out.set(p, gain);
      this.wallets.add(p.wallet, gain);
    }
    return out;
  }

  /** Báo số dư mới (kèm số xu vừa thưởng) cho mọi kết nối dùng ví này. */
  private sendWallet(wallet: string, gain: number): void {
    const xu = this.wallets.get(wallet);
    for (const x of this.players) if (x.wallet === wallet) this.send(x, { t: 'wallet', xu, gain });
  }

  /** Đóng phòng: người xem còn lại được báo về sảnh. */
  private closeRoom(room: Room): void {
    this.stopTimer(room);
    this.settleBets(room, null);
    for (const w of room.watchers) {
      w.room = null;
      this.send(w, { t: 'closed' });
    }
    room.watchers.clear();
    this.rooms.delete(room.code);
  }

  private leaveRoom(p: Player): void {
    const room = p.room;
    if (!room) return;
    if (p.voice) {
      p.voice = false;
      p.room = null;
      this.sendVoice(room);
    }
    p.room = null;
    if (p.role === 'watcher') {
      room.watchers.delete(p);
      this.sendWatchers(room);
    } else {
      const rest = room.players.find((x) => x !== p);
      // Rời trận giữa chừng thì người còn lại thắng
      if (room.state === 'playing' || room.state === 'countdown') this.endMatch(room, rest ? rest.team : null, 'disconnect');
      this.stopTimer(room);
      room.players = room.players.filter((x) => x !== p);
      room.ready.delete(p);
      room.rematch.clear();
      if (rest) this.send(rest, { t: 'left' });
      if (!room.private) {
        // Phòng ghép nhanh: một người đi là đóng phòng
        if (rest) rest.room = null;
        this.closeRoom(room);
        return;
      }
    }
    if (!room.private) return;
    if (!this.everyone(room).length) {
      this.closeRoom(room);
      return;
    }
    this.system(room, `${p.name} đã rời phòng`);
    if (room.host === p) {
      // Chuyển quyền chủ phòng: ưu tiên người đang ngồi ghế
      room.host = room.players[0] ?? [...room.watchers][0];
      room.ready.delete(room.host);
      this.system(room, `👑 ${room.host.name} giờ là chủ phòng`);
    }
    this.sendRoom(room);
    if (p.role === 'player') this.seatsChanged(room);
  }

  /** Lệnh chỉ chủ phòng chờ được dùng; trả về phòng nếu hợp lệ. */
  private hostRoom(p: Player, room: Room | null): Room | null {
    if (!room?.private || room.host !== p) {
      this.send(p, { t: 'error', msg: 'Chỉ chủ phòng mới làm được' });
      return null;
    }
    if (room.state !== 'waiting') {
      this.send(p, { t: 'error', msg: 'Trận đang diễn ra' });
      return null;
    }
    return room;
  }

  /** Chào máy chủ: tên, ví, hệ; còn phiên đăng nhập thì dùng tên + ví của tài khoản. */
  private async hello(p: Player, msg: Extract<ClientMsg, { t: 'hello' }>): Promise<void> {
    p.name = cleanName(msg.name);
    if (validWalletId(msg.wallet)) p.wallet = msg.wallet;
    const faction = toFactionId(msg.faction);
    if (faction) p.faction = faction;
    const acc = await this.accounts.bySession(msg.session);
    p.account = acc?.id ?? null;
    if (acc) {
      p.name = acc.name;
      p.wallet = accountWallet(acc.id);
    }
    this.send(p, { t: 'account', account: acc });
    await this.wallets.ensure(p.wallet);
    this.wallets.relief(p.wallet);
    this.send(p, { t: 'wallet', xu: this.wallets.get(p.wallet) });
  }

  private async handle(p: Player, msg: ClientMsg): Promise<void> {
    const room = p.room;
    switch (msg.t) {
      case 'hello':
        await this.hello(p, msg);
        break;
      case 'ping':
        this.send(p, { t: 'pong', c: Number(msg.c) || 0 });
        break;
      case 'quick': {
        if (room) this.leaveRoom(p);
        const open = [...this.rooms.values()].find((r) => !r.private && r.state === 'waiting' && r.players.length === 1);
        const target = open ?? this.createRoom(false);
        if (!target) return this.send(p, { t: 'error', msg: 'Máy chủ đang quá tải, thử lại sau' });
        this.joinRoom(p, target);
        break;
      }
      case 'create': {
        const target = this.createRoom(true);
        if (!target) return this.send(p, { t: 'error', msg: 'Máy chủ đang quá tải, thử lại sau' });
        this.joinRoom(p, target);
        break;
      }
      case 'join': {
        const code = String(msg.code ?? '')
          .toUpperCase()
          .trim();
        const target = this.rooms.get(code);
        if (!target || !this.everyone(target).length) return this.send(p, { t: 'error', msg: `Không tìm thấy phòng ${code}` });
        if (target.banned.has(p.wallet)) return this.send(p, { t: 'error', msg: 'Chủ phòng đã mời bạn ra khỏi phòng này' });
        if (msg.as === 'watch') return this.watchRoom(p, target);
        if (target === room && p.role === 'player') return;
        // Phòng đã có đủ 2 người: hỏi lại người vào có muốn xem không
        if (target.players.length >= 2 || target.state !== 'waiting') {
          return this.send(p, { t: 'full', code: target.code, players: target.players.map((x) => x.name) });
        }
        this.joinRoom(p, target);
        break;
      }
      case 'seat':
        if (!room?.private || room.state !== 'waiting') return;
        if (msg.as === 'watch' && p.role === 'player') this.standUp(p, room);
        else if (msg.as === 'play' && p.role === 'watcher') {
          if (room.players.length >= 2) return this.send(p, { t: 'error', msg: 'Hết ghế trống' });
          this.joinRoom(p, room);
        }
        break;
      case 'ready':
        if (!room?.private || room.state !== 'waiting' || p.role !== 'player' || p === room.host) return;
        if (msg.on === room.ready.has(p)) return;
        if (msg.on) room.ready.add(p);
        else room.ready.delete(p);
        this.system(room, msg.on ? `✅ ${p.name} đã sẵn sàng` : `${p.name} huỷ sẵn sàng`);
        this.sendRoom(room);
        break;
      case 'begin': {
        const r = this.hostRoom(p, room);
        if (!r) return;
        if (r.players.length < 2) return this.send(p, { t: 'error', msg: 'Cần đủ 2 người chơi' });
        const notReady = r.players.find((x) => x !== r.host && !r.ready.has(x));
        if (notReady) return this.send(p, { t: 'error', msg: `${notReady.name} chưa sẵn sàng` });
        this.system(r, '⚔️ Trận đấu bắt đầu!');
        this.startMatch(r);
        break;
      }
      case 'settings': {
        const r = this.hostRoom(p, room);
        if (!r || !ROOM_GOLD.includes(msg.gold) || !ROOM_MINUTES.includes(msg.minutes)) return;
        if (r.settings.gold === msg.gold && r.settings.minutes === msg.minutes) return;
        r.settings = { gold: msg.gold, minutes: msg.minutes };
        // Đổi luật thì khách phải xác nhận sẵn sàng lại
        r.ready.clear();
        this.system(r, `⚙️ Luật mới: ${msg.gold} vàng ban đầu · ${msg.minutes} phút`);
        this.sendRoom(r);
        break;
      }
      case 'kick': {
        const r = this.hostRoom(p, room);
        const target = r?.players.find((x) => x.team === msg.seat);
        if (!r || !target || target === p) return;
        r.banned.add(target.wallet);
        this.send(target, { t: 'kicked' });
        this.system(r, `${target.name} bị mời ra khỏi phòng`);
        this.leaveRoom(target);
        break;
      }
      case 'chat': {
        if (!room?.private) return;
        const text = cleanChat(msg.text);
        const now = Date.now();
        if (!text || now - p.lastChat < CHAT_GAP_MS) return;
        p.lastChat = now;
        this.say(room, { from: p.name, text, kind: p.role });
        break;
      }
      case 'bet':
        this.placeBet(p, room, msg.side, msg.amount);
        break;
      case 'campaignWin': {
        await this.wallets.ensure(p.wallet);
        const gain = await this.wallets.claimCampaign(p.wallet, msg.faction, msg.level, msg.stars);
        if (gain > 0) this.sendWallet(p.wallet, gain);
        break;
      }
      case 'soloLose': {
        const gain = await this.wallets.claimSoloLose(p.wallet);
        if (gain > 0) this.sendWallet(p.wallet, gain);
        break;
      }
      case 'voice':
        this.setVoice(p, !!msg.on);
        break;
      case 'voiceMute':
        if (!room || !p.voice) return;
        p.muted = !!msg.muted;
        this.sendVoice(room);
        break;
      case 'signal':
        this.relaySignal(p, msg.to, msg.data);
        break;
      case 'lobby':
        p.lobby = !!msg.on;
        if (p.lobby) this.sendLobby(p);
        break;
      case 'leave':
        this.leaveRoom(p);
        break;
      case 'train':
        if (p.role === 'player' && room?.state === 'playing' && UNIT_ORDER.includes(msg.kind as UnitKind)) {
          // Ô đền tính từ tượng nhà nên không cần lật gương; sai kiểu thì bỏ qua ô (lấy ô trống đầu tiên)
          const slot = Number.isInteger(msg.slot) && msg.slot! >= 0 && msg.slot! < DEPOT_SLOTS.length ? msg.slot : undefined;
          room.world!.train(p.team, msg.kind, slot);
        }
        break;
      case 'stance':
        if (p.role === 'player' && room?.state === 'playing' && STANCES.includes(msg.stance)) {
          room.world!.setStance(p.team, msg.stance);
        }
        break;
      case 'hold':
        if (p.role === 'player' && room?.state === 'playing' && typeof msg.x === 'number' && Number.isFinite(msg.x)) {
          // Ảnh chụp của team 1 bị lật gương, nên toạ độ người gửi cũng phải lật lại
          room.world!.setHold(p.team, p.team === 1 ? WORLD_WIDTH - msg.x : msg.x);
        }
        break;
      case 'wall':
        if (p.role === 'player' && room?.state === 'playing' && typeof msg.x === 'number' && Number.isFinite(msg.x)) {
          // Toạ độ người gửi team 1 bị lật gương như cắm cờ
          room.world!.orderWall(p.team, p.team === 1 ? WORLD_WIDTH - msg.x : msg.x);
        }
        break;
      case 'ult':
        if (p.role === 'player' && room?.state === 'playing' && typeof msg.x === 'number' && Number.isFinite(msg.x)) {
          // Toạ độ người gửi team 1 bị lật gương như cắm cờ
          room.world!.unleash(p.team, p.team === 1 ? WORLD_WIDTH - msg.x : msg.x);
        }
        break;
      case 'faction': {
        // Đổi hệ khi chưa vào trận; phòng chờ thấy ngay
        const id = toFactionId(msg.id);
        if (id && (!room || room.state === 'waiting' || room.state === 'ended')) {
          p.faction = id;
          if (room) this.sendRoom(room);
        }
        break;
      }
      case 'formation':
        if (p.role === 'player' && room?.state === 'playing' && FORMATIONS.includes(msg.mode)) {
          room.world!.setFormation(p.team, msg.mode);
        }
        break;
      case 'mineSplit':
        if (p.role === 'player' && room?.state === 'playing' && Array.isArray(msg.split)) room.world!.setMineSplit(p.team, msg.split);
        break;
      case 'centerMine':
        if (p.role === 'player' && room?.state === 'playing') room.world!.setCenterMine(p.team, msg.on === true);
        break;
      case 'surrender':
        if (p.role === 'player' && room && (room.state === 'playing' || room.state === 'countdown')) {
          this.endMatch(room, (1 - p.team) as Team, 'surrender');
        }
        break;
      case 'rematch':
        // Chỉ phòng ghép nhanh; phòng tạo thì quay về phòng chờ
        if (!room?.private && p.role === 'player' && room?.state === 'ended' && room.players.length === 2) {
          room.rematch.add(p);
          for (const x of room.players) this.send(x, { t: 'rematch', votes: room.rematch.size });
          if (room.rematch.size === 2) this.startMatch(room);
        }
        break;
    }
  }
}
