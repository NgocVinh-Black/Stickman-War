import { CAMPAIGN, DIFFS, FACTION_ORDER, LEVELS, campaignFactions, cleanName, type Difficulty, type FactionId } from '@stickman-war/core';
import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { sound } from '../lib/sound';
import { load, loadProgress, save, saveProgress, type Progress } from '../lib/storage';

export type MenuTab = 'home' | 'offline' | 'online' | 'arena' | 'guide' | 'account';
export const MENU_TABS: { id: MenuTab; label: string }[] = [
  { id: 'home', label: '🏠 Sảnh' },
  { id: 'offline', label: '🎯 Chơi đơn' },
  { id: 'online', label: '🌐 Online' },
  { id: 'arena', label: '🏟️ Đấu trường' },
  { id: 'guide', label: '📖 Cẩm nang' },
  { id: 'account', label: '👤 Tài khoản' },
];

/** Cài đặt và tiến độ người chơi lưu trong trình duyệt. */
export const useSettings = defineStore('settings', () => {
  const name = ref(load('name', `Stickman ${Math.floor(100 + Math.random() * 900)}`));
  const savedFaction = load<FactionId>('faction', 'tribe');
  const faction = ref<FactionId>(FACTION_ORDER.includes(savedFaction) ? savedFaction : 'tribe');
  /**
   * Tiến độ một mức khó. Lần đầu (hoặc tiến độ cũ chưa có) thì xáo thứ tự tộc địch.
   * Tiến độ cũ đã phá đảo 8 màn thì mở tiếp các màn mới.
   */
  function initProgress(d: Difficulty): Progress {
    const p = loadProgress(d);
    let changed = false;
    if (p.seed === undefined) {
      p.seed = Math.floor(Math.random() * 2 ** 31);
      changed = true;
    }
    if (p.completed && p.stars.length < LEVELS.length && p.unlocked < p.stars.length) {
      p.unlocked = p.stars.length;
      p.completed = false;
      changed = true;
    }
    if (changed) saveProgress(d, p);
    return p;
  }
  const progress = reactive<Record<Difficulty, Progress>>({
    easy: initProgress('easy'),
    normal: initProgress('normal'),
    hard: initProgress('hard'),
  });
  /** Mọi mức khó đều chơi được ngay; mỗi mức có tiến độ màn riêng. */
  const diffOpen = (d: Difficulty) => DIFFS.includes(d);
  const savedDiff = load<Difficulty>('campDiff', 'easy');
  const campDiff = ref<Difficulty>(DIFFS.includes(savedDiff) && diffOpen(savedDiff) ? savedDiff : 'easy');
  const savedTab = load<MenuTab>('tab', 'home');
  const tab = ref<MenuTab>(MENU_TABS.some((t) => t.id === savedTab) ? savedTab : 'home');
  const agree = ref(load('agree', false));
  const muted = ref(sound.muted);
  /** Chọn chơi khách chỉ có tác dụng trong lần mở trang này. */
  const guest = ref(false);

  watch(name, (v) => save('name', v));
  watch(faction, (v) => save('faction', v));
  watch(campDiff, (v) => save('campDiff', v));
  watch(tab, (v) => save('tab', v));
  watch(agree, (v) => save('agree', v));

  const current = computed(() => progress[campDiff.value]);
  const nextLevel = computed(() => Math.min(current.value.unlocked, LEVELS.length - 1));
  const stars = computed(() => current.value.stars.reduce((a, b) => a + (b ?? 0), 0));
  /** Tộc địch từng màn ở mức khó đang chọn. */
  const enemyFactions = computed(() => campaignFactions(current.value.seed ?? 1));

  function setName(raw: string): void {
    name.value = cleanName(raw);
  }

  function toggleSound(): void {
    muted.value = sound.toggle();
  }

  /** Thắng màn chiến dịch: lưu sao, mở màn tiếp, đánh dấu hoàn thành ở màn cuối. */
  function recordWin(diff: Difficulty, level: number, starCount: number): { wasDone: boolean } {
    const p = progress[diff];
    const wasDone = !!p.completed;
    const nextStars = [...p.stars];
    nextStars[level] = Math.max(nextStars[level] ?? 0, starCount);
    const saved: Progress = { ...p, unlocked: Math.max(p.unlocked, Math.min(level + 1, LEVELS.length - 1)), stars: nextStars };
    if (level === LEVELS.length - 1) saved.completed = true;
    progress[diff] = saved;
    saveProgress(diff, saved);
    return { wasDone };
  }

  const diffLabel = (d: Difficulty) => CAMPAIGN[d].label;

  return {
    name,
    faction,
    progress,
    campDiff,
    tab,
    agree,
    muted,
    guest,
    current,
    nextLevel,
    stars,
    enemyFactions,
    diffOpen,
    diffLabel,
    setName,
    toggleSound,
    recordWin,
  };
});
