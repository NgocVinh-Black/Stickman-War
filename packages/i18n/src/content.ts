import {
  FACTIONS,
  LEVELS,
  LOW_HP,
  ROUND,
  ULTS,
  UNITS,
  damageMult,
  type ArmorType,
  type DamageType,
  type FactionId,
  type Skill,
  type UnitKind,
  kindOf,
} from '@stickman-war/core';
import { CIV_EN, LEVEL_EN, SKILL_EN, ULT_EN } from './content-en';
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

/** Tên kỹ năng riêng của quân (rỗng nếu không có). */
export const unitSkillName = (k: UnitKind) => {
  const s = UNITS[k];
  return s.skill ? pick(s.skill.name, SKILL_EN[s.faction][s.arch]) : '';
};

const pc = (x: number) => Math.round(x * 100);

/** Mô tả hiệu ứng kỹ năng, tự sinh từ tham số (luôn khớp với luật trong lõi). */
export function unitSkillDesc(k: UnitKind): string {
  const s = UNITS[k];
  return s.skill ? skillDesc(s.skill, s.faction) : '';
}

/** Tên chiêu tượng thần của nền văn minh. */
export const ultName = (f: FactionId) => pick(ULTS[f].name, ULT_EN[f]);
/** Mô tả chiêu tượng thần (tự sinh từ tham số). */
export const ultDesc = (f: FactionId) => skillDesc(ULTS[f], f);

function skillDesc(sk: Skill, faction: FactionId): string {
  const r = sk.area ?? 0;
  const head =
    sk.on === 'ult'
      ? t('skill.on.ult', { r })
      : sk.on === 'strike'
        ? sk.every
          ? t('skill.on.strike', { n: sk.every })
          : t('skill.on.blast')
        : sk.on === 'pulse'
          ? t('skill.on.pulse', { n: sk.every ?? 0, r })
          : sk.on === 'low'
            ? t('skill.on.low', { p: pc(LOW_HP) })
            : sk.on === 'haul'
              ? t('skill.on.haul', { n: sk.every ?? 0 })
              : t(`skill.on.${sk.on}`);
  const parts: string[] = [];
  if (sk.power && sk.power !== 1) parts.push(t('skill.power', { n: sk.power }));
  if (sk.dmg) parts.push(t('skill.dmg', { n: sk.dmg }));
  if (sk.stun) parts.push(t('skill.stun', { n: sk.stun }));
  if (sk.slow) parts.push(t('skill.slow', { n: sk.slow }));
  if (sk.knock) parts.push(t('skill.knock'));
  if (sk.dot) parts.push(t('skill.dot', { dps: sk.dot.dps, dur: sk.dot.dur }));
  if (sk.sunder) parts.push(t('skill.sunder', { p: pc(sk.sunder.mult), dur: sk.sunder.dur }));
  if (sk.on === 'strike' && r) parts.push(t('skill.spread', { r }));
  if (sk.drain) parts.push(t('skill.drain', { p: pc(sk.drain) }));
  if (sk.heal) parts.push(t('skill.heal', { p: pc(sk.heal) }));
  if (sk.mend) parts.push(t('skill.mend', { n: sk.mend }));
  if (sk.guard) parts.push(t(sk.allies ? 'skill.guardAllies' : 'skill.guardSelf', { p: pc(sk.guard.mult), dur: sk.guard.dur }));
  if (sk.haste) parts.push(t(sk.allies ? 'skill.hasteAllies' : 'skill.hasteSelf', { p: pc(sk.haste.mult), dur: sk.haste.dur }));
  if (sk.summon) {
    const unit = unitName(kindOf(faction, sk.summon.arch));
    parts.push(t('skill.summon', { n: sk.summon.count, unit, life: sk.summon.life }));
  }
  if (sk.gold) parts.push(t('skill.gold', { n: sk.gold }));
  const near = sk.on !== 'strike' && sk.on !== 'pulse' && sk.on !== 'ult' && r ? `, ${t('skill.near', { r })}` : '';
  return `${head}${near}: ${parts.join(', ')}.`;
}

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
