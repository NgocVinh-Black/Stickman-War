import { FACTIONS, FACTION_ORDER, type FactionId, type Look } from './factions';

export type Team = 0 | 1; // 0 = người chơi, 1 = địch
/** Khung quân: quyết định cách hành xử và dáng vẽ. Mỗi tộc có một bản riêng của từng khung. */
export type Arch =
  | 'miner'
  | 'sword'
  | 'archer'
  | 'ninja'
  | 'spear'
  | 'cavalry'
  | 'healer'
  | 'banner'
  | 'mage'
  | 'catapult'
  | 'giant'
  | 'builder'
  | 'tower'
  | 'wall';
/** Mã loại quân: Thánh Quang Điện (tribe) dùng đúng tên khung ('sword'), tộc khác thêm tiền tố ('viking-sword'). */
export type UnitKind = string;
export type Stance = 'defend' | 'attack' | 'garrison' | 'hold';
export type Formation = 'free' | 'line' | 'spread' | 'wedge' | 'wall';

/** Kiểu đòn đánh: quyết định hệ số sát thương lên từng kiểu giáp (bảng DAMAGE_TABLE). */
export type DamageType = 'slash' | 'pierce' | 'arrow' | 'magic' | 'blunt' | 'siege' | 'none';
/** Kiểu giáp của quân. */
export type ArmorType = 'light' | 'heavy' | 'mounted' | 'giant';
export type ProjectileKind =
  'arrow' | 'bullet' | 'bolt' | 'axe' | 'boulder' | 'cannonball' | 'fireball' | 'poison' | 'spark' | 'sun' | 'wind';
/** Đạn đơn mục tiêu; còn lại nổ diện rộng khi rơi xuống. */
export const SINGLE_SHOTS: ProjectileKind[] = ['arrow', 'bullet', 'bolt', 'axe'];

export type Aura = { radius: number; dmg: number; haste: number };

export type UnitStats = {
  arch: Arch;
  faction: FactionId;
  name: string;
  desc: string;
  /** Mô tả khắc chế tự sinh từ kiểu đòn / giáp. */
  counter: string;
  cost: number;
  pop: number;
  trainTime: number; // giây
  hp: number;
  speed: number; // đơn vị thế giới / giây
  damage: number;
  range: number;
  cooldown: number;
  windup: number; // thời điểm gây sát thương trong động tác đánh
  scale: number;
  dmgType: DamageType;
  armorType: ArmorType;
  look: Look;
  armor?: number; // giảm sát thương 0..1
  splash?: number; // bán kính sát thương lan
  projectile?: ProjectileKind;
  minRange?: number; // không bắn được mục tiêu quá gần (máy bắn đá)
  heal?: number; // lượng máu hồi mỗi lần
  healAoe?: number; // hồi cho cả nhóm trong bán kính này
  raise?: UnitKind; // gọi xác chết dậy thành loại quân này (thay cho hồi máu)
  aura?: Aura; // cờ hiệu: quân mình quanh đó mạnh hơn
  backline?: boolean; // đứng hàng sau khi phòng thủ
  blink?: boolean; // lướt tới mục tiêu
  charge?: boolean; // phi càng xa đâm càng đau
  chargeSplash?: number; // cú lao tới gây sát thương lan (chiến xa)
  stealth?: boolean; // tàng hình khi không ra đòn
  siegeOnly?: boolean; // chỉ đánh tượng
  kamikaze?: boolean; // nổ tung khi ra đòn
  rage?: number; // sát thương thêm khi mất máu (cộng với nội tại tộc)
  lifesteal?: number;
  slow?: number; // giây làm chậm mục tiêu
  poison?: { dps: number; dur: number };
  regen?: number; // hồi máu / giây luôn luôn
  knock?: number; // hất lùi
  spawnCount?: number; // mỗi lần xây ra bao nhiêu con
  mineTime?: number; // thợ mỏ: thời gian đào một lần
  build?: UnitKind; // thợ xây: dựng thành loại này
  stationary?: boolean; // tháp: không di chuyển
  /** Tường thành có cổng: chặn quân địch (phải phá mới qua), quân mình đi qua cổng; không tự đánh. */
  wall?: boolean;
  /** Giây thợ mỏ cần để dựng công trình này (tường). */
  buildTime?: number;
  /** Gai / lửa / băng trên tường: quân cận chiến đánh vào thì bị đâm lại, đốt hoặc làm chậm. */
  thorns?: { dmg: number; burn?: number; slow?: number };
};

