import { ref, watch } from 'vue';
import { en } from './en';
import { vi, type Dict } from './vi';

/**
 * @stickman-war/i18n: đa ngôn ngữ dùng chung cho web và admin. Tiếng Việt là bản gốc, tiếng Anh dịch theo
 * đúng khoá (thiếu khoá thì TypeScript báo lỗi). Ngôn ngữ chọn lưu chung một khoá localStorage cho cả hai app.
 */
const KEY = 'stickman-war:lang';
const load = (): string | null => {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? 'null') as string | null;
  } catch {
    return null;
  }
};
const save = (l: Lang) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(l));
  } catch {
    // Chế độ ẩn danh / bị chặn storage: vẫn đổi ngôn ngữ trong phiên này
  }
};
export type Lang = 'vi' | 'en';
export const LANGS: { id: Lang; label: string; flag: string }[] = [
  { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { id: 'en', label: 'English', flag: '🇬🇧' },
];

const saved = typeof localStorage === 'undefined' ? null : load();
// Mặc định tiếng Việt (game làm cho người Việt; người chơi cũ chưa chọn ngôn ngữ vẫn thấy như trước)
export const lang = ref<Lang>(saved === 'en' ? 'en' : 'vi');

const setHtmlLang = (l: Lang) => {
  if (typeof document !== 'undefined') document.documentElement.lang = l;
};
setHtmlLang(lang.value);
watch(lang, (l) => {
  save(l);
  setHtmlLang(l);
});

const DICTS: Record<Lang, Dict> = { vi, en };

/** Mọi khoá dạng "a.b.c" trỏ tới một chuỗi trong từ điển. */
type Leaves<T, P extends string = ''> = {
  [K in keyof T & string]: T[K] extends string ? `${P}${K}` : Leaves<T[K], `${P}${K}.`>;
}[keyof T & string];
export type Key = Leaves<Dict>;

type Params = Record<string, string | number>;

/**
 * Lấy chuỗi theo ngôn ngữ đang chọn, thay {tên} bằng tham số. Gọi trong template / computed thì
 * tự cập nhật khi đổi ngôn ngữ (đọc `lang.value`).
 */
export function t(key: Key, params?: Params): string {
  let node: unknown = DICTS[lang.value];
  for (const part of key.split('.')) node = (node as Record<string, unknown>)?.[part];
  let text = typeof node === 'string' ? node : key;
  if (params) for (const [k, v] of Object.entries(params)) text = text.replaceAll(`{${k}}`, String(v));
  return text;
}

/** Chọn theo ngôn ngữ cho dữ liệu không nằm trong từ điển (nội dung game). */
export const pick = <T>(vi: T, en: T | undefined): T => (lang.value === 'en' && en !== undefined ? en : vi);

export { vi, en, type Dict };
