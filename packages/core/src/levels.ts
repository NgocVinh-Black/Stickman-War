import type { AIConfig } from './ai';
import { FACTION_ORDER, type FactionId } from './factions';
import type { Arch, UnitKind } from './units';
import type { TeamSetup } from './world';

export type Level = {
  name: string;
  intro: string;
  newUnits?: Arch[];
  enemyFaction?: FactionId;
  player: TeamSetup;
  enemy: TeamSetup;
  ai: AIConfig;
};

const BASIC: UnitKind[] = ['miner', 'sword'];
const WITH_ARCHER: UnitKind[] = [...BASIC, 'archer'];
const WITH_SPEAR: UnitKind[] = [...WITH_ARCHER, 'spear', 'healer'];
const WITH_CAV: UnitKind[] = [...WITH_SPEAR, 'cavalry', 'builder'];
const WITH_MAGE: UnitKind[] = [...WITH_CAV, 'mage', 'banner'];
const WITH_GIANT: UnitKind[] = [...WITH_MAGE, 'giant'];
const WITH_NINJA: UnitKind[] = [...WITH_GIANT, 'ninja'];
const ALL: UnitKind[] = [...WITH_NINJA, 'catapult'];

const player = (unlocked: UnitKind[], gold = 400): TeamSetup => ({
  gold,
  statueHp: 2500,
  unlocked,
  start: ['miner', 'miner', 'sword'],
});

