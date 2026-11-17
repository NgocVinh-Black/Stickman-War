import type { FactionId, MatchRecord } from '@stickman-war/core';
import type { GoogleProfile } from '../auth/google-auth';

export type AccountRow = {
  id: string;
  googleSub: string;
  name: string;
  picture: string;
  faction: FactionId;
  rating: number;
  wins: number;
  losses: number;
  draws: number;
};

/** Kết quả một trận cho một tài khoản: cộng thắng/thua, đổi điểm, ghi lịch sử. */
export type MatchEntry = {
  accountId: string;
  result: MatchRecord['result'];
  ratingDelta: number;
  vs: string;
  faction: FactionId;
  vsFaction: FactionId;
};

/** Kho tài khoản + phiên đăng nhập + lịch sử trận (Postgres khi chạy thật, bộ nhớ khi test). */
export interface AccountStore {
  /** Tạo tài khoản lần đầu đăng nhập; lần sau chỉ cập nhật ảnh đại diện + lần cuối vào. */
  upsertGoogle(profile: GoogleProfile, name: string): Promise<AccountRow>;
  get(id: string): Promise<AccountRow | null>;
  update(id: string, patch: { name?: string; faction?: FactionId }): Promise<AccountRow | null>;
  createSession(token: string, accountId: string, expiresAt: Date): Promise<void>;
  /** Tài khoản của phiên còn hạn, không thì null. */
  sessionAccount(token: string): Promise<AccountRow | null>;
  deleteSession(token: string): Promise<void>;
  applyMatch(entries: MatchEntry[]): Promise<void>;
  history(accountId: string, limit: number): Promise<MatchRecord[]>;
  leaderboard(limit: number): Promise<AccountRow[]>;
}

/** Kho ví xu ảo. */
export interface WalletStore {
  load(id: string): Promise<number | null>;
  saveMany(entries: [string, number][]): Promise<void>;
}
