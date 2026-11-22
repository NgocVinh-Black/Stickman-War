import { lang } from '@stickman-war/i18n';
import { describe, expect, it } from 'vitest';
import { ago, faction, fmtDate } from './format';

describe('Định dạng trang admin', () => {
  it('ngày giờ dạng dd/mm/yyyy hh:mm theo giờ máy', () => {
    expect(fmtDate(new Date(2026, 10, 7, 9, 5).getTime())).toBe('07/11/2026 09:05');
  });

  it('thời gian tương đối, đổi theo ngôn ngữ', () => {
    lang.value = 'vi';
    const now = new Date(2026, 10, 17, 12, 0).getTime();
    expect(ago(now - 20_000, now)).toBe('vừa xong');
    expect(ago(now - 5 * 60_000, now)).toBe('5 phút trước');
    expect(ago(now - 3 * 3_600_000, now)).toBe('3 giờ trước');
    expect(ago(now - 2 * 86_400_000, now)).toBe('2 ngày trước');
    expect(ago(now - 60 * 86_400_000, now)).toBe(fmtDate(now - 60 * 86_400_000));
    lang.value = 'en';
    expect(ago(now - 5 * 60_000, now)).toBe('5 min ago');
    lang.value = 'vi';
  });

  it('hệ lạ (dữ liệu cũ) vẫn hiển thị được', () => {
    expect(faction('wood').name).toBe('Thanh Mộc Lâm');
    expect(faction('unknown' as never).icon).toBe('❔');
  });
});
