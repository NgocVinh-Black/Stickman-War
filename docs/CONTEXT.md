# Ngữ cảnh phát triển: Stickman War

Tài liệu bàn giao để tiếp tục phát triển ở phiên làm việc mới. Đọc file này trước, sau đó đọc `README.md`.

- Repo: https://github.com/NgocVinh-Black/Stickman-War (nhánh `main`, **Public**)
- Thư mục máy: `/home/vinh-le/Projects/stickman-war`
- Bản chạy thật (chưa deploy bản Vue + NestJS): https://zone-c.io.vn/stickman-war/ qua `./deploy.sh`

## 1. Quy ước làm việc với chủ dự án

- Giao tiếp **tiếng Việt**. Tên, chữ trong game đều tiếng Việt.
- Commit: **không thêm dòng `Co-Authored-By` / ghi công AI**. Lời commit viết **tiếng Anh**.
- Tác giả commit trong repo này: `NgocVinh-Black <145645281+NgocVinh-Black@users.noreply.github.com>`
  (đã đặt bằng `git config` cục bộ của repo; không dùng email công ty).
- Repo public: không commit bí mật, `.env`, thư mục `data/` (ví xu, tài khoản cũ), file build.
- Chủ dự án thích xem kết quả chạy thật trên trình duyệt; sau thay đổi lớn chạy `pnpm lint && pnpm typecheck && pnpm test && pnpm build`.

## 2. Công nghệ (từ 2026-11-16, bản 2.0)

- **Monorepo pnpm** (pnpm 12 qua corepack): `packages/core`, `apps/web`, `apps/server`.
- **FE** `apps/web`: Vue 3 + Vite 8 + TypeScript + Pinia 4 + Vue Router 5 (hash history `#/…` để chạy dưới `/stickman-war/`).
  Trận đánh vẫn vẽ bằng Canvas 2D (`src/game/render`).
- **BE** `apps/server`: NestJS 12 (adapter Fastify 5) + `ws` + Prisma 6 + PostgreSQL 16, Zod, jose, helmet, rate-limit.
  Đóng gói bằng tsup (esbuild) → `dist/main.cjs`; dev bằng `tsx watch`. Vì esbuild không sinh metadata decorator,
  **mọi tham số constructor phải dùng `@Inject(TOKEN)` tường minh** (token trong `src/common/tokens.ts`).
  Mỗi tính năng một module Nest (`accounts`, `wallets`, `auth`, `game`, `admin`, `database`), `AppModule.forRoot` chỉ ghép lại.
- **Admin** `apps/admin`: Vue 3 + **Rspack** 2 (vue-loader, builtin:swc-loader), cổng dev 5174, gọi API qua `../api/`.
  Cấu trúc: `views/` (trang), `components/`, `lib/` (api, google, format), `styles/`.
  API `apps/server/src/admin/*` (chỉ đọc), quyền: `ADMIN_EMAILS` (cờ `Account.isAdmin` đặt lại mỗi lần đăng nhập Google) hoặc `ADMIN_TOKEN`.
- **Lõi game** `packages/core`: TS thuần, export từ `src/index.ts`, được web (Vite) và server (tsup gộp vào bundle) dùng trực tiếp.
- Test: Vitest (core 47, web 4, server 31 gồm test Postgres thật khi có `DATABASE_URL`, admin 3). ESLint 10 + Prettier 3. CI: `.github/workflows/ci.yml`.

## 3. Chạy dự án

```bash
pnpm install
cp apps/server/.env.example apps/server/.env
pnpm db:up && pnpm db:migrate    # Postgres dev (Docker, container stickman-war-db-dev, cổng 5433)
pnpm dev                          # NestJS :8787 + Vue :5173
pnpm db:import                    # chuyển data/wallets.json + data/accounts.json (bản cũ) sang Postgres
```

Test máy chủ dùng kho trong bộ nhớ (`MemoryAccountStore`, `MemoryWalletStore`) nên không cần Postgres;
`test/prisma.store.test.ts` chỉ chạy khi có `DATABASE_URL` (nạp `.env` trước: `set -a; . apps/server/.env; set +a`).

## 4. Kiến trúc

