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
  **mọi tham số constructor phải dùng `@Inject(TOKEN)` tường minh** (token trong `src/tokens.ts`).
- **Admin** `apps/admin`: Vue 3 + **Rspack** 2 (vue-loader, builtin:swc-loader), cổng dev 5174, gọi API qua `../api/`.
  API `apps/server/src/admin/*` (chỉ đọc), quyền: `ADMIN_EMAILS` (cờ `Account.isAdmin` đặt lại mỗi lần đăng nhập Google) hoặc `ADMIN_TOKEN`.
- **Lõi game** `packages/core`: TS thuần, export từ `src/index.ts`, được web (Vite) và server (tsup gộp vào bundle) dùng trực tiếp.
- Test: Vitest (core 31, web 3, server 28 gồm test Postgres thật khi có `DATABASE_URL`). ESLint 10 + Prettier 3. CI: `.github/workflows/ci.yml`.

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
| `packages/core/src/units.ts` | Khung quân (`Arch`), chỉ số gốc `BASE`, `DAMAGE_TABLE`, sinh `UNITS` cho 8 tộc, `kindOf`, `roster`, `TRAIN_KEYS` |
| `packages/core/src/factions.ts` | Dữ liệu 8 tộc: nội tại, khắc tộc, tên / chỉ số / hình dáng (`look`) |
| `packages/core/src/world.ts` | Mô phỏng: kinh tế, đội hình, đánh, đạn, hiệu ứng, tháp, triệu hồi, túi vàng, mỏ giữa, kỳ cựu |
| `packages/core/src/protocol.ts` | Tin nhắn WebSocket (`ClientMsg`, `ServerMsg`), ảnh chụp trạng thái, `AccountInfo` |
| `apps/web/src/stores/game.ts` | Phiên chơi (`GameSession`), HUD reactive, chiến dịch / đấu máy, thắng thua, tạm dừng |
| `apps/web/src/stores/online.ts` | Kết nối, xử lý mọi `ServerMsg`, phòng chờ, kèo, chat, thoại, trận online / xem |
| `apps/web/src/stores/ui.ts` | Hộp thoại dựng từ dữ liệu (`AppDialog.vue`, không dùng v-html) + toast |
| `apps/web/src/stores/settings.ts` | Tên, tộc, tiến độ chiến dịch (localStorage), tab sảnh, chơi khách |
| `apps/web/src/views/*` | `LoginView` (ảnh `public/bg-desktop.*`, `public/bg-mobile.*`, `public/logo.*`), `LobbyView` + `lobby/*Tab.vue`, `GameView`, `RoomView` |
| `apps/server/src/game/lobby.service.ts` | Phòng, ghép trận, chạy trận 30 tick/s, kèo, chat, thoại; mỗi kết nối xử lý tin theo hàng đợi |
| `apps/server/src/game/game.gateway.ts` | Nhận upgrade WebSocket ở mọi đường dẫn kết thúc `/ws` trên server HTTP của Nest |
| `apps/server/src/admin/*` | API trang admin `/api/admin/*` (config, login bằng mã, me, stats, accounts, accounts/:id) |
| `apps/server/src/api/api.controller.ts` | `/api/config`, `/api/auth/google`, `/api/me` (GET/POST), `/api/logout`, `/api/leaderboard`, `/health` |
| `apps/server/src/bootstrap.ts` | `startGameServer(port, opts)`: dựng Nest + Fastify, `rewriteUrl` bỏ tiền tố `/stickman-war` |
| `apps/server/prisma/schema.prisma` | `Account`, `Session`, `Wallet`, `MatchRecord` |

## 5. Tính năng đã có

8 tộc × 12 quân + tháp; khắc chế đòn / giáp / tộc; đội hình; kỳ cựu; mỏ giữa + túi vàng; chiến dịch 8 màn × 3 độ khó;
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

- Ảnh trong `apps/web/public` tham chiếu bằng `import.meta.env.BASE_URL + 'logo.png'` trong template, hoặc `url('/bg.webp')` trong CSS.
- Snapshot online gửi chỉ số quân trong `UNIT_ORDER`; client và máy chủ phải cùng phiên bản.
- `noUnusedLocals` bật ở mọi gói. pnpm 12 chặn script cài đặt: các gói được phép ở `allowBuilds` trong `pnpm-workspace.yaml`.
- Bản sao lưu trước các đợt sửa lớn: `/home/vinh-le/Projects/nguoi-que-backup-2026-11-16.tar.gz` (ngoài repo, bản trước 2.0).