export const LEVELS: Level[] = [
  {
    name: 'Trận đầu tiên',
    enemyFaction: 'tribe',
    intro: 'Cho thợ mỏ đào vàng, xây kiếm sĩ rồi bấm Tấn công để phá tượng địch.',
    player: player(BASIC, 500),
    enemy: { gold: 0, statueHp: 1200, incomeMult: 0.55, unlocked: BASIC, start: ['miner', 'miner'] },
    ai: { miners: 2, mix: { sword: 1 }, attackAt: 750, forceAttackAt: 240, retreatRatio: 0.3 },
  },
  {
    name: 'Mưa tên',
    enemyFaction: 'elf',
    intro: 'Cung thủ bắn từ xa. Cho cung thủ đứng sau hàng kiếm sĩ là mạnh nhất.',
    newUnits: ['archer'],
    player: player(WITH_ARCHER),
    enemy: { gold: 100, statueHp: 1600, incomeMult: 0.62, unlocked: WITH_ARCHER, start: ['miner', 'miner', 'sword'] },
    ai: { miners: 3, mix: { sword: 2, archer: 1 }, attackAt: 1000, forceAttackAt: 220, retreatRatio: 0.3 },
  },
  {
    name: 'Bức tường khiên',
    enemyFaction: 'orc',
    intro: 'Địch đông hơn. Giáo binh giáp dày chịu đòn thay cả đội, thầy thuốc đứng sau hồi máu cho họ.',
    newUnits: ['spear', 'healer'],
    player: player(WITH_SPEAR),
    enemy: { gold: 200, statueHp: 2000, incomeMult: 0.8, unlocked: WITH_SPEAR, start: ['miner', 'miner', 'sword', 'sword'] },
    ai: { miners: 4, mix: { sword: 2, archer: 1, spear: 1 }, attackAt: 1500, forceAttackAt: 210, retreatRatio: 0.3 },
  },
  {
    name: 'Đột kích',
    enemyFaction: 'viking',
    intro: 'Địch đánh úp rất sớm, có cả kỵ binh! Giữ phòng thủ, dùng giáo binh chặn kỵ, thợ xây dựng tháp canh trước nhà.',
    newUnits: ['cavalry', 'builder'],
    player: { ...player(WITH_CAV, 600), start: ['miner', 'miner', 'sword', 'sword'] },
    enemy: {
      gold: 300,
      statueHp: 2200,
      incomeMult: 0.7,
      unlocked: WITH_CAV,
      start: ['miner', 'miner', 'miner', 'sword', 'sword'],
    },
    ai: { miners: 4, mix: { sword: 3, archer: 1, cavalry: 1 }, attackAt: 700, forceAttackAt: 75, retreatRatio: 0.2 },
  },
  {
    name: 'Phép thuật',
    enemyFaction: 'undead',
    intro: 'Địch kéo đến rất đông. Pháp sư nổ diện rộng trị đám đông, tay trống làm quân đánh mạnh hơn.',
    newUnits: ['mage', 'banner'],
    player: player(WITH_MAGE, 500),
    enemy: { gold: 300, statueHp: 2600, incomeMult: 0.78, unlocked: WITH_MAGE, start: ['miner', 'miner', 'miner', 'spear'] },
    ai: { miners: 5, mix: { sword: 2, archer: 2, spear: 1, mage: 1 }, attackAt: 2600, forceAttackAt: 240, retreatRatio: 0.35 },
  },
  {
    name: 'Bước chân khổng lồ',
    enemyFaction: 'samurai',
    intro: 'Địch có tường khiên vững. Khổng lồ của bạn đập quét cả hàng.',
    newUnits: ['giant'],
    player: player(WITH_GIANT, 600),
    enemy: { gold: 300, statueHp: 3000, incomeMult: 0.48, unlocked: WITH_GIANT, start: ['miner', 'miner', 'miner', 'archer', 'spear'] },
    ai: { miners: 5, mix: { sword: 2, archer: 2, spear: 1, giant: 1 }, attackAt: 3200, forceAttackAt: 260, retreatRatio: 0.35 },
  },
  {
    name: 'Bóng đêm ám sát',
    enemyFaction: 'desert',
    intro: 'Địch giàu vàng, tượng dày, còn tranh mỏ kim cương giữa bản đồ. Ninja lướt qua tiền tuyến ám sát thợ mỏ và cung thủ của chúng.',
    newUnits: ['ninja'],
    player: player(WITH_NINJA, 600),
    enemy: {
      gold: 400,
      statueHp: 3500,
      incomeMult: 0.62,
      unlocked: WITH_NINJA,
      start: ['miner', 'miner', 'miner', 'miner', 'sword', 'archer', 'spear'],
    },
    ai: {
      miners: 6,
      mix: { sword: 2, archer: 2, spear: 2, cavalry: 1, mage: 1, giant: 1 },
      attackAt: 4000,
      forceAttackAt: 240,
      retreatRatio: 0.35,
      centerMine: true,
    },
  },
  {
    name: 'Công thành',
    enemyFaction: 'steam',
    intro: 'Đủ mọi loại quân! Máy bắn đá phá tượng gấp 3 nhưng cần quân che chắn.',
    newUnits: ['catapult'],
    player: player(ALL, 800),
    enemy: {
      gold: 300,
      statueHp: 3600,
      incomeMult: 0.4,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'miner', 'spear', 'archer', 'archer', 'sword', 'sword'],
    },
    ai: {
      miners: 7,
      mix: { sword: 2, archer: 3, spear: 2, ninja: 1, mage: 2, giant: 1 },
      attackAt: 5000,
      forceAttackAt: 220,
      retreatRatio: 0.4,
      centerMine: true,
    },
  },
  // ---------- Chinh phạt: đủ quân, mỗi màn máy một lối đánh ----------
  {
    name: 'Phản công chớp nhoáng',
    enemyFaction: 'viking',
    intro: 'Địch dồn quân đánh sớm và liên tục. Giữ nhà bằng tháp canh và giáo binh, thắng một trận giữ nhà rồi phản công.',
    player: player(ALL, 700),
    enemy: { gold: 300, statueHp: 3000, incomeMult: 0.64, unlocked: ALL, start: ['miner', 'miner', 'miner', 'sword', 'sword'] },
    ai: {
      miners: 4,
      mix: { sword: 3, cavalry: 2, archer: 1, ninja: 1 },
      attackAt: 900,
      forceAttackAt: 100,
      retreatRatio: 0.15,
      formation: 'wedge',
    },
  },
  {
    name: 'Pháo đài',
    enemyFaction: 'steam',
    intro: 'Địch rùa trong nhà với tháp canh và khiên. Máy bắn đá bắn xa hơn tháp, pháp sư đốt giáp nặng.',
    player: player(ALL, 700),
    enemy: {
      gold: 400,
      statueHp: 4200,
      incomeMult: 0.5,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'spear', 'archer', 'builder'],
    },
    ai: {
      miners: 6,
      mix: { spear: 3, archer: 3, builder: 1, healer: 1, catapult: 1 },
      attackAt: 6000,
      forceAttackAt: 330,
      retreatRatio: 0.45,
      formation: 'wall',
    },
  },
  {
    name: 'Mưa tên lửa',
    enemyFaction: 'elf',
    intro: 'Địch toàn quân bắn xa. Kỵ binh và ninja lao vào hàng sau, đội hình Tản rộng đỡ phép nổ.',
    player: player(ALL, 700),
    enemy: {
      gold: 400,
      statueHp: 3600,
      incomeMult: 0.55,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'archer', 'archer', 'spear'],
    },
    ai: {
      miners: 6,
      mix: { archer: 4, mage: 2, spear: 2, healer: 1 },
      attackAt: 4200,
      forceAttackAt: 260,
      retreatRatio: 0.35,
      formation: 'line',
    },
  },
  {
    name: 'Vó ngựa',
    enemyFaction: 'samurai',
    intro: 'Kỵ binh địch phi tới cực nhanh. Giáo binh đâm kỵ ×2, đội hình Tường khiên giữ hàng trước.',
    player: player(ALL, 700),
    enemy: { gold: 400, statueHp: 3600, incomeMult: 0.6, unlocked: ALL, start: ['miner', 'miner', 'miner', 'miner', 'cavalry', 'cavalry'] },
    ai: {
      miners: 6,
      mix: { cavalry: 4, sword: 2, archer: 1, banner: 1 },
      attackAt: 3000,
      forceAttackAt: 200,
      retreatRatio: 0.3,
      formation: 'wedge',
    },
  },
  {
    name: 'Biển người',
    enemyFaction: 'undead',
    intro: 'Địch xây thật đông quân rẻ. Pháp sư và khổng lồ đánh lan quét sạch đám đông.',
    player: player(ALL, 700),
    enemy: {
      gold: 500,
      statueHp: 3800,
      incomeMult: 0.68,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'sword', 'sword', 'sword', 'sword'],
    },
    ai: { miners: 7, mix: { sword: 5, archer: 2, spear: 1 }, attackAt: 3600, forceAttackAt: 240, retreatRatio: 0.3, formation: 'spread' },
  },
  {
    name: 'Đoàn quân thép thịt',
    enemyFaction: 'orc',
    intro: 'Địch kéo khổng lồ và quân trâu. Cung thủ bắn xuyên khổng lồ, cắm cờ lùi dần để thả diều.',
    player: player(ALL, 700),
    enemy: { gold: 500, statueHp: 4000, incomeMult: 0.46, unlocked: ALL, start: ['miner', 'miner', 'miner', 'miner', 'spear'] },
    ai: {
      miners: 7,
      mix: { giant: 2, spear: 2, sword: 2, healer: 1, banner: 1 },
      attackAt: 5200,
      forceAttackAt: 280,
      retreatRatio: 0.35,
      formation: 'line',
    },
  },
  {
    name: 'Tranh mỏ kim cương',
    enemyFaction: 'desert',
    intro: 'Địch chiếm mỏ kim cương giữa bản đồ từ sớm. Đánh chiếm giữa bản đồ, ninja quấy thợ mỏ của chúng.',
    player: player(ALL, 800),
    enemy: {
      gold: 500,
      statueHp: 4200,
      incomeMult: 0.47,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'miner', 'sword', 'archer', 'spear'],
    },
    ai: {
      miners: 8,
      mix: { sword: 2, archer: 2, spear: 2, cavalry: 1, mage: 1, healer: 1, giant: 1 },
      attackAt: 4800,
      forceAttackAt: 240,
      retreatRatio: 0.35,
      centerMine: true,
    },
  },
  {
    name: 'Trận chiến cuối cùng',
    enemyFaction: 'tribe',
    intro: 'Trận cuối! Địch đủ mọi loại quân, đánh có đội hình. Kết hợp mọi thứ bạn đã học.',
    player: player(ALL, 900),
    enemy: {
      gold: 600,
      statueHp: 5000,
      incomeMult: 0.48,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'miner', 'spear', 'spear', 'archer', 'archer', 'sword', 'sword', 'healer'],
    },
    ai: {
      miners: 8,
      mix: { sword: 2, archer: 3, spear: 2, ninja: 1, cavalry: 1, healer: 1, mage: 2, giant: 1, catapult: 1, banner: 1 },
      attackAt: 6000,
      forceAttackAt: 220,
      retreatRatio: 0.4,
      centerMine: true,
      formation: 'line',
    },
  },
];

