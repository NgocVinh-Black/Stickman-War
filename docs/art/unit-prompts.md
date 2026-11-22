# Mô tả chi tiết lính 12 hệ — dùng làm prompt ảnh

12 nền văn minh của game là **12 hệ** (Quang, Phong, Mộc, Ám, Lôi, Huyết, Tinh thể, Thạch, Kim, Thủy, Hỏa, Băng).
Phong cách **bắt buộc theo 12 ảnh mẫu từng hệ** trong `docs/art/demo/<mã hệ>.png` (đính kèm ảnh của hệ khi tạo ảnh lính):

| Hệ | Ảnh mẫu | Hệ | Ảnh mẫu |
|---|---|---|---|
| Quang | `light.png` | Tinh thể | `crystal.png` |
| Phong | `wind.png` | Thạch | `stone.png` |
| Mộc | `wood.png` | Kim | `metal.png` |
| Ám | `shadow.png` | Thủy | `water.png` |
| Lôi | `thunder.png` | Hỏa | `fire.png` |
| Huyết | `blood.png` | Băng | `ice.png` |

2 ảnh cũ ở `docs/art/reference/` chỉ còn dùng để tham khảo dáng cầm vũ khí.
Tên lính, vũ khí, thú cưỡi lấy từ lõi game (`packages/core/src/factions.ts`); màu lấy từ `apps/web/src/game/render/palette.ts`
(`CLOTH` = màu vải, `ENERGY` = màu phát sáng, `SKIN` = màu thân, viền sáng, tóc và chi tiết trên thân của từng hệ).
Sửa màu / kiểu hệ trong game thì sửa file này cho khớp. **Prompt gộp sẵn theo hệ (mỗi hệ 16: 12 lính + tháp, tường, tượng nhà, bản đồ), mỗi cái một dòng để copy — bản mới nhất, ưu tiên dùng**: `docs/art/element-prompts.md`.

## Quy tắc phong cách (rút từ 12 ảnh mẫu, áp cho mọi lính)

1. **Bảng 3 góc nhìn** cạnh nhau trên nền xám rất nhạt có vài đường kẻ ngang mờ: TỪ TRƯỚC (FRONT VIEW), TỪ TRÊN XUỐNG (TOP-DOWN VIEW),
   TỪ BÊN PHẢI (RIGHT SIDE VIEW), chữ đen đậm in hoa phía trên mỗi hình.
2. **Thân người que tối màu ánh màu hệ** (riêng Thủy là thân nước trong): tay chân mảnh, đầu tròn, bàn tay tròn đơn giản,
   **không có mặt** (không mũi, miệng), **không vẽ da / cơ**. **Viền sáng màu hệ** chạy quanh thân.
   Chi tiết trên thân theo hệ (giáp bạc, tinh thể, vỏ cây, vết nứt, băng vải…) như ảnh mẫu, không thêm trang bị khác.
3. **Đôi mắt xếch sắc** phát sáng (lõi trắng, quầng màu hệ), là chi tiết duy nhất trên mặt.
4. **Tóc dựng to theo hệ** là dấu hiệu nhận diện chính, mang màu / chất liệu của hệ (vàng rực, bạc, lá, khói, tia sét, lửa, băng…).
5. **Vải chỉ một màu** (màu vải của hệ): khăn quàng và / hoặc áo choàng, **gấu rách**, bay theo gió, tô phẳng.
6. **Vũ khí và phép phát sáng neon** màu năng lượng của hệ: lõi trắng nóng, quầng sáng mềm, kèm hiệu ứng của hệ quanh người.
7. Nét viền tối rõ, tô phẳng kiểu anime game, **không 3D**. Cùng một nhân vật, cùng tỉ lệ, cùng màu ở cả 3 góc.
8. Thú cưỡi và máy móc là **bóng đen**, chỉ mắt / phần năng lượng phát sáng.

## Cách ghép prompt

Một prompt = **[A] Phong cách chung** + **[B] Hệ** + **[C] Lính**, dán liền nhau.

### [A] Phong cách chung