| Chỗ | Vai trò |
|---|---|
| `packages/core/src/units.ts` | Khung quân (`Arch`), chỉ số gốc `BASE`, `DAMAGE_TABLE`, sinh `UNITS` cho 12 tộc, `kindOf`, `roster`, `TRAIN_KEYS` |
| `packages/core/src/factions.ts` | Dữ liệu 12 nền văn minh = **12 hệ** (Quang, Phong, Mộc, Ám, Lôi, Huyết, Tinh thể, Thạch, Kim, Thủy, Hỏa, Băng; id cũ `tribe`…`frost` giữ nguyên): nội tại (kỷ luật, cuồng phong, hồi máu, thu hồn, lôi kích, huyết nộ, mạch tinh thể, thân đá, lò rèn, thủy triều, lửa rồng, giá lạnh), điểm yếu, cách đánh bại, tên / chỉ số / hình dáng (`look`, đầu theo hệ) |
| `packages/core/src/world.ts` | Mô phỏng: kinh tế, đội hình, đánh, đạn, hiệu ứng, trạm vàng (`depotX`, thợ mỏ nộp ở trạm), triệu hồi, túi vàng, mỏ giữa, kỳ cựu |
| `packages/core/src/protocol.ts` | Tin nhắn WebSocket (`ClientMsg`, `ServerMsg`), ảnh chụp trạng thái, `AccountInfo` |
| `apps/web/src/stores/game.ts` | Phiên chơi (`GameSession`), HUD reactive, chiến dịch / đấu máy, thắng thua, tạm dừng |
| `apps/web/src/stores/online.ts` | Kết nối, xử lý mọi `ServerMsg`, phòng chờ, kèo, chat, thoại, trận online / xem |
| `apps/web/src/stores/ui.ts` | Hộp thoại dựng từ dữ liệu (`AppDialog.vue`, không dùng v-html) + toast |
| `apps/web/src/stores/settings.ts` | Tên, tộc, tiến độ chiến dịch (localStorage), tab sảnh, chơi khách |
| `apps/web/src/views/*` | `LoginView` (ảnh `public/bg-desktop.*`, `public/bg-mobile.*`, `public/logo.*`), `LobbyView` + `lobby/*Tab.vue`, `GameView`, `RoomView` |
| `apps/server/src/game/lobby.service.ts` | Phòng, ghép trận, chạy trận 30 tick/s, kèo, chat, thoại; mỗi kết nối xử lý tin theo hàng đợi. Kiểu + hằng số ở `room.ts`, chia quỹ kèo ở `bets.ts` |
| `apps/server/src/game/game.gateway.ts` | Nhận upgrade WebSocket ở mọi đường dẫn kết thúc `/ws` trên server HTTP của Nest |
| `apps/server/src/admin/*` | API trang admin `/api/admin/*` (config, login bằng mã, me, stats, accounts, accounts/:id) |
| `apps/server/src/auth/auth.controller.ts` | `/api/config`, `/api/auth/google`, `/api/me` (GET/POST), `/api/logout` |
| `apps/server/src/accounts/accounts.controller.ts`, `health/health.controller.ts` | `/api/leaderboard`, `/health` |
| `apps/server/src/database/*` | `DatabaseModule`: kho Prisma (`prisma.store.ts`) hoặc kho bộ nhớ cho test (`memory.store.ts`) |
| `apps/web/src/styles/index.css` | Import mọi file CSS theo đúng thứ tự (base → … → lobby → login) |
| `apps/server/src/bootstrap.ts` | `startGameServer(port, opts)`: dựng Nest + Fastify, `rewriteUrl` bỏ tiền tố `/stickman-war` |
| `apps/server/prisma/schema.prisma` | `Account`, `Session`, `Wallet`, `MatchRecord` |

## 5. Tính năng đã có

