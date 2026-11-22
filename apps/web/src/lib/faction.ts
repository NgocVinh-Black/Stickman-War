import type { FactionId } from '@stickman-war/core';
import { auth, updateProfile } from '../net/account';
import { useOnline } from '../stores/online';
import { useSettings } from '../stores/settings';

/** Đổi hệ người chơi: lưu máy, báo máy chủ (phòng chờ thấy ngay) và lưu vào tài khoản nếu đã đăng nhập. */
export function chooseFaction(id: FactionId): void {
  useSettings().faction = id;
  useOnline().send({ t: 'faction', id });
  if (auth.account) void updateProfile({ faction: id }).catch(() => {});
}
