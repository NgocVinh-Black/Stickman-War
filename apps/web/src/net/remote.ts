import { UNITS, UNIT_ORDER, type Team, type UnitKind } from '@stickman-war/core';
import { t } from '@stickman-war/i18n';
import type { Drop, Projectile, TeamState, Unit, WorldEvent, WorldView } from '@stickman-war/core';
import { FACTION_ORDER, type FactionId } from '@stickman-war/core';
import { FLAG, FORMATIONS, PROJECTILES, STANCES, type ClientMsg, type ServerMsg, type Snapshot, type TeamSnap } from '@stickman-war/core';

/** Kết nối WebSocket tới máy chủ, tự đóng gói / giải mã tin nhắn. */
export class OnlineClient {
  private ws: WebSocket | null = null;
  private handlers = new Set<(m: ServerMsg) => void>();
  ping = 0;
  private pingTimer = 0;

  connect(name: string, wallet: string, faction?: FactionId): Promise<void> {
    return new Promise((resolve, reject) => {
      const url = new URL('ws', location.href);
      url.protocol = location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(url);
      this.ws = ws;
      const fail = setTimeout(() => {
        ws.close();
        reject(new Error('timeout'));
      }, 6000);
      ws.onopen = () => {
        clearTimeout(fail);
        this.send({ t: 'hello', name, wallet, faction });
        this.pingTimer = window.setInterval(() => this.send({ t: 'ping', c: performance.now() }), 3000);
        resolve();
      };
      ws.onerror = () => {
        clearTimeout(fail);
        reject(new Error('error'));
      };
      ws.onmessage = (e) => {
        let msg: ServerMsg;
        try {
          msg = JSON.parse(String(e.data));
        } catch {
          return;
        }
        if (msg.t === 'pong') this.ping = Math.round(performance.now() - msg.c);
        this.handlers.forEach((h) => h(msg));
      };
      ws.onclose = () => {
        clearInterval(this.pingTimer);
        this.handlers.forEach((h) => h({ t: 'error', msg: t('online.lostServer') }));
      };
    });
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  on(handler: (m: ServerMsg) => void): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  send(msg: ClientMsg): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(msg));
  }

  close(): void {
    clearInterval(this.pingTimer);
    this.handlers.clear();
    this.ws?.close();
    this.ws = null;
  }
}

type RemoteUnit = Unit & { targetX: number };

/**
 * Bản sao chiến trường dựng từ ảnh chụp của server.
 * Vị trí được làm mượt giữa các ảnh chụp, hoạt ảnh chạy tiếp cục bộ.
 */
export class RemoteWorld implements WorldView {
  units: RemoteUnit[] = [];
  projectiles: Projectile[] = [];
  drops: Drop[] = [];
  teams: [TeamState, TeamState];
  time = 0;
  winner: Team | null = null;
  snaps: [TeamSnap, TeamSnap] | null = null;
  private events: WorldEvent[] = [];

  constructor() {
    const empty = (): TeamState => ({
      faction: 'tribe',
      formation: 'free',
      formX: NaN,
      holdX: 0,
      gold: 0,
      statueHp: 1,
      statueMax: 1,
      stance: 'defend',
      queue: [],
      incomeMult: 1,
      unlocked: UNIT_ORDER,
      kills: 0,
      statueCooldown: 0,
      centerMine: false,
      mineSplit: [1, 1, 0],
      wallPlan: NaN,
      wallBuilder: -1,
      wallT: 0,
    });
    this.teams = [empty(), empty()];
  }

