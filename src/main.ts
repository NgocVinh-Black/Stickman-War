import './style.css';
import './lobby.css';
import './login.css';
import { EnemyAI } from './core/ai';
import { CAMPAIGN, DIFFS, LEVELS, SKIRMISH, campaignLevel, type Difficulty } from './core/levels';
import { FACTIONS, FACTION_ORDER, counteredBy, type FactionId } from './core/factions';
import {
  ARCH_ORDER,
  MAX_QUEUE,
  POP_CAP,
  TRAIN_KEYS,
  UNITS,
  kindOf,
  roster,
  type Formation,
  type Stance,
  type Team,
  type UnitKind,
} from './core/units';
import { World, WORLD_WIDTH, statueX, type WorldEvent, type WorldView } from './core/world';
import {
  MIN_BET,
  ROOM_GOLD,
  ROOM_MINUTES,
  CHAT_MAX,
  betOdds,
  canTrainSnap,
  cleanName,
  type BetPool,
  type ChatLine,
  type ClientMsg,
  type EndReason,
  type LobbyRoom,
  type ServerMsg,
  type WaitRoom,
} from './net/protocol';
import { OnlineClient, RemoteWorld } from './net/remote';
import {
  accountFromServer,
  auth,
  initAuth,
  leaderboard,
  logout,
  onAuthChange,
  refreshMe,
  renderGoogleButton,
  updateProfile,
} from './net/account';
import { GUIDE_PAGES, basicsHtml, countersHtml, factionGuideHtml, tacticsHtml, type GuidePage } from './ui/guide';
import { Voice } from './net/voice';
import { Renderer, TEAM_COLORS } from './render/renderer';
import { drawStickman } from './render/stickman';
import { sound } from './ui/sound';
import { load, loadProgress, save, saveProgress, walletId, type Progress } from './ui/storage';

const app = document.querySelector<HTMLDivElement>('#app')!;
const STEP = 1 / 60;
const STANCES: { id: Stance; icon: string; label: string; key: string }[] = [
  { id: 'garrison', icon: '🏰', label: 'Rút về', key: 'Q' },
  { id: 'defend', icon: '🛡️', label: 'Phòng thủ', key: 'W' },
  { id: 'attack', icon: '⚔️', label: 'Tấn công', key: 'E' },
];

/** Thường mở khi thắng hết chiến dịch Dễ, Khó mở khi thắng hết Thường. */
const diffOpen = (d: Difficulty) => d === 'easy' || !!loadProgress(DIFFS[DIFFS.indexOf(d) - 1]).completed;
let campDiff: Difficulty = load<Difficulty>('campDiff', 'easy');
if (!DIFFS.includes(campDiff) || !diffOpen(campDiff)) campDiff = 'easy';
let progress: Progress = loadProgress(campDiff);
type MenuTab = 'home' | 'offline' | 'online' | 'arena' | 'guide' | 'account';
const MENU_TABS: { id: MenuTab; label: string }[] = [
  { id: 'home', label: '🏠 Sảnh' },
  { id: 'offline', label: '🎯 Chơi đơn' },
  { id: 'online', label: '🌐 Online' },
  { id: 'arena', label: '🏟️ Đấu trường' },
  { id: 'guide', label: '📖 Cẩm nang' },
  { id: 'account', label: '👤 Tài khoản' },
];
let menuTab: MenuTab = load<MenuTab>('tab', 'home');
if (!MENU_TABS.some((t) => t.id === menuTab)) menuTab = 'home';
let guidePage: GuidePage = 'basics';
let guideFaction: FactionId | null = null;
let playerName: string = load('name', `Người que ${Math.floor(100 + Math.random() * 900)}`);
let myFaction: FactionId = load<FactionId>('faction', 'tribe');
if (!FACTION_ORDER.includes(myFaction)) myFaction = 'tribe';
const FORMATION_INFO: Record<Formation, { icon: string; label: string; tip: string }> = {
  free: { icon: '🌀', label: 'Tự do', tip: 'Mỗi quân tự lao lên theo tốc độ riêng' },
  line: { icon: '🧱', label: 'Hàng lối', tip: 'Cả đội đi cùng tốc độ quân chậm nhất: khiên trước, cận chiến, bắn xa, hỗ trợ sau cùng' },
  spread: { icon: '↔️', label: 'Tản rộng', tip: 'Như hàng lối nhưng giãn cách xa, ít bị phép nổ trúng cả đám' },
};
const FORMATION_CYCLE: Formation[] = ['free', 'line', 'spread'];
const archIndex = (k: UnitKind) => ARCH_ORDER.indexOf(UNITS[k].arch);
const randomEnemyFaction = (): FactionId => {
  const pool = FACTION_ORDER.filter((f) => f !== myFaction);
  return pool[Math.floor(Math.random() * pool.length)];
};

/** Một trận đấu: cục bộ (chiến dịch / đấu máy) hoặc online. HUD và renderer chỉ làm việc qua giao diện này. */
type Match = {
  view: WorldView;
  step: (dt: number) => WorldEvent[];
  train: (kind: UnitKind) => boolean;
  setStance: (s: Stance) => void;
  setCenterMine: (on: boolean) => void;
  setFormation: (f: Formation) => void;
  canTrain: (kind: UnitKind) => boolean;
  whyNot: (kind: UnitKind) => string;
  pop: () => number;
  unlocked: UnitKind[];
};

type Mode =
  | { type: 'menu' }
  | { type: 'campaign'; level: number; diff: Difficulty }
  | { type: 'skirmish'; diff: Difficulty }
  | { type: 'online'; opponent: string }
  | { type: 'watch'; players: [string, string] };

/** Trận do máy chủ chạy (chơi online hoặc đang xem): không tạm dừng được, kết quả do máy chủ báo. */
const isNet = (m: Mode) => m.type === 'online' || m.type === 'watch';

type Session = {
  mode: Mode;
  match: Match;
  renderer: Renderer;
  running: boolean;
  speed: number;
  endShown: boolean;
  endT: number;
  tips: { at: number; text: string }[];
};
let session: Session | null = null;

// ---------- Trận cục bộ ----------

function localMatch(world: World, ais: EnemyAI[]): Match {
  let acc = 0;
  return {
    view: world,
    step(dt) {
      acc += dt;
      let n = 0;
      while (acc >= STEP && n++ < 24) {
        for (const ai of ais) ai.update(world, STEP);
        world.update(STEP);
        acc -= STEP;
      }
      return world.drainEvents();
    },
    train: (k) => world.train(0, k),
    setStance: (s) => world.setStance(0, s),
    setCenterMine: (on) => world.setCenterMine(0, on),
    setFormation: (f) => world.setFormation(0, f),
    canTrain: (k) => world.canTrain(0, k),
    whyNot: (k) => {
      const t = world.teams[0];
      if (!t.unlocked.includes(k)) return 'Chưa mở khoá';
      if (t.gold < UNITS[k].cost) return 'Không đủ vàng';
      if (t.queue.length >= MAX_QUEUE) return 'Hàng chờ đã đầy';
      return 'Đã đủ quân số';
    },
    pop: () => world.pop(0),
    unlocked: world.teams[0].unlocked,
  };
}

// ---------- Vòng lặp chung ----------

let lastT = performance.now();
function frame(t: number): void {
  const dt = Math.min((t - lastT) / 1000, 0.1);
  lastT = t;
  if (session) tick(session, dt);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);

function tick(s: Session, dt: number): void {
  if (s.running) {
    const events = s.match.step(dt * s.speed);
    s.renderer.consume(events);
    if (s.mode.type !== 'menu') playSounds(s, events);
  }

  if (s.mode.type === 'menu') {
    followAction(s, dt);
    if (s.match.view.winner !== null) startDemo();
  }

  s.renderer.draw(s.match.view, s.running ? dt * s.speed : 0);
  if (s.mode.type === 'menu') return;

  const mini = document.querySelector<HTMLCanvasElement>('#minimap');
  if (mini) s.renderer.drawMinimap(mini, s.match.view);
  updateHud(s);
  panByKeys(s, dt);
  while (s.running && s.tips.length && s.match.view.time >= s.tips[0].at) toast(s.tips.shift()!.text, 3500);

  // Trận cục bộ kết thúc khi có người thắng; trận online do máy chủ báo
  if (!isNet(s.mode) && s.match.view.winner !== null && !s.endShown) {
    s.endT += dt;
    if (s.endT > 1.2) {
      s.endShown = true;
      s.running = false;
      if (s.match.view.winner === 0) onLocalWin(s);
      else onLocalLose(s);
    }
  }
}

function playSounds(s: Session, events: WorldEvent[]): void {
  const r = s.renderer;
  const visible = (x: number) => x > r.camX - 150 && x < r.camX + r.viewW + 150;
  for (const e of events) {
    switch (e.type) {
      case 'hit':
        if (visible(e.x)) sound.hit();
        break;
      case 'swing':
        if (visible(e.x) && UNITS[e.kind]?.arch !== 'miner') sound.swing();
        break;
      case 'shoot':
        if (visible(e.x)) sound.arrow();
        break;
      case 'explode':
        if (visible(e.x)) sound.explode();
        break;
      case 'death':
        if (visible(e.x)) sound.death();
        break;
      case 'gold':
        if (e.team === 0 && visible(e.x)) sound.coin();
        break;
      case 'trained':
        if (e.team === 0) sound.trained();
        break;
      case 'statueHit':
        if (e.team === 0) sound.statueHit();
        break;
      case 'blink':
        if (visible(e.x)) sound.swing();
        break;
      case 'promote':
        if (e.team === 0) sound.trained();
        break;
      case 'drop':
        if (visible(e.x)) sound.coin();
        break;
      case 'built':
        if (e.team === 0) sound.trained();
        break;
      case 'raise':
        if (visible(e.x)) sound.death();
        break;
    }
  }
}

// ---------- Menu (nền là trận demo AI đánh AI) ----------

function startDemo(): void {
  const lv = LEVELS[6];
  const setup = (faction: FactionId) => ({
    faction,
    gold: 800,
    statueHp: 999999,
    incomeMult: 1.2,
    unlocked: ARCH_ORDER,
    start: ['miner', 'miner', 'miner', 'sword', 'archer', 'spear'] as UnitKind[],
  });
  // Nền menu: hai tộc ngẫu nhiên đánh nhau để khoe các tộc
  const a = FACTION_ORDER[Math.floor(Math.random() * FACTION_ORDER.length)];
  const b = FACTION_ORDER.filter((f) => f !== a)[Math.floor(Math.random() * (FACTION_ORDER.length - 1))];
  const world = new World([setup(a), setup(b)]);
  const canvas = document.querySelector<HTMLCanvasElement>('#bg')!;
  const renderer = new Renderer(canvas);
  renderer.centerOn(WORLD_WIDTH / 2);
  session = {
    mode: { type: 'menu' },
    match: localMatch(world, [new EnemyAI({ ...lv.ai, forceAttackAt: 60 }, 0), new EnemyAI({ ...lv.ai, forceAttackAt: 75 }, 1)]),
    renderer,
    running: true,
    speed: 1,
    endShown: false,
    endT: 0,
    tips: [],
  };
}

/** Camera menu trôi theo điểm giao tranh. */
function followAction(s: Session, dt: number): void {
  const fighters = s.match.view.units.filter((u) => !u.dying && UNITS[u.kind].arch !== 'miner');
  if (!fighters.length) return;
  const xs = fighters.map((u) => u.x).sort((a, b) => a - b);
  const target = xs[Math.floor(xs.length / 2)] - s.renderer.viewW / 2;
  s.renderer.setCamera(s.renderer.camX + (target - s.renderer.camX) * Math.min(1, dt * 0.8));
}

let tickerTimer = 0;

function showMenu(): void {
  closeOverlay();
  online.leave();
  clearInterval(tickerTimer);
  loginPaint = null;
  app.innerHTML = `
    <canvas id="bg" class="bg-canvas"></canvas>
    <div class="lb-shade"></div>
    <main class="lobby">
      <header class="lb-top">
        <button class="lb-profile wood" data-act="profile" title="Tài khoản">
          <span class="lb-avatar" id="lb-avatar"></span>
          <span class="lb-profile-text">
            <b id="lb-name"></b>
            <span class="lb-chips">
              <span class="lb-chip">🏆 <i id="lb-rating"></i></span>
              <span class="lb-chip">⭐ <i id="lb-stars"></i></span>
            </span>
            <span class="lb-bar" title="Tiến độ chiến dịch"><i id="lb-progress"></i></span>
          </span>
          <span class="lb-badge" id="lb-badge"></span>
        </button>
        <picture class="lb-title"><source srcset="./logo.webp" type="image/webp" /><img src="./logo.png" alt="Đại Chiến Người Que" /></picture>
        <div class="lb-top-right">
          <span class="lb-pill wood" title="Xu bắt kèo"><span class="coin">🪙</span><b id="lb-xu">—</b></span>
          <span class="lb-pill wood" title="Người đang online"><span class="coin">🟢</span><b id="lb-online">—</b></span>
          <button class="lb-square wood" data-act="mute" title="Âm thanh">${sound.muted ? '🔇' : '🔊'}</button>
          <button class="lb-square wood" data-act="help" title="Cẩm nang">📖</button>
        </div>
      </header>
      <nav class="lb-tabs" role="tablist">
        ${MENU_TABS.map((t) => `<button class="lb-tab wood" role="tab" data-tab="${t.id}">${t.label}</button>`).join('')}
      </nav>
      <section class="lb-stage" id="lb-stage"></section>
      <aside class="lb-side">
        <button class="lb-round" data-act="faction" style="--faction:${FACTIONS[myFaction].color}"><span>${FACTIONS[myFaction].icon}</span><small>Đổi tộc</small></button>
        <button class="lb-round" data-act="rank"><span>🏆</span><small>Xếp hạng</small></button>
        <button class="lb-round" data-act="account"><span>👤</span><small>Tài khoản</small></button>
      </aside>
      <footer class="lb-bottom">
        <div class="lb-ticker" id="lb-ticker"></div>
        <button class="lb-start" data-act="start"><span>Bắt đầu chiến đấu</span><small id="lb-start-sub"></small></button>
        <div class="lb-corner">
          <button class="lb-big wood" data-act="campaign"><span>🗺️</span><b>Chiến dịch</b></button>
          <button class="lb-big wood orange" data-act="pvp"><span>⚔️</span><b>PvP</b></button>
        </div>
      </footer>
    </main>`;
  startDemo();
  app.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) =>
    b.addEventListener('click', () => goTab(b.dataset.tab as MenuTab)),
  );
  const on = (act: string, fn: () => void) => app.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
  on('profile', () => goTab('account'));
  on('account', () => goTab('account'));
  on('rank', () => goTab('arena'));
  on('help', () => goTab('guide'));
  on('faction', () => showFactionPicker());
  on('campaign', () => goTab('offline'));
  on('pvp', () => goTab('online'));
  on('start', () => startCampaign(Math.min(progress.unlocked, LEVELS.length - 1)));
  on('mute', () => {
    sound.toggle();
    app.querySelector('[data-act="mute"]')!.textContent = sound.muted ? '🔇' : '🔊';
  });
  startTicker();
  renderHubUser();
  renderTab();
}

