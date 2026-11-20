import { FACTION_ORDER, LEVELS } from '@stickman-war/core';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from './settings';

describe('Cài đặt và tiến độ chiến dịch', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('mỗi tộc một chiến dịch riêng: thắng màn lưu sao, mở màn tiếp, màn cuối đánh dấu hoàn thành', () => {
    const s = useSettings();
    s.campFaction = 'dragon';
    s.recordWin('dragon', 0, 2);
    expect(s.progress.dragon.unlocked).toBe(1);
    expect(s.progress.tribe.unlocked).toBe(0);
    expect(s.nextLevel).toBe(1);
    expect(s.stars).toBe(2);
    s.recordWin('dragon', 0, 1); // không bị giảm sao
    expect(s.progress.dragon.stars[0]).toBe(2);
    s.recordWin('tide', 0, 3);
    expect(s.stars).toBe(5); // tổng sao mọi tộc
    expect(s.maxStars).toBe(FACTION_ORDER.length * 100);
    // Đủ 3 sao mọi màn (99) thì tab được tròn 100 sao
    LEVELS.forEach((_, i) => s.recordWin('elf', i, 3));
    expect(s.factionStars('elf')).toBe(100);
    expect(s.tabMax).toBe(100);
    s.recordWin('dragon', LEVELS.length - 1, 3);
    expect(s.factionStars('dragon')).toBe(5);
    expect(s.progress.dragon.completed).toBe(true);
    // Lưu vào localStorage, mở lại vẫn còn
    setActivePinia(createPinia());
    const again = useSettings();
    expect(again.progress.dragon.completed).toBe(true);
    expect(again.campFaction).toBe('dragon');
  });

  it('mỗi tộc xáo thứ tự tộc địch một lần, không gặp chính mình, giữ nguyên khi mở lại', () => {
    const s = useSettings();
    s.campFaction = 'frost';
    const order = [...s.enemyFactions];
    expect(order).toHaveLength(LEVELS.length);
    expect(order).not.toContain('frost');
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
