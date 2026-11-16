import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

export const START_XU = 1000;
/** Cháy túi (dưới mức này) thì được cấp lại RELIEF_XU khi kết nối. */
export const BROKE_XU = 50;
export const RELIEF_XU = 200;
const SAVE_EVERY_MS = 5000;

/** Mã ví do trình duyệt tự sinh và giữ trong localStorage. */
export const validWalletId = (id: unknown): id is string => typeof id === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(id);

/**
 * Ví xu ảo dùng để bắt kèo. Chỉ ví đã từng đổi số dư mới được lưu,
 * ghi ra file JSON định kỳ (ghi file tạm rồi đổi tên để không hỏng khi tắt ngang).
 */
export class Wallets {
  private balances = new Map<string, number>();
  private dirty = false;
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly file?: string) {
    if (!file) return;
    try {
      const data = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
      for (const [id, xu] of Object.entries(data)) if (typeof xu === 'number' && xu >= 0) this.balances.set(id, xu);
    } catch {
      // Chưa có file hoặc file hỏng: bắt đầu ví mới
    }
    this.timer = setInterval(() => this.flush(), SAVE_EVERY_MS);
  }

  get(id: string): number {
    return this.balances.get(id) ?? START_XU;
  }

  add(id: string, delta: number): number {
    const xu = Math.max(0, this.get(id) + delta);
    this.balances.set(id, xu);
    this.dirty = true;
    return xu;
  }

  relief(id: string): void {
    if (this.get(id) < BROKE_XU) this.add(id, RELIEF_XU - this.get(id));
  }

  flush(): void {
    if (!this.file || !this.dirty) return;
    try {
      mkdirSync(dirname(this.file), { recursive: true });
      const tmp = `${this.file}.tmp`;
      // Ví tạm theo kết nối (không có mã ví) mất khi ngắt, không cần lưu
      const saved = [...this.balances].filter(([id]) => !id.startsWith('tmp-'));
      writeFileSync(tmp, JSON.stringify(Object.fromEntries(saved)));
      renameSync(tmp, this.file);
      this.dirty = false;
    } catch (err) {
      console.error('Không lưu được ví xu:', err);
    }
  }

  close(): void {
    if (this.timer) clearInterval(this.timer);
    this.flush();
  }
}