/** Thứ tự nút xây quân (phím 1–9, 0, -, =). Tháp không xây trực tiếp mà do thợ xây dựng. */
export const ARCH_ORDER: Arch[] = [
  'miner',
  'sword',
  'archer',
  'ninja',
  'spear',
  'cavalry',
  'healer',
  'banner',
  'mage',
  'catapult',
  'giant',
  'builder',
];
export const ALL_ARCHS: Arch[] = [...ARCH_ORDER, 'tower', 'wall'];

type Base = Omit<UnitStats, 'arch' | 'faction' | 'name' | 'desc' | 'counter' | 'look'>;

/** Chỉ số gốc của từng khung (chính là quân Thánh Quang Điện (tribe) trước khi áp nội tại tộc). */
const BASE: Record<Arch, Base> = {
  miner: {
    cost: 150,
    pop: 1,
    trainTime: 3,
    hp: 80,
    speed: 75,
    damage: 4,
    range: 22,
    cooldown: 1.2,
    windup: 0.4,
    scale: 1,
    dmgType: 'slash',
    armorType: 'light',
  },
  sword: {
    cost: 125,
    pop: 1,
    trainTime: 3.5,
    hp: 120,
    speed: 90,
    damage: 18,
    range: 26,
    cooldown: 0.9,
    windup: 0.3,
    scale: 1,
    dmgType: 'slash',
    armorType: 'light',
  },
  archer: {
    cost: 300,
    pop: 2,
    trainTime: 4.5,
    hp: 90,
    speed: 78,
    damage: 17,
    range: 380,
    cooldown: 1.7,
    windup: 0.6,
    scale: 1,
    projectile: 'arrow',
    dmgType: 'arrow',
    armorType: 'light',
    backline: true,
  },
  ninja: {
    cost: 300,
    pop: 2,
    trainTime: 5,
    hp: 90,
    speed: 120,
    damage: 22,
    range: 24,
    cooldown: 0.9,
    windup: 0.2,
    scale: 0.95,
    dmgType: 'slash',
    armorType: 'light',
    blink: true,
  },
  spear: {
    cost: 500,
    pop: 3,
    trainTime: 6,
    hp: 450,
    speed: 62,
    damage: 32,
    range: 42,
    cooldown: 1.4,
    windup: 0.45,
    scale: 1.15,
    armor: 0.25,
    dmgType: 'pierce',
    armorType: 'heavy',
  },
  cavalry: {
    cost: 450,
    pop: 3,
    trainTime: 6,
    hp: 330,
    speed: 150,
    damage: 26,
    range: 32,
    cooldown: 1.1,
    windup: 0.25,
    scale: 1.1,
    dmgType: 'slash',
    armorType: 'mounted',
    charge: true,
  },
  healer: {
    cost: 350,
    pop: 2,
    trainTime: 5,
    hp: 110,
    speed: 72,
    damage: 0,
    heal: 22,
    range: 170,
    cooldown: 1.3,
    windup: 0.5,
    scale: 1,
    dmgType: 'none',
    armorType: 'light',
    backline: true,
  },
  banner: {
    cost: 300,
    pop: 2,
    trainTime: 5,
    hp: 150,
    speed: 74,
    damage: 0,
    range: 0,
    cooldown: 1,
    windup: 0.3,
    scale: 1,
    dmgType: 'none',
    armorType: 'light',
    backline: true,
    aura: { radius: 170, dmg: 0.2, haste: 0.15 },
  },
  mage: {
    cost: 1100,
    pop: 4,
    trainTime: 8,
    hp: 170,
    speed: 60,
    damage: 45,
    range: 320,
    cooldown: 3,
    windup: 0.8,
    scale: 1.05,
    splash: 65,
    projectile: 'fireball',
    dmgType: 'magic',
    armorType: 'light',
    backline: true,
  },
  catapult: {
    cost: 900,
    pop: 4,
    trainTime: 9,
    hp: 380,
    speed: 34,
    damage: 60,
    range: 640,
    minRange: 170,
    cooldown: 4.5,
    windup: 1,
    scale: 1.25,
    splash: 45,
    projectile: 'boulder',
    dmgType: 'siege',
    armorType: 'heavy',
    backline: true,
  },
  giant: {
    cost: 1500,
    pop: 5,
    trainTime: 10,
    hp: 1300,
    speed: 40,
    damage: 55,
    range: 62,
    cooldown: 2.5,
    windup: 0.8,
    scale: 2.3,
    splash: 55,
    armor: 0.1,
    dmgType: 'blunt',
    armorType: 'giant',
  },
  builder: {
    cost: 400,
    pop: 2,
    trainTime: 5,
    hp: 120,
    speed: 80,
    damage: 6,
    range: 22,
    cooldown: 1.2,
    windup: 0.4,
    scale: 1,
    dmgType: 'slash',
    armorType: 'light',
  },
  tower: {
    cost: 0,
    pop: 2,
    trainTime: 0,
    hp: 850,
    speed: 0,
    damage: 20,
    range: 420,
    cooldown: 1.5,
    windup: 0.4,
    scale: 1,
    armor: 0.2,
    projectile: 'arrow',
    dmgType: 'arrow',
    armorType: 'heavy',
    stationary: true,
  },
  wall: {
    cost: 300,
    pop: 0,
    trainTime: 0,
    hp: 1600,
    speed: 0,
    damage: 0,
    range: 0,
    cooldown: 99,
    windup: 0,
    scale: 1,
    armor: 0.25,
    dmgType: 'none',
    armorType: 'heavy',
    stationary: true,
    wall: true,
    buildTime: 6,
  },
};

