import { CAMPAIGN, DIFFS, FACTION_ORDER, LEVELS, cleanName, type Difficulty, type FactionId } from '@stickman-war/core';
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
  const progress = reactive<Record<Difficulty, Progress>>({
    easy: loadProgress('easy'),
    normal: loadProgress('normal'),
    hard: loadProgress('hard'),
  });
  /** Thường mở khi thắng hết chiến dịch Dễ, Khó mở khi thắng hết Thường. */
  const diffOpen = (d: Difficulty) => d === 'easy' || !!progress[DIFFS[DIFFS.indexOf(d) - 1]].completed;
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
    diffOpen,
    diffLabel,
    setName,
    toggleSound,
    recordWin,
  };
});
