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

/** Các màn soạn tay: vòng 1 (8 màn mở quân + 3 màn đủ quân) và vòng 2 (11 màn đủ quân). */
const BASE: Level[] = [
  {
    name: 'Trận đầu tiên',
    enemyFaction: 'light',
    intro: 'Cho thợ mỏ đào vàng, xây kiếm sĩ rồi bấm Tấn công để phá tượng địch.',
    player: player(BASIC, 500),
    enemy: { gold: 0, statueHp: 1200, incomeMult: 0.55, unlocked: BASIC, start: ['miner', 'miner'] },
    ai: { miners: 2, mix: { sword: 1 }, attackAt: 750, forceAttackAt: 240, retreatRatio: 0.3 },
  },
  {
    name: 'Mưa tên',
    enemyFaction: 'wood',
    intro: 'Cung thủ bắn từ xa. Cho cung thủ đứng sau hàng kiếm sĩ là mạnh nhất.',
    newUnits: ['archer'],
    player: player(WITH_ARCHER),
    enemy: { gold: 100, statueHp: 1600, incomeMult: 0.62, unlocked: WITH_ARCHER, start: ['miner', 'miner', 'sword'] },
    ai: { miners: 3, mix: { sword: 2, archer: 1 }, attackAt: 1000, forceAttackAt: 220, retreatRatio: 0.3 },
  },
  {
    name: 'Bức tường khiên',
    enemyFaction: 'wind',
    intro: 'Địch đông hơn. Giáo binh giáp dày chịu đòn thay cả đội, thầy thuốc đứng sau hồi máu cho họ.',
    newUnits: ['spear', 'healer'],
    player: player(WITH_SPEAR),
    enemy: { gold: 200, statueHp: 2000, incomeMult: 0.8, unlocked: WITH_SPEAR, start: ['miner', 'miner', 'sword', 'sword'] },
    ai: { miners: 4, mix: { sword: 2, archer: 1, spear: 1 }, attackAt: 1500, forceAttackAt: 210, retreatRatio: 0.3 },
  },
  {
    name: 'Đột kích',
    enemyFaction: 'blood',
    intro:
      'Địch đánh úp rất sớm, có cả kỵ binh! Giữ phòng thủ, dùng giáo binh chặn kỵ, thợ xây dựng trạm vàng cạnh mỏ để có thêm vàng và thêm chốt bắn.',
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
    enemyFaction: 'shadow',
    intro: 'Địch kéo đến rất đông. Pháp sư nổ diện rộng trị đám đông, tay trống làm quân đánh mạnh hơn.',
    newUnits: ['mage', 'banner'],
    player: player(WITH_MAGE, 500),
    enemy: { gold: 300, statueHp: 2600, incomeMult: 0.78, unlocked: WITH_MAGE, start: ['miner', 'miner', 'miner', 'spear'] },
    ai: { miners: 5, mix: { sword: 2, archer: 2, spear: 1, mage: 1 }, attackAt: 2600, forceAttackAt: 240, retreatRatio: 0.35 },
  },
  {
    name: 'Bước chân khổng lồ',
    enemyFaction: 'thunder',
    intro: 'Địch có tường khiên vững. Khổng lồ của bạn đập quét cả hàng.',
    newUnits: ['giant'],
    player: player(WITH_GIANT, 600),
    enemy: { gold: 300, statueHp: 3000, incomeMult: 0.48, unlocked: WITH_GIANT, start: ['miner', 'miner', 'miner', 'archer', 'spear'] },
    ai: { miners: 5, mix: { sword: 2, archer: 2, spear: 1, giant: 1 }, attackAt: 3200, forceAttackAt: 260, retreatRatio: 0.35 },
  },
  {
    name: 'Bóng đêm ám sát',
    enemyFaction: 'crystal',
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
    enemyFaction: 'stone',
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
  // ---------- Đủ quân, mỗi màn máy một lối đánh ----------
  {
    name: 'Phản công chớp nhoáng',
    enemyFaction: 'blood',
    intro: 'Địch dồn quân đánh sớm và liên tục. Giữ nhà bằng trạm vàng và giáo binh, thắng một trận giữ nhà rồi phản công.',
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
    enemyFaction: 'stone',
    intro: 'Địch rùa trong nhà với trạm vàng và khiên. Máy bắn đá bắn xa hơn trạm, pháp sư đốt giáp nặng; phá trạm để cắt vàng của họ.',
    player: player(ALL, 700),
    enemy: {
      gold: 400,
      statueHp: 4200,
      incomeMult: 0.35,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'spear', 'archer', 'builder'],
    },
    ai: {
      wall: { at: 120, dist: 420 },
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
    enemyFaction: 'wood',
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
  // ---------- Vòng 2: Chinh phạt ----------
  {
    name: 'Vó ngựa',
    enemyFaction: 'thunder',
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
    enemyFaction: 'shadow',
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
    enemyFaction: 'wind',
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
    enemyFaction: 'crystal',
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
    name: 'Sói đêm',
    enemyFaction: 'thunder',
    intro: 'Ninja và kỵ binh địch liên tục quấy thợ mỏ. Giữ vài quân canh mỏ, dựng trạm vàng làm chốt bắn.',
    player: player(ALL, 800),
    enemy: {
      gold: 500,
      statueHp: 4200,
      incomeMult: 0.5,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'ninja', 'cavalry'],
    },
    ai: {
      miners: 7,
      mix: { ninja: 3, cavalry: 2, archer: 2, sword: 1 },
      attackAt: 3400,
      forceAttackAt: 200,
      retreatRatio: 0.3,
      centerMine: true,
      formation: 'spread',
    },
  },
  {
    name: 'Gọng kìm',
    enemyFaction: 'blood',
    intro: 'Địch tràn lên rất sớm rồi đánh liên tục không nghỉ. Giữ nhà thật chắc trước khi nghĩ tới phản công.',
    player: player(ALL, 700),
    enemy: { gold: 400, statueHp: 3800, incomeMult: 0.6, unlocked: ALL, start: ['miner', 'miner', 'miner', 'sword', 'sword', 'cavalry'] },
    ai: {
      miners: 5,
      mix: { sword: 3, cavalry: 2, spear: 1, archer: 1, banner: 1 },
      attackAt: 1200,
      forceAttackAt: 110,
      retreatRatio: 0.12,
      formation: 'wedge',
    },
  },
  {
    name: 'Rừng giáo',
    enemyFaction: 'stone',
    intro: 'Tường khiên dày, thầy thuốc hồi máu phía sau, máy bắn đá yểm trợ. Đánh lan và bắn xa để phá thế rùa.',
    player: player(ALL, 800),
    enemy: {
      gold: 500,
      statueHp: 4600,
      incomeMult: 0.4,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'miner', 'spear', 'spear', 'healer'],
    },
    ai: {
      wall: { at: 90, dist: 440 },
      miners: 7,
      mix: { spear: 4, healer: 2, archer: 2, catapult: 1, builder: 1 },
      attackAt: 6200,
      forceAttackAt: 300,
      retreatRatio: 0.45,
      formation: 'wall',
    },
  },
  {
    name: 'Bão phép',
    enemyFaction: 'wood',
    intro: 'Pháp sư và cung thủ địch bắn từ xa sau hàng giáo. Tản đội hình, cho ninja và kỵ binh cắt vào hàng sau.',
    player: player(ALL, 800),
    enemy: {
      gold: 500,
      statueHp: 4400,
      incomeMult: 0.55,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'miner', 'archer', 'archer', 'spear'],
    },
    ai: {
      miners: 7,
      mix: { mage: 3, archer: 3, spear: 2, banner: 1 },
      attackAt: 4800,
      forceAttackAt: 260,
      retreatRatio: 0.35,
      centerMine: true,
      formation: 'line',
    },
  },
  {
    name: 'Bước chân người khổng lồ',
    enemyFaction: 'wind',
    intro: 'Cả đoàn khổng lồ kéo tới cùng tay trống. Cung thủ bắn xuyên giáp dày, đừng để khổng lồ chạm tượng.',
    player: player(ALL, 800),
    enemy: {
      gold: 600,
      statueHp: 4200,
      incomeMult: 0.3,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'miner', 'spear', 'spear'],
    },
    ai: {
      wall: { at: 140, dist: 460 },
      miners: 8,
      mix: { giant: 2, spear: 2, banner: 1, healer: 1, catapult: 1 },
      attackAt: 6000,
      forceAttackAt: 280,
      retreatRatio: 0.35,
      formation: 'line',
    },
  },
  {
    name: 'Đại quân',
    enemyFaction: 'shadow',
    intro: 'Địch giàu, tranh mỏ giữa và xây đủ mọi loại quân. Một trận dài: giữ kinh tế, đánh khi có lợi.',
    player: player(ALL, 900),
    enemy: {
      gold: 600,
      statueHp: 4800,
      incomeMult: 0.36,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'miner', 'sword', 'sword', 'archer', 'spear', 'mage'],
    },
    ai: {
      wall: { at: 150, dist: 480 },
      miners: 8,
      mix: { sword: 3, archer: 2, spear: 2, cavalry: 1, mage: 1, giant: 1, ninja: 1 },
      attackAt: 5200,
      forceAttackAt: 240,
      retreatRatio: 0.35,
      centerMine: true,
      formation: 'spread',
    },
  },
  {
    name: 'Vua chiến trường',
    enemyFaction: 'light',
    intro: 'Trận trùm! Địch đủ mọi loại quân, đánh có đội hình. Kết hợp mọi thứ bạn đã học.',
    player: player(ALL, 900),
    enemy: {
      gold: 600,
      statueHp: 5000,
      incomeMult: 0.42,
      unlocked: ALL,
      start: ['miner', 'miner', 'miner', 'miner', 'miner', 'spear', 'spear', 'archer', 'archer', 'sword', 'sword', 'healer'],
    },
    ai: {
      wall: { at: 120, dist: 460 },
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

/** Số màn mỗi vòng chiến dịch = số hệ đối thủ: mỗi vòng gặp đủ 11 hệ còn lại. */
export const ROUND = FACTION_ORDER.length - 1;

/** Vòng 3 (Thử thách): làm lại các màn vòng 2 nhưng máy giàu hơn, tượng dày hơn, đánh sớm và lì hơn. */
function harder(lv: Level): Level {
  return {
    ...lv,
    name: `${lv.name} (khó)`,
    enemy: {
      ...lv.enemy,
      gold: lv.enemy.gold + 100,
      statueHp: Math.round(lv.enemy.statueHp * 1.15),
      incomeMult: (lv.enemy.incomeMult ?? 1) * 1.05,
    },
    ai: {
      ...lv.ai,
      // Vòng 3: màn nào máy cũng xây tường, màn đã có tường thì xây sớm hơn
      wall: lv.ai.wall ? { ...lv.ai.wall, at: Math.round(lv.ai.wall.at * 0.7) } : { at: 150, dist: 450 },
      attackAt: Math.round(lv.ai.attackAt * 0.95),
      retreatRatio: lv.ai.retreatRatio * 0.9,
    },
  };
}

/** Chiến dịch mỗi hệ: 3 vòng × 11 màn, khó dần; màn cuối mỗi vòng 2 và 3 là trùm. */
/**
 * Độ khó thêm cho máy theo từng màn soạn tay (nhân thu nhập của máy): đo bằng bot người chơi đơn giản,
 * mục tiêu màn thường thắng khoảng 60–70%, màn trùm 25–35%; hai màn đầu để làm quen nên giữ dễ.
 */
const TOUGH = [1, 1.1, 1.15, 1.1, 1.2, 1.2, 1, 1, 1.15, 1.1, 1.2, 1.15, 1.1, 1.15, 1, 1.25, 1.25, 1.1, 1.1, 1.3, 1, 1];
const TUNED = BASE.map((lv, i) => ({ ...lv, enemy: { ...lv.enemy, incomeMult: (lv.enemy.incomeMult ?? 1) * TOUGH[i] } }));

export const LEVELS: Level[] = [...TUNED, ...TUNED.slice(ROUND).map(harder)];

/** Màn trùm: màn cuối vòng 2 và vòng 3. */
export const isBoss = (i: number) => i >= 2 * ROUND - 1 && (i + 1) % ROUND === 0;

export type Difficulty = 'easy' | 'normal' | 'hard';

/** Đấu nhanh với máy: hai bên cùng điều kiện, chỉ khác kinh tế của máy. */
export const SKIRMISH: Record<Difficulty, { label: string; player: TeamSetup; enemy: TeamSetup; ai: AIConfig }> = {
  easy: {
    label: 'Dễ',
    player: { gold: 500, statueHp: 3000, unlocked: ALL, start: ['miner', 'miner', 'sword'] },
    enemy: { gold: 300, statueHp: 3000, incomeMult: 0.6, unlocked: ALL, start: ['miner', 'miner', 'sword'] },
    ai: {
      edge: 1.15,
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
      edge: 1.15,
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
      edge: 1.15,
      miners: 7,
      mix: { sword: 2, archer: 3, ninja: 1, spear: 2, cavalry: 1, healer: 1, mage: 2, catapult: 1, giant: 1 },
      attackAt: 4000,
      forceAttackAt: 260,
      retreatRatio: 0.4,
      centerMine: true,
    },
  },
};

/**
 * Thứ tự hệ địch trong chiến dịch của hệ `player`, xáo theo `seed`: mỗi vòng 11 màn liền nhau gặp đủ
 * 11 hệ còn lại, không bao giờ gặp chính mình, không gặp lại hệ vừa đánh. Mỗi người chơi / mỗi hệ một thứ tự.
 */
export function campaignFactions(player: FactionId, seed: number): FactionId[] {
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
    const block = FACTION_ORDER.filter((f) => f !== player);
    for (let i = block.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [block[i], block[j]] = [block[j], block[i]];
    }
    if (block[0] === out[out.length - 1]) [block[0], block[1]] = [block[1], block[0]];
    out.push(...block);
  }
  return out.slice(0, LEVELS.length);
}

/** Màn `index` trong chiến dịch của hệ `player`, hệ địch lấy theo thứ tự xáo từ `seed`. */
export function campaignLevel(index: number, player: FactionId, seed = 1): Level {
  return { ...LEVELS[index], enemyFaction: campaignFactions(player, seed)[index] };
}