/** Dòng thông báo chạy ở chân sảnh. */
function startTicker(): void {
  const f = FACTIONS[myFaction];
  const lines = [
    `Tộc của bạn: ${f.icon} <b>${f.name}</b>. Khắc ${f.counters.map((x) => FACTIONS[x].icon + ' ' + FACTIONS[x].name).join(', ')}.`,
    'Mẹo: bấm <b>F</b> trong trận để đổi đội hình, <b>Hàng lối</b> giữ cả đội đi cùng nhau.',
    'Mẹo: <b>Thợ xây</b> dựng tháp canh trước nhà, chặn được kỵ binh đánh úp.',
    'Mẹo: thợ mỏ chết sẽ <b>rơi túi vàng</b>, quân phe nào chạm trước thì nhặt được.',
    'Đăng nhập Google để lưu <b>điểm xếp hạng</b> và xu trên mọi máy.',
  ];
  let i = 0;
  const show = () => {
    const el = document.getElementById('lb-ticker');
    if (!el) return clearInterval(tickerTimer);
    el.innerHTML = `<span class="lb-ticker-label">Thông báo:</span> ${lines[i++ % lines.length]}`;
    el.classList.remove('fade');
    void el.offsetWidth;
    el.classList.add('fade');
  };
  show();
  tickerTimer = window.setInterval(show, 6000);
}

function renderTab(): void {
  app.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
    b.classList.toggle('active', b.dataset.tab === menuTab);
    b.setAttribute('aria-selected', String(b.dataset.tab === menuTab));
  });
  const stage = document.getElementById('lb-stage');
  if (!stage) return;
  app.querySelector('.lobby')?.setAttribute('data-view', menuTab);
  if (menuTab !== 'arena') online.client?.send({ t: 'lobby', on: false });
  if (menuTab === 'home') {
    renderHomeStage(stage);
    return;
  }
  const label = MENU_TABS.find((t) => t.id === menuTab)!.label;
  stage.innerHTML = `
    <div class="lb-panel wood">
      <div class="lb-panel-head"><h2>${label}</h2><button class="lb-close" data-act="close-panel" title="Về sảnh">✕</button></div>
      <div class="lb-panel-body"><div class="tab-body" id="tab-body"></div></div>
    </div>`;
  stage.querySelector('[data-act="close-panel"]')!.addEventListener('click', () => goTab('home'));
  const body = document.getElementById('tab-body')!;
  if (menuTab === 'guide') renderGuideTab(body);
  else if (menuTab === 'account') renderAccountTab(body);
  else if (menuTab === 'offline') renderOfflineTab(body);
  else if (menuTab === 'online') renderOnlineTab(body);
  else renderArenaTab(body);
}

function renderOfflineTab(body: HTMLElement): void {
  const { unlocked, stars } = progress;
  const next = Math.min(unlocked, LEVELS.length - 1);
  const label = CAMPAIGN[campDiff].label;
  body.innerHTML = `
    <h2 class="section-title">Chiến dịch</h2>
    <div class="diff-row camp-diff" role="radiogroup" aria-label="Độ khó chiến dịch">
      ${DIFFS.map((d) => {
        const open = diffOpen(d);
        const done = loadProgress(d).completed;
        return `<button class="btn diff diff-${d} ${d === campDiff ? 'active' : ''} ${open ? '' : 'locked'}" data-camp-diff="${d}"
          role="radio" aria-checked="${d === campDiff}">${open ? '' : '🔒 '}${CAMPAIGN[d].label}${done ? ' 👑' : ''}</button>`;
      }).join('')}
    </div>
    <button class="btn btn-primary wide" data-act="play">${unlocked > 0 ? `⚔️ Chơi tiếp · Màn ${next + 1}` : `⚔️ Bắt đầu chiến dịch ${label}`}</button>
    <div class="level-grid">
      ${LEVELS.map((lv, i) => {
        const locked = i > unlocked;
        const st = stars[i] ?? 0;
        return `<button class="level ${locked ? 'locked' : ''}" data-level="${i}" ${locked ? 'disabled' : ''} title="${lv.name}">
          <span class="level-num">${locked ? '🔒' : i + 1}</span>
          <span class="level-stars">${'★'.repeat(st)}<i>${'★'.repeat(3 - st)}</i></span>
        </button>`;
      }).join('')}
    </div>
    <h2 class="section-title">Đấu với máy</h2>
    <div class="diff-row">
      ${(Object.keys(SKIRMISH) as Difficulty[])
        .map((d) => `<button class="btn diff diff-${d}" data-diff="${d}">${SKIRMISH[d].label}</button>`)
        .join('')}
    </div>`;
  body.querySelectorAll<HTMLButtonElement>('[data-camp-diff]').forEach((b) =>
    b.addEventListener('click', () => {
      const d = b.dataset.campDiff as Difficulty;
      if (!diffOpen(d)) {
        const prev = CAMPAIGN[DIFFS[DIFFS.indexOf(d) - 1]].label;
        toast(`Thắng hết ${LEVELS.length} màn ${prev} để mở mức ${CAMPAIGN[d].label}`, 2500);
        return;
      }
      sound.click();
      selectCampDiff(d);
      renderOfflineTab(body);
    }),
  );
  body.querySelector('[data-act="play"]')!.addEventListener('click', () => startCampaign(next));
  body.querySelectorAll<HTMLButtonElement>('[data-level]').forEach((b) =>
    b.addEventListener('click', () => startCampaign(Number(b.dataset.level))),
  );
  body.querySelectorAll<HTMLButtonElement>('[data-diff]').forEach((b) =>
    b.addEventListener('click', () => startSkirmish(b.dataset.diff as Difficulty)),
  );
}

function selectCampDiff(d: Difficulty): void {
  campDiff = d;
  save('campDiff', d);
  progress = loadProgress(d);
}

function renderOnlineTab(body: HTMLElement): void {
  const code = new URLSearchParams(location.search).get('room') ?? '';
  body.innerHTML = `
    <label class="field">
      <span>Tên của bạn</span>
      <input id="name" maxlength="16" autocomplete="nickname" value="${escapeHtml(playerName)}" ${auth.account ? 'disabled title="Đổi tên ở mục Tài khoản"' : ''} />
    </label>
    <button class="btn btn-primary wide" data-act="quick">⚡ Tìm trận nhanh</button>
    <button class="btn wide" data-act="create">➕ Tạo phòng mời bạn</button>
    <div class="join-row">
      <input id="code" maxlength="4" placeholder="Mã phòng" autocapitalize="characters" value="${escapeHtml(code.toUpperCase().slice(0, 4))}" />
      <button class="btn" data-act="join">▶ Chơi</button>
      <button class="btn" data-act="watch" title="Vào xem trận">👁 Xem</button>
    </div>
    <p class="online-status" id="online-status">1 đấu 1 với người chơi khác qua mạng</p>`;
  const nameInput = body.querySelector<HTMLInputElement>('#name')!;
  nameInput.addEventListener('change', () => {
    playerName = cleanName(nameInput.value);
    nameInput.value = playerName;
    save('name', playerName);
  });
  const codeInput = body.querySelector<HTMLInputElement>('#code')!;
  codeInput.addEventListener('input', () => (codeInput.value = codeInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '')));
  codeInput.addEventListener('keydown', (e) => e.key === 'Enter' && joinByCode('play'));
  body.querySelector('[data-act="quick"]')!.addEventListener('click', () => void goOnline({ t: 'quick' }));
  body.querySelector('[data-act="create"]')!.addEventListener('click', () => void goOnline({ t: 'create' }));
  body.querySelector('[data-act="join"]')!.addEventListener('click', () => joinByCode('play'));
  body.querySelector('[data-act="watch"]')!.addEventListener('click', () => joinByCode('watch'));
  if (online.lastOnline) setStatus(`🟢 ${online.lastOnline} người đang trực tuyến`);
}

function joinByCode(as: 'play' | 'watch'): void {
  const code = document.querySelector<HTMLInputElement>('#code')?.value.trim() ?? '';
  if (code.length !== 4) {
    toast('Nhập mã phòng gồm 4 ký tự');
    return;
  }
  void goOnline({ t: 'join', code, as });
}

// ---------- Đấu trường: danh sách phòng, vào chơi hoặc vào xem ----------

function renderArenaTab(body: HTMLElement): void {
  body.innerHTML = `
    <div class="arena-list" id="arena-list"></div>
    <p class="online-status" id="online-status">Chọn ▶ Chơi để vào ghế trống, 👁 Xem để theo dõi trận đang đấu</p>
    <h2 class="section-title">🏆 Bảng xếp hạng</h2>
    <div class="leaderboard" id="leaderboard"><p class="muted">Đang tải…</p></div>`;
  renderArenaList();
  void leaderboard()
    .then((list) => {
      const el = document.getElementById('leaderboard');
      if (!el) return;
      el.innerHTML = list.length
        ? `<ol>${list
            .map(
              (a, i) => `<li class="${a.id === auth.account?.id ? 'me' : ''}"><span class="rank">${i + 1}</span>
                ${avatarHtml(a.picture, a.name)}<b>${escapeHtml(a.name)}</b><span>${FACTIONS[a.faction]?.icon ?? ''}</span>
                <span class="rating">${a.rating}</span><small>${a.wins}T · ${a.losses}B</small></li>`,
            )
            .join('')}</ol>`
        : '<p class="muted">Chưa có ai xếp hạng. Đăng nhập Google rồi đấu online để lên bảng!</p>';
    })
    .catch(() => {
      const el = document.getElementById('leaderboard');
      if (el) el.innerHTML = '<p class="muted">Không tải được bảng xếp hạng (máy chủ online chưa chạy?)</p>';
    });
  void online.ensure().then((c) => {
    if (c && menuTab === 'arena' && session?.mode.type === 'menu') c.send({ t: 'lobby', on: true });
  });
}

function renderArenaList(): void {
  const list = document.getElementById('arena-list');
  if (!list) return;
  const rooms = online.lobby;
  if (!rooms) {
    list.innerHTML = '<p class="arena-empty">Đang tải danh sách phòng…</p>';
    return;
  }
  if (!rooms.length) {
    list.innerHTML = `<p class="arena-empty">Chưa có phòng nào đang mở.</p>
      <button class="btn btn-primary wide" data-act="arena-create">➕ Tạo phòng</button>`;
    list.querySelector('[data-act="arena-create"]')!.addEventListener('click', () => void goOnline({ t: 'create' }));
    return;
  }
  list.innerHTML = rooms.map(arenaRoomHtml).join('');
  list.querySelectorAll<HTMLButtonElement>('[data-play]').forEach((b) =>
    b.addEventListener('click', () => void goOnline({ t: 'join', code: b.dataset.play!, as: 'play' })),
  );
  list.querySelectorAll<HTMLButtonElement>('[data-watch]').forEach((b) =>
    b.addEventListener('click', () => void goOnline({ t: 'join', code: b.dataset.watch!, as: 'watch' })),
  );
}

function arenaRoomHtml(r: LobbyRoom): string {
  const open = r.state === 'waiting' && r.players.length < 2;
  const names = r.players.length ? r.players.map((n) => `<b>${escapeHtml(n)}</b>`).join('<i>vs</i>') : '<b>Phòng trống</b>';
  const state = open
    ? r.players.length ? '🟢 Còn ghế' : '🟢 Còn 2 ghế'
    : r.state === 'waiting'
      ? '⏳ Chờ chủ phòng bắt đầu'
      : r.state === 'ended'
        ? '🏁 Vừa xong'
        : `⚔️ Đang đấu · ${formatTime(r.time)}`;
  return `<div class="arena-room ${open ? 'open' : ''}">
      <div class="arena-info">
        <div class="arena-names">${names}</div>
        <small>${state}${r.watchers ? ` · 👁 ${r.watchers}` : ''}${r.private ? ' · 🔒 Phòng riêng' : ''} · ${r.code}</small>
      </div>
      <div class="arena-actions">
        ${open ? `<button class="btn btn-primary" data-play="${r.code}">▶ Chơi</button>` : ''}
        <button class="btn" data-watch="${r.code}">👁 Xem</button>
      </div>
    </div>`;
}

function setStatus(text: string): void {
  const el = document.getElementById('online-status');
  if (el) el.textContent = text;
}

// ---------- Sảnh: trang chủ, cẩm nang, tài khoản ----------

function avatarHtml(picture: string, name: string): string {
  return picture.startsWith('https://')
    ? `<img class="avatar" src="${escapeHtml(picture)}" alt="" referrerpolicy="no-referrer" />`
    : `<span class="avatar">${escapeHtml((name.trim()[0] ?? '?').toUpperCase())}</span>`;
}

/** Bảng tên góc trái trên: ảnh, tên, điểm, sao chiến dịch, xu, người online. */
function renderHubUser(): void {
  const a = auth.account;
  const name = a?.name ?? playerName;
  const stars = progress.stars.reduce((x, y) => x + (y ?? 0), 0);
  const set = (id: string, html: string) => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  };
  set('lb-avatar', a ? avatarHtml(a.picture, a.name) : `<span class="avatar">${escapeHtml((name.trim()[0] ?? '?').toUpperCase())}</span>`);
  set('lb-name', escapeHtml(name));
  set('lb-rating', a ? String(a.rating) : 'Khách');
  set('lb-stars', `${stars}/${LEVELS.length * 3}`);
  set('lb-badge', FACTIONS[myFaction].icon);
  set('lb-xu', String(auth.xu ?? online.xu ?? '—'));
  set('lb-online', online.lastOnline ? String(online.lastOnline) : '—');
  const next = Math.min(progress.unlocked, LEVELS.length - 1);
  set('lb-start-sub', `Màn ${next + 1}: ${escapeHtml(LEVELS[next].name)} · ${CAMPAIGN[campDiff].label}`);
  const bar = document.getElementById('lb-progress');
  if (bar) bar.style.width = `${Math.round((Math.min(progress.unlocked, LEVELS.length) / LEVELS.length) * 100)}%`;
  const fb = app.querySelector<HTMLElement>('.lb-side [data-act="faction"]');
  if (fb) {
    fb.style.setProperty('--faction', FACTIONS[myFaction].color);
    fb.querySelector('span')!.textContent = FACTIONS[myFaction].icon;
  }
}

