import { describe, expect, it } from 'vitest';
import { EnemyAI } from './ai';
import { campaignFactions, campaignLevel, isBoss, LEVELS, ROUND, SKIRMISH } from './levels';
import { FACTIONS, FACTION_ORDER, LEGACY_FACTIONS, toFactionId, type FactionId } from './factions';
import { ALL_ARCHS, UNITS, UNIT_ORDER, kindOf, roster, wallKind, type UnitKind } from './units';
import { DEPOT_SLOTS, depotX, freeDepots, statueX, ULT_LOSS, VETERAN_BOUNTY, World, WORLD_WIDTH, type Unit } from './world';
import { ULTS } from './skills';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const DT = 1 / 30;
const RANGED_BEHIND_MIN = 50;

/** Tắt kỹ năng riêng của quân (test đo một cơ chế khác, kỹ năng làm lệch kết quả). */
export const quiet = (u: Unit): Unit => {
  u.skillT = 1e9;
  u.skillUsed = true;
  return u;
};

function run(world: World, seconds: number, each?: (w: World) => void) {
  for (let t = 0; t < seconds && world.winner === null; t += DT) {
    each?.(world);
    world.update(DT);
  }
}

/** Bot người chơi đơn giản: so sức mạnh quân hai bên để quyết định xây gì và khi nào đánh. */
const BOT_MIX: Partial<Record<UnitKind, number>> = { sword: 3, archer: 3, spear: 2, cavalry: 1, mage: 1, giant: 1 };

export function playerBot(level: number, unlocked: UnitKind[] = LEVELS[level].player.unlocked, mix = BOT_MIX) {
  const armyValue = (w: World, team: 0 | 1) => {
    let v = 0;
    for (const u of w.units) if (u.team === team && !u.dying && u.kind !== 'miner') v += UNITS[u.kind].cost;
    return v;
  };
  return (w: World) => {
    const mine = armyValue(w, 0);
    const theirs = armyValue(w, 1);
    const miners = w.count(0, 'miner', true);
    if (miners < 5 || (miners < 8 && mine >= theirs * 0.8)) {
      w.train(0, 'miner');
    } else {
      // Để dành cho loại đang thiếu; chỉ mua quân rẻ khi địch đang đánh tới
      const underAttack = w.teams[1].stance === 'attack';
      let pick: UnitKind | null = null;
      let low = Infinity;
      for (const [k, wt] of Object.entries(mix) as [UnitKind, number][]) {
        if (!unlocked.includes(k)) continue;
        if (underAttack && w.teams[0].gold < UNITS[k].cost) continue;
        const r = w.count(0, k, true) / wt;
        if (r < low) [low, pick] = [r, k];
      }
      if (pick) w.train(0, pick);
    }
    // Chiêu tượng thần: đầy nộ thì tung vào chỗ địch đứng đông (như người chơi chọn chỗ)
    if (w.teams[0].ult >= 1) {
      const foes = w.units.filter((u) => u.team === 1 && !u.dying && !u.inside && u.kind !== kindOf(w.teams[1].faction, 'miner'));
      const spot = foes.find((f) => foes.filter((e) => Math.abs(e.x - f.x) <= 220).length >= 5);
      if (spot) w.unleash(0, spot.x);
    }
    const stance = w.teams[0].stance;
    if (mine > theirs * 1.4 + 800 || w.pop(0) >= 36) w.setStance(0, 'attack');
    else if (stance === 'attack' && mine < theirs) w.setStance(0, 'defend');
  };
}

describe('World', () => {
  it('thợ mỏ đào vàng về nhà', () => {
    const w = new World(
      [
        { gold: 0, statueHp: 1000, unlocked: ['miner'], start: ['miner', 'miner'] },
        { gold: 0, statueHp: 1000, unlocked: ['miner'] },
      ],
      seeded(1),
    );
    run(w, 30);
    // 30s thu nhập thụ động = 45 vàng, phần còn lại là từ thợ mỏ
    expect(w.teams[0].gold).toBeGreaterThan(45 + 75);
  });

  it('xây quân trừ vàng, tôn trọng khoá và hàng chờ', () => {
    const w = new World(
      [
        { gold: 1000, statueHp: 1000, unlocked: ['miner', 'sword'] },
        { gold: 0, statueHp: 1000, unlocked: [] },
      ],
      seeded(2),
    );
    expect(w.train(0, 'archer')).toBe(false);
    expect(w.train(0, 'sword')).toBe(true);
    expect(w.teams[0].gold).toBe(1000 - UNITS.sword.cost);
    run(w, UNITS.sword.trainTime + 0.1);
    expect(w.count(0, 'sword')).toBe(1);
  });

  it('kiếm sĩ tấn công phá được tượng không ai giữ', () => {
    const w = new World(
      [
        { gold: 0, statueHp: 1000, unlocked: ['sword'], start: ['sword', 'sword', 'sword'] },
        { gold: 0, statueHp: 300, unlocked: [] },
      ],
      seeded(3),
    );
    w.setStance(0, 'attack');
    run(w, 120);
    expect(w.winner).toBe(0);
  });

  it('rút về tượng thì quân vào trong và hồi máu', () => {
    const w = new World(
      [
        { gold: 0, statueHp: 1000, unlocked: ['sword'], start: ['sword'] },
        { gold: 0, statueHp: 1000, unlocked: [] },
      ],
      seeded(4),
    );
    const u = w.units[0];
    u.hp = 10;
    w.setStance(0, 'garrison');
    run(w, 10);
    expect(u.inside).toBe(true);
    expect(u.hp).toBeGreaterThan(50);
    expect(Math.abs(u.x - statueX(0))).toBeLessThan(10);
  });

  it('cung thủ và pháp sư gây sát thương từ xa', () => {
    for (const kind of ['archer', 'mage'] as UnitKind[]) {
      const w = new World(
        [
          { gold: 0, statueHp: 1000, unlocked: [kind], start: [kind] },
          { gold: 0, statueHp: 1000, unlocked: [] },
        ],
        seeded(5),
      );
      const enemy = w.spawn(1, 'spear', 900);
      const shooter = w.units[0];
      shooter.x = 900 - UNITS[kind].range + 20;
      w.setStance(0, 'attack');
      run(w, 5);
      expect(enemy.hp).toBeLessThan(enemy.maxHp);
      expect(Math.abs(shooter.x - enemy.x)).toBeGreaterThan(100);
    }
  });
});

describe('Màn chơi', () => {
  /**
   * Số trận bot thắng ở màn `i`: mỗi seed đổi hệ người chơi (tab chiến dịch) và xáo thứ tự hệ địch,
   * nên mỗi màn được thử với đủ cặp hệ chứ không chỉ một hệ cố định.
   */
  const campaignWins = (i: number, seeds: number[]) => {
    let wins = 0;
    seeds.forEach((seed, k) => {
      const mine = FACTION_ORDER[k % FACTION_ORDER.length];
      const lv = campaignLevel(i, mine, seed * 7919);
      const w = new World(
        [
          { ...lv.player, faction: mine },
          { ...lv.enemy, faction: lv.enemyFaction },
        ],
        seeded(seed),
      );
      const ai = new EnemyAI(lv.ai);
      const bot = playerBot(i);
      run(w, 1200, (world) => {
        bot(world);
        ai.update(world, DT);
      });
      if (w.winner === 0) wins++;
    });
    return wins;
  };

  // Nhiều seed: vài màn chỉ thắng quanh 50%, ít seed thì một thay đổi nhỏ cũng làm test chập chờn.
  // Màn trùm (cuối vòng 2 và vòng 3): bot đơn giản chỉ cần thắng được 1/8 số trận, màn khác một nửa.
  it('chiến dịch: mọi màn thắng được với hệ mình và hệ địch bất kỳ', () => {
    const seeds = Array.from({ length: 32 }, (_, k) => 11 * (k + 1));
    LEVELS.forEach((_, i) => {
      expect(campaignWins(i, seeds), `màn ${i + 1}`).toBeGreaterThanOrEqual(seeds.length / (isBoss(i) ? 8 : 2));
    });
  }, 600_000);

  it('chiến dịch mỗi hệ: 3 vòng, mỗi vòng 11 màn gặp đủ 11 hệ còn lại, không gặp chính mình, không gặp lại hệ vừa đánh', () => {
    expect(ROUND).toBe(FACTION_ORDER.length - 1);
    expect(LEVELS).toHaveLength(3 * ROUND);
    expect(LEVELS.filter((_, i) => isBoss(i))).toHaveLength(2);
    for (const mine of FACTION_ORDER) {
      const a = campaignFactions(mine, 123);
      expect(a).toHaveLength(LEVELS.length);
      expect(campaignFactions(mine, 123)).toEqual(a);
      expect(a).not.toContain(mine);
      for (let i = 0; i < a.length; i += ROUND) expect(new Set(a.slice(i, i + ROUND)).size).toBe(ROUND);
      for (let i = 1; i < a.length; i++) expect(a[i]).not.toBe(a[i - 1]);
      expect(campaignLevel(3, mine, 123).enemyFaction).toBe(a[3]);
      const lasts = new Set(Array.from({ length: 80 }, (_, k) => campaignFactions(mine, k)[LEVELS.length - 1]));
      expect(lasts.size).toBe(ROUND);
    }
  });

  it('vòng 3 làm lại vòng 2 nhưng máy mạnh hơn', () => {
    for (let i = ROUND; i < 2 * ROUND; i++) {
      const a = LEVELS[i].enemy;
      const b = LEVELS[i + ROUND].enemy;
      expect(b.incomeMult!).toBeGreaterThan(a.incomeMult!);
      expect(b.statueHp).toBeGreaterThan(a.statueHp);
      expect(b.gold).toBeGreaterThan(a.gold);
    }
  });

  it('đấu với máy: Dễ và Thường thắng được, Khó khó hơn', () => {
    const winsBy = (d: keyof typeof SKIRMISH) => {
      const cfg = SKIRMISH[d];
      let wins = 0;
      for (const seed of [1, 2, 3, 4]) {
        const w = new World([cfg.player, cfg.enemy], seeded(seed));
        const ai = new EnemyAI(cfg.ai);
        const bot = playerBot(0, cfg.player.unlocked);
        run(w, 1500, (world) => {
          bot(world);
          ai.update(world, DT);
        });
        if (w.winner === 0) wins++;
      }
      return wins;
    };
    const easy = winsBy('easy');
    const normal = winsBy('normal');
    const hard = winsBy('hard');
    expect(easy).toBeGreaterThanOrEqual(3);
    expect(normal).toBeGreaterThanOrEqual(2);
    expect(hard).toBeLessThanOrEqual(normal);
  }, 60_000);

  it('không làm gì thì thua ở các màn sau', () => {
    const lv = LEVELS[3];
    const w = new World([lv.player, lv.enemy], seeded(9));
    const ai = new EnemyAI(lv.ai);
    run(w, 900, (world) => ai.update(world, DT));
    expect(w.winner).toBe(1);
  });

  it('quân không bao giờ ra ngoài chiến trường', () => {
    const lv = LEVELS[7];
    const w = new World([lv.player, lv.enemy], seeded(4));
    const ai = new EnemyAI(lv.ai);
    const bot = playerBot(7);
    run(w, 600, (world) => {
      bot(world);
      ai.update(world, DT);
      for (const u of world.units) {
        expect(u.x).toBeGreaterThan(-50);
        expect(u.x).toBeLessThan(WORLD_WIDTH + 50);
      }
    });
  }, 60_000);
});