/** Hệ số sát thương [kiểu đòn][kiểu giáp]. Thiếu thì coi là 1. */
export const DAMAGE_TABLE: Record<DamageType, Partial<Record<ArmorType, number>>> = {
  slash: { light: 1.2, heavy: 0.7, mounted: 0.9, giant: 0.8 },
  pierce: { light: 1, heavy: 0.9, mounted: 2, giant: 1.3 },
  arrow: { light: 1, heavy: 0.6, mounted: 0.8, giant: 1.5 },
  magic: { light: 1.3, heavy: 1.3, mounted: 1, giant: 0.7 },
  blunt: { light: 1.1, heavy: 1.1, mounted: 1, giant: 1 },
  siege: { light: 0.6, heavy: 0.8, mounted: 0.5, giant: 1 },
  none: {},
};
/** Hệ số sát thương lên tượng. */
export const STATUE_MULT: Partial<Record<DamageType, number>> = { siege: 3 };

export const damageMult = (dmg: DamageType, armor: ArmorType) => DAMAGE_TABLE[dmg][armor] ?? 1;

const ARMOR_NAME: Record<ArmorType, string> = { light: 'quân nhẹ', heavy: 'giáp nặng', mounted: 'kỵ binh', giant: 'khổng lồ' };
const DMG_NAME: Record<DamageType, string> = {
  slash: 'chém',
  pierce: 'giáo / lao',
  arrow: 'tên',
  magic: 'phép',
  blunt: 'đập',
  siege: 'công thành',
  none: '',
};

