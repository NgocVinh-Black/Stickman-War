import { LEVELS } from '@stickman-war/core';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from './settings';

describe('Cài đặt và tiến độ chiến dịch', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('thắng màn lưu sao, mở màn tiếp, màn cuối đánh dấu hoàn thành; mức Thường / Khó mở sẵn', () => {
    const s = useSettings();
    expect(s.diffOpen('normal')).toBe(true);
    expect(s.diffOpen('hard')).toBe(true);
    expect(s.progress.normal.unlocked).toBe(0);
    s.recordWin('easy', 0, 2);
    expect(s.progress.easy.unlocked).toBe(1);
    expect(s.stars).toBe(2);
    s.recordWin('easy', 0, 1); // không bị giảm sao
    expect(s.progress.easy.stars[0]).toBe(2);
    s.recordWin('easy', LEVELS.length - 1, 3);
    expect(s.progress.easy.completed).toBe(true);
    // Lưu vào localStorage, mở lại vẫn còn
    setActivePinia(createPinia());
    expect(useSettings().progress.easy.completed).toBe(true);
  });

  it('mỗi mức khó xáo thứ tự tộc địch một lần và giữ nguyên khi mở lại; tiến độ cũ đã phá đảo mở tiếp màn mới', () => {
    localStorage.setItem('stickman-war:progress', JSON.stringify({ unlocked: 7, stars: [3, 3, 3, 3, 3, 3, 3, 3], completed: true }));
    const s = useSettings();
    const order = [...s.enemyFactions];
    expect(order).toHaveLength(LEVELS.length);
    expect(s.progress.easy.unlocked).toBe(8);
    expect(s.progress.easy.completed).toBe(false);
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
    localStorage.setItem('nguoi-que:progress', JSON.stringify({ unlocked: 3, stars: [3, 2, 1] }));
    const s = useSettings();
    expect(s.name).toBe('Cũ');
    expect(s.progress.easy.unlocked).toBe(3);
  });
});