```
Character turnaround sheet in the exact style of the attached element reference image (stickman anime game art): three views side by
side on a very light grey background with a few faint horizontal guide lines, labelled above in bold black caps "FRONT VIEW",
"TOP-DOWN VIEW", "RIGHT SIDE VIEW". The character is a stickman with a dark silhouette body tinted with the element colour and a glowing
element-coloured rim light: thin limbs, round head, simple round hands, no face except two sharp slanted glowing eyes (white core).
Big spiky element hair (colour and material of the element). No skin, no muscles; body details only as described for the element.
Cloth (scarf and/or cape) in one single strong colour with torn ragged edges flowing in the wind, flat cel shading. The weapon glows
with a white-hot core, a coloured neon edge and soft bloom, with the element's effects around the body. Clean 2D cel-shaded game art,
crisp dark outlines. Same character, same proportions and colours in all three views.
Full body, feet visible, no scenery.
```

Negative prompt:

```
realistic, 3d render, detailed face, mouth, nose, skin, muscles, bulky armour, extra limbs, extra fingers,
multiple cloth colours, busy background, scenery, cropped feet, inconsistent views, watermark
```

### Màu

Trong trận lính giữ đúng màu vải của hệ; phe phân biệt bằng **thanh máu luôn hiện trên đầu** (xanh lá phe mình, đỏ phe địch).
Không cần vẽ hai bản màu phe.

---

## 1. ☀️ Thánh Quang Điện — Temple of Light (hệ Quang)

Hệ Quang. Đạo quân ánh sáng kỷ luật: cân bằng, dễ chơi, đủ mọi loại quân.

- Đầu: bờm tóc vàng rực dựng ngược như lửa, toả sáng
- Thân: nắm tay toé tia sáng vàng, bụi sáng bay quanh người
- Vải: vàng ánh kim `#e8a91c`
- Phát sáng: vàng rực `#ffd84a` — tia sáng, bụi sáng lấp lánh
- Ảnh mẫu: `docs/art/demo/light.png`

```
[B] Element: Light (Temple of Light). Match the attached element reference image. Head: big glowing golden spiky hair blazing upward like flames. Body: black silhouette with a strong golden rim glow, golden sparks crackling around the fists, glittering gold motes. Cloth colour: rich gold (#e8a91c), long scarf flowing into a cape.
Eyes, weapon and magic glow: radiant gold (#ffd84a) with light rays and glittering motes.
```

**Thợ mỏ** (×1) — Đào vàng nuôi quân. Chết thì rơi túi vàng đang mang
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Kiếm sĩ ánh sáng** (×1) — Cận chiến nhanh, rẻ
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: trường kiếm phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Light swordsman". Cloth: long tattered cape and neck scarf. Gear: glowing straight longsword. Pose: weapon held low and diagonal, ready to charge.
```

**Cung thủ quang tiễn** (×1) — Bắn tên sáng từ xa
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Radiant archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Thích khách ánh chớp** (×0.95) — Lướt qua tiền tuyến, ám sát hàng sau
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Flash assassin". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing dagger. Pose: crouched low, about to dash.
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

- Đầu: tóc trắng bạc dựng nhọn vuốt ngược gió
- Thân: băng vải trắng quấn cẳng tay và đai lưng, đôi cánh gió mờ, lốc xoáy dưới chân
- Vải: xanh trời `#2f8fc4`
- Phát sáng: xanh băng nhạt `#a8ecff` — lốc xoáy, vệt gió, bụi cuốn
- Ảnh mẫu: `docs/art/demo/wind.png`

```
[B] Element: Wind (Gale Horde). Match the attached element reference image. Head: silver-white spiky hair swept back by the wind. Body: dark navy silhouette, white bandage wraps on the forearms and a white waist sash, faint translucent wind wings behind the back, a swirling whirlwind around the feet. Cloth colour: sky blue (#2f8fc4), torn scarf.
Eyes, weapon and magic glow: pale icy cyan (#a8ecff) with swirling wind streaks and flying debris.
```

**Tiểu phong đào vàng** (×1) — Nhỏ, rẻ, chạy nhanh
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Breeze miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Chiến binh lốc** (×1) — Đao to bản, chém đau
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: đao to bản phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Whirlwind warrior". Cloth: long tattered cape and neck scarf. Gear: glowing huge cleaver. Pose: weapon held low and diagonal, ready to charge.
```

**Lính phóng lao gió** (×1) — Lao đâm xuyên, khắc kỵ binh
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: lao / rìu ném phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Gale javelineer". Cloth: long scarf streaming sideways. Gear: glowing throwing javelins or axes. Pose: drawing the bow or mid-throw.
```

