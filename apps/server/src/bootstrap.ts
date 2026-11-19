import 'reflect-metadata';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, type NestFastifyApplication } from '@nestjs/platform-fastify';
import { AppModule } from './app.module';
import { LobbyService } from './game/lobby.service';
import type { ServerOptions } from './common/tokens';

export type GameServer = {
  port: number;
  app: NestFastifyApplication;
  stats: () => { players: number; rooms: number };
  close: () => Promise<void>;
};

/**
 * Dựng và chạy máy chủ (dùng cho main.ts và test).
 * Đường dẫn có tiền tố (/stickman-war/api/…, /stickman-war/health sau nginx) được đưa về /api/…, /health.
 */
export async function startGameServer(port: number, opts: Partial<ServerOptions> = {}): Promise<GameServer> {
  const options: ServerOptions = { googleClientId: '', log: () => {}, ...opts };
  const adapter = new FastifyAdapter({
    bodyLimit: 8 * 1024,
    rewriteUrl: (req: { url?: string }) => {
      const url = req.url ?? '/';
      const api = url.lastIndexOf('/api/');
      if (api > 0) return url.slice(api);
      const path = url.split('?')[0];
      return path.endsWith('/health') ? '/health' : url;
    },
  });
  const app = await NestFactory.create<NestFastifyApplication>(AppModule.forRoot(options), adapter, {
    logger: ['error', 'warn'],
  });
  await app.register(helmet, { contentSecurityPolicy: false });
  // Chống spam API (đăng nhập, hồ sơ); WebSocket có giới hạn riêng trong LobbyService
  await app.register(rateLimit, { max: 120, timeWindow: '1 minute' });
  app.enableShutdownHooks();
  await app.listen(port, '0.0.0.0');
  const address = app.getHttpServer().address();
  const lobby = app.get(LobbyService);
  return {
    port: typeof address === 'object' && address ? address.port : port,
    app,
    stats: () => lobby.stats(),
    close: () => app.close(),
  };
}
