import type { IncomingMessage } from 'node:http';
import type { Duplex } from 'node:stream';
import { Inject, Injectable, type OnApplicationBootstrap, type OnApplicationShutdown } from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { WebSocketServer } from 'ws';
import { LobbyService } from './lobby.service';

const MAX_PAYLOAD = 16 * 1024;

/**
 * Cổng WebSocket của game, gắn vào chính máy chủ HTTP của Nest (chung cổng với API).
 * Nhận mọi đường dẫn kết thúc bằng /ws (/ws khi dev, /nguoi-que/ws sau nginx).
 * Giao thức tin nhắn riêng của game ({ t: ... }) nên dùng ws trực tiếp thay vì @WebSocketGateway.
 */
@Injectable()
export class GameGateway implements OnApplicationBootstrap, OnApplicationShutdown {
  private readonly wss = new WebSocketServer({ noServer: true, maxPayload: MAX_PAYLOAD });

  constructor(
    @Inject(HttpAdapterHost) private readonly adapterHost: HttpAdapterHost,
    @Inject(LobbyService) private readonly lobby: LobbyService,
  ) {}

  onApplicationBootstrap(): void {
    const server = this.adapterHost.httpAdapter.getHttpServer() as import('node:http').Server;
    server.on('upgrade', (req: IncomingMessage, socket: Duplex, head: Buffer) => {
      const path = (req.url ?? '').split('?')[0];
      if (!path.endsWith('/ws')) {
        socket.destroy();
        return;
      }
      this.wss.handleUpgrade(req, socket, head, (ws) => this.lobby.connect(ws));
    });
  }

  onApplicationShutdown(): void {
    this.wss.close();
  }
}