**Bom lốc xoáy** (×0.95) — Lao vào giữa địch rồi tự nổ tung
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: quả bom dây cháy phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Cyclone bomber". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing round bomb with a lit fuse. Pose: crouched low, about to dash.
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

- Đầu: vương miện lá xanh thẫm dựng nhọn, gân lá sáng
- Thân: thân vỏ cây xanh thẫm, gai lá mọc ở vai, khuỷu, gối, dây leo và lá bay
- Vải: xanh rừng thẫm `#1f6b26`
- Phát sáng: xanh lá non `#7dff6a` — lá sáng, dây leo, đom đóm
- Ảnh mẫu: `docs/art/demo/wood.png`

```
[B] Element: Wood (Verdant Grove). Match the attached element reference image. Head: crown of dark green leaves standing up in spikes with glowing veins. Body: very dark green bark-textured silhouette, sharp leaf spikes growing from shoulders, elbows and knees, thin vines. Cloth colour: deep forest green (#1f6b26), ragged leafy cape.
Eyes, weapon and magic glow: bright leaf green (#7dff6a) with glowing leaves, vines and fireflies.
```

**Tinh linh hái vàng** (×1) — Bay nhanh giữa mỏ và nhà
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Gold sprite". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Vũ công kiếm lá** (×1) — Múa kiếm cực nhanh
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: kiếm cong phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Leaf blade dancer". Cloth: long tattered cape and neck scarf. Gear: glowing saber. Pose: weapon held low and diagonal, ready to charge.
```

**Cung thủ rừng** (×1) — Tầm bắn xa nhất
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Grove archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Thợ săn gai độc** (×0.95) — Lướt tới, mũi dao tẩm độc làm chậm
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Thorn hunter". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing dagger. Pose: crouched low, about to dash.
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

- Đầu: tóc tím đen rối như khói, khói tím bốc lên
- Thân: thân đen ánh tím, mép thân tan thành khói, mực đen bắn tung quanh chân
- Vải: tím than `#3d1a66`
- Phát sáng: tím ma `#b77bff` — khói bóng tối, vệt mực
- Ảnh mẫu: `docs/art/demo/shadow.png`

```
[B] Element: Shadow (Shadow Cult). Match the attached element reference image. Head: wild purple-black hair dissolving into smoke. Body: black silhouette with violet tint, edges of the body and cape dissolving into black ink smoke, ink splashes around the feet. Cloth colour: deep violet (#3d1a66), shredded smoky cape.
Eyes, weapon and magic glow: ghostly violet (#b77bff) with shadow smoke and ink wisps.
```

**Bóng đào vàng** (×1) — Rẻ, mỏng
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Shade miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Bóng binh** (×1) — Mỗi lần xây ra 2 con
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: trường kiếm phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Shadow soldiers". Cloth: long tattered cape and neck scarf. Gear: glowing straight longsword. Pose: weapon held low and diagonal, ready to charge.
```

**Cung bóng tối** (×1) — Bắn tên rẻ
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Dusk archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Bóng ma** (×0.95) — Tàng hình, chỉ lộ ra khi ra đòn
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: lưỡi hái phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Wraith". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing scythe. Pose: crouched low, about to dash.
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

- Đầu: tóc xanh thẫm gấp khúc như tia sét, viền vàng
- Thân: huy hiệu tia sét vàng trên ngực, tia điện vàng và xanh nhảy quanh tay
- Vải: xanh dương đậm `#1d4fa0` (khăn có sọc vàng)
- Phát sáng: vàng chớp `#ffe94a`, phụ xanh điện `#8fe3ff` — tia sét lách tách
- Ảnh mẫu: `docs/art/demo/thunder.png`

