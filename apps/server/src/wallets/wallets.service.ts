import { Inject, Injectable, type OnModuleDestroy } from '@nestjs/common';
import {
  FACTION_ORDER,
  LEVELS,
  SOLO_LOSE_GAP_SECONDS,
  SOLO_LOSE_XU,
  XU_PERFECT_TAB,
  XU_PER_STAR,
  type FactionId,
} from '@stickman-war/core';
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
  /** Sao chiến dịch đã thưởng theo ví: "tộc:màn" → số sao (nạp từ DB lần đầu cần). */
  private stars = new Map<string, Map<string, number>>();
  /** Lần cuối trả xu thua chơi đơn theo ví (ms). */
  private lastSoloLose = new Map<string, number>();
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

  /**
   * Thắng màn chiến dịch: thưởng XU_PER_STAR cho mỗi sao mới (chơi lại không nhận lại), đủ 3 sao mọi màn
   * của tộc thì thêm XU_PERFECT_TAB. Phải đã thắng màn trước đó mới nhận màn sau. Trả về số xu vừa cộng.
   */
  async claimCampaign(id: string, faction: unknown, level: unknown, stars: unknown): Promise<number> {
    if (id.startsWith('tmp-')) return 0;
    if (!FACTION_ORDER.includes(faction as FactionId)) return 0;
    if (!Number.isInteger(level) || (level as number) < 0 || (level as number) >= LEVELS.length) return 0;
    if (!Number.isInteger(stars) || (stars as number) < 1 || (stars as number) > 3) return 0;
    const lv = level as number;
    const st = stars as number;
    let got = this.stars.get(id);
    if (!got) {
      const rows = await this.store.campaignStars(id);
      got = this.stars.get(id) ?? new Map(rows.map((r) => [`${r.faction}:${r.level}`, r.stars]));
      this.stars.set(id, got);
    }
    if (lv > 0 && !got.get(`${faction}:${lv - 1}`)) return 0;
    const key = `${faction}:${lv}`;
    const prev = got.get(key) ?? 0;
    if (st <= prev) return 0;
    const full = LEVELS.length * 3;
    const total = () => LEVELS.reduce((sum, _, i) => sum + (got.get(`${faction}:${i}`) ?? 0), 0);
    const before = total();
    got.set(key, st);
    await this.store.setCampaignStars(id, { faction: faction as FactionId, level: lv, stars: st });
    const gain = (st - prev) * XU_PER_STAR + (before < full && total() >= full ? XU_PERFECT_TAB : 0);
    await this.ensure(id);
    this.add(id, gain);
    return gain;
  }

  /** Thua trận chơi đơn: SOLO_LOSE_XU, tối đa một lần mỗi SOLO_LOSE_GAP_SECONDS cho mỗi ví. Trả về số xu vừa cộng. */
  async claimSoloLose(id: string, now = Date.now()): Promise<number> {
    if (id.startsWith('tmp-')) return 0;
    if (now - (this.lastSoloLose.get(id) ?? -Infinity) < SOLO_LOSE_GAP_SECONDS * 1000) return 0;
    this.lastSoloLose.set(id, now);
    await this.ensure(id);
    this.add(id, SOLO_LOSE_XU);
    return SOLO_LOSE_XU;
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