  apply(s: Snapshot): void {
    this.time = s.time;
    this.winner = s.winner;
    this.snaps = s.teams;
    s.teams.forEach((t, i) => {
      const team = this.teams[i];
      team.gold = t.gold;
      team.statueHp = t.hp;
      team.statueMax = t.max;
      team.stance = STANCES[t.stance] ?? 'defend';
      team.queue = t.queue.map(([k, time]) => ({ kind: UNIT_ORDER[k], t: time }));
      team.kills = t.kills;
      team.centerMine = t.cm === 1;
      team.faction = FACTION_ORDER[t.f] ?? 'tribe';
      team.formation = FORMATIONS[t.fm] ?? 'free';
      team.holdX = t.hx ?? 0;
      if (t.ms?.length === 3) team.mineSplit = [t.ms[0], t.ms[1], t.ms[2]];
      team.wallPlan = t.wp ?? NaN;
      team.wallT = t.wt ?? 0;
    });

    const prev = new Map(this.units.map((u) => [u.id, u]));
    this.units = s.units.map((a) => {
      const [id, kind, team, x, lane, hp, maxHp, facing, flags, walk, attackT, deadT, mineT, hitFlash, rank] = a;
      const old = prev.get(id);
      const u: RemoteUnit = old ?? {
        id,
        team: team as Team,
        kind: UNIT_ORDER[kind],
        x,
        lane,
        hp,
        maxHp,
        facing: facing as 1 | -1,
        moving: false,
        walk,
        attackT: -1,
        cooldownT: 0,
        targetId: 0,
        hitDone: false,
        dying: false,
        deadT: 0,
        inside: false,
        hitFlash: 0,
        slot: 0,
        kills: 0,
        rank: 0,
        run: 0,
        blinkT: 0,
        engaged: false,
        hidden: false,
        revealT: 0,
        slowT: 0,
        poisonT: 0,
        poisonDps: 0,
        poisonBy: 0,
        calmT: 0,
        lifeT: 0,
        lastStruck: 0,
        buildSlot: -1,
        forge: 1,
        combat: false,
        toCenter: false,
        mine: 0,
        dashT: 0,
        dashX: x,
        mining: false,
        mineT: 0,
        carrying: 0,
        targetX: x,
      };
      u.targetX = x;
      u.lane = lane;
      u.hp = hp;
      u.maxHp = maxHp;
      u.facing = facing as 1 | -1;
      u.moving = (flags & FLAG.moving) !== 0;
      u.dying = (flags & FLAG.dying) !== 0;
      u.inside = (flags & FLAG.inside) !== 0;
      u.mining = (flags & FLAG.mining) !== 0;
      u.carrying = flags & FLAG.carrying ? 1 : 0;
      u.toCenter = (flags & FLAG.toCenter) !== 0;
      u.mine = u.toCenter ? 2 : flags & FLAG.gold ? 1 : 0;
      u.dashT = flags & FLAG.dashing ? 0.1 : 0;
      u.hidden = (flags & FLAG.hidden) !== 0;
      u.slowT = flags & FLAG.slowed ? 1 : 0;
      u.poisonT = flags & FLAG.poisoned ? 1 : 0;
      u.kind = UNIT_ORDER[kind];
      // Chỉ sửa pha bước chân khi lệch nhiều, tránh giật hình
      if (Math.abs(u.walk - walk) > 1.5) u.walk = walk;
      u.attackT = attackT;
      u.deadT = deadT;
      u.mineT = mineT;
      u.hitFlash = hitFlash;
      u.rank = rank ?? 0;
      return u;
    });

    this.projectiles = s.projectiles.map(([kind, team, x0, h0, x1, lane, t, duration, arc]) => ({
      team: team as Team,
      kind: PROJECTILES[kind] ?? 'arrow',
      x0,
      h0,
      x1,
      lane,
      t,
      duration,
      arc,
      damage: 0,
      splash: 0,
      targetId: 0,
      dtype: 'none',
      sourceId: 0,
      srcKind: null,
    }));
    this.drops = (s.drops ?? []).map(([id, x, lane, amount]) => ({ id, x, lane, amount, t: 0 }));
    this.events.push(...s.events);
  }

  /** Chạy tiếp hoạt ảnh giữa hai ảnh chụp. */
  advance(dt: number): void {
    const k = Math.min(1, dt * 12);
    for (const u of this.units) {
      u.x += (u.targetX - u.x) * k;
      const s = UNITS[u.kind as UnitKind];
      if (u.moving) u.walk += (dt * s.speed * 0.11) / s.scale;
      if (u.attackT >= 0) u.attackT += dt;
      if (u.dying) u.deadT += dt;
      if (u.mining) u.mineT += dt;
      u.hitFlash = Math.max(0, u.hitFlash - dt);
    }
    for (const p of this.projectiles) p.t = Math.min(p.duration, p.t + dt);
    this.projectiles = this.projectiles.filter((p) => p.t < p.duration);
  }

  drainEvents(): WorldEvent[] {
    const ev = this.events;
    this.events = [];
    return ev;
  }
}
