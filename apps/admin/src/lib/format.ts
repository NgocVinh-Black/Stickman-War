import { FACTIONS, type FactionId } from '@stickman-war/core';
import { lang, t } from '@stickman-war/i18n';
import { civName } from '@stickman-war/i18n/content';

const pad = (n: number) => String(n).padStart(2, '0');

/** "17/11/2026 10:51" theo giờ máy đang xem. */
export function fmtDate(t: number): string {
  const d = new Date(t);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const fmtNum = (n: number) => n.toLocaleString(lang.value === 'en' ? 'en-US' : 'vi-VN');

/** "5 phút trước", "3 ngày trước"… */
export function ago(at: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - at) / 1000));
  if (s < 60) return t('admin.ago.now');
  const m = Math.round(s / 60);
  if (m < 60) return t('admin.ago.min', { n: m });
  const h = Math.round(m / 60);
  if (h < 24) return t('admin.ago.hour', { n: h });
  const d = Math.round(h / 24);
  if (d < 30) return t('admin.ago.day', { n: d });
  return fmtDate(at);
}

/** Nền văn minh để hiển thị: tên theo ngôn ngữ đang chọn; mã lạ (dữ liệu cũ) thì hiện nguyên mã. */
export const faction = (id: FactionId) => (FACTIONS[id] ? { ...FACTIONS[id], name: civName(id) } : { name: id, icon: '❔', color: '#888' });

export const resultLabel = (r: 'win' | 'lose' | 'draw') => t(`admin.result.${r}`);
