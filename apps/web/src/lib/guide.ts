import type { ArmorType, DamageType, UnitStats } from '@nguoi-que/core';

/** Dữ liệu cho Cẩm nang (GuideTab.vue hiển thị). */
export type GuidePage = 'basics' | 'factions' | 'counters' | 'tactics';
export const GUIDE_PAGES: { id: GuidePage; label: string }[] = [
  { id: 'basics', label: '📖 Cách chơi' },
  { id: 'factions', label: '🏳️ Tộc & quân' },
  { id: 'counters', label: '⚖️ Khắc chế' },
  { id: 'tactics', label: '🧠 Chiến thuật' },
];

export const ARMOR_LABEL: Record<ArmorType, string> = { light: 'Nhẹ', heavy: 'Nặng', mounted: 'Kỵ', giant: 'Khổng lồ' };
export const DMG_LABEL: Record<DamageType, string> = {
  slash: 'Chém',
  pierce: 'Đâm',
  arrow: 'Tên',
  magic: 'Phép',
  blunt: 'Đập',
  siege: 'Công thành',
  none: '—',
};

/** Những dòng mô tả kỹ năng đặc biệt của quân. */
export function traits(s: UnitStats): string[] {
  const t: string[] = [];
  if (s.blink) t.push('lướt tới');
  if (s.stealth) t.push('tàng hình');
  if (s.charge) t.push('phi đâm ×2.5');
  if (s.chargeSplash) t.push('nghiền lan');
  if (s.kamikaze) t.push('tự nổ');
  if (s.siegeOnly) t.push('chỉ đánh tượng');
  if (s.minRange) t.push(`không bắn gần ${s.minRange}`);
  if (s.heal) t.push(`hồi ${s.heal}${s.healAoe ? ' cả nhóm' : ''}`);
  if (s.raise) t.push('gọi xác dậy');
  if (s.aura) t.push(`hào quang +${Math.round(s.aura.dmg * 100)}% đánh, +${Math.round(s.aura.haste * 100)}% tốc`);
  if (s.lifesteal) t.push(`hút máu ${Math.round(s.lifesteal * 100)}%`);
  if (s.slow) t.push('làm chậm');
  if (s.poison) t.push(`độc ${s.poison.dps}/giây`);
  if (s.regen) t.push(`hồi ${s.regen} máu/giây`);
  if (s.knock) t.push('hất lùi');
  if (s.spawnCount) t.push(`ra ${s.spawnCount} con`);
  if (s.splash && !s.kamikaze) t.push('đánh lan');
  if (s.build) t.push('dựng tháp');
  return t;
}
