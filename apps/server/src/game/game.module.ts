import { Module } from '@nestjs/common';
import { AccountsModule } from '../accounts/accounts.module';
import { WalletsModule } from '../wallets/wallets.module';
import { GameGateway } from './game.gateway';
import { LobbyService } from './lobby.service';

/** Online: cổng WebSocket, phòng, ghép trận, chạy trận, kèo, chat, thoại. */
@Module({
  imports: [AccountsModule, WalletsModule],
  providers: [LobbyService, GameGateway],
  exports: [LobbyService],
})
export class GameModule {}
