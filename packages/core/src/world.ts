import { FACTIONS, FACTION_COUNTER_MULT, type FactionId } from './factions';
import {
  MAX_QUEUE,
  MAX_TOWERS,
  POP_CAP,
  RANK_BONUS,
  RANK_KILLS,
  SINGLE_SHOTS,
  STATUE_MULT,
  UNITS,
  damageMult,
  isArch,
  kindOf,
  toFaction,
  type Arch,
  type Aura,
  type DamageType,
  type Formation,
  type ProjectileKind,
  type Stance,
  type Team,
  type UnitKind,
  type UnitStats,
} from './units';

export const WORLD_WIDTH = 3200;
export const STATUE_OFFSET = 170;
export const STATUE_HALF_WIDTH = 45;
export const MINE_OFFSETS = [300, 400];
const MINE_TIME = 2.2;
const MINE_YIELD = 25;
const PASSIVE_INCOME = 1.5;
const DEFEND_DISTANCE = 450;
const DEFEND_CHASE = 320;
const SIGHT = 460;
const GARRISON_HEAL = 12;
const CORPSE_TIME = 2.5;
const RECOVERY = 0.25;
export const STATUE_TARGET = -1;
export const LANE_DEPTH = 70; // độ sâu hàng quân, dùng cho cả vẽ và sát thương lan
const SPLASH_MAX = 6;
// Tượng tự bắn tên vào địch đến gần
const STATUE_RANGE = 480;
const STATUE_DAMAGE = 14;
const STATUE_COOLDOWN = 1.1;
// Mỏ vàng giữa bản đồ: giàu nhưng xa nhà, thợ mỏ phải đi qua chiến trường
export const CENTER_MINE_X = WORLD_WIDTH / 2;
const CENTER_MINE_TIME = 3;
const CENTER_MINE_YIELD = 100;
const CENTER_MINE_GAP = 45;
// Túi vàng rơi khi thợ mỏ chết: quân nào chạm vào trước thì phe đó nhặt được
const DROP_PICKUP = 24;
const DROP_LIFETIME = 40;
// Kỵ binh: quãng phi đủ để cú đâm đạt tối đa, và hệ số tối đa
const CHARGE_FULL = 360;
const CHARGE_MAX = 2.5;
// Ninja: lướt tới mục tiêu trong khoảng này, hồi chiêu
const BLINK_MIN = 70;
const BLINK_MAX = 340;
const BLINK_COOLDOWN = 7;
const ASSASSIN_SIGHT = 620;
const ASSASSIN_PRIORITY = 350; // ưu tiên hàng sau như thể gần hơn chừng này
const HEALER_SIGHT = 380;
// Tàng hình: lộ ra trong chừng này giây sau khi ra đòn / trúng đòn; địch đứng sát vẫn thấy
const REVEAL_TIME = 1.6;
const REVEAL_NEAR = 40;
// Hiệu ứng
const SLOW_FACTOR = 0.55;
const CALM_TIME = 4; // nội tại hồi máu của tộc: không bị đánh chừng này giây
const SUMMON_LIFE = 25;
const RAISE_RANGE = 260;
const MAX_SUMMONS = 8;
// Thợ xây: dựng tháp ở các vị trí cách tượng chừng này
const TOWER_SLOTS = [330, 480, 200];
const BUILD_TIME = 6;
// Đội hình: khoảng cách giữa các hàng và độ lệch trong hàng
const FORMATION_GAP: Record<Exclude<Formation, 'free'>, { row: number; slot: number }> = {
  line: { row: 55, slot: 30 },
  spread: { row: 95, slot: 85 },
};
/** Hàng trong đội hình: 0 = khiên trước, 1 = cận chiến, 2 = bắn xa, 3 = hỗ trợ / công thành. */
export const ROW: Record<Arch, number> = {
  spear: 0,
  giant: 0,
  tower: 0,
  sword: 1,
  ninja: 1,
  cavalry: 1,
  builder: 1,
  miner: 1,
  archer: 2,
  mage: 2,
  healer: 3,
  banner: 3,
  catapult: 3,
};

export type Rng = () => number;

export type Unit = {
  id: number;
  team: Team;
  kind: UnitKind;
  x: number;
  lane: number; // 0..1, độ sâu để vẽ
  hp: number;
  maxHp: number;
  facing: 1 | -1;
  moving: boolean;
  walk: number; // pha bước chân
  attackT: number; // -1 = không đánh
  cooldownT: number;
  targetId: number;
  hitDone: boolean;
  dying: boolean;
  deadT: number;
  inside: boolean; // đã rút vào tượng
  hitFlash: number;
  slot: number;
  kills: number;
  rank: number; // 0..3 sao kỳ cựu
  run: number; // kỵ binh: quãng đã phi
  blinkT: number; // ninja: hồi chiêu lướt
  engaged: boolean; // đang giao tranh (đội hình bỏ qua khi tính quân tụt lại)
  hidden: boolean; // đang tàng hình
  revealT: number;
  slowT: number;
  poisonT: number;
  poisonDps: number;
  poisonBy: Team;
  calmT: number; // số giây chưa bị đánh
  lifeT: number; // > 0: quân triệu hồi, hết giờ thì tan
  lastStruck: number; // mục tiêu của đòn trước (nhất kích)
  buildSlot: number;
  // thợ mỏ
  mine: number;
  mining: boolean;
  mineT: number;
  carrying: number;
  toCenter: boolean; // đang được phân đi mỏ giữa
};

export type Projectile = {
  team: Team;
  kind: ProjectileKind;
  x0: number;
  h0: number;
  x1: number;
  lane: number;
  t: number;
  duration: number;
  arc: number;
  damage: number;
  splash: number;
  targetId: number;
  dtype: DamageType;
  sourceId: number;
  srcKind: UnitKind | null; // để áp hiệu ứng (độc, chậm, hất) kể cả khi người bắn đã chết
};

