import type { BetPool, ChatLine, ClientMsg, EndReason, FactionId, LobbyRoom, ServerMsg, WaitRoom } from '@stickman-war/core';
import { defineStore } from 'pinia';
import { computed, ref, shallowRef } from 'vue';
import { onlineMatch, watchMatch } from '../game/match';
import { statsOf } from '../game/session';
import { t } from '@stickman-war/i18n';
import { serverText } from '@stickman-war/i18n/server';
import { sound } from '../lib/sound';
import { load, save, walletId } from '../lib/storage';
import { accountFromServer, auth } from '../net/account';
import { OnlineClient, RemoteWorld } from '../net/remote';
import { Voice } from '../net/voice';
import { router } from '../router';
import { useGame } from './game';
import { useSettings } from './settings';
import { useUi } from './ui';

export type BetResult = Extract<ServerMsg, { t: 'betResult' }>;

export function betResultText(r: BetResult): string {
  if (r.outcome === 'win') return t('online.betWin', { gain: r.payout - r.amount, xu: r.xu });
  if (r.outcome === 'lose') return t('online.betLose', { amount: r.amount, xu: r.xu });
  return t('online.betRefund', { amount: r.amount });
}

export const inviteLink = (code: string) => `${location.origin}${location.pathname}?room=${code}`;

