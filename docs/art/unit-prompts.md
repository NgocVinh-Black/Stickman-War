# Mô tả chi tiết lính 12 hệ — dùng làm prompt ảnh

12 nền văn minh của game là **12 hệ** (Quang, Phong, Mộc, Ám, Lôi, Huyết, Tinh thể, Thạch, Kim, Thủy, Hỏa, Băng).
Phong cách **bắt buộc theo 2 ảnh mẫu** trong `docs/art/reference/`:
`mau-1-kiem-ao-choang-do.png` (tóc dựng, áo choàng đỏ rách, kiếm rực đỏ cam) và
`mau-2-katana-toc-xanh.png` (tóc nhuộm xanh, khăn dài, katana xanh có tia điện).
Tên lính, vũ khí, thú cưỡi lấy từ lõi game (`packages/core/src/factions.ts`); màu lấy từ `apps/web/src/game/render/palette.ts`
(`CLOTH` = màu vải, `ENERGY` = màu phát sáng). File này sinh tự động, sửa dữ liệu trong game rồi sinh lại cho khớp.

## Quy tắc phong cách (rút từ 2 ảnh mẫu, áp cho mọi lính)

1. **Bảng 3 góc nhìn** cạnh nhau trên nền xám rất nhạt có vài đường kẻ ngang mờ: TỪ TRƯỚC (FRONT VIEW), TỪ TRÊN XUỐNG (TOP-DOWN VIEW),
   TỪ BÊN PHẢI (RIGHT SIDE VIEW), chữ đen đậm in hoa phía trên mỗi hình.
2. **Thân đen tuyền** cho mọi hệ: tay chân mảnh, đầu tròn, bàn tay tròn đơn giản, **không có mặt** (không mũi, miệng),
   **không vẽ da / cơ**. Tóc, mũ, sừng, tinh thể… là **hình bóng đen** hoặc tô màu vải, chỉ có viền sáng.
   Trang bị tối giản: giáp vai nhỏ theo hệ, thắt lưng da, bao cổ tay (không giáp kín người).
3. **Đôi mắt xếch sắc** phát sáng (lõi trắng, viền màu), là chi tiết duy nhất trên mặt.
4. **Hình đầu theo hệ** là dấu hiệu nhận diện chính (tóc lửa, tóc tia sét, hào quang, mũ đá…).
5. **Vải chỉ một màu** (màu vải của hệ): áo choàng và / hoặc khăn, **gấu rách**, bay theo gió, tô phẳng.
6. **Vũ khí và phép phát sáng neon** màu năng lượng của hệ: lõi trắng nóng, quầng sáng mềm, kèm hiệu ứng của hệ.
7. Nét viền tối rõ, tô phẳng kiểu anime game, **không 3D**. Cùng một nhân vật, cùng tỉ lệ, cùng màu ở cả 3 góc.
8. Thú cưỡi và máy móc cũng là **bóng đen**, chỉ mắt / phần năng lượng phát sáng.

## Cách ghép prompt

Một prompt = **[A] Phong cách chung** + **[B] Hệ** + **[C] Lính**, dán liền nhau.

### [A] Phong cách chung

```
Character turnaround sheet in the exact style of a stickman anime game reference: three views side by side on a very light grey
background with a few faint horizontal guide lines, labelled above in bold black caps "FRONT VIEW", "TOP-DOWN VIEW", "RIGHT SIDE VIEW".
The character is a stickman with a solid pitch-black silhouette body: thin limbs, round head, simple round hands, no face except two
sharp slanted glowing eyes (white core). No skin, no muscles, minimal gear (small shoulder guards, leather belt, bracers): hair,
helmets, horns and accessories are flat shapes with only a thin glowing rim. Cloth (cape and/or scarf or sash) in one single strong colour with torn ragged edges
flowing in the wind, flat cel shading. The weapon glows with a white-hot core, a coloured neon edge and soft bloom, with small
elemental effects. Clean 2D cel-shaded game art, crisp dark outlines. Same character, same proportions and colours in all three views.
Full body, feet visible, no scenery.
```

Negative prompt:

```
realistic, 3d render, detailed face, mouth, nose, skin, muscles, full plate armour, metal texture, coloured body, extra limbs, extra fingers,
multiple cloth colours, busy background, scenery, cropped feet, inconsistent views, watermark
```

### Màu

Trong trận lính giữ đúng màu vải của hệ; phe phân biệt bằng **thanh máu luôn hiện trên đầu** (xanh lá phe mình, đỏ phe địch).
Không cần vẽ hai bản màu phe.

---

## 1. ☀️ Thánh Quang Điện — Temple of Light (hệ Quang)

Hệ Quang. Đạo quân ánh sáng kỷ luật: cân bằng, dễ chơi, đủ mọi loại quân.

- Đầu: tóc dựng nhọn + vầng hào quang mỏng sau đầu
- Giáp vai: giáp vai vàng
- Vải: trắng ngà `#f1ead2`
- Phát sáng: vàng ánh sáng `#ffe08a` — tia sáng và bụi sáng lấp lánh

```
[B] Element: Light (Temple of Light). Head silhouette: spiky hair with a thin glowing halo ring behind the head. Shoulder gear: small gold shoulder plates. Cloth colour: ivory white (#f1ead2).
Eyes, weapon and magic glow: radiant gold (#ffe08a) with light rays and glittering motes.
```

**Thợ mỏ** (×1) — Đào vàng nuôi quân. Chết thì rơi túi vàng đang mang
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Kiếm sĩ ánh sáng** (×1) — Cận chiến nhanh, rẻ
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: trường kiếm phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Light swordsman". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing straight longsword. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Cung thủ quang tiễn** (×1) — Bắn tên sáng từ xa
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Radiant archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Thích khách ánh chớp** (×0.95) — Lướt qua tiền tuyến, ám sát hàng sau
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Flash assassin". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing dagger. Pose: crouched low, about to dash.
```

**Hộ vệ thánh thuẫn** (×1.15) — Khiên dày, máu trâu. Đâm kỵ binh ×2
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: giáo phát sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Holy shield guard". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing spear. Pose: braced guard, weapon forward.
```

**Kỵ sĩ bạch mã** (×1.1) — Phi càng xa, cú đâm đầu càng đau
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi ngựa bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "White horse knight". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette horse with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Tu sĩ chữa lành** (×1) — Hồi máu quân bị thương gần nhất
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Healing cleric". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Tay trống thánh ca** (×1) — Quân quanh đó đánh mạnh và nhanh hơn
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Hymn drummer". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Pháp sư quang cầu** (×1.05) — Cầu sáng nổ diện rộng
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Orb mage". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy phóng thánh thạch** (×1.25) — Bắn cực xa, phá tượng ×3
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: máy bắn đá bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Sacred catapult". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette catapult with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Thánh vệ khổng lồ** (×2.3) — Đập nát cả đám
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Colossus of light". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Thợ xây đền** (×1) — Dựng trạm vàng cạnh mỏ: thợ mỏ nộp vàng gần hơn, trạm bắn địch (tối đa 2)
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Temple builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 2. 🌪️ Cuồng Phong Trại — Gale Horde (hệ Phong)

