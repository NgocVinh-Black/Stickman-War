import {
  ARCH_ORDER,
  DEPOT_SLOTS,
  EnemyAI,
  FACTIONS,
  FACTION_ORDER,
  LEVELS,
  PVP_XU_MIN_SECONDS,
  SKIRMISH,
  UNITS,
  World,
  campaignLevel,
  depotX,
  freeDepots,
  kindOf,
  type Difficulty,
  type FactionId,
  type Formation,
  type MineSplit,
  type Stance,
  type UnitKind,
  WALL_MIN,
  statueX,
  wallKind,
} from '@stickman-war/core';
import { defineStore } from 'pinia';
import { reactive, ref, shallowRef } from 'vue';
import { localMatch, type Match } from '../game/match';
import { GameSession, isNet, starsFor, statsOf, type Mode } from '../game/session';
import { chooseFaction } from '../lib/faction';
import { sound } from '../lib/sound';
import { router } from '../router';
import { t } from '@stickman-war/i18n';
import { civName, civPassive, levelIntro, levelName, ultName } from '@stickman-war/i18n/content';
import { useOnline } from './online';
import { useSettings } from './settings';
import { useUi, type DialogButton } from './ui';

/** Nhãn đọc qua getter để đổi ngôn ngữ là đổi theo (template đọc `label` / `tip` mỗi lần vẽ). */
const stance = (id: Stance, icon: string, key: string) => ({
  id,
  icon,
  key,
  get label() {
    return t(`game.stance.${id}`);
  },
});
export const STANCES = [stance('garrison', '🏰', 'Q'), stance('defend', '🛡️', 'W'), stance('hold', '🚩', 'S'), stance('attack', '⚔️', 'E')];
/** Ba loại mỏ: biểu tượng, tên, mô tả ngắn. */
const mine = (id: 'silver' | 'gold' | 'diamond', icon: string) => ({
  icon,
  get label() {
    return t(`game.mine.${id}`);
  },
  get tip() {
    return t(`game.mine.${id}Tip`);
  },
});
export const MINE_INFO = [mine('silver', '🥈'), mine('gold', '🥇'), mine('diamond', '💎')] as const;
/** Kiểu chia thợ mỏ có sẵn [bạc, vàng, kim cương]. */
const preset = (id: 'balanced' | 'safe' | 'gold' | 'rich', split: MineSplit) => ({
  split,
  get label() {
    return t(`game.split.${id}`);
  },
  get tip() {
    return t(`game.split.${id}Tip`);
  },
});
export const MINE_PRESETS = [
  preset('balanced', [1, 1, 0]),
  preset('safe', [1, 0, 0]),
  preset('gold', [1, 3, 0]),
  preset('rich', [1, 1, 2]),
];
const form = (id: Formation, icon: string) => ({
  icon,
  get label() {
    return t(`game.form.${id}`);
  },
  get tip() {
    return t(`game.form.${id}Tip`);
  },
});
export const FORMATION_INFO: Record<Formation, { icon: string; label: string; tip: string }> = {
  free: form('free', '🌀'),
  line: form('line', '🧱'),
  spread: form('spread', '↔️'),
  wedge: form('wedge', '🔺'),
  wall: form('wall', '🛡️'),
};
export const FORMATION_CYCLE: Formation[] = ['free', 'line', 'spread', 'wedge', 'wall'];
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
  mineSplit: MineSplit;
  /** Số thợ mỏ đang ở từng mỏ [bạc, vàng, kim cương]. */
  miners: [number, number, number];
  factions: [FactionId, FactionId];
  units: Record<UnitKind, { can: boolean; queued: number; progress: number }>;
  countdown: string;
  /** Tường thành của mình: chưa có / đang dựng (tiến độ 0..1) / đã có; giá tường. */
  wall: 'none' | 'building' | 'built';
  wallProgress: number;
  wallCost: number;
  /** Thanh nộ chiêu tượng thần 0..1. */
  ult: number;
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
    mineSplit: [1, 1, 0],
    miners: [0, 0, 0],
    factions: ['light', 'light'],
    units: {},
    countdown: '',
    wall: 'none',
    wallProgress: 0,
    wallCost: 0,
    ult: 0,
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
    if (hud.mineSplit.some((n, i) => n !== t.mineSplit[i])) hud.mineSplit = [...t.mineSplit];
    const miners: [number, number, number] = [0, 0, 0];
    for (const u of v.units) if (u.team === 0 && !u.dying && UNITS[u.kind].arch === 'miner') miners[u.mine] = (miners[u.mine] ?? 0) + 1;
    if (miners.some((n, i) => n !== hud.miners[i])) hud.miners = miners;
    if (hud.factions[0] !== t.faction || hud.factions[1] !== v.teams[1].faction) hud.factions = [t.faction, v.teams[1].faction];
    hud.ult = t.ult;
    const wk = wallKind(t.faction);
    hud.wallCost = UNITS[wk].cost;
    if (!Number.isNaN(t.wallPlan)) {
      hud.wall = 'building';
      hud.wallProgress = Math.min(1, t.wallT / (UNITS[wk].buildTime ?? 6));
    } else hud.wall = v.units.some((u) => u.team === 0 && !u.dying && UNITS[u.kind].wall) ? 'built' : 'none';
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
    // Thợ xây: chọn ô đền trên chiến trường trước, chạm ô nào thì thợ xây ra ô đó dựng trạm
    if (UNITS[kind]?.build) {
      if (depotMode.value === kind) return void cancelPlacing();
      if (!s.match.canTrain(kind)) return void ui().toast(s.match.whyNot(kind), 1200);
      if (!freeDepots(s.match.view, 0).length) return void ui().toast(t('game.depotFull'), 1400);
      cancelPlacing();
      depotMode.value = kind;
      if (s.renderer) s.renderer.depotPick = true;
      sound.click();
      return;
    }
    if (s.match.train(kind)) sound.click();
    else ui().toast(s.match.whyNot(kind), 1200);
  }
  /** Thợ xây đang chờ chọn ô đền (null = không chọn). */
  const depotMode = ref<UnitKind | null>(null);
  /** Chạm cách ô đền trống gần nhất quá khoảng này thì không tính là chọn ô. */
  const DEPOT_PICK = 260;
  function stopDepot(): void {
    depotMode.value = null;
    const r = session.value?.renderer;
    if (r) r.depotPick = false;
  }

  function trainSlot(slot: number): void {
    const kind = session.value?.match.unlocked.find((x) => archIndex(x) === slot);
    if (kind) train(kind);
  }

  function setStance(stance: Stance): void {
    const s = canCommand();
    if (!s) return;
    if (stance === 'hold') {
      toggleFlagMode();
      return;
    }
    flagMode.value = false;
    s.match.setStance(stance);
    sound.click();
    if (stance === 'attack') sound.horn();
  }

  /** Đang chờ người chơi chạm chiến trường / bản đồ nhỏ để cắm cờ tập hợp. */
  const flagMode = ref(false);
  function toggleFlagMode(): void {
    if (!canCommand()) return;
    flagMode.value = !flagMode.value;
    wallMode.value = false;
    stopDepot();
    sound.click();
  }
  /** Đang đặt tường thành: bóng tường đi theo chuột / ngón tay, chạm hoặc thả tay để đặt. */
  const wallMode = ref(false);
  function toggleWallMode(): void {
    const s = canCommand();
    if (!s) return;
    if (!wallMode.value) {
      const why = s.match.wallBlock(statueX(0) + WALL_MIN);
      // Lý do không phụ thuộc chỗ đặt thì báo luôn, khỏi vào chế độ đặt
      if (why) return void ui().toast(t(`game.wallWhy.${why}`), 1600);
    }
    wallMode.value = !wallMode.value;
    flagMode.value = false;
    stopDepot();
    if (!wallMode.value) hoverWall(null);
    sound.click();
  }
  /** Dời bóng tường / vùng chiêu tượng thần tới x (null = ẩn). */
  function hoverWall(x: number | null): void {
    const r = session.value?.renderer;
    if (!r) return;
    r.wallGhost = wallMode.value ? x : null;
    r.ultGhost = ultMode.value ? x : null;
  }
  /** Đang chọn chỗ tung chiêu tượng thần. */
  const ultMode = ref(false);
  function toggleUltMode(): void {
    const s = canCommand();
    if (!s) return;
    if (!ultMode.value && s.view.teams[0].ult < 1) {
      return void ui().toast(t('game.ultCharging', { n: Math.floor(s.view.teams[0].ult * 100) }), 1400);
    }
    const on = !ultMode.value;
    cancelPlacing();
    ultMode.value = on;
    sound.click();
  }
  function cancelPlacing(): boolean {
    if (!flagMode.value && !wallMode.value && !depotMode.value && !ultMode.value) return false;
    flagMode.value = false;
    wallMode.value = false;
    ultMode.value = false;
    stopDepot();
    hoverWall(null);
    return true;
  }
  /**
   * Chạm chiến trường tại x: cắm cờ tập hợp.
   * Trả về true nếu đã xử lý (không thì chạm chỉ để lia góc nhìn).
   */
  function placeAt(x: number): boolean {
    const s = canCommand();
    if (!s) return false;
    if (flagMode.value) {
      flagMode.value = false;
      s.match.setHold(x);
      sound.click();
      return true;
    }
    if (ultMode.value) {
      cancelPlacing();
      if (s.match.unleash(x)) {
        sound.horn();
        ui().toast(t('game.ultFired', { name: ultName(s.view.teams[0].faction) }), 1600);
      }
      return true;
    }
    if (depotMode.value) {
      // Ô đền trống gần chỗ chạm nhất
      const kind = depotMode.value;
      const slot = freeDepots(s.match.view, 0).sort((a, b) => Math.abs(depotX(0, a) - x) - Math.abs(depotX(0, b) - x))[0];
      if (slot === undefined || Math.abs(depotX(0, slot) - x) > DEPOT_PICK) {
        ui().toast(t('game.depotPick'), 1400);
        return true;
      }
      cancelPlacing();
      if (s.match.train(kind, slot)) {
        sound.click();
        ui().toast(t('game.depotOrdered', { n: DEPOT_SLOTS[slot] }), 1600);
      } else ui().toast(s.match.whyNot(kind), 1200);
      return true;
    }
    if (wallMode.value) {
      const why = s.match.wallBlock(x);
      if (why) {
        ui().toast(t(`game.wallWhy.${why}`), 1400);
        return true;
      }
      s.match.orderWall(x);
      wallMode.value = false;
      hoverWall(null);
      sound.click();
      ui().toast(t('game.wallOrdered'), 1600);
      return true;
    }
    return false;
  }

  function setFormation(next: Formation): void {
    const s = canCommand();
    if (!s) return;
    s.match.setFormation(next);
    sound.click();
    ui().toast(`${FORMATION_INFO[next].icon} ${FORMATION_INFO[next].label}: ${FORMATION_INFO[next].tip}`, 2200);
  }

  function cycleFormation(): void {
    const s = canCommand();
    if (!s) return;
    setFormation(FORMATION_CYCLE[(FORMATION_CYCLE.indexOf(s.view.teams[0].formation) + 1) % FORMATION_CYCLE.length]);
  }

  /** Chia thợ mỏ theo tỉ lệ [bạc, vàng, kim cương]. */
  function setMineSplit(split: MineSplit): void {
    const s = canCommand();
    if (!s) return;
    if (!split.some((n) => n > 0)) return;
    s.match.setMineSplit(split);
    sound.click();
  }

  /** Đổi lần lượt các kiểu chia thợ mỏ có sẵn (phím R). */
  function cycleMinePreset(): void {
    const s = canCommand();
    if (!s) return;
    const cur = s.view.teams[0].mineSplit;
    const i = MINE_PRESETS.findIndex((p) => p.split.every((n, k) => n === cur[k]));
    const next = MINE_PRESETS[(i + 1) % MINE_PRESETS.length];
    setMineSplit(next.split);
    ui().toast(`⛏️ ${next.label}: ${next.tip}`, 1800);
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

  /** Màn `index` trong chiến dịch của hệ `faction`: người chơi cầm đúng hệ đó, không đổi hệ trước trận. */
  function startCampaign(index: number, faction: FactionId = settings().campFaction): void {
    const st = settings();
    if (faction !== st.campFaction) st.campFaction = faction;
    const lv = campaignLevel(index, faction, st.progress[faction].seed);
    const f = FACTIONS[faction];
    const enemyFaction = lv.enemyFaction ?? 'light';
    const world = new World([
      { ...lv.player, faction },
      { ...lv.enemy, faction: enemyFaction },
    ]);
    const s = mount(
      { type: 'campaign', level: index, faction },
      localMatch(world, [new EnemyAI(lv.ai)]),
      t('campaign.levelTag', { n: index + 1, icon: f.icon, name: f.name }),
      levelName(index),
    );
    if (index === 0 && st.tips) {
      s.tips = [
        { at: 1, text: t('campaign.tip1') },
        { at: 12, text: t('campaign.tip2') },
        { at: 45, text: t('campaign.tip3') },
      ];
    }
    const intro = levelIntro(index);
    ui().show({
      kind: 'generic',
      eyebrow: t('campaign.eyebrow', { icon: f.icon, name: f.name, n: index + 1, total: LEVELS.length }),
      title: levelName(index),
      lines: index === 0 ? [intro, t('campaign.passive', { icon: f.icon, passive: civPassive(faction) })] : [intro],
      matchup: [faction, enemyFaction],
      newUnits: (lv.newUnits ?? []).map((a) => kindOf(faction, a)),
      buttons: [
        { label: t('common.enter'), primary: true, action: () => begin(s) },
        { label: t('common.toMenu'), action: toMenu },
      ],
    });
  }

  /** Đấu với máy: máy chọn hệ ngẫu nhiên (khác hệ mình); đổi hệ trước trận thì giữ nguyên hệ máy. */
  function startSkirmish(diff: Difficulty, enemy?: FactionId): void {
    const st = settings();
    const cfg = SKIRMISH[diff];
    const pool = FACTION_ORDER.filter((f) => f !== st.faction);
    const enemyFaction = enemy ?? pool[Math.floor(Math.random() * pool.length)];
    const world = new World([
      { ...cfg.player, faction: st.faction },
      { ...cfg.enemy, faction: enemyFaction },
    ]);
    const label = t(`skirmish.${diff}`);
    const s = mount(
      { type: 'skirmish', diff },
      localMatch(world, [new EnemyAI(cfg.ai)]),
      t('skirmish.title'),
      t('skirmish.sub', { label }),
    );
    ui().show({
      kind: 'generic',
      eyebrow: t('skirmish.eyebrow', { label }),
      title: t('skirmish.free'),
      lines: [t('skirmish.intro', { n: ARCH_ORDER.length })],
      matchup: [st.faction, enemyFaction],
      pickFaction: (id) => {
        chooseFaction(id);
        startSkirmish(diff, enemyFaction);
      },
      buttons: [
        { label: t('common.enter'), primary: true, action: () => begin(s) },
        { label: t('common.toMenu'), action: toMenu },
      ],
    });
  }

  function restartLocal(s: GameSession): void {
    if (s.mode.type === 'campaign') startCampaign(s.mode.level, s.mode.faction);
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
        title: t('skirmish.won', { label: t(`skirmish.${diff}`) }),
        stats: statsOf(v),
        buttons: [
          { label: t('skirmish.again'), primary: true, action: () => startSkirmish(diff) },
          { label: t('common.toMenu'), action: toMenu },
        ],
      });
      return;
    }
    if (s.mode.type !== 'campaign') return;
    const { level: i, faction } = s.mode;
    const stars = starsFor(v);
    const st = settings();
    const { wasDone } = st.recordWin(faction, i, stars);
    // Máy chủ giữ ví xu: cộng xu cho sao mới của màn này (mất mạng thì gửi lại lần sau)
    useOnline().claimCampaign(faction, i, stars);
    if (i === LEVELS.length - 1) {
      const f = FACTIONS[faction];
      // Gợi ý hệ tiếp theo chưa phá đảo, theo thứ tự sau hệ vừa chơi
      const k = FACTION_ORDER.indexOf(faction);
      const order = FACTION_ORDER.map((_, j) => FACTION_ORDER[(k + 1 + j) % FACTION_ORDER.length]);
      const next = order.find((id) => !st.progress[id].completed);
      const buttons: DialogButton[] = next
        ? [
            {
              label: t('campaign.playCiv', { icon: FACTIONS[next].icon, name: civName(next) }),
              primary: true,
              action: () => startCampaign(Math.min(st.progress[next].unlocked, LEVELS.length - 1), next),
            },
            { label: t('common.toMenu'), action: toMenu },
          ]
        : [{ label: t('common.toMenu'), primary: true, action: toMenu }];
      buttons.push({ label: t('campaign.replayLevel'), action: () => startCampaign(i, faction) });
      ui().show({
        kind: 'generic',
        emoji: '👑',
        title: next ? t('campaign.mastered', { icon: f.icon, name: f.name }) : t('campaign.king'),
        lines: [
          t('campaign.masteredLine', { n: LEVELS.length, name: f.name, others: FACTION_ORDER.length - 1 }),
          ...(next ? [] : wasDone ? [] : [t('campaign.allDone', { n: FACTION_ORDER.length })]),
        ],
        stats: statsOf(v),
        buttons,
      });
      return;
    }
    ui().show({
      kind: 'generic',
      stars,
      title: t('campaign.win'),
      lines: [t('campaign.winLine')],
      stats: statsOf(v),
      buttons: [
        { label: t('campaign.next', { n: i + 2 }), primary: true, action: () => startCampaign(i + 1, faction) },
        { label: t('common.replay'), action: () => startCampaign(i, faction) },
        { label: t('common.toMenu'), action: toMenu },
      ],
    });
  }

  function onLocalLose(s: GameSession): void {
    sound.lose();
    // Thua trận đủ dài (chiến dịch / đấu với máy) vẫn được chút xu an ủi
    if (s.view.time >= PVP_XU_MIN_SECONDS) useOnline().claimSoloLose();
    ui().show({
      kind: 'generic',
      emoji: '💀',
      title: t('campaign.lose'),
      lines: [t('campaign.loseLine')],
      buttons: [
        { label: t('common.replay'), primary: true, action: () => restartLocal(s) },
        { label: t('common.toMenu'), action: toMenu },
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
    ui().show({
      kind: 'generic',
      emoji: '⏸',
      title: t('pause.title'),
      buttons: [
        { label: t('common.resume'), primary: true, action: resume },
        { label: t('common.replay'), action: () => restartLocal(s) },
        { label: `⚙️ ${t('settings.title')}`, action: () => ui().show({ kind: 'settings', back: showPause }) },
        { label: t('common.howto'), action: () => ui().show({ kind: 'howto', back: showPause }) },
        { label: t('common.toMenu'), action: toMenu },
      ],
    });
  }

  function resume(): void {
    ui().close();
    const s = session.value;
    if (s && s.mode.type !== 'menu' && !isNet(s.mode) && !s.endShown) s.running = true;
  }

  const factionName = (f: FactionId) => `${FACTIONS[f].icon} ${civName(f)}`;

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
    flagMode,
    wallMode,
    depotMode,
    ultMode,
    toggleUltMode,
    toggleWallMode,
    hoverWall,
    toggleFlagMode,
    cancelPlacing,
    placeAt,
    setFormation,
    cycleFormation,
    setMineSplit,
    cycleMinePreset,
    toggleSpeed,
    startCampaign,
    startSkirmish,
    pause,
    resume,
    toMenu,
    factionName,
  };
});
