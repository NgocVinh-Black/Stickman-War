# Stickman War — quy ước phát triển

Đọc file này trước mọi thay đổi. Bối cảnh, lịch sử và việc còn dở: `docs/CONTEXT.md`. Cách chạy: `README.md`.

## Làm việc với chủ dự án

- Trả lời và viết chữ trong game bằng **tiếng Việt**. Comment trong code cũng tiếng Việt (giữ như code hiện có).
- Chủ dự án kiểm tra bằng cách chơi thật trên trình duyệt: sau khi sửa giao diện / lối chơi, mở `http://localhost:5173` xem lại.
- Không tự đổi framework / công cụ đã chọn (Vue 3 + Vite, NestJS + Fastify + Prisma, admin dùng Rspack).
- Không commit khi chưa được yêu cầu.

## Commit

- Lời commit **tiếng Anh**, dòng đầu ngắn ở thể mệnh lệnh ("Add …", "Fix …"), thân liệt kê thay đổi chính.
- **Không** thêm dòng `Co-Authored-By`, "Generated with Claude" hay bất kỳ ghi công AI nào.
- Tác giả: `NgocVinh-Black <145645281+NgocVinh-Black@users.noreply.github.com>` (đã đặt trong `git config` của repo).
- Repo public: không commit `.env`, `data/`, `dist/`, bí mật.

## Cấu trúc

```
packages/core/src/   Lõi game TS thuần (không DOM, không Node): world (mô phỏng), units, factions, levels, ai, protocol
apps/web/src/        Vue 3 + Vite + Pinia + Vue Router (hash history)
  views/             trang (LobbyView, GameView, RoomView, LoginView); views/lobby/*Tab.vue
  components/        mảnh giao diện dùng lại
  stores/            Pinia: settings, ui, game, online
  game/              phiên chơi, camera, render/ (Canvas 2D)
  net/               WebSocket, tài khoản, thoại
  lib/               hàm tiện ích không phải store
  styles/            CSS chia theo khu vực, index.css import đúng thứ tự
apps/server/src/     NestJS: mỗi tính năng một module (accounts, wallets, auth, game, admin, database, health)
  common/            tokens DI, zod.pipe, bearer
apps/admin/src/      Vue 3 + Rspack: views/, components/, lib/, styles/
```

## Quy tắc code

### Lõi game (`packages/core`)

- Mọi luật chơi nằm ở đây; web và server chỉ gọi vào. Không đặt luật chơi trong component Vue hay service.
- Mô phỏng phải **tất định** khi truyền cùng bộ ngẫu nhiên: trong `World` dùng `this.rng()`, không gọi `Math.random()` trực tiếp
  (test truyền `seeded(n)` để kết quả lặp lại được).
- Thêm giá trị vào danh sách được mã hoá theo chỉ số (`STANCES`, `FORMATIONS`, `FACTION_ORDER`, cờ `FLAG`…) thì **thêm vào cuối**,
  không chèn giữa, để không lệch chỉ số với client cũ.
- Toạ độ x trong tin nhắn của người chơi bên phải (team 1) bị lật gương: server đổi lại `WORLD_WIDTH - x`.
- Thêm trường cho `Unit` / `TeamState` thì cập nhật cả giá trị mặc định ở `apps/web/src/net/remote.ts`.

### Web (`apps/web`)

- `<script setup lang="ts">`, state dùng chung để trong store Pinia; component chỉ hiển thị và gọi store.
- Hộp thoại dựng từ dữ liệu qua `useUi().show(...)` (không dùng `v-html`).
- CSS: thêm vào file đúng khu vực trong `styles/`; file mới thì thêm `@import` vào `styles/index.css` (thứ tự = độ ưu tiên).
  Xoá giao diện thì xoá luôn CSS không còn dùng.
- Hướng dẫn chi tiết (điểm mạnh / yếu tộc, cách chơi) chỉ để ở **Cẩm nang**; các màn khác giữ gọn.

### Server (`apps/server`)

- Đóng gói bằng esbuild nên **mọi tham số constructor phải `@Inject(TOKEN)` tường minh** (kể cả service class).
- Tính năng mới = module mới (`x.module.ts` + controller / service), import vào `AppModule.forRoot`; không khai báo thẳng vào AppModule.
- Kiểm tra dữ liệu vào bằng Zod (`ZodPipe`); lỗi trả `{ error: '…' }` tiếng Việt.
- Thông tin người chơi không được thấy (tộc đối thủ trong phòng chờ…) phải lọc ở server, không chỉ ẩn ở client.

### Admin (`apps/admin`)

- Chỉ đọc dữ liệu qua `/api/admin/*`. Trang ở `views/`, gọi API ở `lib/api.ts`.

## Kiểm tra trước khi báo xong

```bash
pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build
```

- Sửa lối chơi / chỉ số: thêm test ở `packages/core/src/core.test.ts`; viết test tái hiện lỗi trước rồi mới sửa.
- Đổi cân bằng (`factions.ts`, `levels.ts`): test chiến dịch cho bot đánh mỗi màn 32 trận với tộc ngẫu nhiên, phải thắng ≥ 50%
  (màn trùm ≥ 1/8). Đo nhanh bằng file probe tạm `*.probe.test.ts`, xong thì xoá.
- Đổi giao thức online: thêm test ở `apps/server/test/server.test.ts`.
- Vite dev đôi khi phục vụ bản cũ của file trong `packages/core` (trang trắng, lỗi "does not provide an export"): kiểm tra bằng
  `curl http://localhost:5173/@fs$PWD/packages/core/src/<file>.ts`, nếu cũ thì khởi động lại Vite.