Hệ Phong. Bầy quân gió lốc: càng đông càng mạnh, đứng lẻ thì yếu.

- Đầu: tóc dài bay ngược gió
- Giáp vai: giáp vai da
- Vải: ngọc bích `#3fae86`
- Phát sáng: trắng ngọc `#c6fff0` — vệt gió xoáy, lá và bụi cuốn

```
[B] Element: Wind (Gale Horde). Head silhouette: long hair streaming back in the wind. Shoulder gear: small leather shoulder pads. Cloth colour: jade green (#3fae86).
Eyes, weapon and magic glow: pale jade white (#c6fff0) with swirling wind streaks, leaves and dust.
```

**Tiểu phong đào vàng** (×1) — Nhỏ, rẻ, chạy nhanh
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Breeze miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Chiến binh lốc** (×1) — Đao to bản, chém đau
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: đao to bản phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Whirlwind warrior". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing huge cleaver. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Lính phóng lao gió** (×1) — Lao đâm xuyên, khắc kỵ binh
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: lao / rìu ném phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Gale javelineer". Cloth: long scarf streaming sideways. Gear: glowing throwing javelins or axes. Pose: drawing the bow or mid-throw.
```

**Bom lốc xoáy** (×0.95) — Lao vào giữa địch rồi tự nổ tung
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: quả bom dây cháy phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Cyclone bomber". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing round bomb with a lit fuse. Pose: crouched low, about to dash.
```

**Hộ vệ bão cát** (×1.15) — Tự hồi máu liên tục
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: giáo phát sáng, khiên vuông đen viền sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Sandstorm guard". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing spear, black square shield with a glowing rim. Pose: braced guard, weapon forward.
```

**Kỵ sĩ sói gió** (×1.1) — Húc mạnh, máu trâu
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi sói bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Wind wolf rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette wolf with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Pháp sư gió lành** (×1) — Hồi máu bằng gió
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Soothing wind shaman". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Trống bão** (×1) — Tiếng trống làm quân hăng máu
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Storm drum". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Pháp sư sấm gió** (×1.05) — Sét gió nổ diện rộng
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Thunderwind shaman". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy phóng lốc đá** (×1.25) — Đá to, chậm, phá tượng ×3
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: máy bắn đá bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Gust catapult". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette catapult with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Cự nhân bão tố** (×2.3) — To, máu nhiều
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Tempest giant". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Thợ dựng chong chóng** (×1) — Dựng trạm gió phóng lao
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Windmill builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 3. 🌿 Thanh Mộc Lâm — Verdant Grove (hệ Mộc)

Hệ Mộc. Người giữ rừng: bắn xa, tự hồi máu, mỏng manh khi bị áp sát.

- Đầu: mũ trùm lá, tai nhọn
- Giáp vai: giáp vai lá
- Vải: xanh lá rừng `#2e8b3a`
- Phát sáng: xanh lá non `#7dff6a` — lá sáng và đom đóm

```
[B] Element: Wood (Verdant Grove). Head silhouette: leaf hood and pointed ears. Shoulder gear: leaf-shaped shoulder guards. Cloth colour: forest green (#2e8b3a).
Eyes, weapon and magic glow: bright leaf green (#7dff6a) with glowing leaves and fireflies.
```

**Tinh linh hái vàng** (×1) — Bay nhanh giữa mỏ và nhà
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Gold sprite". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Vũ công kiếm lá** (×1) — Múa kiếm cực nhanh
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: kiếm cong phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Leaf blade dancer". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing saber. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Cung thủ rừng** (×1) — Tầm bắn xa nhất
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Grove archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Thợ săn gai độc** (×0.95) — Lướt tới, mũi dao tẩm độc làm chậm
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Thorn hunter". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing dagger. Pose: crouched low, about to dash.
```

**Người cây** (×1.15) — Vỏ dày, tự mọc lại 9 máu/giây
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Treant". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing giant club. Pose: braced guard, weapon forward.
```

**Kỵ sĩ hươu** (×1.1) — Nhanh, gạc hươu húc
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi hươu gạc lớn bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Elk rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette elk with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Tư tế rừng** (×1) — Hồi máu cho cả nhóm quanh mục tiêu
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Grove priest". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Sáo thần** (×1) — Tiếng sáo làm quân đánh nhanh hơn
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Spirit flute". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Pháp sư lá bay** (×1.05) — Lốc lá hất địch lùi xa
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Leafstorm mage". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Nỏ thần** (×1.25) — Tên khổng lồ bắn hạ quân to (×1.5 vào khổng lồ)
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: nỏ khổng lồ bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Great ballista". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette giant ballista with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Cổ thụ** (×2.3) — Rễ cây trói chân địch
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Ancient tree". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Tinh linh trồng cây** (×1) — Trồng trạm cây bắn tên
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Sapling sprite". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 4. 🌑 Hội Bóng Đêm — Shadow Cult (hệ Ám)

Hệ Ám. Giáo phái bóng tối: quân rẻ, yếu, rất đông. Càng giết càng giàu.

- Đầu: mũ trùm kín có hai sừng nhỏ, khói tím bốc lên
- Giáp vai: giáp vai gai nhọn
- Vải: tím than `#4a1f7a`
- Phát sáng: tím ma `#b388ff` — khói bóng tối, mép thân tan thành khói

```
[B] Element: Shadow (Shadow Cult). Head silhouette: closed hood with two small horns, violet smoke rising. Shoulder gear: spiked shoulder guards. Cloth colour: deep violet (#4a1f7a).
Eyes, weapon and magic glow: ghostly violet (#b388ff) with shadow smoke, body edges dissolving into smoke.
```

**Bóng đào vàng** (×1) — Rẻ, mỏng
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Shade miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Bóng binh** (×1) — Mỗi lần xây ra 2 con
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: trường kiếm phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Shadow soldiers". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing straight longsword. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Cung bóng tối** (×1) — Bắn tên rẻ
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Dusk archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Bóng ma** (×0.95) — Tàng hình, chỉ lộ ra khi ra đòn
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: lưỡi hái phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Wraith". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing scythe. Pose: crouched low, about to dash.
```

**Hiệp sĩ đêm** (×1.15) — Hút máu 35% sát thương gây ra
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: kích phát sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Night knight". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing halberd. Pose: braced guard, weapon forward.
```

