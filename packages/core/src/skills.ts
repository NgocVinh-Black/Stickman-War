import type { FactionId } from './factions';
import type { Arch } from './units';

/**
 * Kỹ năng riêng của từng quân, theo đặc trưng nền văn minh. Mọi kỹ năng tự kích hoạt (người chơi chỉ điều quân
 * theo thế trận), lời mô tả hiệu ứng tự sinh từ các tham số dưới đây (packages/i18n/src/content.ts).
 *
 * Khi nào kích hoạt (`on`):
 * - strike: đòn đánh cường hoá, hồi chiêu `every` giây; hiệu ứng áp lên mục tiêu (và địch quanh đó nếu có `area`)
 * - pulse: cứ `every` giây phát ra quanh mình khi đang giao tranh
 * - low: một lần khi máu xuống dưới LOW_HP
 * - death: khi bị hạ
 * - kill: khi hạ được quân địch
 * - haul: thợ mỏ, chuyến vàng đầu tiên sau mỗi `every` giây được thêm `gold`
 * - built: thợ xây dựng xong trạm, phát quanh trạm
 * - ult: chiêu tượng thần (ULTS), người chơi chọn chỗ tung ra
 */
export type SkillTrigger = 'strike' | 'pulse' | 'low' | 'death' | 'kill' | 'haul' | 'built' | 'ult';

export type Skill = {
  name: string;
  on: SkillTrigger;
  every?: number;
  /** strike: nhân sát thương đòn này. */
  power?: number;
  /** Bán kính: strike = địch quanh mục tiêu cũng dính (kèm SKILL_SPLASH sát thương); còn lại = quanh bản thân. */
  area?: number;
  /** Sát thương lên mỗi địch trong `area` (không phải strike). */
  dmg?: number;
  stun?: number; // giây choáng: không đi, không đánh
  slow?: number; // giây làm chậm
  knock?: number; // hất lùi
  dot?: { dps: number; dur: number }; // độc / lửa / chảy máu theo thời gian
  sunder?: { mult: number; dur: number }; // phá giáp: nhận thêm tỉ lệ sát thương này
  drain?: number; // strike: hồi máu bằng tỉ lệ sát thương đòn đó
  heal?: number; // hồi máu bản thân, tỉ lệ máu tối đa
  mend?: number; // hồi máu cho quân mình trong `area`
  guard?: { mult: number; dur: number }; // giảm tỉ lệ sát thương nhận
  haste?: { mult: number; dur: number }; // chạy và đánh nhanh hơn
  /** guard / haste áp cho cả quân mình trong `area` thay vì chỉ bản thân. */
  allies?: boolean;
  summon?: { arch: Arch; count: number; life: number }; // gọi quân của hệ mình (tồn tại `life` giây)
  gold?: number; // vàng cho phe mình
};

/** Ngưỡng máu của kỹ năng "low". */
export const LOW_HP = 0.4;
/** Kỹ năng strike có `area`: địch quanh mục tiêu nhận chừng này sát thương của đòn. */
export const SKILL_SPLASH = 0.5;

const dot = (dps: number, dur: number) => ({ dps, dur });
const pct = (mult: number, dur: number) => ({ mult, dur });

