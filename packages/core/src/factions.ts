import type { Arch, UnitStats } from './units';

export type FactionId =
  'tribe' | 'orc' | 'elf' | 'undead' | 'samurai' | 'viking' | 'desert' | 'steam' | 'dwarf' | 'tide' | 'dragon' | 'frost';

/** Kiểu mũ / đầu vẽ cho quân của tộc. */
export type Head =
  | 'tribe' // giữ mũ riêng từng loại quân như bản gốc
  | 'horned'
  | 'skull'
  | 'leafhood'
  | 'kabuto'
  | 'kasa'
  | 'nemes'
  | 'jackal'
  | 'goggles'
  | 'orc'
  | 'oni'
  | 'leafcrown'
  | 'beard'
  | 'fin'
  | 'dragon'
  | 'icecrown';
export type Weapon =
  | 'sword'
  | 'axe'
  | 'katana'
  | 'khopesh'
  | 'saber'
  | 'cleaver'
  | 'scythe'
  | 'club'
  | 'hammer'
  | 'dagger'
  | 'bomb'
  | 'pick'
  | 'drill'
  | 'bow'
  | 'musket'
  | 'throw'
  | 'spear'
  | 'halberd'
  | 'naginata'
  | 'staff'
  | 'wrench'
  | 'trident';
export type Mount = 'horse' | 'wolf' | 'elk' | 'boar' | 'bonehorse' | 'chariot' | 'bike' | 'shark' | 'lizard' | 'bear';
export type Machine = 'catapult' | 'ram' | 'cannon' | 'ballista';

export type Look = {
  head?: Head;
  weapon?: Weapon;
  mount?: Mount;
  machine?: Machine;
  shield?: 'oval' | 'round' | 'square' | 'none';
  ink?: string; // màu thân riêng (orc xanh, người cây nâu…)
  tint?: string; // màu điểm nhấn của vũ khí / phép
};

/** Phần ghi đè chỉ số + mô tả cho một loại quân của tộc. */
export type UnitDef = Partial<Omit<UnitStats, 'arch' | 'faction' | 'look'>> & { name: string; desc: string; look?: Look };

export type FactionDef = {
  id: FactionId;
  name: string;
  icon: string;
  color: string; // màu chủ đạo cho giao diện
  desc: string;
  passive: string;
  weakness: string; // điểm yếu
  beat: string; // cách đánh bại tộc này bằng quân và chiến thuật
  head: Head;
  ink?: string;
  // Chỉ số chung
  hpMult?: number;
  damageMult?: number;
  speedMult?: number;
  costMult?: number;
  cooldownMult?: number;
  armorAdd?: number;
  rangeMult?: number; // chỉ áp cho quân bắn xa
  // Nội tại
  rage?: number; // sát thương thêm tối đa khi mất gần hết máu
  bounty?: number; // nhận vàng = tỉ lệ giá quân địch bị hạ
  regen?: number; // hồi máu / giây khi 4 giây không bị đánh
  firstStrike?: number; // nhân sát thương đòn đầu vào mỗi mục tiêu mới
  mineMult?: number; // nhân vàng thợ mỏ mang về
  statueMult?: number; // nhân máu tượng
  rankKills?: number[]; // số mạng để lên sao
  horde?: { radius: number; per: number; max: number }; // bầy đàn: +per sát thương mỗi đồng đội trong radius, tối đa max
  forge?: { perMin: number; max: number }; // lò rèn: quân xây ở phút m được +perMin·m máu và sát thương, tối đa max
  lifesteal?: number; // mọi đòn hút tỉ lệ sát thương này thành máu
  burn?: { dps: number; dur: number }; // mọi đòn đốt máu theo thời gian
  chill?: number; // mọi đòn làm chậm mục tiêu chừng này giây
  units: Record<Arch, UnitDef>;
};