**Kỵ sĩ không đầu** (×1.1) — Ngựa bóng đêm phi như gió
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi ngựa bóng đêm bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Headless rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette night steed with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Thầy gọi hồn** (×1) — Không hồi máu: gọi xác chết gần đó dậy làm bóng binh 25 giây
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Soulcaller". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Cờ hồn** (×1) — Lá cờ ma làm quân hung hãn
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Soul banner". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Phù thuỷ hắc vụ** (×1.05) — Mây độc rút máu dần
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Blight witch". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy phóng hồn** (×1.25) — Ném cầu hắc vụ, để lại độc
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: máy bắn đá bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Soul catapult". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette catapult with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Ác linh khổng lồ** (×2.3) — Hút máu 20% sát thương
- Vải: vải rách vắt một vai
- Vũ khí / phép: đao to bản phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Abyss fiend". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing huge cleaver. Pose: towering, menacing hunch.
```

**Thợ dựng mộ** (×1) — Dựng trạm bóng đêm
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Crypt builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 5. ⚡ Lôi Kiếm Các — Thunder Blade Hall (hệ Lôi)

Hệ Lôi. Kiếm khách sấm sét: ra đòn nhanh và chí mạng.

- Đầu: tóc dựng gấp khúc như tia sét (giống mẫu 2)
- Giáp vai: giáp vai tấm kiểu sode
- Vải: vàng sấm `#e0b400`
- Phát sáng: vàng chớp `#fff36b` — tia sét lách tách quanh vũ khí (như mẫu 2)

```
[B] Element: Lightning (Thunder Blade Hall). Head silhouette: spiky zig-zag hair shaped like lightning bolts, like reference 2. Shoulder gear: layered sode shoulder plates. Cloth colour: thunder yellow (#e0b400).
Eyes, weapon and magic glow: lightning yellow (#fff36b) with crackling lightning around the weapon, like reference 2.
```

**Thợ mỏ lôi** (×1) — Đào vàng giữa trời giông
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Storm miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Lôi kiếm khách** (×1) — Kiếm sét chém ngọt
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: katana phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Thunder swordsman". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing katana. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Cung lôi tiễn** (×1) — Cung dài bắn chuẩn
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Bolt archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Ảnh lôi** (×0.95) — Tàng hình và lướt tới ám sát
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: katana phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Flicker". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing katana. Pose: crouched low, about to dash.
```

**Lính đao sét** (×1.15) — Đao dài quét trúng nhiều địch
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: đao cán dài phát sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Storm glaive". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing glaive. Pose: braced guard, weapon forward.
```

**Kỵ sĩ sấm** (×1.1) — Lao tới chém một nhát chí mạng
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi ngựa bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Thunder rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette horse with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Tu sĩ tĩnh điện** (×1) — Hồi máu
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Static monk". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Trống sấm** (×1) — Trống lớn thúc quân
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Thunder drum". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Lôi pháp sư** (×1.05) — Bùa sét nổ diện rộng
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Thunder caster". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy phóng sét** (×1.25) — Phá tượng ×3
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: máy bắn đá bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Storm catapult". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette catapult with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Lôi thần khổng lồ** (×2.3) — Chùy sấm, da dày
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Thunder titan". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Thợ dựng cột thu lôi** (×1) — Dựng trạm sét
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Rod builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 6. 🩸 Huyết Nguyệt Giáo — Blood Moon Cult (hệ Huyết)

Hệ Huyết. Giáo phái trăng máu: cận chiến hung bạo, càng đau càng điên.

- Đầu: tóc dài rối bù + băng trán đỏ bay
- Giáp vai: giáp vai lông thú
- Vải: đỏ máu `#a3101e`
- Phát sáng: đỏ tươi `#ff2d3c` — giọt máu bay, hơi đỏ cuồng nộ

```
[B] Element: Blood (Blood Moon Cult). Head silhouette: long wild hair with a fluttering red headband. Shoulder gear: fur shoulder mantle. Cloth colour: blood red (#a3101e).
Eyes, weapon and magic glow: vivid red (#ff2d3c) with flying blood droplets, red rage steam.
```

**Nô lệ máu** (×1) — Biết cầm cuốc đánh trả
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Blood thrall". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Chiến binh huyết rìu** (×1) — Rìu chém xuyên giáp nhẹ
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: rìu phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Blood axeman". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing axe. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Lính ném rìu máu** (×1) — Ném rìu tầm gần, rất đau
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: lao / rìu ném phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Blood axe thrower". Cloth: long scarf streaming sideways. Gear: glowing throwing javelins or axes. Pose: drawing the bow or mid-throw.
```

**Cuồng huyết** (×0.95) — Lao vào giữa trận, máu càng thấp càng khủng
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: rìu phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Bloodfrenzy". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing axe. Pose: crouched low, about to dash.
```

**Nữ khiên máu** (×1.15) — Khiên tròn chắn đòn, giáp dày
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: giáo phát sáng, khiên tròn đen viền sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Blood shieldmaiden". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing spear, black round shield with a glowing rim. Pose: braced guard, weapon forward.
```

**Kỵ sĩ sói máu** (×1.1) — Sói phi nhanh nhất
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi sói bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Blood wolf rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette wolf with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Nữ tiên tri máu** (×1) — Hồi máu
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Blood seeress". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Tù và trăng máu** (×1) — Tiếng tù và làm quân hăng: +25% sát thương
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Blood moon horn". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Thầy huyết ấn** (×1.05) — Ấn máu làm chậm địch
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Blood rune caster". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Xe phá thành** (×1.25) — Không đánh quân, lao thẳng vào húc tượng (×3)
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: xe phá thành bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Battering ram". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette battering ram with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Huyết ma khổng lồ** (×2.3) — Đập làm chậm địch
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Blood behemoth". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Thợ đẽo gỗ** (×1) — Dựng trạm gỗ
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Woodcarver". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 7. 💎 Tinh Thạch Cốc — Crystal Vale (hệ Tinh thể)

Hệ Tinh thể. Thung lũng pha lê: giàu vàng, tượng vững, có chiến xa và tư tế tinh quang.

- Đầu: ba mảnh tinh thể mọc trên đầu
- Giáp vai: giáp vai tinh thể
- Vải: hồng tím `#b0249e`
- Phát sáng: hồng pha lê `#ff8af0` — mảnh pha lê lấp lánh, ánh khúc xạ

