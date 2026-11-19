import { Module, type DynamicModule } from '@nestjs/common';
import { AccountsModule } from './accounts/accounts.module';
import { AdminModule } from './admin/admin.module';
import { AuthModule } from './auth/auth.module';
import { OPTIONS, type ServerOptions } from './common/tokens';
import { DatabaseModule } from './database/database.module';
import { GameModule } from './game/game.module';
import { HealthController } from './health/health.controller';
import { WalletsModule } from './wallets/wallets.module';

@Module({})
export class AppModule {
  /** Dựng app với tuỳ chọn (OPTIONS dùng chung mọi module): test truyền kho trong bộ nhớ, chạy thật dùng Postgres. */
  static forRoot(opts: ServerOptions): DynamicModule {
    return {
      module: AppModule,
      global: true,
      imports: [DatabaseModule.forRoot(opts.stores), WalletsModule, AccountsModule, GameModule, AdminModule, AuthModule],
      controllers: [HealthController],
      providers: [{ provide: OPTIONS, useValue: opts }],
      exports: [OPTIONS],
    };
  }
}