function goTab(tab: MenuTab): void {
  sound.click();
  menuTab = tab;
  save('tab', tab);
  renderTab();
}

/** Trang chủ sảnh: ô lớn bên trái, bảng nhiệm vụ ở giữa; trận đánh người que chạy làm nền. */
function renderHomeStage(stage: HTMLElement): void {
  const a = auth.account;
  const next = Math.min(progress.unlocked, LEVELS.length - 1);
  const stars = progress.stars.reduce((x, y) => x + (y ?? 0), 0);
  const f = FACTIONS[myFaction];
  const enemy = FACTIONS[LEVELS[next].enemyFaction ?? 'tribe'];
  stage.innerHTML = `
    <div class="lb-tiles">
      <button class="lb-tile wood" data-act="tile-guide"><span class="lb-tile-icon">📜</span><b>Cẩm nang</b></button>
      <button class="lb-tile wood" data-act="tile-arena"><span class="lb-tile-icon">🏟️</span><b>Đấu trường</b></button>
      <button class="lb-tile wood" data-act="tile-skirmish"><span class="lb-tile-icon">🤖</span><b>Đấu máy</b></button>
    </div>
    <div class="lb-quests">
      <h3>Nhiệm vụ &amp; Ghi chú</h3>
      <button class="lb-quest" data-act="q-campaign"><span class="check ${progress.completed ? 'done' : ''}">${progress.completed ? '✔' : '📜'}</span>
        <span>Chiến dịch ${CAMPAIGN[campDiff].label}: <b>màn ${next + 1}/${LEVELS.length}</b>, đánh ${enemy.icon} ${enemy.name}</span></button>
      <button class="lb-quest" data-act="q-stars"><span class="check ${stars >= LEVELS.length * 3 ? 'done' : ''}">⭐</span>
        <span>Gom sao chiến dịch: <b>${stars}/${LEVELS.length * 3}</b></span></button>
      <button class="lb-quest" data-act="q-faction"><span class="check">${f.icon}</span>
        <span>${f.name}: khắc <b class="good">${f.counters.map((x) => FACTIONS[x].icon).join(' ')}</b>, sợ <b class="bad">${counteredBy(myFaction).map((x) => FACTIONS[x].icon).join(' ')}</b></span></button>
      <button class="lb-quest" data-act="q-account"><span class="check ${a ? 'done' : ''}">${a ? '✔' : '👤'}</span>
        <span>${a ? `Xếp hạng <b>${a.rating}</b> · ${a.wins} thắng · ${a.losses} thua` : 'Đăng nhập Google để lưu thành tích'}</span></button>
    </div>`;
  const on = (act: string, fn: () => void) => stage.querySelector(`[data-act="${act}"]`)?.addEventListener('click', fn);
  on('tile-guide', () => goTab('guide'));
  on('tile-arena', () => goTab('arena'));
  on('tile-skirmish', () => startSkirmish('normal'));
  on('q-campaign', () => goTab('offline'));
  on('q-stars', () => goTab('offline'));
  on('q-faction', () => showFactionPicker());
  on('q-account', () => goTab('account'));
}

// ---------- Màn đăng nhập (trước khi vào sảnh) ----------

/**
 * Chọn chơi khách chỉ có tác dụng trong lần mở trang này (không ghi nhớ):
 * mở lại game luôn hiện màn đăng nhập, trừ khi đã đăng nhập Google.
 */
let guestChosen = false;
save('guest', null); // xoá lựa chọn khách đã lưu từ bản cũ
/** Vẽ lại nút Google / ghi chú khi biết cấu hình máy chủ (màn đăng nhập đang mở). */
let loginPaint: (() => void) | null = null;

/** Chữ G nhiều màu của Google (vẽ SVG, không tải ảnh). */
const GOOGLE_G = `<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.5 5.8c4.4-4 6.8-10 6.8-17.2z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s1 7.4 2.7 10.7l7.8-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.4 2.3-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/></svg>`;

/**
 * Màn đăng nhập: nền public/bg.* + logo public/logo.* (ảnh của game),
 * nút Google / chơi khách / điều khoản / cài đặt dựng bằng HTML theo mẫu thiết kế.
 */
function showLogin(): void {
  closeOverlay();
  clearInterval(tickerTimer);
  session = null;
  let agreed = load<boolean>('agree', false);
  app.innerHTML = `
    <main class="login-art">
      <div class="la-bg"></div>
      <div class="la-vignette"></div>
      <button class="la-gear" data-act="settings" aria-label="Cài đặt">⚙</button>
      <div class="la-center">
        <picture class="la-logo">
          <source srcset="./logo.webp" type="image/webp" />
          <img src="./logo.png" alt="Đại Chiến Người Que" />
        </picture>
        <div class="la-actions">
          <button class="la-google" data-act="google" aria-label="Đăng nhập bằng Google">
            <span class="la-google-face">${GOOGLE_G}<b>Đăng nhập bằng Google</b></span>
            <span class="la-glow"></span>
            <span class="la-gis" id="google-btn"></span>
          </button>
          <p class="la-note" id="login-note"></p>
          <div class="la-or"><span>Hoặc</span></div>
          <button class="la-guest" data-act="guest"><span>Chơi với tư cách khách</span></button>
        </div>
      </div>
      <div class="la-agree">
        <button class="la-check ${agreed ? 'on' : ''}" data-act="agree" role="checkbox" aria-checked="${agreed}" aria-label="Đồng ý điều khoản"></button>
        <span>Tôi đồng ý với <button class="la-a" data-act="terms">Điều khoản dịch vụ</button> và <button class="la-a" data-act="privacy">Chính sách bảo mật</button></span>
      </div>
      <div class="la-slogan"><b>Chiến đấu</b><span>và trở thành huyền thoại!</span></div>
    </main>`;
  const note = document.getElementById('login-note')!;
  const gis = document.getElementById('google-btn')!;
  const plaque = app.querySelector<HTMLElement>('.la-google')!;
  const checks = [...app.querySelectorAll<HTMLElement>('[data-act="agree"]')];

  const needAgree = (): boolean => {
    if (agreed) return false;
    for (const check of checks) {
      check.classList.remove('shake');
      void check.offsetWidth;
      check.classList.add('shake');
    }
    toast('Hãy tích ô đồng ý Điều khoản dịch vụ và Chính sách bảo mật trước', 2200);
    return true;
  };
  // Nút Google thật (iframe của Google) phủ kín tấm biển vàng, gần như trong suốt:
  // bấm vào biển là bấm đúng nút Google. Chưa đồng ý điều khoản thì tắt để biển tự xử lý.
  const fitGis = () => {
    const frame = gis.firstElementChild as HTMLElement | null;
    if (!frame) return;
    const w = frame.offsetWidth || 1;
    const h = frame.offsetHeight || 1;
    gis.style.transform = `translate(-50%, -50%) scale(${plaque.clientWidth / w}, ${plaque.clientHeight / h})`;
    gis.style.pointerEvents = agreed ? 'auto' : 'none';
  };
  const paint = () => {
    if (auth.account) return enterLobby();
    if (auth.clientId) {
      note.textContent = '';
      void renderGoogleButton(gis, (msg) => (note.textContent = msg)).then(() => setTimeout(fitGis, 300));
    }
  };
  paint();
  loginPaint = paint;
  window.addEventListener('resize', fitGis);

  const on = (act: string, fn: () => void) =>
    app.querySelectorAll(`[data-act="${act}"]`).forEach((el) => el.addEventListener('click', fn));
  on('agree', () => {
    sound.click();
    agreed = !agreed;
    save('agree', agreed);
    for (const check of checks) {
      check.classList.toggle('on', agreed);
      check.setAttribute('aria-checked', String(agreed));
    }
    fitGis();
  });
  // Bấm vào biển khi nút Google không nhận click (chưa đồng ý / máy chủ chưa bật Google)
  on('google', () => {
    if (needAgree()) return;
    if (!auth.clientId) {
      note.textContent = !auth.reachable
        ? 'Không kết nối được máy chủ online. Bạn vẫn có thể chơi với tư cách khách.'
        : 'Máy chủ chưa bật đăng nhập Google (thiếu GOOGLE_CLIENT_ID). Tạm thời hãy chơi với tư cách khách.';
    }
  });
  on('guest', () => {
    if (needAgree()) return;
    sound.click();
    guestChosen = true;
    enterLobby();
  });
  on('terms', () => showLegal('terms'));
  on('privacy', () => showLegal('privacy'));
  on('settings', () => {
    sound.click();
    overlay(
      `<h2>Cài đặt</h2>
       <label class="field"><span>Tên khi chơi khách</span>
         <input id="guest-name" maxlength="16" autocomplete="nickname" value="${escapeHtml(playerName)}" /></label>`,
      [
        { label: sound.muted ? '🔇 Đang tắt tiếng · bật lại' : '🔊 Đang có tiếng · tắt', onClick: () => (sound.toggle(), closeOverlay()) },
        {
          label: 'Lưu',
          primary: true,
          onClick: () => {
            playerName = cleanName(document.querySelector<HTMLInputElement>('#guest-name')!.value);
            save('name', playerName);
            closeOverlay();
          },
        },
      ],
    );
  });
}

/** Điều khoản / chính sách: nói đúng những gì game làm với dữ liệu. */
function showLegal(kind: 'terms' | 'privacy'): void {
  sound.click();
  const body =
    kind === 'terms'
      ? `<h2>Điều khoản dịch vụ</h2>
         <ul class="howto">
           <li>Đại Chiến Người Que là trò chơi miễn phí, chơi trên trình duyệt.</li>
           <li><b>Xu 🪙</b> trong game là xu ảo dùng để bắt kèo cho vui, không mua bán, không đổi ra tiền thật.</li>
           <li>Không dùng tên hiển thị hoặc chat để xúc phạm, quấy rối người khác. Chủ phòng có thể mời người vi phạm ra khỏi phòng.</li>
           <li>Không gian lận, không phá máy chủ. Tài khoản vi phạm có thể bị xoá.</li>
           <li>Game có thể thay đổi, cân bằng lại quân lính hoặc dừng máy chủ online bất cứ lúc nào.</li>
         </ul>`
      : `<h2>Chính sách bảo mật</h2>
         <ul class="howto">
           <li>Khi <b>đăng nhập Google</b>, máy chủ chỉ lưu: mã định danh Google, tên hiển thị, ảnh đại diện. <b>Không lưu email</b>, không lưu mật khẩu.</li>
           <li>Kèm theo là dữ liệu chơi: tộc ưa thích, số trận thắng / thua, điểm xếp hạng, 20 trận gần nhất và số xu.</li>
           <li>Tên hiển thị và điểm xếp hạng hiện công khai trên bảng xếp hạng.</li>
           <li>Khi <b>chơi khách</b>, tiến độ chiến dịch và cài đặt chỉ nằm trong trình duyệt của bạn (localStorage).</li>
           <li>Thoại trong phòng đi thẳng giữa các trình duyệt (WebRTC), máy chủ không ghi âm.</li>
           <li>Muốn xoá tài khoản: liên hệ chủ máy chủ game.</li>
         </ul>`;
  overlay(body, [{ label: 'Đã hiểu', primary: true, onClick: closeOverlay }]);
}

function enterLobby(): void {
  if (session?.mode.type === 'menu' && document.querySelector('.lobby')) return;
  menuTab = 'home';
  showMenu();
}

/** Mở game: còn phiên đăng nhập Google thì vào sảnh, không thì hiện màn đăng nhập. */
function showStart(): void {
  if (auth.session) showMenu();
  else showLogin();
}

function renderGuideTab(body: HTMLElement): void {
  const f = guideFaction ?? myFaction;
  const content =
    guidePage === 'basics'
      ? basicsHtml()
      : guidePage === 'factions'
        ? factionGuideHtml(f)
        : guidePage === 'counters'
          ? countersHtml()
          : tacticsHtml();
  body.innerHTML = `
    <div class="guide-nav">${GUIDE_PAGES.map((g) => `<button class="pill ${g.id === guidePage ? 'active' : ''}" data-guide="${g.id}">${g.label}</button>`).join('')}</div>
    <div class="guide-body">${content}</div>`;
  body.querySelectorAll<HTMLButtonElement>('[data-guide]').forEach((b) =>
    b.addEventListener('click', () => {
      sound.click();
      guidePage = b.dataset.guide as GuidePage;
      renderGuideTab(body);
    }),
  );
  body.querySelectorAll<HTMLButtonElement>('[data-gfaction]').forEach((b) =>
    b.addEventListener('click', () => {
      sound.click();
      guideFaction = b.dataset.gfaction as FactionId;
      renderGuideTab(body);
    }),
  );
  body.querySelectorAll<HTMLCanvasElement>('[data-gicon]').forEach((c) => drawIcon(c, c.dataset.gicon!));
}

