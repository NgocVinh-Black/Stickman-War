import { startGameServer } from './game-server';

const port = Number(process.env.PORT ?? 8787);
const walletFile = process.env.WALLET_FILE ?? 'data/wallets.json';
const accountFile = process.env.ACCOUNT_FILE ?? 'data/accounts.json';
// Client ID OAuth "Web application" tạo ở Google Cloud Console; bỏ trống thì chỉ chơi khách
const googleClientId = process.env.GOOGLE_CLIENT_ID ?? '';
const server = await startGameServer(port, (msg) => console.log(new Date().toISOString(), msg), {
  walletFile,
  accountFile,
  googleClientId,
});
if (!googleClientId) console.log('Chưa đặt GOOGLE_CLIENT_ID: đăng nhập Google đang tắt');
console.log(`Đại Chiến Người Que — máy chủ online đang chạy ở cổng ${server.port}`);

const shutdown = () => void server.close().then(() => process.exit(0));
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
