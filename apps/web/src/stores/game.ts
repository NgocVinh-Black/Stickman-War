import {
  ARCH_ORDER,
  CAMPAIGN,
  DIFFS,
  EnemyAI,
  FACTIONS,
  FACTION_ORDER,
  LEVELS,
  SKIRMISH,
  UNITS,
  World,
  campaignLevel,
  kindOf,
  type Difficulty,
  type FactionId,
  type Formation,
  type Stance,
  type UnitKind,
} from '@stickman-war/core';
import { defineStore } from 'pinia';
import { reactive, shallowRef } from 'vue';
import { localMatch, type Match } from '../game/match';
import { GameSession, isNet, starsFor, statsOf, type Mode } from '../game/session';
import { sound } from '../lib/sound';
import { router } from '../router';
import { useSettings } from './settings';
import { useUi, type DialogButton } from './ui';

export const STANCES: { id: Stance; icon: string; label: string; key: string }[] = [
  { id: 'garrison', icon: '🏰', label: 'Rút về', key: 'Q' },
  { id: 'defend', icon: '🛡️', label: 'Phòng thủ', key: 'W' },
  { id: 'attack', icon: '⚔️', label: 'Tấn công', key: 'E' },
];
export const FORMATION_INFO: Record<Formation, { icon: string; label: string; tip: string }> = {
  free: { icon: '🌀', label: 'Tự do', tip: 'Mỗi quân tự lao lên theo tốc độ riêng' },
  line: { icon: '🧱', label: 'Hàng lối', tip: 'Cả đội đi cùng tốc độ quân chậm nhất: khiên trước, cận chiến, bắn xa, hỗ trợ sau cùng' },
  spread: { icon: '↔️', label: 'Tản rộng', tip: 'Như hàng lối nhưng giãn cách xa, ít bị phép nổ trúng cả đám' },
};
const FORMATION_CYCLE: Formation[] = ['free', 'line', 'spread'];
export const archIndex = (k: UnitKind) => ARCH_ORDER.indexOf(UNITS[k].arch);

/** Số liệu HUD, đồng bộ từ mô phỏng mỗi khung hình (Vue chỉ vẽ lại phần đổi). */
type Hud = {
  gold: number;
  goldEnemy: number;
  pop: number;
  hpAlly: number;
  hpEnemy: number;
  stance: Stance;
  formation: Formation;
  centerMine: boolean;
  factions: [FactionId, FactionId];
  units: Record<UnitKind, { can: boolean; queued: number; progress: number }>;
  countdown: string;
};

