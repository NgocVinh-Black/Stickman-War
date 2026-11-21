import {
  FACTIONS,
  LEVELS,
  ROUND,
  UNITS,
  damageMult,
  type ArmorType,
  type DamageType,
  type FactionId,
  type UnitKind,
} from '@stickman-war/core';
import { CIV_EN, LEVEL_EN } from './content-en';
import { pick, t } from './index';

/** Nội dung game theo ngôn ngữ đang chọn (lõi giữ bản tiếng Việt, tiếng Anh nằm ở content-en.ts). */

/** Tên nền văn minh (hệ) theo ngôn ngữ. */
export const civName = (f: FactionId) => pick(FACTIONS[f].name, CIV_EN[f].name);
export const civDesc = (f: FactionId) => pick(FACTIONS[f].desc, CIV_EN[f].desc);
export const civPassive = (f: FactionId) => pick(FACTIONS[f].passive, CIV_EN[f].passive);
export const civWeakness = (f: FactionId) => pick(FACTIONS[f].weakness, CIV_EN[f].weakness);
export const civBeat = (f: FactionId) => pick(FACTIONS[f].beat, CIV_EN[f].beat);

const enUnit = (k: UnitKind) => CIV_EN[UNITS[k].faction].units[UNITS[k].arch];
export const unitName = (k: UnitKind) => pick(UNITS[k].name, enUnit(k)[0]);
export const unitDesc = (k: UnitKind) => pick(UNITS[k].desc, enUnit(k)[1]);

const ARMORS: ArmorType[] = ['light', 'heavy', 'mounted', 'giant'];
const DMGS: DamageType[] = ['slash', 'pierce', 'arrow', 'magic', 'blunt'];

/** "Mạnh với … · Sợ …" của một quân (cùng luật với lõi, chữ theo ngôn ngữ). */
export function unitCounter(k: UnitKind): string {
  const s = UNITS[k];
  const parts: string[] = [];
  const strong = ARMORS.filter((a) => damageMult(s.dmgType, a) >= 1.2).map((a) => t(`unit.armor.${a}`));
  const weak = DMGS.filter((d) => damageMult(d, s.armorType) >= 1.3).map((d) => t(`unit.dmg.${d}`));
  if (s.dmgType === 'siege') parts.push(t('unit.siege'));
  else if (strong.length) parts.push(t('unit.strong', { list: strong.join(', ') }));
  if (weak.length) parts.push(t('unit.weak', { list: weak.join(', ') }));
  return parts.join(' · ');
}

/** Tên / lời giới thiệu màn `i`; vòng 3 là màn vòng 2 kèm "(khó)". */
export function levelName(i: number): string {
  if (i >= 2 * ROUND) return t('campaign.hard', { name: levelName(i - ROUND) });
  return pick(LEVELS[i].name, LEVEL_EN[i]?.[0]);
}
export function levelIntro(i: number): string {
  if (i >= 2 * ROUND) return levelIntro(i - ROUND);
  return pick(LEVELS[i].intro, LEVEL_EN[i]?.[1]);
}