/** Túi vàng rơi trên đất. */
export type Drop = { id: number; x: number; lane: number; amount: number; t: number };

export type WorldEvent =
  | { type: 'hit'; x: number; h: number; lane: number; big: boolean }
  | { type: 'death'; x: number; lane: number; team: Team; kind: UnitKind }
  | { type: 'shoot'; kind: ProjectileKind; x: number }
  | { type: 'heal'; x: number; lane: number; amount: number }
  | { type: 'blink'; x0: number; x: number; lane: number }
  | { type: 'promote'; x: number; lane: number; team: Team; rank: number }
  | { type: 'drop'; x: number; lane: number; amount: number }
  | { type: 'raise'; x: number; lane: number }
  | { type: 'built'; team: Team; x: number }
  | { type: 'explode'; x: number; lane: number; kind?: ProjectileKind }
  | { type: 'gold'; team: Team; x: number; amount: number }
  | { type: 'trained'; team: Team; kind: UnitKind }
  | { type: 'statueHit'; team: Team; x: number }
  | { type: 'swing'; x: number; kind: UnitKind };

export type TeamState = {
  faction: FactionId;
  gold: number;
  statueHp: number;
  statueMax: number;
  stance: Stance;
  formation: Formation;
  formX: number; // mũi đội hình khi tấn công (NaN = chưa lập)
  queue: { kind: UnitKind; t: number }[];
  incomeMult: number;
  unlocked: UnitKind[];
  kills: number;
  statueCooldown: number;
  centerMine: boolean;
};

export type TeamSetup = {
  faction?: FactionId;
  gold: number;
  statueHp: number;
  incomeMult?: number;
  /** Quân được xây: viết theo tên khung ('sword') sẽ tự đổi sang quân của tộc. */
  unlocked: UnitKind[];
  start?: UnitKind[];
};

/** Phần trạng thái mà renderer / HUD cần đọc; World cục bộ và bản sao từ server đều thoả. */
export type WorldView = {
  units: Unit[];
  projectiles: Projectile[];
  drops: Drop[];
  teams: [TeamState, TeamState];
  time: number;
  winner: Team | null;
};

export const dirOf = (team: Team): 1 | -1 => (team === 0 ? 1 : -1);
export const statueX = (team: Team) => (team === 0 ? STATUE_OFFSET : WORLD_WIDTH - STATUE_OFFSET);
export const mineX = (team: Team, i: number) => statueX(team) + dirOf(team) * MINE_OFFSETS[i];
export const defendX = (team: Team) => statueX(team) + dirOf(team) * DEFEND_DISTANCE;
export const towerX = (team: Team, slot: number) => statueX(team) + dirOf(team) * TOWER_SLOTS[slot];
/** Chỗ thợ mỏ của mỗi phe đứng đào ở mỏ giữa (mỗi phe một bên mỏ). */
export const centerMineX = (team: Team) => CENTER_MINE_X - dirOf(team) * CENTER_MINE_GAP;
const BACKLINE: Arch[] = ['archer', 'mage', 'healer', 'banner', 'catapult', 'miner'];
const other = (team: Team): Team => (team === 0 ? 1 : 0);
const arch = (u: Unit): Arch => UNITS[u.kind].arch;

export class World {
  units: Unit[] = [];
  projectiles: Projectile[] = [];
  drops: Drop[] = [];
  events: WorldEvent[] = [];
  teams: [TeamState, TeamState];
  time = 0;
  winner: Team | null = null;
  private nextId = 1;

  constructor(
    setups: [TeamSetup, TeamSetup],
    private rng: Rng = Math.random,
  ) {
    const init = (s: TeamSetup): TeamState => {
      const faction = s.faction ?? 'tribe';
      const hp = Math.round(s.statueHp * (FACTIONS[faction].statueMult ?? 1));
      return {
        faction,
        gold: s.gold,
        statueHp: hp,
        statueMax: hp,
        stance: 'defend',
        formation: 'free',
        formX: NaN,
        queue: [],
        incomeMult: s.incomeMult ?? 1,
        unlocked: toFaction(s.unlocked, faction),
        kills: 0,
        statueCooldown: 0,
        centerMine: false,
      };
    };
    this.teams = [init(setups[0]), init(setups[1])];
    setups.forEach((s, team) => s.start?.forEach((k) => this.spawn(team as Team, this.kindFor(team as Team, k))));
  }

  // ---------- Lệnh của người chơi / AI ----------

  /** Tên khung ('sword') đổi sang quân của tộc phe đó; mã quân đầy đủ giữ nguyên. */
  kindFor(team: Team, k: UnitKind): UnitKind {
    return isArch(k) ? kindOf(this.teams[team].faction, k) : k;
  }

  pop(team: Team): number {
    let n = 0;
    for (const u of this.units) if (u.team === team && !u.dying && u.lifeT <= 0) n += UNITS[u.kind].pop;
    for (const q of this.teams[team].queue) n += UNITS[q.kind].pop * (UNITS[q.kind].spawnCount ?? 1);
    return n;
  }

  canTrain(team: Team, kind: UnitKind): boolean {
    kind = this.kindFor(team, kind);
    const t = this.teams[team];
    const s = UNITS[kind];
    if (!s) return false;
    if (s.build && this.towerCount(team) >= MAX_TOWERS) return false;
    return (
      this.winner === null &&
      t.unlocked.includes(kind) &&
      t.gold >= s.cost &&
      t.queue.length < MAX_QUEUE &&
      this.pop(team) + s.pop * (s.spawnCount ?? 1) <= POP_CAP
    );
  }

