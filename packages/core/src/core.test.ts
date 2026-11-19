import { describe, expect, it } from 'vitest';
import { EnemyAI } from './ai';
import { campaignFactions, campaignLevel, CAMPAIGN, LEVELS, SKIRMISH, type Difficulty } from './levels';
import { FACTIONS, FACTION_ORDER, type FactionId } from './factions';
import { UNITS, kindOf, roster, type UnitKind } from './units';
import { statueX, towerX, World, WORLD_WIDTH, type Unit } from './world';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const DT = 1 / 30;
const RANGED_BEHIND_MIN = 50;

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
   * Số trận bot thắng ở màn `i`: mỗi seed xáo một thứ tự tộc địch và đổi tộc người chơi,
   * nên mỗi màn được thử với đủ cặp tộc chứ không chỉ một tộc cố định.
   */
  const campaignWins = (i: number, diff: Difficulty, seeds: number[]) => {
    let wins = 0;
    seeds.forEach((seed, k) => {
      const lv = campaignLevel(i, diff, seed * 7919);
      const w = new World(
        [
          { ...lv.player, faction: FACTION_ORDER[k % 8] },
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
  // Màn trùm (màn cuối): bot đơn giản chỉ cần thắng được 1/8 số trận, màn khác một nửa.
  for (const diff of ['easy', 'normal', 'hard'] as const) {
    it(`chiến dịch ${CAMPAIGN[diff].label}: mọi màn thắng được với tộc địch bất kỳ`, () => {
      const seeds = Array.from({ length: 32 }, (_, k) => 11 * (k + 1));
      LEVELS.forEach((_, i) => {
        const last = i === LEVELS.length - 1;
        expect(campaignWins(i, diff, seeds), `${CAMPAIGN[diff].label} màn ${i + 1}`).toBeGreaterThanOrEqual(seeds.length / (last ? 8 : 2));
      });
    }, 300_000);
  }

  it('tộc địch xáo theo seed: mỗi 8 màn gặp đủ 8 tộc, không gặp lại tộc vừa đánh, seed khác thứ tự khác', () => {
    const a = campaignFactions(123);
    expect(a).toHaveLength(LEVELS.length);
    expect(campaignFactions(123)).toEqual(a);
    for (let i = 0; i + 8 <= a.length; i += 8) expect(new Set(a.slice(i, i + 8)).size).toBe(8);
    for (let i = 1; i < a.length; i++) expect(a[i]).not.toBe(a[i - 1]);
    const firsts = new Set(Array.from({ length: 40 }, (_, k) => campaignFactions(k)[LEVELS.length - 2]));
    expect(firsts.size).toBe(8);
    expect(campaignLevel(3, 'hard', 123).enemyFaction).toBe(a[3]);
  });

  it('chiến dịch Thường / Khó làm máy mạnh hơn màn gốc', () => {
    LEVELS.forEach((lv, i) => {
      const normal = campaignLevel(i, 'normal').enemy;
      const hard = campaignLevel(i, 'hard').enemy;
      expect(campaignLevel(i, 'easy')).toBe(lv);
      expect(normal.incomeMult!).toBeGreaterThan(lv.enemy.incomeMult!);
      expect(hard.incomeMult!).toBeGreaterThan(normal.incomeMult!);
      expect(hard.statueHp).toBeGreaterThan(normal.statueHp);
      expect(hard.gold).toBeGreaterThan(normal.gold);
    });
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
      one(0, 'spear', 1500, w);
      const v = one(1, victim, 1530, w);
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

describe('Tộc và đội hình', () => {
  const side = (faction: FactionId, unlocked: UnitKind[] = []) => ({ faction, gold: 0, statueHp: 5000, unlocked });

  it('8 tộc, mỗi tộc 12 quân xây được + tháp, chỉ số hợp lệ', () => {
    expect(FACTION_ORDER.length).toBe(8);
    for (const f of FACTION_ORDER) {
      expect(roster(f).length).toBe(12);
      for (const k of [...roster(f), kindOf(f, 'tower')]) {
        const s = UNITS[k];
        expect(s, k).toBeDefined();
        expect(s.faction).toBe(f);
        expect(s.hp).toBeGreaterThan(0);
        expect(s.name.length).toBeGreaterThan(0);
      }
      // Mỗi tộc có điểm yếu thật trong chỉ số và có cách đánh bại
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

  it('cấu hình màn viết theo khung tự đổi sang quân của tộc', () => {
    const w = new World([{ ...side('viking', ['miner', 'sword']), start: ['sword'] }, side('tribe')], seeded(1));
    expect(w.units[0].kind).toBe('viking-sword');
    expect(w.train(0, 'sword')).toBe(false); // không đủ vàng
    w.teams[0].gold = 1000;
    expect(w.train(0, 'sword')).toBe(true);
    expect(w.teams[0].queue[0].kind).toBe('viking-sword');
  });

  it('không có khắc tộc cứng: chọn tộc nào cũng không tự nhiên gây thêm sát thương lên tộc khác', () => {
    const hit = (attacker: FactionId) => {
      const w = new World([side(attacker), side('orc')], seeded(2));
      w.setStance(0, 'attack');
      w.spawn(0, 'sword', 1500).lane = 0.5;
      const v = w.spawn(1, 'spear', 1525);
      v.hp = v.maxHp = 99999;
      w.setStance(1, 'attack');
      run(w, 0.35); // đúng một nhát chém
      return v.maxHp - v.hp;
    };
    // Sát thương thực chỉ tuỳ chỉ số quân (đã gồm nội tại tộc), không tuỳ tộc bị đánh
    const tribe = hit('tribe') / UNITS.sword.damage;
    const elf = hit('elf') / UNITS['elf-sword'].damage;
    expect(tribe / elf).toBeCloseTo(1, 1);
  });

  it('hàng lối: quân nhanh không bỏ quân chậm lại phía sau', () => {
    const spread = (formation: 'free' | 'line') => {
      const w = new World([side('tribe'), side('tribe')], seeded(3));
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
    expect(spread('line')).toBeLessThan(250);
  });

  it('đội hình tấn công không đứng chờ quân tiếp viện mới xây ở nhà', () => {
    for (const formation of ['line', 'spread', 'wedge', 'wall'] as const) {
      const w = new World([side('tribe'), side('tribe')], seeded(6));
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
      const w = new World([side('tribe'), side('tribe')], seeded(6));
      w.setFormation(0, formation);
      for (const k of ['sword', 'sword', 'archer', 'spear'] as UnitKind[]) w.spawn(0, k, 900);
      run(w, 3);
      const late = w.spawn(0, 'sword'); // vừa xây xong, còn ở cạnh tượng nhà
      w.setStance(0, 'attack');
      run(w, 0.1);
      const first = w.teams[0].formX;
      run(w, 5);
      expect(w.teams[0].formX - first, formation).toBeGreaterThan(200);
      // Quân đến muộn đứng sau mọi quân đã có mặt lúc ra lệnh
      const old = w.units.filter((u) => u.team === 0 && u !== late && u.kind !== 'miner');
      const back = (u: Unit) => w.teams[0].formX - w.slotX(u, w.teams[0].formX);
      expect(back(late), formation).toBeGreaterThan(Math.max(...old.map(back)));
    }
  });

  it('hành quân theo đội hình: quân đi đều, không giật cục đi-đứng, không quay lui lúc xuất phát', () => {
    for (const formation of ['line', 'spread', 'wedge', 'wall'] as const) {
      const w = new World([side('tribe'), side('tribe')], seeded(9));
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
    for (const faction of ['tribe', 'steam'] as FactionId[]) {
      for (const formation of ['free', 'line'] as const) {
        const w = new World([side(faction), side('orc')], seeded(4));
        w.setFormation(0, formation);
        const front = w.spawn(0, kindOf(faction, 'spear'), 900);
        front.hp = front.maxHp = 1e6;
        const mage = w.spawn(0, kindOf(faction, 'mage'), 1000); // lỡ đứng trước hàng giáo
        mage.hp = mage.maxHp = 1e6;
        for (const k of ['sword', 'sword', 'spear'] as const) w.spawn(1, kindOf('orc', k), 1500).hp = 1e6;
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
      const w = new World([side('tribe'), side('tribe')], seeded(12));
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
      const w = new World([side('tribe'), side('tribe')], seeded(15));
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
    const w = new World([side('tribe'), side('tribe')], seeded(16));
    w.setHold(0, WORLD_WIDTH);
    expect(w.teams[0].holdX).toBeLessThan(statueX(1) - 200);
    w.setHold(1, 0); // phe phải: cờ cũng không cắm vào tượng phe trái
    expect(w.teams[1].holdX).toBeGreaterThan(statueX(0) + 200);
  });

  it('đội hình: bắn xa đứng hẳn sau cận chiến, quân cùng hàng không đứng chồng lên nhau', () => {
    for (const formation of ['line', 'wedge', 'spread'] as const) {
      const w = new World([side('desert'), side('tribe')], seeded(17));
      w.setFormation(0, formation);
      for (const k of ['spear', 'spear', 'sword', 'archer', 'archer', 'healer'] as const) w.spawn(0, kindOf('desert', k), 900);
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
    const w = new World([side('tribe'), side('tribe')], seeded(13));
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
      const w = new World([side('tribe'), side('tribe')], seeded(18));
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
      const w = new World([side('tribe'), side('tribe')], seeded(19));
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
      const w = new World([side('tribe'), { ...side('tribe'), statueHp: 1e6 }], seeded(21));
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
    const w = new World([side('tribe'), side('tribe')], seeded(22));
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
    const w = new World([side('tribe'), side('tribe')], seeded(23));
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

  it('thợ xây dựng tháp đúng chỗ người chơi chọn (trên sân nhà)', () => {
    const w = new World([{ ...side('tribe', ['builder']), gold: 9999 }, side('tribe')], seeded(24));
    expect(w.train(0, 'builder', 900)).toBe(true);
    expect(w.train(0, 'builder', 3500)).toBe(true); // quá xa: dời về rìa sân nhà
    run(w, 40);
    const towers = w.units.filter((u) => u.team === 0 && u.kind === 'tower').map((u) => Math.round(u.x));
    expect(towers.some((x) => Math.abs(x - 900) <= 5)).toBe(true);
    expect(Math.max(...towers)).toBeLessThanOrEqual(WORLD_WIDTH / 2 - 200);
  });

  it('đội hình xếp quân cùng hàng ra các lane khác nhau, mũi nhọn hẹp ở đầu', () => {
    const lanesOf = (formation: 'line' | 'wedge') => {
      const w = new World([side('tribe'), side('tribe')], seeded(14));
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
    const w = new World([side('tribe', ['miner']), side('tribe')], seeded(7));
    for (const k of ['miner', 'miner', 'sword', 'archer'] as UnitKind[]) w.spawn(0, k);
    w.setCenterMine(0, true);
    run(w, 30);
    const soldiers = () => w.units.filter((u) => u.team === 0 && UNITS[u.kind].arch !== 'miner');
    for (const u of soldiers()) expect(Math.abs(u.x - WORLD_WIDTH / 2)).toBeLessThan(200);
    w.setCenterMine(0, false);
    run(w, 30);
    for (const u of soldiers()) expect(u.x).toBeLessThan(WORLD_WIDTH / 2 - 600);
  });

  it('thợ xây ra dựng tháp canh, tối đa 3 tháp', () => {
    const w = new World([{ ...side('tribe', ['builder']), gold: 5000 }, side('tribe')], seeded(4));
    for (let i = 0; i < 4; i++) w.train(0, 'builder');
    expect(w.teams[0].queue.length).toBe(3);
    run(w, 40);
    const towers = w.units.filter((u) => UNITS[u.kind].arch === 'tower');
    expect(towers.length).toBe(3);
    expect(new Set(towers.map((t) => Math.round(t.x))).size).toBe(3);
  });

  it('tháp canh bắn địch đến gần', () => {
    const w = new World([side('tribe'), side('tribe')], seeded(5));
    const t = w.spawn(0, 'tower', towerX(0, 0));
    t.buildSlot = 0;
    const e = w.spawn(1, 'sword', towerX(0, 0) + 300);
    w.setStance(1, 'garrison');
    run(w, 3);
    expect(e.hp).toBeLessThan(e.maxHp);
  });

  it('cờ hiệu làm quân quanh đó đánh đau hơn', () => {
    const dmg = (withBanner: boolean) => {
      const w = new World([side('tribe'), side('tribe')], seeded(6));
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
    const w = new World([side('undead'), side('tribe')], seeded(7));
    w.spawn(0, 'healer', 1450);
    const victim = w.spawn(1, 'miner', 1500);
    victim.hp = 1;
    const killer = w.spawn(0, 'sword', 1480);
    killer.hp = killer.maxHp = 9999;
    w.setStance(0, 'attack');
    run(w, 2);
    const summon = w.units.find((u) => u.team === 0 && u.lifeT > 0);
    expect(summon?.kind).toBe('undead-sword');
    expect(w.pop(0)).toBe(UNITS['undead-healer'].pop + UNITS['undead-sword'].pop); // quân triệu hồi không tính quân số
  });

  it('goblin đánh bom tự nổ, gây sát thương lan', () => {
    const w = new World([side('orc'), side('tribe')], seeded(8));
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
    const w = new World([side('undead'), side('tribe')], seeded(9));
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
