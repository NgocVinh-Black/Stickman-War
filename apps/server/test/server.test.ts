import { LEVELS, PVP_XU, SOLO_LOSE_XU, WORLD_WIDTH, XU_PERFECT_TAB, XU_PER_STAR, type ClientMsg, type ServerMsg } from '@stickman-war/core';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import WebSocket from 'ws';
import { startGameServer as start, type GameServer } from '../src/bootstrap';
import { MemoryAccountStore, MemoryWalletStore } from '../src/database/memory.store';
import type { ServerOptions } from '../src/common/tokens';

/** Máy chủ thật (NestJS + WebSocket) chạy trên kho dữ liệu trong bộ nhớ, không cần Postgres. */
const startGameServer = (opts: Partial<ServerOptions> = {}) =>
  start(0, { stores: { accounts: new MemoryAccountStore(), wallets: new MemoryWalletStore() }, ...opts });

type TestClient = {
  msgs: ServerMsg[];
  send: (m: ClientMsg) => void;
  waitFor: <T extends ServerMsg['t']>(
    t: T,
    pred?: (m: Extract<ServerMsg, { t: T }>) => boolean,
    ms?: number,
  ) => Promise<Extract<ServerMsg, { t: T }>>;
  close: () => void;
};

let server: GameServer;
const clients: TestClient[] = [];

function connect(name: string, wallet?: string): Promise<TestClient> {
  const ws = new WebSocket(`ws://127.0.0.1:${server.port}/ws`);
  const msgs: ServerMsg[] = [];
  const waiters: (() => void)[] = [];
  ws.on('message', (d) => {
    msgs.push(JSON.parse(String(d)));
    waiters.forEach((w) => w());
  });
  const client: TestClient = {
    msgs,
    send: (m) => ws.send(JSON.stringify(m)),
    waitFor: (t, pred = () => true, ms = 6000) =>
      new Promise((resolve, reject) => {
        let from = 0;
        const check = () => {
          for (; from < msgs.length; from++) {
            const m = msgs[from];
            if (m.t === t && pred(m as never)) {
              resolve(m as never);
              return true;
            }
          }
          return false;
        };
        if (check()) return;
        const timer = setTimeout(() => reject(new Error(`${name}: hết thời gian chờ "${t}"`)), ms);
        waiters.push(() => check() && clearTimeout(timer));
      }),
    close: () => ws.close(),
  };
  clients.push(client);
  return new Promise((resolve) =>
    ws.on('open', () => {
      client.send({ t: 'hello', name, wallet });
      resolve(client);
    }),
  );
}

/** Phòng chờ: khách bấm sẵn sàng rồi chủ phòng bắt đầu. */
async function begin(host: TestClient, guest: TestClient) {
  await guest.waitFor('waitroom', (m) => m.seats[0] !== null && m.seats[1] !== null);
  const from = host.msgs.length; // chỉ xét tin mới, bỏ qua trạng thái sẵn sàng cũ
  guest.send({ t: 'ready', on: true });
  await host.waitFor('waitroom', (m) => host.msgs.indexOf(m) >= from && !!m.seats[1]?.ready && !!m.seats[0]?.ready);
  host.send({ t: 'begin' });
  return guest.waitFor('start');
}

beforeEach(async () => {
  server = await startGameServer();
});
afterEach(async () => {
  clients.splice(0).forEach((c) => c.close());
  await server.close();
});

