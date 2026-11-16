import { Module, type DynamicModule, type OnModuleDestroy, Inject, Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { AccountsService } from './accounts/accounts.service';
import { AdminController } from './admin/admin.controller';
import { AdminService } from './admin/admin.service';
import { ApiController, HealthController } from './api/api.controller';
import { GameGateway } from './game/game.gateway';
import { LobbyService } from './game/lobby.service';
import { PrismaAccountStore, PrismaWalletStore } from './store/prisma.store';
import { ACCOUNT_STORE, OPTIONS, WALLET_STORE, type ServerOptions } from './tokens';
import { WalletsService } from './wallets/wallets.service';

const PRISMA = Symbol('PrismaClient');

/** Đóng kết nối Postgres khi tắt máy chủ. */
@Injectable()
class PrismaLifecycle implements OnModuleDestroy {
  constructor(@Inject(PRISMA) private readonly db: PrismaClient | null) {}

  async onModuleDestroy(): Promise<void> {
    await this.db?.$disconnect();
  }
}

@Module({})
export class AppModule {
  /** Dựng module với tuỳ chọn: test truyền kho trong bộ nhớ, chạy thật dùng Postgres. */
  static forRoot(opts: ServerOptions): DynamicModule {
    return {
      module: AppModule,
      controllers: [ApiController, HealthController, AdminController],
      providers: [
        { provide: OPTIONS, useValue: opts },
        { provide: PRISMA, useFactory: () => (opts.stores ? null : new PrismaClient()) },
        {
          provide: ACCOUNT_STORE,
          inject: [PRISMA],
          useFactory: (db: PrismaClient | null) => opts.stores?.accounts ?? new PrismaAccountStore(db!),
        },
        {
          provide: WALLET_STORE,
          inject: [PRISMA],
          useFactory: (db: PrismaClient | null) => opts.stores?.wallets ?? new PrismaWalletStore(db!),
        },
        PrismaLifecycle,
        WalletsService,
        AccountsService,
        AdminService,
        LobbyService,
        GameGateway,
      ],
    };
  }
}