  /** Số tháp + thợ xây (kể cả đang chờ xây): tối đa MAX_TOWERS. */
  towerCount(team: Team): number {
    let n = 0;
    for (const u of this.units) {
      if (u.team !== team || u.dying) continue;
      const a = arch(u);
      if (a === 'tower' || a === 'builder') n++;
    }
    for (const q of this.teams[team].queue) if (UNITS[q.kind].build) n++;
    return n;
  }

  train(team: Team, kind: UnitKind): boolean {
    kind = this.kindFor(team, kind);
    if (!this.canTrain(team, kind)) return false;
    this.teams[team].gold -= UNITS[kind].cost;
    this.teams[team].queue.push({ kind, t: 0 });
    return true;
  }

  setStance(team: Team, stance: Stance): void {
    const t = this.teams[team];
    if (stance === 'attack' && t.stance !== 'attack') t.formX = NaN;
    t.stance = stance;
  }

  setFormation(team: Team, formation: Formation): void {
    const t = this.teams[team];
    if (t.formation !== formation) t.formX = NaN;
    t.formation = formation;
  }

  /** Bật / tắt cho một nửa số thợ mỏ sang đào mỏ giữa bản đồ. */
  setCenterMine(team: Team, on: boolean): void {
    this.teams[team].centerMine = on;
  }

  count(team: Team, kind?: UnitKind, includeQueue = false): number {
    if (kind) kind = this.kindFor(team, kind);
    let n = 0;
    for (const u of this.units) if (u.team === team && !u.dying && (!kind || u.kind === kind)) n++;
    if (includeQueue) for (const q of this.teams[team].queue) if (!kind || q.kind === kind) n++;
    return n;
  }

  spawn(team: Team, kind: UnitKind, x = statueX(team) + dirOf(team) * 50): Unit {
    kind = this.kindFor(team, kind);
    const s = UNITS[kind];
    const minersOn = [0, 1].map((i) => this.units.filter((u) => u.team === team && arch(u) === 'miner' && !u.dying && u.mine === i).length);
    let buildSlot = -1;
    if (s.build || s.stationary) {
      const used = new Set(this.units.filter((u) => u.team === team && !u.dying && u.buildSlot >= 0).map((u) => u.buildSlot));
      buildSlot = TOWER_SLOTS.findIndex((_, i) => !used.has(i));
    }
    const u: Unit = {
      id: this.nextId++,
      team,
      kind,
      x,
      lane: 0.1 + this.rng() * 0.8,
      hp: s.hp,
      maxHp: s.hp,
      facing: dirOf(team),
      moving: false,
      walk: this.rng() * 10,
      attackT: -1,
      cooldownT: 0,
      targetId: 0,
      hitDone: false,
      dying: false,
      deadT: 0,
      inside: false,
      hitFlash: 0,
      slot: this.rng(),
      kills: 0,
      rank: 0,
      run: 0,
      blinkT: 0,
      engaged: false,
      hidden: !!s.stealth,
      revealT: 0,
      slowT: 0,
      poisonT: 0,
      poisonDps: 0,
      poisonBy: other(team),
      calmT: 0,
      lifeT: 0,
      lastStruck: 0,
      buildSlot,
      toCenter: false,
      mine: minersOn[0] <= minersOn[1] ? 0 : 1,
      mining: false,
      mineT: 0,
      carrying: 0,
    };
    this.units.push(u);
    return u;
  }

  // ---------- Mô phỏng ----------

  update(dt: number): void {
    if (this.winner !== null) return;
    this.time += dt;

    for (const team of [0, 1] as Team[]) {
      const t = this.teams[team];
      t.gold += PASSIVE_INCOME * t.incomeMult * dt;
      const q = t.queue[0];
      if (q) {
        q.t += dt;
        if (q.t >= UNITS[q.kind].trainTime) {
          t.queue.shift();
          const n = UNITS[q.kind].spawnCount ?? 1;
          for (let i = 0; i < n; i++) this.spawn(team, q.kind, statueX(team) + dirOf(team) * (50 + i * 14));
          this.events.push({ type: 'trained', team, kind: q.kind });
        }
      }
    }

    this.assignCenterMiners();
    for (const team of [0, 1] as Team[]) this.updateFormation(team, dt);
    for (const u of this.units) this.updateUnit(u, dt);
    for (const team of [0, 1] as Team[]) this.updateStatue(team, dt);
    this.updateProjectiles(dt);
    this.updateDrops(dt);
    this.units = this.units.filter((u) => !(u.dying && u.deadT > CORPSE_TIME));

    for (const team of [0, 1] as Team[]) {
      if (this.teams[team].statueHp <= 0) {
        this.teams[team].statueHp = 0;
        this.winner = other(team);
      }
    }
  }

  // ---------- Đội hình ----------

  /** Vị trí của quân trong đội hình (hàng theo loại quân, lệch trong hàng theo slot). */
  slotX(u: Unit, front: number): number {
    const t = this.teams[u.team];
    const gap = FORMATION_GAP[t.formation === 'spread' ? 'spread' : 'line'];
    return front - dirOf(u.team) * (ROW[arch(u)] * gap.row + u.slot * gap.slot);
  }

  private inFormation(u: Unit): boolean {
    const a = arch(u);
    return !u.dying && !u.inside && a !== 'miner' && a !== 'builder' && a !== 'tower';
  }

