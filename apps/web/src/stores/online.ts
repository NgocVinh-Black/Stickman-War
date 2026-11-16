import type { BetPool, ChatLine, ClientMsg, EndReason, FactionId, LobbyRoom, ServerMsg, WaitRoom } from '@stickman-war/core';
import { defineStore } from 'pinia';
import { ref, shallowRef } from 'vue';
import { onlineMatch, watchMatch } from '../game/match';
import { statsOf } from '../game/session';
import { sound } from '../lib/sound';
import { walletId } from '../lib/storage';
import { accountFromServer, auth } from '../net/account';
import { OnlineClient, RemoteWorld } from '../net/remote';
import { Voice } from '../net/voice';
import { router } from '../router';
import { useGame } from './game';
import { useSettings } from './settings';
import { useUi } from './ui';

export type BetResult = Extract<ServerMsg, { t: 'betResult' }>;

export function betResultText(r: BetResult): string {
  if (r.outcome === 'win') return `🎉 Thắng kèo! +${r.payout - r.amount} 🪙 · còn ${r.xu} xu`;
  if (r.outcome === 'lose') return `😢 Thua kèo −${r.amount} 🪙 · còn ${r.xu} xu`;
  return `↩️ Hoàn lại ${r.amount} 🪙 (hoà hoặc không ai cược bên kia)`;
}

export const inviteLink = (code: string) => `${location.origin}${location.pathname}?room=${code}`;

