import type { Arch, UnitStats } from './units';

export type FactionId =
  'light' | 'wind' | 'wood' | 'shadow' | 'thunder' | 'blood' | 'crystal' | 'stone' | 'metal' | 'water' | 'fire' | 'ice';

/** Kiểu đầu / tóc vẽ cho quân của từng hệ. */
export type Head =
  | 'halo' // Quang: tóc dựng + hào quang
  | 'gale' // Phong: tóc dài bay
  | 'leafhood' // Mộc: mũ trùm lá
  | 'shade' // Ám: mũ trùm có sừng
  | 'bolt' // Lôi: tóc tia sét
  | 'blood' // Huyết: tóc rối + băng trán
  | 'crystal' // Tinh thể: tinh thể mọc trên đầu
  | 'rock' // Thạch: mũ đá
  | 'iron' // Kim: mũ sắt có mào
  | 'wave' // Thủy: tóc sóng
  | 'flame' // Hỏa: tóc lửa
  | 'icecrown'; // Băng: vương miện băng
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
  | 'trident';
export type Mount = 'horse' | 'wolf' | 'elk' | 'boar' | 'bonehorse' | 'chariot' | 'shark' | 'lizard' | 'bear';
export type Machine = 'catapult' | 'ram' | 'cannon' | 'ballista';

export type Look = {
  head?: Head;
  weapon?: Weapon;
  mount?: Mount;
  machine?: Machine;
  shield?: 'oval' | 'round' | 'square' | 'none';
  ink?: string; // màu thân riêng (Phong xanh, người cây nâu…)
  tint?: string; // màu điểm nhấn của vũ khí / phép
};

/** Phần ghi đè chỉ số + mô tả cho một loại quân của hệ. */
export type UnitDef = Partial<Omit<UnitStats, 'arch' | 'faction' | 'look'>> & { name: string; desc: string; look?: Look };