  /** Mũi đội hình chỉ tiến lên theo tốc độ quân chậm nhất, và đứng chờ khi có quân tụt lại. */
  private updateFormation(team: Team, dt: number): void {
    const t = this.teams[team];
    if (t.stance !== 'attack' || t.formation === 'free') {
      t.formX = NaN;
      return;
    }
    const dir = dirOf(team);
    const members = this.units.filter((u) => u.team === team && this.inFormation(u));
    if (!members.length) return;
    if (Number.isNaN(t.formX)) {
      // Lập đội hình quanh quân đứng trước nhất
      t.formX = members.reduce((best, u) => ((u.x - best) * dir > 0 ? u.x : best), members[0].x);
    }
    let slowest = Infinity;
    let behind = 0;
    for (const u of members) {
      if (u.engaged) continue;
      slowest = Math.min(slowest, this.speedOf(u));
      behind = Math.max(behind, (this.slotX(u, t.formX) - u.x) * dir);
    }
    const cap = statueX(other(team)) - dir * 30;
    if (slowest < Infinity && behind < 50) t.formX += dir * slowest * dt;
    if ((t.formX - cap) * dir > 0) t.formX = cap;
  }

  private formationReady(team: Team): boolean {
    const t = this.teams[team];
    if (t.formation === 'free' || Number.isNaN(t.formX)) return false;
    const cap = statueX(other(team)) - dirOf(team) * 30;
    return Math.abs(t.formX - cap) > 1;
  }

  // ---------- Từng quân ----------

  private updateUnit(u: Unit, dt: number): void {
    u.hitFlash = Math.max(0, u.hitFlash - dt);
    if (u.dying) {
      u.deadT += dt;
      return;
    }
    const s = UNITS[u.kind];
    const team = this.teams[u.team];
    const dir = dirOf(u.team);
    // Kỵ binh đứng yên thì mất đà phi
    if (!u.moving && u.attackT < 0) u.run = Math.max(0, u.run - 400 * dt);
    u.cooldownT -= dt;
    u.blinkT -= dt;
    u.revealT -= dt;
    u.slowT -= dt;
    u.calmT += dt;
    u.hidden = !!s.stealth && u.revealT <= 0 && u.attackT < 0;
    u.moving = false;
    u.mining = false;
    u.engaged = false;

    if (this.tickEffects(u, s, dt)) return;

    if (s.stationary) {
      this.updateTower(u, s, dt);
      return;
    }

    if (u.inside) {
      if (team.stance === 'garrison') {
        u.hp = Math.min(u.maxHp, u.hp + GARRISON_HEAL * dt);
        return;
      }
      u.inside = false;
    }

    // Đang trong động tác đánh: đứng yên cho tới hết đòn
    if (u.attackT >= 0) {
      u.engaged = true;
      u.attackT += dt;
      if (!u.hitDone && u.attackT >= s.windup) {
        u.hitDone = true;
        this.resolveAttack(u);
      }
      if (u.attackT >= s.windup + RECOVERY) u.attackT = -1;
      return;
    }

    if (team.stance === 'garrison' && u.lifeT <= 0) {
      if (this.moveTo(u, statueX(u.team), dt, 6)) u.inside = true;
      return;
    }

    switch (s.arch) {
      case 'miner':
        this.updateMiner(u, dt);
        return;
      case 'builder':
        this.updateBuilder(u, s, dt);
        return;
      case 'healer':
      case 'banner':
        this.updateSupport(u, s, dt);
        return;
    }

    const ex = statueX(other(u.team));
    const statueReach = s.range + STATUE_HALF_WIDTH;
    // Máy công thành: tượng địch trong tầm thì ưu tiên phá tượng
    if (s.dmgType === 'siege' && team.stance === 'attack' && Math.abs(ex - u.x) <= statueReach) {
      u.engaged = true;
      this.engage(u, ex, STATUE_TARGET, statueReach, dt);
      return;
    }

    const target = s.siegeOnly ? null : this.findTarget(u);
    if (target) {
      u.engaged = true;
      if (s.blink) this.tryBlink(u, target);
      this.engage(u, target.x, target.id, s.range, dt);
      return;
    }

    // Máy bắn xa bị áp sát: lùi lại cho đủ tầm
    if (s.minRange && this.nearestEnemy(u, s.minRange)) {
      this.moveTo(u, u.x - dir * 80, dt, 1);
      return;
    }

    if (team.stance === 'attack') {
      if (Math.abs(ex - u.x) <= statueReach) u.engaged = true;
      if (!u.engaged && this.formationReady(u.team)) {
        if (this.moveTo(u, this.slotX(u, team.formX), dt, 4)) u.facing = dir;
        return;
      }
      this.engage(u, ex, STATUE_TARGET, statueReach, dt);
      return;
    }

    this.holdLine(u, dt);
  }

  /** Độc, hồi máu, quân triệu hồi hết giờ. Trả về true nếu quân vừa chết. */
  private tickEffects(u: Unit, s: UnitStats, dt: number): boolean {
    if (u.lifeT > 0) {
      u.lifeT -= dt;
      if (u.lifeT <= 0) {
        this.kill(u, other(u.team), undefined, false);
        return true;
      }
    }
    if (u.poisonT > 0) {
      u.poisonT -= dt;
      u.hp -= u.poisonDps * dt;
      if (u.hp <= 0) {
        this.kill(u, u.poisonBy);
        return true;
      }
    }
    const regen = (s.regen ?? 0) + (u.calmT >= CALM_TIME ? (FACTIONS[s.faction].regen ?? 0) : 0);
    if (regen > 0 && u.hp < u.maxHp) u.hp = Math.min(u.maxHp, u.hp + regen * dt);
    return false;
  }