```
[B] Element: Lightning (Thunder Blade Hall). Match the attached element reference image. Head: dark navy zig-zag spiky hair shaped like lightning bolts with a bright yellow outline. Body: black silhouette with yellow rim light, a glowing yellow lightning-bolt emblem on the chest, yellow and electric-blue arcs crackling around the fists. Cloth colour: deep blue (#1d4fa0) long scarf with a yellow stripe.
Eyes, weapon and magic glow: lightning yellow (#ffe94a) with electric blue (#8fe3ff) arcs crackling around the weapon.
```

**Thợ mỏ lôi** (×1) — Đào vàng giữa trời giông
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Storm miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Lôi kiếm khách** (×1) — Kiếm sét chém ngọt
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: katana phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Thunder swordsman". Cloth: long tattered cape and neck scarf. Gear: glowing katana. Pose: weapon held low and diagonal, ready to charge.
```

**Cung lôi tiễn** (×1) — Cung dài bắn chuẩn
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Bolt archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Ảnh lôi** (×0.95) — Tàng hình và lướt tới ám sát
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: katana phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Flicker". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing katana. Pose: crouched low, about to dash.
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

- Đầu: tóc đen đỏ rối bù vuốt ngược
- Thân: thân đen đỏ, vân máu nứt sáng trên thân, tay đẫm máu sáng, vệt máu cong quanh người
- Vải: đỏ máu `#9c0f1c`
- Phát sáng: đỏ tươi `#ff2d3c` — giọt máu bay, vệt máu cong
- Ảnh mẫu: `docs/art/demo/blood.png`

```
[B] Element: Blood (Blood Moon Cult). Match the attached element reference image. Head: messy black-red spiky hair swept back. Body: very dark red-black silhouette with glowing red vein cracks on the torso and legs, blood-red glowing fists, curved blood slashes swirling around. Cloth colour: blood red (#9c0f1c), long torn scarf.
Eyes, weapon and magic glow: vivid red (#ff2d3c) with flying blood droplets and crimson slash trails.
```

**Nô lệ máu** (×1) — Biết cầm cuốc đánh trả
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Blood thrall". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Chiến binh huyết rìu** (×1) — Rìu chém xuyên giáp nhẹ
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: rìu phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Blood axeman". Cloth: long tattered cape and neck scarf. Gear: glowing axe. Pose: weapon held low and diagonal, ready to charge.
```

**Lính ném rìu máu** (×1) — Ném rìu tầm gần, rất đau
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: lao / rìu ném phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Blood axe thrower". Cloth: long scarf streaming sideways. Gear: glowing throwing javelins or axes. Pose: drawing the bow or mid-throw.
```

**Cuồng huyết** (×0.95) — Lao vào giữa trận, máu càng thấp càng khủng
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: rìu phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Bloodfrenzy". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing axe. Pose: crouched low, about to dash.
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

- Đầu: tóc tím dựng nhọn, mảnh tinh thể mọc trên đầu
- Thân: thân tím thẫm, mảnh tinh thể tím bọc vai, cẳng tay, ống chân, lửa tím xanh ở tay
- Vải: tím `#5a28a8`
- Phát sáng: tím pha lê `#b98cff`, mắt xanh ngọc `#7fe8ff` — mảnh tinh thể bay, lửa tím
- Ảnh mẫu: `docs/art/demo/crystal.png`

```
[B] Element: Crystal (Crystal Vale). Match the attached element reference image. Head: spiky deep purple hair with crystal shards growing from it. Body: dark indigo silhouette, sharp violet crystal shards armouring shoulders, forearms and shins, violet-cyan flames around the hands. Cloth colour: purple (#5a28a8), ragged cape.
Weapon and magic glow: crystal violet (#b98cff); eyes glow cyan (#7fe8ff); floating crystal shards and violet flames.
```

**Thợ đẽo tinh thể** (×1) — Mang về nhiều vàng
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Crystal cutter". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Kiếm sĩ liềm pha lê** (×1) — Đao cong móc khiên
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: liềm đao cong phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Crystal sickle blade". Cloth: long tattered cape and neck scarf. Gear: glowing curved sickle blade. Pose: weapon held low and diagonal, ready to charge.
```

**Cung thủ pha lê** (×1) — Bắn tên
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Crystal archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Sát thủ lăng kính** (×0.95) — Lướt qua tiền tuyến
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Prism assassin". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing dagger. Pose: crouched low, about to dash.
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

- Đầu: tóc đá xám dựng nhọn góc cạnh, vết nứt hổ phách
- Thân: thân đá xếp xám đen, vết nứt hổ phách phát sáng, đá vụn văng quanh chân
- Vải: nâu ô liu `#8a7442`
- Phát sáng: hổ phách `#ffb43a` — bụi đá, khe nứt sáng
- Ảnh mẫu: `docs/art/demo/stone.png`

