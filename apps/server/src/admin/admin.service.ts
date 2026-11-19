import { randomBytes, timingSafeEqual } from 'node:crypto';
import { Inject, Injectable } from '@nestjs/common';
import { AccountsService } from '../accounts/accounts.service';
import { OPTIONS, type ServerOptions } from '../common/tokens';

const TOKEN_SESSION_MS = 12 * 3_600_000;
const FAIL_WINDOW_MS = 15 * 60_000;
const MAX_FAILS = 10;
const MIN_TOKEN = 16;

export type AdminWho = { via: 'google'; id: string; name: string; picture: string } | { via: 'token' };

/**
 * Ai được vào trang admin:
 * - tài khoản Google có email nằm trong ADMIN_EMAILS (kiểm tra lúc đăng nhập, cờ isAdmin lưu ở tài khoản);
 * - hoặc người nhập đúng ADMIN_TOKEN (dự phòng khi chưa bật Google). Phiên mã giữ trong bộ nhớ 12 giờ.
 * Sai mã quá 10 lần trong 15 phút thì khoá đăng nhập bằng mã 15 phút.
 */
@Injectable()
export class AdminService {
  private readonly emails: Set<string>;
  private readonly tokenSessions = new Map<string, number>();
  private fails: number[] = [];

  constructor(
    @Inject(OPTIONS) private readonly opts: ServerOptions,
    @Inject(AccountsService) private readonly accounts: AccountsService,
  ) {
    this.emails = new Set((opts.adminEmails ?? []).map((e) => e.trim().toLowerCase()).filter(Boolean));
  }

  get tokenEnabled(): boolean {
    return (this.opts.adminToken ?? '').length >= MIN_TOKEN;
  }

  get googleEnabled(): boolean {
    return this.emails.size > 0;
  }

  isAdminEmail(email?: string): boolean {
    return !!email && this.emails.has(email.toLowerCase());
  }

  /** Đăng nhập bằng mã bí mật; trả phiên hoặc lý do bị từ chối. */
  loginWithToken(given: string, now = Date.now()): { session: string } | { error: 'disabled' | 'locked' | 'wrong' } {
    if (!this.tokenEnabled) return { error: 'disabled' };
    this.fails = this.fails.filter((t) => now - t < FAIL_WINDOW_MS);
    if (this.fails.length >= MAX_FAILS) return { error: 'locked' };
    const a = Buffer.from(given);
    const b = Buffer.from(this.opts.adminToken!);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      this.fails.push(now);
      return { error: 'wrong' };
    }
    const session = `adm_${randomBytes(24).toString('base64url')}`;
    this.tokenSessions.set(session, now + TOKEN_SESSION_MS);
    return { session };
  }

  logout(session: string): void {
    this.tokenSessions.delete(session);
  }

  /** Ai đang gọi (theo phiên Bearer), null nếu không phải admin. */
  async who(session: string, now = Date.now()): Promise<AdminWho | null> {
    if (!session) return null;
    if (session.startsWith('adm_')) {
      const exp = this.tokenSessions.get(session);
      if (!exp || exp < now || !this.tokenEnabled) {
        this.tokenSessions.delete(session);
        return null;
      }
      return { via: 'token' };
    }
    // Bỏ hết ADMIN_EMAILS là thu hồi quyền admin Google ngay, không cần chờ đăng nhập lại
    if (!this.googleEnabled) return null;
    const a = await this.accounts.adminBySession(session);
    return a ? { via: 'google', id: a.id, name: a.name, picture: a.picture } : null;
  }
}