describe('Máy chủ online', () => {
  it('ghép trận nhanh, gửi trạng thái và nhận lệnh', async () => {
    const a = await connect('An');
    const b = await connect('Bình');
    a.send({ t: 'quick' });
    await a.waitFor('room');
    b.send({ t: 'quick' });

    expect((await a.waitFor('start')).opponent).toBe('Bình');
    expect((await b.waitFor('start')).opponent).toBe('An');

    // Mỗi người đều thấy quân của mình ở nửa trái (team 0 sau khi lật gương)
    for (const c of [a, b]) {
      const { s } = await c.waitFor('state');
      const mine = s.units.filter((u) => u[2] === 0);
      expect(mine.length).toBe(3);
      for (const u of mine) expect(u[3]).toBeLessThan(WORLD_WIDTH / 2);
      expect(s.teams[1].gold).toBe(-1); // vàng đối thủ bị ẩn
    }

    // Lệnh chỉ có tác dụng khi trận bắt đầu (sau đếm ngược)
    await a.waitFor('state', (m) => m.s.time > 0.2, 8000);
    b.send({ t: 'train', kind: 'sword' });
    b.send({ t: 'stance', stance: 'attack' });
    const st = await b.waitFor('state', (m) => m.s.teams[0].queue.length === 1 && m.s.teams[0].stance === 2);
    expect(st.s.teams[0].gold).toBeLessThan(500);
  }, 15000);

  it('đặt xây tường: người chơi bên phải gửi toạ độ đã lật gương, hai bên thấy đúng chỗ, trừ vàng', async () => {
    const a = await connect('A');
    const b = await connect('B');
    a.send({ t: 'quick' });
    await a.waitFor('room');
    b.send({ t: 'quick' });
    await b.waitFor('start');
    await b.waitFor('state', (m) => m.s.time > 0.2, 8000);
    b.send({ t: 'wall', x: 400 });
    const mine = await b.waitFor('state', (m) => m.s.teams[0].wp !== undefined);
    expect(mine.s.teams[0].wp).toBe(400);
    expect(mine.s.teams[0].gold).toBeLessThan(500 - 250);
    const theirs = await a.waitFor('state', (m) => m.s.teams[1].wp !== undefined);
    expect(theirs.s.teams[1].wp).toBe(WORLD_WIDTH - 400);
    // Chỗ không hợp lệ (sát tượng địch) bị bỏ qua
    a.send({ t: 'wall', x: WORLD_WIDTH - 300 });
    await a.waitFor('state', (m) => m.s.time > mine.s.time + 0.5);
    expect(a.msgs.filter((m) => m.t === 'state').at(-1)!.s.teams[0].wp).toBeUndefined();
  }, 15000);

  it('đầu hàng thì đối thủ thắng', async () => {
    const a = await connect('A');
    const b = await connect('B');
    a.send({ t: 'quick' });
    await a.waitFor('room');
    b.send({ t: 'quick' });
    await b.waitFor('start');
    a.send({ t: 'surrender' });
    expect((await a.waitFor('end')).result).toBe('lose');
    const end = await b.waitFor('end');
    expect(end).toMatchObject({ result: 'win', reason: 'surrender' });

    // Đấu lại khi cả hai đồng ý
    a.send({ t: 'rematch' });
    b.send({ t: 'rematch' });
    await a.waitFor('start', () => a.msgs.filter((m) => m.t === 'start').length === 2);
  }, 15000);

  it('rớt mạng giữa trận thì người còn lại thắng', async () => {
    const a = await connect('A');
    const b = await connect('B');
    a.send({ t: 'quick' });
    await a.waitFor('room');
    b.send({ t: 'quick' });
    await b.waitFor('start');
    a.close();
    expect(await b.waitFor('end')).toMatchObject({ result: 'win', reason: 'disconnect' });
    await b.waitFor('left');
  }, 15000);

  it('phòng riêng vào bằng mã, mã sai báo lỗi', async () => {
    const a = await connect('Chủ phòng');
    const b = await connect('Khách');
    const c = await connect('Người thứ ba');
    a.send({ t: 'create' });
    const room = await a.waitFor('waitroom');
    expect(room.you).toEqual({ role: 'player', host: true, seat: 0 });
    expect(room.code).toMatch(/^[A-Z0-9]{4}$/);

    b.send({ t: 'join', code: 'ZZZZ' });
    expect((await b.waitFor('error')).msg).toContain('ZZZZ');

    // Người chơi ghép nhanh không được vào phòng riêng
    c.send({ t: 'quick' });
    const cRoom = await c.waitFor('room');
    expect(cRoom.code).not.toBe(room.code);

    b.send({ t: 'join', code: room.code.toLowerCase() });
    // Phòng tạo không tự vào trận: chờ khách sẵn sàng và chủ phòng bắt đầu
    expect((await begin(a, b)).opponent).toBe('Chủ phòng');
    expect((await a.waitFor('start')).opponent).toBe('Khách');
  }, 15000);

  it('phòng chờ: đổi tộc được, hai người chơi không thấy tộc của nhau, người xem thấy cả hai', async () => {
    const a = await connect('Chủ');
    const b = await connect('Khách');
    const w = await connect('Xem');
    a.send({ t: 'create' });
    const { code } = await a.waitFor('waitroom');
    b.send({ t: 'join', code, as: 'play' });
    await b.waitFor('waitroom', (m) => !!m.seats[1]);
    w.send({ t: 'join', code, as: 'watch' });
    a.send({ t: 'faction', id: 'orc' });
    b.send({ t: 'faction', id: 'elf' });
    const ra = await a.waitFor('waitroom', (m) => m.seats[0]?.faction === 'orc' && !!m.seats[1]);
    expect(ra.seats[1]?.faction).toBeNull();
    const rb = await b.waitFor('waitroom', (m) => m.seats[1]?.faction === 'elf');
    expect(rb.seats[0]?.faction).toBeNull();
    const rw = await w.waitFor('waitroom', (m) => m.seats[0]?.faction === 'orc' && m.seats[1]?.faction === 'elf');
    expect(rw.you.role).toBe('watcher');
    // Vào trận thì mỗi bên dùng đúng tộc đã chọn
    expect((await begin(a, b)).factions).toEqual(['elf', 'orc']);
  }, 15000);

  it('chọn được tộc thêm sau (frost, dwarf); lệnh xây thợ xây kèm chỗ (client cũ) vẫn được nhận', async () => {
    const a = await connect('Chủ');
    const b = await connect('Khách');
    a.send({ t: 'create' });
    const { code } = await a.waitFor('waitroom');
    b.send({ t: 'join', code, as: 'play' });
    a.send({ t: 'faction', id: 'frost' });
    b.send({ t: 'faction', id: 'dwarf' });
    await a.waitFor('waitroom', (m) => m.seats[0]?.faction === 'frost');
    await b.waitFor('waitroom', (m) => m.seats[1]?.faction === 'dwarf');
    expect((await begin(a, b)).factions).toEqual(['dwarf', 'frost']);
    await b.waitFor('state', (m) => m.s.time > 0.2, 8000);
    // Client cũ còn gửi x (chỗ dựng tháp): server bỏ qua, vẫn xây thợ xây
    (b as unknown as { send: (m: unknown) => void }).send({ t: 'train', kind: 'dwarf-builder', x: 3000 });
    await b.waitFor('state', (m) => m.s.teams[0].queue.length === 1);
  }, 15000);

  it('làm sạch tên và bỏ qua tin nhắn rác', async () => {
    const a = await connect('<script>alert(1)</script>Kẻ xấu có cái tên rất là dài');
    const b = await connect('B');
    (a as unknown as { send: (m: unknown) => void }).send({ t: 'train', kind: 'dragon' });
    a.send({ t: 'quick' });
    await a.waitFor('room');
    b.send({ t: 'quick' });
    const start = await b.waitFor('start');
    expect(start.opponent).not.toMatch(/[<>]/);
    expect(start.opponent.length).toBeLessThanOrEqual(16);
  }, 15000);
  it('vào phòng đang đấu thì được hỏi xem, người xem thấy cả hai bên nhưng không ra lệnh được', async () => {
    const a = await connect('An');
    const b = await connect('Bình');
    const c = await connect('Khán giả');
    a.send({ t: 'create' });
    const { code } = await a.waitFor('waitroom');
    b.send({ t: 'join', code, as: 'play' });
    await begin(a, b);

    // Phòng đủ 2 người: vào chơi bị từ chối kèm danh sách người chơi
    c.send({ t: 'join', code, as: 'play' });
    expect((await c.waitFor('full')).players).toEqual(['An', 'Bình']);

    c.send({ t: 'join', code, as: 'watch' });
    expect((await c.waitFor('spectate')).players).toEqual(['An', 'Bình']);
    expect((await a.waitFor('watchers', (m) => m.n === 1)).n).toBe(1);
    const { s } = await c.waitFor('state');
    expect(s.teams[0].gold).toBeGreaterThanOrEqual(0);
    expect(s.teams[1].gold).toBeGreaterThanOrEqual(0); // người xem thấy vàng cả hai bên
    // Quân của An (team 0) ở bên trái
    for (const u of s.units.filter((x) => x[2] === 0)) expect(u[3]).toBeLessThan(WORLD_WIDTH / 2);

    // Người xem không đầu hàng / xây quân thay được
    await c.waitFor('state', (m) => m.s.time > 0.2, 8000);
    c.send({ t: 'surrender' });
    c.send({ t: 'train', kind: 'sword' });
    await c.waitFor('state', (m) => m.s.time > 0.6);
    expect(c.msgs.some((m) => m.t === 'end')).toBe(false);

    b.send({ t: 'surrender' });
    expect(await c.waitFor('end')).toMatchObject({ result: 'win', winner: 'An', reason: 'surrender' });

    // Đánh xong cả phòng về phòng chờ; chủ phòng bắt đầu trận mới thì người xem được xem tiếp
    expect(await c.waitFor('waitroom')).toMatchObject({ you: { role: 'watcher', host: false, seat: null } });
    b.send({ t: 'ready', on: true });
    await a.waitFor('waitroom', (m) => !!m.seats[1]?.ready);
    a.send({ t: 'begin' });
    await c.waitFor('spectate', () => c.msgs.filter((m) => m.t === 'spectate').length === 2);
  }, 20000);

  it('người xem ngồi vào ghế trống; hai người chơi rời thì người xem còn lại thành chủ phòng', async () => {
    const a = await connect('Chủ');
    const w = await connect('Xem');
    a.send({ t: 'create' });
    const { code } = await a.waitFor('waitroom');
    w.send({ t: 'join', code, as: 'watch' });
    expect(await w.waitFor('waitroom')).toMatchObject({ code, watchers: ['Xem'], seats: [{ name: 'Chủ', host: true }, null] });

    // Ghế còn trống: người xem ngồi vào, sẵn sàng, chủ phòng bắt đầu
    w.send({ t: 'seat', as: 'play' });
    expect((await begin(a, w)).opponent).toBe('Chủ');
    expect((await a.waitFor('watchers', (m) => m.n === 0)).n).toBe(0);

    const v = await connect('Xem 2');
    v.send({ t: 'join', code, as: 'watch' });
    await v.waitFor('spectate');
    a.close();
    w.close();
    expect((await v.waitFor('waitroom', (m) => m.host === 'Xem 2')).you.host).toBe(true);
    v.close();
  }, 15000);

  it('Đấu trường liệt kê các phòng', async () => {
    const a = await connect('A');
    const b = await connect('B');
    const l = await connect('Sảnh');
    a.send({ t: 'quick' });
    await a.waitFor('room');
    l.send({ t: 'lobby', on: true });
    const first = await l.waitFor('lobby');
    expect(first.rooms).toHaveLength(1);
    expect(first.rooms[0]).toMatchObject({ state: 'waiting', players: ['A'], private: false });

    b.send({ t: 'quick' });
    await b.waitFor('start');
    const next = await l.waitFor('lobby', (m) => m.rooms[0]?.players.length === 2, 5000);
    expect(next.rooms[0].state).not.toBe('waiting');

    // Ở trong phòng thì không nhận danh sách nữa
    expect(a.msgs.some((m) => m.t === 'lobby')).toBe(false);
  }, 15000);
  describe('Thưởng xu', () => {
    const WALLET = 'wallet-thuong-xu-0001';

    it('thắng màn chiến dịch: sao mới được xu, chơi lại không nhận lại, phải thắng màn trước, đủ 99 sao thêm thưởng', async () => {
      const a = await connect('A', WALLET);
      const start = (await a.waitFor('wallet')).xu;
      const gains = () => a.msgs.filter((m) => m.t === 'wallet' && m.gain).map((m) => (m as { gain: number }).gain);
      a.send({ t: 'campaignWin', faction: 'dragon', level: 0, stars: 2 });
      expect((await a.waitFor('wallet', (m) => !!m.gain)).xu).toBe(start + 2 * XU_PER_STAR);
      a.send({ t: 'campaignWin', faction: 'dragon', level: 0, stars: 2 }); // chơi lại, không thêm sao
      a.send({ t: 'campaignWin', faction: 'dragon', level: 5, stars: 3 }); // nhảy cóc màn
      a.send({ t: 'campaignWin', faction: 'dragon', level: 0, stars: 3 }); // thêm 1 sao
      await a.waitFor('wallet', () => gains().length === 2);
      expect(gains()).toEqual([2 * XU_PER_STAR, XU_PER_STAR]);
      for (let i = 1; i < LEVELS.length; i++) a.send({ t: 'campaignWin', faction: 'dragon', level: i, stars: 3 });
      const last = await a.waitFor('wallet', () => gains().length === LEVELS.length + 1);
      expect(last.gain).toBe(3 * XU_PER_STAR + XU_PERFECT_TAB);
      expect(last.xu).toBe(start + LEVELS.length * 3 * XU_PER_STAR + XU_PERFECT_TAB);
      // Dữ liệu rác bị bỏ qua
      a.send({ t: 'campaignWin', faction: 'nope' as never, level: 0, stars: 3 });
      a.send({ t: 'campaignWin', faction: 'elf', level: 0, stars: 9 });
      a.send({ t: 'ping', c: 1 });
      await a.waitFor('pong');
      expect(gains()).toHaveLength(LEVELS.length + 1);
    }, 15000);

    it('trận online quá ngắn thì không thưởng xu', async () => {
      const a = await connect('A', 'wallet-thuong-xu-000a');
      const b = await connect('B', 'wallet-thuong-xu-000b');
      a.send({ t: 'quick' });
      await a.waitFor('room');
      b.send({ t: 'quick' });
      await b.waitFor('start');
      a.send({ t: 'surrender' });
      expect((await b.waitFor('end')).reward).toBeUndefined();
    }, 15000);

    it('thua chơi đơn được xu an ủi, tối đa một lần mỗi phút', async () => {
      const a = await connect('A', WALLET);
      const start = (await a.waitFor('wallet')).xu;
      a.send({ t: 'soloLose' });
      expect((await a.waitFor('wallet', (m) => !!m.gain)).xu).toBe(start + SOLO_LOSE_XU);
      a.send({ t: 'soloLose' }); // ngay sau: không nhận
      a.send({ t: 'ping', c: 2 });
      await a.waitFor('pong');
      expect(a.msgs.filter((m) => m.t === 'wallet' && m.gain)).toHaveLength(1);
    }, 15000);

    it('trận online đủ dài: người thắng nhận xu, người thua không nhận', async () => {
      await server.close();
      server = await startGameServer({ pvpXuMinSeconds: 0 });
      const a = await connect('A', 'wallet-thuong-xu-000a');
      const b = await connect('B', 'wallet-thuong-xu-000b');
      const before = (await b.waitFor('wallet')).xu;
      a.send({ t: 'quick' });
      await a.waitFor('room');
      b.send({ t: 'quick' });
      await b.waitFor('start');
      a.send({ t: 'surrender' });
      expect((await b.waitFor('end')).reward).toBe(PVP_XU.win);
      expect((await b.waitFor('wallet', (m) => !!m.gain)).xu).toBe(before + PVP_XU.win);
      expect((await a.waitFor('end')).reward).toBeUndefined();
    }, 15000);
  });

  describe('Bắt kèo', () => {
    const W = (n: number) => `test-wallet-${String(n).padStart(8, '0')}`;

    /** Phòng riêng có An (trái) vs Bình (phải) đang đấu và các người xem. */
    async function matchWithWatchers(...names: string[]) {
      const a = await connect('An', W(1));
      const b = await connect('Bình', W(2));
      a.send({ t: 'create' });
      const { code } = await a.waitFor('waitroom');
      b.send({ t: 'join', code, as: 'play' });
      await begin(a, b);
      const watchers: TestClient[] = [];
      for (const [i, n] of names.entries()) {
        const w = await connect(n, W(10 + i));
        w.send({ t: 'join', code, as: 'watch' });
        await w.waitFor('pool');
        watchers.push(w);
      }
      return { a, b, watchers };
    }

    it('người xem cược hai bên, bên thắng ăn quỹ của bên thua theo tỉ lệ', async () => {
      const { a, b, watchers } = await matchWithWatchers('X', 'Y', 'Z');
      const [x, y, z] = watchers;
      expect((await x.waitFor('wallet')).xu).toBe(1000);
      x.send({ t: 'bet', side: 0, amount: 300 });
      y.send({ t: 'bet', side: 0, amount: 100 });
      z.send({ t: 'bet', side: 1, amount: 200 });
      expect((await x.waitFor('wallet', (m) => m.xu === 700)).xu).toBe(700);
      const pool = await z.waitFor('pool', (m) => m.counts[0] === 2 && m.counts[1] === 1);
      expect(pool).toMatchObject({ open: true, totals: [400, 200], mine: { side: 1, amount: 200 } });

      // Cược lần hai và người chơi tự cược đều bị từ chối
      x.send({ t: 'bet', side: 1, amount: 50 });
      expect((await x.waitFor('error')).msg).toContain('đã bắt kèo');
      a.send({ t: 'bet', side: 0, amount: 50 });
      expect((await a.waitFor('error')).msg).toContain('người xem');

      b.send({ t: 'surrender' }); // An (bên 0) thắng
      // X: 300 + 300/400*200 = 450, Y: 100 + 50 = 150, Z mất 200
      expect(await x.waitFor('betResult')).toMatchObject({ outcome: 'win', payout: 450, xu: 1150 });
      expect(await y.waitFor('betResult')).toMatchObject({ outcome: 'win', payout: 150, xu: 1050 });
      expect(await z.waitFor('betResult')).toMatchObject({ outcome: 'lose', payout: 0, xu: 800 });
    }, 20000);

    it('chỉ một bên có người cược thì hoàn tiền; không đủ xu bị từ chối', async () => {
      const { b, watchers } = await matchWithWatchers('X');
      const [x] = watchers;
      x.send({ t: 'bet', side: 1, amount: 5000 });
      expect((await x.waitFor('error')).msg).toContain('Không đủ xu');
      x.send({ t: 'bet', side: 1, amount: 400 });
      await x.waitFor('wallet', (m) => m.xu === 600);
      b.send({ t: 'surrender' });
      expect(await x.waitFor('betResult')).toMatchObject({ outcome: 'refund', payout: 400, xu: 1000 });
    }, 20000);

    it('khoá kèo sau thời gian cho phép', async () => {
      await server.close();
      server = await startGameServer({ betSeconds: 0.3 });
      const { watchers } = await matchWithWatchers('X');
      const [x] = watchers;
      await x.waitFor('pool', (m) => !m.open, 8000);
      x.send({ t: 'bet', side: 0, amount: 100 });
      expect((await x.waitFor('error')).msg).toContain('khoá kèo');
    }, 20000);

    it('ví xu được lưu vào kho và nạp lại sau khi khởi động lại máy chủ', async () => {
      const wallets = new MemoryWalletStore();
      const stores = { accounts: new MemoryAccountStore(), wallets };
      await server.close();
      server = await startGameServer({ stores });
      const { b, watchers } = await matchWithWatchers('X', 'Y');
      watchers[0].send({ t: 'bet', side: 0, amount: 100 });
      watchers[1].send({ t: 'bet', side: 1, amount: 100 });
      await watchers[1].waitFor('pool', (m) => m.counts[1] === 1);
      b.send({ t: 'surrender' });
      await watchers[0].waitFor('betResult');
      clients.splice(0).forEach((c) => c.close());
      await server.close();
      expect(Object.fromEntries(wallets.data)).toMatchObject({ [W(10)]: 1100, [W(11)]: 900 });

      server = await startGameServer({ stores });
      const again = await connect('X', W(10));
      expect((await again.waitFor('wallet')).xu).toBe(1100);
    }, 20000);
  });
  describe('Phòng chờ', () => {
    async function room2() {
      const a = await connect('Chủ');
      const b = await connect('Khách', 'test-wallet-guest-0001');
      a.send({ t: 'create' });
      const { code } = await a.waitFor('waitroom');
      b.send({ t: 'join', code, as: 'play' });
      await a.waitFor('waitroom', (m) => m.seats[1]?.name === 'Khách');
      return { a, b, code };
    }

    it('chỉ chủ phòng bắt đầu được, và khách phải sẵn sàng', async () => {
      const { a, b } = await room2();
      b.send({ t: 'begin' });
      expect((await b.waitFor('error')).msg).toContain('chủ phòng');
      a.send({ t: 'begin' });
      expect((await a.waitFor('error')).msg).toContain('chưa sẵn sàng');
      expect(a.msgs.some((m) => m.t === 'start')).toBe(false);
    }, 15000);

    it('chủ phòng đổi luật thì khách phải sẵn sàng lại, luật áp vào trận', async () => {
      const { a, b } = await room2();
      b.send({ t: 'ready', on: true });
      await a.waitFor('waitroom', (m) => !!m.seats[1]?.ready);
      a.send({ t: 'settings', gold: 1000, minutes: 10 });
      const wr = await b.waitFor('waitroom', (m) => m.settings.gold === 1000);
      expect(wr.settings).toEqual({ gold: 1000, minutes: 10 });
      expect(wr.seats[1]?.ready).toBe(false);
      a.send({ t: 'settings', gold: 99999, minutes: 10 }); // giá trị lạ bị bỏ qua
      expect((await begin(a, b)).minutes).toBe(10);
      const { s } = await b.waitFor('state');
      expect(s.teams[0].gold).toBe(1000);
    }, 15000);

    it('mời ra khỏi phòng thì không vào lại được; chủ phòng rời thì chuyển quyền', async () => {
      const { a, b, code } = await room2();
      const w = await connect('Xem');
      w.send({ t: 'join', code, as: 'watch' });
      await w.waitFor('waitroom');
      a.send({ t: 'kick', seat: 1 });
      await b.waitFor('kicked');
      b.send({ t: 'join', code, as: 'play' });
      expect((await b.waitFor('error')).msg).toContain('mời bạn ra');
      expect(await w.waitFor('waitroom', (m) => m.seats[1] === null)).toBeTruthy();

      a.close();
      const wr = await w.waitFor('waitroom', (m) => m.host === 'Xem');
      expect(wr.you.host).toBe(true);
      expect(wr.seats).toEqual([null, null]);
    }, 15000);

    it('chat trong phòng, người mới vào nhận lịch sử chat', async () => {
      const { a, b, code } = await room2();
      a.send({ t: 'chat', text: '  xin\nchào  <b>bạn</b> ' });
      expect((await b.waitFor('chat', (m) => m.line.kind === 'player')).line).toEqual({
        from: 'Chủ',
        text: 'xin chào <b>bạn</b>',
        kind: 'player',
      });
      const w = await connect('Xem');
      w.send({ t: 'join', code, as: 'watch' });
      const log = await w.waitFor('chatLog');
      expect(log.lines.some((l) => l.text === 'xin chào <b>bạn</b>')).toBe(true);
    }, 15000);

    it('cược ngay từ phòng chờ; đổi người chơi thì hoàn kèo', async () => {
      const { a, b, code } = await room2();
      const w = await connect('Xem', 'test-wallet-watch-0001');
      w.send({ t: 'join', code, as: 'watch' });
      expect(await w.waitFor('pool')).toMatchObject({ open: true });
      w.send({ t: 'bet', side: 1, amount: 300 });
      // Người chơi cũng thấy quỹ kèo
      expect((await a.waitFor('pool', (m) => m.totals[1] === 300)).mine).toBeNull();

      b.send({ t: 'seat', as: 'watch' }); // khách đứng dậy: cặp đấu đổi, hoàn tiền
      expect(await w.waitFor('betResult')).toMatchObject({ outcome: 'refund', payout: 300, xu: 1000 });
      expect(await w.waitFor('pool', (m) => !m.open)).toBeTruthy();
    }, 15000);
  });
  describe('Thoại', () => {
    it('vào thoại, chuyển tin bắt tay đúng người, tắt mic và rời phòng cập nhật danh sách', async () => {
      const a = await connect('An');
      const b = await connect('Bình');
      const c = await connect('Chưa vào thoại');
      a.send({ t: 'create' });
      const { code } = await a.waitFor('waitroom');
      b.send({ t: 'join', code, as: 'play' });
      c.send({ t: 'join', code, as: 'watch' });
      await c.waitFor('waitroom');

      a.send({ t: 'voice', on: true });
      b.send({ t: 'voice', on: true });
      const pb = await b.waitFor('voicePeers', (m) => m.peers.length === 2 && m.you !== null);
      const aId = pb.peers.find((x) => x.name === 'An')!.id;
      const bId = pb.you!;
      expect(pb.peers.every((x) => x.muted)).toBe(true);
      // Người chưa vào thoại vẫn thấy ai đang nói chuyện, nhưng không có mã thoại
      expect((await c.waitFor('voicePeers', (m) => m.peers.length === 2)).you).toBeNull();

      const offer = { description: { type: 'offer', sdp: 'v=0 test' } };
      a.send({ t: 'signal', to: bId, data: offer });
      expect(await b.waitFor('signal')).toEqual({ t: 'signal', from: aId, data: offer });

      // Không vào thoại thì không gửi được tin bắt tay
      c.send({ t: 'signal', to: aId, data: offer });
      b.send({ t: 'voiceMute', muted: false });
      await a.waitFor('voicePeers', (m) => m.peers.some((x) => x.name === 'Bình' && !x.muted));
      expect(a.msgs.filter((m) => m.t === 'signal')).toHaveLength(0);

      b.close();
      expect((await a.waitFor('voicePeers', (m) => m.peers.length === 1)).peers[0].name).toBe('An');
    }, 15000);
  });
});