```
[B] Element: Stone (Stone Bastion). Match the attached element reference image. Head: angular grey stone spikes like rock hair, with a glowing amber crack. Body: charcoal rock-plated silhouette with glowing amber cracks, rock chunks flying up from the ground around the feet. Cloth colour: olive brown (#8a7442), torn cape.
Eyes, weapon and magic glow: amber (#ffb43a) with stone dust and glowing cracks.
```

**Thợ khoan đá** (×1) — Mũi khoan đào nhanh
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: mũi khoan cầm tay phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Rock driller". Cloth: short scarf. Gear: glowing hand drill. Pose: tool on the shoulder, relaxed.
```

**Kiếm sĩ đá** (×1) — Kiếm và giáp đá
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: kiếm cong phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Stone swordsman". Cloth: long tattered cape and neck scarf. Gear: glowing saber. Pose: weapon held low and diagonal, ready to charge.
```

**Lính súng đá** (×1) — Đạn đá xuyên giáp, nạp đạn chậm
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: súng dài phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Stone gunner". Cloth: long scarf streaming sideways. Gear: glowing long gun. Pose: drawing the bow or mid-throw.
```

**Thích khách móc đá** (×0.95) — Phóng móc lướt tới hàng sau
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Grapple stalker". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing dagger. Pose: crouched low, about to dash.
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

- Đầu: tóc lá thép bạc dựng nhọn, viền vàng
- Thân: giáp bạc viền vàng ở ngực, vai, cẳng tay, ống chân trên thân đen, tia lửa vàng
- Vải: đỏ đô `#9e1c22`
- Phát sáng: vàng kim `#ffd34a` — tia lửa, mảnh thép
- Ảnh mẫu: `docs/art/demo/metal.png`

```
[B] Element: Metal (Iron Forge Sect). Match the attached element reference image. Head: spiky silver steel-blade hair with a gold glow. Body: black silhouette wearing sleek silver armour plates with gold trim on chest, shoulders, forearms and shins, golden sparks and metal shards. Cloth colour: dark crimson (#9e1c22) scarf and torn cape.
Eyes, weapon and magic glow: gold (#ffd34a) with sparks and flying steel shards.
```

**Thợ mỏ sắt** (×1) — Đào nhanh, chắc tay
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Iron miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Chiến binh rìu thép** (×1) — Lì lợm, giáp dày
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: rìu phát sáng, khiên tròn đen viền sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Steel axeman". Cloth: long tattered cape and neck scarf. Gear: glowing axe, black round shield with a glowing rim. Pose: weapon held low and diagonal, ready to charge.
```

**Lính hoả thương** (×1) — Đạn chì xuyên giáp, nạp chậm
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: súng dài phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Fire-lance gunner". Cloth: long scarf streaming sideways. Gear: glowing long gun. Pose: drawing the bow or mid-throw.
```

**Thợ đào hầm** (×0.95) — Chui lên giữa hàng sau địch
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Tunneler". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing pickaxe. Pose: crouched low, about to dash.
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

- Đầu: tóc nước xanh dài uốn sóng, giọt nước sáng
- Thân: thân là nước xanh trong suốt có vệt phản sáng, sóng nước bắn quanh chân
- Vải: dải nước xanh trong `#3aa6e6`
- Phát sáng: xanh nước `#6fe0ff` — bọt nước, sóng bắn
- Ảnh mẫu: `docs/art/demo/water.png`

```
[B] Element: Water (Tidal Moon Court). Match the attached element reference image. Head: long flowing hair made of water, curling like waves, glowing droplets. Body: translucent blue water body with bright highlights instead of a black silhouette, water splashing around the feet. Cloth: flowing translucent water ribbons (#3aa6e6) instead of fabric.
Eyes, weapon and magic glow: aqua blue (#6fe0ff) with bubbles, droplets and splashes.
```

