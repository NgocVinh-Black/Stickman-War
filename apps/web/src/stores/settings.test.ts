import { FACTION_ORDER, LEVELS } from '@stickman-war/core';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from './settings';

describe('Cài đặt và tiến độ chiến dịch', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('mỗi hệ một chiến dịch riêng: thắng màn lưu sao, mở màn tiếp, màn cuối đánh dấu hoàn thành', () => {
    const s = useSettings();
    s.campFaction = 'fire';
    s.recordWin('fire', 0, 2);
    expect(s.progress.fire.unlocked).toBe(1);
    expect(s.progress.light.unlocked).toBe(0);
    expect(s.nextLevel).toBe(1);
    expect(s.stars).toBe(2);
    s.recordWin('fire', 0, 1); // không bị giảm sao
    expect(s.progress.fire.stars[0]).toBe(2);
    s.recordWin('water', 0, 3);
    expect(s.stars).toBe(5); // tổng sao mọi hệ
    expect(s.maxStars).toBe(FACTION_ORDER.length * 100);
    // Đủ 3 sao mọi màn (99) thì tab được tròn 100 sao
    LEVELS.forEach((_, i) => s.recordWin('wood', i, 3));
    expect(s.factionStars('wood')).toBe(100);
    expect(s.tabMax).toBe(100);
    s.recordWin('fire', LEVELS.length - 1, 3);
    expect(s.factionStars('fire')).toBe(5);
    expect(s.progress.fire.completed).toBe(true);
    // Lưu vào localStorage, mở lại vẫn còn
    setActivePinia(createPinia());
    const again = useSettings();
    expect(again.progress.fire.completed).toBe(true);
    expect(again.campFaction).toBe('fire');
  });

  it('dữ liệu lưu theo mã hệ cũ (tên tộc) vẫn đọc được sau khi đổi sang 12 nguyên tố', () => {
    localStorage.setItem('stickman-war:faction', JSON.stringify('dragon'));
    localStorage.setItem('stickman-war:campFaction', JSON.stringify('elf'));
    localStorage.setItem('stickman-war:camp-elf', JSON.stringify({ unlocked: 5, stars: [3, 3, 2, 1, 1], seed: 7 }));
    const s = useSettings();
    expect(s.faction).toBe('fire');
    expect(s.campFaction).toBe('wood');
    expect(s.progress.wood.unlocked).toBe(5);
    expect(s.progress.wood.seed).toBe(7);
  });

  it('mỗi hệ xáo thứ tự hệ địch một lần, không gặp chính mình, giữ nguyên khi mở lại', () => {
    const s = useSettings();
    s.campFaction = 'ice';
    const order = [...s.enemyFactions];
    expect(order).toHaveLength(LEVELS.length);
    expect(order).not.toContain('ice');
    setActivePinia(createPinia());
    expect(useSettings().enemyFactions).toEqual(order);
  });

  it('tên được làm sạch', () => {
    const s = useSettings();
    s.setName('   <b>An</b>   ');
    expect(s.name).toBe('bAn/b');
    s.setName('');
    expect(s.name).toBe('Stickman');
  });

  it('vẫn đọc dữ liệu lưu dưới tên cũ (nguoi-que:)', () => {
    localStorage.setItem('nguoi-que:name', JSON.stringify('Cũ'));
    const s = useSettings();
    expect(s.name).toBe('Cũ');
  });
});
