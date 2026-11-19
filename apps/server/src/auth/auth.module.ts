import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { AdminModule } from '../admin/admin.module';
import { GameModule } from '../game/game.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AuthController } from './auth.controller';

/** Đăng nhập Google và hồ sơ người chơi (/api/config, /api/auth/google, /api/logout, /api/me). */
@Module({
  imports: [AccountsModule, WalletsModule, GameModule, AdminModule],
  controllers: [AuthController],
})
export class AuthModule {}
