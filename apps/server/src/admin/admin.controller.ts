import {
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  HttpCode,
  Inject,
  NotFoundException,
  Param,
  Post,
  Query,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { z } from 'zod';
import { accountWallet } from '../accounts/accounts.service';
import { ZodPipe } from '../api/zod.pipe';
import { LobbyService } from '../game/lobby.service';
import { ACCOUNT_SORTS, type AccountStore } from '../store/types';
import { ACCOUNT_STORE } from '../tokens';
import { WalletsService } from '../wallets/wallets.service';
import { AdminService, type AdminWho } from './admin.service';

const PAGE_SIZE = 25;
const TokenLogin = z.object({ token: z.string().min(1).max(256) });
const ListQuery = z.object({
  q: z.string().trim().max(64).optional().default(''),
  sort: z.enum(ACCOUNT_SORTS).optional().default('createdAt'),
  page: z.coerce.number().int().min(1).max(10_000).optional().default(1),
});

const bearer = (header?: string) => /^Bearer (\S+)$/.exec(header ?? '')?.[1] ?? '';

/** API trang admin: chỉ đọc (danh sách tài khoản, chi tiết, thống kê). */
@Controller('api/admin')
export class AdminController {
  constructor(
    @Inject(AdminService) private readonly admin: AdminService,
    @Inject(ACCOUNT_STORE) private readonly store: AccountStore,
    @Inject(WalletsService) private readonly wallets: WalletsService,
    @Inject(LobbyService) private readonly lobby: LobbyService,
  ) {}

  /** Trang admin hỏi được dùng cách đăng nhập nào. */
  @Get('config')
  config() {
    return { google: this.admin.googleEnabled, token: this.admin.tokenEnabled };
  }

  @Post('login')
  @HttpCode(200)
  login(@Body(new ZodPipe(TokenLogin)) body: z.infer<typeof TokenLogin>) {
    const out = this.admin.loginWithToken(body.token);
    if ('session' in out) return out;
    if (out.error === 'disabled') throw new ServiceUnavailableException({ error: 'Máy chủ chưa đặt ADMIN_TOKEN' });
    if (out.error === 'locked') throw new ForbiddenException({ error: 'Sai mã quá nhiều lần, thử lại sau 15 phút' });
    throw new UnauthorizedException({ error: 'Sai mã quản trị' });
  }

  @Post('logout')
  @HttpCode(200)
  logout(@Headers('authorization') auth?: string) {
    this.admin.logout(bearer(auth));
    return { ok: true };
  }

  @Get('me')
  async me(@Headers('authorization') auth?: string) {
    return { who: await this.require(auth) };
  }

  @Get('stats')
  async stats(@Headers('authorization') auth?: string) {
    await this.require(auth);
    return { ...(await this.store.adminStats(new Date())), online: this.lobby.stats() };
  }

  @Get('accounts')
  async accounts(@Headers('authorization') auth: string | undefined, @Query(new ZodPipe(ListQuery)) query: z.infer<typeof ListQuery>) {
    await this.require(auth);
    const { total, rows } = await this.store.listAccounts({
      q: query.q,
      sort: query.sort,
      offset: (query.page - 1) * PAGE_SIZE,
      limit: PAGE_SIZE,
    });
    const withXu = await Promise.all(rows.map(async (r) => ({ ...r, xu: await this.wallets.peek(accountWallet(r.id)) })));
    return { total, page: query.page, pageSize: PAGE_SIZE, accounts: withXu };
  }

  @Get('accounts/:id')
  async account(@Headers('authorization') auth: string | undefined, @Param('id') id: string) {
    await this.require(auth);
    if (!/^g\d{1,40}$/.test(id)) throw new NotFoundException({ error: 'Không có tài khoản này' });
    const a = await this.store.adminAccount(id);
    if (!a) throw new NotFoundException({ error: 'Không có tài khoản này' });
    const [history, sessions, xu] = await Promise.all([
      this.store.history(id, 50),
      this.store.sessionsOf(id),
      this.wallets.peek(accountWallet(id)),
    ]);
    return { account: { ...a, xu }, history, sessions };
  }

  private async require(auth?: string): Promise<AdminWho> {
    const who = await this.admin.who(bearer(auth));
    if (!who) throw new UnauthorizedException({ error: 'Cần đăng nhập quản trị' });
    return who;
  }
}