describe('Cơ chế đa dạng chiến thuật', () => {
  const empty = (unlocked: UnitKind[] = []) => ({ gold: 0, statueHp: 5000, unlocked });
  const one = (team: 0 | 1, kind: UnitKind, x: number, w: World) => {
    const u = w.spawn(team, kind, x);
    u.lane = 0.5;
    return u;
  };

  it('giáo đâm kỵ binh đau gấp đôi đâm kiếm sĩ', () => {
    const taken = (victim: UnitKind) => {
      const w = new World([empty(), empty()], seeded(1));
      w.setStance(0, 'attack');
      quiet(one(0, 'spear', 1500, w));
      const v = quiet(one(1, victim, 1530, w));
      v.hp = v.maxHp = 99999;
      w.setStance(1, 'attack');
      run(w, 0.6);
      return v.maxHp - v.hp;
    };
    const horse = taken('cavalry');
    const man = taken('sword');
    expect(man).toBeGreaterThan(0);
    expect(horse).toBeGreaterThan(man * 1.8);
  });

  it('thầy thuốc hồi máu cho quân bị thương', () => {
    const w = new World([empty(), empty()], seeded(2));
    const hurt = one(0, 'spear', 800, w);
    hurt.hp = 100;
    one(0, 'healer', 700, w);
    run(w, 4);
    expect(hurt.hp).toBeGreaterThan(150);
  });

  it('kỵ binh phi từ xa đâm mạnh hơn đứng sát', () => {
    const dmg = (startX: number) => {
      const w = new World([empty(), empty()], seeded(3));
      const c = one(0, 'cavalry', startX, w);
      const t = one(1, 'giant', 1600, w);
      w.setStance(0, 'attack');
      for (let i = 0; i < 400 && c.attackT < 0; i++) w.update(DT);
      run(w, 0.4);
      return t.maxHp - t.hp;
    };
    expect(dmg(1240)).toBeGreaterThan(dmg(1570) * 1.8);
  });

  it('máy bắn đá phá tượng gấp 3 và không bắn địch đứng sát', () => {
    const w = new World([empty(), empty()], seeded(4));
    one(0, 'catapult', statueX(1) - 500, w);
    w.setStance(0, 'attack');
    run(w, 7);
    const lost = 5000 - w.teams[1].statueHp;
    expect(lost).toBeGreaterThanOrEqual(UNITS.catapult.damage * 3);

    const near = new World([empty(), empty()], seeded(4));
    const cat = one(0, 'catapult', 1500, near);
    const enemy = one(1, 'sword', 1560, near);
    enemy.hp = enemy.maxHp = 99999;
    near.setStance(1, 'garrison');
    run(near, 1);
    expect(cat.x).toBeLessThan(1500); // lùi ra xa cho đủ tầm
  });

  it('ninja ưu tiên ám sát cung thủ ở hàng sau và lướt tới', () => {
    const w = new World([empty(), empty()], seeded(5));
    const ninja = one(0, 'ninja', 1300, w);
    const front = one(1, 'spear', 1420, w);
    const archer = one(1, 'archer', 1600, w);
    front.hp = front.maxHp = 99999;
    w.setStance(0, 'attack');
    w.setStance(1, 'garrison');
    let blinked = false;
    for (let i = 0; i < 90; i++) {
      w.update(DT);
      if (w.drainEvents().some((e) => e.type === 'blink')) blinked = true;
    }
    expect(blinked).toBe(true);
    expect(Math.abs(ninja.x - archer.x)).toBeLessThan(60);
    expect(archer.hp).toBeLessThan(archer.maxHp);
  });

  it('quân hạ đủ địch thì lên sao kỳ cựu, tăng máu tối đa', () => {
    const w = new World([empty(), empty()], seeded(6));
    const vet = one(0, 'sword', 1500, w);
    vet.hp = vet.maxHp = 99999;
    w.setStance(0, 'attack');
    for (let i = 0; i < 2; i++) {
      const e = one(1, 'miner', 1520, w);
      e.hp = 1;
      run(w, 1.2);
    }
    expect(vet.kills).toBeGreaterThanOrEqual(2);
    expect(vet.rank).toBe(1);
    expect(vet.maxHp).toBeCloseTo(UNITS.sword.hp * 1.15);
  });

  it('thợ mỏ chết rơi túi vàng, phe địch chạm vào thì nhặt được', () => {
    const w = new World([empty(), empty()], seeded(7));
    const m = one(0, 'miner', 1500, w);
    m.carrying = 100;
    m.hp = 1;
    one(1, 'sword', 1520, w);
    w.setStance(1, 'attack');
    run(w, 1);
    expect(m.dying).toBe(true);
    run(w, 2);
    expect(w.teams[1].gold).toBeGreaterThanOrEqual(100);
    expect(w.drops.length).toBe(0);
  });

  it('chia thợ mỏ: đúng tỉ lệ bạc / vàng / kim cương; mỏ càng xa càng nhiều vàng', () => {
    const make = () =>
      new World(
        [
          { gold: 0, statueHp: 1000, unlocked: ['miner'], start: ['miner', 'miner', 'miner', 'miner'] },
          { gold: 0, statueHp: 1000, unlocked: [] },
        ],
        seeded(8),
      );
    const w = make();
    w.setMineSplit(0, [1, 1, 2]);
    run(w, 1);
    const on = (m: number) => w.units.filter((u) => u.team === 0 && u.mine === m).length;
    expect([on(0), on(1), on(2)]).toEqual([1, 1, 2]);
    expect(w.teams[0].centerMine).toBe(true);
    let far = 0;
    run(w, 60, () => {
      for (const u of w.units) if (u.team === 0 && u.mine === 2) far = Math.max(far, u.x);
    });
    expect(far).toBeGreaterThan(WORLD_WIDTH / 2 - 100);
    w.setMineSplit(0, [0, 0, 0]); // không hợp lệ thì về toàn bạc
    run(w, 1);
    expect(on(0)).toBe(4);
    w.setMineSplit(0, [1, 99, 0]); // ngoài khoảng: bỏ qua
    expect(w.teams[0].mineSplit).toEqual([1, 0, 0]);
    // Đặt theo số thợ thật (bảng chia thợ trong trận): 7 thợ chia 2 · 1 · 4 thì đúng từng mỏ
    for (let i = 0; i < 3; i++) w.spawn(0, 'miner');
    w.setMineSplit(0, [2, 1, 4]);
    run(w, DT);
    expect([on(0), on(1), on(2)]).toEqual([2, 1, 4]);

    // Mỏ vàng tối đa 4 thợ, kim cương tối đa 6: dồn 12 thợ vào thì thợ thừa về mỏ bạc
    for (let i = 0; i < 5; i++) w.spawn(0, 'miner');
    w.setMineSplit(0, [0, 1, 0]);
    run(w, DT);
    expect([on(0), on(1), on(2)]).toEqual([8, 4, 0]);
    w.setMineSplit(0, [0, 0, 1]);
    run(w, DT);
    expect([on(0), on(1), on(2)]).toEqual([6, 0, 6]);

    // Thu nhập 4 thợ trong 4 phút khi dồn hết vào một mỏ
    const income = (split: [number, number, number]) => {
      const x = make();
      x.setMineSplit(0, split);
      run(x, 240);
      return x.teams[0].gold;
    };
    const [silver, gold, diamond] = [income([1, 0, 0]), income([0, 1, 0]), income([0, 0, 1])];
    expect(gold).toBeGreaterThan(silver);
    expect(diamond).toBeGreaterThan(gold);
  });
});