export type Difficulty = 'easy' | 'normal' | 'hard';

/** Đấu nhanh với máy: hai bên cùng điều kiện, chỉ khác kinh tế của máy. */
export const SKIRMISH: Record<Difficulty, { label: string; player: TeamSetup; enemy: TeamSetup; ai: AIConfig }> = {
  easy: {
    label: 'Dễ',
    player: { gold: 500, statueHp: 3000, unlocked: ALL, start: ['miner', 'miner', 'sword'] },
    enemy: { gold: 300, statueHp: 3000, incomeMult: 0.6, unlocked: ALL, start: ['miner', 'miner', 'sword'] },
    ai: {
      miners: 5,
      mix: { sword: 3, archer: 2, spear: 1, cavalry: 1, healer: 1, mage: 1, giant: 1 },
      attackAt: 2500,
      forceAttackAt: 360,
      retreatRatio: 0.35,
    },
  },
  normal: {
    label: 'Thường',
    player: { gold: 500, statueHp: 3000, unlocked: ALL, start: ['miner', 'miner', 'sword'] },
    enemy: { gold: 500, statueHp: 3000, incomeMult: 0.8, unlocked: ALL, start: ['miner', 'miner', 'sword'] },
    ai: {
      miners: 6,
      mix: { sword: 2, archer: 2, ninja: 1, spear: 2, cavalry: 1, healer: 1, mage: 1, giant: 1 },
      attackAt: 3200,
      forceAttackAt: 300,
      retreatRatio: 0.35,
      centerMine: true,
    },
  },
  hard: {
    label: 'Khó',
    player: { gold: 500, statueHp: 3000, unlocked: ALL, start: ['miner', 'miner', 'sword'] },
    enemy: { gold: 600, statueHp: 3000, incomeMult: 1, unlocked: ALL, start: ['miner', 'miner', 'miner', 'sword'] },
    ai: {
      miners: 7,
      mix: { sword: 2, archer: 3, ninja: 1, spear: 2, cavalry: 1, healer: 1, mage: 2, catapult: 1, giant: 1 },
      attackAt: 4000,
      forceAttackAt: 260,
      retreatRatio: 0.4,
      centerMine: true,
    },
  },
};