export type FactionDef = {
  id: FactionId;
  name: string;
  icon: string;
  color: string; // màu chủ đạo cho giao diện
  desc: string;
  passive: string;
  weakness: string; // điểm yếu
  beat: string; // cách đánh bại hệ này bằng quân và chiến thuật
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
  light: {
    id: 'light',
    name: 'Thánh Quang Điện',
    icon: '☀️',
    color: '#f5c542',
    desc: 'Hệ Quang. Đạo quân ánh sáng kỷ luật: cân bằng, dễ chơi, đủ mọi loại quân.',
    passive: 'Kỷ luật ánh sáng: quân rẻ hơn 15%, lên sao kỳ cựu rất nhanh (1 / 3 / 6 mạng).',
    weakness: 'Quân non: máu -4%, chưa lên sao thì thua quân tinh nhuệ; chỉ đánh cận chiến thì dễ đuối.',
    beat: 'Đánh sớm bằng quân trâu (giáo binh, khổng lồ) trước khi lính họ lên sao; hạ lính lẻ, đừng để họ gom mạng.',
    head: 'halo',
    rankKills: [1, 3, 6],
    costMult: 0.85,
    hpMult: 0.96,
    units: {
      miner: { name: 'Thợ mỏ', desc: 'Đào vàng nuôi quân. Chết thì rơi túi vàng đang mang' },
      sword: { damage: 20, name: 'Kiếm sĩ ánh sáng', armor: 0.05, desc: 'Cận chiến nhanh, rẻ' },
      archer: { name: 'Cung thủ quang tiễn', desc: 'Bắn tên sáng từ xa' },
      ninja: { name: 'Thích khách ánh chớp', desc: 'Lướt qua tiền tuyến, ám sát hàng sau' },
      spear: { hp: 480, name: 'Hộ vệ thánh thuẫn', armor: 0.3, desc: 'Khiên dày, máu trâu. Đâm kỵ binh ×2' },
      cavalry: { name: 'Kỵ sĩ bạch mã', desc: 'Phi càng xa, cú đâm đầu càng đau' },
      healer: { name: 'Tu sĩ chữa lành', range: 180, heal: 22, desc: 'Hồi nhiều máu cho quân bị thương gần nhất, tầm xa' },
      banner: {
        name: 'Tay trống thánh ca',
        hp: 170,
        aura: { radius: 180, dmg: 0.2, haste: 0.15 },
        desc: 'Thánh ca: quân quanh đó mạnh hơn 20%, nhanh hơn 15%',
      },
      mage: { name: 'Pháp sư quang cầu', desc: 'Cầu sáng nổ diện rộng' },
      catapult: { name: 'Máy phóng thánh thạch', desc: 'Bắn cực xa, phá tượng ×3' },
      giant: { name: 'Thánh vệ khổng lồ', armor: 0.15, desc: 'Đập nát cả đám' },
      builder: { name: 'Thợ xây đền', desc: 'Dựng trạm vàng cạnh mỏ: thợ mỏ nộp vàng gần hơn, trạm bắn địch (tối đa 2)' },
      tower: { name: 'Tháp ánh sáng', desc: 'Nhận vàng từ thợ mỏ, đứng yên bắn tên' },
      wall: {
        name: 'Tường đá trắng',
        desc: 'Tường đá trắng có cổng, chắc chắn và cân bằng',
        cost: 300,
        hp: 1600,
        armor: 0.25,
        buildTime: 6,
      },
    },
  },

  wind: {
    id: 'wind',
    name: 'Cuồng Phong Trại',
    icon: '🌪️',
    color: '#5fcf9f',
    desc: 'Hệ Phong. Bầy quân gió lốc: chạy nhanh, càng đông càng mạnh, đứng lẻ thì yếu.',
    passive:
      'Cuồng phong: quân đánh chạy nhanh hơn 10%, đánh mạnh hơn 10%, máu +4%, rẻ hơn 5%; mỗi đồng đội đứng gần cộng +2.5% sát thương, tối đa +15%.',
    weakness: 'Thợ mỏ đắt (150 vàng), bắn xa tầm ngắn hơn 5%, không có giáp dày: đứng lẻ là yếu, bị dồn đòn là gục.',
    beat: 'Đánh tách bầy: phép nổ diện rộng vào cục quân, ninja hạ con lẻ; giữ đội hình chắc, đừng đuổi theo vì họ chạy nhanh hơn.',
    head: 'gale',
    horde: { radius: 120, per: 0.025, max: 0.15 },
    hpMult: 1.04,
    speedMult: 1.1,
    rangeMult: 0.95,
    damageMult: 1.1,
    costMult: 0.95,
    units: {
      miner: {
        name: 'Tiểu phong đào vàng',
        desc: 'Nhỏ, chạy nhanh',
        cost: 150,
        speed: 82,
        scale: 0.8,
        look: { weapon: 'pick' },
      },
      sword: { name: 'Chiến binh lốc', desc: 'Đao to bản, chém đau', speed: 100, damage: 20, hp: 115, look: { weapon: 'cleaver' } },
      archer: {
        name: 'Lính phóng lao gió',
        desc: 'Lao đâm xuyên, khắc kỵ binh',
        cooldown: 1.5,
        projectile: 'bolt',
        dmgType: 'pierce',
        range: 300,
        damage: 21,
        look: { weapon: 'throw' },
      },
      ninja: {
        name: 'Bom lốc xoáy',
        desc: 'Lao vào giữa địch rồi tự nổ tung',
        kamikaze: true,
        blink: false,
        cost: 220,
        hp: 60,
        speed: 140,
        damage: 55,
        splash: 70,
        dmgType: 'blunt',
        scale: 0.85,
        look: { weapon: 'bomb' },
      },
      spear: {
        name: 'Hộ vệ bão cát',
        desc: 'Tự hồi máu liên tục',
        hp: 400,
        speed: 72,
        regen: 3,
        look: { shield: 'square', weapon: 'spear' },
      },
      cavalry: { scale: 1.05, name: 'Kỵ sĩ sói gió', desc: 'Húc mạnh, máu trâu', hp: 360, speed: 165, look: { mount: 'wolf' } },
      healer: {
        name: 'Pháp sư gió lành',
        desc: 'Gió lành hồi máu nhanh, liên tục',
        speed: 88,
        cooldown: 0.9,
        heal: 16,
        look: { weapon: 'staff' },
      },
      banner: {
        name: 'Trống bão',
        aura: { radius: 200, dmg: 0.12, haste: 0.3 },
        desc: 'Nhịp trống bão: quân quanh đó nhanh hơn 30%, mạnh hơn 12%',
      },
      mage: { name: 'Pháp sư sấm gió', desc: 'Sét gió nổ diện rộng', damage: 40, cooldown: 2.6, projectile: 'spark' },
      catapult: { name: 'Máy phóng lốc đá', desc: 'Đá to, chậm, phá tượng ×3', damage: 72, cooldown: 5.2 },
      giant: { name: 'Cự nhân bão tố', desc: 'To, máu nhiều', cooldown: 2.2, speed: 50, hp: 1150, look: { weapon: 'club' } },
      builder: { name: 'Thợ dựng chong chóng', desc: 'Dựng trạm gió phóng lao', look: { weapon: 'hammer' } },
      tower: { name: 'Tháp chong chóng', desc: 'Nhận vàng, phóng lao', projectile: 'bolt', dmgType: 'pierce' },
      wall: {
        name: 'Rào gió gai',
        desc: 'Đánh cận chiến vào rào bị gai đâm lại',
        cost: 280,
        hp: 1500,
        armor: 0.2,
        buildTime: 5,
        thorns: { dmg: 14 },
      },
    },
  },

  wood: {
    id: 'wood',
    name: 'Thanh Mộc Lâm',
    icon: '🌿',
    color: '#4fd16a',
    desc: 'Hệ Mộc. Người giữ rừng: bắn xa, tự hồi máu, mỏng manh khi bị áp sát.',
    passive:
      'Sức sống rừng: hồi 0.7 máu/giây khi 4 giây không bị đánh; người cây và tường cây tự mọc lại; cung thủ tầm bắn rất xa. Đánh mạnh hơn 13%, máu +4%.',
    weakness: 'Quân đắt hơn 2%, hàng bắn xa mỏng manh: sợ phép nổ diện rộng và quân lao vào hàng sau.',
    beat: 'Pháp sư, máy bắn đá đánh vào cụm; kỵ binh, ninja lao thẳng vào hàng cung; đánh liên tục, không cho họ nghỉ để hồi máu.',
    head: 'leafhood',
    hpMult: 1.04,
    regen: 0.7,
    damageMult: 1.13,
    costMult: 1.02,
    units: {
      miner: { name: 'Tinh linh hái vàng', desc: 'Bay nhanh giữa mỏ và nhà', speed: 98, look: { weapon: 'pick' } },
      sword: { name: 'Vũ công kiếm lá', desc: 'Múa kiếm cực nhanh', hp: 100, damage: 14, cooldown: 0.68, look: { weapon: 'saber' } },
      archer: { name: 'Cung thủ rừng', desc: 'Tầm bắn rất xa', damage: 21, range: 400 },
      ninja: {
        scale: 0.9,
        name: 'Thợ săn gai độc',
        desc: 'Lướt tới, mũi dao tẩm độc làm chậm',
        hp: 80,
        slow: 0,
        look: { weapon: 'dagger' },
      },
      spear: {
        name: 'Người cây',
        desc: 'Vỏ dày, tự mọc lại 9 máu/giây',
        regen: 6,
        hp: 560,
        speed: 46,
        dmgType: 'blunt',
        armor: 0.15,
        look: { weapon: 'club', shield: 'none' },
      },
      cavalry: { name: 'Kỵ sĩ hươu', desc: 'Nhanh, gạc hươu húc', hp: 290, speed: 165, look: { mount: 'elk' } },
      healer: {
        name: 'Tư tế rừng',
        desc: 'Hồi máu cho cả nhóm quanh mục tiêu',
        healAoe: 110,
        heal: 12,
        look: { weapon: 'staff' },
      },
      banner: { name: 'Sáo thần', desc: 'Tiếng sáo làm quân đánh nhanh hơn', aura: { radius: 180, dmg: 0.1, haste: 0.3 } },
      mage: { name: 'Pháp sư lá bay', desc: 'Lốc lá hất địch lùi xa', range: 320, projectile: 'wind', damage: 40, knock: 20 },
      catapult: {
        name: 'Nỏ thần',
        desc: 'Tên khổng lồ bắn hạ quân to (×1.5 vào khổng lồ)',
        projectile: 'bolt',
        dmgType: 'arrow',
        damage: 100,
        splash: 0,
        range: 560,
        minRange: 120,
        cooldown: 3.6,
        look: { machine: 'ballista' },
      },
      giant: {
        scale: 2.6,
        name: 'Cổ thụ',
        desc: 'Rễ cây trói chân địch',
        speed: 36,
        slow: 2,
        regen: 4,
        look: { weapon: 'club' },
      },
      builder: { name: 'Tinh linh trồng cây', desc: 'Trồng trạm cây bắn tên', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm cây', desc: 'Nhận vàng, bắn tên xa', range: 470 },
      wall: { name: 'Tường cây', desc: 'Cây sống tự mọc lại 6 máu/giây', cost: 300, hp: 1400, armor: 0.15, buildTime: 6, regen: 6 },
    },
  },

  shadow: {
    id: 'shadow',
    name: 'Hội Bóng Đêm',
    icon: '🌑',
    color: '#a78bfa',
    desc: 'Hệ Ám. Giáo phái bóng tối: quân rẻ, yếu, rất đông. Càng giết càng giàu.',
    passive: 'Thu hồn: hạ quân địch nhận 10% giá của nó. Quân rẻ hơn 12%, đánh mạnh hơn 5%.',
    weakness: 'Máu -3%, quân lẻ yếu: đánh tay đôi thua, sợ phép nổ diện rộng.',
    beat: 'Tường khiên với quân trâu, đừng để quân mình chết lẻ (mỗi mạng là vàng cho họ); quân yếu thì rút về hồi máu.',
    head: 'shade',
    hpMult: 0.97,
    damageMult: 1.05,
    costMult: 0.88,
    bounty: 0.1,
    units: {
      miner: { scale: 0.85, name: 'Bóng đào vàng', desc: 'Rẻ, mỏng', cost: 100, hp: 55, look: { weapon: 'pick' } },
      sword: {
        scale: 0.9,
        name: 'Bóng binh',
        desc: 'Mỗi lần xây ra 2 con',
        spawnCount: 2,
        cost: 160,
        hp: 80,
        damage: 16,
        look: { weapon: 'sword' },
      },
      archer: { damage: 19, name: 'Cung bóng tối', desc: 'Bắn tên rẻ' },
      ninja: {
        name: 'Bóng ma',
        desc: 'Tàng hình, chỉ lộ ra khi ra đòn',
        stealth: true,
        blink: false,
        dmgType: 'magic',
        look: { weapon: 'scythe' },
      },
      spear: {
        name: 'Hiệp sĩ đêm',
        desc: 'Hút máu 35% sát thương gây ra',
        lifesteal: 0.35,
        look: { weapon: 'halberd', shield: 'none' },
      },
      cavalry: { name: 'Kỵ sĩ không đầu', desc: 'Ngựa bóng đêm phi như gió', speed: 168, look: { mount: 'bonehorse' } },
      healer: {
        name: 'Thầy gọi hồn',
        desc: 'Không hồi máu: gọi xác chết gần đó dậy làm bóng binh 25 giây',
        heal: 0,
        raise: 'shadow-sword',
        cooldown: 4,
        look: { weapon: 'staff' },
      },
      banner: { name: 'Cờ hồn', aura: { radius: 170, dmg: 0.28, haste: 0.05 }, desc: 'Cờ ma: quân quanh đó hung hãn, mạnh hơn 28%' },
      mage: {
        name: 'Phù thuỷ hắc vụ',
        desc: 'Mây độc rút máu dần',
        projectile: 'poison',
        damage: 30,
        poison: { dps: 10, dur: 4 },
      },
      catapult: { name: 'Máy phóng hồn', desc: 'Ném cầu hắc vụ, để lại độc', projectile: 'poison', poison: { dps: 8, dur: 4 }, damage: 50 },
      giant: { name: 'Ác linh khổng lồ', desc: 'Hút máu 20% sát thương', lifesteal: 0.2, look: { weapon: 'cleaver' } },
      builder: { name: 'Thợ dựng mộ', desc: 'Dựng trạm bóng đêm', look: { weapon: 'hammer' } },
      tower: { name: 'Tháp bóng đêm', desc: 'Nhận vàng, bắn tên' },
      wall: { name: 'Tường hắc thạch', desc: 'Rẻ nhưng mỏng', cost: 220, hp: 1250, armor: 0.2, buildTime: 5 },
    },
  },

  thunder: {
    id: 'thunder',
    name: 'Lôi Kiếm Các',
    icon: '⚡',
    color: '#facc15',
    desc: 'Hệ Lôi. Kiếm khách sấm sét: ra đòn nhanh và chí mạng.',
    passive: 'Lôi kích: nhát chém cận chiến đầu tiên vào mỗi mục tiêu mới gây ×3.4 sát thương. Đánh nhanh hơn 15%, mạnh hơn 6%.',
    weakness: 'Máu -10%, đắt hơn 2%: đòn mạnh nhất chỉ có ở nhát đầu, bị vây đông hay bị bắn xa thì đuối.',
    beat: 'Cho quân giáp dày (giáo binh, khổng lồ) đỡ nhát đầu; dùng số đông quân rẻ và bắn xa để tiêu hao.',
    head: 'bolt',
    firstStrike: 3.4,
    cooldownMult: 0.85,
    hpMult: 0.9,
    costMult: 1.02,
    damageMult: 1.06,
    units: {
      miner: { name: 'Thợ mỏ lôi', desc: 'Đào vàng giữa trời giông', look: { weapon: 'pick' } },
      sword: { name: 'Lôi kiếm khách', desc: 'Kiếm sét chém ngọt', hp: 110, damage: 20, look: { weapon: 'katana' } },
      archer: { hp: 100, name: 'Cung lôi tiễn', desc: 'Cung dài bắn chuẩn', range: 440, damage: 27 },
      ninja: { scale: 0.9, name: 'Ảnh lôi', desc: 'Tàng hình và lướt tới ám sát', damage: 26, stealth: true, look: { weapon: 'katana' } },
      spear: {
        name: 'Lính đao sét',
        desc: 'Đao dài quét trúng nhiều địch',
        armor: 0.2,
        splash: 34,
        damage: 28,
        look: { weapon: 'naginata', shield: 'none' },
      },
      cavalry: { name: 'Kỵ sĩ sấm', hp: 300, speed: 160, desc: 'Lao tới chém một nhát chí mạng' },
      healer: { name: 'Tu sĩ tĩnh điện', desc: 'Tĩnh điện hồi máu nhanh', cooldown: 1.1, heal: 20, look: { weapon: 'staff' } },
      banner: { name: 'Trống sấm', aura: { radius: 170, dmg: 0.15, haste: 0.3 }, desc: 'Trống sấm: quân quanh đó đánh nhanh hơn 30%' },
      mage: { damage: 50, name: 'Lôi pháp sư', desc: 'Bùa sét nổ diện rộng', range: 340, projectile: 'spark' },
      catapult: { damage: 70, name: 'Máy phóng sét', desc: 'Phá tượng ×3' },
      giant: { name: 'Lôi thần khổng lồ', desc: 'Chùy sấm, da dày', armor: 0.18, look: { weapon: 'club' } },
      builder: { name: 'Thợ dựng cột thu lôi', desc: 'Dựng trạm sét', look: { weapon: 'hammer' } },
      tower: { name: 'Cột thu lôi', desc: 'Nhận vàng, bắn tên' },
      wall: { name: 'Thành sấm', desc: 'Dựng nhanh (4 giây)', cost: 320, hp: 1550, armor: 0.25, buildTime: 4 },
    },
  },

  blood: {
    id: 'blood',
    name: 'Huyết Nguyệt Giáo',
    icon: '🩸',
    color: '#ef4444',
    desc: 'Hệ Huyết. Giáo phái trăng máu: cận chiến hung bạo, càng đau càng điên.',
    passive: 'Huyết nộ: quân càng mất máu càng đánh đau, tới +30% sát thương. Máu +3%, quân rẻ hơn 7%.',
    weakness: 'Giáp -5%: lúc còn khoẻ đánh yếu, dễ bị dồn sát thương hạ nhanh.',
    beat: 'Dồn sát thương hạ dứt điểm từng con (pháp sư, ninja, nhiều cung); đừng để quân họ máu thấp đánh lâu.',
    head: 'blood',
    rage: 0.3,
    armorAdd: -0.05,
    hpMult: 1.03,
    costMult: 0.93,
    units: {
      miner: { name: 'Nô lệ máu', desc: 'Biết cầm cuốc đánh trả', damage: 12, hp: 100, look: { weapon: 'pick' } },
      sword: { scale: 1.05, name: 'Chiến binh huyết rìu', desc: 'Rìu chém xuyên giáp nhẹ', damage: 20, hp: 130, look: { weapon: 'axe' } },
      archer: {
        cooldown: 1.9,
        name: 'Lính ném rìu máu',
        desc: 'Ném rìu tầm gần, rất đau',
        projectile: 'axe',
        dmgType: 'slash',
        range: 240,
        damage: 15,
        look: { weapon: 'throw' },
      },
      ninja: {
        scale: 1.05,
        name: 'Cuồng huyết',
        desc: 'Lao vào giữa trận, máu càng thấp càng khủng',
        blink: false,
        rage: 1,
        hp: 150,
        damage: 24,
        speed: 115,
        look: { weapon: 'axe' },
      },
      spear: { name: 'Nữ khiên máu', desc: 'Khiên tròn chắn đòn, giáp dày', damage: 32, armor: 0.25, look: { shield: 'round' } },
      cavalry: { name: 'Kỵ sĩ sói máu', desc: 'Sói phi nhanh nhất', speed: 162, hp: 290, look: { mount: 'wolf' } },
      healer: {
        name: 'Nữ tiên tri máu',
        desc: 'Nghi lễ máu: hồi rất nhiều máu nhưng chậm',
        cooldown: 1.6,
        heal: 30,
        look: { weapon: 'staff' },
      },
      banner: { name: 'Tù và trăng máu', desc: 'Tiếng tù và làm quân hăng: +25% sát thương', aura: { radius: 170, dmg: 0.25, haste: 0.1 } },
      mage: { name: 'Thầy huyết ấn', desc: 'Ấn máu làm chậm địch', projectile: 'spark', slow: 1.5 },
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
      giant: {
        scale: 2.35,
        name: 'Huyết ma khổng lồ',
        desc: 'Đập làm chậm địch',
        armor: 0.05,
        damage: 62,
        hp: 1450,
        slow: 2,
        look: { weapon: 'club' },
      },
      builder: { name: 'Thợ đẽo gỗ', desc: 'Dựng trạm gỗ', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm trăng máu', desc: 'Nhận vàng, ném rìu', projectile: 'axe', dmgType: 'slash', range: 320, damage: 26 },
      wall: { name: 'Hàng cọc máu', desc: 'Rẻ, dựng nhanh, hơi mỏng', cost: 240, hp: 1450, armor: 0.2, buildTime: 4 },
    },
  },

  crystal: {
    id: 'crystal',
    name: 'Tinh Thạch Cốc',
    icon: '💎',
    color: '#e879f9',
    desc: 'Hệ Tinh thể. Thung lũng pha lê: giàu vàng, tượng vững, có chiến xa và tư tế tinh quang.',
    passive: 'Tinh thể: máu +6%, đánh mạnh hơn 5%, tượng +25% máu; thợ mỏ, kỵ binh, cờ hiệu, thợ xây có kỹ năng ra vàng.',
    weakness: 'Chậm hơn 3%, không có nội tại khống chế; kinh tế dựa vào kỹ năng nên mất thợ mỏ, cờ hiệu là hụt vàng.',
    beat: 'Tấn công sớm và quấy thợ mỏ (nhất là mỏ kim cương) trước khi họ giàu lên.',
    head: 'crystal',
    mineMult: 1,
    statueMult: 1.25,
    damageMult: 1.05,
    hpMult: 1.06,
    speedMult: 0.97,
    units: {
      miner: { name: 'Thợ đẽo tinh thể', desc: 'Mang về nhiều vàng', look: { weapon: 'pick' } },
      sword: { name: 'Kiếm sĩ liềm pha lê', desc: 'Đao cong móc khiên', armor: 0.1, look: { weapon: 'khopesh' } },
      archer: { name: 'Cung thủ pha lê', range: 400, desc: 'Bắn tên' },
      ninja: { name: 'Sát thủ lăng kính', desc: 'Lướt qua tiền tuyến', look: { weapon: 'dagger' } },
      spear: { name: 'Vệ binh tinh thể', desc: 'Hút máu 15%', armor: 0.3, lifesteal: 0.15, look: { weapon: 'halberd' } },
      cavalry: {
        scale: 1.15,
        name: 'Chiến xa pha lê',
        desc: 'Bánh xe nghiền cả đám khi lao tới',
        chargeSplash: 45,
        hp: 360,
        speed: 135,
        look: { mount: 'chariot' },
      },
      healer: { name: 'Tư tế tinh thể', desc: 'Tinh quang hồi máu từ xa', range: 200, heal: 22, look: { weapon: 'staff' } },
      banner: {
        name: 'Chuông pha lê',
        aura: { radius: 220, dmg: 0.15, haste: 0.15 },
        desc: 'Chuông pha lê: tiếng vang phủ rộng, quân mạnh và nhanh hơn 15%',
      },
      mage: { name: 'Tư tế tinh quang', desc: 'Cầu sáng thiêu đốt', projectile: 'sun' },
      catapult: { name: 'Máy phóng tinh thể', desc: 'Phá tượng ×3' },
      giant: {
        name: 'Người khổng lồ pha lê',
        desc: 'Lời nguyền: đòn đánh để lại độc',
        armor: 0.2,
        poison: { dps: 7, dur: 4 },
        look: { weapon: 'club' },
      },
      builder: { name: 'Thợ mài đá quý', desc: 'Dựng trạm tinh thể', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm tinh thể', desc: 'Nhận vàng, bắn tên, chắc hơn (nhiều máu)', hp: 1000 },
      wall: { name: 'Tường pha lê', desc: 'Dày, nhiều máu', cost: 330, hp: 2000, armor: 0.2, buildTime: 7 },
    },
  },

  stone: {
    id: 'stone',
    name: 'Bàn Thạch Bảo',
    icon: '🪨',
    color: '#c8a27a',
    desc: 'Hệ Thạch. Pháo đài đá tảng: giáp dày, súng đá và máy phóng, nhưng chậm.',
    passive: 'Thân đá: mọi quân +5% giáp, máu +2%, rẻ hơn 3%; thợ khoan đào vàng nhanh.',
    weakness: 'Chậm hơn 3%: khó đuổi địch, tiếp viện tới chậm.',
    beat: 'Pháp sư (phép đốt giáp nặng), đông quân rẻ vây đánh; thả diều và quấy thợ mỏ vì họ chậm.',
    head: 'rock',
    armorAdd: 0.05,
    speedMult: 0.97,
    rangeMult: 1,
    hpMult: 1.02,
    costMult: 0.97,
    units: {
      miner: { name: 'Thợ khoan đá', desc: 'Mũi khoan đào nhanh', mineTime: 1.4, look: { weapon: 'drill' } },
      sword: { scale: 1.05, name: 'Kiếm sĩ đá', desc: 'Kiếm và giáp đá', speed: 80, armor: 0.15, look: { weapon: 'saber' } },
      archer: {
        name: 'Lính súng đá',
        desc: 'Đạn đá xuyên giáp, nạp đạn chậm',
        projectile: 'bullet',
        dmgType: 'pierce',
        damage: 23,
        range: 420,
        cooldown: 2.5,
        look: { weapon: 'musket' },
      },
      ninja: { name: 'Thích khách móc đá', desc: 'Phóng móc lướt tới hàng sau', look: { weapon: 'dagger' } },
      spear: { scale: 1.25, name: 'Vệ binh bàn thạch', desc: 'Giáp dày nhất', armor: 0.3, look: { shield: 'square' } },
      cavalry: { name: 'Kỵ sĩ lợn đá', desc: 'Nhanh, húc mạnh', armor: 0.15, speed: 150, look: { mount: 'boar' } },
      healer: {
        name: 'Thợ vá đá',
        desc: 'Vá giáp, hồi máu; thân bọc đá chắc chắn',
        armor: 0.15,
        hp: 150,
        heal: 20,
        look: { weapon: 'hammer' },
      },
      banner: {
        name: 'Kèn đá vang',
        armor: 0.2,
        hp: 220,
        aura: { radius: 190, dmg: 0.15, haste: 0.1 },
        desc: 'Kèn đá: thân bọc đá, quân quanh đó mạnh hơn 15%',
      },
      mage: {
        name: 'Lính phun dung nham',
        desc: 'Lửa tầm gần, đốt liên tục',
        projectile: 'fireball',
        range: 210,
        damage: 28,
        cooldown: 1.4,
        splash: 55,
        look: { weapon: 'musket' },
      },
      catapult: {
        name: 'Máy phóng tảng',
        desc: 'Bắn xa, phá tượng ×3',
        projectile: 'boulder',
        damage: 50,
        range: 640,
        look: { machine: 'catapult' },
      },
      giant: { scale: 2.4, name: 'Người đá', desc: 'Giáp đá dày', armor: 0.3, look: { weapon: 'hammer' } },
      builder: { name: 'Thợ đục đá', desc: 'Dựng trạm súng đá', look: { weapon: 'hammer' } },
      tower: { name: 'Tháp súng đá', desc: 'Nhận vàng, bắn đạn xuyên giáp', projectile: 'bullet', dmgType: 'pierce', damage: 26 },
      wall: { name: 'Tường bàn thạch', desc: 'Giáp rất dày nhưng đắt', cost: 360, hp: 1700, armor: 0.45, buildTime: 7 },
    },
  },
  metal: {
    id: 'metal',
    name: 'Thiết Lò Môn',
    icon: '⚒️',
    color: '#ff8c3a',
    desc: 'Hệ Kim. Môn phái lò rèn: lì lợm, càng về cuối trận càng mạnh.',
    passive: 'Lò rèn: quân xây ra càng muộn càng mạnh, mỗi phút +2.2% máu và sát thương (tối đa +40%).',
    weakness: 'Đầu trận yếu: chậm hơn 12%, lúc lò rèn chưa nóng thì không có gì nổi bật.',
    beat: 'Đánh sớm, dồn ép trước phút thứ 5; quấy thợ mỏ để họ không có vàng xây quân muộn.',
    head: 'iron',
    forge: { perMin: 0.022, max: 0.4 },
    speedMult: 0.88,
    hpMult: 1.0,
    units: {
      miner: { name: 'Thợ mỏ sắt', desc: 'Đào nhanh, chắc tay', mineTime: 1.6, hp: 95, look: { weapon: 'pick' } },
      sword: {
        scale: 1.05,
        name: 'Chiến binh rìu thép',
        desc: 'Lì lợm, giáp dày',
        hp: 140,
        armor: 0.1,
        look: { weapon: 'axe', shield: 'round' },
      },
      archer: {
        name: 'Lính hoả thương',
        desc: 'Đạn chì xuyên giáp, nạp chậm',
        projectile: 'bullet',
        dmgType: 'pierce',
        damage: 28,
        range: 360,
        cooldown: 2.3,
        look: { weapon: 'musket' },
      },
      ninja: { name: 'Thợ đào hầm', desc: 'Chui lên giữa hàng sau địch', look: { weapon: 'pick' } },
      spear: {
        scale: 1.25,
        name: 'Vệ binh khiên sắt',
        desc: 'Khiên vuông, giáp cực dày',
        armor: 0.38,
        look: { shield: 'square', weapon: 'hammer' },
      },
      cavalry: { scale: 1.15, name: 'Kỵ sĩ chiến mã thép', desc: 'Húc chắc, máu trâu', hp: 380, speed: 128, look: { mount: 'horse' } },
      healer: { name: 'Thợ rèn ấn', desc: 'Gõ ấn hồi máu', cooldown: 1.4, heal: 24, look: { weapon: 'hammer' } },
      banner: { name: 'Kèn đồng lò', aura: { radius: 170, dmg: 0.25, haste: 0.08 }, desc: 'Kèn lò rèn: quân quanh đó đánh mạnh hơn 25%' },
      mage: { name: 'Pháp sư ấn lửa', desc: 'Ấn nổ diện rộng', projectile: 'spark' },
      catapult: {
        name: 'Đại pháo',
        desc: 'Bắn xa, phá tượng ×3',
        projectile: 'cannonball',
        damage: 74,
        range: 660,
        look: { machine: 'cannon' },
      },
      giant: { name: 'Người thép', desc: 'Thân thép, giáp dày', damage: 62, armor: 0.25, look: { weapon: 'hammer' } },
      builder: { name: 'Thợ dựng lò', desc: 'Dựng trạm rèn bắn súng', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm lò rèn', desc: 'Nhận vàng, bắn đạn xuyên giáp', projectile: 'bullet', dmgType: 'pierce', damage: 24 },
      wall: { name: 'Tường thép rèn', desc: 'Trâu nhất nhưng dựng chậm (9 giây)', cost: 380, hp: 2300, armor: 0.35, buildTime: 9 },
    },
  },

  water: {
    id: 'water',
    name: 'Thủy Nguyệt Cung',
    icon: '🌊',
    color: '#38bdf8',
    desc: 'Hệ Thủy. Cung điện trăng nước: đánh lâu không mệt nhờ hút máu.',
    passive: 'Thủy triều: mọi đòn đánh hút 24% sát thương thành máu. Máu +4%, quân rẻ hơn 14%.',
    weakness: 'Đánh chậm hơn 3%, sát thương -3%: sợ phép nổ và đòn dồn dập hạ gục trước khi kịp hút máu.',
    beat: 'Hạ nhanh bằng phép nổ và bắn xa tập trung; đừng đánh tay đôi kéo dài với họ.',
    head: 'wave',
    lifesteal: 0.24,
    damageMult: 0.97,
    cooldownMult: 1.03,
    hpMult: 1.04,
    costMult: 0.86,
    units: {
      miner: { name: 'Thợ mò ngọc', desc: 'Lặn mò vàng', look: { weapon: 'pick' } },
      sword: { name: 'Lính đinh ba', desc: 'Đâm nhanh', cooldown: 0.82, dmgType: 'pierce', look: { weapon: 'trident' } },
      archer: {
        name: 'Lính phóng lao nước',
        desc: 'Lao xuyên, khắc kỵ binh',
        projectile: 'bolt',
        dmgType: 'pierce',
        range: 310,
        damage: 20,
        look: { weapon: 'throw' },
      },
      ninja: { name: 'Thích khách sóng ngầm', desc: 'Lướt tới, dao tẩm độc', poison: { dps: 6, dur: 3 }, look: { weapon: 'dagger' } },
      spear: { name: 'Vệ binh mai rùa', desc: 'Mai rùa chắn đòn', armor: 0.25, look: { shield: 'oval', weapon: 'trident' } },
      cavalry: { name: 'Kỵ sĩ cá mập', desc: 'Lao như cá mập săn mồi', speed: 145, look: { mount: 'shark' } },
      healer: { name: 'Tiên cá', desc: 'Hồi máu cho cả nhóm', healAoe: 90, heal: 12, look: { weapon: 'staff' } },
      banner: {
        name: 'Tù và ốc',
        aura: { radius: 190, dmg: 0.15, haste: 0.2 },
        desc: 'Tù và ốc: quân quanh đó nhanh hơn 20%, mạnh hơn 15%',
      },
      mage: {
        name: 'Pháp sư triều cường',
        desc: 'Sóng nước hất địch lùi',
        projectile: 'wind',
        damage: 36,
        knock: 35,
      },
      catapult: {
        name: 'Máy phóng lao',
        desc: 'Lao khổng lồ, khắc quân to',
        projectile: 'bolt',
        dmgType: 'arrow',
        damage: 62,
        splash: 0,
        range: 560,
        minRange: 120,
        cooldown: 3.6,
        look: { machine: 'ballista' },
      },
      giant: { scale: 2.4, name: 'Thủy quái', desc: 'Xúc tu quất cả đám', splash: 70, look: { weapon: 'club' } },
      builder: { name: 'Thợ san hô', desc: 'Dựng trạm san hô', look: { weapon: 'hammer' } },
      tower: { name: 'Trạm san hô', desc: 'Nhận vàng, phóng lao', projectile: 'bolt', dmgType: 'pierce' },
      wall: { name: 'Rạn san hô', desc: 'San hô tự mọc lại 5 máu/giây', cost: 290, hp: 1500, armor: 0.2, buildTime: 6, regen: 5 },
    },
  },

  fire: {
    id: 'fire',
    name: 'Viêm Long Môn',
    icon: '🔥',
    color: '#ff6a2a',
    desc: 'Hệ Hỏa. Môn phái rồng lửa: mọi đòn đều để lại lửa.',
    passive: 'Lửa rồng: mọi đòn đánh đốt mục tiêu 8.5 máu/giây trong 3 giây. Đánh mạnh hơn 3%, máu +14%.',
    weakness: 'Quân đắt hơn 4%: ít quân, khó bù khi thua giao tranh.',
    beat: 'Đông quân rẻ vây đánh, thầy thuốc hồi lại máu bị đốt; dồn họ vào giao tranh sớm khi còn ít quân.',
    head: 'flame',
    burn: { dps: 8.5, dur: 3 },
    costMult: 1.04,
    damageMult: 1.03,
    hpMult: 1.14,
    units: {
      miner: { name: 'Thợ mỏ lửa', desc: 'Đào vàng trong núi lửa', look: { weapon: 'pick' } },
      sword: { name: 'Hiệp sĩ hỏa long', desc: 'Kiếm lửa', damage: 20, look: { weapon: 'sword' } },
      archer: { damage: 22, range: 400, name: 'Cung thủ hỏa tiễn', desc: 'Tên lửa bắn xa' },
      ninja: { name: 'Sát thủ tro', desc: 'Lướt tới hàng sau', damage: 25, look: { weapon: 'dagger' } },
      spear: { name: 'Vệ binh vảy rồng', desc: 'Vảy rồng cứng', armor: 0.3, look: { weapon: 'halberd', shield: 'none' } },
      cavalry: { name: 'Kỵ sĩ thằn lằn', desc: 'Thằn lằn lửa phi nhanh', speed: 160, look: { mount: 'lizard' } },
      healer: { name: 'Tư tế lửa thiêng', desc: 'Lửa thiêng hồi máu', heal: 22, look: { weapon: 'staff' } },
      banner: { name: 'Trống rồng', aura: { radius: 170, dmg: 0.3, haste: 0.05 }, desc: 'Tiếng gầm rồng: quân quanh đó mạnh hơn 30%' },
      mage: { name: 'Pháp sư hỏa cầu', desc: 'Cầu lửa nổ lớn', projectile: 'fireball', splash: 75 },
      catapult: { name: 'Máy bắn đá lửa', desc: 'Đá lửa phá tượng ×3', projectile: 'fireball', damage: 62 },
      giant: { scale: 2.1, name: 'Rồng con', desc: 'Phun lửa trúng cả đám', splash: 70, look: { weapon: 'club' } },
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

  ice: {
    id: 'ice',
    name: 'Hàn Băng Cung',
    icon: '❄️',
    color: '#9fdcff',
    desc: 'Hệ Băng. Cung điện băng giá: khống chế địch bằng giá lạnh.',
    passive: 'Giá lạnh: mọi đòn đánh làm chậm mục tiêu 4 giây. Thân băng: máu +22%, quân rẻ hơn 8%.',
    weakness: 'Chậm hơn 2%, không có đòn đặc biệt mạnh: hạ địch chậm.',
    beat: 'Quân trâu, máu nhiều (khổng lồ, giáo binh) không sợ bị làm chậm; dồn thẳng vào họ thay vì đuổi theo.',
    head: 'icecrown',
    chill: 4,
    hpMult: 1.22,
    speedMult: 0.98,
    costMult: 0.92,
    units: {
      miner: { name: 'Thợ đục băng', desc: 'Đục vàng trong băng', look: { weapon: 'pick' } },
      sword: { name: 'Kiếm sĩ hàn băng', desc: 'Kiếm băng', damage: 16, look: { weapon: 'sword' } },
      archer: { name: 'Cung thủ băng', desc: 'Tên băng bắn xa', damage: 18 },
      ninja: { name: 'Bóng tuyết', desc: 'Lướt theo gió tuyết tới hàng sau', look: { weapon: 'dagger' } },
      spear: { name: 'Vệ binh băng giáp', desc: 'Giáp băng dày', armor: 0.3, look: { shield: 'round' } },
      cavalry: { scale: 1.2, name: 'Kỵ sĩ gấu tuyết', desc: 'Gấu to, máu trâu', hp: 400, speed: 128, look: { mount: 'bear' } },
      healer: { name: 'Pháp sư tuyết', desc: 'Hồi máu, thân băng chắc', hp: 140, heal: 20, look: { weapon: 'staff' } },
      banner: {
        name: 'Kèn bão tuyết',
        hp: 200,
        aura: { radius: 170, dmg: 0.15, haste: 0.1 },
        desc: 'Kèn bão tuyết: thân băng chắc, thúc quân',
      },
      mage: { name: 'Pháp sư băng', desc: 'Bão băng làm chậm lâu', projectile: 'spark', slow: 2 },
      catapult: { name: 'Máy ném băng', desc: 'Tảng băng phá tượng ×3' },
      giant: { scale: 2.45, name: 'Người tuyết khổng lồ', desc: 'Đập làm đóng băng', speed: 36, slow: 2, look: { weapon: 'club' } },
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
];

/**
 * Mã hệ cũ (đặt theo tên tộc, trước khi đổi sang 12 nguyên tố) → mã mới. Dùng để đọc dữ liệu đã lưu
 * (bộ nhớ trình duyệt, tệp nhập cũ, client cũ gửi lên); cơ sở dữ liệu máy chủ được chuyển bằng migration.
 */
export const LEGACY_FACTIONS: Readonly<Record<string, FactionId>> = {
  tribe: 'light',
  orc: 'wind',
  elf: 'wood',
  undead: 'shadow',
  samurai: 'thunder',
  viking: 'blood',
  desert: 'crystal',
  steam: 'stone',
  dwarf: 'metal',
  tide: 'water',
  dragon: 'fire',
  frost: 'ice',
};

/** Mã hệ hợp lệ (nhận cả mã cũ), không hợp lệ thì null. */
export function toFactionId(f: unknown): FactionId | null {
  if (typeof f !== 'string') return null;
  if ((FACTION_ORDER as string[]).includes(f)) return f as FactionId;
  return LEGACY_FACTIONS[f] ?? null;
}