```
[B] Element: Crystal (Crystal Vale). Head silhouette: three crystal shards growing from the head. Shoulder gear: crystal shoulder guards. Cloth colour: magenta (#b0249e).
Eyes, weapon and magic glow: crystal pink (#ff8af0) with sparkling crystal shards, refracted light.
```

**Thợ đẽo tinh thể** (×1) — Mang về nhiều vàng
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Crystal cutter". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Kiếm sĩ liềm pha lê** (×1) — Đao cong móc khiên
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: liềm đao cong phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Crystal sickle blade". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing curved sickle blade. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Cung thủ pha lê** (×1) — Bắn tên
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Crystal archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Sát thủ lăng kính** (×0.95) — Lướt qua tiền tuyến
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Prism assassin". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing dagger. Pose: crouched low, about to dash.
```

**Vệ binh tinh thể** (×1.15) — Hút máu 15%
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: kích phát sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Crystal guardian". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing halberd. Pose: braced guard, weapon forward.
```

**Chiến xa pha lê** (×1.1) — Bánh xe nghiền cả đám khi lao tới
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi chiến xa bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Crystal chariot". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette chariot with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Tư tế tinh thể** (×1) — Hồi máu
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Crystal priest". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Chuông pha lê** (×1) — Thúc quân
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Crystal bell". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Tư tế tinh quang** (×1.05) — Cầu sáng thiêu đốt
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Starlight priest". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy phóng tinh thể** (×1.25) — Phá tượng ×3
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: máy bắn đá bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Crystal catapult". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette catapult with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Người khổng lồ pha lê** (×2.3) — Lời nguyền: đòn đánh để lại độc
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Crystal colossus". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Thợ mài đá quý** (×1) — Dựng trạm tinh thể
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Gem builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 8. 🪨 Bàn Thạch Bảo — Stone Bastion (hệ Thạch)

Hệ Thạch. Pháo đài đá tảng: giáp dày, súng đá và máy phóng. Đắt và chậm.

- Đầu: mũ đá thô gồ ghề, vết nứt sáng
- Giáp vai: giáp vai thép tán đinh
- Vải: nâu đất `#7a5c3e`
- Phát sáng: hổ phách `#e8b46a` — bụi đá, khe nứt hổ phách

```
[B] Element: Stone (Stone Bastion). Head silhouette: rough rock helmet with a glowing crack. Shoulder gear: riveted steel pauldrons. Cloth colour: earth brown (#7a5c3e).
Eyes, weapon and magic glow: amber (#e8b46a) with stone dust, amber cracks.
```

**Thợ khoan đá** (×1) — Mũi khoan đào nhanh
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: mũi khoan cầm tay phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Rock driller". Cloth: short scarf. Gear: glowing hand drill. Pose: tool on the shoulder, relaxed.
```

**Kiếm sĩ đá** (×1) — Kiếm và giáp đá
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: kiếm cong phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Stone swordsman". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing saber. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Lính súng đá** (×1) — Đạn đá xuyên giáp, nạp đạn chậm
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: súng dài phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Stone gunner". Cloth: long scarf streaming sideways. Gear: glowing long gun. Pose: drawing the bow or mid-throw.
```

**Thích khách móc đá** (×0.95) — Phóng móc lướt tới hàng sau
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Grapple stalker". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing dagger. Pose: crouched low, about to dash.
```

**Vệ binh bàn thạch** (×1.15) — Giáp dày nhất
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: giáo phát sáng, khiên vuông đen viền sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Bedrock guard". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing spear, black square shield with a glowing rim. Pose: braced guard, weapon forward.
```

**Kỵ sĩ lợn đá** (×1.1) — Nhanh, húc mạnh
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi lợn rừng bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Stone boar rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette boar with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Thợ vá đá** (×1) — Vá giáp, hồi máu
- Vải: áo choàng dài tới chân
- Vũ khí / phép: búa phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Stonemender". Cloth: ankle-length robe-cape. Gear: glowing hammer. Pose: staff raised, other palm open casting heal.
```

**Kèn đá vang** (×1) — Tiếng kèn thúc quân
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Echo horn". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Lính phun dung nham** (×1.05) — Lửa tầm gần, đốt liên tục
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: súng dài phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Magma sprayer". Cloth: hooded cloak. Gear: glowing long gun, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy phóng tảng** (×1.25) — Bắn xa, phá tượng ×3
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: máy bắn đá bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Boulder launcher". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette catapult with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Người đá** (×2.3) — Giáp đá dày
- Vải: vải rách vắt một vai
- Vũ khí / phép: búa phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Stone golem". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing hammer. Pose: towering, menacing hunch.
```

**Thợ đục đá** (×1) — Dựng trạm súng đá
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Stonecutter". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 9. ⚒️ Thiết Lò Môn — Iron Forge Sect (hệ Kim)

Hệ Kim. Môn phái lò rèn: lì lợm, càng về cuối trận càng mạnh.

- Đầu: mũ sắt có mào và tấm che mũi
- Giáp vai: giáp vai thép tán đinh
- Vải: xám thép `#56606e`
- Phát sáng: cam lò rèn `#ff8c3a` — tia lửa đe rèn, kim loại nung đỏ

```
[B] Element: Metal (Iron Forge Sect). Head silhouette: iron helmet with a crest and nose guard. Shoulder gear: riveted steel pauldrons. Cloth colour: steel grey (#56606e).
Eyes, weapon and magic glow: forge orange (#ff8c3a) with anvil sparks, red-hot metal.
```

**Thợ mỏ sắt** (×1) — Đào nhanh, chắc tay
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Iron miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Chiến binh rìu thép** (×1) — Lì lợm, giáp dày
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: rìu phát sáng, khiên tròn đen viền sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Steel axeman". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing axe, black round shield with a glowing rim. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Lính hoả thương** (×1) — Đạn chì xuyên giáp, nạp chậm
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: súng dài phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Fire-lance gunner". Cloth: long scarf streaming sideways. Gear: glowing long gun. Pose: drawing the bow or mid-throw.
```

**Thợ đào hầm** (×0.95) — Chui lên giữa hàng sau địch
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Tunneler". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing pickaxe. Pose: crouched low, about to dash.
```

**Vệ binh khiên sắt** (×1.15) — Khiên vuông, giáp cực dày
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: búa phát sáng, khiên vuông đen viền sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Ironshield guard". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing hammer, black square shield with a glowing rim. Pose: braced guard, weapon forward.
```

**Kỵ sĩ chiến mã thép** (×1.1) — Húc chắc, máu trâu
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi ngựa bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Steel steed rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette horse with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Thợ rèn ấn** (×1) — Gõ ấn hồi máu
- Vải: áo choàng dài tới chân
- Vũ khí / phép: búa phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Runesmith". Cloth: ankle-length robe-cape. Gear: glowing hammer. Pose: staff raised, other palm open casting heal.
```

