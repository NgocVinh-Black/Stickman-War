import { FACTION_ORDER, LEVELS, campaignFactions, cleanName, toFactionId, type FactionId } from '@stickman-war/core';
import { defineStore } from 'pinia';
import { computed, reactive, ref, watch } from 'vue';
import { prefs } from '../lib/prefs';
import { sound } from '../lib/sound';
import { load, loadProgress, save, saveProgress, type Progress } from '../lib/storage';

export type MenuTab = 'home' | 'offline' | 'online' | 'arena' | 'guide' | 'account';
export const MENU_TABS: MenuTab[] = ['home', 'offline', 'online', 'arena', 'guide', 'account'];

/** Cài đặt và tiến độ người chơi lưu trong trình duyệt. */
export const useSettings = defineStore('settings', () => {
  const name = ref(load('name', `Stickman ${Math.floor(100 + Math.random() * 900)}`));
  // Nhận cả mã hệ cũ (tên tộc) đã lưu trước khi đổi sang 12 nguyên tố
  const faction = ref<FactionId>(toFactionId(load<string>('faction', 'light')) ?? 'light');
  /** Tiến độ chiến dịch một hệ. Lần đầu thì xáo thứ tự hệ địch. */
  function initProgress(f: FactionId): Progress {
    const p = loadProgress(f);
    if (p.seed === undefined) {
      p.seed = Math.floor(Math.random() * 2 ** 31);
      saveProgress(f, p);
    }
    return p;
  }
  /** Chiến dịch chia theo hệ: mỗi hệ một tab, mở sẵn cả 12, tiến độ màn riêng. */
  const progress = reactive(Object.fromEntries(FACTION_ORDER.map((f) => [f, initProgress(f)])) as Record<FactionId, Progress>);
  const campFaction = ref<FactionId>(toFactionId(load<string>('campFaction', faction.value)) ?? faction.value);
  const savedTab = load<MenuTab>('tab', 'home');
  const tab = ref<MenuTab>(MENU_TABS.includes(savedTab) ? savedTab : 'home');
  const agree = ref(load('agree', false));
  const muted = ref(sound.muted);
  /** Âm lượng 0..1, mẹo 💡 trong trận, rung màn hình. */
  const volume = ref(sound.volume);
  const tips = ref(load('tips', true));
  const shake = ref(prefs.shake);
  /** Chọn chơi khách chỉ có tác dụng trong lần mở trang này. */
  const guest = ref(false);

  watch(name, (v) => save('name', v));
  watch(faction, (v) => save('faction', v));
  watch(campFaction, (v) => save('campFaction', v), { flush: 'sync' });
  watch(tab, (v) => save('tab', v));
  watch(agree, (v) => save('agree', v));
  watch(volume, (v) => sound.setVolume(v));
  watch(tips, (v) => save('tips', v));
  watch(shake, (v) => {
    prefs.shake = v;
    save('shake', v);
  });

  const current = computed(() => progress[campFaction.value]);
  const nextLevel = computed(() => Math.min(current.value.unlocked, LEVELS.length - 1));
  /** Sao một tab hệ: đủ 3 sao mọi màn (99) thì thưởng thêm 1 sao cho tròn 100. */
  const fullStars = LEVELS.length * 3;
  const tabMax = fullStars + 1;
  function factionStars(f: FactionId): number {
    const n = progress[f].stars.reduce((a, b) => a + (b ?? 0), 0);
    return n >= fullStars ? tabMax : n;
  }
  /** Tổng sao của mọi chiến dịch hệ, và số sao tối đa. */
  const stars = computed(() => FACTION_ORDER.reduce((sum, f) => sum + factionStars(f), 0));
  const maxStars = FACTION_ORDER.length * tabMax;
  /** Hệ địch từng màn trong chiến dịch của hệ đang chọn. */
  const enemyFactions = computed(() => campaignFactions(campFaction.value, current.value.seed ?? 1));

  function setName(raw: string): void {
    name.value = cleanName(raw);
  }

  function toggleSound(): void {
    muted.value = sound.toggle();
  }

  /** Thắng màn chiến dịch của hệ `f`: lưu sao, mở màn tiếp, đánh dấu hoàn thành ở màn cuối. */
  function recordWin(f: FactionId, level: number, starCount: number): { wasDone: boolean } {
    const p = progress[f];
    const wasDone = !!p.completed;
    const nextStars = [...p.stars];
    nextStars[level] = Math.max(nextStars[level] ?? 0, starCount);
    const saved: Progress = { ...p, unlocked: Math.max(p.unlocked, Math.min(level + 1, LEVELS.length - 1)), stars: nextStars };
    if (level === LEVELS.length - 1) saved.completed = true;
    progress[f] = saved;
    saveProgress(f, saved);
    return { wasDone };
  }

  return {
    name,
    faction,
    progress,
    campFaction,
    tab,
    agree,
    muted,
    volume,
    tips,
    shake,
    guest,
    current,
    nextLevel,
    stars,
    maxStars,
    tabMax,
    factionStars,
    enemyFactions,
    setName,
    toggleSound,
    recordWin,
  };
});