  /** Phòng thủ: về vị trí trong hàng (đội hình hàng lối / tản rộng xếp theo hàng). */
  private holdLine(u: Unit, dt: number): void {
    const s = UNITS[u.kind];
    const dir = dirOf(u.team);
    const t = this.teams[u.team];
    let x: number;
    if (t.formation === 'free') {
      const back = (s.backline ? 110 + u.slot * 110 : u.slot * 110) + (s.minRange ? 120 : 0);
      x = defendX(u.team) - dir * back;
    } else {
      x = this.slotX(u, defendX(u.team) + dir * 40);
    }
    if (this.moveTo(u, x, dt, 4)) u.facing = dir;
  }

  /** Thầy thuốc / thầy chiêu hồn / cờ hiệu: tìm quân bị thương để hồi, không thì đi theo tiền tuyến. */
  private updateSupport(u: Unit, s: UnitStats, dt: number): void {
    if (s.heal) {
      let best: Unit | null = null;
      let low = 0.97;
      for (const a of this.units) {
        if (a.team !== u.team || a.dying || a.inside || arch(a) === 'miner' || arch(a) === 'tower') continue;
        if (Math.abs(a.x - u.x) > HEALER_SIGHT) continue;
        const r = a.hp / a.maxHp;
        if (r < low) {
          low = r;
          best = a;
        }
      }
      if (best) {
        this.engage(u, best.x, best.id, s.range, dt);
        return;
      }
    }
    const team = this.teams[u.team];
    const dir = dirOf(u.team);
    if (team.stance === 'attack') {
      if (this.formationReady(u.team)) {
        if (this.moveTo(u, this.slotX(u, team.formX), dt, 4)) u.facing = dir;
        return;
      }
      let front: Unit | null = null;
      for (const a of this.units) {
        if (a.team !== u.team || a.dying || a.inside) continue;
        const aa = arch(a);
        if (aa === 'miner' || aa === 'healer' || aa === 'banner' || aa === 'tower' || aa === 'builder') continue;
        if (!front || (a.x - front.x) * dir > 0) front = a;
      }
      if (front) {
        // Cờ hiệu đứng sát tiền tuyến hơn để hào quang phủ được nhiều quân
        const back = s.aura ? 50 + u.slot * 50 : 90 + u.slot * 60;
        if (this.moveTo(u, front.x - dir * back, dt, 6)) u.facing = dir;
        return;
      }
    }
    this.holdLine(u, dt);
  }

  private updateBuilder(u: Unit, s: UnitStats, dt: number): void {
    if (u.buildSlot < 0 || !s.build) {
      this.holdLine(u, dt);
      return;
    }
    if (this.moveTo(u, towerX(u.team, u.buildSlot), dt, 4)) {
      u.mining = true;
      u.facing = dirOf(u.team);
      u.mineT += dt;
      if (u.mineT >= BUILD_TIME) {
        const t = UNITS[s.build];
        u.kind = s.build;
        u.hp = u.maxHp = t.hp;
        u.mineT = 0;
        u.hidden = false;
        this.events.push({ type: 'built', team: u.team, x: u.x });
      }
    }
  }

  private updateTower(u: Unit, s: UnitStats, dt: number): void {
    u.inside = false;
    if (u.attackT >= 0) {
      u.attackT += dt;
      if (!u.hitDone && u.attackT >= s.windup) {
        u.hitDone = true;
        this.resolveAttack(u);
      }
      if (u.attackT >= s.windup + RECOVERY) u.attackT = -1;
      return;
    }
    const target = this.findTarget(u);
    if (target && Math.abs(target.x - u.x) <= s.range) this.engage(u, target.x, target.id, s.range, dt);
  }

  private tryBlink(u: Unit, target: Unit): void {
    const d = Math.abs(target.x - u.x);
    if (u.blinkT > 0 || d < BLINK_MIN || d > BLINK_MAX) return;
    const x0 = u.x;
    const side = Math.sign(target.x - u.x);
    u.x = target.x - side * 18;
    u.facing = side >= 0 ? 1 : -1;
    u.blinkT = BLINK_COOLDOWN;
    u.cooldownT = Math.min(u.cooldownT, 0.1);
    this.events.push({ type: 'blink', x0, x: u.x, lane: u.lane });
  }

  /** Quân tàng hình: chỉ thấy khi nó vừa ra đòn / trúng đòn, hoặc đứng sát. */
  private canSee(e: Unit, fromX: number): boolean {
    return !e.hidden || Math.abs(e.x - fromX) <= REVEAL_NEAR;
  }

  private nearestEnemy(u: Unit, within: number): Unit | null {
    let best: Unit | null = null;
    for (const e of this.units) {
      if (e.team === u.team || e.dying || e.inside || !this.canSee(e, u.x)) continue;
      const d = Math.abs(e.x - u.x);
      if (d <= within && (!best || d < Math.abs(best.x - u.x))) best = e;
    }
    return best;
  }

  /** Bật mỏ giữa: cứ 2 thợ mỏ (theo thứ tự xây) thì 1 người sang mỏ giữa. */
  private assignCenterMiners(): void {
    for (const team of [0, 1] as Team[]) {
      const on = this.teams[team].centerMine;
      let i = 0;
      for (const u of this.units) {
        if (u.team !== team || arch(u) !== 'miner' || u.dying) continue;
        u.toCenter = on && i++ % 2 === 1;
      }
    }
  }

  private updateDrops(dt: number): void {
    for (const d of this.drops) {
      d.t += dt;
      let best: Unit | null = null;
      for (const u of this.units) {
        if (u.dying || u.inside || UNITS[u.kind].stationary) continue;
        const dist = Math.abs(u.x - d.x);
        if (dist <= DROP_PICKUP && (!best || dist < Math.abs(best.x - d.x))) best = u;
      }
      if (best) {
        this.teams[best.team].gold += d.amount;
        this.events.push({ type: 'gold', team: best.team, x: d.x, amount: d.amount });
        d.t = Infinity;
      }
    }
    this.drops = this.drops.filter((d) => d.t < DROP_LIFETIME);
  }

