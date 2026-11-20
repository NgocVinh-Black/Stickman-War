import type { ArmorType, DamageType, UnitStats } from '@stickman-war/core';
import { t } from '@stickman-war/i18n';

/** Dữ liệu cho Cẩm nang (GuideTab.vue hiển thị). */
export type GuidePage = 'basics' | 'factions' | 'counters' | 'tactics';
export const GUIDE_PAGES: { id: GuidePage; key: 'guide.basics' | 'guide.civs' | 'guide.counters' | 'guide.tactics' }[] = [
  { id: 'basics', key: 'guide.basics' },
  { id: 'factions', key: 'guide.civs' },
  { id: 'counters', key: 'guide.counters' },
  { id: 'tactics', key: 'guide.tactics' },
];

export const ARMOR_TYPES: ArmorType[] = ['light', 'heavy', 'mounted', 'giant'];
export const DMG_TYPES: DamageType[] = ['slash', 'pierce', 'arrow', 'magic', 'blunt', 'siege'];
export const armorLabel = (a: ArmorType) => t(`guide.armor.${a}`);
export const dmgLabel = (d: DamageType) => t(`guide.dmg.${d}`);

/** Khoá mô tả vai trò theo kỹ năng thật của quân (không chỉ theo khung): tự nổ, cuồng chiến, tàng hình… */
export function roleKey(s: UnitStats) {
  if (s.kamikaze) return 'guide.role.kamikaze' as const;
  if (s.raise) return 'guide.role.raise' as const;
  if (s.siegeOnly) return 'guide.role.ram' as const;
  if (s.arch === 'catapult' && s.dmgType !== 'siege') return 'guide.role.ballista' as const;
  if (s.arch === 'ninja') {
    if (s.blink && s.stealth) return 'guide.role.shinobi' as const;
    if (s.stealth) return 'guide.role.stealth' as const;
    if (!s.blink) return 'guide.role.berserker' as const;
  }
  return `guide.role.${s.arch}` as const;
}

/** Những dòng mô tả kỹ năng đặc biệt của quân. */
export function traits(s: UnitStats): string[] {
  const out: string[] = [];
  if (s.blink) out.push(t('guide.trait.blink'));
  if (s.stealth) out.push(t('guide.trait.stealth'));
  if (s.charge) out.push(t('guide.trait.charge'));
  if (s.chargeSplash) out.push(t('guide.trait.chargeSplash'));
  if (s.kamikaze) out.push(t('guide.trait.kamikaze'));
  if (s.rage) out.push(t('guide.trait.rage', { n: Math.round(s.rage * 100) }));
  if (s.mineTime) out.push(t('guide.trait.mineFast'));
  if (s.siegeOnly) out.push(t('guide.trait.siegeOnly'));
  if (s.minRange) out.push(t('guide.trait.minRange', { n: s.minRange }));
  if (s.heal) out.push(t(s.healAoe ? 'guide.trait.healAoe' : 'guide.trait.heal', { n: s.heal }));
  if (s.raise) out.push(t('guide.trait.raise'));
  if (s.aura) out.push(t('guide.trait.aura', { dmg: Math.round(s.aura.dmg * 100), haste: Math.round(s.aura.haste * 100) }));
  if (s.lifesteal) out.push(t('guide.trait.lifesteal', { n: Math.round(s.lifesteal * 100) }));
  if (s.slow) out.push(t('guide.trait.slow'));
  if (s.poison) out.push(t('guide.trait.poison', { n: s.poison.dps }));
  if (s.regen) out.push(t('guide.trait.regen', { n: s.regen }));
  if (s.knock) out.push(t('guide.trait.knock'));
  if (s.spawnCount) out.push(t('guide.trait.spawn', { n: s.spawnCount }));
  if (s.splash && !s.kamikaze) out.push(t('guide.trait.splash'));
  if (s.build) out.push(t('guide.trait.build'));
  if (s.wall) out.push(t('guide.trait.wall'));
  if (s.thorns?.dmg) out.push(t('guide.trait.thorns', { n: s.thorns.dmg }));
  if (s.thorns?.burn) out.push(t('guide.trait.burnBack'));
  if (s.thorns?.slow) out.push(t('guide.trait.slowBack'));
  if (s.buildTime) out.push(t('guide.trait.buildTime', { n: s.buildTime }));
  return out;
}
