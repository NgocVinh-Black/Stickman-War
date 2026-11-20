import { load } from './storage';

/** Tuỳ chọn đọc trong vòng vẽ (không phải Vue): store settings cập nhật khi người chơi đổi. */
export const prefs = { shake: load('shake', true) };