/** Chiến dịch chơi lại ở mức Thường / Khó: cùng 16 màn, máy giàu hơn, đông hơn, đánh sớm hơn. */
export type CampaignDiff = {
  label: string;
  incomeMult: number; // nhân tốc độ kiếm vàng của máy
  gold: number; // vàng ban đầu cộng thêm cho máy
  hpMult: number; // nhân máu tượng máy
  start: UnitKind[]; // quân ban đầu cộng thêm cho máy
  miners: number; // thợ mỏ máy muốn giữ cộng thêm
  attackMult: number; // nhân ngưỡng quân để máy tấn công
  forceMult: number; // nhân mốc giờ máy buộc phải đánh
  retreatMult: number; // nhân tỉ lệ rút lui (nhỏ hơn = lì đòn hơn)
};

export const CAMPAIGN: Record<Difficulty, CampaignDiff> = {
  easy: { label: 'Dễ', incomeMult: 1, gold: 0, hpMult: 1, start: [], miners: 0, attackMult: 1, forceMult: 1, retreatMult: 1 },
  normal: {
    label: 'Thường',
    incomeMult: 1.12,
    gold: 100,
    hpMult: 1.1,
    start: ['miner'],
    miners: 0,
    attackMult: 0.95,
    forceMult: 0.9,
    retreatMult: 0.9,
  },
  hard: {
    label: 'Khó',
    incomeMult: 1.15,
    gold: 200,
    hpMult: 1.15,
    start: ['miner', 'miner'],
    miners: 0,
    attackMult: 0.9,
    forceMult: 0.9,
    retreatMult: 0.8,
  },
};

export const DIFFS: Difficulty[] = ['easy', 'normal', 'hard'];

/**
 * Thứ tự tộc địch của một lượt chiến dịch, xáo theo `seed`: mỗi 8 màn liền nhau gặp đủ 8 tộc,
 * không màn nào gặp lại đúng tộc vừa đánh. Mỗi người chơi / mỗi mức khó một thứ tự khác nhau.
 */
export function campaignFactions(seed: number): FactionId[] {
  let r = seed >>> 0;
  const rand = () => {
    // mulberry32: seed gần nhau vẫn ra thứ tự khác hẳn nhau
    r = (r + 0x6d2b79f5) >>> 0;
    let t = r;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const out: FactionId[] = [];
  while (out.length < LEVELS.length) {
    const block = [...FACTION_ORDER];
    for (let i = block.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [block[i], block[j]] = [block[j], block[i]];
    }
    if (block[0] === out[out.length - 1]) [block[0], block[1]] = [block[1], block[0]];
    out.push(...block);
  }
  return out.slice(0, LEVELS.length);
}

/** Màn `index` của chiến dịch ở độ khó `diff`, tộc địch lấy theo thứ tự xáo từ `seed` (nếu có). */
export function campaignLevel(index: number, diff: Difficulty, seed?: number): Level {
  const base = LEVELS[index];
  const lv = seed === undefined ? base : { ...base, enemyFaction: campaignFactions(seed)[index] };
  if (diff === 'easy') return lv;
  const d = CAMPAIGN[diff];
  const w = 1 - (0.6 * index) / (LEVELS.length - 1);
  const mul = (m: number) => 1 + (m - 1) * w;
  return {
    ...lv,
    enemy: {
      ...lv.enemy,
      gold: lv.enemy.gold + Math.round(d.gold * w),
      statueHp: Math.round(lv.enemy.statueHp * mul(d.hpMult)),
      incomeMult: (lv.enemy.incomeMult ?? 1) * mul(d.incomeMult),
      start: [...(lv.enemy.start ?? []), ...d.start.slice(0, Math.floor(d.start.length * w + 0.01))],
    },
    ai: {
      ...lv.ai,
      miners: lv.ai.miners + d.miners,
      attackAt: Math.round(lv.ai.attackAt * mul(d.attackMult)),
      forceAttackAt: Math.round(lv.ai.forceAttackAt * mul(d.forceMult)),
      retreatRatio: lv.ai.retreatRatio * mul(d.retreatMult),
    },
  };
}