**Kèn đồng lò** (×1) — Tiếng kèn làm quân vững tay
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Forge horn". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Pháp sư ấn lửa** (×1.05) — Ấn nổ diện rộng
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Forge rune mage". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Đại pháo** (×1.25) — Bắn xa, phá tượng ×3
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: đại pháo bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Great cannon". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette cannon with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Người thép** (×2.3) — Thân thép, giáp dày
- Vải: vải rách vắt một vai
- Vũ khí / phép: búa phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Iron golem". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing hammer. Pose: towering, menacing hunch.
```

**Thợ dựng lò** (×1) — Dựng trạm rèn bắn súng
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Forge builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 10. 🌊 Thủy Nguyệt Cung — Tidal Moon Court (hệ Thủy)

Hệ Thủy. Cung điện trăng nước: đánh lâu không mệt nhờ hút máu.

- Đầu: tóc dài uốn như con sóng, giọt nước sáng
- Giáp vai: giáp vai vỏ sò
- Vải: xanh biển `#1d5fd1`
- Phát sáng: xanh nước `#4fd2ff` — bọt nước, gợn sóng

```
[B] Element: Water (Tidal Moon Court). Head silhouette: long hair curling like a wave, glowing water droplets. Shoulder gear: seashell shoulder guards. Cloth colour: ocean blue (#1d5fd1).
Eyes, weapon and magic glow: aqua blue (#4fd2ff) with bubbles and ripples.
```

**Thợ mò ngọc** (×1) — Lặn mò vàng
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Pearl diver". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Lính đinh ba** (×1) — Đâm nhanh
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: đinh ba phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Trident warrior". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing trident. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Lính phóng lao nước** (×1) — Lao xuyên, khắc kỵ binh
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: lao / rìu ném phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Tide harpooner". Cloth: long scarf streaming sideways. Gear: glowing throwing javelins or axes. Pose: drawing the bow or mid-throw.
```

**Thích khách sóng ngầm** (×0.95) — Lướt tới, dao tẩm độc
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Undertow assassin". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing dagger. Pose: crouched low, about to dash.
```

**Vệ binh mai rùa** (×1.15) — Mai rùa chắn đòn
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: đinh ba phát sáng, khiên bầu dục đen viền sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Turtle-shell guard". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing trident, black oval shield with a glowing rim. Pose: braced guard, weapon forward.
```

**Kỵ sĩ cá mập** (×1.1) — Lao như cá mập săn mồi
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi cá mập lướt sóng bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Shark rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette shark surfing a wave with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Tiên cá** (×1) — Hồi máu cho cả nhóm
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Mermaid". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Tù và ốc** (×1) — Tiếng ốc thúc quân
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Conch horn". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Pháp sư triều cường** (×1.05) — Sóng nước hất địch lùi
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Tidecaller". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy phóng lao** (×1.25) — Lao khổng lồ, khắc quân to
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: nỏ khổng lồ bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Harpoon ballista". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette giant ballista with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Thủy quái** (×2.3) — Xúc tu quất cả đám
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Deep kraken". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Thợ san hô** (×1) — Dựng trạm san hô
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Coral builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 11. 🔥 Viêm Long Môn — Flame Dragon Sect (hệ Hỏa)

Hệ Hỏa. Môn phái rồng lửa: mọi đòn đều để lại lửa.

- Đầu: tóc dựng như ngọn lửa, đầu tóc cháy sáng
- Giáp vai: giáp vai vảy rồng
- Vải: đỏ cam lửa `#d9381e`
- Phát sáng: cam lửa `#ff7a1a` — lửa bập bùng, tàn lửa (như mẫu 1)

```
[B] Element: Fire (Flame Dragon Sect). Head silhouette: spiky hair shaped like flames with burning tips. Shoulder gear: dragon-scale shoulder guards. Cloth colour: flame red-orange (#d9381e).
Eyes, weapon and magic glow: fire orange (#ff7a1a) with flickering flames and embers, like reference 1.
```

**Thợ mỏ lửa** (×1) — Đào vàng trong núi lửa
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Lava miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Hiệp sĩ hỏa long** (×1) — Kiếm lửa
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: trường kiếm phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Flame knight". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing straight longsword. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Cung thủ hỏa tiễn** (×1) — Tên lửa bắn xa
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Fire archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Sát thủ tro** (×0.95) — Lướt tới hàng sau
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Ash assassin". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing dagger. Pose: crouched low, about to dash.
```

**Vệ binh vảy rồng** (×1.15) — Vảy rồng cứng
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: kích phát sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Dragonscale guard". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing halberd. Pose: braced guard, weapon forward.
```

**Kỵ sĩ thằn lằn** (×1.1) — Thằn lằn lửa phi nhanh
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi thằn lằn lửa bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Salamander rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette fire lizard with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Tư tế lửa thiêng** (×1) — Lửa thiêng hồi máu
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Flame priest". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Trống rồng** (×1) — Tiếng gầm thúc quân
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Dragon drum". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Pháp sư hỏa cầu** (×1.05) — Cầu lửa nổ lớn
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Pyromancer". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy bắn đá lửa** (×1.25) — Đá lửa phá tượng ×3
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: máy bắn đá bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Fire catapult". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette catapult with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Rồng con** (×2.3) — Phun lửa trúng cả đám
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Young dragon". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Thợ lò** (×1) — Dựng trạm lửa
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Kiln builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

## 12. ❄️ Hàn Băng Cung — Frost Palace (hệ Băng)

Hệ Băng. Cung điện băng giá: khống chế địch bằng giá lạnh.

- Đầu: tóc dựng + vương miện băng nhọn
- Giáp vai: giáp vai băng
- Vải: xanh băng nhạt `#9cc9f5`
- Phát sáng: trắng băng `#e3f6ff` — bông tuyết, hơi lạnh

```
[B] Element: Ice (Frost Palace). Head silhouette: spiky hair with a sharp ice crown. Shoulder gear: ice shoulder guards. Cloth colour: pale ice blue (#9cc9f5).
Eyes, weapon and magic glow: icy white (#e3f6ff) with snowflakes and cold mist.
```

**Thợ đục băng** (×1) — Đục vàng trong băng
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Ice miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Kiếm sĩ hàn băng** (×1) — Kiếm băng
- Vải: áo choàng dài rách gấu + khăn quàng (như mẫu 1)
- Vũ khí / phép: trường kiếm phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên (như mẫu)
```
[C] Unit: melee swordsman "Frost swordsman". Cloth: long tattered cape and neck scarf, like reference 1. Gear: glowing straight longsword. Pose: weapon held low and diagonal, ready to charge, like the references.
```