function renderAccountTab(body: HTMLElement): void {
  const a = auth.account;
  if (a) {
    const games = a.wins + a.losses + a.draws;
    const rate = games ? Math.round((a.wins / games) * 100) : 0;
    body.innerHTML = `
      <div class="home-profile" style="--faction:${FACTIONS[a.faction]?.color ?? 'var(--ally)'}">
        ${avatarHtml(a.picture, a.name)}
        <div class="home-profile-text"><b>${escapeHtml(a.name)}</b><small>Đăng nhập bằng Google</small></div>
        <button class="btn btn-small" data-act="logout">Đăng xuất</button>
      </div>
      <div class="stat-grid">
        <div><b>${a.rating}</b><small>Điểm xếp hạng</small></div>
        <div><b>${a.wins}</b><small>Thắng</small></div>
        <div><b>${a.losses}</b><small>Thua</small></div>
        <div><b>${rate}%</b><small>Tỉ lệ thắng</small></div>
        <div><b>${auth.xu ?? '–'}</b><small>Xu 🪙</small></div>
        <div><b>${FACTIONS[a.faction]?.icon ?? ''}</b><small>${FACTIONS[a.faction]?.name ?? ''}</small></div>
      </div>
      <label class="field"><span>Tên hiển thị</span>
        <div class="join-row"><input id="acc-name" maxlength="16" value="${escapeHtml(a.name)}" /><button class="btn" data-act="save-name">Lưu</button></div>
      </label>
      <h2 class="section-title">Trận gần đây</h2>
      ${
        a.history.length
          ? `<ul class="history">${a.history
              .map(
                (h) => `<li class="${h.result}"><span>${h.result === 'win' ? '🏆 Thắng' : h.result === 'lose' ? '💀 Thua' : '🤝 Hoà'}</span>
                  <span>${FACTIONS[h.faction]?.icon ?? ''} vs ${FACTIONS[h.vsFaction]?.icon ?? ''} <b>${escapeHtml(h.vs)}</b></span>
                  <small>${h.rating > 0 ? '+' : ''}${h.rating} · ${new Date(h.at).toLocaleDateString('vi-VN')}</small></li>`,
              )
              .join('')}</ul>`
          : '<p class="muted">Chưa có trận online nào. Vào mục Online để đấu!</p>'
      }`;
    body.querySelector('[data-act="logout"]')!.addEventListener('click', () => {
      sound.click();
      void logout().then(() => {
        toast('Đã đăng xuất', 1500);
        guestChosen = false;
        showLogin();
      });
    });
    body.querySelector('[data-act="save-name"]')!.addEventListener('click', () => {
      const name = cleanName(body.querySelector<HTMLInputElement>('#acc-name')!.value);
      void updateProfile({ name })
        .then(() => toast('Đã lưu tên', 1200))
        .catch(() => toast('Không lưu được, thử lại sau', 2000));
    });
    void refreshMe();
    return;
  }
  const reason = !auth.reachable
    ? 'Không kết nối được máy chủ online, nên chưa đăng nhập được. Bạn vẫn chơi offline bình thường.'
    : !auth.clientId
      ? 'Máy chủ chưa bật đăng nhập Google (chưa đặt GOOGLE_CLIENT_ID). Bạn vẫn chơi được bằng tài khoản khách.'
      : '';
  body.innerHTML = `
    <div class="login-box">
      <h3>Đăng nhập để lưu thành tích</h3>
      <ul class="news">
        <li>🏆 Điểm xếp hạng và lịch sử trận online</li>
        <li>🪙 Xu bắt kèo đi theo tài khoản, đổi máy vẫn còn</li>
        <li>🏳️ Nhớ tộc ưa thích và tên hiển thị</li>
      </ul>
      <div id="google-btn" class="google-btn"></div>
      ${reason ? `<p class="muted">${reason}</p>` : '<p class="muted">Game chỉ lưu tên và ảnh đại diện Google, không lưu email.</p>'}
    </div>
    <label class="field"><span>Tên khi chơi khách</span>
      <input id="guest-name" maxlength="16" value="${escapeHtml(playerName)}" />
    </label>`;
  const nameInput = body.querySelector<HTMLInputElement>('#guest-name')!;
  nameInput.addEventListener('change', () => {
    playerName = cleanName(nameInput.value);
    nameInput.value = playerName;
    save('name', playerName);
    renderHubUser();
  });
  if (auth.clientId) void renderGoogleButton(body.querySelector<HTMLElement>('#google-btn')!, (msg) => toast(msg, 3000));
}

/** Thẻ đối đầu: tộc hai bên và ai khắc ai. */
function matchupHtml(mine: FactionId, theirs: FactionId): string {
  const a = FACTIONS[mine];
  const b = FACTIONS[theirs];
  const note = a.counters.includes(theirs)
    ? `<span class="good">Tộc bạn <b>khắc</b> ${b.name}: +20% sát thương</span>`
    : b.counters.includes(mine)
      ? `<span class="bad">${b.name} <b>khắc</b> tộc bạn: địch +20% sát thương</span>`
      : '<span>Không bên nào khắc bên nào</span>';
  return `<div class="matchup">
    <div style="--faction:${a.color}"><span>${a.icon}</span><b>${a.name}</b><small>Bạn</small></div>
    <i>VS</i>
    <div style="--faction:${b.color}"><span>${b.icon}</span><b>${b.name}</b><small>Địch</small></div>
    <p>${note}</p>
  </div>`;
}

/** Bảng chọn tộc: mỗi tộc kèm nội tại, khắc / bị khắc và hình vài quân tiêu biểu. */
function showFactionPicker(onPick?: () => void): void {
  sound.click();
  const preview = ['sword', 'cavalry', 'catapult', 'giant'] as const;
  overlay(
    `<h2>Chọn tộc</h2>
     <p class="muted">Mỗi tộc có 12 loại quân riêng, nội tại riêng. Tộc khắc được tộc khác thì gây thêm 20% sát thương.</p>
     <div class="faction-grid">
      ${FACTION_ORDER.map((id) => {
        const f = FACTIONS[id];
        const by = counteredBy(id);
        return `<button class="faction-card ${id === myFaction ? 'active' : ''}" data-faction="${id}" style="--faction:${f.color}">
          <div class="faction-head"><span class="faction-icon">${f.icon}</span><b>${f.name}</b></div>
          <div class="faction-preview">${preview.map((a) => `<canvas data-fprev="${kindOf(id, a)}"></canvas>`).join('')}</div>
          <p>${f.desc}</p>
          <p class="faction-passive">✨ ${f.passive}</p>
          <p class="faction-vs"><span class="good">Khắc: ${f.counters.map((x) => FACTIONS[x].icon + ' ' + FACTIONS[x].name).join(', ')}</span>
            <span class="bad">Sợ: ${by.map((x) => FACTIONS[x].icon + ' ' + FACTIONS[x].name).join(', ')}</span></p>
        </button>`;
      }).join('')}
     </div>`,
    [{ label: 'Đóng', onClick: closeOverlay }],
  );
  document.querySelector('.overlay')?.classList.add('wide-overlay');
  document.querySelectorAll<HTMLCanvasElement>('[data-fprev]').forEach((c) => drawIcon(c, c.dataset.fprev!));
  document.querySelectorAll<HTMLButtonElement>('[data-faction]').forEach((b) =>
    b.addEventListener('click', () => {
      myFaction = b.dataset.faction as FactionId;
      save('faction', myFaction);
      online.client?.send({ t: 'faction', id: myFaction });
      if (auth.account) void updateProfile({ faction: myFaction }).catch(() => {});
      sound.click();
      toast(`${FACTIONS[myFaction].icon} Đã chọn ${FACTIONS[myFaction].name}`, 1500);
      closeOverlay();
      if (onPick) onPick();
      else if (!session || session.mode.type === 'menu') showMenu();
    }),
  );
}

function showHowTo(): void {
  overlay(
    `<h2>Cách chơi</h2>
    <ul class="howto">
      <li><b>Thợ mỏ</b> đào vàng ở mỏ gần tượng. Càng nhiều thợ mỏ, càng nhiều vàng.</li>
      <li>Dùng vàng để <b>xây quân</b> ở thanh dưới cùng (phím <kbd>1</kbd>–<kbd>9</kbd>, <kbd>0</kbd>, <kbd>-</kbd>, <kbd>=</kbd>). Giữ chuột lên nút để xem quân đó <b>khắc</b> ai.</li>
      <li><b>Khắc chế</b>: giáo đâm kỵ binh ×2, tên xuyên khổng lồ ×1.5, phép đốt giáp nặng, kiếm chém quân nhẹ. Đừng chỉ xây một loại.</li>
      <li><b>Kỵ binh</b> phi càng xa đâm càng đau. <b>Ninja</b> lướt qua tiền tuyến ám sát hàng sau. <b>Thầy thuốc</b> hồi máu. <b>Máy bắn đá</b> phá tượng ×3 nhưng sợ bị áp sát.</li>
      <li>Quân hạ đủ địch thì lên <b>★ kỳ cựu</b> (tối đa ★★★, mỗi sao +15% máu và sát thương). Rút về kịp để giữ quân xịn!</li>
      <li>🏳️ <b>Tộc</b>: chọn 1 trong 8 tộc ở menu. Mỗi tộc có 12 loại quân, hình dáng và nội tại riêng. Tộc khắc được tộc địch thì gây thêm 20% sát thương.</li>
      <li>🧱 <b>Đội hình</b> (<kbd>F</kbd>): <b>Tự do</b> mỗi quân tự lao lên. <b>Hàng lối</b> cả đội đi cùng tốc độ quân chậm nhất, khiên trước, bắn xa sau. <b>Tản rộng</b> giãn cách để đỡ bị phép nổ.</li>
      <li>🔨 <b>Thợ xây</b> (<kbd>=</kbd>) ra trước nhà dựng tháp canh, tối đa 3 tháp. 🥁 <b>Cờ hiệu / Tay trống</b> (<kbd>8</kbd>) làm quân quanh đó đánh mạnh và nhanh hơn.</li>
      <li>💰 <b>Mỏ giữa</b> (<kbd>R</kbd>): một nửa thợ mỏ sang mỏ giàu giữa bản đồ. Thợ mỏ chết sẽ <b>rơi túi vàng</b>, quân phe nào chạm trước thì nhặt được.</li>
      <li>Ra lệnh cho cả đội:
        <br/>🏰 <b>Rút về</b>: quân vào trong tượng để hồi máu (<kbd>Q</kbd>)
        <br/>🛡️ <b>Phòng thủ</b>: giữ hàng trước mỏ vàng (<kbd>W</kbd>)
        <br/>⚔️ <b>Tấn công</b>: tiến lên phá tượng địch (<kbd>E</kbd>)</li>
      <li>Tượng tự bắn tên vào địch đến gần, nên phòng thủ gần nhà sẽ có lợi.</li>
      <li>Kéo màn hình, lăn chuột, phím <kbd>A</kbd>/<kbd>D</kbd> hoặc chạm bản đồ nhỏ để di chuyển góc nhìn.</li>
      <li>Phá được <b>tượng địch</b> là thắng. Mất tượng của mình là thua.</li>
      <li><b>Online</b>: tìm trận nhanh, hoặc tạo phòng rồi gửi mã / đường link cho bạn bè.</li>
      <li><b>Bắt kèo</b>: khi xem trận, cược xu ảo 🪙 vào bên bạn nghĩ sẽ thắng (trong 60 giây đầu trận). Bên thắng chia nhau tiền của bên thua theo tỉ lệ cược.</li>
      <li><b>Đấu trường</b>: xem các phòng đang mở. Còn ghế thì bấm ▶ Chơi, đang có 2 người đấu thì bấm 👁 Xem để theo dõi trực tiếp.</li>
    </ul>`,
    [{ label: 'Đã hiểu', primary: true, onClick: closeOverlay }],
  );
}

// ---------- Màn chơi chung ----------

function mountGame(mode: Exclude<Mode, { type: 'menu' }>, match: Match, title: string, subtitle: string): Session {
  closeOverlay();
  const isOnline = isNet(mode);
  const watching = mode.type === 'watch';
  const kinds = [...match.unlocked].sort((a, b) => archIndex(a) - archIndex(b));
  const faction = match.view.teams[0].faction;
  const controls = watching
    ? `<footer class="controls watch-bar">
        <span class="watch-label">👁 Đang xem · <b class="ally-name">${escapeHtml(mode.players[0])}</b> vs <b class="enemy-name">${escapeHtml(mode.players[1])}</b></span>
        <div class="bet" id="bet"></div>
        <button class="btn" data-act="leave-watch">Rời phòng</button>
      </footer>`
    : `<footer class="controls">
        <div class="units">
          ${kinds
            .map(
              (k) => `<button class="unit-btn" data-kind="${k}" title="${UNITS[k].name}: ${UNITS[k].desc}&#10;${UNITS[k].counter}">
                <canvas class="unit-icon" data-icon="${k}"></canvas>
                <span class="unit-cost">${UNITS[k].cost}</span>
                <span class="unit-key">${TRAIN_KEYS[archIndex(k)]}</span>
                <span class="unit-badge"></span>
                <span class="unit-progress"></span>
              </button>`,
            )
            .join('')}
        </div>
        <div class="stances">
          ${STANCES.map(
            (st) => `<button class="stance-btn" data-stance="${st.id}" title="${st.label} (${st.key})">
              <span>${st.icon}</span><small>${st.label}</small></button>`,
          ).join('')}
          <button class="stance-btn formation-btn" data-act="formation" title="Đội hình (F)">
            <span id="formation-icon">${FORMATION_INFO.free.icon}</span><small id="formation-label">${FORMATION_INFO.free.label}</small></button>
          <button class="stance-btn center-btn" data-act="center" title="Mỏ giữa (R): một nửa thợ mỏ sang đào mỏ vàng giữa bản đồ. Giàu gấp 4 nhưng phải đi qua chiến trường, chết thì rơi vàng cho địch nhặt">
            <span>💰</span><small>Mỏ giữa</small></button>
        </div>
      </footer>`;
  // Người xem thấy vàng cả hai bên thay cho quân số
  const stats = watching
    ? `<div class="stat ally-stat"><span>💰</span><b id="gold">0</b></div>
       <div class="stat enemy-stat"><span>💰</span><b id="gold-enemy">0</b></div>`
    : `<div class="stat"><span>💰</span><b id="gold">0</b></div>
       <div class="stat"><span>👥</span><b id="pop">0</b><small>/${POP_CAP}</small></div>`;
  app.innerHTML = `
    <main class="game">
      <header class="topbar">
        <button class="icon-btn" data-act="pause" title="${isOnline ? 'Menu' : 'Tạm dừng (Space)'}">${isOnline ? '☰' : '⏸'}</button>
        <div class="level-name"><b>${escapeHtml(title)}</b><span>${escapeHtml(subtitle)}</span></div>
        <div class="faction-tag" id="faction-tag" title="Tộc hai bên"></div>
        ${stats}
        <div class="statues">
          <div class="statue-bar ally"><i id="hp-ally"></i></div>
          <div class="statue-bar enemy"><i id="hp-enemy"></i></div>
        </div>
        ${isOnline ? '<div class="ping" id="ping">–</div>' : '<button class="icon-btn" data-act="speed" id="speed" title="Tốc độ">×1</button>'}
      </header>
      <canvas id="minimap" class="minimap"></canvas>
      <section class="stage"><canvas id="view"></canvas><div class="countdown" id="countdown"></div></section>
      ${controls}
    </main>`;

  const canvas = app.querySelector<HTMLCanvasElement>('#view')!;
  const renderer = new Renderer(canvas);
  renderer.centerOn(watching ? WORLD_WIDTH / 2 : statueX(0) + 450);
  const s: Session = { mode, match, renderer, running: false, speed: 1, endShown: false, endT: 0, tips: [] };
  session = s;

  app.querySelectorAll<HTMLCanvasElement>('[data-icon]').forEach((c) => drawIcon(c, c.dataset.icon as UnitKind));
  app.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach((b) =>
    b.addEventListener('click', () => trainUnit(b.dataset.kind as UnitKind)),
  );
  app.querySelectorAll<HTMLButtonElement>('[data-stance]').forEach((b) =>
    b.addEventListener('click', () => setStance(b.dataset.stance as Stance)),
  );
  app.querySelector('[data-act="center"]')?.addEventListener('click', toggleCenterMine);
  app.querySelector('[data-act="formation"]')?.addEventListener('click', cycleFormation);
  app.querySelector<HTMLElement>('.game')!.style.setProperty('--faction', FACTIONS[faction].color);
  app.querySelector('[data-act="pause"]')!.addEventListener('click', openGameMenu);
  app.querySelector('[data-act="leave-watch"]')?.addEventListener('click', () => {
    sound.click();
    showMenu();
  });
  app.querySelector('[data-act="speed"]')?.addEventListener('click', () => {
    s.speed = s.speed === 1 ? 2 : 1;
    document.getElementById('speed')!.textContent = `×${s.speed}`;
  });
  bindCamera(canvas, app.querySelector<HTMLCanvasElement>('#minimap')!);
  return s;
}