/** Kết nối máy chủ online và mọi trạng thái online: sảnh, phòng chờ, kèo, chat, thoại, trận đang chơi / xem. */
export const useOnline = defineStore('online', () => {
  const client = shallowRef<OnlineClient | null>(null);
  /** Dòng trạng thái: lưu dạng hàm để đổi ngôn ngữ là đổi theo. */
  const status = shallowRef<() => string>(() => t('online.status'));
  const statusText = computed(() => status.value());
  const lastOnline = ref(0);
  const lobby = ref<LobbyRoom[] | null>(null);
  const xu = ref<number | null>(null);
  const pool = ref<BetPool | null>(null);
  const betAmount = ref(100); // -1 = tất tay
  const lastBet = ref<BetResult | null>(null);
  const wait = ref<WaitRoom | null>(null);
  const chat = ref<ChatLine[]>([]);
  const watchers = ref(0);
  const ping = ref(0);
  const minutes = ref(20);
  const opponent = ref('');
  const ended = ref(false);
  const roomClosed = ref(false);
  /** Phòng đang xem quay về chờ người chơi (một người vừa rời). */
  const watchWait = ref<{ code: string; players: string[] } | null>(null);
  /** Đang xem trận: tên hai bên (bên trái trước). */
  const watching = ref<[string, string] | null>(null);
  let remote: RemoteWorld | null = null;
  let started = false;

  const ui = () => useUi();
  const game = () => useGame();
  const settings = () => useSettings();

  // ---------- Thoại ----------
  const voice = new Voice((m) => client.value?.send(m));
  /** Tăng mỗi khi thoại đổi để bảng thoại vẽ lại (Voice không phải đối tượng reactive). */
  const voiceTick = ref(0);
  const voiceVisible = ref(false);
  voice.onChange = () => voiceTick.value++;
  voice.onTalk = () => voiceTick.value++;
  voice.onError = (msg) => ui().toast(msg, 3500);

  function send(m: ClientMsg): void {
    client.value?.send(m);
  }

  /** quiet: không báo lỗi khi không kết nối được (gửi ngầm, ví dụ nhận xu chiến dịch). */
  async function ensure(quiet = false): Promise<OnlineClient | null> {
    if (client.value?.connected) return client.value;
    client.value?.close();
    client.value = null;
    const c = new OnlineClient();
    c.on(onServer);
    status.value = () => t('online.connecting');
    try {
      await c.connect(settings().name, walletId(), settings().faction);
    } catch {
      c.close();
      status.value = () => t('online.noServer');
      if (!quiet) ui().toast(t('online.noServerToast'), 3000);
      return null;
    }
    client.value = c;
    void flushClaims();
    const timer = window.setInterval(() => {
      if (client.value !== c) return clearInterval(timer);
      ping.value = c.ping;
    }, 1000);
    return c;
  }

  // ---------- Xu chiến dịch ----------

  type Claim = Extract<ClientMsg, { t: 'campaignWin' | 'soloLose' }>;
  const CLAIMS = 'camp-claims';

  /** Thắng màn chiến dịch: báo máy chủ để nhận xu; mất mạng thì giữ lại, lần kết nối sau gửi tiếp. */
  function claimCampaign(faction: FactionId, level: number, stars: number): void {
    save(CLAIMS, [...load<Claim[]>(CLAIMS, []), { t: 'campaignWin', faction, level, stars }]);
    void flushClaims();
  }

  /** Thua trận chơi đơn: báo máy chủ để nhận xu an ủi (máy chủ giới hạn số lần). */
  function claimSoloLose(): void {
    save(CLAIMS, [...load<Claim[]>(CLAIMS, []), { t: 'soloLose' }]);
    void flushClaims();
  }

  async function flushClaims(): Promise<void> {
    const list = load<Claim[]>(CLAIMS, []);
    if (!list.length) return;
    const c = await ensure(true);
    if (!c) return;
    save(CLAIMS, []);
    // Chào lại kèm phiên đăng nhập để xu vào đúng ví tài khoản, rồi gửi theo thứ tự thắng
    c.send({ t: 'hello', name: settings().name, wallet: walletId(), faction: settings().faction, session: auth.session || undefined });
    list.forEach((m) => c.send(m));
  }

  /** Rời phòng / trận online đang ở (rời luôn thoại). */
  function leave(): void {
    voice.teardown();
    voiceVisible.value = false;
    send({ t: 'leave' });
    send({ t: 'lobby', on: false });
    remote = null;
    watchers.value = 0;
    watchWait.value = null;
    wait.value = null;
    chat.value = [];
    watching.value = null;
  }

  function toMenu(): void {
    leave();
    ui().close();
    game().unmount();
    void router.push('/');
  }

  async function go(msg: Extract<ClientMsg, { t: 'quick' | 'create' | 'join' }>): Promise<void> {
    sound.click();
    const c = await ensure();
    if (!c) return;
    c.send({ t: 'hello', name: settings().name, wallet: walletId(), faction: settings().faction, session: auth.session || undefined });
    c.send(msg);
    if (msg.t !== 'join') showWaiting(msg.t === 'quick' ? t('online.searching') : t('online.creating'), '');
  }

  function showWaiting(title: string, code: string): void {
    const buttons = [];
    if (code) {
      buttons.push({
        label: t('online.copyLink'),
        primary: true,
        action: () => {
          if (!navigator.clipboard) return ui().toast(t('online.sendCode'));
          navigator.clipboard.writeText(inviteLink(code)).then(
            () => ui().toast(t('online.copied')),
            () => ui().toast(t('online.copyFail')),
          );
        },
      });
    }
    buttons.push({
      label: t('common.cancel'),
      action: () => {
        leave();
        ui().close();
      },
    });
    ui().show({
      kind: 'generic',
      spinner: true,
      title,
      lines: code ? [t('online.sendCodeLine')] : [t('online.waitLine')],
      code: code || undefined,
      link: code ? inviteLink(code) : undefined,
      buttons,
    });
  }

  function copyInvite(code: string): void {
    if (!navigator.clipboard) return ui().toast(t('online.sendCodeN', { code }));
    navigator.clipboard.writeText(inviteLink(code)).then(
      () => ui().toast(t('online.copiedInvite')),
      () => ui().toast(t('online.copyFailN', { code })),
    );
  }

  /** Vào phòng chờ (màn RoomView). */
  function showRoom(): void {
    ui().close();
    game().unmount();
    voiceVisible.value = true;
    void router.push('/room');
  }

  // ---------- Trận online ----------

  function startOnline(opp: string, countdown: number, factions: [FactionId, FactionId]): void {
    const r = new RemoteWorld();
    r.teams[0].faction = factions[0];
    r.teams[1].faction = factions[1];
    remote = r;
    ended.value = false;
    started = false;
    opponent.value = opp;
    watching.value = null;
    const match = onlineMatch(r, send, factions[0], { started: () => started, ended: () => ended.value });
    const s = game().mount({ type: 'online', opponent: opp }, match, `vs ${opp}`, t('online.match'));
    s.running = true;
    voiceVisible.value = true;
    runCountdown(countdown, () => (started = true));
  }

  function startWatching(players: [string, string], countdown: number, factions?: [FactionId, FactionId]): void {
    watchWait.value = null;
    pool.value = null;
    lastBet.value = null;
    roomClosed.value = false;
    const r = new RemoteWorld();
    if (factions) [r.teams[0].faction, r.teams[1].faction] = factions;
    remote = r;
    ended.value = false;
    watching.value = players;
    const s = game().mount({ type: 'watch', players }, watchMatch(r), `${players[0]} vs ${players[1]}`, t('online.watchingMatch'));
    s.running = true;
    voiceVisible.value = true;
    if (countdown > 0) runCountdown(countdown, () => {});
  }

  /** Đếm ngược theo máy chủ: 3, 2, 1, Chiến! */
  function runCountdown(from: number, onGo: () => void): void {
    const g = game();
    const s = g.session;
    let left = from;
    const next = () => {
      if (g.session !== s) return;
      if (left > 0) {
        g.hud.countdown = String(left);
        sound.click();
        left--;
        setTimeout(next, 1000);
      } else {
        onGo();
        g.hud.countdown = t('game.fight');
        sound.horn();
        setTimeout(() => g.session === s && (g.hud.countdown = ''), 900);
      }
    };
    next();
  }

  /** Menu trong trận online / đang xem (không tạm dừng được). */
  function openNetMenu(): void {
    const s = game().session;
    if (!s || s.endShown) return;
    const soundBtn = { label: `⚙️ ${t('settings.title')}`, action: () => ui().show({ kind: 'settings', back: openNetMenu }) };
    if (s.mode.type === 'watch') {
      ui().show({
        kind: 'generic',
        title: t('online.watchingTitle'),
        lines: [`${s.mode.players[0]} vs ${s.mode.players[1]}`],
        buttons: [
          { label: t('online.keepWatching'), primary: true, action: ui().close },
          soundBtn,
          { label: t('online.leave'), action: toMenu },
        ],
      });
      return;
    }
    ui().show({
      kind: 'generic',
      title: t('online.onlineMatch'),
      lines: [t('online.stillOn')],
      buttons: [
        { label: t('online.backToMatch'), primary: true, action: ui().close },
        soundBtn,
        {
          label: t('online.surrender'),
          action: () => {
            send({ t: 'surrender' });
            ui().close();
          },
        },
      ],
    });
  }

  function onWatchEnd(result: 'win' | 'lose' | 'draw', reason: EndReason): void {
    ended.value = true;
    const s = game().session;
    if (!s || s.mode.type !== 'watch') return;
    s.endShown = true;
    sound.win();
    const [left, right] = s.mode.players;
    const winner = result === 'win' ? left : right;
    const loser = result === 'win' ? right : left;
    const why: Record<EndReason, string> = {
      statue: t('online.endStatue', { name: loser }),
      surrender: t('online.endSurrender', { name: loser }),
      disconnect: t('online.endLeft', { name: loser }),
      timeout: t('online.endTime', { n: minutes.value }),
    };
    setTimeout(
      () => {
        if (game().session !== s) return;
        const next = roomClosed.value ? t('online.bothLeft') : wait.value ? t('online.backToRoomBet') : t('online.rematchWatch');
        ui().show({
          kind: 'generic',
          emoji: result === 'draw' ? '🤝' : '🏆',
          title: result === 'draw' ? t('online.draw') : t('online.wins', { name: winner ?? '' }),
          lines: [why[reason]],
          stats: statsOf(s.view),
          status: lastBet.value ? betResultText(lastBet.value) : undefined,
          small: next,
          buttons: roomClosed.value
            ? [{ label: t('common.toMenu'), primary: true, action: toMenu }]
            : wait.value
              ? [
                  { label: t('online.backToRoom'), primary: true, action: showRoom },
                  { label: t('common.toMenu'), action: toMenu },
                ]
              : [
                  {
                    label: t('online.stay'),
                    primary: true,
                    action: () => {
                      s.endShown = false;
                      const w = watchWait.value;
                      if (w) showWatchWaiting(w.code, w.players);
                      else ui().close();
                    },
                  },
                  { label: t('common.toMenu'), action: toMenu },
                ],
        });
      },
      reason === 'statue' ? 1200 : 200,
    );
  }

  function onOnlineEnd(result: 'win' | 'lose' | 'draw', reason: string, reward?: number): void {
    ended.value = true;
    const s = game().session;
    if (!s || s.mode.type !== 'online') return;
    s.endShown = true;
    if (result === 'win') sound.win();
    else sound.lose();
    const why: Record<string, string> = {
      statue: result === 'win' ? t('online.theirStatue') : t('online.myStatue'),
      surrender: result === 'win' ? t('online.theySurrender') : t('online.iSurrender'),
      disconnect: result === 'win' ? t('online.theyLeft') : t('online.iLeft'),
      timeout: t('online.endTime', { n: minutes.value }),
    };
    setTimeout(
      () => {
        if (game().session !== s) return;
        ui().show({
          kind: 'generic',
          emoji: result === 'win' ? '🏆' : result === 'lose' ? '💀' : '🤝',
          title: result === 'win' ? t('online.win') : result === 'lose' ? t('online.lose') : t('online.draw'),
          lines: [why[reason] ?? '', ...(reward ? [t('common.xuGain', { n: reward })] : [])],
          small: `vs ${opponent.value}`,
          stats: statsOf(s.view),
          buttons: wait.value
            ? [
                { label: t('online.backToRoom'), primary: true, action: showRoom },
                { label: t('common.toMenu'), action: toMenu },
              ]
            : [
                {
                  label: t('online.rematch'),
                  primary: true,
                  disabled: reason === 'disconnect',
                  action: () => {
                    send({ t: 'rematch' });
                    ui().setStatus(t('online.waitRematch'));
                  },
                },
                { label: t('common.toMenu'), action: toMenu },
              ],
        });
      },
      reason === 'statue' ? 1200 : 200,
    );
  }

  function showWatchWaiting(code: string, players: string[]): void {
    ui().show({
      kind: 'generic',
      spinner: true,
      title: t('online.waitingPlayer'),
      lines: [t('online.seatFree', { code, name: players[0] ?? '' })],
      small: t('online.watchMode'),
      buttons: [
        { label: t('online.joinPlay'), primary: true, action: () => send({ t: 'join', code, as: 'play' }) },
        {
          label: t('online.leave'),
          action: () => {
            if (game().session?.mode.type === 'watch') toMenu();
            else {
              leave();
              ui().close();
            }
          },
        },
      ],
    });
  }

  function showRoomFull(code: string, players: string[]): void {
    ui().show({
      kind: 'generic',
      emoji: '⚔️',
      title: t('online.roomBusy', { code }),
      lines: [players.join(' vs ')],
      small: t('online.roomFull'),
      buttons: [
        { label: t('online.joinWatch'), primary: true, action: () => send({ t: 'join', code, as: 'watch' }) },
        { label: 'Huỷ', action: ui().close },
      ],
    });
  }

  function placeBet(side: 0 | 1, amount: number): void {
    sound.coin();
    send({ t: 'bet', side, amount });
  }

  // ---------- Tin từ máy chủ ----------

  function onServer(msg: ServerMsg): void {
    const g = game();
    const inNet = g.session && (g.session.mode.type === 'online' || g.session.mode.type === 'watch');
    switch (msg.t) {
      case 'account':
        accountFromServer(msg.account);
        break;
      case 'welcome':
        lastOnline.value = msg.online;
        status.value = () => t('online.online', { n: msg.online });
        break;
      case 'waitroom': {
        const { t: _, ...w } = msg;
        wait.value = w;
        // Đang trong trận (vừa đánh xong) thì để bảng kết quả hiện trước
        if (inNet) break;
        if (router.currentRoute.value.path !== '/room') showRoom();
        break;
      }
      case 'chatLog':
        chat.value = msg.lines;
        break;
      case 'chat':
        chat.value.push(msg.line);
        if (chat.value.length > 60) chat.value.shift();
        if (msg.line.kind !== 'system' && g.session?.mode.type === 'watch') ui().toast(`💬 ${msg.line.from}: ${msg.line.text}`, 2500);
        break;
      case 'voicePeers':
        voice.updatePeers(msg.you, msg.peers);
        break;
      case 'signal':
        void voice.onSignal(msg.from, msg.data);
        break;
      case 'kicked':
        wait.value = null;
        toMenu();
        ui().toast(t('online.kicked'), 3500);
        break;
      case 'room':
        wait.value = null;
        if (msg.players.length >= 2) break;
        if (msg.watching) {
          watchWait.value = { code: msg.code, players: msg.players };
          if (!(g.session?.mode.type === 'watch' && g.session.endShown)) showWatchWaiting(msg.code, msg.players);
        } else showWaiting(msg.private ? t('online.yourRoom') : t('online.searching'), msg.private ? msg.code : '');
        break;
      case 'start':
        minutes.value = msg.minutes;
        startOnline(msg.opponent, msg.countdown, msg.factions);
        break;
      case 'spectate':
        minutes.value = msg.minutes;
        startWatching(msg.players, msg.countdown, msg.factions);
        break;
      case 'full':
        showRoomFull(msg.code, msg.players);
        break;
      case 'lobby':
        lobby.value = msg.rooms;
        lastOnline.value = msg.online;
        status.value = () =>
          t('online.lobbyStatus', { n: msg.online, rooms: msg.rooms.length }) +
          (xu.value === null ? '' : t('online.lobbyXu', { xu: xu.value }));
        break;
      case 'watchers':
        watchers.value = msg.n;
        break;
      case 'wallet':
        xu.value = msg.xu;
        if (auth.account) auth.xu = msg.xu;
        // Trận online đã ghi xu thưởng trong bảng kết quả
        if (msg.gain && g.session?.mode.type !== 'online') ui().toast(t('common.xuGain', { n: msg.gain }), 3000);
        break;
      case 'pool': {
        const { t: _, ...p } = msg;
        pool.value = p;
        break;
      }
      case 'betResult':
        xu.value = msg.xu;
        lastBet.value = msg;
        ui().toast(betResultText(msg), 4000);
        ui().setStatus(betResultText(msg));
        break;
      case 'closed':
        if (g.session?.mode.type === 'watch' && ended.value) {
          // Trận vừa xong thì giữ bảng kết quả (và kết quả kèo) cho người xem đọc
          roomClosed.value = true;
          const d = ui().dialog;
          if (d?.kind === 'generic') {
            d.small = t('online.bothLeft');
            d.buttons = [{ label: t('common.toMenu'), primary: true, action: toMenu }];
          }
          break;
        }
        ui().toast(t('online.closed'), 3000);
        if (g.session?.mode.type === 'watch') toMenu();
        else if (ui().dialog?.kind === 'generic' && (ui().dialog as { spinner?: boolean }).spinner) ui().close();
        break;
      case 'state':
        remote?.apply(msg.s);
        break;
      case 'end':
        if (g.session?.mode.type === 'watch') onWatchEnd(msg.result, msg.reason);
        else onOnlineEnd(msg.result, msg.reason, msg.reward);
        break;
      case 'rematch':
        ui().setStatus(msg.votes === 1 ? t('online.waitOther') : '');
        break;
      case 'left':
        if (g.session?.mode.type === 'online') {
          ui().toast(t('online.oppLeft'), 3000);
          const d = ui().dialog;
          if (d?.kind === 'generic') {
            d.status = t('online.oppLeft');
            d.buttons = d.buttons.map((b) => (b.label === t('online.rematch') ? { ...b, disabled: true } : b));
          }
        }
        break;
      case 'error':
        ui().toast(serverText(msg.msg), 3000);
        if (msg.msg === t('online.lostServer')) {
          voice.teardown();
          voiceVisible.value = false;
          client.value = null;
          if (inNet && !ended.value) {
            ui().show({
              kind: 'generic',
              emoji: '📡',
              title: t('online.lost'),
              lines: [t('online.lostLine')],
              buttons: [{ label: t('common.toMenu'), primary: true, action: toMenu }],
            });
          } else if (ui().dialog?.kind === 'generic' && (ui().dialog as { spinner?: boolean }).spinner) ui().close();
        }
        break;
    }
  }

  return {
    client,
    status,
    statusText,
    lastOnline,
    lobby,
    xu,
    pool,
    betAmount,
    lastBet,
    wait,
    chat,
    watchers,
    ping,
    minutes,
    opponent,
    ended,
    roomClosed,
    watchWait,
    watching,
    voice,
    voiceTick,
    voiceVisible,
    send,
    ensure,
    claimCampaign,
    claimSoloLose,
    leave,
    toMenu,
    go,
    copyInvite,
    showRoom,
    openNetMenu,
    placeBet,
  };
});
