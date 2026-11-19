import type { FactionId, UnitKind } from '@stickman-war/core';
import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import type { MatchStats } from '../game/session';
import { sound } from '../lib/sound';

export type DialogButton = { label: string; primary?: boolean; disabled?: boolean; action: () => void };

/** Hộp thoại dựng từ dữ liệu (không chèn HTML): kết quả trận, tạm dừng, giới thiệu màn, chờ ghép… */
export type GenericDialog = {
  kind: 'generic';
  emoji?: string;
  eyebrow?: string;
  title: string;
  lines?: string[];
  small?: string;
  matchup?: [FactionId, FactionId];
  /** Cho chọn tộc của mình ngay trong hộp thoại trước trận. */
  pickFaction?: (id: FactionId) => void;
  newUnits?: UnitKind[];
  stars?: number;
  stats?: MatchStats;
  spinner?: boolean;
  /** Mã phòng + link mời hiện to giữa hộp thoại. */
  code?: string;
  link?: string;
  /** Dòng trạng thái cập nhật được (chờ đấu lại, kết quả kèo…). */
  status?: string;
  buttons: DialogButton[];
};

export type Dialog =
  | GenericDialog
  | { kind: 'faction'; onPick?: () => void }
  | { kind: 'legal'; which: 'terms' | 'privacy' }
  | { kind: 'howto'; back?: () => void }
  | { kind: 'settings' };

export const useUi = defineStore('ui', () => {
  const dialog = ref<Dialog | null>(null);
  const toastMsg = shallowRef<{ text: string; ms: number; id: number } | null>(null);
  let toastId = 0;
  let toastTimer = 0;

  function show(d: Dialog): void {
    dialog.value = d;
  }

  function close(): void {
    dialog.value = null;
  }

  /** Bấm nút trong hộp thoại: có tiếng click rồi chạy hành động. */
  function press(b: DialogButton): void {
    if (b.disabled) return;
    sound.click();
    b.action();
  }

  function toast(text: string, ms = 1800): void {
    clearTimeout(toastTimer);
    toastMsg.value = { text, ms, id: ++toastId };
    toastTimer = window.setTimeout(() => (toastMsg.value = null), ms);
  }

  /** Cập nhật dòng trạng thái của hộp thoại đang mở (nếu là hộp thoại thường). */
  function setStatus(text: string): void {
    if (dialog.value?.kind === 'generic') dialog.value.status = text;
  }

  return { dialog, toastMsg, show, close, press, toast, setStatus };
});
