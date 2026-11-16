# Đại Chiến Người Que

Game chiến thuật kiểu Stick War: đào vàng, xây quân, chỉ huy đội quân phá tượng địch.
Viết bằng Vite + TypeScript + Canvas 2D, không dùng asset ngoài (hình vẽ và âm thanh đều sinh bằng code).

```bash
npm install
npm run server   # máy chủ online (cổng 8787) — chỉ cần khi chơi online
npm run dev      # chơi tại http://localhost:5173 (WebSocket /ws được proxy sang máy chủ online)
npm test         # test mô phỏng, độ khó, máy chủ online
npm run build    # web tĩnh -> dist/, máy chủ online -> dist-server/
./deploy.sh      # build + đẩy web và máy chủ (Docker) lên https://zone-c.io.vn/nguoi-que/
```

## Chế độ chơi

- **Offline**: chiến dịch 8 màn ở 3 mức Dễ / Thường / Khó (thắng hết 8 màn mức trước mới mở mức sau,
  tiến độ và sao lưu riêng từng mức), đấu với máy (Dễ / Thường / Khó). Bản build có service worker nên
  mở lại được khi mất mạng, cài được lên màn hình chính (PWA).
- **Online 1v1**: tìm trận nhanh (đủ 2 người là vào trận), hoặc tạo phòng rồi gửi mã / link `?room=MÃ` cho bạn bè.
- **Phòng chờ** (phòng tạo bằng "Tạo phòng"): thấy 2 ghế người chơi, danh sách người xem, quỹ kèo và chat.
  Khách bấm **Sẵn sàng**, **chủ phòng** 👑 bấm **Bắt đầu** thì vào trận; đánh xong cả phòng quay về phòng chờ.
  Chủ phòng chọn luật (vàng ban đầu 300/500/1000, giới hạn 10/20/30 phút; đổi luật thì khách phải sẵn sàng lại)
  và mời người chơi ra khỏi phòng (không vào lại được). Người chơi có thể ra ghế xem, người xem ngồi vào ghế trống.
  Chủ phòng rời thì quyền chuyển cho người chơi còn lại (hoặc người xem); phòng chỉ đóng khi không còn ai.
  Máy chủ chạy chính bộ mô phỏng `src/core` (server-authoritative), client chỉ gửi lệnh và vẽ lại
  ảnh chụp trạng thái 15 lần/giây. Mỗi người luôn thấy phe mình bên trái (máy chủ lật gương cho team 1).
  Rời trận / mất mạng = thua, hết 20 phút thì so máu tượng.
- **Đấu trường**: danh sách các phòng đang mở (cập nhật 2 giây/lần). Phòng còn ghế thì bấm **▶ Chơi**,
  phòng đã có 2 người đấu thì bấm **👁 Xem** để theo dõi trực tiếp (tối đa 20 người xem/phòng).
  Vào bằng mã / link mà phòng đã đủ người thì được hỏi có muốn vào xem không. Người xem thấy vàng cả
  hai bên, không ra lệnh được, ở lại phòng thì xem tiếp khi hai bên đấu lại; phòng còn ghế thì có thể ngồi vào chơi.
- **Thoại trong phòng** (nút 🎙 góc trái, cả ở phòng chờ lẫn trong trận): vào thoại để nghe, bật / tắt mic
  bằng nút hoặc phím `M`, kéo âm lượng riêng từng người (chỉ trên máy mình, nhớ theo tên), đèn xanh khi ai đang nói.
  Âm thanh đi thẳng giữa các trình duyệt (WebRTC), máy chủ game chỉ chuyển tin bắt tay; tối đa 10 người / phòng.
  Mic cần trang https (hoặc localhost). Chỉ dùng máy chủ STUN công cộng của Google, chưa có TURN, nên một số
  mạng chặn kết nối trực tiếp (4G của vài nhà mạng, mạng công ty) sẽ hiện ⚠️ và không nghe được nhau.
- **Bắt kèo**: người xem cược xu ảo 🪙 (không phải tiền thật) vào bên nghĩ sẽ thắng, mỗi trận 1 lần, trong
  60 giây đầu trận (phòng chờ thì cược được ngay khi đủ 2 người ngồi; đổi người chơi thì hoàn kèo). Tiền hai bên gộp thành quỹ: bên thắng nhận lại tiền cược + phần của bên thua theo tỉ lệ;
  hoà hoặc chỉ một bên có người cược thì hoàn tiền. Người đang chơi trận đó không được cược.
  Mỗi trình duyệt có một mã ví (localStorage), bắt đầu 1000 xu, cháy túi thì được cấp lại 200.
  Máy chủ lưu ví ở `data/wallets.json` (đổi bằng biến `WALLET_FILE`; Docker gắn volume `nguoi-que-data`).

## Sảnh, tộc, tài khoản

- **Sảnh** gồm 6 mục: 🏠 Sảnh · 🎯 Chơi đơn · 🌐 Online · 🏟️ Đấu trường (thêm bảng xếp hạng) · 📖 Cẩm nang
  (cách chơi, bảng quân đầy đủ của 8 tộc, bảng khắc chế, chiến thuật) · 👤 Tài khoản.