  private updateStatue(team: Team, dt: number): void {
    const t = this.teams[team];
    t.statueCooldown -= dt;
    if (t.statueCooldown > 0) return;
    const sx = statueX(team);
    let target: Unit | null = null;
    for (const e of this.units) {
      if (e.team === team || e.dying || e.inside || !this.canSee(e, sx)) continue;
      const d = Math.abs(e.x - sx);
      if (d <= STATUE_RANGE && (!target || d < Math.abs(target.x - sx))) target = e;
    }
    if (!target) return;
    t.statueCooldown = STATUE_COOLDOWN;
    const dist = Math.abs(target.x - sx);
    const duration = 0.3 + dist / 800;
    const lead = target.moving ? target.facing * this.speedOf(target) * duration : 0;
    this.projectiles.push({
      team,
      kind: 'arrow',
      x0: sx,
      h0: -150,
      x1: target.x + lead,
      lane: target.lane,
      t: 0,
      duration,
      arc: dist * 0.1,
      damage: STATUE_DAMAGE,
      splash: 0,
      targetId: target.id,
      dtype: 'none',
      sourceId: 0,
      srcKind: null,
    });
    this.events.push({ type: 'shoot', kind: 'arrow', x: sx });
  }

  private updateMiner(u: Unit, dt: number): void {
    const s = UNITS[u.kind];
    const home = statueX(u.team) + dirOf(u.team) * 30;
    if (u.carrying > 0) {
      if (this.moveTo(u, home, dt, 8)) {
        this.teams[u.team].gold += u.carrying;
        this.events.push({ type: 'gold', team: u.team, x: u.x, amount: u.carrying });
        u.carrying = 0;
      }
      return;
    }
    const center = u.toCenter;
    const spot = center ? centerMineX(u.team) : mineX(u.team, u.mine);
    const mx = spot + (u.slot - 0.5) * (center ? 24 : 40);
    if (this.moveTo(u, mx, dt, 6)) {
      u.mining = true;
      u.facing = (center ? CENTER_MINE_X : spot) > u.x ? 1 : -1;
      u.mineT += dt;
      const speed = (s.mineTime ?? MINE_TIME) / MINE_TIME;
      if (u.mineT >= (center ? CENTER_MINE_TIME : MINE_TIME) * speed) {
        u.mineT = 0;
        const t = this.teams[u.team];
        const mult = t.incomeMult * (FACTIONS[t.faction].mineMult ?? 1);
        u.carrying = Math.round((center ? CENTER_MINE_YIELD : MINE_YIELD) * mult);
      }
    }
  }

  private speedOf(u: Unit): number {
    return UNITS[u.kind].speed * (u.slowT > 0 ? SLOW_FACTOR : 1);
  }

  /** Đi tới x; trả về true khi đã tới nơi. */
  private moveTo(u: Unit, x: number, dt: number, tolerance: number): boolean {
    const dx = x - u.x;
    if (Math.abs(dx) <= tolerance) return true;
    const s = UNITS[u.kind];
    const speed = this.speedOf(u);
    if (speed <= 0) return false;
    u.facing = dx > 0 ? 1 : -1;
    const moved = Math.min(speed * dt, Math.abs(dx));
    u.x += Math.sign(dx) * moved;
    u.run += moved;
    u.moving = true;
    u.walk += (dt * speed * 0.11) / s.scale;
    return false;
  }

  /** Hào quang cờ hiệu mạnh nhất phủ tới x. */
  private auraAt(team: Team, x: number): Aura | null {
    let best: Aura | null = null;
    for (const b of this.units) {
      if (b.team !== team || b.dying || b.inside) continue;
      const a = UNITS[b.kind].aura;
      if (a && Math.abs(b.x - x) <= a.radius && (!best || a.dmg + a.haste > best.dmg + best.haste)) best = a;
    }
    return best;
  }

  private engage(u: Unit, tx: number, targetId: number, reach: number, dt: number): void {
    const dx = tx - u.x;
    if (Math.abs(dx) > reach) {
      this.moveTo(u, tx - Math.sign(dx) * reach * (0.55 + u.slot * 0.4), dt, 1);
      return;
    }
    u.facing = dx >= 0 ? 1 : -1;
    if (u.cooldownT <= 0) {
      const aura = this.auraAt(u.team, u.x);
      u.attackT = 0;
      u.hitDone = false;
      u.targetId = targetId;
      u.cooldownT = UNITS[u.kind].cooldown * (1 - (aura?.haste ?? 0));
      u.revealT = REVEAL_TIME;
      u.hidden = false;
      this.events.push({ type: 'swing', x: u.x, kind: u.kind });
    }
  }

  private findTarget(u: Unit): Unit | null {
    const s = UNITS[u.kind];
    const assassin = !!s.blink || !!s.stealth;
    const sight = s.stationary ? s.range : assassin ? ASSASSIN_SIGHT : Math.max(SIGHT, s.range + 60);
    const stance = this.teams[u.team].stance;
    const dx0 = defendX(u.team);
    const dir = dirOf(u.team);
    let best: Unit | null = null;
    let bestD = Infinity;
    for (const e of this.units) {
      if (e.team === u.team || e.dying || e.inside || !this.canSee(e, u.x)) continue;
      const dist = Math.abs(e.x - u.x);
      if (dist > sight) continue;
      if (s.minRange && dist < s.minRange) continue;
      if (!s.stationary && stance === 'defend' && (e.x - dx0) * dir > DEFEND_CHASE) continue;
      const d = assassin && BACKLINE.includes(arch(e)) ? dist - ASSASSIN_PRIORITY : dist;
      if (d < bestD) {
        bestD = d;
        best = e;
      }
    }
    return best;
  }

