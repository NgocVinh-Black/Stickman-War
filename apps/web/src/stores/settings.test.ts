import { LEVELS } from '@nguoi-que/core';
import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSettings } from './settings';

describe('Cài đặt và tiến độ chiến dịch', () => {
  beforeEach(() => {
    localStorage.clear();
    setActivePinia(createPinia());
  });

  it('thắng màn lưu sao, mở màn tiếp, màn cuối mở mức khó hơn', () => {
    const s = useSettings();
    expect(s.diffOpen('normal')).toBe(false);
    s.recordWin('easy', 0, 2);
    expect(s.progress.easy.unlocked).toBe(1);
    expect(s.stars).toBe(2);
    s.recordWin('easy', 0, 1); // không bị giảm sao
    expect(s.progress.easy.stars[0]).toBe(2);
    s.recordWin('easy', LEVELS.length - 1, 3);
    expect(s.progress.easy.completed).toBe(true);
    expect(s.diffOpen('normal')).toBe(true);
    // Lưu vào localStorage, mở lại vẫn còn
    setActivePinia(createPinia());
    expect(useSettings().progress.easy.completed).toBe(true);
  });

  it('tên được làm sạch', () => {
    const s = useSettings();
    s.setName('   <b>An</b>   ');
    expect(s.name).toBe('bAn/b');
    s.setName('');
    expect(s.name).toBe('Người que');
  });
});
