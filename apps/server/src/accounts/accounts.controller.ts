import { Controller, Get, Inject } from '@nestjs/common';
import { AccountsService } from './accounts.service';

/** API công khai về tài khoản: bảng xếp hạng. */
@Controller('api')
export class AccountsController {
  constructor(@Inject(AccountsService) private readonly accounts: AccountsService) {}

  @Get('leaderboard')
  async leaderboard() {
    return { players: await this.accounts.leaderboard() };
  }
}