function startCampaign(index: number, diff: Difficulty = campDiff): void {
  online.leave();
  if (diff !== campDiff) selectCampDiff(diff);
  const lv = campaignLevel(index, diff);
  const label = CAMPAIGN[diff].label;
  const enemyFaction = lv.enemyFaction ?? 'tribe';
  const world = new World([{ ...lv.player, faction: myFaction }, { ...lv.enemy, faction: enemyFaction }]);
  const s = mountGame(
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
  const units = (lv.newUnits ?? []).map((a) => kindOf(myFaction, a));
  overlay(
    `<p class="eyebrow">Màn ${index + 1}/${LEVELS.length} · ${label}</p>
     <h2>${lv.name}</h2>
     <p>${lv.intro}</p>
     ${matchupHtml(myFaction, enemyFaction)}
     ${units
       .map(
         (unit) => `<div class="new-unit"><canvas data-intro-icon="${unit}"></canvas>
            <div><small>Quân mới</small><b>${UNITS[unit].name}</b><span>${UNITS[unit].desc} · ${UNITS[unit].cost} vàng</span>
            <span class="counter">${UNITS[unit].counter}</span></div></div>`,
       )
       .join('')}`,
    [
      { label: '⚔️ Vào trận', primary: true, onClick: () => beginLocal(s) },
      { label: 'Về menu', onClick: showMenu },
    ],
  );
  document
    .querySelectorAll<HTMLCanvasElement>('[data-intro-icon]')
    .forEach((c) => drawIcon(c, c.dataset.introIcon as UnitKind));
}

function startSkirmish(diff: Difficulty): void {
  online.leave();
  const cfg = SKIRMISH[diff];
  const enemyFaction = randomEnemyFaction();
  const world = new World([
    { ...cfg.player, faction: myFaction },
    { ...cfg.enemy, faction: enemyFaction },
  ]);
  const s = mountGame({ type: 'skirmish', diff }, localMatch(world, [new EnemyAI(cfg.ai)]), 'Đấu với máy', `Độ khó: ${cfg.label}`);
  overlay(
    `<p class="eyebrow">Đấu với máy · ${cfg.label}</p>
     <h2>Trận đấu tự do</h2>
     <p>Hai bên cùng xuất phát với đủ ${ARCH_ORDER.length} loại quân của tộc mình. Phá tượng máy để thắng!</p>
     ${matchupHtml(myFaction, enemyFaction)}`,
    [
      { label: '⚔️ Vào trận', primary: true, onClick: () => beginLocal(s) },
      { label: 'Về menu', onClick: showMenu },
    ],
  );
}

function beginLocal(s: Session): void {
  closeOverlay();
  sound.horn();
  s.running = true;
}

function trainUnit(kind: UnitKind): void {
  const s = session;
  if (!s || s.mode.type === 'menu' || s.mode.type === 'watch' || !s.running) return;
  if (s.match.train(kind)) sound.click();
  else toast(s.match.whyNot(kind), 1200);
}

function cycleFormation(): void {
  const s = session;
  if (!s || s.mode.type === 'menu' || s.mode.type === 'watch' || !s.running) return;
  const cur = s.match.view.teams[0].formation;
  const next = FORMATION_CYCLE[(FORMATION_CYCLE.indexOf(cur) + 1) % FORMATION_CYCLE.length];
  s.match.setFormation(next);
  sound.click();
  toast(`${FORMATION_INFO[next].icon} ${FORMATION_INFO[next].label}: ${FORMATION_INFO[next].tip}`, 2200);
}

function toggleCenterMine(): void {
  const s = session;
  if (!s || s.mode.type === 'menu' || s.mode.type === 'watch' || !s.running) return;
  const on = !s.match.view.teams[0].centerMine;
  s.match.setCenterMine(on);
  sound.click();
  toast(on ? '💰 Một nửa thợ mỏ sang đào mỏ giữa' : '⛏️ Thợ mỏ về đào mỏ nhà', 1400);
}

function setStance(stance: Stance): void {
  const s = session;
  if (!s || s.mode.type === 'menu' || s.mode.type === 'watch' || !s.running) return;
  s.match.setStance(stance);
  sound.click();
  if (stance === 'attack') sound.horn();
}

// ---------- HUD ----------

function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el && el.textContent !== text) el.textContent = text;
}

function updateHud(s: Session): void {
  const v = s.match.view;
  const t = v.teams[0];
  setText('gold', String(Math.max(0, Math.floor(t.gold))));
  setText('pop', String(s.match.pop()));
  if (s.mode.type === 'watch') setText('gold-enemy', String(Math.max(0, Math.floor(v.teams[1].gold))));
  const ally = document.getElementById('hp-ally');
  const enemy = document.getElementById('hp-enemy');
  if (ally) ally.style.transform = `scaleX(${t.statueHp / t.statueMax})`;
  if (enemy) enemy.style.transform = `scaleX(${v.teams[1].statueHp / v.teams[1].statueMax})`;
  if (s.mode.type === 'watch' && online.pool?.open && !online.pool.mine) {
    setText('bet-close', `· khoá sau ${Math.max(0, Math.ceil(online.pool.closesAt - v.time))}s`);
  }
  if (isNet(s.mode)) setText('ping', `${online.client?.ping ?? 0} ms${online.watchers ? ` · 👁 ${online.watchers}` : ''}`);

  document.querySelectorAll<HTMLButtonElement>('[data-kind]').forEach((b) => {
    const kind = b.dataset.kind as UnitKind;
    b.classList.toggle('disabled', !s.match.canTrain(kind));
    const queued = t.queue.filter((q) => q.kind === kind).length;
    const badge = b.querySelector<HTMLElement>('.unit-badge')!;
    const label = queued ? String(queued) : '';
    if (badge.textContent !== label) badge.textContent = label;
    const head = t.queue[0];
    const prog = head && head.kind === kind ? head.t / UNITS[kind].trainTime : 0;
    b.querySelector<HTMLElement>('.unit-progress')!.style.transform = `scaleX(${prog})`;
  });
  document.querySelectorAll<HTMLButtonElement>('[data-stance]').forEach((b) => {
    b.classList.toggle('active', b.dataset.stance === t.stance);
  });
  document.querySelector('[data-act="center"]')?.classList.toggle('active', t.centerMine);
  const fm = FORMATION_INFO[t.formation] ?? FORMATION_INFO.free;
  setText('formation-icon', fm.icon);
  setText('formation-label', fm.label);
  document.querySelector('[data-act="formation"]')?.classList.toggle('active', t.formation !== 'free');
  const a = FACTIONS[t.faction];
  const b = FACTIONS[v.teams[1].faction];
  setText('faction-tag', `${a.icon} vs ${b.icon}`);
}

function drawIcon(canvas: HTMLCanvasElement, kind: UnitKind): void {
  const size = 48;
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = size * dpr;
  canvas.height = size * dpr;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const a = UNITS[kind].arch;
  const k = (a === 'giant' ? 0.62 : a === 'cavalry' ? 0.6 : a === 'catapult' ? 0.72 : a === 'tower' ? 0.5 : 0.78) / Math.max(0.85, UNITS[kind].scale > 1.5 ? 1 : UNITS[kind].scale);
  ctx.translate(size / 2 - (a === 'cavalry' ? 0 : 2), size - 3);
  ctx.scale(k, k);
  drawStickman(ctx, {
    kind,
    walk: 0,
    moving: false,
    attack: a === 'archer' ? 0.9 : -1,
    mining: -1,
    carrying: false,
    ink: '#f1f4fa',
    accent: TEAM_COLORS[0].accent,
    flash: false,
    icon: true,
  });
}

// ---------- Camera ----------

const keys = new Set<string>();

function bindCamera(view: HTMLCanvasElement, mini: HTMLCanvasElement): void {
  let drag: { x: number; cam: number } | null = null;
  view.addEventListener('pointerdown', (e) => {
    if (!session) return;
    drag = { x: e.clientX, cam: session.renderer.camX };
    view.setPointerCapture(e.pointerId);
  });
  view.addEventListener('pointermove', (e) => {
    if (!drag || !session) return;
    session.renderer.setCamera(drag.cam - (e.clientX - drag.x) / session.renderer.scale);
  });
  view.addEventListener('pointerup', () => (drag = null));
  view.addEventListener('pointercancel', () => (drag = null));
  view.addEventListener(
    'wheel',
    (e) => {
      if (!session) return;
      e.preventDefault();
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      session.renderer.setCamera(session.renderer.camX + d / session.renderer.scale);
    },
    { passive: false },
  );

  const jump = (e: PointerEvent) => {
    if (!session) return;
    const r = mini.getBoundingClientRect();
    session.renderer.centerOn(((e.clientX - r.left) / r.width) * WORLD_WIDTH);
  };
  let miniDrag = false;
  mini.addEventListener('pointerdown', (e) => {
    miniDrag = true;
    mini.setPointerCapture(e.pointerId);
    jump(e);
  });
  mini.addEventListener('pointermove', (e) => miniDrag && jump(e));
  mini.addEventListener('pointerup', () => (miniDrag = false));
}

function panByKeys(s: Session, dt: number): void {
  let d = 0;
  if (keys.has('a') || keys.has('arrowleft')) d -= 1;
  if (keys.has('d') || keys.has('arrowright')) d += 1;
  if (d) s.renderer.setCamera(s.renderer.camX + (d * 900 * dt) / Math.max(0.6, s.renderer.scale));
}

// ---------- Kết thúc trận cục bộ ----------

function starsFor(v: WorldView): number {
  const t = v.teams[0];
  const ratio = t.statueHp / t.statueMax;
  return ratio >= 0.7 ? 3 : ratio >= 0.35 ? 2 : 1;
}

function formatTime(sec: number): string {
  return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
}

function statsHtml(v: WorldView): string {
  return `<div class="stats">
      <div><b>${formatTime(v.time)}</b><small>Thời gian</small></div>
      <div><b>${v.teams[0].kills}</b><small>Hạ gục</small></div>
      <div><b>${Math.round((v.teams[0].statueHp / v.teams[0].statueMax) * 100)}%</b><small>Máu tượng</small></div>
    </div>`;
}

function onLocalWin(s: Session): void {
  sound.win();
  const v = s.match.view;
  if (s.mode.type === 'skirmish') {
    const diff = s.mode.diff;
    overlay(`<div class="big-emoji">🏆</div><h2>Thắng máy (${SKIRMISH[diff].label})!</h2>${statsHtml(v)}`, [
      { label: 'Đấu lại', primary: true, onClick: () => startSkirmish(diff) },
      { label: 'Về menu', onClick: showMenu },
    ]);
    return;
  }
  if (s.mode.type !== 'campaign') return;
  const { level: i, diff } = s.mode;
  const stars = starsFor(v);
  const prog = loadProgress(diff);
  const wasDone = !!prog.completed;
  const nextStars = [...prog.stars];
  nextStars[i] = Math.max(nextStars[i] ?? 0, stars);
  const saved: Progress = { ...prog, unlocked: Math.max(prog.unlocked, Math.min(i + 1, LEVELS.length - 1)), stars: nextStars };
  if (i === LEVELS.length - 1) saved.completed = true;
  saveProgress(diff, saved);
  if (diff === campDiff) progress = saved;

  if (i === LEVELS.length - 1) {
    const harder = DIFFS[DIFFS.indexOf(diff) + 1];
    const label = CAMPAIGN[diff].label;
    const buttons: OverlayButton[] = harder
      ? [
          { label: `▶ Chơi mức ${CAMPAIGN[harder].label}`, primary: true, onClick: () => startCampaign(0, harder) },
          { label: 'Về menu', onClick: showMenu },
        ]
      : [{ label: 'Về menu', primary: true, onClick: showMenu }];
    buttons.push({ label: 'Chơi lại màn này', onClick: () => startCampaign(i, diff) });
    overlay(
      `<div class="big-emoji">👑</div><h2>${harder ? `Chinh phục mức ${label}!` : 'Bạn là Vua Người Que!'}</h2>
       <p>Đã thắng cả ${LEVELS.length} màn chiến dịch mức ${label}.</p>
       ${harder && !wasDone ? `<p class="unlock">🔓 Đã mở khoá mức <b>${CAMPAIGN[harder].label}</b>: máy giàu hơn, đông hơn, đánh sớm hơn.</p>` : ''}
       ${statsHtml(v)}`,
      buttons,
    );
    return;
  }
  overlay(
    `<div class="stars">${'★'.repeat(stars)}<i>${'★'.repeat(3 - stars)}</i></div>
     <h2>Chiến thắng!</h2><p>Tượng địch đã sụp đổ.</p>${statsHtml(v)}`,
    [
      { label: `Màn ${i + 2} ▶`, primary: true, onClick: () => startCampaign(i + 1, diff) },
      { label: 'Chơi lại', onClick: () => startCampaign(i, diff) },
      { label: 'Về menu', onClick: showMenu },
    ],
  );
}

function restartLocal(s: Session): void {
  if (s.mode.type === 'campaign') startCampaign(s.mode.level, s.mode.diff);
  else if (s.mode.type === 'skirmish') startSkirmish(s.mode.diff);
}

function onLocalLose(s: Session): void {
  sound.lose();
  overlay(
    `<div class="big-emoji">💀</div><h2>Thất bại</h2>
     <p>Tượng của bạn đã bị phá. Thử nuôi thêm thợ mỏ và phòng thủ gần tượng để có lợi thế.</p>`,
    [
      { label: 'Chơi lại', primary: true, onClick: () => restartLocal(s) },
      { label: 'Về menu', onClick: showMenu },
    ],
  );
}

