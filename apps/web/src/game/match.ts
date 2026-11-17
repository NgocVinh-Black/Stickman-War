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
  type ClientMsg,
  type FactionId,
  type Formation,
  type Stance,
  type UnitKind,
  type WorldEvent,
  type WorldView,
} from '@nguoi-que/core';
import type { RemoteWorld } from '../net/remote';

const STEP = 1 / 60;

/** Một trận đấu: cục bộ (chiến dịch / đấu máy / nền sảnh) hoặc online. HUD và renderer chỉ làm việc qua giao diện này. */
export type Match = {
  view: WorldView;
  step: (dt: number) => WorldEvent[];
  train: (kind: UnitKind) => boolean;
  setStance: (s: Stance) => void;
  setCenterMine: (on: boolean) => void;
  setFormation: (f: Formation) => void;
  canTrain: (kind: UnitKind) => boolean;
  whyNot: (kind: UnitKind) => string;
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
    train: (k) => world.train(0, k),
    setStance: (s) => world.setStance(0, s),
    setCenterMine: (on) => world.setCenterMine(0, on),
    setFormation: (f) => world.setFormation(0, f),
    canTrain: (k) => world.canTrain(0, k),
    whyNot: (k) => {
      const t = world.teams[0];
      if (!t.unlocked.includes(k)) return 'Chưa mở khoá';
      if (t.gold < UNITS[k].cost) return 'Không đủ vàng';
      if (t.queue.length >= MAX_QUEUE) return 'Hàng chờ đã đầy';
      return 'Đã đủ quân số';
    },
    pop: () => world.pop(0),
    unlocked: world.teams[0].unlocked,
  };
}

/** Nền sảnh: hai tộc ngẫu nhiên do AI điều khiển đánh nhau, tượng không bao giờ vỡ. */
export function demoMatch(): Match {
  const lv = LEVELS[6];
  const setup = (faction: FactionId) => ({
    faction,
    gold: 800,
    statueHp: 999999,
    incomeMult: 1.2,
    unlocked: ARCH_ORDER,
    start: ['miner', 'miner', 'miner', 'sword', 'archer', 'spear'] as UnitKind[],
  });
  const a = FACTION_ORDER[Math.floor(Math.random() * FACTION_ORDER.length)];
  const others = FACTION_ORDER.filter((f) => f !== a);
  const b = others[Math.floor(Math.random() * others.length)];
  const world = new World([setup(a), setup(b)]);
  return localMatch(world, [new EnemyAI({ ...lv.ai, forceAttackAt: 60 }, 0), new EnemyAI({ ...lv.ai, forceAttackAt: 75 }, 1)]);
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
    train: (k) => {
      if (!match.canTrain(k)) return false;
      send({ t: 'train', kind: k });
      return true;
    },
    setStance: (stance) => send({ t: 'stance', stance }),
    setCenterMine: (on) => send({ t: 'centerMine', on }),
    setFormation: (mode) => send({ t: 'formation', mode }),
    canTrain: (k) => !!remote.snaps && state.started() && canTrainSnap(remote.snaps[0], k, state.ended()),
    whyNot: (k) => {
      const t = remote.snaps?.[0];
      if (!state.started()) return 'Chờ trận bắt đầu';
      if (!t) return 'Đang kết nối…';
      if (t.gold < UNITS[k].cost) return 'Không đủ vàng';
      if (t.queue.length >= MAX_QUEUE) return 'Hàng chờ đã đầy';
      return 'Đã đủ quân số';
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
    setCenterMine: () => {},
    setFormation: () => {},
    canTrain: () => false,
    whyNot: () => 'Bạn đang xem trận',
    pop: () => remote.snaps?.[0].pop ?? 0,
    unlocked: [],
  };
}
