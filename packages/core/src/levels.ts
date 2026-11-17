import type { AIConfig } from './ai';
import type { FactionId } from './factions';
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
    name: 'Bộ lạc láng giềng',
    enemyFaction: 'tribe',
    intro: 'Cho thợ mỏ đào vàng, xây kiếm sĩ rồi bấm Tấn công để phá tượng địch.',
    player: player(BASIC, 500),
    enemy: { gold: 0, statueHp: 1200, incomeMult: 0.55, unlocked: BASIC, start: ['miner', 'miner'] },
    ai: { miners: 2, mix: { sword: 1 }, attackAt: 750, forceAttackAt: 240, retreatRatio: 0.3 },
  },
  {
    name: 'Mưa tên',
    enemyFaction: 'elf',
    intro: 'Thần Rừng bắn tên rất xa và tự hồi máu. Cung thủ của bạn đứng sau hàng kiếm sĩ là mạnh nhất.',
    newUnits: ['archer'],
    player: player(WITH_ARCHER),
    enemy: { gold: 100, statueHp: 1600, incomeMult: 0.62, unlocked: WITH_ARCHER, start: ['miner', 'miner', 'sword'] },
    ai: { miners: 3, mix: { sword: 2, archer: 1 }, attackAt: 1000, forceAttackAt: 220, retreatRatio: 0.3 },
  },
  {
    name: 'Bức tường khiên',
    enemyFaction: 'orc',
    intro: 'Thú Nhân to xác, trâu bò. Giáo binh giáp dày chịu đòn thay cả đội, thầy thuốc đứng sau hồi máu cho họ.',
    newUnits: ['spear', 'healer'],
    player: player(WITH_SPEAR),
    enemy: { gold: 200, statueHp: 2000, incomeMult: 0.8, unlocked: WITH_SPEAR, start: ['miner', 'miner', 'sword', 'sword'] },
    ai: { miners: 4, mix: { sword: 2, archer: 1, spear: 1 }, attackAt: 1500, forceAttackAt: 210, retreatRatio: 0.3 },
  },
  {
    name: 'Đột kích',
    enemyFaction: 'viking',
    intro: 'Viking đánh úp rất sớm, có cả kỵ sĩ sói! Giữ phòng thủ, dùng giáo binh chặn kỵ, thợ xây dựng tháp canh trước nhà.',
    newUnits: ['cavalry', 'builder'],
    player: { ...player(WITH_CAV, 600), start: ['miner', 'miner', 'sword', 'sword'] },
    enemy: {
      gold: 300,
      statueHp: 2200,
      incomeMult: 0.9,
      unlocked: WITH_CAV,
      start: ['miner', 'miner', 'miner', 'sword', 'sword', 'sword'],
    },
    ai: { miners: 4, mix: { sword: 3, archer: 1, cavalry: 1 }, attackAt: 700, forceAttackAt: 75, retreatRatio: 0.2 },
  },
  {
    name: 'Phép thuật',
    enemyFaction: 'undead',
    intro: 'Tộc Xương đông như kiến, hạ quân là có vàng. Pháp sư nổ diện rộng trị đám đông, tay trống làm quân đánh mạnh hơn.',
    newUnits: ['mage', 'banner'],
    player: player(WITH_MAGE, 500),
    enemy: { gold: 300, statueHp: 2600, incomeMult: 0.86, unlocked: WITH_MAGE, start: ['miner', 'miner', 'miner', 'spear'] },
    ai: { miners: 5, mix: { sword: 2, archer: 2, spear: 1, mage: 1 }, attackAt: 2600, forceAttackAt: 240, retreatRatio: 0.35 },
  },
  {
    name: 'Bước chân khổng lồ',
    enemyFaction: 'samurai',
    intro: 'Samurai Phù Tang ra đòn đầu chí mạng, shinobi tàng hình. Khổng lồ của bạn đập quét cả hàng.',
    newUnits: ['giant'],
    player: player(WITH_GIANT, 600),
    enemy: { gold: 300, statueHp: 3000, incomeMult: 0.48, unlocked: WITH_GIANT, start: ['miner', 'miner', 'miner', 'archer', 'spear'] },
    ai: { miners: 5, mix: { sword: 2, archer: 2, spear: 1, giant: 1 }, attackAt: 3200, forceAttackAt: 260, retreatRatio: 0.35 },
  },
  {
    name: 'Liên minh phương Đông',
    enemyFaction: 'desert',
    intro: 'Sa Mạc giàu vàng, tượng dày, còn tranh mỏ giữa bản đồ. Ninja lướt qua tiền tuyến ám sát thợ mỏ của chúng.',
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
    name: 'Đế Chế Sắt',
    enemyFaction: 'steam',
    intro: 'Trận cuối! Đế Chế Sắt giáp dày, súng hoả mai và đại bác. Máy bắn đá phá tượng gấp 3 nhưng cần quân che chắn.',
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

/** Chiến dịch chơi lại ở mức Thường / Khó: cùng 8 màn, máy giàu hơn, đông hơn, đánh sớm hơn. */
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
 * Màn `index` của chiến dịch ở độ khó `diff` (Dễ giữ nguyên màn gốc).
 * Các màn cuối vốn đã mạnh nên phần cộng thêm giảm dần, màn cuối chỉ còn 40%.
 */
export function campaignLevel(index: number, diff: Difficulty): Level {
  const lv = LEVELS[index];
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