12 nền văn minh theo **12 hệ** (tên tiếng Việt trong lõi, bản tiếng Anh ở `content-en.ts`, hiển thị qua `civName`; người que thân đen, đầu / màu vải / màu năng lượng theo hệ như 2 ảnh mẫu `docs/art/reference`, mô tả ảnh ở `docs/art/unit-prompts.md`; phe phân biệt bằng thanh máu luôn hiện: xanh lá mình, đỏ địch) × 12 quân + trạm vàng + tường thành có cổng (nút 🧱 / phím T, thợ mỏ đi dựng, mỗi nền văn minh một nét riêng; mã tường nối cuối UNIT_ORDER, AI chưa tự xây); giao diện vi / en (`packages/i18n`, dùng chung web + admin), ⚙️ Cài đặt: ngôn ngữ, âm thanh, âm lượng, mẹo, rung; khắc chế đòn / giáp, mỗi tộc một điểm yếu; đội hình; kỳ cựu; mỏ giữa + túi vàng; chiến dịch 12 tab theo tộc, mỗi tab 33 màn = 3 vòng (Làm quen, Chinh phạt, Thử thách) dễ → khó, mỗi vòng gặp đủ 11 tộc còn lại (thứ tự xáo riêng từng tộc), trùm cuối vòng 2 và 3;
đấu máy; online 1v1, phòng chờ, đấu trường, người xem, bắt kèo xu ảo, thoại WebRTC; màn đăng nhập (Google / khách,
ô đồng ý điều khoản bắt buộc, mỗi lần mở đều hiện trừ khi còn phiên Google); sảnh kiểu game di động tông gỗ; Cẩm nang;
tài khoản (Elo, lịch sử, đổi tên). Đã thử thật trên trình duyệt sau khi chuyển sang Vue + NestJS: đăng nhập khách, sảnh,
chiến dịch, trận online 1v1 với bot (ghép trận, đếm ngược, kết thúc khi đối thủ thoát).

## 6. Cân bằng

Tạo tạm `packages/core/src/*.probe.test.ts` cho AI đấu AI / bot đấu từng màn, in tỉ lệ thắng, chỉnh `factions.ts` / `levels.ts`,
rồi xoá file probe. Kết quả gần nhất: tỉ lệ thắng giữa các tộc 36–57%. Bot test dùng `BOT_MIX` (không có máy công thành).

## 7. Việc còn dở / gợi ý tiếp theo

1. **Bật đăng nhập Google**: cần Client ID (OAuth "Web application", origins `http://localhost:5173`, `https://zone-c.io.vn`).
   Luồng Google thật **chưa thử** (chỉ test bằng token tự ký).
2. **Deploy bản 2.0**: server cần `/srv/stickman-war-online/.env` có `POSTGRES_PASSWORD` (+ `GOOGLE_CLIENT_ID`), chạy `./deploy.sh`,
   rồi chạy import dữ liệu cũ một lần (lệnh trong `deploy.sh`). Image Docker đã được build thử trên máy dev.
3. Sảnh vẫn tông gỗ ban ngày, lệch với màn đăng nhập tông tím / vàng neon.
4. Chưa thử: điện thoại dọc, phòng chờ + thoại với 2 trình duyệt thật.
5. Hook dev `window.__step` (tua nhanh trận) của bản cũ chưa được đưa sang Vue.
6. Ý tưởng chưa làm: 2v2 / 4v4, giải đấu 8 người, hợp sức đánh trùm, nhánh tiến hoá quân, sĩ khí, ngày / đêm,
   lính đánh thuê, đào hầm, thẻ chiến thuật + tướng điều khiển trực tiếp, sinh tồn, replay, PixiJS (WebGL) cho đồ hoạ.

## 8. Lưu ý kỹ thuật

- Ảnh trong `apps/web/public` tham chiếu bằng `import.meta.env.BASE_URL + 'logo.png'` trong template, hoặc `url('/bg-desktop.webp')` trong CSS.
- Snapshot online gửi chỉ số quân trong `UNIT_ORDER`; client và máy chủ phải cùng phiên bản.
- `noUnusedLocals` bật ở mọi gói. pnpm 12 chặn script cài đặt: các gói được phép ở `allowBuilds` trong `pnpm-workspace.yaml`.
- Bản sao lưu trước các đợt sửa lớn: `/home/vinh-le/Projects/nguoi-que-backup-2026-11-16.tar.gz` (ngoài repo, bản trước 2.0).