export const useGame = defineStore('game', () => {
  const session = shallowRef<GameSession | null>(null);
  const meta = reactive({ title: '', subtitle: '' });
  const hud = reactive<Hud>({
    gold: 0,
    goldEnemy: 0,
    pop: 0,
    hpAlly: 1,
    hpEnemy: 1,
    stance: 'defend',
    formation: 'free',
    centerMine: false,
    factions: ['tribe', 'tribe'],
    units: {},
    countdown: '',
  });

  const ui = () => useUi();
  const settings = () => useSettings();

  /** Mở màn chơi với một trận mới. */
  function mount(mode: Exclude<Mode, { type: 'menu' }>, match: Match, title: string, subtitle: string): GameSession {
    ui().close();
    const s = new GameSession(mode, match);
    s.onTip = (text) => ui().toast(text, 3500);
    s.onLocalEnd = (winner) => (winner === 0 ? onLocalWin(s) : onLocalLose(s));
    meta.title = title;
    meta.subtitle = subtitle;
    hud.units = Object.fromEntries(match.unlocked.map((k) => [k, { can: false, queued: 0, progress: 0 }]));
    hud.countdown = '';
    session.value = s;
    void router.push('/play');
    return s;
  }

  /** Thoát trận (về sảnh / phòng chờ do người gọi lo). */
  function unmount(): void {
    session.value = null;
  }

  function syncHud(): void {
    const s = session.value;
    if (!s) return;
    const v = s.view;
    const t = v.teams[0];
    hud.gold = Math.max(0, Math.floor(t.gold));
    hud.goldEnemy = Math.max(0, Math.floor(v.teams[1].gold));
    hud.pop = s.match.pop();
    hud.hpAlly = t.statueHp / t.statueMax;
    hud.hpEnemy = v.teams[1].statueHp / v.teams[1].statueMax;
    hud.stance = t.stance;
    hud.formation = t.formation;
    hud.centerMine = t.centerMine;
    if (hud.factions[0] !== t.faction || hud.factions[1] !== v.teams[1].faction) hud.factions = [t.faction, v.teams[1].faction];
    const head = t.queue[0];
    for (const k of s.match.unlocked) {
      const u = hud.units[k];
      if (!u) continue;
      u.can = s.match.canTrain(k);
      u.queued = t.queue.filter((q) => q.kind === k).length;
      u.progress = head && head.kind === k ? head.t / UNITS[k].trainTime : 0;
    }
  }

  // ---------- Lệnh trong trận ----------

  const canCommand = () => {
    const s = session.value;
    return s && s.mode.type !== 'menu' && s.mode.type !== 'watch' && s.running ? s : null;
  };

  function train(kind: UnitKind): void {
    const s = canCommand();
    if (!s) return;
    if (s.match.train(kind)) sound.click();
    else ui().toast(s.match.whyNot(kind), 1200);
  }

  function trainSlot(slot: number): void {
    const kind = session.value?.match.unlocked.find((x) => archIndex(x) === slot);
    if (kind) train(kind);
  }

  function setStance(stance: Stance): void {
    const s = canCommand();
    if (!s) return;
    s.match.setStance(stance);
    sound.click();
    if (stance === 'attack') sound.horn();
  }

  function cycleFormation(): void {
    const s = canCommand();
    if (!s) return;
    const next = FORMATION_CYCLE[(FORMATION_CYCLE.indexOf(s.view.teams[0].formation) + 1) % FORMATION_CYCLE.length];
    s.match.setFormation(next);
    sound.click();
    ui().toast(`${FORMATION_INFO[next].icon} ${FORMATION_INFO[next].label}: ${FORMATION_INFO[next].tip}`, 2200);
  }

  function toggleCenterMine(): void {
    const s = canCommand();
    if (!s) return;
    const on = !s.view.teams[0].centerMine;
    s.match.setCenterMine(on);
    sound.click();
    ui().toast(on ? '💰 Một nửa thợ mỏ sang đào mỏ giữa' : '⛏️ Thợ mỏ về đào mỏ nhà', 1400);
  }

  function toggleSpeed(): void {
    const s = session.value;
    if (s && !isNet(s.mode)) s.speed = s.speed === 1 ? 2 : 1;
  }

  // ---------- Chơi đơn ----------

  function begin(s: GameSession): void {
    ui().close();
    sound.horn();
    s.running = true;
  }

  const toMenu = () => {
    ui().close();
    unmount();
    void router.push('/');
  };

  function startCampaign(index: number, diff: Difficulty = settings().campDiff): void {
    const st = settings();
    if (diff !== st.campDiff) st.campDiff = diff;
    const lv = campaignLevel(index, diff);
    const label = CAMPAIGN[diff].label;
    const enemyFaction = lv.enemyFaction ?? 'tribe';
    const world = new World([
      { ...lv.player, faction: st.faction },
      { ...lv.enemy, faction: enemyFaction },
    ]);
    const s = mount(
      { type: 'campaign', level: index, diff },
      localMatch(world, [new EnemyAI(lv.ai)]),
      `Màn ${index + 1} · ${label}`,
      lv.name,
    );
    if (index === 0 && diff === 'easy') {
      s.tips = [
        { at: 1, text: '💡 Bấm Thợ mỏ để có thêm vàng' },
        { at: 12, text: '💡 Xây thêm Kiếm sĩ để bảo vệ nhà' },
        { at: 45, text: '💡 Đủ quân thì bấm ⚔️ Tấn công!' },
      ];
    }
    ui().show({
      kind: 'generic',
      eyebrow: `Màn ${index + 1}/${LEVELS.length} · ${label}`,
      title: lv.name,
      lines: [lv.intro],
      matchup: [st.faction, enemyFaction],
      newUnits: (lv.newUnits ?? []).map((a) => kindOf(st.faction, a)),
      buttons: [
        { label: '⚔️ Vào trận', primary: true, action: () => begin(s) },
        { label: 'Về menu', action: toMenu },
      ],
    });
  }

  function startSkirmish(diff: Difficulty): void {
    const st = settings();
    const cfg = SKIRMISH[diff];
    const pool = FACTION_ORDER.filter((f) => f !== st.faction);
    const enemyFaction = pool[Math.floor(Math.random() * pool.length)];
    const world = new World([
      { ...cfg.player, faction: st.faction },
      { ...cfg.enemy, faction: enemyFaction },
    ]);
    const s = mount({ type: 'skirmish', diff }, localMatch(world, [new EnemyAI(cfg.ai)]), 'Đấu với máy', `Độ khó: ${cfg.label}`);
    ui().show({
      kind: 'generic',
      eyebrow: `Đấu với máy · ${cfg.label}`,
      title: 'Trận đấu tự do',
      lines: [`Hai bên cùng xuất phát với đủ ${ARCH_ORDER.length} loại quân của tộc mình. Phá tượng máy để thắng!`],
      matchup: [st.faction, enemyFaction],
      buttons: [
        { label: '⚔️ Vào trận', primary: true, action: () => begin(s) },
        { label: 'Về menu', action: toMenu },
      ],
    });
  }

  function restartLocal(s: GameSession): void {
    if (s.mode.type === 'campaign') startCampaign(s.mode.level, s.mode.diff);
    else if (s.mode.type === 'skirmish') startSkirmish(s.mode.diff);
  }

  function onLocalWin(s: GameSession): void {
    sound.win();
    const v = s.view;
    if (s.mode.type === 'skirmish') {
      const diff = s.mode.diff;
      ui().show({
        kind: 'generic',
        emoji: '🏆',
        title: `Thắng máy (${SKIRMISH[diff].label})!`,
        stats: statsOf(v),
        buttons: [
          { label: 'Đấu lại', primary: true, action: () => startSkirmish(diff) },
          { label: 'Về menu', action: toMenu },
        ],
      });
      return;
    }
    if (s.mode.type !== 'campaign') return;
    const { level: i, diff } = s.mode;
    const stars = starsFor(v);
    const { wasDone } = settings().recordWin(diff, i, stars);
    if (i === LEVELS.length - 1) {
      const harder = DIFFS[DIFFS.indexOf(diff) + 1];
      const label = CAMPAIGN[diff].label;
      const buttons: DialogButton[] = harder
        ? [
            { label: `▶ Chơi mức ${CAMPAIGN[harder].label}`, primary: true, action: () => startCampaign(0, harder) },
            { label: 'Về menu', action: toMenu },
          ]
        : [{ label: 'Về menu', primary: true, action: toMenu }];
      buttons.push({ label: 'Chơi lại màn này', action: () => startCampaign(i, diff) });
      ui().show({
        kind: 'generic',
        emoji: '👑',
        title: harder ? `Chinh phục mức ${label}!` : 'Bạn là Vua Stickman!',
        lines: [
          `Đã thắng cả ${LEVELS.length} màn chiến dịch mức ${label}.`,
          ...(harder && !wasDone ? [`🔓 Đã mở khoá mức ${CAMPAIGN[harder].label}: máy giàu hơn, đông hơn, đánh sớm hơn.`] : []),
        ],
        stats: statsOf(v),
        buttons,
      });
      return;
    }
    ui().show({
      kind: 'generic',
      stars,
      title: 'Chiến thắng!',
      lines: ['Tượng địch đã sụp đổ.'],
      stats: statsOf(v),
      buttons: [
        { label: `Màn ${i + 2} ▶`, primary: true, action: () => startCampaign(i + 1, diff) },
        { label: 'Chơi lại', action: () => startCampaign(i, diff) },
        { label: 'Về menu', action: toMenu },
      ],
    });
  }

  function onLocalLose(s: GameSession): void {
    sound.lose();
    ui().show({
      kind: 'generic',
      emoji: '💀',
      title: 'Thất bại',
      lines: ['Tượng của bạn đã bị phá. Thử nuôi thêm thợ mỏ và phòng thủ gần tượng để có lợi thế.'],
      buttons: [
        { label: 'Chơi lại', primary: true, action: () => restartLocal(s) },
        { label: 'Về menu', action: toMenu },
      ],
    });
  }

  // ---------- Tạm dừng (chơi đơn) ----------

  function pause(): void {
    const s = session.value;
    if (!s || s.mode.type === 'menu' || s.endShown || isNet(s.mode) || !s.running) return;
    s.running = false;
    showPause();
  }

  function showPause(): void {
    const s = session.value;
    if (!s) return;
    const st = settings();
    ui().show({
      kind: 'generic',
      emoji: '⏸',
      title: 'Tạm dừng',
      buttons: [
        { label: 'Tiếp tục', primary: true, action: resume },
        { label: 'Chơi lại', action: () => restartLocal(s) },
        {
          label: st.muted ? '🔇 Bật âm thanh' : '🔊 Tắt âm thanh',
          action: () => {
            st.toggleSound();
            showPause();
          },
        },
        { label: 'Cách chơi', action: () => ui().show({ kind: 'howto', back: showPause }) },
        { label: 'Về menu', action: toMenu },
      ],
    });
  }

  function resume(): void {
    ui().close();
    const s = session.value;
    if (s && s.mode.type !== 'menu' && !isNet(s.mode) && !s.endShown) s.running = true;
  }

  const factionName = (f: FactionId) => `${FACTIONS[f].icon} ${FACTIONS[f].name}`;

  return {
    session,
    meta,
    hud,
    mount,
    unmount,
    syncHud,
    train,
    trainSlot,
    setStance,
    cycleFormation,
    toggleCenterMine,
    toggleSpeed,
    startCampaign,
    startSkirmish,
    pause,
    resume,
    toMenu,
    factionName,
  };
});