  private resolveAttack(u: Unit): void {
    const s = UNITS[u.kind];
    const fd = FACTIONS[s.faction];
    const enemy = other(u.team);
    const target = u.targetId === STATUE_TARGET ? null : this.units.find((e) => e.id === u.targetId);
    const tx = target ? target.x : statueX(enemy);
    const bonus = 1 + RANK_BONUS * u.rank;

    if (s.heal) {
      if (target && target.team === u.team && !target.dying && !target.inside && Math.abs(target.x - u.x) <= s.range * 1.4 + 10) {
        const group = s.healAoe
          ? this.units.filter(
              (a) => a.team === u.team && !a.dying && !a.inside && arch(a) !== 'tower' && Math.abs(a.x - target.x) <= s.healAoe!,
            )
          : [target];
        for (const a of group) {
          const amount = Math.min(a.maxHp - a.hp, s.heal * bonus);
          a.hp += amount;
          if (amount > 0) this.events.push({ type: 'heal', x: a.x, lane: a.lane, amount: Math.round(amount) });
        }
      }
      return;
    }

    let damage = s.damage * bonus;
    const aura = this.auraAt(u.team, u.x);
    if (aura) damage *= 1 + aura.dmg;
    const rage = (fd.rage ?? 0) + (s.rage ?? 0);
    if (rage) damage *= 1 + rage * (1 - u.hp / u.maxHp);
    // Nhất kích: chỉ đòn cận chiến đơn mục tiêu (đòn nổ / bắn xa đổi mục tiêu liên tục sẽ quá mạnh)
    if (fd.firstStrike && !s.splash && !s.projectile && u.targetId !== u.lastStruck) damage *= fd.firstStrike;
    u.lastStruck = u.targetId;
    let charged = 1;
    if (s.charge) {
      charged = 1 + (Math.min(u.run, CHARGE_FULL) / CHARGE_FULL) * (CHARGE_MAX - 1);
      damage *= charged;
      u.run = 0;
    }

    if (s.kamikaze) {
      this.splash(u.team, u.x + u.facing * 10, u.lane, s.splash ?? 60, damage, s.dmgType, u, s);
      this.events.push({ type: 'explode', x: u.x, lane: u.lane });
      this.kill(u, enemy, undefined, false);
      return;
    }

    if (s.projectile) {
      const dist = Math.abs(tx - u.x);
      const p = s.projectile;
      const fast = p === 'bullet';
      const heavy = p === 'boulder' || p === 'cannonball';
      const duration = fast
        ? 0.12 + dist / 2200
        : SINGLE_SHOTS.includes(p)
          ? 0.35 + dist / 750
          : heavy
            ? 0.6 + dist / 520
            : 0.4 + dist / 500;
      // Đón đầu mục tiêu đang chạy
      const lead = target?.moving ? target.facing * this.speedOf(target) * duration : 0;
      this.projectiles.push({
        team: u.team,
        kind: p,
        x0: u.x + u.facing * 12 * s.scale,
        h0: (s.stationary ? -70 : -38) * s.scale,
        x1: tx + lead + (target ? (this.rng() - 0.5) * 16 : 0),
        lane: target ? target.lane : 0.5,
        t: 0,
        duration,
        arc: dist * (fast ? 0.01 : SINGLE_SHOTS.includes(p) ? 0.22 : heavy ? 0.3 : 0.12),
        damage,
        splash: s.splash ?? 0,
        targetId: u.targetId,
        dtype: s.dmgType,
        sourceId: u.id,
        srcKind: u.kind,
      });
      this.events.push({ type: 'shoot', kind: p, x: u.x });
      return;
    }

    if (s.splash || (s.chargeSplash && charged > 1.6)) {
      const hitX = u.x + u.facing * s.range * 0.7;
      this.splash(u.team, hitX, u.lane, s.splash ?? s.chargeSplash!, damage, s.dmgType, u, s, u.facing * 14);
      this.events.push({ type: 'explode', x: hitX, lane: u.lane });
      return;
    }

    if (u.targetId === STATUE_TARGET) {
      this.damageStatue(enemy, damage, s.dmgType);
    } else if (target && !target.dying && !target.inside && Math.abs(target.x - u.x) <= s.range * 1.4 + 10) {
      this.damageUnit(target, damage, u.team, s.dmgType, u, s);
    }
  }

  private splash(
    team: Team,
    x: number,
    lane: number,
    radius: number,
    damage: number,
    dtype: DamageType,
    src: Unit | undefined,
    fx: UnitStats | undefined,
    push = 0,
  ): void {
    if (fx?.knock) push = dirOf(team) * fx.knock;
    // Khoảng cách tính cả chiều sâu hàng quân; mỗi đòn trúng tối đa SPLASH_MAX mục tiêu gần nhất
    const hits = this.units
      .filter((e) => e.team !== team && !e.dying && !e.inside)
      .map((e) => ({ e, d: Math.hypot(e.x - x, (e.lane - lane) * LANE_DEPTH) }))
      .filter((h) => h.d <= radius)
      .sort((a, b) => a.d - b.d)
      .slice(0, SPLASH_MAX);
    for (const { e } of hits) {
      this.damageUnit(e, damage, team, dtype, src, fx);
      const a = arch(e);
      if (UNITS[e.kind].stationary || a === 'catapult') continue;
      e.x += push * (a === 'giant' ? 0.2 : 1);
    }
    const enemy = other(team);
    if (Math.abs(statueX(enemy) - x) <= radius + STATUE_HALF_WIDTH) this.damageStatue(enemy, damage, dtype);
  }