**Cung thủ băng** (×1) — Tên băng bắn xa
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Ice archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Bóng tuyết** (×0.95) — Lướt theo gió tuyết tới hàng sau
- Vải: khăn rất dài bay thành vệt (như mẫu 2)
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Snow shade". Slightly smaller and leaner. Cloth: very long trailing scarf, like reference 2. Gear: glowing dagger. Pose: crouched low, about to dash.
```

**Vệ binh băng giáp** (×1.15) — Giáp băng dày
- Vải: áo choàng ngắn trên vai
- Vũ khí / phép: giáo phát sáng, khiên tròn đen viền sáng
- Dáng: đứng chắn, vũ khí chĩa trước
```
[C] Unit: shield tank "Ice-armour guard". Slightly bigger and sturdier. Cloth: short shoulder cape. Gear: glowing spear, black round shield with a glowing rim. Pose: braced guard, weapon forward.
```

**Kỵ sĩ gấu tuyết** (×1.1) — Gấu to, máu trâu
- Vải: áo choàng bay + tấm phủ yên
- Vũ khí / phép: cưỡi gấu bóng đen mắt sáng; thương kỵ phát sáng
- Dáng: thú cưỡi phi, vũ khí chĩa trước
```
[C] Unit: cavalry rider "Snow bear rider". Cloth: flying cape and a saddle cloth. Gear: riding a black silhouette bear with glowing eyes, glowing lance. Pose: mount galloping, weapon forward.
```

**Pháp sư tuyết** (×1) — Hồi máu
- Vải: áo choàng dài tới chân
- Vũ khí / phép: gậy phép phát sáng
- Dáng: giơ gậy, tay kia xoè hồi máu
```
[C] Unit: healer "Snow mage". Cloth: ankle-length robe-cape. Gear: glowing staff. Pose: staff raised, other palm open casting heal.
```

**Kèn bão tuyết** (×1) — Thúc quân
- Vải: khăn quàng + lá cờ cùng màu
- Vũ khí / phép: cờ / trống / kèn, sóng âm phát sáng
- Dáng: giơ cờ / trống / kèn thúc quân
```
[C] Unit: war musician (buffs allies) "Blizzard horn". Cloth: scarf and a flag of the same colour. Gear: banner, drum or horn with glowing sound waves. Pose: raising the banner, drum or horn.
```

**Pháp sư băng** (×1.05) — Bão băng làm chậm lâu
- Vải: áo choàng có mũ trùm
- Vũ khí / phép: gậy phép phát sáng, phép của hệ bay ra từ tay
- Dáng: tay đưa phép ra trước
```
[C] Unit: battle mage "Frost mage". Cloth: hooded cloak. Gear: glowing staff, elemental spell blasting from the hand. Pose: spell thrust forward.
```

**Máy ném băng** (×1.25) — Tảng băng phá tượng ×3
- Vải: khăn của người điều khiển, dải vải buộc trên máy
- Vũ khí / phép: máy bắn đá bóng đen, phần năng lượng phát sáng; một người que điều khiển
- Dáng: người que kéo dây, tay đòn ngả sau
```
[C] Unit: siege engine "Ice catapult". Slightly bigger and sturdier. Cloth: operator scarf, ribbons tied on the machine. Gear: black silhouette catapult with glowing elemental parts, one stickman operator. Pose: stickman pulling the rope, arm cocked back.
```

**Người tuyết khổng lồ** (×2.3) — Đập làm đóng băng
- Vải: vải rách vắt một vai
- Vũ khí / phép: chùy khổng lồ phát sáng
- Dáng: to lớn, đứng khom đe doạ
```
[C] Unit: giant "Snow giant". Towering, much larger and bulkier than a normal stickman. Cloth: torn cloth over one shoulder. Gear: glowing giant club. Pose: towering, menacing hunch.
```

**Thợ băng** (×1) — Dựng trạm băng
- Vải: khăn buộc ngang hông như tạp dề
- Vũ khí / phép: búa phát sáng
- Dáng: vác búa và vật liệu
```
[C] Unit: builder "Ice builder". Cloth: cloth tied at the waist like an apron. Gear: glowing hammer. Pose: hammer and materials on the shoulder.
```

---

# Phần 2: Công trình, mỏ, bản đồ, hiệu ứng

Công trình và bản đồ **không** dùng khối [A]. Dùng khối phong cách riêng dưới đây, ghép với khối [B] của hệ nếu muốn.

### [A-S] Phong cách công trình (tượng nhà, trạm, tường, mỏ, vật phẩm)

```
2D game asset sheet for a side-scrolling stickman war game, night battlefield style. One structure shown in two views side by side
on a light grey background with faint guide lines: SIDE VIEW (main, as seen in game) and 3/4 FRONT VIEW, labelled in bold black caps.
Dark silhouette materials that almost blend into the night, with neon glowing details in the element colour (runes, windows, cracks,
fire) and a thin rim light along the edges. Clean cel-shaded anime game art, crisp dark outlines, flat colours, soft bloom on glowing
parts. Object standing on a small patch of dark ground, full object visible, no other scenery.
```

### [A-M] Phong cách bản đồ / phong cảnh

```
2D side-scrolling game background, wide panoramic 21:9, layered parallax night landscape, cel-shaded anime game art, flat colours
with soft gradients, crisp silhouettes. Layers from back to front: night sky gradient with stars, a huge glowing moon with a halo,
three mountain ridge silhouettes getting darker toward the front with a thin lit rim, distant buildings with lit windows, then a flat
dark rocky ground strip across the bottom third with glowing cracks. The ground strip must be flat and empty (units walk on it).
No characters, no text, no UI.
```

## 2.1 Tượng nhà

Mục tiêu cần phá để thắng: cao khoảng 3 lần người que, trên bệ đá thấp, quầng sáng năng lượng phía sau.

```
[C-S] Structure: home monument of the element, the main base objective, about three times the height of a stickman.
```

**☀️ Thánh Quang Điện (hệ Quang)** — Cột đá trắng đỡ đĩa mặt trời, tia sáng xoay chậm quanh đĩa. Phát sáng `#ffe08a`.
```
A white stone pillar holding a radiant sun disk with slowly rotating light rays. Glow colour #ffe08a.
```

**🌪️ Cuồng Phong Trại (hệ Phong)** — Tháp đá xoắn, cánh chong chóng gió quay trên đỉnh, vệt gió bay ngang. Phát sáng `#c6fff0`.
```
A twisted stone tower with windmill blades spinning on top, wind streaks flowing past. Glow colour #c6fff0.
```