function counterText(s: Pick<UnitStats, 'dmgType' | 'armorType' | 'heal' | 'aura' | 'raise'>): string {
  const strong = (Object.keys(ARMOR_NAME) as ArmorType[]).filter((a) => damageMult(s.dmgType, a) >= 1.2).map((a) => ARMOR_NAME[a]);
  const weak = (Object.keys(DMG_NAME) as DamageType[])
    .filter((d) => d !== 'none' && d !== 'siege' && damageMult(d, s.armorType) >= 1.3)
    .map((d) => DMG_NAME[d]);
  const parts: string[] = [];
  if (s.dmgType === 'siege') parts.push('Mạnh với tượng ×3');
  else if (strong.length) parts.push(`Mạnh với ${strong.join(', ')}`);
  if (weak.length) parts.push(`Sợ ${weak.join(', ')}`);
  return parts.join(' · ');
}

export const kindOf = (f: FactionId, a: Arch): UnitKind => (f === 'tribe' ? a : `${f}-${a}`);
export const isArch = (k: string): k is Arch => (ALL_ARCHS as string[]).includes(k);

function build(f: FactionId, a: Arch): UnitStats {
  const fd = FACTIONS[f];
  const def = fd.units[a];
  const { look, name, desc, ...over } = def;
  const s: UnitStats = {
    ...BASE[a],
    ...over,
    arch: a,
    faction: f,
    name,
    desc,
    counter: '',
    look: { head: fd.head, ink: fd.ink, ...look },
  };
  // Tường: chỉ số chung + nét riêng ghi trong factions.ts, không áp hệ số chung của tộc
  if (a === 'wall') {
    s.counter = counterText(s);
    return s;
  }
  s.hp = Math.round(s.hp * (fd.hpMult ?? 1));
  s.damage *= fd.damageMult ?? 1;
  s.speed *= fd.speedMult ?? 1;
  s.cooldown *= fd.cooldownMult ?? 1;
  if (s.cost) s.cost = Math.round((s.cost * (fd.costMult ?? 1)) / 5) * 5;
  if (fd.armorAdd) s.armor = Math.min(0.6, (s.armor ?? 0) + fd.armorAdd);
  if (s.projectile && fd.rangeMult) s.range *= fd.rangeMult;
  if (a === 'builder') s.build = kindOf(f, 'tower');
  s.counter = counterText(s);
  if (s.heal === 0) s.heal = undefined;
  return s;
}

export const UNITS: Record<UnitKind, UnitStats> = {};
for (const f of FACTION_ORDER) for (const a of ALL_ARCHS) UNITS[kindOf(f, a)] = build(f, a);

/**
 * Mọi loại quân của mọi tộc, thứ tự cố định (giao thức online gửi chỉ số trong danh sách này).
 * Tường thêm sau nên nối vào cuối danh sách (không chèn giữa) để client cũ không lệch chỉ số.
 */
export const UNIT_ORDER: UnitKind[] = [
  ...FACTION_ORDER.flatMap((f) => ALL_ARCHS.filter((a) => a !== 'wall').map((a) => kindOf(f, a))),
  ...FACTION_ORDER.map((f) => kindOf(f, 'wall')),
];
/** Loại tường của một nền văn minh. */
export const wallKind = (f: FactionId): UnitKind => kindOf(f, 'wall');

/** Các quân xây được của một tộc, theo thứ tự nút. */
export const roster = (f: FactionId): UnitKind[] => ARCH_ORDER.map((a) => kindOf(f, a));

/** Đổi danh sách quân viết theo tên khung (cấu hình màn chơi) sang quân của tộc. */
export const toFaction = (kinds: UnitKind[], f: FactionId): UnitKind[] => kinds.map((k) => (isArch(k) ? kindOf(f, k) : k));

/** Phím tắt cho quân thứ i trong thanh xây quân. */
export const TRAIN_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '-', '='];

/** Quân kỳ cựu: số mạng hạ được để lên 1/2/3 sao, mỗi sao +15% máu và sát thương. */
export const RANK_KILLS = [2, 5, 9];
export const RANK_BONUS = 0.15;

export const POP_CAP = 40;
export const MAX_QUEUE = 5;
export const MAX_TOWERS = 2;
