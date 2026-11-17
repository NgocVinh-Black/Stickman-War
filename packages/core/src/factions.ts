import type { Arch, UnitStats } from './units';

export type FactionId = 'tribe' | 'orc' | 'elf' | 'undead' | 'samurai' | 'viking' | 'desert' | 'steam';

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
  | 'leafcrown';
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
  | 'wrench';
export type Mount = 'horse' | 'wolf' | 'elk' | 'boar' | 'bonehorse' | 'chariot' | 'bike';
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
  counters: FactionId[]; // gây thêm sát thương lên các tộc này
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
  units: Record<Arch, UnitDef>;
};

/** Khắc tộc: +20% sát thương lên tộc bị khắc. Mỗi tộc khắc 2 tộc và bị 2 tộc khắc. */
export const FACTION_COUNTER_MULT = 1.2;

export const FACTIONS: Record<FactionId, FactionDef> = {
  tribe: {
    id: 'tribe',
    name: 'Bộ Lạc Kiếm',
    icon: '⚔️',
    color: '#3e8bff',
    desc: 'Cân bằng, dễ chơi, đủ mọi loại quân.',
    passive: 'Kỷ luật: quân rẻ hơn 10%, lên sao kỳ cựu nhanh hơn (1 / 3 / 6 mạng).',
    counters: ['orc', 'undead'],
    head: 'tribe',
    rankKills: [1, 3, 6],
    costMult: 0.9,
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
      builder: { name: 'Thợ xây', desc: 'Ra tiền tuyến dựng tháp canh bắn tên (tối đa 3)' },
      tower: { name: 'Tháp canh', desc: 'Đứng yên bắn tên' },
    },
  },

  orc: {
    id: 'orc',
    name: 'Thú Nhân',
    icon: '🧌',
    color: '#5f9e3a',
    desc: 'Quân to xác, rẻ, trâu bò nhưng chậm.',
    passive: 'Da dày: +20% máu, +5% sát thương nhưng chậm hơn 10%.',
    counters: ['elf', 'samurai'],
    head: 'orc',
    ink: '#2f4a22',
    hpMult: 1.2,
    damageMult: 1.05,
    speedMult: 0.9,
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
        cost: 200,
        hp: 60,
        speed: 140,
        damage: 95,
        splash: 70,
        dmgType: 'blunt',
        scale: 0.85,
        look: { weapon: 'bomb' },
      },
      spear: { name: 'Troll khiên', desc: 'Tự hồi máu liên tục', regen: 5, look: { shield: 'square', weapon: 'spear' } },
      cavalry: { name: 'Kỵ sĩ lợn rừng', desc: 'Húc mạnh, máu trâu', hp: 380, speed: 135, look: { mount: 'boar' } },
      healer: { name: 'Pháp sư vu', desc: 'Hồi máu bằng bùa', look: { weapon: 'staff', tint: '#9be564' } },
      banner: { name: 'Trống chiến', desc: 'Tiếng trống làm quân hăng máu', look: {} },
      mage: { name: 'Pháp sư sấm', desc: 'Sét nổ diện rộng', projectile: 'spark', look: { tint: '#7dd3fc' } },
      catapult: { name: 'Máy ném tảng đá', desc: 'Đá to, chậm, phá tượng ×3', damage: 72, cooldown: 5.2 },
      giant: { name: 'Yêu tinh Ogre', desc: 'To nhất, máu nhiều nhất', hp: 1450, look: { weapon: 'club' } },
      builder: { name: 'Goblin thợ xây', desc: 'Dựng tháp gai bắn lao', look: { weapon: 'hammer' } },
      tower: { name: 'Tháp gai', desc: 'Bắn lao', projectile: 'bolt', dmgType: 'pierce' },
    },
  },

  elf: {
    id: 'elf',
    name: 'Thần Rừng',
    icon: '🌳',
    color: '#2fbf71',
    desc: 'Bắn xa, tự hồi máu, mỏng manh khi bị áp sát.',
    passive: 'Sức sống rừng: hồi 2 máu/giây khi 4 giây không bị đánh. Quân bắn xa +8% tầm. Máu -15%.',
    counters: ['undead', 'viking'],
    head: 'leafhood',
    hpMult: 0.85,
    regen: 2,
    rangeMult: 1.08,
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
      builder: { name: 'Tinh linh dựng', desc: 'Trồng tháp cây bắn tên', look: { weapon: 'hammer' } },
      tower: { name: 'Tháp cây', desc: 'Bắn tên xa', range: 470 },
    },
  },

  undead: {
    id: 'undead',
    name: 'Tộc Xương',
    icon: '💀',
    color: '#9a8fbf',
    desc: 'Quân rẻ, yếu, rất đông. Càng giết càng giàu.',
    passive: 'Thu hồn: hạ quân địch nhận 25% giá của nó. Quân rẻ hơn 15% nhưng yếu hơn 15%.',
    counters: ['samurai', 'desert'],
    head: 'skull',
    ink: '#3b3b44',
    hpMult: 0.85,
    costMult: 0.85,
    bounty: 0.25,
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
      cavalry: { name: 'Kỵ sĩ không đầu', desc: 'Ngựa xương phi như gió', look: { mount: 'bonehorse' } },
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
      builder: { name: 'Thợ đào mộ', desc: 'Dựng tháp xương', look: { weapon: 'hammer' } },
      tower: { name: 'Tháp xương', desc: 'Bắn tên' },
    },
  },

  samurai: {
    id: 'samurai',
    name: 'Phù Tang',
    icon: '🏯',
    color: '#e5484d',
    desc: 'Chiến binh tinh nhuệ, ra đòn nhanh và chí mạng.',
    passive: 'Nhất kích: nhát chém cận chiến đầu tiên vào mỗi mục tiêu mới gây ×2.6 sát thương. Đánh nhanh hơn 15%.',
    counters: ['viking', 'steam'],
    head: 'kabuto',
    firstStrike: 2.6,
    cooldownMult: 0.85,
    hpMult: 0.95,
    units: {
      miner: { name: 'Nông dân', desc: 'Đội nón lá đi đào vàng', look: { head: 'kasa', weapon: 'pick' } },
      sword: { name: 'Samurai', desc: 'Katana chém ngọt', look: { weapon: 'katana' } },
      archer: { name: 'Cung Yumi', desc: 'Cung dài bắn chuẩn', damage: 18 },
      ninja: { name: 'Shinobi', desc: 'Tàng hình và lướt tới ám sát', stealth: true, look: { head: 'kasa', weapon: 'katana' } },
      spear: {
        name: 'Lính Naginata',
        desc: 'Đao dài quét trúng nhiều địch',
        splash: 34,
        damage: 28,
        look: { weapon: 'naginata', shield: 'none' },
      },
      cavalry: { name: 'Kỵ sĩ Samurai', desc: 'Lao tới chém một nhát chí mạng' },
      healer: { name: 'Nhà sư', desc: 'Hồi máu', look: { head: 'kasa', weapon: 'staff', tint: '#fde68a' } },
      banner: { name: 'Trống Taiko', desc: 'Trống lớn thúc quân' },
      mage: { name: 'Âm dương sư', desc: 'Bùa nổ diện rộng', projectile: 'spark', look: { tint: '#fca5a5' } },
      catapult: { name: 'Máy bắn đá', desc: 'Phá tượng ×3' },
      giant: { name: 'Quỷ Oni', desc: 'Chùy sắt, da dày', armor: 0.18, look: { head: 'oni', ink: '#5a1d1d', weapon: 'club' } },
      builder: { name: 'Thợ mộc', desc: 'Dựng tháp canh gỗ', look: { head: 'kasa', weapon: 'hammer' } },
      tower: { name: 'Tháp canh gỗ', desc: 'Bắn tên' },
    },
  },

  viking: {
    id: 'viking',
    name: 'Viking',
    icon: '🪓',
    color: '#38bdf8',
    desc: 'Cận chiến hung bạo, càng đau càng điên.',
    passive: 'Cuồng nộ: quân càng mất máu càng đánh đau, tới +80% sát thương.',
    counters: ['desert', 'tribe'],
    head: 'horned',
    rage: 0.8,
    hpMult: 1.05,
    units: {
      miner: { name: 'Nô lệ Viking', desc: 'Biết cầm cuốc đánh trả', damage: 12, hp: 100, look: { weapon: 'pick' } },
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
      spear: { name: 'Nữ khiên', desc: 'Khiên tròn chắn tên tốt', armor: 0.3, look: { shield: 'round' } },
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
      builder: { name: 'Thợ đẽo gỗ', desc: 'Dựng tháp gỗ', look: { weapon: 'hammer' } },
      tower: { name: 'Tháp gỗ', desc: 'Ném rìu', projectile: 'axe', dmgType: 'slash', range: 320, damage: 26 },
    },
  },

  desert: {
    id: 'desert',
    name: 'Sa Mạc',
    icon: '🏜️',
    color: '#f2c230',
    desc: 'Giàu vàng, tượng vững, có chiến xa và tư tế mặt trời.',
    passive: 'Vàng sa mạc: thợ mỏ mang về +25% vàng. Tượng +25% máu.',
    counters: ['steam', 'orc'],
    head: 'nemes',
    mineMult: 1.25,
    statueMult: 1.25,
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
      builder: { name: 'Thợ xây tháp', desc: 'Dựng tháp đá', look: { weapon: 'hammer' } },
      tower: { name: 'Tháp đá', desc: 'Bắn tên, giáp dày', hp: 1000 },
    },
  },

  steam: {
    id: 'steam',
    name: 'Đế Chế Sắt',
    icon: '⚙️',
    color: '#9ca3af',
    desc: 'Giáp sắt, súng và đại bác. Đắt và chậm.',
    passive: 'Thép: mọi quân +15% giáp. Đắt hơn 10%, chậm hơn 10%.',
    counters: ['tribe', 'elf'],
    head: 'goggles',
    armorAdd: 0.15,
    costMult: 1.1,
    speedMult: 0.9,
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
      builder: { name: 'Kỹ sư', desc: 'Dựng tháp súng', look: { weapon: 'wrench' } },
      tower: { name: 'Tháp súng', desc: 'Bắn đạn xuyên giáp', projectile: 'bullet', dmgType: 'pierce', damage: 26 },
    },
  },
};

export const FACTION_ORDER: FactionId[] = ['tribe', 'orc', 'elf', 'undead', 'samurai', 'viking', 'desert', 'steam'];

export const counteredBy = (f: FactionId): FactionId[] => FACTION_ORDER.filter((x) => FACTIONS[x].counters.includes(f));
