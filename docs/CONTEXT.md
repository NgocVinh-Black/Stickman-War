# Ngữ cảnh phát triển: Đại Chiến Người Que (Stickman War)

Tài liệu bàn giao để tiếp tục phát triển ở phiên làm việc mới. Đọc file này trước, sau đó đọc `README.md`.

- Repo: https://github.com/NgocVinh-Black/Stickman-War (nhánh `main`, **Public**)
- Thư mục máy: `/home/vinh-le/Projects/nguoi-que`
- Bản chạy thật (chưa deploy các thay đổi mới): https://zone-c.io.vn/nguoi-que/ qua `./deploy.sh`

## 1. Quy ước làm việc với chủ dự án

- Giao tiếp **tiếng Việt**. Tên, chữ trong game đều tiếng Việt.
- Commit: **không thêm dòng `Co-Authored-By` / ghi công AI**. Lời commit viết **tiếng Anh**.
- Tác giả commit trong repo này: `NgocVinh-Black <145645281+NgocVinh-Black@users.noreply.github.com>`
  (đã đặt bằng `git config` cục bộ của repo; không dùng email công ty).
- Repo public: không commit bí mật, `.env`, thư mục `data/` (ví xu, tài khoản), file build.
- Chủ dự án thích xem kết quả chạy thật trên trình duyệt; sau thay đổi lớn nên chạy `npm test` + `npm run build`.

## 2. Chạy dự án

```bash
npm install
npm run server   # máy chủ online + API tài khoản, cổng 8787 (tsx watch, tự nạp lại)
npm run dev      # web http://localhost:5173 (proxy /ws và /api sang 8787)
npm test         # 51 test: mô phỏng, cân bằng màn chơi, máy chủ, đăng nhập
npm run build    # tsc + vite build (dist/) + máy chủ (dist-server/)
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com npm run server   # bật đăng nhập Google
```

Dev console: `window.__step(giây)` tua nhanh trận đang mở (chỉ bản dev).

## 3. Kiến trúc

| Thư mục / file | Vai trò |
|---|---|
| `src/core/units.ts` | Khung quân (`Arch`, 13 khung kể cả tháp), chỉ số gốc `BASE`, bảng khắc chế `DAMAGE_TABLE`, sinh `UNITS` cho mọi tộc, `kindOf`, `roster`, `toFaction`, `TRAIN_KEYS` |
| `src/core/factions.ts` | Dữ liệu 8 tộc: nội tại, khắc tộc, tên / chỉ số / hình dáng (`look`) từng quân |
| `src/core/world.ts` | Mô phỏng thuần (không DOM): kinh tế, di chuyển, đội hình, đánh, đạn, hiệu ứng (độc, chậm, tàng hình, hút máu…), tháp, triệu hồi, túi vàng, mỏ giữa, kỳ cựu |
| `src/core/ai.ts` | AI dùng đúng lệnh người chơi có; cấu hình theo tên khung, tự đổi sang tộc |
| `src/core/levels.ts` | 8 màn chiến dịch (mỗi màn một tộc địch), 3 độ khó, đấu máy |
| `src/core/core.test.ts` | Test cơ chế + bot người chơi kiểm tra mọi màn đều thắng được |
| `src/render/stickman.ts` | Vẽ người que ghép bộ phận: mũ theo tộc, vũ khí, khiên, thú cưỡi, máy công thành, tháp |
| `src/render/renderer.ts` | Vẽ chiến trường, đạn, hiệu ứng, bản đồ nhỏ |
| `src/net/protocol.ts` | Giao thức WebSocket, ảnh chụp trạng thái (gửi chỉ số trong `UNIT_ORDER`) |
| `src/net/remote.ts` | Client online, bản sao chiến trường |
| `src/net/account.ts` | Đăng nhập Google (Google Identity Services), gọi `/api/*` |
| `src/ui/guide.ts` | Nội dung Cẩm nang (bảng quân 8 tộc, khắc chế, chiến thuật) |
| `src/main.ts` | Màn đăng nhập, sảnh, HUD, điều khiển, vòng lặp game (file lớn ~2400 dòng) |
| `src/style.css`, `src/lobby.css`, `src/login.css` | CSS chung / sảnh gỗ / màn đăng nhập |
| `server/game-server.ts` | WebSocket: phòng, ghép trận, người xem, kèo, chạy trận 30 tick/s; HTTP `/api/*` |
| `server/accounts.ts` | Tài khoản (file JSON), phiên đăng nhập, Elo, lịch sử |
| `server/google-auth.ts` | Kiểm tra ID token Google bằng JWKS (RS256, aud, iss, exp) |
| `public/bg.*`, `public/logo.*` | Ảnh nền và logo màn đăng nhập (ảnh của chủ dự án) |

Nguyên tắc: `src/core` không phụ thuộc giao diện; mọi tính năng chơi đi qua **lệnh** (`train`, `setStance`, `setFormation`, `setCenterMine`) để online tự có. Màn chơi / AI viết theo **tên khung** (`'sword'`), `World` tự đổi sang quân của tộc.

## 4. Tính năng đã có

