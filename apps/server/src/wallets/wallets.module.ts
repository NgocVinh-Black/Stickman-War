import { Module } from '@nestjs/common';
import { WalletsService } from './wallets.service';

/** Ví xu ảo bắt kèo. */
@Module({
  providers: [WalletsService],
  exports: [WalletsService],
})
export class WalletsModule {}