**Thợ mò ngọc** (×1) — Lặn mò vàng
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Pearl diver". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Lính đinh ba** (×1) — Đâm nhanh
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: đinh ba phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Trident warrior". Cloth: long tattered cape and neck scarf. Gear: glowing trident. Pose: weapon held low and diagonal, ready to charge.
```

**Lính phóng lao nước** (×1) — Lao xuyên, khắc kỵ binh
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: lao / rìu ném phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Tide harpooner". Cloth: long scarf streaming sideways. Gear: glowing throwing javelins or axes. Pose: drawing the bow or mid-throw.
```

**Thích khách sóng ngầm** (×0.95) — Lướt tới, dao tẩm độc
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Undertow assassin". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing dagger. Pose: crouched low, about to dash.
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

- Đầu: tóc là ngọn lửa cam rực, đầu lửa sáng vàng
- Thân: thân đen than hồng, lửa cháy ở nắm tay và chân, tàn lửa bay
- Vải: đỏ cam lửa `#e0401c`
- Phát sáng: cam lửa `#ff7a1a` — lửa bập bùng, tàn lửa
- Ảnh mẫu: `docs/art/demo/fire.png`

```
[B] Element: Fire (Flame Dragon Sect). Match the attached element reference image. Head: hair made of blazing orange flames with bright yellow tips. Body: black silhouette with an orange ember rim, flames burning on the fists and around the feet, rising embers. Cloth colour: flame red-orange (#e0401c), cape whose edge turns into fire.
Eyes, weapon and magic glow: fire orange (#ff7a1a) with flickering flames and embers.
```

**Thợ mỏ lửa** (×1) — Đào vàng trong núi lửa
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Lava miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Hiệp sĩ hỏa long** (×1) — Kiếm lửa
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: trường kiếm phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Flame knight". Cloth: long tattered cape and neck scarf. Gear: glowing straight longsword. Pose: weapon held low and diagonal, ready to charge.
```

**Cung thủ hỏa tiễn** (×1) — Tên lửa bắn xa
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Fire archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Sát thủ tro** (×0.95) — Lướt tới hàng sau
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Ash assassin". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing dagger. Pose: crouched low, about to dash.
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

- Đầu: tóc tinh thể băng xanh dựng nhọn, vệt phản sáng trắng
- Thân: giáp tinh thể băng bọc ngực, vai, cẳng tay, ống chân trên thân xanh đen, mảnh băng bay
- Vải: xanh băng đậm `#2b67b8`
- Phát sáng: trắng băng `#bfeaff` — mảnh băng, hơi lạnh
- Ảnh mẫu: `docs/art/demo/ice.png`

```
[B] Element: Ice (Frost Palace). Match the attached element reference image. Head: spiky light-blue ice-crystal hair with white glints. Body: dark blue-black silhouette armoured with jagged glowing ice crystals on chest, shoulders, forearms and shins, small ice shards floating. Cloth colour: deep ice blue (#2b67b8), torn cape.
Eyes, weapon and magic glow: icy white-blue (#bfeaff) with ice shards and cold mist.
```

**Thợ đục băng** (×1) — Đục vàng trong băng
- Vải: khăn ngắn quấn cổ
- Vũ khí / phép: cuốc chim phát sáng
- Dáng: vác cuốc trên vai
```
[C] Unit: gold miner "Ice miner". Cloth: short scarf. Gear: glowing pickaxe. Pose: tool on the shoulder, relaxed.
```

**Kiếm sĩ hàn băng** (×1) — Kiếm băng
- Vải: áo choàng dài rách gấu + khăn quàng
- Vũ khí / phép: trường kiếm phát sáng
- Dáng: cầm vũ khí thấp chéo xuống, sẵn sàng lao lên
```
[C] Unit: melee swordsman "Frost swordsman". Cloth: long tattered cape and neck scarf. Gear: glowing straight longsword. Pose: weapon held low and diagonal, ready to charge.
```

