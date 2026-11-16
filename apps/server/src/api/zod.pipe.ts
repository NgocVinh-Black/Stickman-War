import { BadRequestException, type PipeTransform } from '@nestjs/common';
import type { ZodType } from 'zod';

/** Kiểm tra body bằng Zod; sai thì trả 400 kèm lý do. */
export class ZodPipe<T> implements PipeTransform<unknown, T> {
  constructor(private readonly schema: ZodType<T>) {}

  transform(value: unknown): T {
    const r = this.schema.safeParse(value ?? {});
    if (!r.success) throw new BadRequestException({ error: 'Dữ liệu không hợp lệ', issues: r.error.issues.map((i) => i.message) });
    return r.data;
  }
}