// ---------- Tạm dừng / menu trong trận ----------

function openGameMenu(): void {
  const s = session;
  if (!s || s.mode.type === 'menu' || s.endShown) return;
  if (s.mode.type === 'watch') {
    overlay(`<h2>Đang xem trận</h2><p>${escapeHtml(s.mode.players[0])} vs ${escapeHtml(s.mode.players[1])}</p>`, [
      { label: 'Tiếp tục xem', primary: true, onClick: closeOverlay },
      {
        label: sound.muted ? '🔇 Bật âm thanh' : '🔊 Tắt âm thanh',
        onClick: () => {
          sound.toggle();
          openGameMenu();
        },
      },
      { label: 'Rời phòng', onClick: showMenu },
    ]);
    return;
  }
  if (s.mode.type === 'online') {
    // Online không dừng được trận, chỉ mở bảng lựa chọn
    overlay(`<h2>Trận online</h2><p>Trận vẫn đang tiếp diễn!</p>`, [
      { label: 'Quay lại trận', primary: true, onClick: closeOverlay },
      {
        label: sound.muted ? '🔇 Bật âm thanh' : '🔊 Tắt âm thanh',
        onClick: () => {
          sound.toggle();
          openGameMenu();
        },
      },
      {
        label: '🏳️ Đầu hàng',
        onClick: () => {
          online.client?.send({ t: 'surrender' });
          closeOverlay();
        },
      },
    ]);
    return;
  }
  if (!s.running) return;
  s.running = false;
  showPause();
}

function showPause(): void {
  const s = session;
  if (!s || s.mode.type === 'menu') return;
  overlay(`<div class="big-emoji">⏸</div><h2>Tạm dừng</h2>`, [
    { label: 'Tiếp tục', primary: true, onClick: resume },
    { label: 'Chơi lại', onClick: () => restartLocal(s) },
    {
      label: sound.muted ? '🔇 Bật âm thanh' : '🔊 Tắt âm thanh',
      onClick: () => {
        sound.toggle();
        showPause();
      },
    },
    {
      label: 'Cách chơi',
      onClick: () => {
        showHowTo();
        overlayOnClose = showPause;
      },
    },
    { label: 'Về menu', onClick: showMenu },
  ]);
}

function resume(): void {
  closeOverlay();
  const s = session;
  if (s && s.mode.type !== 'menu' && !isNet(s.mode) && !s.endShown) s.running = true;
}

// ---------- Online ----------

const online = {
  client: null as OnlineClient | null,
  lastOnline: 0,
  remote: null as RemoteWorld | null,
  ended: false,
  opponent: '',
  watchers: 0,
  lobby: null as LobbyRoom[] | null,
  xu: null as number | null,
  pool: null as BetPool | null,
  betAmount: 100, // -1 = tất tay
  roomClosed: false,
  /** Phòng chờ hiện tại (chỉ phòng tạo bằng "Tạo phòng"). */
  wait: null as WaitRoom | null,
  chat: [] as ChatLine[],
  minutes: 20,
  lastBet: null as Extract<ServerMsg, { t: 'betResult' }> | null,
  /** Phòng đang xem quay về chờ người chơi (một người vừa rời). */
  watchWait: null as { code: string; players: string[] } | null,

  async ensure(): Promise<OnlineClient | null> {
    if (this.client?.connected) return this.client;
    this.client?.close();
    this.client = null;
    const c = new OnlineClient();
    c.on(onServer);
    setStatus('Đang kết nối máy chủ…');
    try {
      await c.connect(playerName, walletId(), myFaction);
    } catch {
      c.close();
      setStatus('🔴 Không kết nối được máy chủ online');
      toast('Không kết nối được máy chủ online', 3000);
      return null;
    }
    this.client = c;
    return c;
  },

  leave(): void {
    // Rời phòng thì rời luôn thoại (máy chủ cũng tự gỡ)
    voice.teardown();
    document.getElementById('voice')?.remove();
    this.client?.send({ t: 'leave' });
    this.client?.send({ t: 'lobby', on: false });
    this.remote = null;
    this.watchers = 0;
    this.watchWait = null;
    this.wait = null;
    this.chat = [];
  },
};

// ---------- Thoại trong phòng: bật / tắt mic, âm lượng riêng từng người ----------

const voice = new Voice((m) => online.client?.send(m));
let voiceOpen = false;
/** Âm lượng trước khi tắt tiếng một người, để bấm lại thì trả về đúng mức cũ. */
const voiceRestore = new Map<string, number>();
voice.onChange = () => renderVoice();
voice.onTalk = () => updateTalking();
voice.onError = (msg) => toast(msg, 3500);

/** Nút thoại nổi: sống qua các màn phòng chờ / trong trận vì gắn vào body, không nằm trong #app. */
function ensureVoicePanel(): void {
  if (!document.getElementById('voice')) {
    const el = document.createElement('div');
    el.id = 'voice';
    el.className = 'voice';
    document.body.appendChild(el);
  }
  renderVoice();
}

function toggleMic(): void {
  if (!voice.joined) return;
  sound.click();
  void voice.setMic(!voice.micOn);
}

function renderVoice(): void {
  const el = document.getElementById('voice');
  if (!el) return;
  const n = voice.peers.length;
  el.classList.toggle('open', voiceOpen);
  const icon = voice.joined ? (voice.micOn ? '🎤' : '🔇') : '🎙';
  const toggle = `<button class="voice-toggle ${voice.joined ? 'joined' : ''}" data-act="voice-toggle"
    title="Thoại trong phòng${voice.joined ? ' · phím M bật/tắt mic' : ''}" aria-expanded="${voiceOpen}">${icon}${n ? `<span>${n}</span>` : ''}</button>`;
  let body = '';
  if (voiceOpen && !voice.joined) {
    body = `<div class="voice-body">
      <p>Nói chuyện với mọi người trong phòng.${n ? ` <b>${n}</b> người đang trong thoại.` : ''}</p>
      <button class="btn btn-primary" data-act="voice-join">🔊 Vào thoại</button>
      <p class="small">Vào thoại là nghe được mọi người; muốn nói thì bật mic sau.</p>
    </div>`;
  } else if (voiceOpen) {
    const rows = voice.peers
      .map((p) => {
        const me = p.id === voice.me;
        const vol = voice.volume(p.name);
        const state = me ? null : voice.stateOf(p.id);
        const flag = state === 'failed' ? ' <span title="Không kết nối được (mạng chặn kết nối trực tiếp)">⚠️</span>' : state === 'connecting' ? ' <small>…</small>' : '';
        const controls = me
          ? ''
          : `<div class="voice-vol">
              <button class="voice-mute" data-mute-peer="${escapeHtml(p.name)}" title="Tắt / bật tiếng người này">${vol ? '🔊' : '🔈'}</button>
              <input type="range" min="0" max="100" step="5" value="${vol}" data-vol="${escapeHtml(p.name)}" aria-label="Âm lượng của ${escapeHtml(p.name)}" />
              <output>${vol}%</output>
            </div>`;
        return `<div class="voice-peer ${voice.talking.has(p.id) ? 'talking' : ''}" data-vid="${p.id}">
            <div class="voice-name"><i class="voice-dot"></i><b>${escapeHtml(p.name)}</b>${me ? ' <small>(bạn)</small>' : ''}
              ${p.role === 'watcher' ? '<small>👁</small>' : ''}${p.muted ? ' <span title="Đang tắt mic">🔇</span>' : ''}${flag}</div>
            ${controls}
          </div>`;
      })
      .join('');
    body = `<div class="voice-body">
      <div class="voice-actions">
        <button class="btn ${voice.micOn ? 'btn-primary' : ''}" data-act="voice-mic">${voice.micOn ? '🎤 Mic đang bật' : '🔇 Mic đang tắt'}</button>
        <button class="btn btn-ghost" data-act="voice-leave">Rời thoại</button>
      </div>
      <div class="voice-list">${rows}</div>
      <p class="small">Kéo thanh để chỉnh âm lượng từng người (chỉ trên máy bạn) · <kbd>M</kbd> bật/tắt mic</p>
    </div>`;
  }
  el.innerHTML = toggle + body;
  el.querySelector('[data-act="voice-toggle"]')!.addEventListener('click', () => {
    voiceOpen = !voiceOpen;
    renderVoice();
  });
  el.querySelector('[data-act="voice-join"]')?.addEventListener('click', () => {
    sound.click();
    voice.join();
  });
  el.querySelector('[data-act="voice-mic"]')?.addEventListener('click', toggleMic);
  el.querySelector('[data-act="voice-leave"]')?.addEventListener('click', () => {
    sound.click();
    voice.leave();
  });
  el.querySelectorAll<HTMLInputElement>('[data-vol]').forEach((input) =>
    input.addEventListener('input', () => {
      const name = input.dataset.vol!;
      const vol = Number(input.value);
      voice.setVolume(name, vol);
      const row = input.closest('.voice-vol')!;
      row.querySelector('output')!.textContent = `${vol}%`;
      row.querySelector('.voice-mute')!.textContent = vol ? '🔊' : '🔈';
    }),
  );
  el.querySelectorAll<HTMLButtonElement>('[data-mute-peer]').forEach((b) =>
    b.addEventListener('click', () => {
      const name = b.dataset.mutePeer!;
      const vol = voice.volume(name);
      if (vol) voiceRestore.set(name, vol);
      voice.setVolume(name, vol ? 0 : (voiceRestore.get(name) ?? 100));
      renderVoice();
    }),
  );
}

/** Chỉ đổi đèn người đang nói, không vẽ lại cả bảng (tránh giật thanh kéo đang kéo dở). */
function updateTalking(): void {
  document.querySelectorAll<HTMLElement>('.voice-peer[data-vid]').forEach((el) => {
    el.classList.toggle('talking', voice.talking.has(el.dataset.vid!));
  });
  document.querySelector('.voice-toggle')?.classList.toggle('talking', voice.talking.size > 0);
}

async function goOnline(msg: Extract<ClientMsg, { t: 'quick' | 'create' | 'join' }>): Promise<void> {
  sound.click();
  const c = await online.ensure();
  if (!c) return;
  c.send({ t: 'hello', name: playerName, wallet: walletId(), faction: myFaction, session: auth.session || undefined });
  c.send(msg);
  if (msg.t !== 'join') showWaiting(msg.t === 'quick' ? 'Đang tìm đối thủ…' : 'Đang tạo phòng…', '');
}

// ---------- Phòng chờ: 2 ghế, người xem, kèo, chat; chủ phòng bấm bắt đầu ----------

function inviteLink(code: string): string {
  return `${location.origin}${location.pathname}?room=${code}`;
}

function copyInvite(code: string): void {
  if (!navigator.clipboard) return toast(`Gửi mã phòng ${code} cho bạn bè`);
  navigator.clipboard.writeText(inviteLink(code)).then(
    () => toast('Đã sao chép link mời'),
    () => toast(`Không sao chép được, gửi mã ${code}`),
  );
}

function showRoom(): void {
  const wait = online.wait;
  if (!wait) return showMenu();
  closeOverlay();
  app.innerHTML = `
    <canvas id="bg" class="bg-canvas"></canvas>
    <main class="menu">
      <div class="menu-card room-card">
        <header class="room-head">
          <div class="room-title"><small>Phòng chờ</small><b>${escapeHtml(wait.code)}</b></div>
          <button class="btn" data-act="invite">📋 Mời bạn</button>
        </header>
        <div class="room-rules" id="room-rules"></div>
        <div class="seats" id="room-seats"></div>
        <div class="room-watchers" id="room-watchers"></div>
        <div class="bet room-bet" id="bet"></div>
        <section class="chat">
          <div class="chat-log" id="chat-log" aria-live="polite"></div>
          <form class="chat-form" id="chat-form">
            <input id="chat-input" maxlength="${CHAT_MAX}" autocomplete="off" placeholder="Nhắn cho cả phòng…" />
            <button class="btn" type="submit">Gửi</button>
          </form>
        </section>
        <div class="room-actions" id="room-actions"></div>
      </div>
    </main>`;
  startDemo();
  ensureVoicePanel();
  app.querySelector('[data-act="invite"]')!.addEventListener('click', () => copyInvite(wait.code));
  const input = app.querySelector<HTMLInputElement>('#chat-input')!;
  app.querySelector('#chat-form')!.addEventListener('submit', (e) => {
    e.preventDefault();
    const text = input.value.trim();
    if (!text) return;
    online.client?.send({ t: 'chat', text });
    input.value = '';
  });
  renderRoom();
  renderChat();
}