**Cung thủ băng** (×1) — Tên băng bắn xa
- Vải: khăn quàng dài bay ngang
- Vũ khí / phép: cung phát sáng
- Dáng: kéo căng dây / chuẩn bị ném
```
[C] Unit: ranged archer "Ice archer". Cloth: long scarf streaming sideways. Gear: glowing bow. Pose: drawing the bow or mid-throw.
```

**Bóng tuyết** (×0.95) — Lướt theo gió tuyết tới hàng sau
- Vải: khăn rất dài bay thành vệt
- Vũ khí / phép: dao găm phát sáng
- Dáng: khom thấp như sắp lướt
```
[C] Unit: assassin "Snow shade". Slightly smaller and leaner. Cloth: very long trailing scarf. Gear: glowing dagger. Pose: crouched low, about to dash.
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

**☀️ Thánh Quang Điện (hệ Quang)** — Cột đá trắng đỡ đĩa mặt trời, tia sáng xoay chậm quanh đĩa. Phát sáng `#ffd84a`.
```
A white stone pillar holding a radiant sun disk with slowly rotating light rays. Glow colour #ffd84a.
```

**🌪️ Cuồng Phong Trại (hệ Phong)** — Tháp đá xoắn, cánh chong chóng gió quay trên đỉnh, vệt gió bay ngang. Phát sáng `#a8ecff`.
```
A twisted stone tower with windmill blades spinning on top, wind streaks flowing past. Glow colour #a8ecff.
```

**🌿 Thanh Mộc Lâm (hệ Mộc)** — Cây thiêng tán xanh, đốm sáng bay quanh tán. Phát sáng `#7dff6a`.
```
A sacred tree with a green canopy and glowing motes around it. Glow colour #7dff6a.
```

**🌑 Hội Bóng Đêm (hệ Ám)** — Tháp đá đen nhọn, con mắt tím mở giữa thân, khói bóng tối bay lên. Phát sáng `#b77bff`.
```
A sharp black obsidian spire with a glowing violet eye opening in the middle, shadow smoke rising. Glow colour #b77bff.
```

**⚡ Lôi Kiếm Các (hệ Lôi)** — Cột thu lôi ba tầng, tia sét chớp giữa hai sừng kim loại trên đỉnh. Phát sáng `#ffe94a`.
```
A three-tiered lightning rod tower, lightning arcing between two metal horns at the top. Glow colour #ffe94a.
```

**🩸 Huyết Nguyệt Giáo (hệ Huyết)** — Bàn thờ đá hai cột, vầng trăng máu lơ lửng phía trên, rãnh máu chảy xuống. Phát sáng `#ff2d3c`.
```
A stone altar with two pillars, a blood-red crescent moon floating above, a blood channel running down. Glow colour #ff2d3c.
```

**💎 Tinh Thạch Cốc (hệ Tinh thể)** — Viên pha lê khổng lồ lơ lửng xoay trên đế đá, mảnh vụn bay vòng quanh. Phát sáng `#b98cff`.
```
A giant crystal floating and slowly turning above a stone base, shards orbiting it. Glow colour #b98cff.
```

**🪨 Bàn Thạch Bảo (hệ Thạch)** — Cổng cự thạch hai cột một xà, khe nứt hổ phách phát sáng. Phát sáng `#ffb43a`.
```
A megalithic stone gate of two pillars and a lintel with glowing amber cracks. Glow colour #ffb43a.
```

**⚒️ Thiết Lò Môn (hệ Kim)** — Đe sắt trên tảng đá, búa lớn dựng cạnh, ấn cam phát sáng. Phát sáng `#ffd34a`.
```
A giant anvil on a boulder, a big hammer leaning beside it, glowing orange runes. Glow colour #ffd34a.
```

**🌊 Thủy Nguyệt Cung (hệ Thủy)** — Đinh ba khổng lồ cắm trên vỏ ốc xoắn. Phát sáng `#6fe0ff`.
```
A giant trident standing on a huge spiral shell. Glow colour #6fe0ff.
```

**🔥 Viêm Long Môn (hệ Hỏa)** — Đầu rồng đá há miệng, lửa bập bùng trong miệng. Phát sáng `#ff7a1a`.
```
A carved stone dragon head with open jaws and flickering fire inside. Glow colour #ff7a1a.
```

