import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { ALL_ARCHS, FACTIONS, FACTION_ORDER, LEVELS, ROUND, UNITS, kindOf, roster } from '@stickman-war/core';
import { describe, expect, it } from 'vitest';
import { civName, levelIntro, levelName, ultDesc, ultName, unitCounter, unitName, unitSkillDesc, unitSkillName } from './content';
import { LEVEL_EN } from './content-en';
import { en, lang, t, vi } from './index';
import { SERVER_EN, serverText } from './server';

/** Mọi cặp (khoá, chuỗi) của một từ điển. */
function leaves(o: object, p = ''): [string, string][] {
  return Object.entries(o).flatMap(([k, v]) =>
    typeof v === 'string' ? [[p + k, v] as [string, string]] : leaves(v as object, `${p}${k}.`),
  );
}
const params = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('Đa ngôn ngữ', () => {
  it('tiếng Anh có đủ khoá và đúng tham số {…} như tiếng Việt', () => {
    const e = new Map(leaves(en));
    for (const [k, v] of leaves(vi)) {
      expect(e.has(k), k).toBe(true);
      expect(params(e.get(k)!), k).toEqual(params(v));
    }
  });

  it('t() thay tham số và đổi theo ngôn ngữ', () => {
    lang.value = 'vi';
    expect(t('common.gold', { n: 150 })).toBe('150 vàng');
    lang.value = 'en';
    expect(t('common.gold', { n: 150 })).toBe('150 gold');
    lang.value = 'vi';
  });

  it('nội dung game: đủ 22 màn tiếng Anh, vòng 3 thêm "(hard)", tên quân và khắc chế theo ngôn ngữ', () => {
    expect(LEVEL_EN).toHaveLength(2 * ROUND);
    lang.value = 'en';
    expect(levelName(0)).toBe('First Battle');
    expect(levelName(2 * ROUND)).toBe(`${LEVEL_EN[ROUND][0]} (hard)`);
    expect(levelIntro(2 * ROUND)).toBe(LEVEL_EN[ROUND][1]);
    expect(unitName('sword')).toBe('Light swordsman');
    expect(civName('wood')).toBe('Verdant Grove');
    expect(unitCounter('spear')).toMatch(/^Strong vs/);
    for (const f of FACTION_ORDER) for (const k of roster(f)) expect(unitName(k), k).not.toBe('');
    lang.value = 'vi';
    expect(levelName(2 * ROUND)).toBe(LEVELS[2 * ROUND].name);
    expect(unitName('sword')).toBe(UNITS.sword.name);
    expect(civName('wood')).toBe(FACTIONS.wood.name);
    expect(unitCounter('spear')).toBe(UNITS.spear.counter);
  });

  it('kỹ năng riêng của mọi quân có tên và mô tả ở cả hai ngôn ngữ, không sót khoá', () => {
    for (const l of ['vi', 'en'] as const) {
      lang.value = l;
      for (const f of FACTION_ORDER)
        for (const a of ALL_ARCHS) {
          const k = kindOf(f, a);
          expect(unitSkillName(k), k).not.toBe('');
          const d = unitSkillDesc(k);
          expect(d, k).toMatch(/: \S/);
          expect(d, k).not.toMatch(/skill\.|\{/);
        }
      for (const f of FACTION_ORDER) {
        expect(ultName(f), f).not.toBe('');
        expect(ultDesc(f), f).toMatch(/: \S/);
        expect(ultDesc(f), f).not.toMatch(/skill\.|\{/);
      }
    }
    lang.value = 'en';
    expect(unitSkillName('sword')).toBe('Radiant slash');
    lang.value = 'vi';
    expect(unitSkillName('sword')).toBe(UNITS.sword.skill!.name);
  });

  it('mọi câu máy chủ gửi (lỗi, dòng hệ thống, lỗi API) đều có bản tiếng Anh', () => {
    const dir = join(__dirname, '../../../apps/server/src');
    const files = (d: string): string[] =>
      readdirSync(d, { withFileTypes: true }).flatMap((x) => (x.isDirectory() ? files(join(d, x.name)) : [join(d, x.name)]));
    const texts = new Set<string>();
    for (const f of files(dir).filter((x) => x.endsWith('.ts'))) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/(?:msg: |error: |system\(\w+, )(['`])((?:(?!\1).)*)\1/g)) texts.add(m[2]);
      // this.system(room, a ? `…` : `…`)
      for (const m of src.matchAll(/system\(\w+, [^?\n]+\? (['`])((?:(?!\1).)*)\1 : (['`])((?:(?!\3).)*)\3/g)) {
        texts.add(m[2]);
        texts.add(m[4]);
      }
    }
    const sample = (s: string) => s.replace(/\$\{[^}]+\}/g, '7');
    const vn = /[ạảãáàâầấậẩẫăằắặẳẵđêềếệểễôồốộổỗơờớợởỡưừứựửữĐ]/i;
    const missing = [...texts].map(sample).filter((s) => vn.test(s) && !SERVER_EN.some(([re]) => re.test(s)));
    expect(missing).toEqual([]);
    expect(texts.size).toBeGreaterThan(20);
    lang.value = 'en';
    expect(serverText('An đã rời phòng')).toBe('An left the room');
    lang.value = 'vi';
    expect(serverText('An đã rời phòng')).toBe('An đã rời phòng');
  });
});