**🌿 Thanh Mộc Lâm (hệ Mộc)** — Cây thiêng tán xanh, đốm sáng bay quanh tán. Phát sáng `#7dff6a`.
```
A sacred tree with a green canopy and glowing motes around it. Glow colour #7dff6a.
```

**🌑 Hội Bóng Đêm (hệ Ám)** — Tháp đá đen nhọn, con mắt tím mở giữa thân, khói bóng tối bay lên. Phát sáng `#b388ff`.
```
A sharp black obsidian spire with a glowing violet eye opening in the middle, shadow smoke rising. Glow colour #b388ff.
```

**⚡ Lôi Kiếm Các (hệ Lôi)** — Cột thu lôi ba tầng, tia sét chớp giữa hai sừng kim loại trên đỉnh. Phát sáng `#fff36b`.
```
A three-tiered lightning rod tower, lightning arcing between two metal horns at the top. Glow colour #fff36b.
```

**🩸 Huyết Nguyệt Giáo (hệ Huyết)** — Bàn thờ đá hai cột, vầng trăng máu lơ lửng phía trên, rãnh máu chảy xuống. Phát sáng `#ff2d3c`.
```
A stone altar with two pillars, a blood-red crescent moon floating above, a blood channel running down. Glow colour #ff2d3c.
```

**💎 Tinh Thạch Cốc (hệ Tinh thể)** — Viên pha lê khổng lồ lơ lửng xoay trên đế đá, mảnh vụn bay vòng quanh. Phát sáng `#ff8af0`.
```
A giant crystal floating and slowly turning above a stone base, shards orbiting it. Glow colour #ff8af0.
```

**🪨 Bàn Thạch Bảo (hệ Thạch)** — Cổng cự thạch hai cột một xà, khe nứt hổ phách phát sáng. Phát sáng `#e8b46a`.
```
A megalithic stone gate of two pillars and a lintel with glowing amber cracks. Glow colour #e8b46a.
```

**⚒️ Thiết Lò Môn (hệ Kim)** — Đe sắt trên tảng đá, búa lớn dựng cạnh, ấn cam phát sáng. Phát sáng `#ff8c3a`.
```
A giant anvil on a boulder, a big hammer leaning beside it, glowing orange runes. Glow colour #ff8c3a.
```

**🌊 Thủy Nguyệt Cung (hệ Thủy)** — Đinh ba khổng lồ cắm trên vỏ ốc xoắn. Phát sáng `#4fd2ff`.
```
A giant trident standing on a huge spiral shell. Glow colour #4fd2ff.
```

**🔥 Viêm Long Môn (hệ Hỏa)** — Đầu rồng đá há miệng, lửa bập bùng trong miệng. Phát sáng `#ff7a1a`.
```
A carved stone dragon head with open jaws and flickering fire inside. Glow colour #ff7a1a.
```

**❄️ Hàn Băng Cung (hệ Băng)** — Cụm tinh thể băng trong suốt. Phát sáng `#e3f6ff`.
```
A cluster of clear ice crystals. Glow colour #e3f6ff.
```

## 2.2 Trạm vàng / trạm canh

Tháp hẹp cao khoảng 1.4 lần người que, thuôn dần lên, đỉnh có lỗ châu mai, khe bắn phát sáng (một khe giữa thân, hai khe nhỏ phía dưới),
cờ nhỏ màu vải của hệ trên đỉnh. Thợ mỏ nộp vàng ở đây.

```
[C-S] Structure: small gold depot watchtower about 1.4 times the height of a stickman, tapering upward, crenellated top, one tall
glowing arrow slit and two small slits below, a small pennant in the element cloth colour on top, a few gold sacks at the foot.
```

| Hệ | Tên trạm | Vật liệu | Phát sáng |
|---|---|---|---|
| ☀️ Thánh Quang Điện | Tháp ánh sáng | đá trắng ngà, viền vàng | `#ffe08a` |
| 🌪️ Cuồng Phong Trại | Tháp chong chóng | gỗ ngọc bích, đỉnh có chong chóng | `#c6fff0` |
| 🌿 Thanh Mộc Lâm | Trạm cây | gỗ sống, đỉnh là tán lá tròn có đom đóm | `#7dff6a` |
| 🌑 Hội Bóng Đêm | Tháp bóng đêm | đá hắc thạch, khe sáng tím | `#b388ff` |
| ⚡ Lôi Kiếm Các | Cột thu lôi | đá xám tím, đỉnh là cột thu lôi | `#fff36b` |
| 🩸 Huyết Nguyệt Giáo | Trạm trăng máu | gỗ đỏ thẫm, đai sẫm | `#ff2d3c` |
| 💎 Tinh Thạch Cốc | Trạm tinh thể | pha lê hồng tím | `#ff8af0` |
| 🪨 Bàn Thạch Bảo | Tháp súng đá | đá tảng, khe nứt hổ phách | `#e8b46a` |
| ⚒️ Thiết Lò Môn | Trạm lò rèn | thép xám, lò rèn nhỏ ở chân | `#ff8c3a` |
| 🌊 Thủy Nguyệt Cung | Trạm san hô | san hô xanh biển | `#4fd2ff` |
| 🔥 Viêm Long Môn | Trạm lửa | đá đỏ sẫm, khe dung nham | `#ff7a1a` |
| ❄️ Hàn Băng Cung | Trạm băng | băng trắng xanh | `#e3f6ff` |

## 2.3 Tường thành có cổng

Bức tường cao khoảng 1.4 lần người que, cổng hai cánh ở giữa (vẽ 2 trạng thái: cổng đóng / cổng mở), viền năng lượng quanh thân.

```
[C-S] Structure: defensive wall segment with a double gate in the middle, about 1.4 times the height of a stickman, side view.
Show two states side by side: GATE CLOSED and GATE OPEN.
```

**☀️ Tường đá trắng** (Thánh Quang Điện) — Tường đá trắng có cổng, chắc chắn và cân bằng. Đá trắng xếp khối, răng cưa, đường viền vàng sáng.
```
White stone blocks, crenellated top, a glowing gold trim line.
```

**🌪️ Rào gió gai** (Cuồng Phong Trại) — Đánh cận chiến vào rào bị gai đâm lại. Cọc gỗ ngọc bích vót nhọn, gai chĩa ra phía địch.
```
Sharpened jade-green wooden stakes with spikes pointing at the enemy.
```

**🌿 Tường cây** (Thanh Mộc Lâm) — Cây sống tự mọc lại 6 máu/giây. Tường cây sống, dây leo uốn lượn, đỉnh tán lá tròn.
```
A living tree wall laced with vines, round leaf clumps on top.
```

