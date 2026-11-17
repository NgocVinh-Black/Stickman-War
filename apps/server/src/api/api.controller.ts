import { Body, Controller, Get, Headers, HttpCode, Inject, Post, ServiceUnavailableException, UnauthorizedException } from '@nestjs/common';
import { FACTION_ORDER, type AccountInfo } from '@nguoi-que/core';
import { z } from 'zod';
import { AccountsService, accountWallet } from '../accounts/accounts.service';
import { googleKeys, verifyGoogleIdToken } from '../auth/google-auth';
import { LobbyService } from '../game/lobby.service';
import { OPTIONS, type ServerOptions } from '../tokens';
import { WalletsService } from '../wallets/wallets.service';
import { ZodPipe } from './zod.pipe';

const GoogleLogin = z.object({ credential: z.string().min(1).max(4096) });
const ProfilePatch = z.object({
  name: z.string().max(64).optional(),
  faction: z.enum(FACTION_ORDER as [string, ...string[]]).optional(),
});

const bearer = (header?: string) => /^Bearer (\S+)$/.exec(header ?? '')?.[1] ?? '';

/** API tài khoản: cấu hình, đăng nhập Google, hồ sơ, bảng xếp hạng. */
@Controller('api')
export class ApiController {
  private readonly keys = googleKeys();

  constructor(
    @Inject(OPTIONS) private readonly opts: ServerOptions,
    @Inject(AccountsService) private readonly accounts: AccountsService,
    @Inject(WalletsService) private readonly wallets: WalletsService,
    @Inject(LobbyService) private readonly lobby: LobbyService,
  ) {}

  @Get('config')
  config() {
    return { googleClientId: this.opts.googleClientId };
  }

  @Get('leaderboard')
  async leaderboard() {
    return { players: await this.accounts.leaderboard() };
  }

  @Post('auth/google')
  @HttpCode(200)
  async google(@Body(new ZodPipe(GoogleLogin)) body: z.infer<typeof GoogleLogin>) {
    if (!this.opts.googleClientId && !this.opts.verifyGoogle) {
      throw new ServiceUnavailableException({ error: 'Máy chủ chưa bật đăng nhập Google' });
    }
    try {
      const profile = this.opts.verifyGoogle
        ? await this.opts.verifyGoogle(body.credential)
        : await verifyGoogleIdToken(body.credential, this.opts.googleClientId, this.keys);
      const out = await this.accounts.signIn(profile);
      this.opts.log(`login ${out.account.id}`);
      return out;
    } catch (e) {
      this.opts.log(`login failed: ${(e as Error).message}`);
      throw new UnauthorizedException({ error: 'Đăng nhập Google không hợp lệ' });
    }
  }

  @Post('logout')
  @HttpCode(200)
  async logout(@Headers('authorization') auth?: string) {
    await this.accounts.signOut(bearer(auth));
    return { ok: true };
  }

  @Get('me')
  async me(@Headers('authorization') auth?: string) {
    const me = await this.requireMe(auth);
    const wallet = accountWallet(me.id);
    await this.wallets.ensure(wallet);
    return { account: me, xu: this.wallets.get(wallet) };
  }

  @Post('me')
  @HttpCode(200)
  async updateMe(@Headers('authorization') auth: string | undefined, @Body(new ZodPipe(ProfilePatch)) body: z.infer<typeof ProfilePatch>) {
    const me = await this.requireMe(auth);
    const account = await this.accounts.update(me.id, { name: body.name, faction: body.faction as AccountInfo['faction'] | undefined });
    if (account) this.lobby.renameAccount(me.id, account.name);
    return { account };
  }

  private async requireMe(auth?: string): Promise<AccountInfo> {
    const me = await this.accounts.bySession(bearer(auth));
    if (!me) throw new UnauthorizedException({ error: 'Chưa đăng nhập' });
    return me;
  }
}

@Controller()
export class HealthController {
  constructor(@Inject(LobbyService) private readonly lobby: LobbyService) {}

  @Get('health')
  health() {
    return { ok: true, ...this.lobby.stats() };
  }
}
