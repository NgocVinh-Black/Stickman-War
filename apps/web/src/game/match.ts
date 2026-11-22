import {
  ARCH_ORDER,
  EnemyAI,
  FACTION_ORDER,
  LEVELS,
  MAX_QUEUE,
  UNITS,
  World,
  canTrainSnap,
  roster,
  wallBlockOf,
  type ClientMsg,
  type FactionId,
  type Formation,
  type MineSplit,
  type Stance,
  type UnitKind,
  type WallBlock,
  type WorldEvent,
  type WorldView,
} from '@stickman-war/core';
import { t as tr } from '@stickman-war/i18n';
import type { RemoteWorld } from '../net/remote';

const STEP = 1 / 60;

/** Một trận đấu: cục bộ (chiến dịch / đấu máy / nền sảnh) hoặc online. HUD và renderer chỉ làm việc qua giao diện này. */
export type Match = {
  view: WorldView;
  step: (dt: number) => WorldEvent[];
  /** Xây quân; thợ xây kèm ô đền đã chọn (không có thì lấy ô trống đầu tiên). */
  train: (kind: UnitKind, slot?: number) => boolean;
  setStance: (s: Stance) => void;
  setHold: (x: number) => void;
  setCenterMine: (on: boolean) => void;
  setMineSplit: (split: MineSplit) => void;
  setFormation: (f: Formation) => void;
  canTrain: (kind: UnitKind) => boolean;
  whyNot: (kind: UnitKind) => string;
  /** Đặt xây tường thành ở x (một thợ mỏ đi ra dựng) và lý do không xây được ở x (null = được). */
  orderWall: (x: number) => boolean;
  /** Tung chiêu tượng thần tại x (thanh nộ phải đầy). */
  unleash: (x: number) => boolean;
  wallBlock: (x: number) => WallBlock | null;
  pop: () => number;
  unlocked: UnitKind[];
};

/** Trận chạy ngay trong trình duyệt, bước cố định 1/60 giây. */
export function localMatch(world: World, ais: EnemyAI[]): Match {
  let acc = 0;
  return {
    view: world,
    step(dt) {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n++ < 24) {
        for (const ai of ais) ai.update(world, STEP);
        world.update(STEP);
        acc -= STEP;
      }
      return world.drainEvents();
    },
    train: (k, slot) => world.train(0, k, slot),
    setStance: (s) => world.setStance(0, s),
    setHold: (x) => world.setHold(0, x),
    orderWall: (x) => world.orderWall(0, x),
    unleash: (x) => world.unleash(0, x),
    wallBlock: (x) => world.wallBlock(0, x),
    setCenterMine: (on) => world.setCenterMine(0, on),
    setMineSplit: (split) => world.setMineSplit(0, split),
    setFormation: (f) => world.setFormation(0, f),
    canTrain: (k) => world.canTrain(0, k),
    whyNot: (k) => {
      const t = world.teams[0];
      if (!t.unlocked.includes(k)) return tr('game.whyNot.locked');
      if (t.gold < UNITS[k].cost) return tr('game.whyNot.gold');
      if (t.queue.length >= MAX_QUEUE) return tr('game.whyNot.queue');
      return tr('game.whyNot.pop');
    },
    pop: () => world.pop(0),
    unlocked: world.teams[0].unlocked,
  };
}

/**
 * Nền sảnh: hai phe do AI điều khiển đánh nhau, tượng không bao giờ vỡ.
 * Bên trái là nền văn minh người chơi đang chọn, bên phải một nền văn minh khác (ngẫu nhiên nếu không truyền),
 * nên bản đồ chia đôi phong cảnh hai bên như trong trận thật.
 */
export function demoMatch(mine?: FactionId, enemy?: FactionId): Match {
  const lv = LEVELS[6];
  const setup = (faction: FactionId) => ({
    faction,
    gold: 800,
    statueHp: 999999,
    incomeMult: 1.2,
    unlocked: ARCH_ORDER,
    start: ['miner', 'miner', 'miner', 'sword', 'archer', 'spear'] as UnitKind[],
  });
  const pick = (list: FactionId[]) => list[Math.floor(Math.random() * list.length)];
  const a = mine && FACTION_ORDER.includes(mine) ? mine : pick(FACTION_ORDER);
  const b = enemy && enemy !== a && FACTION_ORDER.includes(enemy) ? enemy : pick(FACTION_ORDER.filter((f) => f !== a));
  const world = new World([setup(a), setup(b)]);
  // Hai phe đều xây tường thành sớm để nền sảnh có cảnh phá tường
  const wall = { at: 20, dist: 460 };
  return localMatch(world, [
    new EnemyAI({ ...lv.ai, forceAttackAt: 60, wall, edge: 1.15 }, 0),
    new EnemyAI({ ...lv.ai, forceAttackAt: 75, wall, edge: 1.15 }, 1),
  ]);
}

/** Trận online do máy chủ chạy: chỉ gửi lệnh, vẽ lại ảnh chụp trạng thái. */
export function onlineMatch(
  remote: RemoteWorld,
  send: (m: ClientMsg) => void,
  faction: FactionId,
  state: { started: () => boolean; ended: () => boolean },
): Match {
  const match: Match = {
    view: remote,
    step: (dt) => {
      remote.advance(dt);
      return remote.drainEvents();
    },
    train: (k, slot) => {
      if (!match.canTrain(k)) return false;
      send(slot === undefined ? { t: 'train', kind: k } : { t: 'train', kind: k, slot });
      return true;
    },
    setStance: (stance) => send({ t: 'stance', stance }),
    setHold: (x) => send({ t: 'hold', x }),
    orderWall: (x) => {
      if (match.wallBlock(x) !== null) return false;
      send({ t: 'wall', x });
      return true;
    },
    wallBlock: (x) => (state.started() && !state.ended() ? wallBlockOf(remote, 0, x) : 'over'),
    unleash: (x) => {
      if (!state.started() || state.ended() || remote.teams[0].ult < 1) return false;
      send({ t: 'ult', x });
      return true;
    },
    setCenterMine: (on) => send({ t: 'centerMine', on }),
    setMineSplit: (split) => send({ t: 'mineSplit', split }),
    setFormation: (mode) => send({ t: 'formation', mode }),
    canTrain: (k) => !!remote.snaps && state.started() && canTrainSnap(remote.snaps[0], k, state.ended()),
    whyNot: (k) => {
      const t = remote.snaps?.[0];
      if (!state.started()) return tr('game.whyNot.wait');
      if (!t) return tr('game.whyNot.connecting');
      if (t.gold < UNITS[k].cost) return tr('game.whyNot.gold');
      if (t.queue.length >= MAX_QUEUE) return tr('game.whyNot.queue');
      return tr('game.whyNot.pop');
    },
    pop: () => remote.snaps?.[0].pop ?? 0,
    unlocked: roster(faction),
  };
  return match;
}

/** Xem trận của người khác: không ra lệnh được. */
export function watchMatch(remote: RemoteWorld): Match {
  return {
    view: remote,
    step: (dt) => {
      remote.advance(dt);
      return remote.drainEvents();
    },
    train: () => false,
    setStance: () => {},
    setHold: () => {},
    orderWall: () => false,
    wallBlock: () => 'over',
    unleash: () => false,
    setCenterMine: () => {},
    setMineSplit: () => {},
    setFormation: () => {},
    canTrain: () => false,
    whyNot: () => tr('game.whyNot.watching'),
    pop: () => remote.snaps?.[0].pop ?? 0,
    unlocked: [],
  };
}