**🌑 Tường hắc thạch** (Hội Bóng Đêm) — Rẻ nhưng mỏng. Đá hắc thạch, vân tím phát sáng, đỉnh gai nhọn.
```
Obsidian blocks with glowing violet veins, jagged spikes on top.
```

**⚡ Thành sấm** (Lôi Kiếm Các) — Dựng nhanh (4 giây). Đá xám tím, nẹp kim loại hai mép, vạch sét vàng nhấp nháy.
```
Slate stone with metal edge braces and a flickering yellow lightning mark.
```

**🩸 Hàng cọc máu** (Huyết Nguyệt Giáo) — Rẻ, dựng nhanh, hơi mỏng. Cọc gỗ đỏ thẫm, đai sẫm, đầu cọc nhuốm máu.
```
Dark red wooden stakes with dark bands, blood-stained tips.
```

**💎 Tường pha lê** (Tinh Thạch Cốc) — Dày, nhiều máu. Khối pha lê hồng tím, mảnh tinh thể nhọn trên đỉnh.
```
Magenta crystal blocks with sharp crystal spikes on top.
```

**🪨 Tường bàn thạch** (Bàn Thạch Bảo) — Giáp rất dày nhưng đắt. Đá tảng thô, khe nứt hổ phách nhấp nháy.
```
Rough boulder wall with pulsing amber cracks.
```

**⚒️ Tường thép rèn** (Thiết Lò Môn) — Trâu nhất nhưng dựng chậm (9 giây). Tấm thép tán đinh, khe lò rèn cam ở giữa.
```
Riveted steel plates with an orange forge slit in the middle.
```

**🌊 Rạn san hô** (Thủy Nguyệt Cung) — San hô tự mọc lại 5 máu/giây. Rạn san hô, đốm san hô hồng cam, đỉnh vòm tròn.
```
A coral reef wall with pink and orange polyps and a rounded top.
```

**🔥 Tường đá lửa** (Viêm Long Môn) — Đánh cận chiến vào tường bị đốt. Đá núi lửa đen, khe nứt dung nham nhấp nháy, đỉnh gai vảy rồng.
```
Black volcanic stone with pulsing lava cracks and dragon-scale spikes on top.
```

**❄️ Tường băng** (Hàn Băng Cung) — Đánh cận chiến vào tường bị làm chậm. Khối băng xếp, vệt phản sáng trắng, đỉnh gai băng.
```
Stacked ice blocks with white light streaks and icicle spikes on top.
```

## 2.4 Mỏ và vàng

Mỏ bạc sát nhà, mỏ vàng xa hơn, mỏ kim cương giữa bản đồ. Đống đá tối thấp mọc tinh thể quặng phát sáng, quầng sáng màu quặng trên đất.

```
Small silver mine: low dark rock pile with slender silver-white crystals (#cfd6de), cool pale glow.
Medium gold mine: dark rock pile with chunky gold crystals and nuggets (#f2c230), warm golden glow and sparkles.
Large diamond mine in the middle: big symmetrical rock mound with tall cyan diamond crystals (#6fe7ff), strong cyan glow.
Dropped loot: a small bulging cloth sack, a few gold coins spilling out, golden glow beneath.
```

## 2.5 Bản đồ / chiến trường

Một đường ngang dài, mỗi nửa bản đồ vẽ theo hệ bên đó, ở giữa chuyển dần. Dán [A-M] rồi thêm dòng của hệ.

**☀️ Thánh Quang Điện** — Bình minh vàng sau dãy núi tím, đền trắng thắp đèn, bụi sáng bay.
```
Theme: Golden dawn behind violet mountains, white temples with lit windows, floating light motes. Accent glow #ffe08a.
```

**🌪️ Cuồng Phong Trại** — Thung lũng gió xanh ngọc, mây trôi nhanh, bụi cuốn.
```
Theme: A jade wind valley, fast clouds, swirling dust. Accent glow #c6fff0.
```

**🌿 Thanh Mộc Lâm** — Rừng già đêm, cây cao, lá rơi.
```
Theme: An ancient night forest, tall trees, falling leaves. Accent glow #7dff6a.
```

**🌑 Hội Bóng Đêm** — Vực bóng đêm tím, khói đen trôi.
```
Theme: A violet abyss of night, black smoke drifting. Accent glow #b388ff.
```

**⚡ Lôi Kiếm Các** — Đồi bão tím, mây giông, chớp vàng.
```
Theme: Violet storm hills, thunderclouds, yellow lightning. Accent glow #fff36b.
```

**🩸 Huyết Nguyệt Giáo** — Đêm trăng máu, núi đỏ thẫm.
```
Theme: A blood-moon night over crimson mountains. Accent glow #ff2d3c.
```

**💎 Tinh Thạch Cốc** — Thung lũng pha lê hồng tím, tinh thể mọc trên núi.
```
Theme: A magenta crystal valley with crystals growing from the mountains. Accent glow #ff8af0.
```

**🪨 Bàn Thạch Bảo** — Hẻm núi đá hổ phách, vách đá cao, bụi đá.
```
Theme: An amber stone canyon with tall cliffs and stone dust. Accent glow #e8b46a.
```

**⚒️ Thiết Lò Môn** — Núi sắt lò rèn, tàn lửa bay.
```
Theme: Iron mountains with forges, floating embers. Accent glow #ff8c3a.
```

**🌊 Thủy Nguyệt Cung** — Biển đêm xanh thẳm, bong bóng bay lên.
```
Theme: A deep blue night sea, bubbles rising. Accent glow #4fd2ff.
```

**🔥 Viêm Long Môn** — Núi lửa, dung nham, tàn lửa bay.
```
Theme: Volcanoes, lava, rising embers. Accent glow #ff7a1a.
```

**❄️ Hàn Băng Cung** — Xứ tuyết, núi băng, tuyết rơi.
```
Theme: A land of snow and ice mountains, falling snow. Accent glow #e3f6ff.
```

## 2.6 Đạn và hiệu ứng

```
2D game VFX sprite sheet, each effect in its own cell on a light grey background, cel-shaded with strong neon bloom, side view, motion
trails: arrow, javelin, spinning axe, boulder, cannonball, bullet streak, fireball (#ffb347/#ff7b00), poison orb (#a3e635/#4d7c0f),
lightning orb (#e0f2fe/#38bdf8), sun orb (#fef08a/#f59e0b), wind tornado (#ecfdf5/#6ee7b7), white hit spark, green healing rings,
three gold veteran stars, explosion with debris, dash afterimages, violet summoning smoke, small ice crystals, stealth silhouette.
```

## 2.7 Vật phẩm khác

```
Rally flag: a pole planted in the ground with a waving triangular flag, a glowing ring at its base.
Wall placement ghost: translucent wall outline, green (valid) and red (invalid), plus an under-construction version with scaffolding.
```