function renderRoom(): void {
  const wait = online.wait;
  const seatsEl = document.getElementById('room-seats');
  if (!wait || !seatsEl) return;
  const { you, settings } = wait;
  const send = (m: ClientMsg) => {
    sound.click();
    online.client?.send(m);
  };

  // Luật phòng: chủ phòng chọn, người khác chỉ xem
  const rules = document.getElementById('room-rules')!;
  if (you.host) {
    const select = (id: string, values: number[], current: number, unit: string) =>
      `<select id="${id}">${values.map((v) => `<option value="${v}" ${v === current ? 'selected' : ''}>${v} ${unit}</option>`).join('')}</select>`;
    rules.innerHTML = `<label title="Số vàng mỗi người có khi bắt đầu trận">💰 Vàng ban đầu ${select('rule-gold', ROOM_GOLD, settings.gold, 'vàng')}</label>
      <label title="Hết giờ mà chưa phá được tượng thì bên còn nhiều máu tượng hơn thắng">⏱ Thời gian trận ${select('rule-minutes', ROOM_MINUTES, settings.minutes, 'phút')}</label>`;
    const onChange = () =>
      send({
        t: 'settings',
        gold: Number(rules.querySelector<HTMLSelectElement>('#rule-gold')!.value),
        minutes: Number(rules.querySelector<HTMLSelectElement>('#rule-minutes')!.value),
      });
    rules.querySelectorAll('select').forEach((el) => el.addEventListener('change', onChange));
  } else {
    rules.innerHTML = `<span>💰 Vàng ban đầu: <b>${settings.gold}</b></span><span>⏱ Thời gian trận: <b>${settings.minutes} phút</b></span>`;
  }

  const seatHtml = (t: Team) => {
    const seat = wait.seats[t];
    const side = t ? 'enemy' : 'ally';
    if (!seat) {
      const sit = you.role === 'watcher' ? '<button class="btn btn-primary" data-sit>Ngồi vào</button>' : '';
      return `<div class="seat ${side} empty"><span class="seat-name">Ghế trống</span><small>Chờ người chơi…</small>${sit}</div>`;
    }
    const status = seat.host ? '👑 Chủ phòng' : seat.ready ? '✅ Sẵn sàng' : '⏳ Chưa sẵn sàng';
    const mine = you.seat === t;
    const kick = you.host && !seat.host ? `<button class="seat-kick" data-kick="${t}" title="Mời ra khỏi phòng">✕</button>` : '';
    return `<div class="seat ${side} ${seat.ready ? 'ready' : ''} ${mine ? 'mine' : ''}">
        ${kick}<span class="seat-name">${FACTIONS[seat.faction]?.icon ?? ''} ${escapeHtml(seat.name)}${mine ? ' <small>(bạn)</small>' : ''}</span>
        <small>${FACTIONS[seat.faction]?.name ?? ''} · ${status}</small>
      </div>`;
  };
  seatsEl.innerHTML = `${seatHtml(0)}<div class="vs">VS</div>${seatHtml(1)}`;
  seatsEl.querySelector('[data-sit]')?.addEventListener('click', () => send({ t: 'seat', as: 'play' }));
  seatsEl.querySelectorAll<HTMLButtonElement>('[data-kick]').forEach((b) =>
    b.addEventListener('click', () => send({ t: 'kick', seat: Number(b.dataset.kick) as Team })),
  );

  const watchersEl = document.getElementById('room-watchers')!;
  watchersEl.innerHTML = wait.watchers.length
    ? `👁 ${wait.watchers.length} người xem: ${wait.watchers
        .map((n) => `<b>${escapeHtml(n)}${n === wait.host ? ' 👑' : ''}</b>`)
        .join(', ')}`
    : '👁 Chưa có người xem · gửi mã phòng để bạn bè vào xem và bắt kèo';

  // Nút hành động theo vai trò
  const full = wait.seats.every((x) => x);
  const allReady = full && wait.seats.every((x) => x!.ready);
  const actions = document.getElementById('room-actions')!;
  const buttons: string[] = [];
  if (you.host) {
    buttons.push(
      `<button class="btn btn-primary" data-act="begin" ${allReady ? '' : 'disabled'}>▶ Bắt đầu</button>`,
    );
  } else if (you.role === 'player') {
    const ready = wait.seats[you.seat!]?.ready;
    buttons.push(`<button class="btn btn-primary" data-act="ready">${ready ? 'Huỷ sẵn sàng' : '✅ Sẵn sàng'}</button>`);
  }
  if (you.role === 'player') buttons.push('<button class="btn" data-act="stand">👁 Ra xem</button>');
  buttons.push('<button class="btn btn-ghost" data-act="leave-room">Rời phòng</button>');
  const hint = you.host
    ? !full
      ? 'Chờ đủ 2 người chơi'
      : allReady
        ? 'Mọi người đã sẵn sàng, bấm Bắt đầu!'
        : 'Chờ người chơi bấm Sẵn sàng'
    : you.role === 'player'
      ? 'Bấm Sẵn sàng rồi chờ chủ phòng bắt đầu'
      : 'Chủ phòng bắt đầu thì bạn được xem trận ngay';
  actions.innerHTML = `<p class="small room-hint">${hint}</p><div class="room-buttons">${buttons.join('')}</div>`;
  actions.querySelector('[data-act="begin"]')?.addEventListener('click', () => send({ t: 'begin' }));
  actions.querySelector('[data-act="ready"]')?.addEventListener('click', () =>
    send({ t: 'ready', on: !wait.seats[you.seat!]?.ready }),
  );
  actions.querySelector('[data-act="stand"]')?.addEventListener('click', () => send({ t: 'seat', as: 'watch' }));
  actions.querySelector('[data-act="leave-room"]')!.addEventListener('click', () => {
    sound.click();
    showMenu();
  });
  renderBet();
}

function chatLineHtml(l: ChatLine): string {
  if (l.kind === 'system') return `<p class="chat-sys">${escapeHtml(l.text)}</p>`;
  return `<p><b class="chat-${l.kind}">${l.kind === 'watcher' ? '👁 ' : ''}${escapeHtml(l.from)}</b> ${escapeHtml(l.text)}</p>`;
}

function renderChat(): void {
  const log = document.getElementById('chat-log');
  if (!log) return;
  log.innerHTML = online.chat.map(chatLineHtml).join('');
  log.scrollTop = log.scrollHeight;
}

/** Thêm một dòng chat vào phòng chờ đang mở; trả về false nếu không ở phòng chờ. */
function appendChat(line: ChatLine): boolean {
  const log = document.getElementById('chat-log');
  if (!log) return false;
  const stick = log.scrollTop + log.clientHeight >= log.scrollHeight - 8;
  log.insertAdjacentHTML('beforeend', chatLineHtml(line));
  while (log.children.length > 60) log.firstElementChild?.remove();
  if (stick) log.scrollTop = log.scrollHeight;
  return true;
}

function showWaiting(title: string, code: string): void {
  const link = code ? `${location.origin}${location.pathname}?room=${code}` : '';
  const buttons: OverlayButton[] = [];
  if (code) {
    buttons.push({
      label: '📋 Sao chép link mời',
      primary: true,
      onClick: () => {
        if (!navigator.clipboard) return toast('Hãy gửi mã phòng cho bạn bè');
        navigator.clipboard.writeText(link).then(
          () => toast('Đã sao chép link'),
          () => toast('Không sao chép được, hãy gửi mã phòng'),
        );
      },
    });
  }
  buttons.push({
    label: 'Huỷ',
    onClick: () => {
      online.leave();
      closeOverlay();
    },
  });
  overlay(
    `<div class="spinner"></div>
     <h2>${title}</h2>
     ${
       code
         ? `<p>Gửi mã này cho bạn bè:</p>
            <div class="room-code">${escapeHtml(code)}</div>
            <p class="small">hoặc gửi đường link:<br/><span class="link">${escapeHtml(link)}</span></p>`
         : '<p>Sẽ vào trận ngay khi có người chơi khác.</p>'
     }`,
    buttons,
  );
}

function onServer(msg: ServerMsg): void {
  switch (msg.t) {
    case 'account':
      accountFromServer(msg.account);
      break;
    case 'welcome':
      online.lastOnline = msg.online;
      renderHubUser();
      setStatus(`🟢 ${msg.online} người đang trực tuyến`);
      break;
    case 'waitroom': {
      const { t: _, ...wait } = msg;
      online.wait = wait;
      // Đang trong trận (vừa đánh xong) thì để bảng kết quả hiện trước, bấm "Về phòng chờ" mới vào
      if (session && isNet(session.mode)) break;
      if (document.getElementById('room-seats')) renderRoom();
      else showRoom();
      break;
    }
    case 'chatLog':
      online.chat = msg.lines;
      renderChat();
      break;
    case 'chat':
      online.chat.push(msg.line);
      if (online.chat.length > 60) online.chat.shift();
      if (!appendChat(msg.line) && msg.line.kind !== 'system' && session?.mode.type === 'watch') {
        toast(`💬 ${msg.line.from}: ${msg.line.text}`, 2500);
      }
      break;
    case 'voicePeers':
      voice.updatePeers(msg.you, msg.peers);
      break;
    case 'signal':
      void voice.onSignal(msg.from, msg.data);
      break;
    case 'kicked':
      online.wait = null;
      showMenu();
      toast('Chủ phòng đã mời bạn ra khỏi phòng', 3500);
      break;
    case 'room':
      online.wait = null;
      if (msg.players.length >= 2) break;
      if (msg.watching) {
        online.watchWait = { code: msg.code, players: msg.players };
        // Đang hiện bảng kết quả trận vừa xem thì để người xem đọc xong đã
        if (!(session?.mode.type === 'watch' && session.endShown)) showWatchWaiting(msg.code, msg.players);
      } else showWaiting(msg.private ? 'Phòng của bạn' : 'Đang tìm đối thủ…', msg.private ? msg.code : '');
      break;
    case 'start':
      online.minutes = msg.minutes;
      startOnline(msg.opponent, msg.countdown, msg.factions);
      break;
    case 'spectate':
      online.minutes = msg.minutes;
      startWatching(msg.players, msg.countdown, msg.factions);
      break;
    case 'full':
      showRoomFull(msg.code, msg.players);
      break;
    case 'lobby':
      online.lobby = msg.rooms;
      online.lastOnline = msg.online;
      if (session?.mode.type === 'menu' && menuTab === 'arena') {
        renderArenaList();
        setStatus(`🟢 ${msg.online} người trực tuyến · ${msg.rooms.length} phòng${online.xu === null ? '' : ` · 🪙 ${online.xu} xu`}`);
      }
      break;
    case 'watchers':
      online.watchers = msg.n;
      break;
    case 'wallet':
      online.xu = msg.xu;
      renderBet();
      renderHubUser();
      break;
    case 'pool': {
      const { t: _, ...pool } = msg;
      online.pool = pool;
      renderBet();
      break;
    }
    case 'betResult':
      online.xu = msg.xu;
      online.lastBet = msg;
      toast(betResultText(msg), 4000);
      setText('bet-result', betResultText(msg));
      break;
    case 'closed':
      if (session?.mode.type === 'watch' && online.ended) {
        // Trận vừa xong thì giữ bảng kết quả (và kết quả kèo) cho người xem đọc
        online.roomClosed = true;
        document.querySelector('[data-stay]')?.remove();
        setText('watch-next', 'Hai người chơi đã rời phòng.');
        break;
      }
      toast('Phòng đã đóng', 3000);
      if (session?.mode.type === 'watch') showMenu();
      else if (document.querySelector('.overlay .spinner')) closeOverlay();
      break;
    case 'state':
      online.remote?.apply(msg.s);
      break;
    case 'end':
      if (session?.mode.type === 'watch') onWatchEnd(msg.result, msg.reason);
      else onOnlineEnd(msg.result, msg.reason);
      break;
    case 'rematch':
      setText('rematch-status', msg.votes === 1 ? 'Đang chờ người còn lại đồng ý…' : '');
      break;
    case 'left':
      if (session?.mode.type === 'online') {
        toast('Đối thủ đã rời phòng', 3000);
        const btn = document.querySelector<HTMLButtonElement>('[data-rematch]');
        if (btn) btn.disabled = true;
        setText('rematch-status', 'Đối thủ đã rời phòng');
      }
      break;
    case 'error':
      toast(msg.msg, 3000);
      renderBet(); // cược bị từ chối thì bật lại nút
      if (msg.msg.startsWith('Mất kết nối')) {
        voice.teardown();
        document.getElementById('voice')?.remove();
        online.client = null;
        if (session && isNet(session.mode) && !online.ended) {
          overlay(`<div class="big-emoji">📡</div><h2>Mất kết nối</h2><p>Không còn liên lạc được với máy chủ.</p>`, [
            { label: 'Về menu', primary: true, onClick: showMenu },
          ]);
        } else if (document.querySelector('.overlay .spinner')) closeOverlay();
      }
      break;
  }
}

function startOnline(opponent: string, countdown: number, factions: [FactionId, FactionId]): void {
  const client = online.client!;
  const remote = new RemoteWorld();
  online.remote = remote;
  online.ended = false;
  online.opponent = opponent;
  let countdownLeft = countdown;
  const match: Match = {
    view: remote,
    step: (dt) => {
      remote.advance(dt);
      return remote.drainEvents();
    },
    train: (k) => {
      if (!match.canTrain(k)) return false;
      client.send({ t: 'train', kind: k });
      return true;
    },
    setStance: (st) => client.send({ t: 'stance', stance: st }),
    setCenterMine: (on) => client.send({ t: 'centerMine', on }),
    setFormation: (mode) => client.send({ t: 'formation', mode }),
    canTrain: (k) => !!remote.snaps && countdownLeft < 0 && canTrainSnap(remote.snaps[0], k, online.ended),
    whyNot: (k) => {
      const t = remote.snaps?.[0];
      if (countdownLeft >= 0) return 'Chờ trận bắt đầu';
      if (!t) return 'Đang kết nối…';
      if (t.gold < UNITS[k].cost) return 'Không đủ vàng';
      if (t.queue.length >= MAX_QUEUE) return 'Hàng chờ đã đầy';
      return 'Đã đủ quân số';
    },
    pop: () => remote.snaps?.[0].pop ?? 0,
    unlocked: roster(factions[0]),
  };
  remote.teams[0].faction = factions[0];
  remote.teams[1].faction = factions[1];
  const s = mountGame({ type: 'online', opponent }, match, `vs ${opponent}`, 'Trận online 1v1');
  s.running = true;
  ensureVoicePanel();
  runCountdown(s, countdown, () => (countdownLeft = -1));
}

/** Đếm ngược theo máy chủ: 3, 2, 1, Chiến! */
function runCountdown(s: Session, from: number, onGo: () => void): void {
  let countdownLeft = from;
  const el = document.getElementById('countdown')!;
  const show = (text: string) => {
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  };
  const next = () => {
    if (session !== s) return;
    if (countdownLeft > 0) {
      show(String(countdownLeft));
      sound.click();
      countdownLeft--;
      setTimeout(next, 1000);
    } else {
      onGo();
      show('Chiến!');
      sound.horn();
      setTimeout(() => session === s && (el.textContent = ''), 900);
    }
  };
  next();
}

/** Vào xem trận của hai người khác: không có nút ra lệnh, nhìn từ phía người chơi đầu tiên (bên trái). */
function startWatching(players: [string, string], countdown: number, factions?: [FactionId, FactionId]): void {
  online.watchWait = null;
  online.pool = null;
  online.lastBet = null;
  online.roomClosed = false;
  const remote = new RemoteWorld();
  if (factions) [remote.teams[0].faction, remote.teams[1].faction] = factions;
  online.remote = remote;
  online.ended = false;
  const match: Match = {
    view: remote,
    step: (dt) => {
      remote.advance(dt);
      return remote.drainEvents();
    },
    train: () => false,
    setStance: () => {},
    setCenterMine: () => {},
    setFormation: () => {},
    canTrain: () => false,
    whyNot: () => 'Bạn đang xem trận',
    pop: () => remote.snaps?.[0].pop ?? 0,
    unlocked: [],
  };
  const s = mountGame({ type: 'watch', players }, match, `${players[0]} vs ${players[1]}`, '👁 Đang xem trận');
  s.running = true;
  ensureVoicePanel();
  if (countdown > 0) runCountdown(s, countdown, () => {});
}