describe('Hệ và đội hình', () => {
  const side = (faction: FactionId, unlocked: UnitKind[] = []) => ({ faction, gold: 0, statueHp: 5000, unlocked });

  it('12 hệ, mỗi hệ 12 quân xây được + trạm, chỉ số hợp lệ', () => {
    expect(FACTION_ORDER.length).toBe(12);
    for (const f of FACTION_ORDER) {
      expect(roster(f).length).toBe(12);
      for (const k of [...roster(f), kindOf(f, 'tower')]) {
        const s = UNITS[k];
        expect(s, k).toBeDefined();
        expect(s.faction).toBe(f);
        expect(s.hp).toBeGreaterThan(0);
        expect(s.name.length).toBeGreaterThan(0);
      }
      // Mỗi hệ có điểm yếu thật trong chỉ số và có cách đánh bại
      const fd = FACTIONS[f];
      expect(fd.weakness.length, f).toBeGreaterThan(0);
      expect(fd.beat.length, f).toBeGreaterThan(0);
      const downside =
        (fd.hpMult ?? 1) < 1 ||
        (fd.speedMult ?? 1) < 1 ||
        (fd.costMult ?? 1) > 1 ||
        (fd.rangeMult ?? 1) < 1 ||
        (fd.damageMult ?? 1) < 1 ||
        (fd.armorAdd ?? 0) < 0;
      expect(downside, f).toBe(true);
    }
  });

  it('cấu hình màn viết theo khung tự đổi sang quân của hệ', () => {
    const w = new World([{ ...side('blood', ['miner', 'sword']), start: ['sword'] }, side('light')], seeded(1));
    expect(w.units[0].kind).toBe('blood-sword');
    expect(w.train(0, 'sword')).toBe(false); // không đủ vàng
    w.teams[0].gold = 1000;
    expect(w.train(0, 'sword')).toBe(true);
    expect(w.teams[0].queue[0].kind).toBe('blood-sword');
  });

  it('không có khắc hệ cứng: chọn hệ nào cũng không tự nhiên gây thêm sát thương lên hệ khác', () => {
    const hit = (attacker: FactionId) => {
      const w = new World([side(attacker), side('wind')], seeded(2));
      w.setStance(0, 'attack');
      quiet(w.spawn(0, 'sword', 1500)).lane = 0.5;
      const v = quiet(w.spawn(1, 'spear', 1525));
      v.hp = v.maxHp = 99999;
      w.setStance(1, 'attack');
      run(w, 0.35); // đúng một nhát chém
      return v.maxHp - v.hp;
    };
    // Sát thương thực chỉ tuỳ chỉ số quân (đã gồm nội tại hệ), không tuỳ hệ bị đánh
    const tribe = hit('light') / UNITS.sword.damage;
    const elf = hit('wood') / UNITS['wood-sword'].damage;
    expect(tribe / elf).toBeCloseTo(1, 1);
  });

  it('hàng lối: quân nhanh không bỏ quân chậm lại phía sau', () => {
    const spread = (formation: 'free' | 'line') => {
      const w = new World([side('light'), side('light')], seeded(3));
      w.setFormation(0, formation);
      w.spawn(0, 'cavalry', 700);
      w.spawn(0, 'giant', 700);
      w.spawn(0, 'archer', 700);
      w.setStance(0, 'attack');
      run(w, 12);
      const xs = w.units.filter((u) => u.team === 0).map((u) => u.x);
      return Math.max(...xs) - Math.min(...xs);
    };
    expect(spread('free')).toBeGreaterThan(600);
    // Đội hình hàng lối sâu khoảng 230 (khổng lồ / kỵ binh / khoảng trống / cung thủ)
    expect(spread('line')).toBeLessThan(280);
  });

  it('đội hình tấn công không đứng chờ quân tiếp viện mới xây ở nhà', () => {
    for (const formation of ['line', 'spread', 'wedge', 'wall'] as const) {
      const w = new World([side('light'), side('light')], seeded(6));
      w.setFormation(0, formation);
      for (const k of ['sword', 'sword', 'archer', 'spear'] as UnitKind[]) w.spawn(0, k, 900);
      w.setStance(0, 'attack');
      run(w, 5);
      const before = w.teams[0].formX;
      w.spawn(0, 'archer'); // tiếp viện xuất hiện cạnh tượng nhà, cách xa đội hình
      run(w, 5);
      expect(w.teams[0].formX - before, formation).toBeGreaterThan(200);
    }
  });

  it('bấm tấn công khi quân mới xây chưa ra tới đội: cả đội vẫn đi, quân mới chạy theo nhập hàng sau', () => {
    for (const formation of ['line', 'spread', 'wedge', 'wall'] as const) {
      const w = new World([side('light'), side('light')], seeded(6));
      w.setFormation(0, formation);
      for (const k of ['sword', 'sword', 'archer', 'spear'] as UnitKind[]) w.spawn(0, k, 900);
      run(w, 3);
      const late = w.spawn(0, 'sword'); // vừa xây xong, còn ở cạnh tượng nhà
      w.setStance(0, 'attack');
      run(w, 0.1);
      const first = w.teams[0].formX;
      // Trong lúc chạy theo, quân đến muộn xếp chỗ sau mọi quân đã có mặt lúc ra lệnh
      const old = w.units.filter((u) => u.team === 0 && u !== late && u.kind !== 'miner');
      const back = (u: Unit) => w.teams[0].formX - w.slotX(u, w.teams[0].formX);
      expect(back(late), formation).toBeGreaterThan(Math.max(...old.map(back)));
      run(w, 5);
      expect(w.teams[0].formX - first, formation).toBeGreaterThan(200);
      // Đuổi kịp thì nhập đội: đứng đúng chỗ của mình trong hàng
      run(w, 20);
      expect(Math.abs(late.x - w.slotX(late, w.teams[0].formX)), formation).toBeLessThan(30);
    }
  });

  it('hành quân theo đội hình: quân đi đều, không giật cục đi-đứng, không quay lui lúc xuất phát', () => {
    for (const formation of ['line', 'spread', 'wedge', 'wall'] as const) {
      const w = new World([side('light'), side('light')], seeded(9));
      w.setFormation(0, formation);
      for (const k of ['sword', 'sword', 'archer', 'archer', 'spear', 'healer', 'giant', 'cavalry'] as UnitKind[]) w.spawn(0, k, 500);
      run(w, 15); // dàn trận phòng thủ
      w.setStance(0, 'attack');
      let toggles = 0;
      let backSteps = 0;
      const was = new Map<number, boolean>();
      run(w, 20, () => {
        for (const u of w.units) {
          if (u.team !== 0) continue;
          if (was.has(u.id) && was.get(u.id) !== u.moving) toggles++;
          was.set(u.id, u.moving);
          if (u.moving && u.facing !== 1) backSteps++;
        }
      });
      expect(toggles, formation).toBeLessThan(10);
      expect(backSteps, formation).toBe(0);
    }
  });

  it('quân bắn xa đứng sau tiền tuyến, bị đẩy lên trước thì lùi về, bắn từ gần hết tầm', () => {
    for (const faction of ['light', 'stone'] as FactionId[]) {
      for (const formation of ['free', 'line'] as const) {
        const w = new World([side(faction), side('wind')], seeded(4));
        w.setFormation(0, formation);
        // Test đo chỗ đứng: tắt kỹ năng (hất lùi, choáng) để không làm lệch vị trí
        const front = quiet(w.spawn(0, kindOf(faction, 'spear'), 900));
        front.hp = front.maxHp = 1e6;
        const mage = quiet(w.spawn(0, kindOf(faction, 'mage'), 1000)); // lỡ đứng trước hàng giáo
        mage.hp = mage.maxHp = 1e6;
        for (const k of ['sword', 'sword', 'spear'] as const) quiet(w.spawn(1, kindOf('wind', k), 1500)).hp = 1e6;
        w.setStance(0, 'attack');
        w.setStance(1, 'attack');
        run(w, 4);
        const label = `${faction} ${formation}`;
        let minGap = Infinity;
        let shots = 0;
        run(w, 10, () => {
          minGap = Math.min(minGap, front.x - mage.x);
          if (mage.attackT === 0) shots++;
        });
        expect(minGap, label).toBeGreaterThan(RANGED_BEHIND_MIN);
        expect(shots, label).toBeGreaterThan(0);
      }
    }
  });

  it('Dừng: đang tấn công bấm Dừng thì cả đội đứng lại quanh chỗ đã tới, không về nhà cũng không lao lên', () => {
    for (const formation of ['free', 'line'] as const) {
      const w = new World([side('light'), side('light')], seeded(12));
      w.setFormation(0, formation);
      for (const k of ['sword', 'sword', 'archer', 'spear', 'healer'] as UnitKind[]) w.spawn(0, k, 700);
      w.setStance(0, 'attack');
      run(w, 8);
      const army = () => w.units.filter((u) => u.team === 0 && !u.dying && u.kind !== 'miner').map((u) => u.x);
      const front = Math.max(...army());
      w.setStance(0, 'hold');
      expect(Math.abs(w.teams[0].holdX - front), formation).toBeLessThan(5);
      run(w, 15);
      const xs = army();
      expect(Math.max(...xs), formation).toBeLessThan(front + 30);
      expect(Math.min(...xs), formation).toBeGreaterThan(front - 450);
    }
  });

  it('cắm cờ: cả đội và quân mới xây ra đứng giữ quanh cờ; không cắm được sát tượng địch', () => {
    for (const formation of ['free', 'line'] as const) {
      const w = new World([side('light'), side('light')], seeded(15));
      w.setFormation(0, formation);
      for (const k of ['sword', 'archer', 'spear'] as UnitKind[]) w.spawn(0, k, 600);
      w.setHold(0, 1200);
      expect(w.teams[0].stance).toBe('hold');
      run(w, 10);
      const late = w.spawn(0, 'sword'); // quân mới xây ở cạnh tượng nhà
      run(w, 20);
      for (const u of w.units.filter((x) => x.team === 0 && x.kind !== 'miner')) {
        expect(u.x, `${formation} ${u.kind}`).toBeGreaterThan(1200 - 320);
        expect(u.x, `${formation} ${u.kind}`).toBeLessThan(1200 + 30);
      }
      expect(late.x).toBeGreaterThan(1000);
    }
    const w = new World([side('light'), side('light')], seeded(16));
    w.setHold(0, WORLD_WIDTH);
    expect(w.teams[0].holdX).toBeLessThan(statueX(1) - 200);
    w.setHold(1, 0); // phe phải: cờ cũng không cắm vào tượng phe trái
    expect(w.teams[1].holdX).toBeGreaterThan(statueX(0) + 200);
  });

  it('đội hình: bắn xa đứng hẳn sau cận chiến, quân cùng hàng không đứng chồng lên nhau', () => {
    for (const formation of ['line', 'wedge', 'spread'] as const) {
      const w = new World([side('crystal'), side('light')], seeded(17));
      w.setFormation(0, formation);
      for (const k of ['spear', 'spear', 'sword', 'archer', 'archer', 'healer'] as const) w.spawn(0, kindOf('crystal', k), 900);
      w.setHold(0, 1300);
      run(w, 20);
      const army = w.units.filter((u) => u.team === 0 && UNITS[u.kind].arch !== 'miner');
      const xs = (a: string) => army.filter((u) => UNITS[u.kind].arch === a).map((u) => u.x);
      const meleeBack = Math.min(...xs('spear'), ...xs('sword'));
      expect(meleeBack - Math.max(...xs('archer')), formation).toBeGreaterThan(150);
      for (const [i, a] of army.entries()) {
        for (const b of army.slice(i + 1)) {
          const overlap = Math.abs(a.x - b.x) < 12 && Math.abs(a.lane - b.lane) < 0.15;
          expect(overlap, `${formation} ${a.kind}/${b.kind}`).toBe(false);
        }
      }
    }
  });

  it('đội hình gặp địch: mũi bám theo quân đang đánh, bắn xa theo sát sau; đánh xong tập hợp rồi đi tiếp', () => {
    const w = new World([side('light'), side('light')], seeded(13));
    w.setFormation(0, 'line');
    for (const k of ['sword', 'sword', 'archer', 'archer', 'spear'] as UnitKind[]) w.spawn(0, k, 700);
    const enemy = w.spawn(1, 'sword', 1500);
    w.setHold(1, 1500);
    w.setStance(0, 'attack');
    let fought = false;
    let lastFront = NaN;
    let startFront = NaN;
    for (let t = 0; t < 30 && !enemy.dying; t += DT) {
      w.update(DT);
      const ours = w.units.filter((u) => u.team === 0 && !u.dying && u.kind !== 'miner');
      const melee = ours.filter((u) => u.engaged && UNITS[u.kind].range < 150);
      if (melee.length) {
        if (!fought) startFront = w.teams[0].formX;
        fought = true;
        lastFront = w.teams[0].formX;
        // Mũi không tự tiến: chỉ bám theo quân cận chiến đang đánh ở đầu
        expect(lastFront).toBeLessThanOrEqual(Math.max(startFront, ...melee.map((u) => u.x)) + 1);
        // Cung thủ không bị bỏ xa phía sau
        for (const a of ours.filter((u) => u.kind === 'archer')) expect(Math.max(...melee.map((u) => u.x)) - a.x).toBeLessThan(450);
      }
    }
    expect(enemy.dying).toBe(true);
    expect(fought).toBe(true);
    run(w, 5); // tập hợp rồi đi tiếp, chưa tới tượng địch
    const xs = w.units.filter((u) => u.team === 0 && !u.dying && u.kind !== 'miner').map((u) => u.x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThan(380);
    expect(w.teams[0].formX).toBeGreaterThan(lastFront + 50);
  });

  it('thầy thuốc trong đội hình theo sát tiền tuyến và hồi máu cho quân đang đánh', () => {
    for (const formation of ['line', 'wedge', 'wall', 'spread'] as const) {
      const w = new World([side('light'), side('light')], seeded(18));
      w.setFormation(0, formation);
      for (const k of ['spear', 'sword', 'archer', 'archer', 'archer', 'healer'] as UnitKind[]) w.spawn(0, k, 700);
      const tank = w.spawn(1, 'giant', 1700);
      tank.hp = tank.maxHp = 1e6;
      w.setHold(1, 1700);
      w.setStance(0, 'attack');
      let healed = 0;
      run(w, 40, () => {
        for (const e of w.drainEvents()) if (e.type === 'heal') healed += e.amount;
      });
      expect(healed, formation).toBeGreaterThan(100);
    }
  });

  it('sát thủ không đi xuyên quân địch đứng chắn; chỉ vượt qua bằng cách lướt', () => {
    const setup = () => {
      const w = new World([side('light'), side('light')], seeded(19));
      const wall = w.spawn(1, 'spear', 1300);
      wall.hp = wall.maxHp = 1e6;
      w.spawn(1, 'archer', 1450).hp = 1e6;
      const ninja = w.spawn(0, 'ninja', 1000);
      ninja.hp = ninja.maxHp = 1e6;
      w.setHold(1, 1300); // phe địch đứng giữ tại chỗ: lính giáo chắn trước, cung thủ sau
      w.setStance(0, 'attack');
      return { w, wall, ninja };
    };
    // Chưa hồi lướt: bị lính giáo chắn lại, phải đánh lính giáo
    const a = setup();
    run(a.w, 6, () => (a.ninja.blinkT = 100));
    expect(a.ninja.x).toBeLessThan(a.wall.x);
    expect(a.wall.hp).toBeLessThan(a.wall.maxHp);
    // Có lướt: lướt qua hàng chắn tới cung thủ
    const b = setup();
    let blinked = false;
    let dashFrames = 0;
    const xs: number[] = [];
    run(b.w, 10, () => {
      for (const e of b.w.drainEvents()) if (e.type === 'blink') blinked = true;
      if (b.ninja.dashT > 0) {
        dashFrames++;
        xs.push(b.ninja.x);
      }
    });
    // Lướt thấy được: kéo dài vài khung hình, đi qua các vị trí ở giữa chứ không dịch chuyển tức thời
    expect(dashFrames).toBeGreaterThanOrEqual(4);
    expect(new Set(xs.map(Math.round)).size).toBeGreaterThanOrEqual(4);
    expect(blinked).toBe(true);
    expect(b.ninja.x).toBeGreaterThan(b.wall.x);
  });

  it('đội hình tới tượng địch thì cả đội đánh tượng, không đứng treo', () => {
    for (const formation of ['line', 'wedge', 'wall', 'spread'] as const) {
      const w = new World([side('light'), { ...side('light'), statueHp: 1e6 }], seeded(21));
      w.setFormation(0, formation);
      for (const k of ['cavalry', 'sword', 'sword', 'archer', 'archer', 'healer', 'giant'] as UnitKind[]) w.spawn(0, k, 2600);
      w.setStance(0, 'attack');
      run(w, 40);
      const hp0 = w.teams[1].statueHp;
      run(w, 10);
      expect(hp0 - w.teams[1].statueHp, formation).toBeGreaterThan(300);
      // Ai cũng đã vào tầm đánh tượng (cung thủ đứng sau, cận chiến sát tượng)
      for (const u of w.units.filter((x) => x.team === 0 && x.kind !== 'miner' && x.kind !== 'healer')) {
        expect(Math.abs(statueX(1) - u.x), `${formation} ${u.kind}`).toBeLessThan(UNITS[u.kind].range + 120);
      }
    }
  });

  it('mũi nhọn: quân nhanh không bỏ đội lao lên khi thấy địch ở xa, lính trâu vẫn đi đầu', () => {
    const w = new World([side('light'), side('light')], seeded(22));
    w.setFormation(0, 'wedge');
    for (const k of ['cavalry', 'giant', 'sword', 'sword', 'archer'] as UnitKind[]) w.spawn(0, k, 900);
    for (const k of ['sword', 'sword'] as UnitKind[]) w.spawn(1, k, 2000).hp = 1e6;
    w.setHold(1, 2000);
    w.setStance(0, 'attack');
    const giant = w.units.find((u) => u.kind === 'giant')!;
    let worst = 0;
    run(w, 25, () => {
      // Trước khi lính trâu chạm địch, không quân cận chiến nào vượt lên trước nó quá xa
      if (Math.abs(giant.x - 2000) > 120) {
        for (const u of w.units) if (u.team === 0 && (u.kind === 'cavalry' || u.kind === 'sword')) worst = Math.max(worst, u.x - giant.x);
      }
    });
    expect(worst).toBeLessThan(200);
  });

  it('rút về: thầy thuốc hồi máu cho quân bị thương trên đường về', () => {
    const w = new World([side('light'), side('light')], seeded(23));
    const hurt = w.spawn(0, 'sword', 1500);
    hurt.hp = 20;
    w.spawn(0, 'healer', 1400);
    w.setStance(0, 'garrison');
    let healed = 0;
    run(w, 6, () => {
      hurt.inside = false; // giữ kiếm sĩ ở ngoài để đo
      for (const e of w.drainEvents()) if (e.type === 'heal') healed += e.amount;
    });
    expect(healed).toBeGreaterThan(30);
  });

  it('đội hình xếp quân cùng hàng ra các lane khác nhau, mũi nhọn hẹp ở đầu', () => {
    const lanesOf = (formation: 'line' | 'wedge') => {
      const w = new World([side('light'), side('light')], seeded(14));
      w.setFormation(0, formation);
      for (const k of ['cavalry', 'sword', 'sword', 'sword', 'archer', 'archer', 'archer'] as UnitKind[]) w.spawn(0, k, 700);
      w.setStance(0, 'attack');
      run(w, 8);
      return w.units.filter((u) => u.team === 0 && u.kind !== 'miner');
    };
    const line = lanesOf('line');
    const swordLanes = line.filter((u) => u.kind === 'sword').map((u) => u.lane);
    for (const [i, a] of swordLanes.entries()) for (const b of swordLanes.slice(i + 1)) expect(Math.abs(a - b)).toBeGreaterThan(0.1);
    const wedge = lanesOf('wedge');
    const spreadOf = (k: UnitKind) => {
      const ls = wedge.filter((u) => u.kind === k).map((u) => u.lane);
      return Math.max(...ls) - Math.min(...ls);
    };
    expect(Math.abs(wedge.find((u) => u.kind === 'cavalry')!.lane - 0.5)).toBeLessThan(0.05);
    expect(spreadOf('archer')).toBeGreaterThan(spreadOf('sword'));
  });

  it('mỏ kim cương + phòng thủ: lính ra đứng chắn trước mỏ giữa, tắt thì về giữ tượng', () => {
    const w = new World([side('light', ['miner']), side('light')], seeded(7));
    for (const k of ['miner', 'miner', 'sword', 'archer'] as UnitKind[]) w.spawn(0, k);
    w.setCenterMine(0, true);
    run(w, 30);
    const soldiers = () => w.units.filter((u) => u.team === 0 && UNITS[u.kind].arch !== 'miner');
    for (const u of soldiers()) expect(Math.abs(u.x - WORLD_WIDTH / 2)).toBeLessThan(200);
    w.setCenterMine(0, false);
    run(w, 30);
    for (const u of soldiers()) expect(u.x).toBeLessThan(WORLD_WIDTH / 2 - 600);
  });

  it('thợ xây ra dựng trạm vàng ở 2 chỗ cố định, tối đa 2 trạm', () => {
    const w = new World([{ ...side('light', ['builder']), gold: 5000 }, side('light')], seeded(4));
    for (let i = 0; i < 3; i++) w.train(0, 'builder');
    expect(w.teams[0].queue.length).toBe(2);
    run(w, 60);
    const towers = w.units.filter((u) => UNITS[u.kind].arch === 'tower').map((t) => t.x);
    expect(towers.length).toBe(2);
    towers.sort((a, b) => a - b).forEach((x, i) => expect(Math.abs(x - depotX(0, i))).toBeLessThanOrEqual(5));
  });

  it('trạm vàng bắn địch đến gần', () => {
    const w = new World([side('light'), side('light')], seeded(5));
    const t = w.spawn(0, 'tower', depotX(0, 0));
    t.buildSlot = 0;
    const e = w.spawn(1, 'sword', depotX(0, 0) + 300);
    w.setStance(1, 'garrison');
    run(w, 3);
    expect(e.hp).toBeLessThan(e.maxHp);
  });

  it('cờ hiệu làm quân quanh đó đánh đau hơn', () => {
    const dmg = (withBanner: boolean) => {
      const w = new World([side('light'), side('light')], seeded(6));
      w.setStance(0, 'attack');
      w.spawn(0, 'sword', 1500).lane = 0.5;
      if (withBanner) w.spawn(0, 'banner', 1460);
      const v = w.spawn(1, 'spear', 1525);
      v.hp = v.maxHp = 99999;
      w.setStance(1, 'attack');
      run(w, 0.5);
      return v.maxHp - v.hp;
    };
    expect(dmg(true)).toBeGreaterThan(dmg(false) * 1.15);
  });

  it('thầy chiêu hồn gọi xác chết dậy thành xương binh tạm thời', () => {
    const w = new World([side('shadow'), side('light')], seeded(7));
    w.spawn(0, 'healer', 1450);
    const victim = w.spawn(1, 'miner', 1500);
    victim.hp = 1;
    const killer = w.spawn(0, 'sword', 1480);
    killer.hp = killer.maxHp = 9999;
    w.setStance(0, 'attack');
    run(w, 2);
    const summon = w.units.find((u) => u.team === 0 && u.lifeT > 0);
    expect(summon?.kind).toBe('shadow-sword');
    expect(w.pop(0)).toBe(UNITS['shadow-healer'].pop + UNITS['shadow-sword'].pop); // quân triệu hồi không tính quân số
  });

  it('goblin đánh bom tự nổ, gây sát thương lan', () => {
    const w = new World([side('wind'), side('light')], seeded(8));
    const g = w.spawn(0, 'ninja', 1400);
    const a = w.spawn(1, 'sword', 1460);
    const b = w.spawn(1, 'sword', 1470);
    a.lane = b.lane = g.lane = 0.5;
    w.setStance(0, 'attack');
    w.setStance(1, 'defend');
    run(w, 2);
    expect(g.dying).toBe(true);
    expect(a.hp).toBeLessThan(a.maxHp);
    expect(b.hp).toBeLessThan(b.maxHp);
  });

  it('bóng ma tàng hình: địch không nhắm được khi nó chưa ra đòn', () => {
    const w = new World([side('shadow'), side('light')], seeded(9));
    const ghost = w.spawn(0, 'ninja', 1500);
    ghost.hp = ghost.maxHp = 9999;
    const archer = w.spawn(1, 'archer', 1800);
    w.setStance(1, 'attack');
    w.update(DT);
    expect(ghost.hidden).toBe(true);
    run(w, 0.5);
    expect(archer.attackT).toBeLessThan(0); // chưa bắn vì không thấy
  });
});

describe('12 hệ: nội tại và trạm vàng', () => {
  const side = (faction: FactionId, unlocked: UnitKind[] = []) => ({ faction, gold: 0, statueHp: 5000, unlocked });
  const one = (w: World, team: 0 | 1, kind: UnitKind, x: number) => {
    const u = w.spawn(team, kind, x);
    u.lane = 0.5;
    return u;
  };

  it('12 hệ có 12 nội tại khác nhau', () => {
    expect(new Set(FACTION_ORDER.map((f) => FACTIONS[f].passive)).size).toBe(12);
    expect(FACTION_ORDER.slice(8)).toEqual(['metal', 'water', 'fire', 'ice']);
  });

  /** Sát thương một nhát của quân đầu tiên phe 0 vào một khổng lồ địch đứng yên. */
  const firstHit = (faction: FactionId, allies: number, setup?: (w: World) => void) => {
    const w = new World([side(faction), side('light')], seeded(3));
    setup?.(w);
    const me = quiet(one(w, 0, kindOf(faction, 'sword'), 1000));
    for (let i = 0; i < allies; i++) quiet(one(w, 0, kindOf(faction, 'sword'), 990 - i * 4));
    const e = quiet(one(w, 1, 'giant', 1020));
    w.setStance(1, 'garrison');
    e.inside = false;
    const hp0 = e.hp;
    for (let t = 0; t < 3 && e.hp === hp0; t += DT) {
      for (const u of w.units) if (u !== me && u.team === 0) u.cooldownT = 99; // chỉ quân đầu ra đòn
      w.update(DT);
    }
    return { dealt: hp0 - e.hp, w, me, e };
  };

  it('Cuồng phong (wind): đứng giữa đồng đội thì đánh đau hơn đứng một mình', () => {
    const alone = firstHit('wind', 0).dealt;
    const pack = firstHit('wind', 5).dealt;
    expect(pack / alone).toBeGreaterThan(1.1);
    expect(pack / alone).toBeLessThan(1.22);
  });

  it('Lò rèn (metal): quân xây càng muộn càng nhiều máu và đánh đau hơn', () => {
    const w = new World([side('metal'), side('light')], seeded(2));
    const early = w.spawn(0, 'metal-sword');
    w.time = 180;
    const late = w.spawn(0, 'metal-sword');
    const perMin = FACTIONS.metal.forge!.perMin;
    expect(late.maxHp / early.maxHp).toBeCloseTo(1 + 3 * perMin, 2);
    w.time = 9999;
    expect(w.spawn(0, 'metal-sword').maxHp / early.maxHp).toBeCloseTo(1.4, 2);
    const a = firstHit('metal', 0).dealt;
    const b = firstHit('metal', 0, (x) => (x.time = 180)).dealt;
    expect(b / a).toBeCloseTo(1 + 3 * perMin, 1);
  });

  it('Thủy triều (water): đánh trúng thì hồi máu', () => {
    const w = new World([side('water'), side('light')], seeded(3));
    const u = one(w, 0, 'water-sword', 1000);
    u.hp = u.maxHp / 2;
    const e = one(w, 1, 'giant', 1020);
    w.setStance(1, 'garrison');
    e.inside = false;
    const hp0 = u.hp;
    run(w, 1.5);
    expect(u.hp).toBeGreaterThan(hp0);
  });

  it('Lửa rồng (fire): đòn đánh đốt máu theo thời gian', () => {
    const { e } = firstHit('fire', 0);
    expect(e.poisonT).toBeGreaterThan(0);
    expect(e.poisonDps).toBeGreaterThan(0);
  });

  it('Giá lạnh (ice): đòn đánh làm chậm mục tiêu', () => {
    const { e } = firstHit('ice', 0);
    expect(e.slowT).toBeGreaterThan(0);
    expect(firstHit('light', 0).e.slowT).toBeLessThanOrEqual(0);
  });

  it('thợ mỏ vàng nộp vàng ở trạm gần mỏ, trạm bị phá thì vác về tượng', () => {
    const deliveries = (withDepot: boolean) => {
      const w = new World([side('light'), side('light')], seeded(6));
      w.setMineSplit(0, [0, 1, 0]);
      for (let i = 0; i < 2; i++) w.spawn(0, 'miner');
      let depot: Unit | null = null;
      if (withDepot) {
        depot = w.spawn(0, 'tower', depotX(0, 0));
        depot.buildSlot = 0;
      }
      const xs: number[] = [];
      for (let t = 0; t < 40; t += DT) {
        w.update(DT);
        for (const ev of w.drainEvents()) if (ev.type === 'gold' && ev.team === 0) xs.push(ev.x);
      }
      return { xs, w, depot };
    };
    const home = deliveries(false);
    const near = deliveries(true);
    expect(Math.max(...home.xs)).toBeLessThan(statueX(0) + 60);
    expect(near.xs.every((x) => Math.abs(x - depotX(0, 0)) < 30)).toBe(true);
    expect(near.xs.length).toBeGreaterThan(home.xs.length * 1.5);
    // Phá trạm: thợ lại về tượng
    near.depot!.hp = 0;
    near.depot!.dying = true;
    const xs: number[] = [];
    for (let t = 0; t < 30; t += DT) {
      near.w.update(DT);
      for (const ev of near.w.drainEvents()) if (ev.type === 'gold' && ev.team === 0) xs.push(ev.x);
    }
    expect(xs.length).toBeGreaterThan(0);
    expect(Math.max(...xs)).toBeLessThan(statueX(0) + 60);
  });
});

describe('Tường thành', () => {
  const side = (faction: FactionId, gold = 0) => ({ faction, gold, statueHp: 50000, unlocked: [] as UnitKind[] });
  const one = (w: World, team: 0 | 1, kind: UnitKind, x: number) => {
    const u = w.spawn(team, kind, x);
    u.lane = 0.5;
    return u;
  };
  const step = (w: World, seconds: number, each?: () => void) => {
    for (let t = 0; t < seconds; t += 1 / 30) {
      each?.();
      w.update(1 / 30);
    }
  };

  it('chỉ xây trong nửa nhà, đủ vàng, có thợ mỏ, mỗi phe 1 bức; thợ mỏ gần nhất đi ra dựng rồi quay lại đào', () => {
    const w = new World([side('light', 1000), side('light')], seeded(1));
    const x = statueX(0) + 500;
    expect(w.wallBlock(0, x)).toBe('miner');
    const miner = one(w, 0, 'miner', statueX(0) + 60);
    expect(w.wallBlock(0, statueX(0) + 40)).toBe('range');
    expect(w.wallBlock(0, statueX(0) + 1500)).toBe('range');
    expect(w.wallBlock(1, statueX(1) - 500)).toBe('gold'); // phe địch 0 vàng
    expect(w.orderWall(0, x)).toBe(true);
    expect(w.teams[0].gold).toBe(1000 - UNITS[wallKind('light')].cost);
    expect(w.wallBlock(0, x)).toBe('busy');
    step(w, 6.5); // thợ mỏ đi 440 đơn vị
    expect(Math.abs(miner.x - x)).toBeLessThan(6);
    expect(w.wallOf(0)).toBeNull();
    step(w, (UNITS[wallKind('light')].buildTime ?? 6) + 0.5);
    const wall = w.wallOf(0)!;
    expect(wall).not.toBeNull();
    expect(wall.x).toBe(x);
    expect(Number.isNaN(w.teams[0].wallPlan)).toBe(true);
    expect(w.wallBlock(0, x)).toBe('exists');
    step(w, 3);
    expect(miner.x).toBeLessThan(x - 50); // về đào tiếp
    // Thiếu vàng thì không xây (khi tường cũ đã đổ)
    w.teams[0].gold = 10;
    wall.hp = 0;
    (w as unknown as { kill: (u: Unit, by: 0 | 1) => void }).kill(wall, 1);
    expect(w.wallBlock(0, x)).toBe('gold');
  });

  it('chặn quân địch (phải phá tường mới qua), quân nhà đi xuyên qua cổng', () => {
    const w = new World([side('light'), side('light')], seeded(2));
    const wx = statueX(0) + 600;
    const wall = one(w, 0, wallKind('light'), wx);
    const enemy = one(w, 1, 'sword', wx + 300);
    const mine = one(w, 0, 'sword', wx - 200);
    w.setStance(0, 'attack');
    w.setStance(1, 'attack');
    let minX = Infinity;
    step(w, 6, () => (minX = Math.min(minX, wall.dying ? Infinity : enemy.x)));
    expect(minX).toBeGreaterThanOrEqual(wx);
    expect(mine.x).toBeGreaterThan(wx); // quân nhà đã qua cổng
    // Không có quân nhà, quân địch đánh vào tường
    const w2 = new World([side('light'), side('light')], seeded(3));
    const wall2 = one(w2, 0, wallKind('light'), wx);
    const e2 = one(w2, 1, 'sword', wx + 200);
    w2.setStance(1, 'attack');
    step(w2, 8);
    expect(wall2.hp).toBeLessThan(wall2.maxHp);
    expect(e2.x).toBeGreaterThanOrEqual(wx);
  });

  it('máy công thành phá tường ×3', () => {
    const hitWall = (kind: UnitKind) => {
      const w = new World([side('light'), side('light')], seeded(4));
      const wall = one(w, 0, wallKind('light'), 1000);
      const s = UNITS[kind];
      (w as unknown as { damageUnit: (u: Unit, d: number, by: 0 | 1, t: string) => void }).damageUnit(wall, 100, 1, s.dmgType);
      return wall.maxHp - wall.hp;
    };
    expect(hitWall('catapult')).toBeGreaterThan(hitWall('sword') * 2.5);
  });

  it('nét riêng: rào gai đâm lại, tường băng làm chậm, tường lửa đốt, tường cây tự hồi máu', () => {
    const attackWall = (faction: FactionId) => {
      const w = new World([side(faction), side('light')], seeded(5));
      const wall = one(w, 0, wallKind(faction), 1000);
      const e = one(w, 1, 'sword', 1030);
      w.setStance(1, 'attack');
      step(w, 3);
      return { w, wall, e };
    };
    const orc = attackWall('wind');
    expect(orc.e.hp).toBeLessThan(orc.e.maxHp);
    expect(attackWall('ice').e.slowT).toBeGreaterThan(0);
    expect(attackWall('fire').e.poisonT).toBeGreaterThan(0);
    expect(attackWall('light').e.hp).toBe(UNITS.sword.hp); // tường đá thường không phản đòn
    const w = new World([side('wood'), side('light')], seeded(6));
    const tree = one(w, 0, wallKind('wood'), 1000);
    tree.hp -= 500;
    const before = tree.hp;
    step(w, 2);
    expect(tree.hp).toBeGreaterThan(before);
  });

  it('mã tường nối vào cuối UNIT_ORDER (client cũ không lệch chỉ số), mỗi nền văn minh một loại tường', () => {
    const n = FACTION_ORDER.length;
    expect(UNIT_ORDER.slice(-n)).toEqual(FACTION_ORDER.map((f) => wallKind(f)));
    expect(UNIT_ORDER.indexOf(kindOf('ice', 'tower'))).toBe(n * 13 - 1);
    expect(new Set(FACTION_ORDER.map((f) => UNITS[wallKind(f)].name)).size).toBe(n);
  });
});

describe('AI tấn công', () => {
  const side = (gold = 0) => ({ faction: 'light' as FactionId, gold, statueHp: 9999, unlocked: [] as UnitKind[] });
  const cfg = { miners: 0, mix: {}, attackAt: 100, forceAttackAt: 30, retreatRatio: 0.2, edge: 1.15 };

  it('có edge: không lao vào khi quân yếu hơn địch, đủ áp đảo thì đánh; quá giờ lâu vẫn đánh', () => {
    const w = new World([side(), side()], seeded(1));
    w.spawn(1, 'sword');
    w.spawn(1, 'sword');
    w.spawn(1, 'sword');
    w.spawn(0, 'sword');
    w.spawn(0, 'sword');
    const ai = new EnemyAI(cfg, 0);
    ai.update(w, 1);
    expect(w.teams[0].stance).toBe('defend'); // 2 kiếm sĩ < 3 × 1.15
    for (let i = 0; i < 4; i++) w.spawn(0, 'sword');
    ai.update(w, 1);
    expect(w.teams[0].stance).toBe('attack'); // 6 > 3 × 1.15
    // Quá mốc buộc đánh 4 phút mà vẫn yếu hơn: vẫn đánh để không ngồi thủ mãi
    const w2 = new World([side(), side()], seeded(2));
    for (let i = 0; i < 5; i++) w2.spawn(1, 'sword');
    w2.spawn(0, 'sword');
    w2.time = cfg.forceAttackAt + 250;
    const ai2 = new EnemyAI(cfg, 0);
    ai2.update(w2, 1);
    expect(w2.teams[0].stance).toBe('attack');
  });
});

describe('Kỹ năng riêng', () => {
  const side = (faction: FactionId, gold = 0) => ({ faction, gold, statueHp: 50000, unlocked: [] as UnitKind[] });
  const one = (w: World, team: 0 | 1, kind: UnitKind, x: number) => {
    const u = w.spawn(team, kind, x);
    u.lane = 0.5;
    return u;
  };

  it('mọi quân của mọi nền văn minh (kể cả thợ mỏ, thợ xây, trạm, tường) có một kỹ năng riêng, tên không trùng', () => {
    const names = new Set<string>();
    for (const f of FACTION_ORDER) {
      for (const a of ALL_ARCHS) {
        const sk = UNITS[kindOf(f, a)].skill;
        expect(sk, `${f} ${a}`).toBeDefined();
        expect(names.has(sk!.name), sk!.name).toBe(false);
        names.add(sk!.name);
        if (sk!.on === 'strike' || sk!.on === 'pulse' || sk!.on === 'haul') expect(sk!.every ?? 0, `${f} ${a}`).toBeGreaterThanOrEqual(0);
      }
    }
    expect(names.size).toBe(FACTION_ORDER.length * ALL_ARCHS.length);
  });

  it('strike: đòn cường hoá làm choáng, choáng xong có khoảng miễn choáng, hồi chiêu mới đánh mạnh lại', () => {
    const w = new World([side('light'), side('light')], seeded(1));
    const me = one(w, 0, 'sword', 1000);
    const foe = quiet(one(w, 1, 'spear', 1030));
    foe.hp = foe.maxHp = 99999;
    w.setStance(1, 'garrison');
    foe.inside = false;
    w.setStance(0, 'attack');
    let stunned = false;
    for (let t = 0; t < 1 && !stunned; t += DT) {
      w.update(DT);
      foe.inside = false;
      stunned = foe.stunT > 0;
    }
    expect(stunned).toBe(true);
    expect(me.skillT).toBeGreaterThan(4);
  });

  it('low: dưới 40% máu kích một lần (Hộ vệ khiên máu tự hồi máu và giảm sát thương nhận)', () => {
    const w = new World([side('blood'), side('light')], seeded(2));
    const u = one(w, 0, 'blood-spear', 1000);
    const foe = quiet(one(w, 1, 'giant', 1050));
    foe.cooldownT = 0;
    u.hp = u.maxHp * 0.42;
    w.setStance(0, 'hold');
    w.setStance(1, 'attack');
    run(w, 3);
    expect(u.skillUsed).toBe(true);
    expect(u.guardT > 0 || u.hp > u.maxHp * 0.42).toBe(true);
  });

  it('khiên giảm và phá giáp tăng sát thương nhận', () => {
    const hit = (setup: (u: Unit) => void) => {
      const w = new World([side('light'), side('light')], seeded(3));
      quiet(one(w, 0, 'sword', 1000));
      const v = quiet(one(w, 1, 'spear', 1025));
      v.hp = v.maxHp = 99999;
      setup(v);
      w.setStance(0, 'attack');
      w.setStance(1, 'attack');
      run(w, 0.6);
      return v.maxHp - v.hp;
    };
    const base = hit(() => {});
    const guarded = hit((v) => ((v.guardT = 9), (v.guard = 0.5)));
    const sundered = hit((v) => ((v.sunderT = 9), (v.sunder = 0.5)));
    expect(base).toBeGreaterThan(0);
    expect(guarded / base).toBeCloseTo(0.5, 1);
    expect(sundered / base).toBeCloseTo(1.5, 1);
  });

  it('pulse: tu sĩ phát ánh sáng hồi máu cho cả nhóm khi đang giao tranh', () => {
    const w = new World([side('light'), side('light')], seeded(4));
    const healer = one(w, 0, 'healer', 1000);
    const a = quiet(one(w, 0, 'sword', 1040));
    const b = quiet(one(w, 0, 'sword', 960));
    a.hp = b.hp = 20;
    one(w, 1, 'sword', 1300).cooldownT = 99;
    w.update(DT);
    expect(healer.skillT).toBeGreaterThan(10);
    const mend = UNITS.healer.skill!.mend!;
    expect(a.hp).toBeGreaterThanOrEqual(20 + mend);
    expect(b.hp).toBeGreaterThanOrEqual(20 + mend);
  });

  it('death: ác linh khổng lồ chết gọi bóng binh dậy (triệu hồi tự tan, không chiếm quân số)', () => {
    const w = new World([side('shadow'), side('light')], seeded(5));
    const g = one(w, 0, 'shadow-giant', 1000);
    const pop = w.pop(0);
    one(w, 1, 'sword', 1030);
    g.hp = 1;
    w.setStance(1, 'attack');
    run(w, 2);
    const raised = w.units.filter((u) => u.team === 0 && u.kind === 'shadow-sword' && u.lifeT > 0);
    expect(raised.length).toBeGreaterThanOrEqual(3);
    expect(w.pop(0)).toBeLessThanOrEqual(pop);
  });

  it('haul và built: thợ mỏ / thợ xây Tinh Thạch Cốc mang thêm vàng', () => {
    const w = new World([side('crystal'), side('light')], seeded(6));
    const m = one(w, 0, 'crystal-miner', 300);
    m.carrying = 18;
    const g0 = w.teams[0].gold;
    run(w, 2);
    expect(w.teams[0].gold - g0).toBeGreaterThanOrEqual(18 + UNITS['crystal-miner'].skill!.gold!);
    const b = one(w, 0, 'crystal-builder', depotX(0, 0));
    const g1 = w.teams[0].gold;
    run(w, 6.5);
    expect(b.kind).toBe('crystal-tower');
    expect(w.teams[0].gold - g1).toBeGreaterThanOrEqual(80);
  });

  it('kỹ năng tất định: cùng bộ ngẫu nhiên thì trận ra y hệt', () => {
    const play = () => {
      const w = new World([side('ice', 3000), side('thunder', 3000)], seeded(7));
      for (const k of ['sword', 'archer', 'giant', 'mage', 'spear']) {
        w.spawn(0, kindOf('ice', k as never), 1400);
        w.spawn(1, kindOf('thunder', k as never), 2600);
      }
      w.setStance(0, 'attack');
      w.setStance(1, 'attack');
      run(w, 40);
      return w.units.map((u) => `${u.kind}:${Math.round(u.hp)}:${Math.round(u.x)}`).join('|');
    };
    expect(play()).toBe(play());
  });
});

describe('Ô đền', () => {
  const side = (gold = 0) => ({ faction: 'light' as FactionId, gold, statueHp: 9999, unlocked: ['builder'] as UnitKind[] });

  it('chọn ô đền: thợ xây ra đúng ô đó dựng trạm; ô đã có / đã đặt thì không chọn lại được', () => {
    const w = new World([side(2000), side()], seeded(1));
    const far = DEPOT_SLOTS.indexOf(Math.max(...DEPOT_SLOTS));
    expect(w.train(0, 'builder', far)).toBe(true);
    expect(freeDepots(w, 0)).not.toContain(far);
    expect(w.canTrain(0, 'builder', far)).toBe(false); // đã đặt trước trong hàng chờ
    expect(w.canTrain(0, 'sword', 0)).toBe(false); // chỉ thợ xây mới kèm ô đền
    run(w, 40);
    const tower = w.units.find((u) => u.team === 0 && u.kind === 'tower');
    expect(tower).toBeDefined();
    expect(Math.abs(tower!.x - depotX(0, far))).toBeLessThan(6);
    // Không chọn ô: lấy ô trống đầu tiên; tối đa MAX_TOWERS trạm
    expect(w.train(0, 'builder')).toBe(true);
    expect(w.train(0, 'builder')).toBe(false);
  });
});

describe('Đội hình gặp địch', () => {
  const army: UnitKind[] = [
    'sword',
    'sword',
    'sword',
    'archer',
    'archer',
    'ninja',
    'spear',
    'spear',
    'cavalry',
    'healer',
    'banner',
    'mage',
    'catapult',
    'giant',
  ];
  const battle = (formation: 'line' | 'wedge' | 'wall' | 'spread') => {
    const w = new World(
      [
        { faction: 'light' as FactionId, gold: 0, statueHp: 99999, unlocked: [] as UnitKind[] },
        { faction: 'wind' as FactionId, gold: 0, statueHp: 99999, unlocked: [] as UnitKind[] },
      ],
      seeded(3),
    );
    for (const k of army) quiet(w.spawn(0, k, 500));
    for (const k of ['sword', 'sword', 'spear', 'archer'] as UnitKind[]) quiet(w.spawn(1, k, 2300));
    w.setHold(1, 2300);
    w.setFormation(0, formation);
    w.setStance(0, 'attack');
    return w;
  };

  it('bấm tấn công là cả đội xuất phát ngay, không đứng chờ tập hợp lâu', () => {
    for (const f of ['line', 'wedge', 'wall', 'spread'] as const) {
      const w = battle(f);
      const x0 = w.teams[0].formX || 0;
      run(w, 3);
      expect(w.teams[0].formX - x0, f).toBeGreaterThan(40);
    }
  });

  it('giáp địch thì đánh: không quân nào đứng sát địch trong tầm mà không đánh; mũi không vượt qua hàng địch', () => {
    for (const f of ['line', 'wedge', 'wall', 'spread'] as const) {
      const w = battle(f);
      let idle = 0;
      let overshoot = 0;
      run(w, 70, (world) => {
        const foes = world.units.filter((u) => u.team === 1 && !u.dying);
        if (!foes.length) return;
        const front = Math.min(...foes.map((e) => e.x));
        if (world.teams[0].formX > front + 1) overshoot++;
        for (const u of world.units) {
          if (u.team !== 0 || u.dying) continue;
          const s = UNITS[u.kind];
          if (s.arch === 'healer' || s.arch === 'banner' || s.minRange) continue;
          const d = Math.min(...foes.map((e) => Math.abs(e.x - u.x)));
          if (d <= s.range && u.attackT < 0 && !u.moving && u.cooldownT <= 0) idle++;
        }
      });
      expect(world0Done(w), f).toBe(true);
      expect(idle, f).toBeLessThan(10);
      expect(overshoot, f).toBe(0);
    }
  });
});

const world0Done = (w: World) => w.units.every((u) => u.team !== 1 || u.dying);

describe('Thích khách', () => {
  const setup = (f: FactionId, formation: 'line' | 'wedge' | 'free') => {
    const w = new World(
      [
        { faction: f, gold: 0, statueHp: 99999, unlocked: [] as UnitKind[] },
        { faction: 'stone' as FactionId, gold: 0, statueHp: 99999, unlocked: [] as UnitKind[] },
      ],
      seeded(5),
    );
    for (const a of ['spear', 'sword', 'sword', 'archer', 'ninja', 'ninja'] as const) quiet(w.spawn(0, kindOf(f, a), 900));
    for (const a of ['spear', 'spear', 'sword', 'archer', 'archer', 'mage', 'healer'] as const) quiet(w.spawn(1, kindOf('stone', a), 2200));
    w.setHold(1, 2150);
    w.setFormation(0, formation);
    w.setStance(0, 'attack');
    return w;
  };

  it('đứng sau hàng cận chiến trong đội hình, chờ tiền tuyến giáp địch rồi mới lướt vào ám sát hàng sau', () => {
    for (const f of ['light', 'shadow', 'wood'] as FactionId[]) {
      for (const formation of ['line', 'wedge', 'free'] as const) {
        const w = setup(f, formation);
        const ninjas = w.units.filter((u) => u.team === 0 && UNITS[u.kind].arch === 'ninja');
        const front = () => w.units.filter((u) => u.team === 0 && !u.dying && ['spear', 'sword'].includes(UNITS[u.kind].arch));
        let frontT = -1;
        const first: string[] = [];
        let t = 0;
        run(w, 40, () => {
          t += DT;
          if (frontT < 0 && front().some((u) => u.combat)) frontT = t;
          // Trước giao tranh thích khách không đứng trước quân cận chiến đi đầu
          if (frontT < 0 && formation !== 'free' && t > 3)
            for (const n of ninjas) expect(n.x, `${f} ${formation}`).toBeLessThanOrEqual(Math.max(...front().map((u) => u.x)) + 5);
          for (const n of ninjas) {
            if (n.dying || n.attackT < 0 || n.attackT >= DT * 1.5 || first.length >= ninjas.length) continue;
            expect(frontT, `${f} ${formation}: thích khách ra tay trước khi tiền tuyến giáp địch`).toBeGreaterThan(0);
            const tg = w.units.find((e) => e.id === n.targetId);
            if (tg) first.push(UNITS[tg.kind].arch);
          }
        });
        expect(first.length, `${f} ${formation}`).toBeGreaterThan(0);
        // Đòn đầu nhắm hàng sau (bắn xa / hỗ trợ), không phải giáo binh tiền tuyến
        for (const a of first) expect(['archer', 'mage', 'healer', 'banner', 'catapult'], `${f} ${formation}`).toContain(a);
      }
    }
  });
});

describe('Lật kèo: chiêu tượng thần, phục kích kỳ cựu', () => {
  const side = (faction: FactionId, gold = 0) => ({ faction, gold, statueHp: 9999, unlocked: [] as UnitKind[] });

  it('mất quân thì tượng nạp nộ; chưa đầy thì không tung được, đầy thì tung đúng chỗ và hết nộ', () => {
    const w = new World([side('fire'), side('light')], seeded(1));
    expect(w.unleash(0, 1500)).toBe(false);
    const mine = quiet(w.spawn(0, 'fire-giant', 1500));
    mine.hp = 1;
    w.spawn(1, 'sword', 1520).cooldownT = 0;
    w.setStance(1, 'attack');
    run(w, 3);
    expect(mine.dying).toBe(true);
    expect(w.teams[0].ult).toBeGreaterThanOrEqual(UNITS['fire-giant'].cost / ULT_LOSS - 0.01);
    w.teams[0].ult = 1;
    const foes = [w.spawn(1, 'spear', 2000), w.spawn(1, 'archer', 2100), w.spawn(1, 'sword', 2600)];
    const hp = foes.map((u) => u.hp);
    expect(w.unleash(0, 2050)).toBe(true);
    expect(w.teams[0].ult).toBe(0);
    const r = ULTS.fire.area!;
    // Trong vùng chiêu thì mất máu, ngoài vùng thì không
    expect(foes[0].hp).toBeLessThan(hp[0]);
    expect(foes[1].hp).toBeLessThan(hp[1]);
    expect(Math.abs(foes[2].x - 2050)).toBeGreaterThan(r);
    expect(foes[2].hp).toBe(hp[2]);
    expect(w.unleash(0, 2050)).toBe(false);
  });

  it('bên thua đợt giao tranh nạp nộ nhanh hơn bên thắng', () => {
    const w = new World([side('light'), side('light')], seeded(2));
    for (let i = 0; i < 8; i++) w.spawn(0, 'sword', 1500 - i * 6);
    for (let i = 0; i < 3; i++) w.spawn(1, 'sword', 1560 + i * 6);
    w.setStance(0, 'attack');
    w.setStance(1, 'attack');
    run(w, 20);
    expect(w.teams[1].ult).toBeGreaterThan(w.teams[0].ult);
  });

  it('phục kích kỳ cựu: hạ quân có sao được thưởng vàng theo số sao', () => {
    const killGold = (rank: number) => {
      const w = new World([side('light'), side('wind')], seeded(3));
      const vet = quiet(w.spawn(1, 'wind-spear', 1520));
      vet.rank = rank;
      vet.hp = 1;
      quiet(w.spawn(0, 'giant', 1500));
      w.setStance(0, 'attack');
      const g0 = w.teams[0].gold;
      run(w, 3);
      expect(vet.dying).toBe(true);
      return w.teams[0].gold - g0;
    };
    const base = killGold(0);
    expect(killGold(2) - base).toBeCloseTo(Math.round(UNITS['wind-spear'].cost * VETERAN_BOUNTY * 2), -1);
  });
});

describe('Mã 12 hệ theo nguyên tố', () => {
  it('mã mới là 12 nguyên tố; mã cũ (tên tộc) vẫn đổi được sang mã mới, mã lạ thì không', () => {
    expect(FACTION_ORDER).toEqual([
      'light',
      'wind',
      'wood',
      'shadow',
      'thunder',
      'blood',
      'crystal',
      'stone',
      'metal',
      'water',
      'fire',
      'ice',
    ]);
    expect(toFactionId('fire')).toBe('fire');
    expect(toFactionId('dragon')).toBe('fire');
    expect(toFactionId('tribe')).toBe('light');
    expect(toFactionId('x')).toBeNull();
    expect(toFactionId(3)).toBeNull();
    expect(new Set(Object.values(LEGACY_FACTIONS)).size).toBe(12);
  });
});
