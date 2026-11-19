import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { GameModule } from '../game/game.module';
import { WalletsModule } from '../wallets/wallets.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

/** Trang admin: quyền vào (email Google / mã bí mật) và API chỉ đọc /api/admin/*. */
@Module({
  imports: [AccountsModule, WalletsModule, GameModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports: [AdminService],
})
export class AdminModule {}
