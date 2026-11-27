# 5. Bản đồ chiến trường theo hệ — góc nghiêng 3/4 (12 hệ × 7 prompt + 2 chung)

> Sinh tự động bởi `docs/art/prompts/gen_map_prompts.py`. Sửa dữ liệu ở script rồi chạy lại
> `python3 docs/art/prompts/gen_map_prompts.py`, đừng sửa tay file này.

- **Góc nhìn** lấy từ ảnh tham khảo: nhìn xuống khoảng 60°, mặt đất thẳng với màn hình, vật đứng thấy cả nóc và mặt
  trước (không phải isometric hình thoi). Lính cao khoảng 36 px, ô nền 24 × 24 px.
- **Bố cục theo trận đấu** (`packages/core/src/world.ts`): mỗi phe giữ một nửa đường đánh ngang — tượng nhà sát mép →
  mỏ bạc → mỏ vàng (4 chỗ) → trạm vàng (tối đa 2) và tường chắn ngang đường → bãi giao tranh → mỏ kim cương ở giữa
  bản đồ dùng chung.
- **Toàn cảnh đặt vật theo toạ độ trận** (thế giới rộng 4000 px, phe trái): tượng 170, mỏ bạc 470,
  mỏ vàng 820, ô trạm 600 / 970 / 1320 / 1670, tường xây được 290–1470, mỏ kim cương 2000.
  Prompt ghi vị trí theo % chiều ngang ảnh. **Đường đánh rộng ~1/3 chiều cao ảnh (5 ô)** để đứng được 5 lính một
  hàng ngang; mỏ nằm mép trên, ô trạm mép dưới, giữa đường để trống cho lính (chỉ tường chắn ngang).
- **Đặc điểm riêng** của hệ (nội tại trong `factions.ts`) quyết định địa hình, tên và hiệu ứng của trạm / tường, và
  dấu vết trên mặt đất (lửa cháy, băng trơn, hồn bay về tượng…).
- Thứ tự mỗi hệ: **1. Toàn cảnh** trước để chốt màu; prompt 2–7 **đính kèm ảnh toàn cảnh đó**. Lưu ở
  `docs/art/topdown/<hệ>/map/`.
- Xem trước khi dùng: đủ ô, các ô cùng cỡ, ô nền ghép không lộ mép, nền trong suốt thật. Sai thì tạo lại.