- **8 tộc** (`src/core/factions.ts`): Bộ Lạc Kiếm, Thú Nhân, Thần Rừng, Tộc Xương, Phù Tang, Viking, Sa Mạc, Đế Chế Sắt.
  Mỗi tộc có 12 quân + tháp, nội tại riêng, khắc 2 tộc (+20% sát thương) và bị 2 tộc khắc.
  Quân sinh tự động từ khung quân gốc (`BASE` trong `units.ts`) cộng phần ghi đè của tộc. Màn chơi và AI viết theo
  tên khung (`'sword'`), World tự đổi sang quân của tộc.
- **Đội hình** (phím `F`): Tự do / Hàng lối (đi cùng tốc độ quân chậm nhất, khiên trước, bắn xa sau) / Tản rộng.
- **Đăng nhập Google**: máy chủ kiểm tra ID token bằng khoá công khai của Google, lưu tài khoản ở `data/accounts.json`
  (đổi bằng `ACCOUNT_FILE`). Chỉ lưu mã Google, tên, ảnh đại diện, tộc, thắng/thua, điểm Elo; không lưu email.
  Ví xu gắn theo tài khoản. Bật bằng biến môi trường `GOOGLE_CLIENT_ID`, không có thì game chạy chế độ khách.

### Bật đăng nhập Google

1. Vào https://console.cloud.google.com/ → tạo (hoặc chọn) dự án → **APIs & Services → OAuth consent screen**: chọn External,
   điền tên app, email hỗ trợ, rồi Publish (hoặc thêm email của bạn vào Test users).
2. **Credentials → Create credentials → OAuth client ID** → loại **Web application**.
   *Authorized JavaScript origins*: `http://localhost:5173` (dev) và `https://zone-c.io.vn` (bản thật). Không cần redirect URI.
3. Dev: `GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com npm run server`.
   Server thật: tạo file `/srv/nguoi-que-online/.env` chứa `GOOGLE_CLIENT_ID=...` rồi `docker compose up -d`.
   Nginx cần thêm khối `location ^~ /nguoi-que/api/` (đã có trong `nginx-nguoi-que.conf`).

## Cách chơi

- Thợ mỏ đào vàng → dùng vàng xây 12 loại quân của tộc mình (phím `1`–`9`, `0`, `-`, `=`).
- **Khắc chế**: mỗi quân có kiểu đòn (chém / đâm / tên / phép / đập / công thành) và kiểu giáp (nhẹ / nặng / kỵ / khổng lồ),
  bảng hệ số ở `DAMAGE_TABLE` trong `src/core/units.ts`. Ví dụ giáo đâm kỵ binh ×2, tên vào khổng lồ ×1.5, phép đốt giáp nặng ×1.3.
- **Quân đặc biệt**: Kỵ binh phi càng xa đâm càng đau (tới ×2.5) · Ninja lướt qua tiền tuyến ám sát hàng sau ·
  Thầy thuốc hồi máu · Máy bắn đá phá tượng ×3 nhưng không bắn được địch đứng sát.
- **Kỳ cựu**: quân hạ 2 / 5 / 9 địch lên ★ / ★★ / ★★★, mỗi sao +15% máu và sát thương.
- **Mỏ giữa** (`R`): một nửa thợ mỏ sang mỏ giàu giữa bản đồ. Thợ mỏ chết rơi túi vàng, quân phe nào chạm trước thì nhặt.
- Ra lệnh cả đội: 🏰 Rút về (`Q`, vào tượng hồi máu) · 🛡️ Phòng thủ (`W`) · ⚔️ Tấn công (`E`).
- Tượng tự bắn tên vào địch đến gần. Phá tượng địch để thắng.
- Kéo màn hình / lăn chuột / `A` `D` / bản đồ nhỏ để di chuyển góc nhìn. `Space` tạm dừng.

## Cấu trúc

- `src/core/` — mô phỏng thuần, không phụ thuộc giao diện
  - `units.ts` — khung quân gốc, sinh quân cho 8 tộc, bảng khắc chế, kỳ cựu
  - `factions.ts` — dữ liệu 8 tộc: nội tại, khắc tộc, tên / chỉ số / hình dáng từng quân
  - `world.ts` — chiến trường: kinh tế, di chuyển, đánh, đạn, tượng
  - `ai.ts` — AI phe địch (dùng đúng lệnh người chơi có)
  - `levels.ts` — 8 màn chiến dịch
  - `core.test.ts` — test logic + bot người chơi kiểm tra mọi màn đều thắng được
- `src/render/` — vẽ người que (`stickman.ts`), chiến trường, hiệu ứng, bản đồ nhỏ (`renderer.ts`)
- `src/net/` — giao thức online (`protocol.ts`), kết nối + bản sao chiến trường phía client (`remote.ts`), thoại WebRTC (`voice.ts`)
- `server/` — máy chủ WebSocket + API tài khoản (`accounts.ts`, `google-auth.ts`): phòng, ghép trận, người xem, bắt kèo, chạy trận 30 tick/giây (`game-server.ts`),
  ví xu (`wallets.ts`) + test
- `src/ui/` — âm thanh WebAudio, lưu tiến độ
- `src/main.ts` — menu, HUD, điều khiển, vòng lặp game

Chỉnh độ khó: sửa `incomeMult`, `start`, `ai.attackAt`, `ai.forceAttackAt` trong `src/core/levels.ts`
(mức Thường / Khó của chiến dịch: bảng `CAMPAIGN`, phần cộng thêm giảm dần về các màn cuối)
rồi chạy `npm test` để chắc các màn vẫn thắng được.
