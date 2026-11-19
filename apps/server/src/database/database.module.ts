import { Inject, Injectable, Module, type DynamicModule, type OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ACCOUNT_STORE, WALLET_STORE, type ServerOptions } from '../common/tokens';
import { PrismaAccountStore, PrismaWalletStore } from './prisma.store';

const PRISMA = Symbol('PrismaClient');

/** Đóng kết nối Postgres khi tắt máy chủ. */
@Injectable()
class PrismaLifecycle implements OnModuleDestroy {
  constructor(@Inject(PRISMA) private readonly db: PrismaClient | null) {}

  async onModuleDestroy(): Promise<void> {
    await this.db?.$disconnect();
  }
}

/** Nơi lưu dữ liệu (dùng chung toàn app): test truyền kho trong bộ nhớ, chạy thật dùng PostgreSQL qua Prisma. */
@Module({})
export class DatabaseModule {
  static forRoot(stores: ServerOptions['stores']): DynamicModule {
    return {
      module: DatabaseModule,
      global: true,
      providers: [
        { provide: PRISMA, useFactory: () => (stores ? null : new PrismaClient()) },
        {
          provide: ACCOUNT_STORE,
          inject: [PRISMA],
          useFactory: (db: PrismaClient | null) => stores?.accounts ?? new PrismaAccountStore(db!),
        },
        {
          provide: WALLET_STORE,
          inject: [PRISMA],
          useFactory: (db: PrismaClient | null) => stores?.wallets ?? new PrismaWalletStore(db!),
        },
        PrismaLifecycle,
      ],
      exports: [ACCOUNT_STORE, WALLET_STORE],
    };
  }
}
