/**
 * Chuyển dữ liệu bản cũ (file JSON) sang PostgreSQL.
 *   pnpm db:import [đường-dẫn/wallets.json] [đường-dẫn/accounts.json]
 * Mặc định đọc data/wallets.json và data/accounts.json ở thư mục gốc repo.
 * Chạy lại nhiều lần không sao: ví và tài khoản được ghi đè theo id, phiên cũ chỉ thêm nếu chưa có.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';

type OldAccount = {
  id: string;
  name: string;
  picture: string;
  faction: string;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
  history: { at: number; vs: string; result: string; faction: string; vsFaction: string; rating: number }[];
  createdAt: number;
  lastSeen: number;
};

const root = resolve(import.meta.dirname, '../../..');
const walletFile = resolve(process.argv[2] ?? `${root}/data/wallets.json`);
const accountFile = resolve(process.argv[3] ?? `${root}/data/accounts.json`);
const db = new PrismaClient();

async function main(): Promise<void> {
  if (existsSync(walletFile)) {
    const wallets = JSON.parse(readFileSync(walletFile, 'utf8')) as Record<string, number>;
    const entries = Object.entries(wallets).filter(([id, xu]) => typeof xu === 'number' && xu >= 0 && !id.startsWith('tmp-'));
    for (const [id, xu] of entries)
      await db.wallet.upsert({ where: { id }, create: { id, xu: Math.floor(xu) }, update: { xu: Math.floor(xu) } });
    console.log(`Ví xu: ${entries.length} ví từ ${walletFile}`);
  } else console.log(`Bỏ qua ví: không có ${walletFile}`);

  if (existsSync(accountFile)) {
    const data = JSON.parse(readFileSync(accountFile, 'utf8')) as {
      accounts?: Record<string, OldAccount>;
      sessions?: Record<string, { id: string; exp: number }>;
    };
    const accounts = Object.values(data.accounts ?? {});
    for (const a of accounts) {
      const fields = {
        name: a.name,
        picture: a.picture ?? '',
        faction: a.faction ?? 'tribe',
        rating: a.rating ?? 1000,
        wins: a.wins ?? 0,
        losses: a.losses ?? 0,
        draws: a.draws ?? 0,
        lastSeen: new Date(a.lastSeen ?? Date.now()),
      };
      await db.account.upsert({
        where: { id: a.id },
        create: { id: a.id, googleSub: a.id.replace(/^g/, ''), createdAt: new Date(a.createdAt ?? Date.now()), ...fields },
        update: fields,
      });
      const existing = await db.matchRecord.count({ where: { accountId: a.id } });
      if (!existing && a.history?.length) {
        await db.matchRecord.createMany({
          data: a.history.map((h) => ({
            accountId: a.id,
            at: new Date(h.at),
            vs: h.vs,
            result: h.result,
            faction: h.faction,
            vsFaction: h.vsFaction,
            rating: h.rating,
          })),
        });
      }
    }
    const now = Date.now();
    const sessions = Object.entries(data.sessions ?? {}).filter(([, s]) => s.exp > now && accounts.some((a) => a.id === s.id));
    for (const [token, s] of sessions) {
      await db.session.upsert({ where: { token }, create: { token, accountId: s.id, expiresAt: new Date(s.exp) }, update: {} });
    }
    console.log(`Tài khoản: ${accounts.length}, phiên còn hạn: ${sessions.length} từ ${accountFile}`);
  } else console.log(`Bỏ qua tài khoản: không có ${accountFile}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());