export const SKILLS: Record<FactionId, Record<Arch, Skill>> = {
  // Hệ Quang: phù hộ, khiên thánh, ánh sáng chói loà (choáng)
  light: {
    miner: { name: 'Phúc lành', on: 'low', heal: 0.5, guard: pct(0.5, 4) },
    sword: { name: 'Chém thánh quang', on: 'strike', every: 6, power: 1.5, stun: 0.4 },
    archer: { name: 'Tiễn chói loà', on: 'strike', every: 8, power: 1.3, stun: 0.5 },
    ninja: { name: 'Phán xét chớp nhoáng', on: 'kill', heal: 0.25, haste: pct(0.5, 4) },
    spear: { name: 'Thánh thuẫn', on: 'pulse', every: 10, area: 120, guard: pct(0.3, 4), allies: true },
    cavalry: { name: 'Thánh chiến xung phong', on: 'strike', every: 9, power: 1.4, area: 70, knock: 40 },
    healer: { name: 'Ánh sáng tái sinh', on: 'pulse', every: 12, area: 150, mend: 30 },
    banner: { name: 'Thánh ca hộ mệnh', on: 'pulse', every: 12, area: 180, guard: pct(0.2, 5), allies: true },
    mage: { name: 'Thánh phạt', on: 'strike', every: 10, power: 1.3, area: 80, stun: 0.6 },
    catapult: { name: 'Thánh thạch chói loà', on: 'strike', every: 12, area: 60, stun: 1 },
    giant: { name: 'Phán quyết cuối cùng', on: 'low', area: 150, guard: pct(0.5, 6), mend: 60 },
    builder: { name: 'Ban phước trạm', on: 'built', area: 250, guard: pct(0.25, 6), allies: true },
    tower: { name: 'Tia sáng thánh', on: 'strike', every: 9, power: 2, stun: 0.5 },
    wall: { name: 'Tường thánh hộ', on: 'pulse', every: 12, area: 160, guard: pct(0.25, 5), allies: true },
  },
  // Hệ Phong: tốc độ, hất lùi, lốc xoáy
  wind: {
    miner: { name: 'Chạy như gió', on: 'low', haste: pct(0.8, 5) },
    sword: { name: 'Lốc xoáy chém', on: 'strike', every: 6, power: 1.3, area: 60 },
    archer: { name: 'Lao gió xuyên', on: 'strike', every: 8, power: 1.5, haste: pct(0.3, 3) },
    ninja: { name: 'Lốc hút', on: 'strike', area: 90, slow: 2.5 },
    spear: { name: 'Tường gió', on: 'pulse', every: 10, area: 100, dmg: 12, knock: 50 },
    cavalry: { name: 'Sói săn bầy', on: 'kill', heal: 0.25, haste: pct(0.4, 4) },
    healer: { name: 'Gió xuân', on: 'pulse', every: 10, area: 160, mend: 20, haste: pct(0.25, 4), allies: true },
    banner: { name: 'Trống cuồng phong', on: 'pulse', every: 12, area: 180, haste: pct(0.3, 5), allies: true },
    mage: { name: 'Lốc sét', on: 'strike', every: 9, power: 1.2, area: 60, slow: 1.5 },
    catapult: { name: 'Đá lốc', on: 'strike', every: 12, power: 1.2, area: 70, slow: 2 },
    giant: { name: 'Bão quét', on: 'pulse', every: 9, area: 110, dmg: 30, slow: 2 },
    builder: { name: 'Gió lành', on: 'built', area: 300, haste: pct(0.3, 6), allies: true },
    tower: { name: 'Lao bão', on: 'strike', every: 7, power: 1.5, slow: 1 },
    wall: { name: 'Gió đẩy', on: 'pulse', every: 8, area: 90, dmg: 8, knock: 70 },
  },
  // Hệ Mộc: rễ trói (choáng), gai độc, tự hồi phục
  wood: {
    miner: { name: 'Ẩn vào rừng', on: 'low', heal: 0.3, guard: pct(0.6, 5) },
    sword: { name: 'Vũ điệu lá', on: 'strike', every: 6, power: 1.3, haste: pct(0.4, 3) },
    archer: { name: 'Tên gai độc', on: 'strike', every: 8, power: 1.1, dot: dot(5, 3) },
    ninja: { name: 'Trói gai', on: 'strike', every: 8, stun: 0.8 },
    spear: { name: 'Rễ trói', on: 'pulse', every: 12, area: 90, stun: 0.7 },
    cavalry: { name: 'Gạc xuyên', on: 'strike', every: 8, power: 1.5, knock: 40 },
    healer: { name: 'Mưa sương', on: 'pulse', every: 14, area: 160, mend: 25 },
    banner: { name: 'Sáo mê hoặc', on: 'pulse', every: 10, area: 160, slow: 2 },
    mage: { name: 'Bào tử độc', on: 'strike', every: 10, area: 80, dot: dot(6, 4) },
    catapult: { name: 'Mũi tên rễ', on: 'strike', every: 10, power: 1.3, stun: 1.5 },
    giant: { name: 'Rừng già hồi sinh', on: 'low', heal: 0.3, guard: pct(0.2, 5) },
    builder: { name: 'Gieo hạt', on: 'built', summon: { arch: 'spear', count: 1, life: 20 } },
    tower: { name: 'Dây leo', on: 'strike', every: 8, slow: 3, stun: 0.5 },
    wall: { name: 'Gai rừng bung', on: 'low', area: 120, dmg: 40, dot: dot(6, 4) },
  },
  // Hệ Ám: gọi hồn, nguyền (phá giáp), hút máu, khiếp sợ
  shadow: {
    miner: { name: 'Hồn lìa xác', on: 'death', summon: { arch: 'sword', count: 1, life: 15 } },
    sword: { name: 'Cắn xé', on: 'strike', every: 6, power: 1.2, drain: 0.6 },
    archer: { name: 'Tên nguyền', on: 'strike', every: 8, sunder: pct(0.25, 5) },
    ninja: { name: 'Lưỡi hái linh hồn', on: 'kill', heal: 0.4, haste: pct(0.3, 3) },
    spear: { name: 'Màn đêm nguyền', on: 'pulse', every: 10, area: 110, sunder: pct(0.2, 4) },
    cavalry: { name: 'Tiếng hí kinh hoàng', on: 'strike', every: 10, area: 70, stun: 1 },
    healer: { name: 'Nghi lễ tử thần', on: 'pulse', every: 15, summon: { arch: 'sword', count: 1, life: 15 } },
    banner: { name: 'Cờ khiếp sợ', on: 'pulse', every: 12, area: 170, slow: 2, sunder: pct(0.15, 4) },
    mage: { name: 'Hắc vụ nguyền', on: 'strike', every: 10, area: 80, sunder: pct(0.3, 5) },
    catapult: { name: 'Dịch hạch', on: 'strike', every: 12, area: 90, dot: dot(10, 5) },
    giant: { name: 'Đám tang ác linh', on: 'death', summon: { arch: 'sword', count: 3, life: 20 } },
    builder: { name: 'Mộ gió', on: 'built', summon: { arch: 'sword', count: 2, life: 20 } },
    tower: { name: 'Ánh mắt bóng đêm', on: 'strike', every: 8, sunder: pct(0.25, 5) },
    wall: { name: 'Tường mộ', on: 'death', summon: { arch: 'sword', count: 3, life: 20 } },
  },
  // Hệ Lôi: chí mạng, sét lan, choáng
  thunder: {
    miner: { name: 'Tĩnh điện', on: 'low', area: 60, dmg: 20, stun: 0.8 },
    sword: { name: 'Bạt kiếm', on: 'strike', every: 7, power: 2 },
    archer: { name: 'Tên sấm', on: 'strike', every: 8, power: 1.2, area: 60 },
    ninja: { name: 'Lôi ảnh sát', on: 'kill', heal: 0.2, haste: pct(0.6, 3) },
    spear: { name: 'Quét lôi', on: 'strike', every: 9, area: 50, stun: 0.6 },
    cavalry: { name: 'Lôi kích xung phong', on: 'strike', every: 9, power: 1.3, stun: 1 },
    healer: { name: 'Lôi hồi sinh', on: 'pulse', every: 12, area: 150, mend: 30, haste: pct(0.2, 3), allies: true },
    banner: { name: 'Trống sấm vang', on: 'pulse', every: 12, area: 140, dmg: 12, stun: 0.5 },
    mage: { name: 'Xích lôi', on: 'strike', every: 9, power: 1.3, area: 110, stun: 0.6 },
    catapult: { name: 'Sét đánh', on: 'strike', every: 12, area: 60, stun: 1.2 },
    giant: { name: 'Thiên lôi', on: 'pulse', every: 10, area: 120, dmg: 35, stun: 0.8 },
    builder: { name: 'Cột thu lôi', on: 'built', area: 200, dmg: 40, stun: 1 },
    tower: { name: 'Sét giáng', on: 'strike', every: 7, power: 1.6, stun: 0.6 },
    wall: { name: 'Lưới điện', on: 'pulse', every: 7, area: 70, dmg: 18, stun: 0.5 },
  },
  // Hệ Huyết: chảy máu, hút máu, cuồng nộ
  blood: {
    miner: { name: 'Liều mạng', on: 'low', haste: pct(0.5, 5) },
    sword: { name: 'Rìu rỉ máu', on: 'strike', every: 6, power: 1.2, dot: dot(7, 4) },
    archer: { name: 'Rìu xoáy', on: 'strike', every: 8, power: 1.4, sunder: pct(0.2, 4) },
    ninja: { name: 'Cuồng sát', on: 'kill', heal: 0.35, haste: pct(0.4, 4) },
    spear: { name: 'Khiên máu', on: 'low', heal: 0.25, guard: pct(0.5, 6) },
    cavalry: { name: 'Sói khát máu', on: 'strike', every: 8, power: 1.3, drain: 0.8 },
    healer: { name: 'Máu nuôi máu', on: 'pulse', every: 10, area: 150, mend: 45 },
    banner: { name: 'Khúc tử chiến', on: 'low', area: 200, haste: pct(0.4, 6), allies: true },
    mage: { name: 'Huyết ấn', on: 'strike', every: 10, area: 80, dot: dot(10, 4), slow: 1.5 },
    catapult: { name: 'Húc phá', on: 'strike', every: 8, power: 2 },
    giant: { name: 'Huyết bạo', on: 'low', heal: 0.3, haste: pct(0.5, 8) },
    builder: { name: 'Lễ tế máu', on: 'built', area: 250, mend: 80 },
    tower: { name: 'Rìu bay', on: 'strike', every: 7, dot: dot(8, 4) },
    wall: { name: 'Cọc máu', on: 'low', area: 100, dmg: 30, dot: dot(8, 4) },
  },
  // Hệ Tinh thể: khiên pha lê, phá giáp, vàng
  crystal: {
    miner: { name: 'Kim cương lấp lánh', on: 'haul', every: 30, gold: 5 },
    sword: { name: 'Liềm pha lê', on: 'strike', every: 7, power: 1.2, sunder: pct(0.25, 4) },
    archer: { name: 'Tên lăng kính', on: 'strike', every: 9, power: 1.3, area: 50 },
    ninja: { name: 'Phân thân lăng kính', on: 'low', summon: { arch: 'ninja', count: 1, life: 10 } },
    spear: { name: 'Giáp tinh thể', on: 'strike', every: 8, guard: pct(0.4, 3) },
    cavalry: { name: 'Bánh xe kim cương', on: 'kill', gold: 25, haste: pct(0.3, 3) },
    healer: { name: 'Tinh quang hộ mệnh', on: 'pulse', every: 12, area: 150, guard: pct(0.3, 4), allies: true },
    banner: { name: 'Chuông vang tinh thể', on: 'pulse', every: 15, gold: 12 },
    mage: { name: 'Tinh quang thiêu', on: 'strike', every: 10, power: 1.3, area: 70, sunder: pct(0.25, 5) },
    catapult: { name: 'Mảnh vỡ tinh thể', on: 'strike', every: 12, power: 1.2, area: 100, slow: 2 },
    giant: { name: 'Vỏ pha lê', on: 'low', guard: pct(0.6, 6) },
    builder: { name: 'Mạch vàng', on: 'built', gold: 80 },
    tower: { name: 'Lăng kính hội tụ', on: 'strike', every: 8, power: 2.2 },
    wall: { name: 'Tường phản quang', on: 'low', area: 200, guard: pct(0.3, 6), allies: true },
  },
  // Hệ Thạch: đá đè (choáng), da đá, động đất
  stone: {
    miner: { name: 'Da đá', on: 'low', guard: pct(0.6, 5) },
    sword: { name: 'Chém vỡ đá', on: 'strike', every: 8, stun: 0.5 },
    archer: { name: 'Đạn đá nặng', on: 'strike', every: 9, power: 1.5, knock: 30 },
    ninja: { name: 'Móc kéo', on: 'strike', every: 8, stun: 1 },
    spear: { name: 'Đứng như núi', on: 'low', guard: pct(0.7, 6) },
    cavalry: { name: 'Húc đá', on: 'strike', every: 9, power: 1.3, stun: 1 },
    healer: { name: 'Vá giáp', on: 'pulse', every: 12, area: 150, mend: 20, guard: pct(0.15, 4), allies: true },
    banner: { name: 'Kèn động đất', on: 'pulse', every: 14, area: 160, dmg: 10, slow: 2 },
    mage: { name: 'Dung nham', on: 'strike', every: 8, area: 60, dot: dot(10, 4) },
    catapult: { name: 'Tảng đá lăn', on: 'strike', every: 12, area: 70, stun: 1, knock: 40 },
    giant: { name: 'Động đất', on: 'pulse', every: 10, area: 120, dmg: 25, stun: 0.8 },
    builder: { name: 'Đá lở', on: 'built', area: 220, dmg: 30, knock: 60 },
    tower: { name: 'Đạn xuyên phá', on: 'strike', every: 9, power: 1.8, sunder: pct(0.2, 4) },
    wall: { name: 'Tường lở', on: 'death', area: 120, dmg: 60, stun: 1 },
  },
  // Hệ Kim: phá giáp, búa rèn, thân thép
  metal: {
    miner: { name: 'Túi sắt', on: 'death', gold: 40 },
    sword: { name: 'Rìu phá giáp', on: 'strike', every: 7, sunder: pct(0.3, 4) },
    archer: { name: 'Đạn chì nặng', on: 'strike', every: 9, power: 1.6, sunder: pct(0.15, 4) },
    ninja: { name: 'Độn thổ', on: 'low', heal: 0.3, guard: pct(0.5, 3) },
    spear: { name: 'Đập khiên', on: 'strike', every: 8, stun: 0.6 },
    cavalry: { name: 'Giáp thép xung phong', on: 'strike', every: 10, power: 1.4, guard: pct(0.4, 3) },
    healer: { name: 'Tôi luyện', on: 'pulse', every: 12, area: 150, mend: 25, guard: pct(0.15, 5), allies: true },
    banner: { name: 'Kèn lò rèn', on: 'pulse', every: 14, area: 170, sunder: pct(0.2, 5) },
    mage: { name: 'Ấn nổ', on: 'strike', every: 10, power: 1.4, area: 70, stun: 0.6 },
    catapult: { name: 'Đạn nổ', on: 'strike', every: 12, power: 1.5, area: 90 },
    giant: { name: 'Búa rèn', on: 'strike', every: 8, power: 1.3, sunder: pct(0.3, 5) },
    builder: { name: 'Lò hồng', on: 'built', area: 300, sunder: pct(0.25, 8) },
    tower: { name: 'Đạn lửa rèn', on: 'strike', every: 8, dot: dot(8, 4) },
    wall: { name: 'Thép tôi', on: 'low', guard: pct(0.5, 8) },
  },
  // Hệ Thủy: sóng hất, làm chậm, hồi máu
  water: {
    miner: { name: 'Bong bóng', on: 'low', heal: 0.4 },
    sword: { name: 'Đinh ba xoáy', on: 'strike', every: 7, power: 1.2, slow: 2 },
    archer: { name: 'Lao sóng', on: 'strike', every: 8, power: 1.4, slow: 2 },
    ninja: { name: 'Sóng ngầm', on: 'kill', heal: 0.5 },
    spear: { name: 'Mai rùa', on: 'low', heal: 0.2, guard: pct(0.6, 6) },
    cavalry: { name: 'Cá mập vồ', on: 'strike', every: 8, power: 1.3, drain: 1 },
    healer: { name: 'Suối nguồn', on: 'pulse', every: 12, area: 140, mend: 50 },
    banner: { name: 'Ốc gọi triều', on: 'pulse', every: 12, area: 170, slow: 2.5 },
    mage: { name: 'Sóng thần', on: 'strike', every: 10, power: 1.2, area: 100, stun: 0.7 },
    catapult: { name: 'Lao xoáy nước', on: 'strike', every: 10, power: 1.5, slow: 3 },
    giant: { name: 'Xúc tu siết', on: 'strike', every: 8, stun: 1.2, drain: 0.5 },
    builder: { name: 'Suối san hô', on: 'built', area: 250, mend: 40, slow: 4 },
    tower: { name: 'Lao triều', on: 'strike', every: 8, power: 1.4, slow: 2 },
    wall: { name: 'Rạn hồi sinh', on: 'pulse', every: 10, area: 160, mend: 25 },
  },
  // Hệ Hỏa: thiêu đốt, nổ tung
  fire: {
    miner: { name: 'Than hồng', on: 'death', area: 70, dmg: 25, dot: dot(8, 3) },
    sword: { name: 'Kiếm hỏa long', on: 'strike', every: 7, power: 1.4, dot: dot(10, 3) },
    archer: { name: 'Mưa tên lửa', on: 'strike', every: 9, area: 60, dot: dot(8, 3) },
    ninja: { name: 'Tro tàn', on: 'death', area: 80, dmg: 40, dot: dot(8, 3) },
    spear: { name: 'Vảy nóng', on: 'pulse', every: 8, area: 70, dmg: 12, dot: dot(6, 3) },
    cavalry: { name: 'Vệt lửa', on: 'strike', every: 8, area: 60, dot: dot(10, 3) },
    healer: { name: 'Phượng hoàng', on: 'low', heal: 1, area: 150, mend: 40 },
    banner: { name: 'Trống rồng gầm', on: 'pulse', every: 12, area: 150, dot: dot(6, 4) },
    mage: { name: 'Thiên thạch', on: 'strike', every: 12, power: 1.8, area: 80, stun: 0.5 },
    catapult: { name: 'Đá nham thạch', on: 'strike', every: 12, area: 80, dot: dot(12, 4) },
    giant: { name: 'Hơi thở rồng', on: 'pulse', every: 10, area: 130, dmg: 30, dot: dot(10, 3) },
    builder: { name: 'Lò lửa', on: 'built', area: 200, dmg: 50, dot: dot(8, 3) },
    tower: { name: 'Hoả tiễn', on: 'strike', every: 8, power: 1.4, area: 50 },
    wall: { name: 'Phun lửa', on: 'pulse', every: 8, area: 80, dmg: 15, dot: dot(8, 3) },
  },
  // Hệ Băng: đóng băng (choáng), giá lạnh, khiên băng
  ice: {
    miner: { name: 'Áo băng', on: 'low', guard: pct(0.5, 5) },
    sword: { name: 'Kiếm đóng băng', on: 'strike', every: 8, stun: 0.8 },
    archer: { name: 'Tên băng giá', on: 'strike', every: 9, area: 50, stun: 0.6 },
    ninja: { name: 'Bước tuyết', on: 'kill', haste: pct(0.5, 4), guard: pct(0.3, 4) },
    spear: { name: 'Giáp băng vỡ', on: 'low', area: 80, guard: pct(0.5, 6), stun: 1 },
    cavalry: { name: 'Gấu vồ', on: 'strike', every: 9, power: 1.4, stun: 0.8 },
    healer: { name: 'Tuyết lành', on: 'pulse', every: 12, area: 150, mend: 25, guard: pct(0.2, 4), allies: true },
    banner: { name: 'Bão tuyết', on: 'pulse', every: 12, area: 170, slow: 3 },
    mage: { name: 'Băng phong', on: 'strike', every: 10, area: 70, stun: 1.2 },
    catapult: { name: 'Tảng băng vỡ', on: 'strike', every: 12, area: 90, slow: 4, stun: 0.5 },
    giant: { name: 'Mặt đất đóng băng', on: 'pulse', every: 10, area: 120, dmg: 20, stun: 1 },
    builder: { name: 'Gió bấc', on: 'built', area: 300, slow: 5, guard: pct(0.2, 6), allies: true },
    tower: { name: 'Mũi băng', on: 'strike', every: 8, stun: 0.7 },
    wall: { name: 'Băng vỡ', on: 'death', area: 120, dmg: 50, stun: 1.2 },
  },
};

