import { startGameServer } from './bootstrap';

async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 8787);
  // Client ID OAuth "Web application" tạo ở Google Cloud Console; bỏ trống thì chỉ chơi khách
  const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';

  if (!process.env.DATABASE_URL) {
    console.error('Thiếu DATABASE_URL (xem apps/server/.env.example). Chạy Postgres dev bằng: pnpm db:up');
    process.exit(1);
  }

  const server = await startGameServer(port, {
    googleClientId,
    log: (msg) => console.log(new Date().toISOString(), msg),
  });
  console.log(`Đại Chiến Người Que — máy chủ NestJS đang chạy ở cổng ${server.port}`);
  if (!googleClientId) console.log('Chưa đặt GOOGLE_CLIENT_ID: đăng nhập Google đang tắt');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
