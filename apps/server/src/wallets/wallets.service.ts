import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import { OPTIONS, WALLET_STORE, type ServerOptions } from '../common/tokens';
import type { WalletStore } from '../database/store.types';

export const START_XU = 1000;
/** Cháy túi (dưới mức này) thì được cấp lại RELIEF_XU khi kết nối. */
export const BROKE_XU = 50;
export const RELIEF_XU = 200;
const FLUSH_EVERY_MS = 3000;

/** Mã ví do trình duyệt tự sinh và giữ trong localStorage. */
export const validWalletId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(id);

/**
 * Ví xu ảo bắt kèo. Số dư nằm trong bộ nhớ để vòng lặp trận đọc / ghi đồng bộ,
 * nạp từ DB khi người chơi kết nối (ensure) và ghi dồn xuống DB vài giây một lần.
 * Ví tạm "tmp-…" (kết nối không có mã ví) không lưu.
 */
@Injectable()
export class WalletsService implements OnModuleDestroy {
  private balances = new Map<string, number>();
  private dirty = new Set<string>();
  private timer: NodeJS.Timeout;

  constructor(
    @Inject(WALLET_STORE) private readonly store: WalletStore,
    @Inject(OPTIONS) private readonly opts: ServerOptions,
  ) {
    this.timer = setInterval(() => void this.flush(), FLUSH_EVERY_MS);
  }

  /** Nạp ví từ DB vào bộ nhớ (gọi khi người chơi chào máy chủ). */
  async ensure(id: string): Promise<void> {
    if (this.balances.has(id) || id.startsWith('tmp-')) return;
    const xu = await this.store.load(id);
    if (!this.balances.has(id)) this.balances.set(id, xu ?? START_XU);
  }

  /** Số dư để xem (trang admin): lấy trong bộ nhớ nếu có, không thì đọc DB, không nạp vào bộ nhớ. */
  async peek(id: string): Promise<number> {
    return this.balances.get(id) ?? (await this.store.load(id)) ?? START_XU;
  }

  get(id: string): number {
    return this.balances.get(id) ?? START_XU;
  }

  add(id: string, delta: number): number {
    const xu = Math.max(0, this.get(id) + delta);
    this.balances.set(id, xu);
    if (!id.startsWith('tmp-')) this.dirty.add(id);
    return xu;
  }

  relief(id: string): void {
    if (this.get(id) < BROKE_XU) this.add(id, RELIEF_XU - this.get(id));
  }

  async flush(): Promise<void> {
    if (!this.dirty.size) return;
    const ids = [...this.dirty];
    this.dirty.clear();
    try {
      await this.store.saveMany(ids.map((id) => [id, this.get(id)]));
    } catch (e) {
      ids.forEach((id) => this.dirty.add(id));
      this.opts.log(`không lưu được ví xu: ${(e as Error).message}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    clearInterval(this.timer);
    await this.flush();
  }
}