function showWatchWaiting(code: string, players: string[]): void {
  overlay(
    `<div class="spinner"></div>
     <h2>Đang chờ người chơi</h2>
     <p>Phòng <b>${escapeHtml(code)}</b> của <b>${escapeHtml(players[0] ?? '')}</b> còn 1 ghế trống.</p>
     <p class="small">Bạn đang ở chế độ xem. Trận bắt đầu là sẽ xem được ngay.</p>`,
    [
      { label: '▶ Vào chơi', primary: true, onClick: () => online.client?.send({ t: 'join', code, as: 'play' }) },
      {
        label: 'Rời phòng',
        onClick: () => {
          if (session?.mode.type === 'watch') showMenu();
          else {
            online.leave();
            closeOverlay();
          }
        },
      },
    ],
  );
}

function showRoomFull(code: string, players: string[]): void {
  overlay(
    `<div class="big-emoji">⚔️</div>
     <h2>Phòng ${escapeHtml(code)} đang đấu</h2>
     <p><b>${players.map(escapeHtml).join('</b> vs <b>')}</b></p>
     <p class="small">Phòng đã đủ 2 người. Bạn có thể vào xem trực tiếp và 🎲 bắt kèo xem ai thắng.</p>`,
    [
      { label: '👁 Vào xem', primary: true, onClick: () => online.client?.send({ t: 'join', code, as: 'watch' }) },
      { label: 'Huỷ', onClick: closeOverlay },
    ],
  );
}

// ---------- Bắt kèo (người xem cược ai thắng bằng xu ảo) ----------

const BET_CHIPS = [50, 100, 250, 500];

function betResultText(r: Extract<ServerMsg, { t: 'betResult' }>): string {
  if (r.outcome === 'win') return `🎉 Thắng kèo! +${r.payout - r.amount} 🪙 · còn ${r.xu} xu`;
  if (r.outcome === 'lose') return `😢 Thua kèo −${r.amount} 🪙 · còn ${r.xu} xu`;
  return `↩️ Hoàn lại ${r.amount} 🪙 (hoà hoặc không ai cược bên kia)`;
}

function renderBet(): void {
  const el = document.getElementById('bet');
  const s = session;
  if (!el || !s) return;
  const pool = online.pool;
  const wait = online.wait;
  // Tên hai bên: lấy từ trận đang xem, hoặc từ hai ghế phòng chờ
  const players =
    s.mode.type === 'watch' ? s.mode.players : wait ? wait.seats.map((x) => x?.name ?? '…') : null;
  // Phòng chờ chưa đủ 2 người thì chưa có kèo để hiện
  if (!pool || !players || (s.mode.type === 'menu' && wait?.seats.includes(null))) {
    el.innerHTML = '';
    return;
  }
  const xu = online.xu ?? 0;
  const name = (t: Team) => `<b class="${t ? 'enemy-name' : 'ally-name'}">${escapeHtml(players[t])}</b>`;
  const summary = `<span class="bet-pool">Quỹ kèo: ${name(0)} ${pool.totals[0]} 🪙 (${pool.counts[0]}) · ${name(1)} ${pool.totals[1]} 🪙 (${pool.counts[1]})</span>`;
  if (pool.mine) {
    const odds = betOdds(pool.totals, pool.mine.side, 0);
    el.innerHTML = `<span class="bet-mine">🎲 Đã cược <b>${pool.mine.amount}</b> 🪙 vào ${name(pool.mine.side)} · ăn ×${odds.toFixed(2)}</span>${summary}`;
    return;
  }
  const watching = s.mode.type === 'watch' || wait?.you.role === 'watcher';
  if (!watching) {
    // Người chơi chỉ xem quỹ kèo, không được cược
    el.innerHTML = `<span class="bet-mine">🎲 Người xem đang bắt kèo</span>${summary}`;
    return;
  }
  if (!pool.open) {
    el.innerHTML = `<span class="bet-mine">🔒 Đã khoá kèo</span>${summary}`;
    return;
  }
  const amount = online.betAmount < 0 ? xu : Math.min(online.betAmount, xu);
  const chip = (value: number, label: string) =>
    `<button class="chip ${online.betAmount === value ? 'active' : ''}" data-chip="${value}" ${value > xu ? 'disabled' : ''}>${label}</button>`;
  const sideBtn = (t: Team) =>
    `<button class="btn bet-side ${t ? 'enemy' : 'ally'}" data-bet="${t}" ${amount < MIN_BET ? 'disabled' : ''}>
      ${name(t)} <small>×${betOdds(pool.totals, t, amount).toFixed(2)}</small></button>`;
  el.innerHTML = `
    <div class="bet-row">
      <span class="bet-wallet">🎲 Kèo · 🪙 <b>${xu}</b> <small id="bet-close">${
        s.mode.type === 'menu' ? `· mở đến giây ${pool.closesAt} của trận` : ''
      }</small></span>
      <div class="bet-chips">${BET_CHIPS.map((c) => chip(c, String(c))).join('')}${chip(-1, 'Tất tay')}</div>
    </div>
    <div class="bet-row">${sideBtn(0)}${sideBtn(1)}</div>
    ${summary}`;
  el.querySelectorAll<HTMLButtonElement>('[data-chip]').forEach((b) =>
    b.addEventListener('click', () => {
      sound.click();
      online.betAmount = Number(b.dataset.chip);
      renderBet();
    }),
  );
  el.querySelectorAll<HTMLButtonElement>('[data-bet]').forEach((b) =>
    b.addEventListener('click', () => {
      sound.coin();
      el.querySelectorAll<HTMLButtonElement>('[data-bet]').forEach((x) => (x.disabled = true));
      online.client?.send({ t: 'bet', side: Number(b.dataset.bet) as Team, amount });
    }),
  );
}

function onWatchEnd(result: 'win' | 'lose' | 'draw', reason: EndReason): void {
  online.ended = true;
  const s = session;
  if (!s || s.mode.type !== 'watch') return;
  s.endShown = true;
  sound.win();
  const [left, right] = s.mode.players;
  const winner = result === 'win' ? left : right;
  const loser = result === 'win' ? right : left;
  const why: Record<EndReason, string> = {
    statue: `Tượng của ${loser} đã sụp đổ.`,
    surrender: `${loser} đã đầu hàng.`,
    disconnect: `${loser} đã rời trận.`,
    timeout: `Hết ${online.minutes} phút, so máu tượng hai bên.`,
  };
  setTimeout(
    () => {
      if (session !== s) return;
      overlay(
        `<div class="big-emoji">${result === 'draw' ? '🤝' : '🏆'}</div>
         <h2>${result === 'draw' ? 'Hoà' : `${escapeHtml(winner)} thắng!`}</h2>
         <p>${escapeHtml(why[reason])}</p>
         ${statsHtml(s.match.view)}
         <p class="bet-result" id="bet-result">${online.lastBet ? betResultText(online.lastBet) : ''}</p>
         <p class="small" id="watch-next">${
           online.roomClosed
             ? 'Hai người chơi đã rời phòng.'
             : online.wait
               ? 'Về phòng chờ để bắt kèo trận tiếp theo.'
               : 'Nếu hai người đấu lại, bạn sẽ được xem tiếp và bắt kèo trận mới.'
         }</p>`,
        online.roomClosed
          ? [{ label: 'Về menu', primary: true, onClick: showMenu }]
          : online.wait
            ? [
                { label: '↩ Về phòng chờ', primary: true, onClick: showRoom },
                { label: 'Về menu', onClick: showMenu },
              ]
            : [
              {
                label: '👁 Ở lại xem',
                primary: true,
                attr: 'data-stay',
                onClick: () => {
                  s.endShown = false;
                  const wait = online.watchWait;
                  if (wait) showWatchWaiting(wait.code, wait.players);
                  else closeOverlay();
                },
              },
              { label: 'Về menu', onClick: showMenu },
            ],
      );
    },
    reason === 'statue' ? 1200 : 200,
  );
}

function onOnlineEnd(result: 'win' | 'lose' | 'draw', reason: string): void {
  online.ended = true;
  const s = session;
  if (!s || s.mode.type !== 'online') return;
  s.endShown = true;
  if (result === 'win') sound.win();
  else sound.lose();
  const why: Record<string, string> = {
    statue: result === 'win' ? 'Tượng đối thủ đã sụp đổ.' : 'Tượng của bạn đã bị phá.',
    surrender: result === 'win' ? 'Đối thủ đã đầu hàng.' : 'Bạn đã đầu hàng.',
    disconnect: result === 'win' ? 'Đối thủ đã rời trận.' : 'Bạn đã rời trận.',
    timeout: `Hết ${online.minutes} phút, so máu tượng hai bên.`,
  };
  const title = result === 'win' ? 'Chiến thắng!' : result === 'lose' ? 'Thất bại' : 'Hoà';
  const emoji = result === 'win' ? '🏆' : result === 'lose' ? '💀' : '🤝';
  setTimeout(
    () => {
      if (session !== s) return;
      overlay(
        `<div class="big-emoji">${emoji}</div><h2>${title}</h2>
         <p>${why[reason] ?? ''}</p>
         <p class="small">vs <b>${escapeHtml(online.opponent)}</b></p>
         ${statsHtml(s.match.view)}
         <p class="small" id="rematch-status"></p>`,
        online.wait
          ? [
              { label: '↩ Về phòng chờ', primary: true, onClick: showRoom },
              { label: 'Về menu', onClick: showMenu },
            ]
          : [
          {
            label: '🔁 Đấu lại',
            primary: true,
            attr: 'data-rematch',
            onClick: () => {
              online.client?.send({ t: 'rematch' });
              setText('rematch-status', 'Đang chờ đối thủ đồng ý…');
            },
          },
          { label: 'Về menu', onClick: showMenu },
            ],
      );
      if (reason === 'disconnect') {
        const btn = document.querySelector<HTMLButtonElement>('[data-rematch]');
        if (btn) btn.disabled = true;
      }
    },
    reason === 'statue' ? 1200 : 200,
  );
}

// ---------- Tiện ích UI ----------

type OverlayButton = { label: string; primary?: boolean; onClick: () => void; attr?: string };
let overlayOnClose: (() => void) | null = null;

function overlay(html: string, buttons: OverlayButton[]): void {
  document.querySelectorAll('.overlay').forEach((el) => el.remove());
  overlayOnClose = null;
  const el = document.createElement('div');
  el.className = 'overlay';
  el.innerHTML = `<div class="dialog">${html}<div class="dialog-actions"></div></div>`;
  const actions = el.querySelector('.dialog-actions')!;
  for (const b of buttons) {
    const btn = document.createElement('button');
    btn.className = `btn ${b.primary ? 'btn-primary' : ''}`;
    btn.textContent = b.label;
    if (b.attr) btn.setAttribute(b.attr, '');
    btn.addEventListener('click', () => {
      sound.click();
      b.onClick();
    });
    actions.appendChild(btn);
  }
  document.body.appendChild(el);
  el.querySelector<HTMLButtonElement>('.btn')?.focus();
}

function closeOverlay(): void {
  document.querySelectorAll('.overlay').forEach((el) => el.remove());
  const next = overlayOnClose;
  overlayOnClose = null;
  next?.();
}

function toast(msg: string, ms = 1800): void {
  document.querySelectorAll('.toast').forEach((el) => el.remove());
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = msg;
  el.style.animationDuration = `${ms}ms`;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), ms);
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

// ---------- Sự kiện toàn cục ----------

window.addEventListener('resize', () => session?.renderer.resize());
document.addEventListener('visibilitychange', () => {
  const s = session;
  if (document.hidden && s && (s.mode.type === 'campaign' || s.mode.type === 'skirmish') && s.running) openGameMenu();
});
document.addEventListener('keydown', (e) => {
  if (e.target instanceof HTMLInputElement) return;
  const k = e.key.toLowerCase();
  if (k === 'm' && voice.joined && !e.repeat) {
    toggleMic();
    return;
  }
  keys.add(k);
  const s = session;
  if (!s || s.mode.type === 'menu') return;
  if (k === ' ' || k === 'escape' || k === 'p') {
    e.preventDefault();
    if (document.querySelector('.overlay')) {
      if (!s.endShown && (isNet(s.mode) || s.match.view.time > 0)) resume();
    } else openGameMenu();
    return;
  }
  const slot = TRAIN_KEYS.indexOf(k);
  if (slot >= 0) {
    const kind = s.match.unlocked.find((x) => archIndex(x) === slot);
    if (kind) trainUnit(kind);
  }
  if (k === 'r' && !e.repeat) toggleCenterMine();
  if (k === 'f' && !e.repeat) cycleFormation();
  const stance = STANCES.find((st) => st.key.toLowerCase() === k);
  if (stance) setStance(stance.id);
});
document.addEventListener('keyup', (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener('blur', () => keys.clear());

// Chỉ ở bản dev: cho phép tua trận bằng console để kiểm thử
if (import.meta.env.DEV) {
  (window as unknown as { __step: (sec: number) => void }).__step = (sec: number) => {
    const s = session;
    if (!s) return;
    for (let t = 0; t < sec; t += 0.1) s.renderer.consume(s.match.step(0.1));
    if (s.mode.type === 'menu') followAction(s, 10);
    s.renderer.draw(s.match.view, 0.016);
    if (s.mode.type !== 'menu') updateHud(s);
  };
}

// Bản build: lưu sẵn để chơi offline khi mất mạng
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => void navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Tài khoản: đọc cấu hình máy chủ + hồ sơ; đăng nhập rồi thì dùng tên / tộc của tài khoản
onAuthChange(() => {
  if (auth.account) {
    playerName = auth.account.name;
    if (auth.account.faction !== myFaction && FACTION_ORDER.includes(auth.account.faction)) {
      myFaction = auth.account.faction;
      save('faction', myFaction);
    }
  }
  if (document.querySelector('.login-screen')) {
    loginPaint?.();
    return;
  }
  // Phiên đăng nhập cũ hết hạn / bị thu hồi mà chưa chọn khách: quay lại màn đăng nhập
  if (!auth.session && !guestChosen && session?.mode.type === 'menu' && document.querySelector('.lobby')) {
    showLogin();
    return;
  }
  if (session?.mode.type === 'menu' && document.querySelector('.lobby')) {
    renderHubUser();
    if (menuTab === 'home' || menuTab === 'account') renderTab();
  }
});
void initAuth();

// Mở bằng link mời ?room=MÃ thì vào thẳng phòng
const invite = new URLSearchParams(location.search).get('room');
if (invite) {
  menuTab = 'online';
  showMenu();
  // Phòng đã đủ người thì máy chủ trả 'full' và hỏi có muốn vào xem không
  void goOnline({ t: 'join', code: invite.toUpperCase().slice(0, 4), as: 'play' });
} else {
  showStart();
}
