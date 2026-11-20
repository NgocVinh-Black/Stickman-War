# Stickman War

Game chiến thuật stickman: đào vàng, xây quân, chỉ huy đội quân phá tượng địch. 12 tộc, chơi đơn và online 1v1.

**Công nghệ**

| Phần | Công nghệ |
|---|---|
| Frontend (`apps/web`) | **Vue 3** (Composition API, `<script setup>`) + **Vite** + **TypeScript** + **Pinia** + **Vue Router**; trận đánh vẽ bằng **Canvas 2D**, âm thanh WebAudio, thoại WebRTC, PWA |
| Backend (`apps/server`) | **NestJS** (adapter **Fastify**) + WebSocket (`ws`) + **Prisma** + **PostgreSQL**, kiểm tra dữ liệu bằng **Zod**, token Google bằng **jose**, helmet + rate-limit |
| Trang admin (`apps/admin`) | **Vue 3** + **Rspack** (vue-loader, swc): xem tài khoản đã đăng ký, thống kê, lịch sử trận |
| Lõi game (`packages/core`) | TypeScript thuần dùng chung cho web và máy chủ: mô phỏng trận, 12 nền văn minh, AI, màn chơi, giao thức online |
| Đa ngôn ngữ (`packages/i18n`) | Tiếng Việt / English dùng chung cho web và admin (đổi trong ⚙️ Cài đặt) |
| Công cụ | **pnpm** workspace (monorepo), **Vitest**, **ESLint** + **Prettier**, **GitHub Actions**, **Docker Compose** |

## Chạy trên máy

Cần Node ≥ 22, pnpm (`corepack enable`), Docker (cho Postgres).

```bash
pnpm install
cp apps/server/.env.example apps/server/.env   # DATABASE_URL, GOOGLE_CLIENT_ID
pnpm db:up          # Postgres dev (Docker, cổng 5433)
pnpm db:migrate     # tạo / cập nhật bảng
pnpm dev            # máy chủ NestJS :8787 + web Vue http://localhost:5173 (proxy /ws, /api)

pnpm test           # test lõi game, web, máy chủ (test Postgres chạy khi có DATABASE_URL)
pnpm lint && pnpm typecheck && pnpm format:check
pnpm build          # web -> apps/web/dist, máy chủ -> apps/server/dist/main.cjs
./deploy.sh         # kiểm tra + build + đẩy web và máy chủ (Docker) lên https://zone-c.io.vn/stickman-war/
```

Chuyển dữ liệu bản cũ (file `data/wallets.json`, `data/accounts.json`) sang Postgres: `pnpm db:import`.

## Cấu trúc

```
packages/core/src/      Lõi game (không DOM, không Node)
packages/i18n/src/      Từ điển vi / en, nội dung game tiếng Anh, dịch chữ máy chủ
  units.ts              khung quân gốc, sinh 156 loại quân cho 12 tộc, bảng khắc chế, kỳ cựu
  factions.ts           dữ liệu 12 tộc: nội tại (12 cơ chế khác nhau), điểm yếu, cách đánh bại, tên / chỉ số / hình dáng từng quân
  world.ts              mô phỏng: kinh tế, đội hình, đánh, đạn, hiệu ứng, trạm vàng, triệu hồi
  ai.ts, levels.ts      AI và chiến dịch 3 vòng × 11 màn (mỗi tộc một chiến dịch)
  protocol.ts           tin nhắn WebSocket, ảnh chụp trạng thái
apps/web/src/
  views/                LoginView, LobbyView (+ lobby/*Tab.vue), GameView, RoomView
  components/           AppDialog, FactionPicker, BetPanel, VoicePanel, UnitIcon, BgBattle…
  stores/               Pinia: settings, ui, game (phiên chơi + HUD), online (kết nối, phòng, kèo)
  game/                 match (trận cục bộ / online), session (vòng lặp), camera, render/ (Canvas)
  net/                  account (đăng nhập Google), remote (client WebSocket), voice (WebRTC)
  lib/                  sound, storage, guide, faction (đổi tộc)
  styles/               index.css import theo thứ tự: base, menu, game, dialog, responsive, … lobby, login
apps/server/src/        mỗi tính năng một module Nest (*.module.ts), AppModule chỉ ghép lại
  common/               tokens (DI + ServerOptions), zod.pipe, bearer
  database/             DatabaseModule: kho Prisma (Postgres) hoặc kho bộ nhớ (test)
  accounts/, wallets/   tài khoản + Elo + lịch sử + /api/leaderboard; ví xu (cache bộ nhớ, ghi dồn xuống DB)
  auth/                 đăng nhập Google, /api/config, /api/me, /api/logout
  game/                 lobby.service (phòng, ghép trận, chạy trận 30 tick/s, chat, thoại), room (kiểu + hằng số),
                        bets (chia quỹ kèo), game.gateway (WebSocket)
  admin/                API trang admin /api/admin/* (chỉ đọc)
  health/               /health
  prisma/schema.prisma  bảng Account, Session, Wallet, MatchRecord
apps/admin/src/
  views/                LoginView, DashboardView
  components/           StatsCards, AccountsTable, AccountDrawer, Avatar
  lib/                  api (gọi /api/admin + phiên), google, format
  styles/               admin.css
```

