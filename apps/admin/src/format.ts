import { FACTIONS, type FactionId } from '@stickman-war/core';

const pad = (n: number) => String(n).padStart(2, '0');

/** "17/11/2026 10:51" theo giờ máy đang xem. */
export function fmtDate(t: number): string {
  const d = new Date(t);
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
export const fmtNum = (n: number) => n.toLocaleString('vi-VN');

/** "5 phút trước", "3 ngày trước"… */
export function ago(t: number, now = Date.now()): string {
  const s = Math.max(0, Math.round((now - t) / 1000));
  if (s < 60) return 'vừa xong';
  const m = Math.round(s / 60);
  if (m < 60) return `${m} phút trước`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} giờ trước`;
  const d = Math.round(h / 24);
  if (d < 30) return `${d} ngày trước`;
  return fmtDate(t);
}

export const faction = (id: FactionId) => FACTIONS[id] ?? { name: id, icon: '❔', color: '#888' };

export const RESULT_LABEL = { win: 'Thắng', lose: 'Thua', draw: 'Hoà' } as const;
