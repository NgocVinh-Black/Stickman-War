import { describe, expect, it } from 'vitest';
import { EnemyAI } from './ai';
import { campaignLevel, CAMPAIGN, LEVELS, SKIRMISH } from './levels';
import { FACTIONS, FACTION_ORDER, type FactionId } from './factions';
import { UNITS, kindOf, roster, type UnitKind } from './units';
import { statueX, towerX, World, WORLD_WIDTH } from './world';

function seeded(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const DT = 1 / 30;

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
  it('mọi màn đều có thể thắng bằng lối chơi hợp lý', () => {
    LEVELS.forEach((lv, i) => {
      // Màn cuối là trùm: chỉ cần thắng được ít nhất 1/5 trận
      const last = i === LEVELS.length - 1;
      const seeds = last ? [11, 22, 33, 44, 55] : [11, 22, 33];
      let wins = 0;
      for (const seed of seeds) {
        const w = new World([lv.player, { ...lv.enemy, faction: lv.enemyFaction }], seeded(seed));
        const ai = new EnemyAI(lv.ai);
        const bot = playerBot(i);
        run(w, 1200, (world) => {
          bot(world);
          ai.update(world, DT);
        });
        if (w.winner === 0) wins++;
      }
      expect(wins, `màn ${i + 1}`).toBeGreaterThanOrEqual(last ? 1 : 2);
    });
  }, 60_000);

  it('chiến dịch Thường và Khó: mọi màn vẫn thắng được', () => {
    const seeds = [11, 22, 33, 44, 55, 66, 77, 88];
    for (const diff of ['normal', 'hard'] as const) {
      LEVELS.forEach((_, i) => {
        const lv = campaignLevel(i, diff);
        const last = i === LEVELS.length - 1;
        let wins = 0;
        for (const seed of seeds) {
          const w = new World([lv.player, { ...lv.enemy, faction: lv.enemyFaction }], seeded(seed));
          const ai = new EnemyAI(lv.ai);
          const bot = playerBot(i);
          run(w, 1200, (world) => {
            bot(world);
            ai.update(world, DT);
          });
          if (w.winner === 0) wins++;
        }
        // Màn trùm: bot đơn giản chỉ cần thắng được 1/8 trận
        expect(wins, `${CAMPAIGN[diff].label} màn ${i + 1}`).toBeGreaterThanOrEqual(last ? 1 : 4);
      });
    }
  }, 180_000);

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

  it('bật mỏ giữa: một nửa thợ mỏ sang mỏ giữa và mang về nhiều vàng hơn', () => {
    const w = new World(
      [
        { gold: 0, statueHp: 1000, unlocked: ['miner'], start: ['miner', 'miner'] },
        { gold: 0, statueHp: 1000, unlocked: [] },
      ],
      seeded(8),
    );
    w.setCenterMine(0, true);
    run(w, 1);
    const toCenter = w.units.filter((u) => u.toCenter);
    expect(toCenter.length).toBe(1);
    run(w, 60);
    expect(toCenter[0].x).toBeGreaterThan(WORLD_WIDTH / 2 - 400);
    expect(w.teams[0].gold).toBeGreaterThan(100);
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
      // Mỗi tộc khắc 2 tộc và bị 2 tộc khắc
      expect(FACTIONS[f].counters.length).toBe(2);
      expect(FACTION_ORDER.filter((x) => FACTIONS[x].counters.includes(f)).length).toBe(2);
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

  it('tộc khắc gây thêm 20% sát thương', () => {
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
    // Bộ Lạc khắc Thú Nhân; Phù Tang thì không (và Phù Tang có nhất kích ×2.6) → so với tộc trung tính
    const tribe = hit('tribe') / UNITS.sword.damage;
    const elf = hit('elf') / UNITS['elf-sword'].damage;
    expect(tribe / elf).toBeCloseTo(1.2, 1);
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