  private updateProjectiles(dt: number): void {
    for (const p of this.projectiles) {
      p.t += dt;
      if (p.t < p.duration) continue;
      const enemy = other(p.team);
      const src = p.sourceId ? this.units.find((x) => x.id === p.sourceId) : undefined;
      const fx = p.srcKind ? UNITS[p.srcKind] : undefined;
      if (!SINGLE_SHOTS.includes(p.kind)) {
        this.splash(p.team, p.x1, p.lane, p.splash, p.damage, p.dtype, src, fx);
        this.events.push({ type: 'explode', x: p.x1, lane: p.lane, kind: p.kind });
        continue;
      }
      if (p.targetId === STATUE_TARGET) {
        this.damageStatue(enemy, p.damage, p.dtype);
        continue;
      }
      // Mũi tên: trúng mục tiêu nếu còn ở gần, không thì trúng kẻ gần chỗ rơi nhất
      let hit: Unit | null = null;
      let bestD = 26;
      for (const e of this.units) {
        if (e.team === p.team || e.dying || e.inside) continue;
        const d = Math.abs(e.x - p.x1) - (e.id === p.targetId ? 10 : 0);
        if (d < bestD) {
          bestD = d;
          hit = e;
        }
      }
      if (hit) this.damageUnit(hit, p.damage, p.team, p.dtype, src, fx);
      else if (Math.abs(statueX(enemy) - p.x1) <= STATUE_HALF_WIDTH) this.damageStatue(enemy, p.damage, p.dtype);
    }
    this.projectiles = this.projectiles.filter((p) => p.t < p.duration);
  }

  private damageUnit(u: Unit, damage: number, by: Team, dtype: DamageType = 'none', src?: Unit, fx?: UnitStats): void {
    const s = UNITS[u.kind];
    let dealt = damage * damageMult(dtype, s.armorType) * (1 - (s.armor ?? 0));
    if (FACTIONS[this.teams[by].faction].counters.includes(this.teams[u.team].faction)) dealt *= FACTION_COUNTER_MULT;
    u.hp -= dealt;
    u.hitFlash = 0.15;
    u.calmT = 0;
    if (s.stealth) u.revealT = REVEAL_TIME;
    if (fx?.slow) u.slowT = Math.max(u.slowT, fx.slow);
    if (fx?.poison) {
      u.poisonT = fx.poison.dur;
      u.poisonDps = fx.poison.dps;
      u.poisonBy = by;
    }
    if (fx?.lifesteal && src && !src.dying) src.hp = Math.min(src.maxHp, src.hp + dealt * fx.lifesteal);
    this.events.push({ type: 'hit', x: u.x, h: -30 * s.scale, lane: u.lane, big: dealt >= 50 });
    if (u.hp <= 0) this.kill(u, by, src);
  }

  /** Quân chết: rơi vàng, tính mạng cho phe giết, tiền hồn, thầy chiêu hồn gọi xác dậy. */
  private kill(u: Unit, by: Team, src?: Unit, credit = true): void {
    if (u.dying) return;
    u.hp = 0;
    u.dying = true;
    u.deadT = 0;
    u.attackT = -1;
    u.poisonT = 0;
    if (u.carrying > 0) {
      this.drops.push({ id: this.nextId++, x: u.x, lane: u.lane, amount: u.carrying, t: 0 });
      this.events.push({ type: 'drop', x: u.x, lane: u.lane, amount: u.carrying });
    }
    u.carrying = 0;
    this.events.push({ type: 'death', x: u.x, lane: u.lane, team: u.team, kind: u.kind });
    if (!credit) return;
    this.teams[by].kills++;
    const bounty = FACTIONS[this.teams[by].faction].bounty;
    if (bounty && u.lifeT <= 0) this.teams[by].gold += UNITS[u.kind].cost * bounty;
    if (src && !src.dying && src.team === by) this.addKill(src);
    if (u.lifeT <= 0) this.tryRaise(u);
  }

  private tryRaise(corpse: Unit): void {
    for (const n of this.units) {
      const s = UNITS[n.kind];
      if (!s.raise || n.dying || n.inside || n.cooldownT > 0) continue;
      if (Math.abs(n.x - corpse.x) > RAISE_RANGE) continue;
      if (this.units.filter((x) => x.team === n.team && x.lifeT > 0 && !x.dying).length >= MAX_SUMMONS) continue;
      const z = this.spawn(n.team, s.raise, corpse.x);
      z.lane = corpse.lane;
      z.lifeT = SUMMON_LIFE;
      n.cooldownT = s.cooldown;
      n.attackT = 0;
      n.hitDone = true;
      this.events.push({ type: 'raise', x: corpse.x, lane: corpse.lane });
      return;
    }
  }

  /** Quân kỳ cựu: đủ mạng thì lên sao, tăng máu tối đa (hồi luôn phần tăng thêm). */
  private addKill(u: Unit): void {
    u.kills++;
    const need = FACTIONS[UNITS[u.kind].faction].rankKills ?? RANK_KILLS;
    if (u.rank >= need.length || u.kills < need[u.rank]) return;
    u.rank++;
    const max = UNITS[u.kind].hp * (1 + RANK_BONUS * u.rank);
    u.hp += max - u.maxHp;
    u.maxHp = max;
    this.events.push({ type: 'promote', x: u.x, lane: u.lane, team: u.team, rank: u.rank });
  }

  private damageStatue(team: Team, damage: number, dtype: DamageType = 'none'): void {
    this.teams[team].statueHp -= damage * (STATUE_MULT[dtype] ?? 1);
    this.events.push({ type: 'statueHit', team, x: statueX(team) });
  }

  /** Lấy và xoá các sự kiện đã phát sinh (cho renderer / âm thanh). */
  drainEvents(): WorldEvent[] {
    const ev = this.events;
    this.events = [];
    return ev;
  }
}