**Lối chơi**
- 8 tộc: Bộ Lạc Kiếm, Thú Nhân, Thần Rừng, Tộc Xương, Phù Tang, Viking, Sa Mạc, Đế Chế Sắt. Mỗi tộc 12 quân xây được + tháp, nội tại riêng, khắc 2 tộc (+20% sát thương), bị 2 tộc khắc.
- 12 khung quân: thợ mỏ, kiếm sĩ, cung thủ, ninja, giáo binh, kỵ binh, thầy thuốc, cờ hiệu, pháp sư, máy công thành, khổng lồ, thợ xây (dựng tháp, tối đa 3). Phím `1–9 0 - =`.
- Khắc chế kiểu đòn × kiểu giáp; kỹ năng: lướt, tàng hình, phi đâm, tự nổ, chỉ đánh tượng, hút máu, độc, làm chậm, hồi máu (đơn / nhóm), gọi xác, hào quang, hất lùi, ra 2 con.
- Đội hình (phím `F`): Tự do / Hàng lối (đi theo quân chậm nhất, khiên trước, bắn xa sau) / Tản rộng.
- Kỳ cựu ★–★★★, mỏ vàng giữa (phím `R`), thợ mỏ chết rơi túi vàng.
- Chiến dịch 8 màn × 3 độ khó, đấu máy (máy chọn tộc ngẫu nhiên), online 1v1, phòng chờ, đấu trường, người xem, bắt kèo xu ảo, thoại WebRTC.

**Giao diện**
- Màn đăng nhập (nền + logo ảnh, biển vàng Google, "Hoặc", chơi khách, ô đồng ý điều khoản bắt buộc, cài đặt, khẩu hiệu). Mỗi lần mở game đều hiện, trừ khi đã đăng nhập Google; chọn khách không được nhớ.
- Sảnh kiểu game di động, tông gỗ: hồ sơ, xu, người online, tab gỗ, ô lớn, bảng "Nhiệm vụ & Ghi chú", nút tròn (đổi tộc / xếp hạng / tài khoản), nút xanh "BẮT ĐẦU CHIẾN ĐẤU", CHIẾN DỊCH / PVP, dòng thông báo.
- Các mục: Chơi đơn, Online, Đấu trường (+ bảng xếp hạng), Cẩm nang, Tài khoản (hồ sơ, Elo, lịch sử, đổi tên, đăng xuất).
- Bảng chọn tộc có hình xem trước quân, thẻ đối đầu trước trận.

**Máy chủ / tài khoản**
- `/api/config`, `/api/auth/google`, `/api/me` (GET/POST), `/api/logout`, `/api/leaderboard`.
- Chỉ lưu mã Google, tên, ảnh, tộc, thắng/thua/hoà, Elo, 20 trận gần nhất. Không lưu email.
- Ví xu đi theo tài khoản (`acct-<id>`). Service worker không cache `/api/`.

## 5. Cân bằng

- Đo bằng test: tạo tạm file `src/core/*.probe.test.ts` cho AI đấu AI / bot đấu từng màn, in tỉ lệ thắng, chỉnh số trong `factions.ts` / `levels.ts`, rồi **xoá file probe**.
- Kết quả gần nhất: tỉ lệ thắng giữa các tộc 36–57% (4 trận mỗi cặp, còn nhiễu). Màn 8 (Đế Chế Sắt khắc Bộ Lạc) đã được nới nhiều.
- Test bot dùng đội hình `BOT_MIX` (không có máy công thành: bot dồn tiền xây sớm sẽ thua đậm).

## 6. Việc còn dở / gợi ý tiếp theo

1. **Bật đăng nhập Google**: cần Client ID (Google Cloud Console → OAuth client ID loại Web application; origins `http://localhost:5173`, `https://zone-c.io.vn`). Luồng đăng nhập thật **chưa được thử** (chỉ test bằng token tự ký).
2. Khi Google chạy được: cân nhắc **bỏ nút chơi khách** (bắt buộc đăng nhập) theo ý chủ dự án; link mời `?room=` hiện vẫn vào thẳng không qua màn đăng nhập.
3. **Sảnh vẫn tông gỗ ban ngày**, lệch với màn đăng nhập tông tím đêm / vàng neon. Chủ dự án có thể muốn đổi sảnh + bảng + HUD sang cùng tông.
4. Chưa thử: màn hình điện thoại dọc (màn đăng nhập, sảnh), trận online 2 người khác tộc trên trình duyệt thật.
5. **Chưa deploy** các thay đổi mới. Khi deploy: thêm khối `location ^~ /nguoi-que/api/` vào nginx (đã có trong `nginx-nguoi-que.conf`), đặt `GOOGLE_CLIENT_ID` trong `/srv/nguoi-que-online/.env`.
6. Ý tưởng đã bàn nhưng chưa làm: chế độ nhiều người (2v2 / 4v4, giải đấu 8 người, hợp sức đánh trùm), nhánh tiến hoá quân, tinh thần (sĩ khí), ngày / đêm, lính đánh thuê trung lập, đào hầm, thẻ chiến thuật + tướng điều khiển trực tiếp, chế độ sinh tồn, replay.
7. `src/main.ts` đã rất dài: nên tách sảnh / đăng nhập / online ra module riêng khi làm tiếp.

## 7. Lưu ý kỹ thuật

- Vite `base: './'` để chạy dưới `/nguoi-que/`; ảnh trong `public/` tham chiếu bằng đường dẫn tương đối (`./logo.webp`) hoặc `/bg.webp` trong CSS (Vite tự đổi sang tương đối khi build).
- Snapshot online gửi chỉ số quân trong `UNIT_ORDER` (mọi tộc); client và máy chủ phải cùng phiên bản.
- `tsconfig` bật `noUnusedLocals`: xoá hàm không dùng nếu không build sẽ lỗi.
- Bản sao lưu trước các đợt sửa lớn: `/home/vinh-le/Projects/nguoi-que-backup-2026-11-16.tar.gz` (ngoài repo).