| Hệ | Đặc điểm | Mục |
|---|---|---|
| Dùng chung | mỏ kim cương, toàn cảnh cả trận | [chung](#chung) |
| 1. ☀️ Thánh Quang Điện — Temple of Light | kỷ luật, cân bằng, quân rẻ, lên kỳ cựu nhanh | [light](#1-light) |
| 2. 🌪️ Cuồng Phong Trại — Gale Horde | chạy nhanh, càng đông càng mạnh, đứng lẻ thì yếu | [wind](#2-wind) |
| 3. 🌿 Thanh Mộc Lâm — Verdant Grove | bắn rất xa, tự hồi máu, mỏng manh khi bị áp sát | [wood](#3-wood) |
| 4. 🌑 Hội Bóng Đêm — Shadow Cult | quân rẻ, yếu, rất đông; hạ địch thì thu hồn ra vàng | [shadow](#4-shadow) |
| 5. ⚡ Lôi Kiếm Các — Thunder Blade Hall | ra đòn nhanh, nhát chém đầu tiên chí mạng | [thunder](#5-thunder) |
| 6. 🩸 Huyết Nguyệt Giáo — Blood Moon Cult | cận chiến hung bạo, càng mất máu càng đánh đau | [blood](#6-blood) |
| 7. 💎 Tinh Thạch Cốc — Crystal Vale | giàu vàng, tượng vững (+25% máu), có chiến xa | [crystal](#7-crystal) |
| 8. 🪨 Bàn Thạch Bảo — Stone Bastion | giáp dày, súng đá và máy phóng, chậm; thợ khoan đào nhanh | [stone](#8-stone) |
| 9. ⚒️ Thiết Lò Môn — Iron Forge Sect | lì lợm, càng về cuối trận càng mạnh | [metal](#9-metal) |
| 10. 🌊 Thủy Nguyệt Cung — Tidal Moon Court | hút máu, đánh lâu không mệt | [water](#10-water) |
| 11. 🔥 Viêm Long Môn — Flame Dragon Sect | mọi đòn để lại lửa, máu dày | [fire](#11-fire) |
| 12. ❄️ Hàn Băng Cung — Frost Palace | mọi đòn làm chậm, máu dày | [ice](#12-ice) |

<a id="chung"></a>

## Dùng chung

**Mỏ kim cương giữa bản đồ (hai phe tranh nhau)** → lưu thành `docs/art/topdown/map/diamond-mine.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 80 px native each) showing ONE neutral diamond mine in the centre of the battlefield, the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: big diamonds sparkle one after another.
- Row 2: being struck from both sides (miners NOT drawn): normal, HIT (flash, shake 1 px, burst of white-blue diamond chips), one diamond pops up, settling.

CONTENT
- A wide rocky outcrop of neutral grey stone in no-man's land, huge white-blue diamonds jutting out, a dark tunnel on each side (left and right) since both armies mine it, scattered bones and broken weapons around it (it is the most fought-over spot).
- Neutral palette: grey stone, white-blue diamonds (#bff4ff), plain brown dirt.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**Toàn cảnh cả trận (hai hệ đối đầu)** → lưu thành `docs/art/topdown/map/battle-concept.png`

```
Pixel art game map screenshot, ONE very wide 3:1 image (native about 960 x 320 px): the whole battlefield with two different civilizations facing each other.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- Left: the home of the Temple of Light (white marble, gold): monument at 4%, silver mine at 12% and gold mine at 20% on the top edge of the lane, build plots at 15%, 24%, 33%, 42% on the bottom edge (towers on the first two), wall across the lane at 29%.
- Right: the home of the Flame Dragon Sect (black basalt, lava, red lacquer), an exact mirror: monument at 96%, mines at 88% and 80%, build plots at 58%, 67%, 76%, 85%, wall at 71%.
- Middle (37%–63%): neutral no-man's land of plain dirt and broken ground, the diamond mine at exactly 50% on the top edge of the lane (miners of both sides dig it from its left and right); each faction's ground blends into neutral dirt toward the middle.

CONTENT
- Swap the two civilizations for any other pair: the layout stays the same.
- Relative sizes (a soldier is 36 px native tall): each monument ~5x (the biggest objects), depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, diamond mine ~2x.
- The bands above and below the lane are packed with each faction's own buildings, plants and ground so each half is recognisable at a glance.
- No units: an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="1-light"></a>

## 1. ☀️ Thánh Quang Điện — Temple of Light

Đặc điểm: *kỷ luật, cân bằng, quân rẻ, lên kỳ cựu nhanh*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/light/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Temple of Light civilization (Light element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a tall white-marble obelisk crowned by a glowing gold sun disc, gold rays carved down its sides, two braziers on the plinth, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (white stone watchtower with a gold dome, shoots glowing gold arrows), about 1.6 times a soldier's height.
- 58%: the defensive wall (solid white stone wall with a gold-trimmed double gate, balanced and sturdy) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: an orderly holy fortress on a sunlit plateau: straight white-marble roads, neat trimmed hedges, rows of sun altars, everything symmetrical and disciplined.
- Palette: white marble, cream stone, rich gold (#e8a91c), radiant gold (#ffd84a) glow, sky-blue accents.
- Mines: the mines are framed by white marble arches and gold-trimmed wooden beams, neat stacked ore crates.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: white colonnades, a temple with a gold dome, training yards with ranks of shields on racks; plus sun altar with candles, marble pillar, gold brazier, trimmed hedge. It must read instantly as the Light faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): an orderly holy fortress on a sunlit plateau: straight white-marble roads, neat trimmed hedges, rows of sun altars, everything symmetrical and disciplined; with white-blossom tree, banner pole with a sun symbol, shield rack, marble bench, holy water channel with gold sparkles. Ground everywhere off the lane: short tidy grass.
- The lane itself: pale sandstone road with gold inlay lines, bordered by carved white stone kerb with a gold stripe; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/light/map/concept.png`, lưu thành `docs/art/topdown/light/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Temple of Light civilization (Light element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, short tidy grass: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, pale sandstone road with gold inlay lines: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, carved white stone kerb with a gold stripe: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: holy water channel with gold sparkles: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: an orderly holy fortress on a sunlit plateau: straight white-marble roads, neat trimmed hedges, rows of sun altars, everything symmetrical and disciplined.
- Palette: white marble, cream stone, rich gold (#e8a91c), radiant gold (#ffd84a) glow, sky-blue accents.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/light/map/concept.png`, lưu thành `docs/art/topdown/light/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Temple of Light civilization (Light element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are framed by white marble arches and gold-trimmed wooden beams, neat stacked ore crates.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: white marble, cream stone, rich gold (#e8a91c), radiant gold (#ffd84a) glow, sky-blue accents.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/light/map/concept.png`, lưu thành `docs/art/topdown/light/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Temple of Light civilization (Light element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a tall white-marble obelisk crowned by a glowing gold sun disc, gold rays carved down its sides, two braziers on the plinth.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: white marble, cream stone, rich gold (#e8a91c), radiant gold (#ffd84a) glow, sky-blue accents.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Tower of Light** → đính kèm `docs/art/topdown/light/map/concept.png`, lưu thành `docs/art/topdown/light/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Temple of Light civilization (Light element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Tower of Light: white stone watchtower with a gold dome, shoots glowing gold arrows.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: white marble, cream stone, rich gold (#e8a91c), radiant gold (#ffd84a) glow, sky-blue accents.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — White Stone Wall** → đính kèm `docs/art/topdown/light/map/concept.png`, lưu thành `docs/art/topdown/light/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Temple of Light civilization (Light element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: the gate swinging open and shut for friendly troops.

CONTENT
- White Stone Wall: solid white stone wall with a gold-trimmed double gate, balanced and sturdy.
- About 1.5 times the height of a unit.
- Palette: white marble, cream stone, rich gold (#e8a91c), radiant gold (#ffd84a) glow, sky-blue accents.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/light/map/concept.png`, lưu thành `docs/art/topdown/light/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Temple of Light civilization (Light element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: sun altar with candles, marble pillar, gold brazier, trimmed hedge; then white-blossom tree, banner pole with a sun symbol, shield rack, marble bench. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: glowing gold sun glyph on the ground (veteran rank-up mark), 2 animation frames.
- Row 3, cells 11–12: scattered gold light motes, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: white marble, cream stone, rich gold (#e8a91c), radiant gold (#ffd84a) glow, sky-blue accents.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="2-wind"></a>

## 2. 🌪️ Cuồng Phong Trại — Gale Horde

Đặc điểm: *chạy nhanh, càng đông càng mạnh, đứng lẻ thì yếu*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/wind/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Gale Horde civilization (Wind element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a giant wooden windmill totem with spinning blue sails and a swirling cyan wind vortex in its centre, long pennants streaming sideways, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (wooden stilt tower with a spinning pinwheel, launches javelins), about 1.6 times a soldier's height.
- 58%: the defensive wall (a fence of sharpened stakes bound with thorny brambles and fluttering cloth strips) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a wide open windswept steppe with almost no obstacles, perfect for fast charges: long grass all bent in one direction toward the enemy, dust streaks, tents clustered close together in packs.
- Palette: sandy beige, weathered wood, sky blue (#2f8fc4) cloth, pale icy cyan (#a8ecff) glow, white canvas.
- Mines: the mines are dug into wind-carved sandstone, with canvas awnings flapping and a pinwheel on top.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: round canvas yurts in tight clusters, tall windmills, rope lines of streaming blue flags; plus yurt, windmill, wind chime pole, tumbleweed. It must read instantly as the Wind faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a wide open windswept steppe with almost no obstacles, perfect for fast charges: long grass all bent in one direction toward the enemy, dust streaks, tents clustered close together in packs; with wind-bent pine, wind-carved rock arch, flag pole with a streaming pennant, javelin rack, small oasis pond rippled by wind. Ground everywhere off the lane: wind-bent steppe grass.
- The lane itself: wide dusty trail with long wind streaks, bordered by low stacked stones with tufts of dry grass; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/wind/map/concept.png`, lưu thành `docs/art/topdown/wind/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Gale Horde civilization (Wind element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, wind-bent steppe grass: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, wide dusty trail with long wind streaks: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, low stacked stones with tufts of dry grass: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: small oasis pond rippled by wind: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a wide open windswept steppe with almost no obstacles, perfect for fast charges: long grass all bent in one direction toward the enemy, dust streaks, tents clustered close together in packs.
- Palette: sandy beige, weathered wood, sky blue (#2f8fc4) cloth, pale icy cyan (#a8ecff) glow, white canvas.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/wind/map/concept.png`, lưu thành `docs/art/topdown/wind/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Gale Horde civilization (Wind element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are dug into wind-carved sandstone, with canvas awnings flapping and a pinwheel on top.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: sandy beige, weathered wood, sky blue (#2f8fc4) cloth, pale icy cyan (#a8ecff) glow, white canvas.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/wind/map/concept.png`, lưu thành `docs/art/topdown/wind/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Gale Horde civilization (Wind element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a giant wooden windmill totem with spinning blue sails and a swirling cyan wind vortex in its centre, long pennants streaming sideways.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: sandy beige, weathered wood, sky blue (#2f8fc4) cloth, pale icy cyan (#a8ecff) glow, white canvas.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Pinwheel Tower** → đính kèm `docs/art/topdown/wind/map/concept.png`, lưu thành `docs/art/topdown/wind/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Gale Horde civilization (Wind element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Pinwheel Tower: wooden stilt tower with a spinning pinwheel, launches javelins.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: sandy beige, weathered wood, sky blue (#2f8fc4) cloth, pale icy cyan (#a8ecff) glow, white canvas.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Thorn Wind Fence** → đính kèm `docs/art/topdown/wind/map/concept.png`, lưu thành `docs/art/topdown/wind/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Gale Horde civilization (Wind element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: thorns jabbing outward when struck in melee.

CONTENT
- Thorn Wind Fence: a fence of sharpened stakes bound with thorny brambles and fluttering cloth strips.
- About 1.5 times the height of a unit.
- Palette: sandy beige, weathered wood, sky blue (#2f8fc4) cloth, pale icy cyan (#a8ecff) glow, white canvas.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/wind/map/concept.png`, lưu thành `docs/art/topdown/wind/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Gale Horde civilization (Wind element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: yurt, windmill, wind chime pole, tumbleweed; then wind-bent pine, wind-carved rock arch, flag pole with a streaming pennant, javelin rack. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: swirling dust devil on the ground, 2 animation frames.
- Row 3, cells 11–12: flattened grass trail from a fast charge, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: sandy beige, weathered wood, sky blue (#2f8fc4) cloth, pale icy cyan (#a8ecff) glow, white canvas.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="3-wood"></a>

## 3. 🌿 Thanh Mộc Lâm — Verdant Grove

Đặc điểm: *bắn rất xa, tự hồi máu, mỏng manh khi bị áp sát*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/wood/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Verdant Grove civilization (Wood element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a sacred ancient tree with a huge trunk, a glowing green heart-seed in a hollow, roots spreading over the plinth, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (a hollow living tree with an archer nest, shoots very long-range arrows), about 1.6 times a soldier's height.
- 58%: the defensive wall (a wall of living trunks and thick vines that regrows) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: the edge of an ancient forest: the home side is thick with giant trees and archer platforms high in the branches, opening toward the enemy into a long clear meadow (a killing field for long-range archers), healing glades with glowing moss.
- Palette: deep forest green (#1f6b26), bright leaf green (#7dff6a) glow, warm bark brown, mossy grey, pink and yellow flowers.
- Mines: the mines are overgrown with roots and moss, gold veins tangled with glowing vines.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: giant trees with wooden archer platforms and rope bridges, tree houses, glowing mushrooms; plus giant oak, archer platform on a tree, glowing mushroom cluster, fern bush. It must read instantly as the Wood faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): the edge of an ancient forest: the home side is thick with giant trees and archer platforms high in the branches, opening toward the enemy into a long clear meadow (a killing field for long-range archers), healing glades with glowing moss; with mossy boulder, carved wooden totem, hollow log, flower patch, clear stream with lily pads. Ground everywhere off the lane: mossy forest floor with fallen leaves.
- The lane itself: soft dirt path with roots crossing it, bordered by mossy logs and ferns; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/wood/map/concept.png`, lưu thành `docs/art/topdown/wood/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Verdant Grove civilization (Wood element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, mossy forest floor with fallen leaves: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, soft dirt path with roots crossing it: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, mossy logs and ferns: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: clear stream with lily pads: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: the edge of an ancient forest: the home side is thick with giant trees and archer platforms high in the branches, opening toward the enemy into a long clear meadow (a killing field for long-range archers), healing glades with glowing moss.
- Palette: deep forest green (#1f6b26), bright leaf green (#7dff6a) glow, warm bark brown, mossy grey, pink and yellow flowers.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/wood/map/concept.png`, lưu thành `docs/art/topdown/wood/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Verdant Grove civilization (Wood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are overgrown with roots and moss, gold veins tangled with glowing vines.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: deep forest green (#1f6b26), bright leaf green (#7dff6a) glow, warm bark brown, mossy grey, pink and yellow flowers.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/wood/map/concept.png`, lưu thành `docs/art/topdown/wood/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Verdant Grove civilization (Wood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a sacred ancient tree with a huge trunk, a glowing green heart-seed in a hollow, roots spreading over the plinth.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: deep forest green (#1f6b26), bright leaf green (#7dff6a) glow, warm bark brown, mossy grey, pink and yellow flowers.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Tree Post** → đính kèm `docs/art/topdown/wood/map/concept.png`, lưu thành `docs/art/topdown/wood/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Verdant Grove civilization (Wood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Tree Post: a hollow living tree with an archer nest, shoots very long-range arrows.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: deep forest green (#1f6b26), bright leaf green (#7dff6a) glow, warm bark brown, mossy grey, pink and yellow flowers.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Living Tree Wall** → đính kèm `docs/art/topdown/wood/map/concept.png`, lưu thành `docs/art/topdown/wood/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Verdant Grove civilization (Wood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: new leaves and branches sprouting back as it regrows.

CONTENT
- Living Tree Wall: a wall of living trunks and thick vines that regrows.
- About 1.5 times the height of a unit.
- Palette: deep forest green (#1f6b26), bright leaf green (#7dff6a) glow, warm bark brown, mossy grey, pink and yellow flowers.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/wood/map/concept.png`, lưu thành `docs/art/topdown/wood/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Verdant Grove civilization (Wood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: giant oak, archer platform on a tree, glowing mushroom cluster, fern bush; then mossy boulder, carved wooden totem, hollow log, flower patch. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: glowing green healing moss patch, 2 animation frames.
- Row 3, cells 11–12: sprouting leaves on bare ground, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: deep forest green (#1f6b26), bright leaf green (#7dff6a) glow, warm bark brown, mossy grey, pink and yellow flowers.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="4-shadow"></a>

## 4. 🌑 Hội Bóng Đêm — Shadow Cult

Đặc điểm: *quân rẻ, yếu, rất đông; hạ địch thì thu hồn ra vàng*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/shadow/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Shadow Cult civilization (Shadow element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a black stone spire with a giant glowing violet eye, soul wisps spiralling into it, smoke at its base, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (crooked black tower with a violet lantern, shoots arrows), about 1.6 times a soldier's height.
- 58%: the defensive wall (a cheap, thin wall of rough black stone slabs) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a misty cursed moor at night: thick low fog, a graveyard, many small crooked huts packed together for a huge cheap army, ghostly soul wisps drifting from the battlefield back toward the monument.
- Palette: black stone, dark slate purple, deep violet (#3d1a66) cloth, ghostly violet (#b77bff) glow, pale bone.
- Mines: the mines are dark pits ringed with candles and bones, gold veins glinting in the gloom.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: crooked dark houses with pointed roofs, crypts, hooded statues, dead trees; plus gravestone cluster, crooked dead tree, candle cluster, hooded statue. It must read instantly as the Shadow faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a misty cursed moor at night: thick low fog, a graveyard, many small crooked huts packed together for a huge cheap army, ghostly soul wisps drifting from the battlefield back toward the monument; with skull pile, iron cage on a post, violet lamp post, small crooked hut, still black bog water with violet reflections. Ground everywhere off the lane: dark dead grass under low fog.
- The lane itself: muddy dark path with cracked cobbles, bordered by crumbling black brick kerb; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/shadow/map/concept.png`, lưu thành `docs/art/topdown/shadow/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Shadow Cult civilization (Shadow element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, dark dead grass under low fog: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, muddy dark path with cracked cobbles: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, crumbling black brick kerb: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: still black bog water with violet reflections: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a misty cursed moor at night: thick low fog, a graveyard, many small crooked huts packed together for a huge cheap army, ghostly soul wisps drifting from the battlefield back toward the monument.
- Palette: black stone, dark slate purple, deep violet (#3d1a66) cloth, ghostly violet (#b77bff) glow, pale bone.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/shadow/map/concept.png`, lưu thành `docs/art/topdown/shadow/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Shadow Cult civilization (Shadow element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are dark pits ringed with candles and bones, gold veins glinting in the gloom.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: black stone, dark slate purple, deep violet (#3d1a66) cloth, ghostly violet (#b77bff) glow, pale bone.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/shadow/map/concept.png`, lưu thành `docs/art/topdown/shadow/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Shadow Cult civilization (Shadow element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a black stone spire with a giant glowing violet eye, soul wisps spiralling into it, smoke at its base.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: black stone, dark slate purple, deep violet (#3d1a66) cloth, ghostly violet (#b77bff) glow, pale bone.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Shadow Tower** → đính kèm `docs/art/topdown/shadow/map/concept.png`, lưu thành `docs/art/topdown/shadow/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Shadow Cult civilization (Shadow element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Shadow Tower: crooked black tower with a violet lantern, shoots arrows.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: black stone, dark slate purple, deep violet (#3d1a66) cloth, ghostly violet (#b77bff) glow, pale bone.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Obsidian Wall** → đính kèm `docs/art/topdown/shadow/map/concept.png`, lưu thành `docs/art/topdown/shadow/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Shadow Cult civilization (Shadow element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: chunks breaking off easily.

CONTENT
- Obsidian Wall: a cheap, thin wall of rough black stone slabs.
- About 1.5 times the height of a unit.
- Palette: black stone, dark slate purple, deep violet (#3d1a66) cloth, ghostly violet (#b77bff) glow, pale bone.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/shadow/map/concept.png`, lưu thành `docs/art/topdown/shadow/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Shadow Cult civilization (Shadow element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: gravestone cluster, crooked dead tree, candle cluster, hooded statue; then skull pile, iron cage on a post, violet lamp post, small crooked hut. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: violet soul wisp rising from the ground (soul harvest), 2 animation frames.
- Row 3, cells 11–12: creeping fog patch, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: black stone, dark slate purple, deep violet (#3d1a66) cloth, ghostly violet (#b77bff) glow, pale bone.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="5-thunder"></a>

## 5. ⚡ Lôi Kiếm Các — Thunder Blade Hall

Đặc điểm: *ra đòn nhanh, nhát chém đầu tiên chí mạng*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/thunder/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Thunder Blade Hall civilization (Lightning element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a tall pagoda pillar topped by a giant copper lightning rod, a yellow bolt crackling down onto it constantly, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (slim copper tower with a crackling rod, shoots spark-tipped arrows), about 1.6 times a soldier's height.
- 58%: the defensive wall (a quickly raised wall of slate slabs bound with copper bands) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a stormy mountain sword school: dark slate courtyards, scorched lightning strike marks everywhere, copper lightning rods on every roof, rain puddles reflecting sparks.
- Palette: dark blue slate, deep blue (#1d4fa0) with yellow stripes, lightning yellow (#ffe94a) glow, electric blue (#8fe3ff) sparks, polished steel.
- Mines: the mines are cut into storm-blasted cliffs with copper rods crackling above the entrance.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: pagoda halls with blue tile roofs, sword racks, a bell tower, storm clouds clipped by the top edge; plus copper lightning rod pole, stone lantern, sword rack, training post. It must read instantly as the Lightning faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a stormy mountain sword school: dark slate courtyards, scorched lightning strike marks everywhere, copper lightning rods on every roof, rain puddles reflecting sparks; with bamboo cluster, split boulder scorched by lightning, wind-swept pine, war drum, rain puddles reflecting yellow sparks. Ground everywhere off the lane: wet dark grass and slate.
- The lane itself: dark slate stone path, bordered by stone kerb with copper trim; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/thunder/map/concept.png`, lưu thành `docs/art/topdown/thunder/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Thunder Blade Hall civilization (Lightning element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, wet dark grass and slate: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, dark slate stone path: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, stone kerb with copper trim: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: rain puddles reflecting yellow sparks: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a stormy mountain sword school: dark slate courtyards, scorched lightning strike marks everywhere, copper lightning rods on every roof, rain puddles reflecting sparks.
- Palette: dark blue slate, deep blue (#1d4fa0) with yellow stripes, lightning yellow (#ffe94a) glow, electric blue (#8fe3ff) sparks, polished steel.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/thunder/map/concept.png`, lưu thành `docs/art/topdown/thunder/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Thunder Blade Hall civilization (Lightning element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are cut into storm-blasted cliffs with copper rods crackling above the entrance.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: dark blue slate, deep blue (#1d4fa0) with yellow stripes, lightning yellow (#ffe94a) glow, electric blue (#8fe3ff) sparks, polished steel.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/thunder/map/concept.png`, lưu thành `docs/art/topdown/thunder/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Thunder Blade Hall civilization (Lightning element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a tall pagoda pillar topped by a giant copper lightning rod, a yellow bolt crackling down onto it constantly.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: dark blue slate, deep blue (#1d4fa0) with yellow stripes, lightning yellow (#ffe94a) glow, electric blue (#8fe3ff) sparks, polished steel.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Lightning Rod Tower** → đính kèm `docs/art/topdown/thunder/map/concept.png`, lưu thành `docs/art/topdown/thunder/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Thunder Blade Hall civilization (Lightning element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Lightning Rod Tower: slim copper tower with a crackling rod, shoots spark-tipped arrows.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: dark blue slate, deep blue (#1d4fa0) with yellow stripes, lightning yellow (#ffe94a) glow, electric blue (#8fe3ff) sparks, polished steel.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Thunder Rampart** → đính kèm `docs/art/topdown/thunder/map/concept.png`, lưu thành `docs/art/topdown/thunder/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Thunder Blade Hall civilization (Lightning element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: sparks crawling over the copper bands.

CONTENT
- Thunder Rampart: a quickly raised wall of slate slabs bound with copper bands.
- About 1.5 times the height of a unit.
- Palette: dark blue slate, deep blue (#1d4fa0) with yellow stripes, lightning yellow (#ffe94a) glow, electric blue (#8fe3ff) sparks, polished steel.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/thunder/map/concept.png`, lưu thành `docs/art/topdown/thunder/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Thunder Blade Hall civilization (Lightning element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: copper lightning rod pole, stone lantern, sword rack, training post; then bamboo cluster, split boulder scorched by lightning, wind-swept pine, war drum. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: scorched lightning strike mark, 2 animation frames.
- Row 3, cells 11–12: crackling yellow spark cluster on the ground, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: dark blue slate, deep blue (#1d4fa0) with yellow stripes, lightning yellow (#ffe94a) glow, electric blue (#8fe3ff) sparks, polished steel.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="6-blood"></a>

## 6. 🩸 Huyết Nguyệt Giáo — Blood Moon Cult

Đặc điểm: *cận chiến hung bạo, càng mất máu càng đánh đau*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/blood/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Blood Moon Cult civilization (Blood element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, an iron-and-bone altar pillar with a glowing red crescent moon on top and chains hanging from it, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (spiked wooden watch post with a red lantern, throws axes), about 1.6 times a soldier's height.
- 58%: the defensive wall (a cheap, quickly hammered row of sharpened stakes tied with red cloth) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a brutal war camp under a red moon: trampled red earth like a fighting arena, rows of spiked stakes, chains between iron posts, glowing red pools.
- Palette: dark red-black stone, blood red (#9c0f1c) cloth, vivid red (#ff2d3c) glow, bone white, rusted iron, red moonlight tint.
- Mines: the mines are rough pits fenced with spiked stakes, red banners and chains around them.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: spiked war tents, bone arches, iron cages, a huge red moon clipped by the top edge; plus spiked war tent, skull totem pole, iron brazier with red fire, chain post. It must read instantly as the Blood faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a brutal war camp under a red moon: trampled red earth like a fighting arena, rows of spiked stakes, chains between iron posts, glowing red pools; with weapon rack with axes, red spider lily patch, war drum, iron cage, thick glowing red pool. Ground everywhere off the lane: trampled dark red earth.
- The lane itself: cracked arena dirt, bordered by row of spiked iron stakes; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/blood/map/concept.png`, lưu thành `docs/art/topdown/blood/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Blood Moon Cult civilization (Blood element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, trampled dark red earth: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, cracked arena dirt: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, row of spiked iron stakes: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: thick glowing red pool: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a brutal war camp under a red moon: trampled red earth like a fighting arena, rows of spiked stakes, chains between iron posts, glowing red pools.
- Palette: dark red-black stone, blood red (#9c0f1c) cloth, vivid red (#ff2d3c) glow, bone white, rusted iron, red moonlight tint.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/blood/map/concept.png`, lưu thành `docs/art/topdown/blood/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Blood Moon Cult civilization (Blood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are rough pits fenced with spiked stakes, red banners and chains around them.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: dark red-black stone, blood red (#9c0f1c) cloth, vivid red (#ff2d3c) glow, bone white, rusted iron, red moonlight tint.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/blood/map/concept.png`, lưu thành `docs/art/topdown/blood/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Blood Moon Cult civilization (Blood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: an iron-and-bone altar pillar with a glowing red crescent moon on top and chains hanging from it.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: dark red-black stone, blood red (#9c0f1c) cloth, vivid red (#ff2d3c) glow, bone white, rusted iron, red moonlight tint.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Blood Moon Post** → đính kèm `docs/art/topdown/blood/map/concept.png`, lưu thành `docs/art/topdown/blood/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Blood Moon Cult civilization (Blood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Blood Moon Post: spiked wooden watch post with a red lantern, throws axes.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: dark red-black stone, blood red (#9c0f1c) cloth, vivid red (#ff2d3c) glow, bone white, rusted iron, red moonlight tint.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Blood Stake Row** → đính kèm `docs/art/topdown/blood/map/concept.png`, lưu thành `docs/art/topdown/blood/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Blood Moon Cult civilization (Blood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: stakes splintering under blows.

CONTENT
- Blood Stake Row: a cheap, quickly hammered row of sharpened stakes tied with red cloth.
- About 1.5 times the height of a unit.
- Palette: dark red-black stone, blood red (#9c0f1c) cloth, vivid red (#ff2d3c) glow, bone white, rusted iron, red moonlight tint.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/blood/map/concept.png`, lưu thành `docs/art/topdown/blood/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Blood Moon Cult civilization (Blood element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: spiked war tent, skull totem pole, iron brazier with red fire, chain post; then weapon rack with axes, red spider lily patch, war drum, iron cage. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: glowing red crack in the ground (berserk rage), 2 animation frames.
- Row 3, cells 11–12: dark red stain patch, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: dark red-black stone, blood red (#9c0f1c) cloth, vivid red (#ff2d3c) glow, bone white, rusted iron, red moonlight tint.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="7-crystal"></a>

## 7. 💎 Tinh Thạch Cốc — Crystal Vale

Đặc điểm: *giàu vàng, tượng vững (+25% máu), có chiến xa*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/crystal/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Crystal Vale civilization (Crystal element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a massive, very sturdy crystal monolith of thick purple crystal pillars bound with silver bands, a floating gem at its top, extra-wide armoured plinth, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (thick crystal tower, very sturdy, shoots arrows), about 1.6 times a soldier's height.
- 58%: the defensive wall (a thick wall of big purple crystal blocks) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a wealthy crystal valley: crystal clusters grow out of the ground, gold glitters in the dirt, polished roads wide enough for war chariots, mine-cart rails everywhere.
- Palette: lavender stone, purple (#5a28a8) cloth, crystal violet (#b98cff) glow, cyan and pink crystal highlights, silver.
- Mines: the richest mines of all: huge gold veins mixed with purple crystals, overflowing ore carts.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: gem workshops, crystal spires, chariot sheds, piles of ore crates; plus purple crystal cluster, crystal tree, mine cart on rails, ore sacks. It must read instantly as the Crystal faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a wealthy crystal valley: crystal clusters grow out of the ground, gold glitters in the dirt, polished roads wide enough for war chariots, mine-cart rails everywhere; with crystal lamp post, gem display table, geode rock, chariot shed, glowing violet crystal pool. Ground everywhere off the lane: lavender soil with crystal flecks.
- The lane itself: wide polished stone road with chariot wheel grooves, bordered by row of small crystal shards; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/crystal/map/concept.png`, lưu thành `docs/art/topdown/crystal/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Crystal Vale civilization (Crystal element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, lavender soil with crystal flecks: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, wide polished stone road with chariot wheel grooves: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, row of small crystal shards: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: glowing violet crystal pool: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a wealthy crystal valley: crystal clusters grow out of the ground, gold glitters in the dirt, polished roads wide enough for war chariots, mine-cart rails everywhere.
- Palette: lavender stone, purple (#5a28a8) cloth, crystal violet (#b98cff) glow, cyan and pink crystal highlights, silver.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/crystal/map/concept.png`, lưu thành `docs/art/topdown/crystal/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Crystal Vale civilization (Crystal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the richest mines of all: huge gold veins mixed with purple crystals, overflowing ore carts.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: lavender stone, purple (#5a28a8) cloth, crystal violet (#b98cff) glow, cyan and pink crystal highlights, silver.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/crystal/map/concept.png`, lưu thành `docs/art/topdown/crystal/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Crystal Vale civilization (Crystal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a massive, very sturdy crystal monolith of thick purple crystal pillars bound with silver bands, a floating gem at its top, extra-wide armoured plinth.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: lavender stone, purple (#5a28a8) cloth, crystal violet (#b98cff) glow, cyan and pink crystal highlights, silver.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Crystal Station** → đính kèm `docs/art/topdown/crystal/map/concept.png`, lưu thành `docs/art/topdown/crystal/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Crystal Vale civilization (Crystal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Crystal Station: thick crystal tower, very sturdy, shoots arrows.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: lavender stone, purple (#5a28a8) cloth, crystal violet (#b98cff) glow, cyan and pink crystal highlights, silver.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Crystal Wall** → đính kèm `docs/art/topdown/crystal/map/concept.png`, lưu thành `docs/art/topdown/crystal/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Crystal Vale civilization (Crystal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: crystal shards cracking off, inner glow showing.

CONTENT
- Crystal Wall: a thick wall of big purple crystal blocks.
- About 1.5 times the height of a unit.
- Palette: lavender stone, purple (#5a28a8) cloth, crystal violet (#b98cff) glow, cyan and pink crystal highlights, silver.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/crystal/map/concept.png`, lưu thành `docs/art/topdown/crystal/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Crystal Vale civilization (Crystal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: purple crystal cluster, crystal tree, mine cart on rails, ore sacks; then crystal lamp post, gem display table, geode rock, chariot shed. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: glittering gold dust patch (gold-making skill), 2 animation frames.
- Row 3, cells 11–12: small crystal sprouting from the ground, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: lavender stone, purple (#5a28a8) cloth, crystal violet (#b98cff) glow, cyan and pink crystal highlights, silver.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="8-stone"></a>

## 8. 🪨 Bàn Thạch Bảo — Stone Bastion

Đặc điểm: *giáp dày, súng đá và máy phóng, chậm; thợ khoan đào nhanh*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/stone/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Stone Bastion civilization (Stone element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a massive squat stone keep-statue of a stone giant's head with glowing amber rune eyes, on a thick fortified base, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (squat stone tower with a stone-gun barrel, fires armour-piercing shots), about 1.6 times a soldier's height.
- 58%: the defensive wall (a very thick, heavily armoured granite wall with iron bands) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a mountain fortress quarry: huge granite blocks, heavy battlements, stone cannon and catapult emplacements, drilling rigs at the mines, rubble and cut stone everywhere.
- Palette: warm grey granite, olive brown (#8a7442) cloth, amber (#ffb43a) glow, charcoal, dusty ochre.
- Mines: the mines are deep quarry cuts with a mechanical stone drill rig and stacked cut blocks.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: thick battlements and squat towers, catapults on platforms, quarry cranes; plus stone cannon on a platform, cannonball pyramid, catapult, cut-stone block stack. It must read instantly as the Stone faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a mountain fortress quarry: huge granite blocks, heavy battlements, stone cannon and catapult emplacements, drilling rigs at the mines, rubble and cut stone everywhere; with quarry crane, standing stone with an amber rune, rubble pile, stone lantern, muddy water in a stone basin. Ground everywhere off the lane: dusty ochre gravel.
- The lane itself: big cut granite paving, bordered by heavy stone kerb with cracks; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/stone/map/concept.png`, lưu thành `docs/art/topdown/stone/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Stone Bastion civilization (Stone element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, dusty ochre gravel: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, big cut granite paving: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, heavy stone kerb with cracks: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: muddy water in a stone basin: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a mountain fortress quarry: huge granite blocks, heavy battlements, stone cannon and catapult emplacements, drilling rigs at the mines, rubble and cut stone everywhere.
- Palette: warm grey granite, olive brown (#8a7442) cloth, amber (#ffb43a) glow, charcoal, dusty ochre.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/stone/map/concept.png`, lưu thành `docs/art/topdown/stone/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Stone Bastion civilization (Stone element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are deep quarry cuts with a mechanical stone drill rig and stacked cut blocks.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: warm grey granite, olive brown (#8a7442) cloth, amber (#ffb43a) glow, charcoal, dusty ochre.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/stone/map/concept.png`, lưu thành `docs/art/topdown/stone/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Stone Bastion civilization (Stone element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a massive squat stone keep-statue of a stone giant's head with glowing amber rune eyes, on a thick fortified base.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: warm grey granite, olive brown (#8a7442) cloth, amber (#ffb43a) glow, charcoal, dusty ochre.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Stone Gun Tower** → đính kèm `docs/art/topdown/stone/map/concept.png`, lưu thành `docs/art/topdown/stone/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Stone Bastion civilization (Stone element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Stone Gun Tower: squat stone tower with a stone-gun barrel, fires armour-piercing shots.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: warm grey granite, olive brown (#8a7442) cloth, amber (#ffb43a) glow, charcoal, dusty ochre.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Bastion Wall** → đính kèm `docs/art/topdown/stone/map/concept.png`, lưu thành `docs/art/topdown/stone/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Stone Bastion civilization (Stone element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: almost no damage at first, then deep cracks.

CONTENT
- Bastion Wall: a very thick, heavily armoured granite wall with iron bands.
- About 1.5 times the height of a unit.
- Palette: warm grey granite, olive brown (#8a7442) cloth, amber (#ffb43a) glow, charcoal, dusty ochre.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/stone/map/concept.png`, lưu thành `docs/art/topdown/stone/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Stone Bastion civilization (Stone element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: stone cannon on a platform, cannonball pyramid, catapult, cut-stone block stack; then quarry crane, standing stone with an amber rune, rubble pile, stone lantern. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: cratered ground from a cannon hit, 2 animation frames.
- Row 3, cells 11–12: amber rune glowing on a paving stone, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: warm grey granite, olive brown (#8a7442) cloth, amber (#ffb43a) glow, charcoal, dusty ochre.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="9-metal"></a>

## 9. ⚒️ Thiết Lò Môn — Iron Forge Sect

Đặc điểm: *lì lợm, càng về cuối trận càng mạnh*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/metal/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Iron Forge Sect civilization (Metal element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a giant iron anvil-shaped monument with a huge gold gear turning above it, a furnace glowing in its base that burns hotter as the battle goes on, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (riveted iron tower with a gun barrel, fires armour-piercing shots), about 1.6 times a soldier's height.
- 58%: the defensive wall (the toughest wall, thick riveted steel plates, slow to build) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: an industrial forge district: riveted iron plates, glowing furnaces, molten metal channels, conveyor rails carrying freshly forged weapons toward the front, steam and sparks.
- Palette: dark iron grey, polished steel, dark crimson (#9e1c22) cloth, gold (#ffd34a) glow, hot orange forge light, soot black.
- Mines: the mines feed an ore conveyor and a small smelter, iron and gold ore in carts.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: huge forges with chimneys, smelter towers, armories, gear machinery; plus anvil, quench barrel, armour stand, weapon rack. It must read instantly as the Metal faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): an industrial forge district: riveted iron plates, glowing furnaces, molten metal channels, conveyor rails carrying freshly forged weapons toward the front, steam and sparks; with coal cart, bellows, steam pipe, gear lamp post, channel of glowing molten metal. Ground everywhere off the lane: soot-black ground with slag.
- The lane itself: riveted iron floor plates, bordered by iron rail kerb with bolts; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/metal/map/concept.png`, lưu thành `docs/art/topdown/metal/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Iron Forge Sect civilization (Metal element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, soot-black ground with slag: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, riveted iron floor plates: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, iron rail kerb with bolts: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: channel of glowing molten metal: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: an industrial forge district: riveted iron plates, glowing furnaces, molten metal channels, conveyor rails carrying freshly forged weapons toward the front, steam and sparks.
- Palette: dark iron grey, polished steel, dark crimson (#9e1c22) cloth, gold (#ffd34a) glow, hot orange forge light, soot black.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/metal/map/concept.png`, lưu thành `docs/art/topdown/metal/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Iron Forge Sect civilization (Metal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines feed an ore conveyor and a small smelter, iron and gold ore in carts.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: dark iron grey, polished steel, dark crimson (#9e1c22) cloth, gold (#ffd34a) glow, hot orange forge light, soot black.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/metal/map/concept.png`, lưu thành `docs/art/topdown/metal/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Iron Forge Sect civilization (Metal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a giant iron anvil-shaped monument with a huge gold gear turning above it, a furnace glowing in its base that burns hotter as the battle goes on.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: dark iron grey, polished steel, dark crimson (#9e1c22) cloth, gold (#ffd34a) glow, hot orange forge light, soot black.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Forge Station** → đính kèm `docs/art/topdown/metal/map/concept.png`, lưu thành `docs/art/topdown/metal/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Iron Forge Sect civilization (Metal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Forge Station: riveted iron tower with a gun barrel, fires armour-piercing shots.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: dark iron grey, polished steel, dark crimson (#9e1c22) cloth, gold (#ffd34a) glow, hot orange forge light, soot black.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Forged Steel Wall** → đính kèm `docs/art/topdown/metal/map/concept.png`, lưu thành `docs/art/topdown/metal/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Iron Forge Sect civilization (Metal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: dents and glowing hot spots where it is hit.

CONTENT
- Forged Steel Wall: the toughest wall, thick riveted steel plates, slow to build.
- About 1.5 times the height of a unit.
- Palette: dark iron grey, polished steel, dark crimson (#9e1c22) cloth, gold (#ffd34a) glow, hot orange forge light, soot black.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/metal/map/concept.png`, lưu thành `docs/art/topdown/metal/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Iron Forge Sect civilization (Metal element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: anvil, quench barrel, armour stand, weapon rack; then coal cart, bellows, steam pipe, gear lamp post. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: hot glowing slag puddle, 2 animation frames.
- Row 3, cells 11–12: spray of forge sparks on the ground, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: dark iron grey, polished steel, dark crimson (#9e1c22) cloth, gold (#ffd34a) glow, hot orange forge light, soot black.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="10-water"></a>

## 10. 🌊 Thủy Nguyệt Cung — Tidal Moon Court

Đặc điểm: *hút máu, đánh lâu không mệt*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/water/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Tidal Moon Court civilization (Water element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a coral-and-pearl arch shrine with a glowing silver crescent moon and water flowing endlessly down its sides into a basin, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (tower of white coral and shells, launches coral javelins), about 1.6 times a soldier's height.
- 58%: the defensive wall (a wall of living coral that regrows) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a moonlit tidal shore: wet sand flats and shallow tide pools, coral reefs, stone causeways over water channels, waves washing up and back along the lane edge.
- Palette: pale blue stone, white coral, aqua (#3aa6e6) cloth, aqua blue (#6fe0ff) glow, sea green, moonlight silver.
- Mines: the mines are sea caves in white rock, half flooded, gold veins under the water glinting.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: shell-roofed palace halls, a lighthouse with a moon lamp, boats at piers, the sea clipped by the top edge; plus palm tree, coral cluster, tide pool, shell lamp post. It must read instantly as the Water faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a moonlit tidal shore: wet sand flats and shallow tide pools, coral reefs, stone causeways over water channels, waves washing up and back along the lane edge; with anchor, fishing net rack, small boat, driftwood log, shallow sea water with wave shimmer. Ground everywhere off the lane: wet sand with shells.
- The lane itself: pale stone causeway with wave carvings, bordered by coral and rock shoreline; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/water/map/concept.png`, lưu thành `docs/art/topdown/water/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Tidal Moon Court civilization (Water element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, wet sand with shells: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, pale stone causeway with wave carvings: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, coral and rock shoreline: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: shallow sea water with wave shimmer: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a moonlit tidal shore: wet sand flats and shallow tide pools, coral reefs, stone causeways over water channels, waves washing up and back along the lane edge.
- Palette: pale blue stone, white coral, aqua (#3aa6e6) cloth, aqua blue (#6fe0ff) glow, sea green, moonlight silver.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/water/map/concept.png`, lưu thành `docs/art/topdown/water/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Tidal Moon Court civilization (Water element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are sea caves in white rock, half flooded, gold veins under the water glinting.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: pale blue stone, white coral, aqua (#3aa6e6) cloth, aqua blue (#6fe0ff) glow, sea green, moonlight silver.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/water/map/concept.png`, lưu thành `docs/art/topdown/water/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Tidal Moon Court civilization (Water element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a coral-and-pearl arch shrine with a glowing silver crescent moon and water flowing endlessly down its sides into a basin.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: pale blue stone, white coral, aqua (#3aa6e6) cloth, aqua blue (#6fe0ff) glow, sea green, moonlight silver.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Coral Station** → đính kèm `docs/art/topdown/water/map/concept.png`, lưu thành `docs/art/topdown/water/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Tidal Moon Court civilization (Water element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Coral Station: tower of white coral and shells, launches coral javelins.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: pale blue stone, white coral, aqua (#3aa6e6) cloth, aqua blue (#6fe0ff) glow, sea green, moonlight silver.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Coral Reef Wall** → đính kèm `docs/art/topdown/water/map/concept.png`, lưu thành `docs/art/topdown/water/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Tidal Moon Court civilization (Water element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: coral branches growing back as it regrows.

CONTENT
- Coral Reef Wall: a wall of living coral that regrows.
- About 1.5 times the height of a unit.
- Palette: pale blue stone, white coral, aqua (#3aa6e6) cloth, aqua blue (#6fe0ff) glow, sea green, moonlight silver.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/water/map/concept.png`, lưu thành `docs/art/topdown/water/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Tidal Moon Court civilization (Water element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: palm tree, coral cluster, tide pool, shell lamp post; then anchor, fishing net rack, small boat, driftwood log. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: aqua drain stream flowing toward the ground (life drain), 2 animation frames.
- Row 3, cells 11–12: puddle left by a wave, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: pale blue stone, white coral, aqua (#3aa6e6) cloth, aqua blue (#6fe0ff) glow, sea green, moonlight silver.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="11-fire"></a>

## 11. 🔥 Viêm Long Môn — Flame Dragon Sect

Đặc điểm: *mọi đòn để lại lửa, máu dày*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/fire/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Flame Dragon Sect civilization (Fire element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a red-lacquer dragon pillar with a gold dragon coiled around it, breathing a solid flame from its jaws at the top, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (basalt tower with a dragon-head window, shoots fire arrows), about 1.6 times a soldier's height.
- 58%: the defensive wall (a basalt wall with lava seams that burns melee attackers) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a volcano slope dragon temple: black basalt with glowing lava cracks, lava channels with stone bridges, scorched and still-burning patches, ash drifting.
- Palette: black volcanic rock, red-orange (#e0401c) cloth, fire orange (#ff7a1a) glow, glowing lava cracks, red lacquer, gold dragon ornaments.
- Mines: the mines are hot volcanic vents, gold veins glowing red-hot, a lava trickle beside them.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: red-lacquer halls with dragon roofs, a smoking volcano clipped by the top edge, dragon statues; plus dragon lamp post, bronze fire brazier, red paper lanterns on a pole, basalt column cluster. It must read instantly as the Fire faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a volcano slope dragon temple: black basalt with glowing lava cracks, lava channels with stone bridges, scorched and still-burning patches, ash drifting; with smoking vent, charred tree with ember leaves, stone dragon statue, gong, flowing lava with a bright crust. Ground everywhere off the lane: black ash ground with ember specks.
- The lane itself: black basalt paving with glowing cracks, bordered by basalt kerb with red lacquer posts; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/fire/map/concept.png`, lưu thành `docs/art/topdown/fire/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Flame Dragon Sect civilization (Fire element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, black ash ground with ember specks: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, black basalt paving with glowing cracks: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, basalt kerb with red lacquer posts: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: flowing lava with a bright crust: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a volcano slope dragon temple: black basalt with glowing lava cracks, lava channels with stone bridges, scorched and still-burning patches, ash drifting.
- Palette: black volcanic rock, red-orange (#e0401c) cloth, fire orange (#ff7a1a) glow, glowing lava cracks, red lacquer, gold dragon ornaments.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/fire/map/concept.png`, lưu thành `docs/art/topdown/fire/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Flame Dragon Sect civilization (Fire element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are hot volcanic vents, gold veins glowing red-hot, a lava trickle beside them.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: black volcanic rock, red-orange (#e0401c) cloth, fire orange (#ff7a1a) glow, glowing lava cracks, red lacquer, gold dragon ornaments.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/fire/map/concept.png`, lưu thành `docs/art/topdown/fire/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Flame Dragon Sect civilization (Fire element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a red-lacquer dragon pillar with a gold dragon coiled around it, breathing a solid flame from its jaws at the top.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: black volcanic rock, red-orange (#e0401c) cloth, fire orange (#ff7a1a) glow, glowing lava cracks, red lacquer, gold dragon ornaments.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Fire Station** → đính kèm `docs/art/topdown/fire/map/concept.png`, lưu thành `docs/art/topdown/fire/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Flame Dragon Sect civilization (Fire element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Fire Station: basalt tower with a dragon-head window, shoots fire arrows.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: black volcanic rock, red-orange (#e0401c) cloth, fire orange (#ff7a1a) glow, glowing lava cracks, red lacquer, gold dragon ornaments.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Flame Stone Wall** → đính kèm `docs/art/topdown/fire/map/concept.png`, lưu thành `docs/art/topdown/fire/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Flame Dragon Sect civilization (Fire element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: flames bursting from the lava seams when struck in melee.

CONTENT
- Flame Stone Wall: a basalt wall with lava seams that burns melee attackers.
- About 1.5 times the height of a unit.
- Palette: black volcanic rock, red-orange (#e0401c) cloth, fire orange (#ff7a1a) glow, glowing lava cracks, red lacquer, gold dragon ornaments.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/fire/map/concept.png`, lưu thành `docs/art/topdown/fire/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Flame Dragon Sect civilization (Fire element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: dragon lamp post, bronze fire brazier, red paper lanterns on a pole, basalt column cluster; then smoking vent, charred tree with ember leaves, stone dragon statue, gong. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: burning ground patch (small solid flames), 2 animation frames.
- Row 3, cells 11–12: smouldering scorch mark, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: black volcanic rock, red-orange (#e0401c) cloth, fire orange (#ff7a1a) glow, glowing lava cracks, red lacquer, gold dragon ornaments.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```


<a id="12-ice"></a>

## 12. ❄️ Hàn Băng Cung — Frost Palace

Đặc điểm: *mọi đòn làm chậm, máu dày*.

**1. Toàn cảnh nửa chiến trường (chốt màu, bố cục)** → lưu thành `docs/art/topdown/ice/map/concept.png`

```
Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the battlefield of the Frost Palace civilization (Ice element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.
- The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane (about one third of the height each).
- Positions are measured from the left edge as a share of the image width; every object is placed exactly there, spread out along the lane, NOT crowded together:
- 8%: the home monument, a tall spire of jagged ice crystals with a glowing snowflake floating at its top, frost spreading over the plinth, standing at the left end of the lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's height (about 180 px native, more than half the image height, rising high into the top band), its plinth as wide as the lane is tall.
- 24%: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height (about 48 x 48 px native), much smaller than the monument.
- 41%: ONE gold mine on the TOP edge of the lane, room for four miners in front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller than the monument. Mines are modest props, NOT big buildings.
- Four empty build plots marked on the BOTTOM edge of the lane at 30%, 48%, 66%, 84%; the first two (30% and 48%) already carry a finished gold depot tower (tower of blue ice blocks, shoots ice arrows), about 1.6 times a soldier's height.
- 58%: the defensive wall (a wall of thick ice blocks that slows melee attackers) standing ACROSS the lane from its top edge to its bottom edge (in the game the player can build it anywhere between 14% and 74%).
- From 74% to the right edge: open no-man's land for the battle, the faction ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.

CONTENT
- Faction character: a frozen palace field: deep snow, slippery frozen patches on the lane that slow everything down, icicles, a frozen lake, jagged ice crystals growing from the ground.
- Palette: snow white, pale blue ice, deep ice blue (#2b67b8) cloth, icy white-blue (#bfeaff) glow, dark blue shadows.
- Mines: the mines are ice caves, gold veins frozen inside clear ice, icicles over the entrance.
- TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: ice palace halls with blue spires, frozen waterfalls, snow-covered pines; plus snow-covered pine, ice crystal cluster, snowdrift, ice lamp post. It must read instantly as the Ice faction even with the lane covered.
- BOTTOM BAND (in front of the lane, down to the image bottom): a frozen palace field: deep snow, slippery frozen patches on the lane that slow everything down, icicles, a frozen lake, jagged ice crystals growing from the ground; with frozen fountain, ice sculpture, firewood pile, warming brazier, frozen lake ice with cracks. Ground everywhere off the lane: deep snow with footprints.
- The lane itself: packed snow path with ice patches, bordered by snow bank with icicles; near the right edge it wears out into neutral dirt with scattered battle scars.
- Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.
- No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**2. Ô nền chiến trường ghép liền** → đính kèm `docs/art/topdown/ice/map/concept.png`, lưu thành `docs/art/topdown/ice/map/ground-tiles.png`

```
Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) that tile seamlessly, the battlefield ground of the Frost Palace civilization (Ice element).
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: off-lane ground, deep snow with footprints: 6 variants (plain, small details, wear, tiny plant, pebbles, faction detail).
- Row 2: battle lane, packed snow path with ice patches: 2 centre variants (the lane is 5 tiles tall, so centre tiles tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, right end.
- Row 3: lane outer corners (4) and lane inner corners (2).
- Row 4: lane border, snow bank with icicles: horizontal piece (top side), horizontal piece (bottom side), 4 corners.
- Row 5: frozen lake ice with cracks: 4 looping frames of one centre tile, then shore top and bottom.
- Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles toward a plain neutral dirt (for the shared centre of the map).

CONTENT
- Faction character: a frozen palace field: deep snow, slippery frozen patches on the lane that slow everything down, icicles, a frozen lake, jagged ice crystals growing from the ground.
- Palette: snow white, pale blue ice, deep ice blue (#2b67b8) cloth, icy white-blue (#bfeaff) glow, dark blue shadows.
- Every tile fully opaque, matching edges, low-contrast detail so units stay readable.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo. Also avoid: transparent tiles, visible seams, objects standing on tiles.
```

**3. Mỏ bạc và mỏ vàng của hệ** → đính kèm `docs/art/topdown/ice/map/concept.png`, lưu thành `docs/art/topdown/ice/map/mines.png`

```
Pixel art game asset sheet: ONE image, a 4 x 4 grid of 16 equal cells (about 64 x 56 px native each) showing the two home mines of the Frost Palace civilization (Ice element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).
- Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, shakes 1 px, burst of silver chips), one nugget pops up, settling.
- Row 3: gold mine, idle, 4 looping frames.
- Row 4: gold mine being struck, same 4 beats with gold chips.

CONTENT
- the mines are ice caves, gold veins frozen inside clear ice, icicles over the entrance.
- Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a small pile of nuggets. The struck face is the lower front, at a unit's waist height.
- Palette: snow white, pale blue ice, deep ice blue (#2b67b8) cloth, icy white-blue (#bfeaff) glow, dark blue shadows.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**4. Tượng nhà (mục tiêu phải phá để thắng)** → đính kèm `docs/art/topdown/ice/map/concept.png`, lưu thành `docs/art/topdown/ice/map/monument.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 112 x 192 px native each) showing ONE home monument of the Frost Palace civilization (Ice element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.
- Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).

CONTENT
- The monument: a tall spire of jagged ice crystals with a glowing snowflake floating at its top, frost spreading over the plinth.
- About five times the height of a unit (about 180 px native), the biggest and most important object of the faction, on a wide stone plinth.
- Palette: snow white, pale blue ice, deep ice blue (#2b67b8) cloth, icy white-blue (#bfeaff) glow, dark blue shadows.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**5. Trạm vàng — Ice Station** → đính kèm `docs/art/topdown/ice/map/concept.png`, lưu thành `docs/art/topdown/ice/map/tower.png`

```
Pixel art game asset sheet: ONE image, a 2 x 4 grid of 8 equal cells (about 48 x 72 px native each) showing ONE gold depot tower of the Frost Palace civilization (Ice element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1: build stages: foundation with scaffold, half built, almost done, complete.
- Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window (attached to its edge), the glow fading.

CONTENT
- Ice Station: tower of blue ice blocks, shoots ice arrows.
- About 1.6 times the height of a unit, a few gold sacks at its foot (miners deliver gold here).
- Palette: snow white, pale blue ice, deep ice blue (#2b67b8) cloth, icy white-blue (#bfeaff) glow, dark blue shadows.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**6. Tường — Ice Wall** → đính kèm `docs/art/topdown/ice/map/concept.png`, lưu thành `docs/art/topdown/ice/map/wall.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 64 px native each) showing ONE defensive wall of the Frost Palace civilization (Ice element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- The wall stands across the battle lane: seen from the three-quarter view it is a short deep block, its front face toward the camera, its length running up the screen.
- Row 1: build stages: outline on the ground, a third, two thirds, complete.
- Row 2: damage states: intact, cracked, heavily damaged, broken rubble.
- Row 3: special effect, 4 frames: frost bursting out and coating the ground in front when struck in melee.

CONTENT
- Ice Wall: a wall of thick ice blocks that slows melee attackers.
- About 1.5 times the height of a unit.
- Palette: snow white, pale blue ice, deep ice blue (#2b67b8) cloth, icy white-blue (#bfeaff) glow, dark blue shadows.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```

**7. Trang trí chiến trường + dấu vết nội tại của hệ** → đính kèm `docs/art/topdown/ice/map/concept.png`, lưu thành `docs/art/topdown/ice/map/decor.png`

```
Pixel art game asset sheet: ONE image, a 3 x 4 grid of 12 equal cells (about 40 x 48 px native each) showing battlefield decor and ground marks of the Frost Palace civilization (Ice element), the object standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully transparent PNG background (alpha), no white, no checkerboard.
Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each defending a home monument at its end of the map, mining gold to train troops.
Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows falling down-right.

LAYOUT
- Row 1–2, cells 1–8: snow-covered pine, ice crystal cluster, snowdrift, ice lamp post; then frozen fountain, ice sculpture, firewood pile, warming brazier. Decor sits on the edges of the lane, never blocking it.
- Row 3, cells 9–10: frozen slippery patch (slow), 2 animation frames.
- Row 3, cells 11–12: frost crystals creeping over the ground, 2 animation frames. These ground marks are flat overlays laid on the lane where the faction fights.

CONTENT
- Palette: snow white, pale blue ice, deep ice blue (#2b67b8) cloth, icy white-blue (#bfeaff) glow, dark blue shadows.
- Small, chunky, instantly readable; banners carry only a simple symbol.

STYLE
- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles 24 x 24 px native, a normal stickman unit about 36 px tall.
- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on objects, softer outline on ground details.
- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.
- Glows are solid bright pixel clusters with a white-hot core, no blur.

AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or realistic style, 3D render, photo.
```
