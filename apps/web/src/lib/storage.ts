import type { FactionId } from '@stickman-war/core';

const PREFIX = 'stickman-war:';
/** Tiền tố trước khi đổi tên game: vẫn đọc để không mất tên, tiến độ, ví xu đã lưu. */
const OLD_PREFIX = 'nguoi-que:';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key) ?? localStorage.getItem(OLD_PREFIX + key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    // Chế độ ẩn danh / bị chặn storage: chơi tiếp bình thường
  }
}

/** seed: thứ tự tộc địch trong chiến dịch của tộc này (xáo một lần, giữ cố định để chơi lại màn vẫn gặp đúng tộc đó). */
export type Progress = { unlocked: number; stars: number[]; completed?: boolean; seed?: number };

/** Mã ví xu bắt kèo: sinh một lần, máy chủ giữ số dư theo mã này. */
export function walletId(): string {
  let id = load<string>('wallet', '');
  if (!/^[A-Za-z0-9_-]{16,64}$/.test(id)) {
    id =
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
    save('wallet', id);
  }
  return id;
}

// Mỗi tộc một chiến dịch riêng (khoá cũ `progress`, `progress-normal`, `progress-hard` của 3 mức khó không dùng nữa)
const progressKey = (f: FactionId) => `camp-${f}`;

export const loadProgress = (f: FactionId): Progress => load<Progress>(progressKey(f), { unlocked: 0, stars: [] });
export const saveProgress = (f: FactionId, p: Progress) => save(progressKey(f), p);
