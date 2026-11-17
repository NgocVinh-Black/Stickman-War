# Đại Chiến Người Que

Game chiến thuật người que: đào vàng, xây quân, chỉ huy đội quân phá tượng địch. 8 tộc, chơi đơn và online 1v1.

**Công nghệ**

| Phần | Công nghệ |
|---|---|
| Frontend (`apps/web`) | **Vue 3** (Composition API, `<script setup>`) + **Vite** + **TypeScript** + **Pinia** + **Vue Router**; trận đánh vẽ bằng **Canvas 2D**, âm thanh WebAudio, thoại WebRTC, PWA |
| Backend (`apps/server`) | **NestJS** (adapter **Fastify**) + WebSocket (`ws`) + **Prisma** + **PostgreSQL**, kiểm tra dữ liệu bằng **Zod**, token Google bằng **jose**, helmet + rate-limit |
| Lõi game (`packages/core`) | TypeScript thuần dùng chung cho web và máy chủ: mô phỏng trận, 8 tộc, AI, màn chơi, giao thức online |
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
./deploy.sh         # kiểm tra + build + đẩy web và máy chủ (Docker) lên https://zone-c.io.vn/nguoi-que/
```

Chuyển dữ liệu bản cũ (file `data/wallets.json`, `data/accounts.json`) sang Postgres: `pnpm db:import`.

## Cấu trúc

```
packages/core/src/      Lõi game (không DOM, không Node)
  units.ts              khung quân gốc, sinh 96 loại quân cho 8 tộc, bảng khắc chế, kỳ cựu
  factions.ts           dữ liệu 8 tộc: nội tại, khắc tộc, tên / chỉ số / hình dáng từng quân
  world.ts              mô phỏng: kinh tế, đội hình, đánh, đạn, hiệu ứng, tháp, triệu hồi
  ai.ts, levels.ts      AI và 8 màn chiến dịch × 3 độ khó
  protocol.ts           tin nhắn WebSocket, ảnh chụp trạng thái
apps/web/src/
  views/                LoginView, LobbyView (+ lobby/*Tab.vue), GameView, RoomView
  components/           AppDialog, FactionPicker, BetPanel, VoicePanel, UnitIcon, BgBattle…
  stores/               Pinia: settings, ui, game (phiên chơi + HUD), online (kết nối, phòng, kèo)
  game/                 match (trận cục bộ / online), session (vòng lặp), camera, render/ (Canvas)
  net/                  account (đăng nhập Google), remote (client WebSocket), voice (WebRTC)
apps/server/src/
  game/                 lobby.service (phòng, ghép trận, chạy trận 30 tick/s, kèo, chat, thoại), game.gateway (WebSocket)
  api/                  api.controller (config, auth/google, me, leaderboard, health), zod.pipe
  accounts/, wallets/   tài khoản + Elo + lịch sử, ví xu (cache trong bộ nhớ, ghi dồn xuống DB)
  store/                kho dữ liệu: Prisma (Postgres) và bộ nhớ (test)
  prisma/schema.prisma  bảng Account, Session, Wallet, MatchRecord
```

Máy chủ chạy chính bộ mô phỏng `packages/core` (server-authoritative): client chỉ gửi lệnh và vẽ lại ảnh chụp trạng thái 15 lần/giây.
NestJS được đóng gói bằng esbuild (tsup / tsx) nên mọi phụ thuộc trong constructor được tiêm bằng `@Inject(TOKEN)` tường minh.

## Chế độ chơi

- **Chơi đơn**: chiến dịch 8 màn ở 3 mức Dễ / Thường / Khó (mỗi màn một tộc địch), đấu với máy (máy chọn tộc ngẫu nhiên).
- **Online 1v1**: tìm trận nhanh, hoặc tạo phòng gửi mã / link `?room=MÃ`. Phòng chờ có 2 ghế, người xem, luật phòng, chat, kèo.
- **Đấu trường**: danh sách phòng đang mở (chơi / xem) và bảng xếp hạng Elo.
- **Bắt kèo**: người xem cược xu ảo 🪙 (không phải tiền thật) trong 60 giây đầu trận.
- **Thoại**: WebRTC giữa các trình duyệt, máy chủ chỉ chuyển tin bắt tay.
- **Tài khoản Google**: điểm Elo, lịch sử trận, ví xu theo tài khoản. Chỉ lưu mã Google, tên, ảnh đại diện; không lưu email.

## Cách chơi

- 8 tộc × 12 loại quân (phím `1`–`9`, `0`, `-`, `=`), mỗi tộc có nội tại và khắc 2 tộc (+20% sát thương).
- Khắc chế kiểu đòn × kiểu giáp (`DAMAGE_TABLE`): giáo đâm kỵ ×2, tên vào khổng lồ ×1.5, phép đốt giáp nặng ×1.3…
- Đội hình (`F`): Tự do / Hàng lối / Tản rộng. Mỏ giữa (`R`). Lệnh: Rút về `Q` · Phòng thủ `W` · Tấn công `E`.
- Thợ xây dựng tối đa 3 tháp canh; cờ hiệu tăng sức đánh quân quanh mình; quân kỳ cựu lên ★ khi hạ đủ địch.

## Bật đăng nhập Google

1. https://console.cloud.google.com/ → **APIs & Services → OAuth consent screen** (External, điền tên app, Publish).
2. **Credentials → Create credentials → OAuth client ID** loại **Web application**,
   *Authorized JavaScript origins*: `http://localhost:5173` và `https://zone-c.io.vn`.
3. Đặt `GOOGLE_CLIENT_ID` trong `apps/server/.env` (dev) hoặc `/srv/nguoi-que-online/.env` (server).

## Deploy

`docker-compose.yml` chạy Postgres + máy chủ (migration tự chạy khi khởi động). File `.env` cạnh nó cần `POSTGRES_PASSWORD`
(và `GOOGLE_CLIENT_ID`). Web tĩnh do nginx phục vụ; `nginx-nguoi-que.conf` chuyển `/nguoi-que/ws` và `/nguoi-que/api/` vào container.

Chỉnh độ khó / cân bằng: `packages/core/src/levels.ts`, `factions.ts`, rồi `pnpm test` để chắc mọi màn vẫn thắng được.