/** Kết nối máy chủ online và mọi trạng thái online: sảnh, phòng chờ, kèo, chat, thoại, trận đang chơi / xem. */
export const useOnline = defineStore('online', () => {
  const client = shallowRef<OnlineClient | null>(null);
  const status = ref('1 đấu 1 với người chơi khác qua mạng');
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

  async function ensure(): Promise<OnlineClient | null> {
    if (client.value?.connected) return client.value;
    client.value?.close();
    client.value = null;
    const c = new OnlineClient();
    c.on(onServer);
    status.value = 'Đang kết nối máy chủ…';
    try {
      await c.connect(settings().name, walletId(), settings().faction);
    } catch {
      c.close();
      status.value = '🔴 Không kết nối được máy chủ online';
      ui().toast('Không kết nối được máy chủ online', 3000);
      return null;
    }
    client.value = c;
    const timer = window.setInterval(() => {
      if (client.value !== c) return clearInterval(timer);
      ping.value = c.ping;
    }, 1000);
    return c;
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
    if (msg.t !== 'join') showWaiting(msg.t === 'quick' ? 'Đang tìm đối thủ…' : 'Đang tạo phòng…', '');
  }

  function showWaiting(title: string, code: string): void {
    const buttons = [];
    if (code) {
      buttons.push({
        label: '📋 Sao chép link mời',
        primary: true,
        action: () => {
          if (!navigator.clipboard) return ui().toast('Hãy gửi mã phòng cho bạn bè');
          navigator.clipboard.writeText(inviteLink(code)).then(
            () => ui().toast('Đã sao chép link'),
            () => ui().toast('Không sao chép được, hãy gửi mã phòng'),
          );
        },
      });
    }
    buttons.push({
      label: 'Huỷ',
      action: () => {
        leave();
        ui().close();
      },
    });
    ui().show({
      kind: 'generic',
      spinner: true,
      title,
      lines: code ? ['Gửi mã này cho bạn bè:'] : ['Sẽ vào trận ngay khi có người chơi khác.'],
      code: code || undefined,
      link: code ? inviteLink(code) : undefined,
      buttons,
    });
  }

  function copyInvite(code: string): void {
    if (!navigator.clipboard) return ui().toast(`Gửi mã phòng ${code} cho bạn bè`);
    navigator.clipboard.writeText(inviteLink(code)).then(
      () => ui().toast('Đã sao chép link mời'),
      () => ui().toast(`Không sao chép được, gửi mã ${code}`),
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
    const s = game().mount({ type: 'online', opponent: opp }, match, `vs ${opp}`, 'Trận online 1v1');
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
    const s = game().mount({ type: 'watch', players }, watchMatch(r), `${players[0]} vs ${players[1]}`, '👁 Đang xem trận');
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
        g.hud.countdown = 'Chiến!';
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
    const st = settings();
    const soundBtn = {
      label: st.muted ? '🔇 Bật âm thanh' : '🔊 Tắt âm thanh',
      action: () => {
        st.toggleSound();
        openNetMenu();
      },
    };
    if (s.mode.type === 'watch') {
      ui().show({
        kind: 'generic',
        title: 'Đang xem trận',
        lines: [`${s.mode.players[0]} vs ${s.mode.players[1]}`],
        buttons: [{ label: 'Tiếp tục xem', primary: true, action: ui().close }, soundBtn, { label: 'Rời phòng', action: toMenu }],
      });
      return;
    }
    ui().show({
      kind: 'generic',
      title: 'Trận online',
      lines: ['Trận vẫn đang tiếp diễn!'],
      buttons: [
        { label: 'Quay lại trận', primary: true, action: ui().close },
        soundBtn,
        {
          label: '🏳️ Đầu hàng',
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
      statue: `Tượng của ${loser} đã sụp đổ.`,
      surrender: `${loser} đã đầu hàng.`,
      disconnect: `${loser} đã rời trận.`,
      timeout: `Hết ${minutes.value} phút, so máu tượng hai bên.`,
    };
    setTimeout(
      () => {
        if (game().session !== s) return;
        const next = roomClosed.value
          ? 'Hai người chơi đã rời phòng.'
          : wait.value
            ? 'Về phòng chờ để bắt kèo trận tiếp theo.'
            : 'Nếu hai người đấu lại, bạn sẽ được xem tiếp và bắt kèo trận mới.';
        ui().show({
          kind: 'generic',
          emoji: result === 'draw' ? '🤝' : '🏆',
          title: result === 'draw' ? 'Hoà' : `${winner} thắng!`,
          lines: [why[reason]],
          stats: statsOf(s.view),
          status: lastBet.value ? betResultText(lastBet.value) : undefined,
          small: next,
          buttons: roomClosed.value
            ? [{ label: 'Về menu', primary: true, action: toMenu }]
            : wait.value
              ? [
                  { label: '↩ Về phòng chờ', primary: true, action: showRoom },
                  { label: 'Về menu', action: toMenu },
                ]
              : [
                  {
                    label: '👁 Ở lại xem',
                    primary: true,
                    action: () => {
                      s.endShown = false;
                      const w = watchWait.value;
                      if (w) showWatchWaiting(w.code, w.players);
                      else ui().close();
                    },
                  },
                  { label: 'Về menu', action: toMenu },
                ],
        });
      },
      reason === 'statue' ? 1200 : 200,
    );
  }

  function onOnlineEnd(result: 'win' | 'lose' | 'draw', reason: string): void {
    ended.value = true;
    const s = game().session;
    if (!s || s.mode.type !== 'online') return;
    s.endShown = true;
    if (result === 'win') sound.win();
    else sound.lose();
    const why: Record<string, string> = {
      statue: result === 'win' ? 'Tượng đối thủ đã sụp đổ.' : 'Tượng của bạn đã bị phá.',
      surrender: result === 'win' ? 'Đối thủ đã đầu hàng.' : 'Bạn đã đầu hàng.',
      disconnect: result === 'win' ? 'Đối thủ đã rời trận.' : 'Bạn đã rời trận.',
      timeout: `Hết ${minutes.value} phút, so máu tượng hai bên.`,
    };
    setTimeout(
      () => {
        if (game().session !== s) return;
        ui().show({
          kind: 'generic',
          emoji: result === 'win' ? '🏆' : result === 'lose' ? '💀' : '🤝',
          title: result === 'win' ? 'Chiến thắng!' : result === 'lose' ? 'Thất bại' : 'Hoà',
          lines: [why[reason] ?? ''],
          small: `vs ${opponent.value}`,
          stats: statsOf(s.view),
          buttons: wait.value
            ? [
                { label: '↩ Về phòng chờ', primary: true, action: showRoom },
                { label: 'Về menu', action: toMenu },
              ]
            : [
                {
                  label: '🔁 Đấu lại',
                  primary: true,
                  disabled: reason === 'disconnect',
                  action: () => {
                    send({ t: 'rematch' });
                    ui().setStatus('Đang chờ đối thủ đồng ý…');
                  },
                },
                { label: 'Về menu', action: toMenu },
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
      title: 'Đang chờ người chơi',
      lines: [`Phòng ${code} của ${players[0] ?? ''} còn 1 ghế trống.`],
      small: 'Bạn đang ở chế độ xem. Trận bắt đầu là sẽ xem được ngay.',
      buttons: [
        { label: '▶ Vào chơi', primary: true, action: () => send({ t: 'join', code, as: 'play' }) },
        {
          label: 'Rời phòng',
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
      title: `Phòng ${code} đang đấu`,
      lines: [players.join(' vs ')],
      small: 'Phòng đã đủ 2 người. Bạn có thể vào xem trực tiếp và 🎲 bắt kèo xem ai thắng.',
      buttons: [
        { label: '👁 Vào xem', primary: true, action: () => send({ t: 'join', code, as: 'watch' }) },
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
        status.value = `🟢 ${msg.online} người đang trực tuyến`;
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
        ui().toast('Chủ phòng đã mời bạn ra khỏi phòng', 3500);
        break;
      case 'room':
        wait.value = null;
        if (msg.players.length >= 2) break;
        if (msg.watching) {
          watchWait.value = { code: msg.code, players: msg.players };
          if (!(g.session?.mode.type === 'watch' && g.session.endShown)) showWatchWaiting(msg.code, msg.players);
        } else showWaiting(msg.private ? 'Phòng của bạn' : 'Đang tìm đối thủ…', msg.private ? msg.code : '');
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
        status.value = `🟢 ${msg.online} người trực tuyến · ${msg.rooms.length} phòng${xu.value === null ? '' : ` · 🪙 ${xu.value} xu`}`;
        break;
      case 'watchers':
        watchers.value = msg.n;
        break;
      case 'wallet':
        xu.value = msg.xu;
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
            d.small = 'Hai người chơi đã rời phòng.';
            d.buttons = [{ label: 'Về menu', primary: true, action: toMenu }];
          }
          break;
        }
        ui().toast('Phòng đã đóng', 3000);
        if (g.session?.mode.type === 'watch') toMenu();
        else if (ui().dialog?.kind === 'generic' && (ui().dialog as { spinner?: boolean }).spinner) ui().close();
        break;
      case 'state':
        remote?.apply(msg.s);
        break;
      case 'end':
        if (g.session?.mode.type === 'watch') onWatchEnd(msg.result, msg.reason);
        else onOnlineEnd(msg.result, msg.reason);
        break;
      case 'rematch':
        ui().setStatus(msg.votes === 1 ? 'Đang chờ người còn lại đồng ý…' : '');
        break;
      case 'left':
        if (g.session?.mode.type === 'online') {
          ui().toast('Đối thủ đã rời phòng', 3000);
          const d = ui().dialog;
          if (d?.kind === 'generic') {
            d.status = 'Đối thủ đã rời phòng';
            d.buttons = d.buttons.map((b) => (b.label.includes('Đấu lại') ? { ...b, disabled: true } : b));
          }
        }
        break;
      case 'error':
        ui().toast(msg.msg, 3000);
        if (msg.msg.startsWith('Mất kết nối')) {
          voice.teardown();
          voiceVisible.value = false;
          client.value = null;
          if (inNet && !ended.value) {
            ui().show({
              kind: 'generic',
              emoji: '📡',
              title: 'Mất kết nối',
              lines: ['Không còn liên lạc được với máy chủ.'],
              buttons: [{ label: 'Về menu', primary: true, action: toMenu }],
            });
          } else if (ui().dialog?.kind === 'generic' && (ui().dialog as { spinner?: boolean }).spinner) ui().close();
        }
        break;
    }
  }

  return {
    client,
    status,
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
    leave,
    toMenu,
    go,
    copyInvite,
    showRoom,
    openNetMenu,
    placeBet,
  };
});