Máy chủ chạy chính bộ mô phỏng `packages/core` (server-authoritative): client chỉ gửi lệnh và vẽ lại ảnh chụp trạng thái 15 lần/giây.
NestJS được đóng gói bằng esbuild (tsup / tsx) nên mọi phụ thuộc trong constructor được tiêm bằng `@Inject(TOKEN)` tường minh.

## Chế độ chơi

- **Chơi đơn**: chiến dịch chia 12 tab theo tộc: chơi đúng tộc đó qua 33 màn từ dễ tới khó, chia 3 vòng Làm quen / Chinh phạt / Thử thách, mỗi vòng gặp đủ 11 tộc còn lại; đấu với máy 3 mức Dễ / Thường / Khó (máy chọn tộc ngẫu nhiên).
- **Online 1v1**: tìm trận nhanh, hoặc tạo phòng gửi mã / link `?room=MÃ`. Phòng chờ có 2 ghế, người xem, luật phòng, chat, kèo.
- **Đấu trường**: danh sách phòng đang mở (chơi / xem) và bảng xếp hạng Elo.
- **Bắt kèo**: người xem cược xu ảo 🪙 (không phải tiền thật) trong 60 giây đầu trận.
- **Tường thành**: nút 🧱 (phím T) chọn chỗ ở nửa nhà (bóng xanh / đỏ), thợ mỏ đi ra dựng; quân nhà qua cổng, địch phải phá tường (công thành ×3). Mỗi nền văn minh một kiểu tường (gai, tự mọc lại, lửa, băng…).
- **Kiếm xu**: mỗi sao mới ở chiến dịch +10 xu, đủ 100★ một tộc +100 (máy chủ ghi sao đã thưởng theo ví nên chơi lại không cày được);
  online thắng +60 / hoà +30 / thua 0 nếu trận dài ≥ 2 phút; chơi đơn thua trận ≥ 2 phút +15 (máy chủ trả tối đa 1 lần / phút).
- **Thoại**: WebRTC giữa các trình duyệt, máy chủ chỉ chuyển tin bắt tay.
- **Tài khoản Google**: điểm Elo, lịch sử trận, ví xu theo tài khoản. Chỉ lưu mã Google, tên, ảnh đại diện; không lưu email.

## Cách chơi

- 12 tộc × 12 loại quân (phím `1`–`9`, `0`, `-`, `=`), mỗi tộc một nội tại riêng và một điểm yếu.
- Khắc chế kiểu đòn × kiểu giáp (`DAMAGE_TABLE`): giáo đâm kỵ ×2, tên vào khổng lồ ×1.5, phép đốt giáp nặng ×1.3…
- Đội hình (`F`): Tự do / Hàng lối / Tản rộng. Mỏ giữa (`R`). Lệnh: Rút về `Q` · Phòng thủ `W` · Tấn công `E`.
- Thợ xây dựng tối đa 2 trạm vàng ở chỗ cố định (thợ mỏ nộp vàng ở trạm, trạm bắn địch); cờ hiệu tăng sức đánh quân quanh mình; quân kỳ cựu lên ★ khi hạ đủ địch.

## Bật đăng nhập Google

1. https://console.cloud.google.com/ → **APIs & Services → OAuth consent screen** (External, điền tên app, Publish).
2. **Credentials → Create credentials → OAuth client ID** loại **Web application**,
   *Authorized JavaScript origins*: `http://localhost:5173` và `https://zone-c.io.vn`.
3. Đặt `GOOGLE_CLIENT_ID` trong `apps/server/.env` (dev) hoặc `/srv/stickman-war-online/.env` (server).

## Trang admin

`pnpm dev` chạy cả trang admin ở http://localhost:5174 (riêng: `pnpm dev:admin`); khi deploy nằm ở `https://zone-c.io.vn/stickman-war/admin/`.
Chỉ xem (không sửa / xoá): danh sách tài khoản (tìm, sắp xếp, phân trang), thống kê, chi tiết từng tài khoản
(mã Google, ngày đăng ký, lần cuối vào, Elo, thắng / thua, xu, phiên đăng nhập còn hạn, 50 trận gần nhất).

Đặt trong `apps/server/.env` (hoặc `.env` trên server) rồi chạy lại máy chủ:

- `ADMIN_EMAILS=ban@gmail.com` — tài khoản Google có email này (đã xác minh) được vào. Email chỉ dùng để so lúc đăng nhập, không lưu.
  Khi chạy local cần thêm `http://localhost:5174` vào *Authorized JavaScript origins* của Client ID.
- `ADMIN_TOKEN=<≥ 16 ký tự>` — vào bằng mã bí mật, không cần Google (tạo: `openssl rand -hex 24`). Sai 10 lần trong 15 phút thì khoá 15 phút.

## Deploy

`docker-compose.yml` chạy Postgres + máy chủ (migration tự chạy khi khởi động). File `.env` cạnh nó cần `POSTGRES_PASSWORD`
(và `GOOGLE_CLIENT_ID`). Web tĩnh do nginx phục vụ; `nginx-stickman-war.conf` chuyển `/stickman-war/ws` và `/stickman-war/api/` vào container.

Chỉnh độ khó / cân bằng: `packages/core/src/levels.ts`, `factions.ts`, rồi `pnpm test` để chắc mọi màn vẫn thắng được.
