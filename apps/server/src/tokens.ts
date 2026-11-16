import type { GoogleProfile } from './auth/google-auth';
import type { AccountStore, WalletStore } from './store/types';

/**
 * Token DI. Máy chủ được đóng gói bằng esbuild (tsup / tsx) nên không có metadata kiểu
 * của decorator: mọi tham số constructor đều tiêm bằng @Inject(TOKEN) tường minh.
 */
export const OPTIONS = Symbol('ServerOptions');
export const ACCOUNT_STORE = Symbol('AccountStore');
export const WALLET_STORE = Symbol('WalletStore');

export type ServerOptions = {
  /** Client ID OAuth Google; rỗng = tắt đăng nhập Google. */
  googleClientId: string;
  /** Số giây đầu trận còn được bắt kèo (test dùng số nhỏ). */
  betSeconds?: number;
  /** Thay bộ kiểm tra token Google (test). */
  verifyGoogle?: (credential: string) => Promise<GoogleProfile>;
  /** Ghi log ngắn (phòng, đăng nhập…). */
  log: (msg: string) => void;
  /** Email Google được vào trang admin (so lúc đăng nhập, không lưu email). */
  adminEmails?: string[];
  /** Mã bí mật vào trang admin không cần Google (≥ 16 ký tự); rỗng = tắt. */
  adminToken?: string;
  /** Nơi lưu dữ liệu; bỏ trống = PostgreSQL qua Prisma (DATABASE_URL). */
  stores?: { accounts: AccountStore; wallets: WalletStore };
};