**❄️ Hàn Băng Cung (hệ Băng)** — Cụm tinh thể băng trong suốt. Phát sáng `#bfeaff`.
```
A cluster of clear ice crystals. Glow colour #bfeaff.
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
| ☀️ Thánh Quang Điện | Tháp ánh sáng | đá trắng ngà, viền vàng | `#ffd84a` |
| 🌪️ Cuồng Phong Trại | Tháp chong chóng | gỗ ngọc bích, đỉnh có chong chóng | `#a8ecff` |
| 🌿 Thanh Mộc Lâm | Trạm cây | gỗ sống, đỉnh là tán lá tròn có đom đóm | `#7dff6a` |
| 🌑 Hội Bóng Đêm | Tháp bóng đêm | đá hắc thạch, khe sáng tím | `#b77bff` |
| ⚡ Lôi Kiếm Các | Cột thu lôi | đá xám tím, đỉnh là cột thu lôi | `#ffe94a` |
| 🩸 Huyết Nguyệt Giáo | Trạm trăng máu | gỗ đỏ thẫm, đai sẫm | `#ff2d3c` |
| 💎 Tinh Thạch Cốc | Trạm tinh thể | pha lê hồng tím | `#b98cff` |
| 🪨 Bàn Thạch Bảo | Tháp súng đá | đá tảng, khe nứt hổ phách | `#ffb43a` |
| ⚒️ Thiết Lò Môn | Trạm lò rèn | thép xám, lò rèn nhỏ ở chân | `#ffd34a` |
| 🌊 Thủy Nguyệt Cung | Trạm san hô | san hô xanh biển | `#6fe0ff` |
| 🔥 Viêm Long Môn | Trạm lửa | đá đỏ sẫm, khe dung nham | `#ff7a1a` |
| ❄️ Hàn Băng Cung | Trạm băng | băng trắng xanh | `#bfeaff` |

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
Theme: Golden dawn behind violet mountains, white temples with lit windows, floating light motes. Accent glow #ffd84a.
```

**🌪️ Cuồng Phong Trại** — Thung lũng gió xanh ngọc, mây trôi nhanh, bụi cuốn.
```
Theme: A jade wind valley, fast clouds, swirling dust. Accent glow #a8ecff.
```

**🌿 Thanh Mộc Lâm** — Rừng già đêm, cây cao, lá rơi.
```
Theme: An ancient night forest, tall trees, falling leaves. Accent glow #7dff6a.
```

**🌑 Hội Bóng Đêm** — Vực bóng đêm tím, khói đen trôi.
```
Theme: A violet abyss of night, black smoke drifting. Accent glow #b77bff.
```

**⚡ Lôi Kiếm Các** — Đồi bão tím, mây giông, chớp vàng.
```
Theme: Violet storm hills, thunderclouds, yellow lightning. Accent glow #ffe94a.
```

**🩸 Huyết Nguyệt Giáo** — Đêm trăng máu, núi đỏ thẫm.
```
Theme: A blood-moon night over crimson mountains. Accent glow #ff2d3c.
```

**💎 Tinh Thạch Cốc** — Thung lũng pha lê hồng tím, tinh thể mọc trên núi.
```
Theme: A magenta crystal valley with crystals growing from the mountains. Accent glow #b98cff.
```

**🪨 Bàn Thạch Bảo** — Hẻm núi đá hổ phách, vách đá cao, bụi đá.
```
Theme: An amber stone canyon with tall cliffs and stone dust. Accent glow #ffb43a.
```

**⚒️ Thiết Lò Môn** — Núi sắt lò rèn, tàn lửa bay.
```
Theme: Iron mountains with forges, floating embers. Accent glow #ffd34a.
```

**🌊 Thủy Nguyệt Cung** — Biển đêm xanh thẳm, bong bóng bay lên.
```
Theme: A deep blue night sea, bubbles rising. Accent glow #6fe0ff.
```

**🔥 Viêm Long Môn** — Núi lửa, dung nham, tàn lửa bay.
```
Theme: Volcanoes, lava, rising embers. Accent glow #ff7a1a.
```

**❄️ Hàn Băng Cung** — Xứ tuyết, núi băng, tuyết rơi.
```
Theme: A land of snow and ice mountains, falling snow. Accent glow #bfeaff.
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