export const FACTIONS: Record<FactionId, FactionDef> = {
  tribe: {
    id: 'tribe',
    name: 'Blade Clan',
    icon: '⚔️',
    color: '#3e8bff',
    desc: 'Cân bằng, dễ chơi, đủ mọi loại quân.',
    passive: 'Kỷ luật: quân rẻ hơn 5%, lên sao kỳ cựu nhanh hơn (1 / 3 / 6 mạng).',
    weakness: 'Quân non: máu -17%. Chưa lên sao thì thua quân tinh nhuệ.',
    beat: 'Đánh sớm bằng quân trâu (giáo binh, khổng lồ) trước khi lính họ lên sao; hạ lính lẻ, đừng để họ gom mạng.',
    head: 'tribe',
    rankKills: [1, 3, 6],
    costMult: 0.95,
    hpMult: 0.83,
    units: {
      miner: { name: 'Thợ mỏ', desc: 'Đào vàng nuôi quân. Chết thì rơi túi vàng đang mang' },
      sword: { name: 'Kiếm sĩ', desc: 'Cận chiến nhanh, rẻ' },
      archer: { name: 'Cung thủ', desc: 'Bắn tên từ xa' },
      ninja: { name: 'Ninja', desc: 'Lướt qua tiền tuyến, ám sát hàng sau' },
      spear: { name: 'Giáo binh', desc: 'Khiên dày, máu trâu. Đâm kỵ binh ×2' },
      cavalry: { name: 'Kỵ binh', desc: 'Phi càng xa, cú đâm đầu càng đau' },
      healer: { name: 'Thầy thuốc', desc: 'Hồi máu quân bị thương gần nhất' },
      banner: { name: 'Tay trống', desc: 'Quân quanh đó đánh mạnh và nhanh hơn' },
      mage: { name: 'Pháp sư', desc: 'Cầu lửa nổ diện rộng' },
      catapult: { name: 'Máy bắn đá', desc: 'Bắn cực xa, phá tượng ×3' },
      giant: { name: 'Khổng lồ', desc: 'Đập nát cả đám' },
      builder: { name: 'Thợ xây', desc: 'Dựng trạm vàng cạnh mỏ: thợ mỏ nộp vàng gần hơn, trạm bắn địch (tối đa 2)' },
      tower: { name: 'Trạm canh', desc: 'Nhận vàng từ thợ mỏ, đứng yên bắn tên' },
      wall: { name: 'Tường đá', desc: 'Tường đá có cổng gỗ, chắc chắn và cân bằng', cost: 300, hp: 1600, armor: 0.25, buildTime: 6 },
    },
  },

  orc: {
    id: 'orc',
    name: 'Orc Horde',
    icon: '🧌',
    color: '#5f9e3a',
    desc: 'Quân to xác đánh theo bầy: càng đông càng mạnh, đứng lẻ thì yếu.',
    passive: 'Bầy đàn: mỗi đồng đội đứng gần cộng +2.5% sát thương, tối đa +15%. Đánh mạnh hơn 4%.',
    weakness: 'Máu -7%, chậm hơn 12%, đắt hơn 6%, bắn xa tầm ngắn hơn 10%: đứng lẻ là yếu, dễ bị thả diều.',
    beat: 'Đánh tách bầy: phép nổ diện rộng vào cục quân, ninja hạ con lẻ; thả diều bằng cung thủ vì họ chậm.',
    head: 'orc',
    ink: '#2f4a22',
    horde: { radius: 120, per: 0.025, max: 0.15 },
    hpMult: 0.93,
    speedMult: 0.88,
    rangeMult: 0.9,
    damageMult: 1.04,
    costMult: 1.06,
    units: {
      miner: {
        name: 'Goblin đào vàng',
        desc: 'Nhỏ, rẻ, chạy nhanh',
        cost: 120,
        speed: 88,
        scale: 0.85,
        look: { head: 'orc', weapon: 'pick' },
      },
      sword: { name: 'Chiến binh Orc', desc: 'Dao phay to, chém đau', look: { weapon: 'cleaver' } },
      archer: {
        name: 'Lính ném lao',
        desc: 'Lao đâm xuyên, khắc kỵ binh',
        projectile: 'bolt',
        dmgType: 'pierce',
        range: 300,
        damage: 21,
        look: { weapon: 'throw' },
      },
      ninja: {
        name: 'Goblin đánh bom',
        desc: 'Lao vào giữa địch rồi tự nổ tung',
        kamikaze: true,
        blink: false,
        cost: 220,
        hp: 60,
        speed: 140,
        damage: 75,
        splash: 70,
        dmgType: 'blunt',
        scale: 0.85,
        look: { weapon: 'bomb' },
      },
      spear: { name: 'Troll khiên', desc: 'Tự hồi máu liên tục', regen: 3, look: { shield: 'square', weapon: 'spear' } },
      cavalry: { name: 'Kỵ sĩ lợn rừng', desc: 'Húc mạnh, máu trâu', hp: 380, speed: 135, look: { mount: 'boar' } },
      healer: { name: 'Pháp sư vu', desc: 'Hồi máu bằng bùa', look: { weapon: 'staff', tint: '#9be564' } },
      banner: { name: 'Trống chiến', desc: 'Tiếng trống làm quân hăng máu', look: {} },
      mage: { name: 'Pháp sư sấm', desc: 'Sét nổ diện rộng', projectile: 'spark', look: { tint: '#7dd3fc' } },
      catapult: { name: 'Máy ném tảng đá', desc: 'Đá to, chậm, phá tượng ×3', damage: 72, cooldown: 5.2 },
      giant: { name: 'Yêu tinh Ogre', desc: 'To, máu nhiều', hp: 1300, look: { weapon: 'club' } },
      builder: { name: 'Goblin thợ xây', desc: 'Dựng trạm gai bắn lao', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm gai', desc: 'Nhận vàng, bắn lao', projectile: 'bolt', dmgType: 'pierce' },
      wall: {
        name: 'Rào gai',
        desc: 'Đánh cận chiến vào rào bị gai đâm lại',
        cost: 280,
        hp: 1500,
        armor: 0.2,
        buildTime: 5,
        thorns: { dmg: 14 },
      },
    },
  },

  elf: {
    id: 'elf',
    name: 'Forest Elves',
    icon: '🌳',
    color: '#2fbf71',
    desc: 'Bắn xa, tự hồi máu, mỏng manh khi bị áp sát.',
    passive: 'Sức sống rừng: hồi 2 máu/giây khi 4 giây không bị đánh. Quân bắn xa +12% tầm, chạy nhanh hơn 6%.',
    weakness: 'Máu -12%, sát thương -5%: sợ phép nổ diện rộng và quân lao vào hàng sau.',
    beat: 'Pháp sư, máy bắn đá đánh vào cụm; kỵ binh, ninja lao thẳng vào hàng cung; đánh liên tục, không cho họ nghỉ để hồi máu.',
    head: 'leafhood',
    hpMult: 0.88,
    regen: 2,
    rangeMult: 1.12,
    damageMult: 0.95,
    speedMult: 1.06,
    units: {
      miner: { name: 'Tinh linh hái vàng', desc: 'Bay nhanh giữa mỏ và nhà', speed: 98, look: { weapon: 'pick' } },
      sword: { name: 'Vũ công kiếm', desc: 'Múa kiếm cực nhanh', damage: 14, cooldown: 0.68, look: { weapon: 'saber', tint: '#b9f6ca' } },
      archer: { name: 'Cung thủ Elf', desc: 'Tầm bắn xa nhất', damage: 19, range: 400 },
      ninja: { name: 'Thợ săn', desc: 'Lướt tới, mũi dao tẩm độc làm chậm', slow: 1.5, look: { weapon: 'dagger' } },
      spear: {
        name: 'Người cây',
        desc: 'Vỏ dày, tự mọc lại 9 máu/giây',
        regen: 9,
        hp: 560,
        speed: 46,
        dmgType: 'blunt',
        armor: 0.15,
        look: { head: 'leafcrown', ink: '#5b3a1e', weapon: 'club', shield: 'none' },
      },
      cavalry: { name: 'Kỵ sĩ hươu', desc: 'Nhanh, gạc hươu húc', look: { mount: 'elk' } },
      healer: {
        name: 'Tư tế rừng',
        desc: 'Hồi máu cho cả nhóm quanh mục tiêu',
        healAoe: 110,
        heal: 14,
        look: { weapon: 'staff', tint: '#3ddc84' },
      },
      banner: { name: 'Sáo thần', desc: 'Tiếng sáo làm quân đánh nhanh hơn', aura: { radius: 180, dmg: 0.1, haste: 0.3 } },
      mage: { name: 'Pháp sư gió', desc: 'Lốc xoáy hất địch lùi xa', projectile: 'wind', damage: 34, knock: 45, look: { tint: '#d1fae5' } },
      catapult: {
        name: 'Nỏ thần',
        desc: 'Tên khổng lồ bắn hạ quân to (×1.5 vào khổng lồ)',
        projectile: 'bolt',
        dmgType: 'arrow',
        damage: 120,
        splash: 0,
        range: 560,
        minRange: 120,
        cooldown: 3.6,
        look: { machine: 'ballista' },
      },
      giant: {
        name: 'Cổ thụ',
        desc: 'Rễ cây trói chân địch',
        slow: 2,
        regen: 6,
        look: { head: 'leafcrown', ink: '#4a3218', weapon: 'club' },
      },
      builder: { name: 'Tinh linh dựng', desc: 'Trồng trạm cây bắn tên', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm cây', desc: 'Nhận vàng, bắn tên xa', range: 470 },
      wall: { name: 'Tường cây', desc: 'Cây sống tự mọc lại 6 máu/giây', cost: 300, hp: 1400, armor: 0.15, buildTime: 6, regen: 6 },
    },
  },

  undead: {
    id: 'undead',
    name: 'Undead Legion',
    icon: '💀',
    color: '#9a8fbf',
    desc: 'Quân rẻ, yếu, rất đông. Càng giết càng giàu.',
    passive: 'Thu hồn: hạ quân địch nhận 30% giá của nó. Quân rẻ hơn 20%.',
    weakness: 'Máu -15%, sát thương -12%: đánh tay đôi thua.',
    beat: 'Tường khiên với quân trâu, đừng để quân mình chết lẻ (mỗi mạng là vàng cho họ); quân yếu thì rút về hồi máu.',
    head: 'skull',
    ink: '#3b3b44',
    hpMult: 0.85,
    damageMult: 0.88,
    costMult: 0.8,
    bounty: 0.3,
    units: {
      miner: { name: 'Thợ mỏ xương', desc: 'Rẻ, mỏng', cost: 100, hp: 55, look: { weapon: 'pick' } },
      sword: {
        name: 'Xương binh',
        desc: 'Mỗi lần xây ra 2 con',
        spawnCount: 2,
        cost: 160,
        hp: 72,
        damage: 13,
        look: { weapon: 'sword', tint: '#9ca3af' },
      },
      archer: { name: 'Cung xương', desc: 'Bắn tên rẻ' },
      ninja: {
        name: 'Bóng ma',
        desc: 'Tàng hình, chỉ lộ ra khi ra đòn',
        stealth: true,
        blink: false,
        dmgType: 'magic',
        look: { weapon: 'scythe' },
      },
      spear: {
        name: 'Hiệp sĩ tử thần',
        desc: 'Hút máu 35% sát thương gây ra',
        lifesteal: 0.35,
        look: { weapon: 'halberd', shield: 'none' },
      },
      cavalry: { name: 'Kỵ sĩ không đầu', desc: 'Ngựa xương phi như gió', speed: 168, look: { mount: 'bonehorse' } },
      healer: {
        name: 'Thầy chiêu hồn',
        desc: 'Không hồi máu: gọi xác chết gần đó dậy làm xương binh 25 giây',
        heal: 0,
        raise: 'undead-sword',
        cooldown: 4,
        look: { weapon: 'staff', tint: '#a78bfa' },
      },
      banner: { name: 'Cờ xương', desc: 'Lá cờ ma làm quân hung hãn' },
      mage: {
        name: 'Phù thuỷ dịch hạch',
        desc: 'Mây độc rút máu dần',
        projectile: 'poison',
        damage: 26,
        poison: { dps: 10, dur: 4 },
        look: { tint: '#84cc16' },
      },
      catapult: { name: 'Máy bắn xác', desc: 'Ném xác thối, để lại độc', projectile: 'poison', poison: { dps: 8, dur: 4 }, damage: 50 },
      giant: { name: 'Quái xác ghép', desc: 'Hút máu 20% sát thương', lifesteal: 0.2, look: { ink: '#4a5a3a', weapon: 'cleaver' } },
      builder: { name: 'Thợ đào mộ', desc: 'Dựng trạm xương', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm xương', desc: 'Nhận vàng, bắn tên' },
      wall: { name: 'Tường xương', desc: 'Rẻ nhưng mỏng', cost: 220, hp: 1250, armor: 0.2, buildTime: 5 },
    },
  },

  samurai: {
    id: 'samurai',
    name: 'Ronin Order',
    icon: '🏯',
    color: '#e5484d',
    desc: 'Chiến binh tinh nhuệ, ra đòn nhanh và chí mạng.',
    passive: 'Nhất kích: nhát chém cận chiến đầu tiên vào mỗi mục tiêu mới gây ×2.8 sát thương. Đánh nhanh hơn 15%, mạnh hơn 6%, máu +8%.',
    weakness: 'Quân đắt hơn 2%, ít quân: đòn mạnh nhất chỉ có ở nhát đầu, bị vây đông thì đuối.',
    beat: 'Cho quân giáp dày (giáo binh, khổng lồ) đỡ nhát đầu; dùng số đông quân rẻ và bắn xa để tiêu hao.',
    head: 'kabuto',
    firstStrike: 2.8,
    cooldownMult: 0.85,
    hpMult: 1.08,
    costMult: 1.02,
    damageMult: 1.06,
    units: {
      miner: { name: 'Nông dân', desc: 'Đội nón lá đi đào vàng', look: { head: 'kasa', weapon: 'pick' } },
      sword: { name: 'Ronin', desc: 'Katana chém ngọt', look: { weapon: 'katana' } },
      archer: { name: 'Cung Yumi', desc: 'Cung dài bắn chuẩn', damage: 18 },
      ninja: { name: 'Shinobi', desc: 'Tàng hình và lướt tới ám sát', stealth: true, look: { head: 'kasa', weapon: 'katana' } },
      spear: {
        name: 'Lính Naginata',
        desc: 'Đao dài quét trúng nhiều địch',
        splash: 34,
        damage: 28,
        look: { weapon: 'naginata', shield: 'none' },
      },
      cavalry: { name: 'Kỵ sĩ Ronin', desc: 'Lao tới chém một nhát chí mạng' },
      healer: { name: 'Nhà sư', desc: 'Hồi máu', look: { head: 'kasa', weapon: 'staff', tint: '#fde68a' } },
      banner: { name: 'Trống Taiko', desc: 'Trống lớn thúc quân' },
      mage: { name: 'Âm dương sư', desc: 'Bùa nổ diện rộng', projectile: 'spark', look: { tint: '#fca5a5' } },
      catapult: { name: 'Máy bắn đá', desc: 'Phá tượng ×3' },
      giant: { name: 'Quỷ Oni', desc: 'Chùy sắt, da dày', armor: 0.18, look: { head: 'oni', ink: '#5a1d1d', weapon: 'club' } },
      builder: { name: 'Thợ mộc', desc: 'Dựng trạm canh gỗ', look: { head: 'kasa', weapon: 'hammer' } },
      tower: { name: 'Trạm canh gỗ', desc: 'Nhận vàng, bắn tên' },
      wall: { name: 'Thành gỗ sơn', desc: 'Dựng nhanh (4 giây)', cost: 320, hp: 1550, armor: 0.25, buildTime: 4 },
    },
  },

  viking: {
    id: 'viking',
    name: 'Storm Raiders',
    icon: '🪓',
    color: '#38bdf8',
    desc: 'Cận chiến hung bạo, càng đau càng điên.',
    passive: 'Cuồng nộ: quân càng mất máu càng đánh đau, tới +45% sát thương.',
    weakness: 'Giáp -10%, máu -3%: lúc còn khoẻ đánh yếu, dễ bị dồn sát thương hạ nhanh.',
    beat: 'Dồn sát thương hạ dứt điểm từng con (pháp sư, ninja, nhiều cung); đừng để quân họ máu thấp đánh lâu.',
    head: 'horned',
    rage: 0.45,
    armorAdd: -0.1,
    hpMult: 0.97,
    units: {
      miner: { name: 'Nô lệ', desc: 'Biết cầm cuốc đánh trả', damage: 12, hp: 100, look: { weapon: 'pick' } },
      sword: { name: 'Chiến binh rìu', desc: 'Rìu chém xuyên giáp nhẹ', damage: 20, hp: 130, look: { weapon: 'axe' } },
      archer: {
        name: 'Lính ném rìu',
        desc: 'Ném rìu tầm gần, rất đau',
        projectile: 'axe',
        dmgType: 'slash',
        range: 260,
        damage: 26,
        look: { weapon: 'throw' },
      },
      ninja: {
        name: 'Cuồng chiến binh',
        desc: 'Lao vào giữa trận, máu càng thấp càng khủng',
        blink: false,
        rage: 1,
        hp: 150,
        damage: 24,
        speed: 115,
        look: { weapon: 'axe' },
      },
      spear: { name: 'Nữ khiên', desc: 'Khiên tròn chắn đòn, giáp dày', armor: 0.3, look: { shield: 'round' } },
      cavalry: { name: 'Kỵ sĩ sói', desc: 'Sói phi nhanh nhất', speed: 162, hp: 290, look: { mount: 'wolf' } },
      healer: { name: 'Nữ tiên tri', desc: 'Hồi máu', look: { weapon: 'staff', tint: '#93c5fd' } },
      banner: { name: 'Kèn tù và', desc: 'Tiếng tù và làm quân hăng: +25% sát thương', aura: { radius: 170, dmg: 0.25, haste: 0.1 } },
      mage: { name: 'Thầy Rune', desc: 'Sét rune làm chậm địch', projectile: 'spark', slow: 1.5, look: { tint: '#bae6fd' } },
      catapult: {
        name: 'Xe phá thành',
        desc: 'Không đánh quân, lao thẳng vào húc tượng (×3)',
        siegeOnly: true,
        projectile: undefined,
        range: 44,
        minRange: 0,
        damage: 110,
        cooldown: 2.4,
        splash: 0,
        hp: 700,
        speed: 46,
        look: { machine: 'ram' },
      },
      giant: { name: 'Khổng lồ băng', desc: 'Đập đóng băng, làm chậm địch', slow: 2, look: { ink: '#3b5875', weapon: 'club' } },
      builder: { name: 'Thợ đẽo gỗ', desc: 'Dựng trạm gỗ', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm gỗ', desc: 'Nhận vàng, ném rìu', projectile: 'axe', dmgType: 'slash', range: 320, damage: 26 },
      wall: { name: 'Hàng cọc gỗ', desc: 'Rẻ, dựng nhanh, hơi mỏng', cost: 240, hp: 1450, armor: 0.2, buildTime: 4 },
    },
  },

  desert: {
    id: 'desert',
    name: 'Desert Nomads',
    icon: '🏜️',
    color: '#f2c230',
    desc: 'Giàu vàng, tượng vững, có chiến xa và tư tế mặt trời.',
    passive: 'Vàng sa mạc: thợ mỏ mang về +8% vàng. Tượng +25% máu.',
    weakness: 'Quân đánh yếu hơn 8%, máu -5%.',
    beat: 'Tấn công sớm và quấy thợ mỏ (nhất là mỏ kim cương) trước khi họ giàu lên.',
    head: 'nemes',
    mineMult: 1.08,
    statueMult: 1.25,
    damageMult: 0.92,
    hpMult: 0.95,
    units: {
      miner: { name: 'Thợ đá', desc: 'Mang về nhiều vàng', look: { weapon: 'pick' } },
      sword: { name: 'Lính Khopesh', desc: 'Đao cong móc khiên', look: { weapon: 'khopesh' } },
      archer: { name: 'Cung thủ cát', desc: 'Bắn tên' },
      ninja: { name: 'Sát thủ cát', desc: 'Lướt qua tiền tuyến', look: { weapon: 'dagger' } },
      spear: { name: 'Vệ binh Anubis', desc: 'Hút máu 15%', lifesteal: 0.15, look: { head: 'jackal', weapon: 'halberd' } },
      cavalry: {
        name: 'Chiến xa',
        desc: 'Bánh xe nghiền cả đám khi lao tới',
        chargeSplash: 45,
        hp: 360,
        speed: 135,
        look: { mount: 'chariot' },
      },
      healer: { name: 'Thầy ướp xác', desc: 'Hồi máu', look: { weapon: 'staff', tint: '#fde047' } },
      banner: { name: 'Kèn đồng', desc: 'Thúc quân' },
      mage: { name: 'Tư tế mặt trời', desc: 'Cầu nắng thiêu đốt', projectile: 'sun', look: { tint: '#fde047' } },
      catapult: { name: 'Máy bắn đá', desc: 'Phá tượng ×3' },
      giant: {
        name: 'Xác ướp khổng lồ',
        desc: 'Lời nguyền: đòn đánh để lại độc',
        poison: { dps: 7, dur: 4 },
        look: { ink: '#8c7a55', weapon: 'club' },
      },
      builder: { name: 'Thợ xây trạm', desc: 'Dựng trạm đá', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm đá', desc: 'Nhận vàng, bắn tên, chắc hơn (nhiều máu)', hp: 1000 },
      wall: { name: 'Tường đá cát', desc: 'Dày, nhiều máu', cost: 330, hp: 2000, armor: 0.2, buildTime: 7 },
    },
  },

  steam: {
    id: 'steam',
    name: 'Iron Empire',
    icon: '⚙️',
    color: '#9ca3af',
    desc: 'Giáp sắt, súng và đại bác. Đắt và chậm.',
    passive: 'Thép: mọi quân +17% giáp, máu +5%, bắn xa +5% tầm.',
    weakness: 'Đắt hơn 6%, chậm hơn 12%: ít quân, chậm bù quân.',
    beat: 'Pháp sư (phép đốt giáp nặng), đông quân rẻ vây đánh; quấy thợ mỏ vì họ khó bù quân.',
    head: 'goggles',
    armorAdd: 0.17,
    costMult: 1.06,
    speedMult: 0.88,
    rangeMult: 1.05,
    hpMult: 1.05,
    units: {
      miner: { name: 'Thợ khoan', desc: 'Máy khoan đào nhanh', mineTime: 1.7, look: { weapon: 'drill' } },
      sword: { name: 'Lính kiếm sắt', desc: 'Kiếm và giáp ngực', look: { weapon: 'saber' } },
      archer: {
        name: 'Lính hoả mai',
        desc: 'Đạn chì xuyên giáp, nạp đạn chậm',
        projectile: 'bullet',
        dmgType: 'pierce',
        damage: 30,
        range: 420,
        cooldown: 2.5,
        look: { weapon: 'musket' },
      },
      ninja: { name: 'Đặc nhiệm móc câu', desc: 'Phóng móc lướt tới hàng sau', look: { weapon: 'dagger' } },
      spear: { name: 'Lính giáp sắt', desc: 'Giáp dày nhất', armor: 0.4, look: { shield: 'square' } },
      cavalry: { name: 'Xe máy hơi nước', desc: 'Nhanh, húc mạnh', speed: 165, look: { mount: 'bike' } },
      healer: { name: 'Thợ sửa chữa', desc: 'Vá giáp, hồi máu', look: { weapon: 'wrench', tint: '#fbbf24' } },
      banner: { name: 'Loa hơi nước', desc: 'Còi hú thúc quân' },
      mage: {
        name: 'Lính phun lửa',
        desc: 'Lửa tầm gần, đốt liên tục',
        projectile: 'fireball',
        range: 210,
        damage: 28,
        cooldown: 1.4,
        splash: 55,
        look: { weapon: 'musket', tint: '#fb923c' },
      },
      catapult: {
        name: 'Đại bác',
        desc: 'Bắn xa, phá tượng ×3',
        projectile: 'cannonball',
        damage: 78,
        range: 680,
        look: { machine: 'cannon' },
      },
      giant: { name: 'Người máy hơi nước', desc: 'Giáp thép dày', armor: 0.35, look: { ink: '#4b5563', weapon: 'hammer' } },
      builder: { name: 'Kỹ sư', desc: 'Dựng trạm súng', look: { weapon: 'wrench' } },
      tower: { name: 'Trạm súng', desc: 'Nhận vàng, bắn đạn xuyên giáp', projectile: 'bullet', dmgType: 'pierce', damage: 26 },
      wall: { name: 'Tường thép', desc: 'Giáp rất dày nhưng đắt', cost: 360, hp: 1700, armor: 0.45, buildTime: 7 },
    },
  },
  dwarf: {
    id: 'dwarf',
    name: 'Mountain Dwarves',
    icon: '⛏️',
    color: '#c2703d',
    desc: 'Thợ rèn lì lợm, càng về cuối trận càng mạnh.',
    passive: 'Lò rèn: quân xây ra càng muộn càng mạnh, mỗi phút +5% máu và sát thương (tối đa +40%).',
    weakness: 'Đầu trận yếu: máu -9%, sát thương -4%, chậm hơn 12%.',
    beat: 'Đánh sớm, dồn ép trước phút thứ 5; quấy thợ mỏ để họ không có vàng xây quân muộn.',
    head: 'beard',
    ink: '#3a2a1e',
    forge: { perMin: 0.05, max: 0.4 },
    damageMult: 0.96,
    speedMult: 0.88,
    hpMult: 0.91,
    units: {
      miner: { name: 'Thợ mỏ lùn', desc: 'Đào nhanh, chắc tay', mineTime: 1.6, hp: 95, look: { weapon: 'pick' } },
      sword: { name: 'Chiến binh rìu', desc: 'Lùn mà lì, giáp dày', hp: 140, armor: 0.1, look: { weapon: 'axe', shield: 'round' } },
      archer: {
        name: 'Lính súng kíp',
        desc: 'Đạn chì xuyên giáp, nạp chậm',
        projectile: 'bullet',
        dmgType: 'pierce',
        damage: 28,
        range: 360,
        cooldown: 2.3,
        look: { weapon: 'musket' },
      },
      ninja: { name: 'Thợ đào hầm', desc: 'Chui lên giữa hàng sau địch', look: { weapon: 'pick' } },
      spear: { name: 'Vệ binh khiên sắt', desc: 'Khiên vuông, giáp cực dày', armor: 0.38, look: { shield: 'square', weapon: 'hammer' } },
      cavalry: { name: 'Kỵ sĩ dê núi', desc: 'Húc chắc, máu trâu', hp: 380, speed: 128, look: { mount: 'boar' } },
      healer: { name: 'Thợ rèn rune', desc: 'Gõ rune hồi máu', look: { weapon: 'hammer', tint: '#fbbf24' } },
      banner: { name: 'Kèn đá', desc: 'Tiếng kèn làm quân vững tay' },
      mage: { name: 'Pháp sư rune', desc: 'Rune nổ diện rộng', projectile: 'spark', look: { tint: '#fcd34d' } },
      catapult: {
        name: 'Đại bác lùn',
        desc: 'Bắn xa, phá tượng ×3',
        projectile: 'cannonball',
        damage: 74,
        range: 660,
        look: { machine: 'cannon' },
      },
      giant: { name: 'Người đá', desc: 'Đá tảng, giáp dày', armor: 0.25, look: { ink: '#6b7280', weapon: 'hammer' } },
      builder: { name: 'Thợ xây lùn', desc: 'Dựng trạm rèn bắn súng', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm rèn', desc: 'Nhận vàng, bắn đạn xuyên giáp', projectile: 'bullet', dmgType: 'pierce', damage: 24 },
      wall: { name: 'Tường đá núi', desc: 'Trâu nhất nhưng dựng chậm (9 giây)', cost: 380, hp: 2300, armor: 0.35, buildTime: 9 },
    },
  },

  tide: {
    id: 'tide',
    name: 'Tide Folk',
    icon: '🔱',
    color: '#14b8a6',
    desc: 'Chiến binh biển, đánh lâu không mệt nhờ hút máu.',
    passive: 'Thủy triều: mọi đòn đánh hút 40% sát thương thành máu. Máu +7%.',
    weakness: 'Đánh chậm hơn 5%, sát thương -3%: sợ phép nổ và đòn dồn dập hạ gục trước khi kịp hút máu.',
    beat: 'Hạ nhanh bằng phép nổ và bắn xa tập trung; đừng đánh tay đôi kéo dài với họ.',
    head: 'fin',
    ink: '#134e4a',
    lifesteal: 0.4,
    damageMult: 0.97,
    cooldownMult: 1.05,
    hpMult: 1.07,
    units: {
      miner: { name: 'Thợ mò ngọc', desc: 'Lặn mò vàng', look: { weapon: 'pick' } },
      sword: { name: 'Lính đinh ba', desc: 'Đâm nhanh', cooldown: 0.82, dmgType: 'pierce', look: { weapon: 'trident' } },
      archer: {
        name: 'Lính phóng lao',
        desc: 'Lao xuyên, khắc kỵ binh',
        projectile: 'bolt',
        dmgType: 'pierce',
        range: 330,
        damage: 20,
        look: { weapon: 'throw' },
      },
      ninja: { name: 'Thích khách biển', desc: 'Lướt tới, dao tẩm độc', poison: { dps: 6, dur: 3 }, look: { weapon: 'dagger' } },
      spear: { name: 'Vệ binh mai rùa', desc: 'Mai rùa chắn đòn', armor: 0.3, look: { shield: 'oval', weapon: 'trident' } },
      cavalry: { name: 'Kỵ sĩ cá mập', desc: 'Lao như cá mập săn mồi', speed: 145, look: { mount: 'shark' } },
      healer: { name: 'Tiên cá', desc: 'Hồi máu cho cả nhóm', healAoe: 90, heal: 15, look: { weapon: 'staff', tint: '#5eead4' } },
      banner: { name: 'Tù và ốc', desc: 'Tiếng ốc thúc quân' },
      mage: {
        name: 'Pháp sư triều cường',
        desc: 'Sóng nước hất địch lùi',
        projectile: 'wind',
        damage: 36,
        knock: 35,
        look: { tint: '#67e8f9' },
      },
      catapult: {
        name: 'Máy phóng lao',
        desc: 'Lao khổng lồ, khắc quân to',
        projectile: 'bolt',
        dmgType: 'arrow',
        damage: 110,
        splash: 0,
        range: 560,
        minRange: 120,
        cooldown: 3.6,
        look: { machine: 'ballista' },
      },
      giant: { name: 'Quái vật biển', desc: 'Xúc tu quất cả đám', look: { ink: '#0f766e', weapon: 'club' } },
      builder: { name: 'Thợ san hô', desc: 'Dựng trạm san hô', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm san hô', desc: 'Nhận vàng, phóng lao', projectile: 'bolt', dmgType: 'pierce' },
      wall: { name: 'Rạn san hô', desc: 'San hô tự mọc lại 5 máu/giây', cost: 290, hp: 1500, armor: 0.2, buildTime: 6, regen: 5 },
    },
  },

  dragon: {
    id: 'dragon',
    name: 'Dragon Brood',
    icon: '🐉',
    color: '#ef4444',
    desc: 'Hậu duệ của rồng, mọi đòn đều để lại lửa.',
    passive: 'Lửa rồng: mọi đòn đánh đốt mục tiêu 9 máu/giây trong 3 giây. Đánh mạnh hơn 3%.',
    weakness: 'Quân đắt hơn 10%, máu -5%: ít quân, khó bù khi thua giao tranh.',
    beat: 'Đông quân rẻ vây đánh, thầy thuốc hồi lại máu bị đốt; dồn họ vào giao tranh sớm khi còn ít quân.',
    head: 'dragon',
    ink: '#4a1d1d',
    burn: { dps: 9, dur: 3 },
    costMult: 1.1,
    damageMult: 1.03,
    hpMult: 0.95,
    units: {
      miner: { name: 'Thợ mỏ lửa', desc: 'Đào vàng trong núi lửa', look: { weapon: 'pick' } },
      sword: { name: 'Hiệp sĩ rồng', desc: 'Kiếm lửa', look: { weapon: 'sword', tint: '#f97316' } },
      archer: { name: 'Cung thủ lửa', desc: 'Tên lửa bắn xa', look: { tint: '#f97316' } },
      ninja: { name: 'Sát thủ tro', desc: 'Lướt tới hàng sau', look: { weapon: 'dagger', tint: '#fb923c' } },
      spear: { name: 'Vệ binh vảy rồng', desc: 'Vảy rồng cứng', armor: 0.3, look: { weapon: 'halberd', shield: 'none' } },
      cavalry: { name: 'Kỵ sĩ thằn lằn', desc: 'Thằn lằn lửa phi nhanh', speed: 160, look: { mount: 'lizard' } },
      healer: { name: 'Tư tế lửa', desc: 'Lửa thiêng hồi máu', look: { weapon: 'staff', tint: '#fdba74' } },
      banner: { name: 'Trống rồng', desc: 'Tiếng gầm thúc quân' },
      mage: { name: 'Pháp sư lửa', desc: 'Cầu lửa nổ lớn', projectile: 'fireball', splash: 75, look: { tint: '#ef4444' } },
      catapult: { name: 'Máy bắn đá lửa', desc: 'Đá lửa phá tượng ×3', projectile: 'fireball', damage: 62 },
      giant: { name: 'Rồng con', desc: 'Phun lửa trúng cả đám', splash: 70, look: { head: 'dragon', ink: '#7f1d1d', weapon: 'club' } },
      builder: { name: 'Thợ lò', desc: 'Dựng trạm lửa', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm lửa', desc: 'Nhận vàng, bắn tên lửa' },
      wall: {
        name: 'Tường đá lửa',
        desc: 'Đánh cận chiến vào tường bị đốt',
        cost: 320,
        hp: 1600,
        armor: 0.3,
        buildTime: 6,
        thorns: { dmg: 6, burn: 8 },
      },
    },
  },

  frost: {
    id: 'frost',
    name: 'Frost Kin',
    icon: '❄️',
    color: '#93c5fd',
    desc: 'Dân xứ tuyết, khống chế địch bằng giá lạnh.',
    passive: 'Giá lạnh: mọi đòn đánh làm chậm mục tiêu 2 giây. Da dày chịu rét: +40% máu.',
    weakness: 'Chậm hơn 5%, không có đòn đặc biệt mạnh: hạ địch chậm.',
    beat: 'Quân trâu, máu nhiều (khổng lồ, giáo binh) không sợ bị làm chậm; dồn thẳng vào họ thay vì đuổi theo.',
    head: 'icecrown',
    ink: '#1e3a5f',
    chill: 2,
    hpMult: 1.4,
    speedMult: 0.95,
    units: {
      miner: { name: 'Thợ đục băng', desc: 'Đục vàng trong băng', look: { weapon: 'pick' } },
      sword: { name: 'Chiến binh tuyết', desc: 'Kiếm băng', look: { weapon: 'sword', tint: '#bfdbfe' } },
      archer: { name: 'Cung thủ băng', desc: 'Tên băng bắn xa', damage: 18, look: { tint: '#bfdbfe' } },
      ninja: { name: 'Bóng tuyết', desc: 'Lướt theo gió tuyết tới hàng sau', look: { weapon: 'dagger' } },
      spear: { name: 'Vệ binh băng giáp', desc: 'Giáp băng dày', armor: 0.3, look: { shield: 'round' } },
      cavalry: { name: 'Kỵ sĩ gấu tuyết', desc: 'Gấu to, máu trâu', hp: 400, speed: 128, look: { mount: 'bear' } },
      healer: { name: 'Pháp sư tuyết', desc: 'Hồi máu', look: { weapon: 'staff', tint: '#e0f2fe' } },
      banner: { name: 'Kèn bão tuyết', desc: 'Thúc quân' },
      mage: { name: 'Pháp sư băng', desc: 'Bão băng làm chậm lâu', projectile: 'spark', slow: 2, look: { tint: '#7dd3fc' } },
      catapult: { name: 'Máy ném băng', desc: 'Tảng băng phá tượng ×3' },
      giant: { name: 'Người tuyết khổng lồ', desc: 'Đập làm đóng băng', slow: 2, look: { ink: '#cbd5e1', weapon: 'club' } },
      builder: { name: 'Thợ băng', desc: 'Dựng trạm băng', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm băng', desc: 'Nhận vàng, bắn tên băng' },
      wall: {
        name: 'Tường băng',
        desc: 'Đánh cận chiến vào tường bị làm chậm',
        cost: 300,
        hp: 1650,
        armor: 0.3,
        buildTime: 6,
        thorns: { dmg: 4, slow: 1.5 },
      },
    },
  },
};

export const FACTION_ORDER: FactionId[] = [
  'tribe',
  'orc',
  'elf',
  'undead',
  'samurai',
  'viking',
  'desert',
  'steam',
  'dwarf',
  'tide',
  'dragon',
  'frost',
];
