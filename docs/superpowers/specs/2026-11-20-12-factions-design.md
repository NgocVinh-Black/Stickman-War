# 12 tộc và trạm vàng — thiết kế

Ngày: 2026-11-20. Đã được chủ dự án duyệt.

## Mục tiêu

- Từ 8 lên 12 tộc, mỗi tộc một cơ chế nội tại riêng (12 cơ chế khác nhau) để hợp nhiều lối chơi.
- Thợ xây không dựng tháp ở chỗ tự chọn nữa mà dựng **trạm vàng** ở chỗ cố định: thợ mỏ nộp vàng ở trạm gần hơn tượng, trạm kiêm tháp canh (bắn địch).
- Bản đồ giữ rộng 4000 (các mỏ đã cách xa nhau); tăng sau nếu chơi thử thấy chật.

## 12 cơ chế tộc

| # | Tộc | Nội tại | Lối chơi | Điểm yếu |
|---|---|---|---|---|
| 1 | Bộ Lạc Kiếm | Kỷ luật: quân rẻ 10%, lên sao 1/3/6 mạng (giữ) | dễ chơi, đều tay | máu -5% |
| 2 | Thú Nhân | **Bầy đàn** (`horde`): +4% sát thương mỗi đồng đội trong 120, tối đa +24%. Bỏ +20% máu | dồn quân | chậm 10%, tầm bắn -10% |
| 3 | Thần Rừng | hồi máu khi nghỉ, tầm +8% (giữ) | thả diều | máu -15% |
| 4 | Bất Tử | thu hồn (giữ) | lăn cầu tuyết | (giữ) |
| 5 | Samurai | nhất kích (giữ) | săn mục tiêu | (giữ) |
| 6 | Viking | cuồng nộ (giữ) | lật kèo | (giữ) |
| 7 | Sa Mạc | vàng mỏ +25%, tượng trâu (giữ) | kinh tế, thủ | (giữ) |
| 8 | Hơi Nước | giáp +15% (giữ) | tiêu hao | (giữ) |
| 9 | Người Lùn | **Lò rèn** (`forge`): quân xây ra ở phút thứ m được +4%·m máu và sát thương, tối đa +32% | thủ chờ cuối trận | sát thương -10%, chậm |
| 10 | Thủy Tộc | **Thủy triều** (`lifesteal`): mọi đòn hút 15% sát thương thành máu | cận chiến kéo dài | máu -10%, sợ phép lan |
| 11 | Long Tộc | **Lửa rồng** (`burn`): mọi đòn đốt 4 máu/giây trong 3 giây | rỉa máu | quân đắt +15% |
| 12 | Băng Tộc | **Giá lạnh** (`chill`): mọi đòn làm chậm 0.8 giây | khống chế | sát thương -10% |

Số liệu trong bảng là điểm xuất phát. Sau khi chạy probe (AI đấu AI, 88 trận mỗi tộc) đã chỉnh thành:
bầy đàn +2.5%/đồng đội tối đa +15% (Thú Nhân máu -15%), lò rèn +5%/phút tối đa +40% (sát thương -8%),
thủy triều hút 35% (máu -5%), lửa rồng 9 máu/giây × 3 giây (quân đắt +10%), giá lạnh 1.5 giây (+20% máu, chậm 5%).
Tộc cũ: Bộ Lạc rẻ 5% / máu -8%, Viking cuồng nộ 65%, Tộc Xương thu hồn 35% / rẻ 18%, Phù Tang ×2.8,
Sa Mạc vàng +15%, Đế Chế Sắt giáp +17%; goblin đánh bom 75 sát thương / 220 vàng, Troll hồi 3, Ogre 1300 máu.
Kết quả: mọi tộc thắng 41–59%. Màn 10 "Pháo đài": thu nhập địch 0.5 → 0.35 vì địch có trạm vàng.

Cài đặt: thêm trường vào `FactionDef`, xử lý trong `world.ts` ở chỗ tính sát thương (cùng chỗ `rage`, `firstStrike`).
`burn` dùng chung đường độc (`poisonT/poisonDps`, lấy max với độc có sẵn), `chill` dùng `slowT`, `lifesteal` cộng vào lifesteal của quân.
`forge` lưu hệ số vào `Unit` lúc sinh ra (trường mới `forge`, mặc định 1 — thêm vào `remote.ts`).

## Trạm vàng

- Mỗi bên 2 chỗ cố định: chỗ 0 giữa mỏ bạc và mỏ vàng (cách tượng 430), chỗ 1 trên đường tới mỏ kim cương (cách tượng 1150). `MAX_TOWERS = 2`.
- Bỏ chọn chỗ (`buildX`) ở lõi, web, giao thức; thợ xây tới chỗ trống đầu tiên.
- Thợ mỏ vác vàng nộp ở trạm còn sống của phe mình nằm giữa thợ và tượng mà gần thợ nhất (không tính trạm xa nhà hơn mỏ đang đào); không có thì về tượng.
- Trạm giữ chỉ số, hình, đạn tháp của từng tộc; tên đổi thành "Trạm …".

## 4 tộc mới — quân

Mỗi tộc 12 khung + trạm, tên tiếng Việt, ghi đè chỉ số/hình theo chủ đề. Hình mới trong `render/stickman.ts`:
mũ `beard` (lùn), `fin` (thủy), `dragon` (long), `icecrown` (băng); vũ khí `trident`; thú cưỡi `shark`, `lizard`, `bear`.

## Ảnh hưởng khác

- `FACTION_ORDER` thêm 4 tộc vào **cuối**. Chiến dịch 16 màn xáo theo khối 12 tộc.
- Web: chọn tộc 12 ô (kể cả điện thoại), Cẩm nang thêm tộc mới + trạm vàng, bỏ chọn chỗ xây tháp.
- Server: bỏ `buildX` khỏi tin xây quân; test giao thức.

## Kiểm tra

- Test trước cho: horde, forge, lifesteal, burn, chill, nộp vàng ở trạm, trạm bị phá thì về tượng, `FACTION_ORDER.length === 12`.
- Probe: tỉ lệ thắng mỗi tộc 36–57%; chiến dịch ≥ 50% mỗi màn, trùm ≥ 1/8.
- `pnpm lint && pnpm format:check && pnpm typecheck && pnpm test && pnpm build`, chơi thử ở `localhost:5173`.
