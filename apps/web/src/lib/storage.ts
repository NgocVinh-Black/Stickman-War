import type { Difficulty } from '@stickman-war/core';

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

/** seed: thứ tự tộc địch của chiến dịch ở mức khó này (xáo một lần, giữ cố định để chơi lại màn vẫn gặp đúng tộc đó). */
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

// Mức Dễ giữ khoá cũ để không mất tiến độ đã lưu
const PROGRESS_KEY: Record<Difficulty, string> = { easy: 'progress', normal: 'progress-normal', hard: 'progress-hard' };

export const loadProgress = (d: Difficulty): Progress => load<Progress>(PROGRESS_KEY[d], { unlocked: 0, stars: [] });
export const saveProgress = (d: Difficulty, p: Progress) => save(PROGRESS_KEY[d], p);