/**
 * Chiêu tượng thần: chiêu cuối của tượng mỗi nền văn minh. Thanh nộ nạp khi mất quân / tượng bị đánh (và chậm theo
 * thời gian), đầy thì người chơi chọn chỗ trên chiến trường để tung ra. Địch trong `area` quanh chỗ đó dính sát thương /
 * khống chế; quân mình trong `area` được hồi máu (mend) và nhận khiên / tăng tốc; summon gọi quân ra ở chỗ đó.
 */
export const ULTS: Record<FactionId, Skill> = {
  light: { name: 'Thánh quang giáng thế', on: 'ult', area: 300, dmg: 40, stun: 1, mend: 150, guard: pct(0.4, 8), allies: true },
  wind: { name: 'Cuồng phong nổi dậy', on: 'ult', area: 300, dmg: 60, knock: 150, haste: pct(0.5, 8), allies: true },
  wood: { name: 'Rừng thiêng trói buộc', on: 'ult', area: 300, stun: 3, dot: dot(10, 5), mend: 80 },
  shadow: {
    name: 'Đêm trường vĩnh cửu',
    on: 'ult',
    area: 300,
    dmg: 50,
    sunder: pct(0.4, 10),
    summon: { arch: 'sword', count: 6, life: 25 },
  },
  thunder: { name: 'Thiên lôi giáng', on: 'ult', area: 280, dmg: 140, stun: 1.5 },
  blood: { name: 'Huyết nguyệt', on: 'ult', area: 350, dot: dot(12, 5), mend: 100, haste: pct(0.6, 10), allies: true },
  crystal: { name: 'Lăng kính thần', on: 'ult', area: 350, dmg: 50, guard: pct(0.6, 10), allies: true, gold: 300 },
  stone: { name: 'Địa chấn', on: 'ult', area: 320, dmg: 90, stun: 2 },
  metal: { name: 'Lò rèn thần', on: 'ult', area: 350, sunder: pct(0.5, 12), haste: pct(0.3, 10), allies: true },
  water: { name: 'Đại hồng thủy', on: 'ult', area: 320, dmg: 60, knock: 200, slow: 4, mend: 80 },
  fire: { name: 'Mưa thiên thạch', on: 'ult', area: 320, dmg: 160, dot: dot(15, 4) },
  ice: { name: 'Kỷ băng hà', on: 'ult', area: 350, dmg: 40, stun: 4 },
};
