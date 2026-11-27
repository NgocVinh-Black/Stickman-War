"""Sinh docs/art/prompts/5-ban-do-theo-he.md: prompt chiến trường pixel art nhìn nghiêng 3/4 cho 12 hệ.

Bố cục theo đúng trận đấu trong packages/core/src/world.ts (WORLD_WIDTH 4000, mỗi phe một nửa):
  tượng nhà sát mép (STATUE_OFFSET 170) → mỏ bạc (+300) → mỏ vàng (+650, 4 chỗ) → chỗ dựng trạm / tường
  → bãi giao tranh → mỏ kim cương ở giữa bản đồ (dùng chung, hai phe tranh nhau).

Mỗi hệ 7 prompt: toàn cảnh nửa chiến trường, ô nền, mỏ bạc + mỏ vàng, tượng nhà, trạm vàng, tường, trang trí + dấu vết
nội tại của hệ. Thêm phần dùng chung: mỏ kim cương giữa bản đồ và toàn cảnh cả trận.

Ảnh lưu ở docs/art/topdown/<hệ>/map/. Sửa dữ liệu bên dưới rồi chạy:  python3 docs/art/prompts/gen_map_prompts.py
"""

from pathlib import Path

HERE = Path(__file__).resolve().parent

# Toạ độ trận lấy từ packages/core/src/world.ts (đổi ở đó thì sửa ở đây): tính từ mép trái, phe trái.
WORLD = 4000
STATUE, SILVER, GOLD, CENTER = 170, 170 + 300, 170 + 650, WORLD // 2
DEPOTS = sorted(170 + d for d in (430, 1150, 800, 1500))  # DEPOT_SLOTS; 2 ô đầu theo thứ tự xây là 600 và 970
WALL_MIN, WALL_MAX = 170 + 120, 170 + 1300
WALL_EXAMPLE = 1150


def pct(x: float, span: float) -> str:
    return f"{round(100 * x / span)}%"


def lane_rules(span: float) -> list[str]:
    """Bố cục chung của toàn cảnh: span = chiều ngang thế giới mà ảnh phủ (2000 = nửa trận, 4000 = cả trận)."""
    return [
        "THE BATTLE LANE IS THE MAIN THING: one perfectly straight horizontal road crossing the whole image from the "
        "left edge to the right edge, the SAME width everywhere, taking about ONE THIRD of the image height (about 5 "
        "ground tiles, 120 px native) — wide enough for five soldiers standing one behind another across it, and a "
        "whole army of about 60 soldiers marching on it. No crossroads, no branches, no bridges, no narrowing.",
        "The lane is completely empty and walkable: nothing stands on it except the defensive wall. Mines, towers, "
        "the monument plinth and decor only TOUCH its edges; scenery lives in the bands above and below the lane "
        "(about one third of the height each).",
        f"Positions are measured from the left edge as a share of the image width; every object is placed exactly "
        f"there, spread out along the lane, NOT crowded together:",
    ]

OUT = HERE / "5-ban-do-theo-he.md"
TOP = "docs/art/topdown"

VIEW = (
    "Camera: three-quarter top-down view like a 16-bit pixel RPG, looking down at about 60 degrees, NOT isometric. "
    "The ground is a flat plane aligned to the screen; every standing object (statue, tower, wall, mine, tree) shows "
    "its top AND its front face, tall objects overlap what is behind them. Light from the top-left, short shadows "
    "falling down-right."
)
GAME = (
    "Game: a stickman real-time strategy war game. Two armies march along one long horizontal battle lane, each "
    "defending a home monument at its end of the map, mining gold to train troops."
)
STYLE = (
    "STYLE\n"
    "- Clean modern pixel art: every art pixel a crisp square block, upscaled with nearest neighbour. Ground tiles "
    "24 x 24 px native, a normal stickman unit about 36 px tall.\n"
    "- Limited palette (about 24 colours), 3-tone shading (cool shadow, mid-tone, warm highlight), 1px dark outline on "
    "objects, softer outline on ground details.\n"
    "- Rich detail on the edges of the lane, the lane itself calm and readable so small units stand out on it.\n"
    "- Glows are solid bright pixel clusters with a white-hot core, no blur."
)
AVOID = (
    "AVOID: text, letters, numbers, logos, UI, health bars, characters, stickmen, soldiers, people, animals, isometric "
    "diamond tiles, perspective vanishing points, fisheye, blur, bloom, soft gradients, anti-aliasing, painterly or "
    "realistic style, 3D render, photo."
)

# 12 hệ đúng thứ tự FACTION_ORDER. "trait" là nội tại trong factions.ts (tiếng Việt, để người đọc đối chiếu);
# các trường còn lại tiếng Anh vì dán thẳng vào công cụ tạo ảnh.
CIVS = [
    {
        "code": "light", "icon": "☀️", "vi": "Thánh Quang Điện", "en": "Temple of Light", "el": "Light",
        "trait": "kỷ luật, cân bằng, quân rẻ, lên kỳ cựu nhanh",
        "colours": "white marble, cream stone, rich gold (#e8a91c), radiant gold (#ffd84a) glow, sky-blue accents",
        "land": "an orderly holy fortress on a sunlit plateau: straight white-marble roads, neat trimmed hedges, "
                "rows of sun altars, everything symmetrical and disciplined",
        "back": "white colonnades, a temple with a gold dome, training yards with ranks of shields on racks",
        "floor": "short tidy grass", "lane": "pale sandstone road with gold inlay lines",
        "edge": "carved white stone kerb with a gold stripe", "liquid": "holy water channel with gold sparkles",
        "mine": "the mines are framed by white marble arches and gold-trimmed wooden beams, neat stacked ore crates",
        "monument": "a tall white-marble obelisk crowned by a glowing gold sun disc, gold rays carved down its sides, "
                    "two braziers on the plinth",
        "tower": "Tower of Light: white stone watchtower with a gold dome, shoots glowing gold arrows",
        "wall": "White Stone Wall: solid white stone wall with a gold-trimmed double gate, balanced and sturdy",
        "wall_fx": "the gate swinging open and shut for friendly troops",
        "decor": "sun altar with candles, marble pillar, gold brazier, trimmed hedge, white-blossom tree, "
                 "banner pole with a sun symbol, shield rack, marble bench",
        "fx": "glowing gold sun glyph on the ground (veteran rank-up mark)", "fx2": "scattered gold light motes",
    },
    {
        "code": "wind", "icon": "🌪️", "vi": "Cuồng Phong Trại", "en": "Gale Horde", "el": "Wind",
        "trait": "chạy nhanh, càng đông càng mạnh, đứng lẻ thì yếu",
        "colours": "sandy beige, weathered wood, sky blue (#2f8fc4) cloth, pale icy cyan (#a8ecff) glow, white canvas",
        "land": "a wide open windswept steppe with almost no obstacles, perfect for fast charges: long grass all bent "
                "in one direction toward the enemy, dust streaks, tents clustered close together in packs",
        "back": "round canvas yurts in tight clusters, tall windmills, rope lines of streaming blue flags",
        "floor": "wind-bent steppe grass", "lane": "wide dusty trail with long wind streaks",
        "edge": "low stacked stones with tufts of dry grass", "liquid": "small oasis pond rippled by wind",
        "mine": "the mines are dug into wind-carved sandstone, with canvas awnings flapping and a pinwheel on top",
        "monument": "a giant wooden windmill totem with spinning blue sails and a swirling cyan wind vortex in its "
                    "centre, long pennants streaming sideways",
        "tower": "Pinwheel Tower: wooden stilt tower with a spinning pinwheel, launches javelins",
        "wall": "Thorn Wind Fence: a fence of sharpened stakes bound with thorny brambles and fluttering cloth strips",
        "wall_fx": "thorns jabbing outward when struck in melee",
        "decor": "yurt, windmill, wind chime pole, tumbleweed, wind-bent pine, wind-carved rock arch, "
                 "flag pole with a streaming pennant, javelin rack",
        "fx": "swirling dust devil on the ground", "fx2": "flattened grass trail from a fast charge",
    },
    {
        "code": "wood", "icon": "🌿", "vi": "Thanh Mộc Lâm", "en": "Verdant Grove", "el": "Wood",
        "trait": "bắn rất xa, tự hồi máu, mỏng manh khi bị áp sát",
        "colours": "deep forest green (#1f6b26), bright leaf green (#7dff6a) glow, warm bark brown, mossy grey, "
                   "pink and yellow flowers",
        "land": "the edge of an ancient forest: the home side is thick with giant trees and archer platforms "
                "high in the branches, opening toward the enemy into a long clear meadow (a killing field for "
                "long-range archers), healing glades with glowing moss",
        "back": "giant trees with wooden archer platforms and rope bridges, tree houses, glowing mushrooms",
        "floor": "mossy forest floor with fallen leaves", "lane": "soft dirt path with roots crossing it",
        "edge": "mossy logs and ferns", "liquid": "clear stream with lily pads",
        "mine": "the mines are overgrown with roots and moss, gold veins tangled with glowing vines",
        "monument": "a sacred ancient tree with a huge trunk, a glowing green heart-seed in a hollow, roots spreading "
                    "over the plinth",
        "tower": "Tree Post: a hollow living tree with an archer nest, shoots very long-range arrows",
        "wall": "Living Tree Wall: a wall of living trunks and thick vines that regrows",
        "wall_fx": "new leaves and branches sprouting back as it regrows",
        "decor": "giant oak, archer platform on a tree, glowing mushroom cluster, fern bush, mossy boulder, "
                 "carved wooden totem, hollow log, flower patch",
        "fx": "glowing green healing moss patch", "fx2": "sprouting leaves on bare ground",
    },
    {
        "code": "shadow", "icon": "🌑", "vi": "Hội Bóng Đêm", "en": "Shadow Cult", "el": "Shadow",
        "trait": "quân rẻ, yếu, rất đông; hạ địch thì thu hồn ra vàng",
        "colours": "black stone, dark slate purple, deep violet (#3d1a66) cloth, ghostly violet (#b77bff) glow, "
                   "pale bone",
        "land": "a misty cursed moor at night: thick low fog, a graveyard, many small crooked huts packed together "
                "for a huge cheap army, ghostly soul wisps drifting from the battlefield back toward the monument",
        "back": "crooked dark houses with pointed roofs, crypts, hooded statues, dead trees",
        "floor": "dark dead grass under low fog", "lane": "muddy dark path with cracked cobbles",
        "edge": "crumbling black brick kerb", "liquid": "still black bog water with violet reflections",
        "mine": "the mines are dark pits ringed with candles and bones, gold veins glinting in the gloom",
        "monument": "a black stone spire with a giant glowing violet eye, soul wisps spiralling into it, smoke at "
                    "its base",
        "tower": "Shadow Tower: crooked black tower with a violet lantern, shoots arrows",
        "wall": "Obsidian Wall: a cheap, thin wall of rough black stone slabs",
        "wall_fx": "chunks breaking off easily",
        "decor": "gravestone cluster, crooked dead tree, candle cluster, hooded statue, skull pile, iron cage on a "
                 "post, violet lamp post, small crooked hut",
        "fx": "violet soul wisp rising from the ground (soul harvest)", "fx2": "creeping fog patch",
    },
    {
        "code": "thunder", "icon": "⚡", "vi": "Lôi Kiếm Các", "en": "Thunder Blade Hall", "el": "Lightning",
        "trait": "ra đòn nhanh, nhát chém đầu tiên chí mạng",
        "colours": "dark blue slate, deep blue (#1d4fa0) with yellow stripes, lightning yellow (#ffe94a) glow, "
                   "electric blue (#8fe3ff) sparks, polished steel",
        "land": "a stormy mountain sword school: dark slate courtyards, scorched lightning strike marks everywhere, "
                "copper lightning rods on every roof, rain puddles reflecting sparks",
        "back": "pagoda halls with blue tile roofs, sword racks, a bell tower, storm clouds clipped by the top edge",
        "floor": "wet dark grass and slate", "lane": "dark slate stone path",
        "edge": "stone kerb with copper trim", "liquid": "rain puddles reflecting yellow sparks",
        "mine": "the mines are cut into storm-blasted cliffs with copper rods crackling above the entrance",
        "monument": "a tall pagoda pillar topped by a giant copper lightning rod, a yellow bolt crackling down onto it "
                    "constantly",
        "tower": "Lightning Rod Tower: slim copper tower with a crackling rod, shoots spark-tipped arrows",
        "wall": "Thunder Rampart: a quickly raised wall of slate slabs bound with copper bands",
        "wall_fx": "sparks crawling over the copper bands",
        "decor": "copper lightning rod pole, stone lantern, sword rack, training post, bamboo cluster, split boulder "
                 "scorched by lightning, wind-swept pine, war drum",
        "fx": "scorched lightning strike mark", "fx2": "crackling yellow spark cluster on the ground",
    },
    {
        "code": "blood", "icon": "🩸", "vi": "Huyết Nguyệt Giáo", "en": "Blood Moon Cult", "el": "Blood",
        "trait": "cận chiến hung bạo, càng mất máu càng đánh đau",
        "colours": "dark red-black stone, blood red (#9c0f1c) cloth, vivid red (#ff2d3c) glow, bone white, rusted iron, "
                   "red moonlight tint",
        "land": "a brutal war camp under a red moon: trampled red earth like a fighting arena, rows of spiked stakes, "
                "chains between iron posts, glowing red pools",
        "back": "spiked war tents, bone arches, iron cages, a huge red moon clipped by the top edge",
        "floor": "trampled dark red earth", "lane": "cracked arena dirt",
        "edge": "row of spiked iron stakes", "liquid": "thick glowing red pool",
        "mine": "the mines are rough pits fenced with spiked stakes, red banners and chains around them",
        "monument": "an iron-and-bone altar pillar with a glowing red crescent moon on top and chains hanging from it",
        "tower": "Blood Moon Post: spiked wooden watch post with a red lantern, throws axes",
        "wall": "Blood Stake Row: a cheap, quickly hammered row of sharpened stakes tied with red cloth",
        "wall_fx": "stakes splintering under blows",
        "decor": "spiked war tent, skull totem pole, iron brazier with red fire, chain post, weapon rack with axes, "
                 "red spider lily patch, war drum, iron cage",
        "fx": "glowing red crack in the ground (berserk rage)", "fx2": "dark red stain patch",
    },
    {
        "code": "crystal", "icon": "💎", "vi": "Tinh Thạch Cốc", "en": "Crystal Vale", "el": "Crystal",
        "trait": "giàu vàng, tượng vững (+25% máu), có chiến xa",
        "colours": "lavender stone, purple (#5a28a8) cloth, crystal violet (#b98cff) glow, cyan and pink crystal "
                   "highlights, silver",
        "land": "a wealthy crystal valley: crystal clusters grow out of the ground, gold glitters in the dirt, "
                "polished roads wide enough for war chariots, mine-cart rails everywhere",
        "back": "gem workshops, crystal spires, chariot sheds, piles of ore crates",
        "floor": "lavender soil with crystal flecks", "lane": "wide polished stone road with chariot wheel grooves",
        "edge": "row of small crystal shards", "liquid": "glowing violet crystal pool",
        "mine": "the richest mines of all: huge gold veins mixed with purple crystals, overflowing ore carts",
        "monument": "a massive, very sturdy crystal monolith of thick purple crystal pillars bound with silver bands, "
                    "a floating gem at its top, extra-wide armoured plinth",
        "tower": "Crystal Station: thick crystal tower, very sturdy, shoots arrows",
        "wall": "Crystal Wall: a thick wall of big purple crystal blocks",
        "wall_fx": "crystal shards cracking off, inner glow showing",
        "decor": "purple crystal cluster, crystal tree, mine cart on rails, ore sacks, crystal lamp post, "
                 "gem display table, geode rock, chariot shed",
        "fx": "glittering gold dust patch (gold-making skill)", "fx2": "small crystal sprouting from the ground",
    },
    {
        "code": "stone", "icon": "🪨", "vi": "Bàn Thạch Bảo", "en": "Stone Bastion", "el": "Stone",
        "trait": "giáp dày, súng đá và máy phóng, chậm; thợ khoan đào nhanh",
        "colours": "warm grey granite, olive brown (#8a7442) cloth, amber (#ffb43a) glow, charcoal, dusty ochre",
        "land": "a mountain fortress quarry: huge granite blocks, heavy battlements, stone cannon and catapult "
                "emplacements, drilling rigs at the mines, rubble and cut stone everywhere",
        "back": "thick battlements and squat towers, catapults on platforms, quarry cranes",
        "floor": "dusty ochre gravel", "lane": "big cut granite paving",
        "edge": "heavy stone kerb with cracks", "liquid": "muddy water in a stone basin",
        "mine": "the mines are deep quarry cuts with a mechanical stone drill rig and stacked cut blocks",
        "monument": "a massive squat stone keep-statue of a stone giant's head with glowing amber rune eyes, on a "
                    "thick fortified base",
        "tower": "Stone Gun Tower: squat stone tower with a stone-gun barrel, fires armour-piercing shots",
        "wall": "Bastion Wall: a very thick, heavily armoured granite wall with iron bands",
        "wall_fx": "almost no damage at first, then deep cracks",
        "decor": "stone cannon on a platform, cannonball pyramid, catapult, cut-stone block stack, quarry crane, "
                 "standing stone with an amber rune, rubble pile, stone lantern",
        "fx": "cratered ground from a cannon hit", "fx2": "amber rune glowing on a paving stone",
    },
    {
        "code": "metal", "icon": "⚒️", "vi": "Thiết Lò Môn", "en": "Iron Forge Sect", "el": "Metal",
        "trait": "lì lợm, càng về cuối trận càng mạnh",
        "colours": "dark iron grey, polished steel, dark crimson (#9e1c22) cloth, gold (#ffd34a) glow, hot orange forge "
                   "light, soot black",
        "land": "an industrial forge district: riveted iron plates, glowing furnaces, molten metal channels, "
                "conveyor rails carrying freshly forged weapons toward the front, steam and sparks",
        "back": "huge forges with chimneys, smelter towers, armories, gear machinery",
        "floor": "soot-black ground with slag", "lane": "riveted iron floor plates",
        "edge": "iron rail kerb with bolts", "liquid": "channel of glowing molten metal",
        "mine": "the mines feed an ore conveyor and a small smelter, iron and gold ore in carts",
        "monument": "a giant iron anvil-shaped monument with a huge gold gear turning above it, a furnace glowing in "
                    "its base that burns hotter as the battle goes on",
        "tower": "Forge Station: riveted iron tower with a gun barrel, fires armour-piercing shots",
        "wall": "Forged Steel Wall: the toughest wall, thick riveted steel plates, slow to build",
        "wall_fx": "dents and glowing hot spots where it is hit",
        "decor": "anvil, quench barrel, armour stand, weapon rack, coal cart, bellows, steam pipe, gear lamp post",
        "fx": "hot glowing slag puddle", "fx2": "spray of forge sparks on the ground",
    },
    {
        "code": "water", "icon": "🌊", "vi": "Thủy Nguyệt Cung", "en": "Tidal Moon Court", "el": "Water",
        "trait": "hút máu, đánh lâu không mệt",
        "colours": "pale blue stone, white coral, aqua (#3aa6e6) cloth, aqua blue (#6fe0ff) glow, sea green, "
                   "moonlight silver",
        "land": "a moonlit tidal shore: wet sand flats and shallow tide pools, coral reefs, stone causeways over "
                "water channels, waves washing up and back along the lane edge",
        "back": "shell-roofed palace halls, a lighthouse with a moon lamp, boats at piers, the sea clipped by the top "
                "edge",
        "floor": "wet sand with shells", "lane": "pale stone causeway with wave carvings",
        "edge": "coral and rock shoreline", "liquid": "shallow sea water with wave shimmer",
        "mine": "the mines are sea caves in white rock, half flooded, gold veins under the water glinting",
        "monument": "a coral-and-pearl arch shrine with a glowing silver crescent moon and water flowing endlessly down "
                    "its sides into a basin",
        "tower": "Coral Station: tower of white coral and shells, launches coral javelins",
        "wall": "Coral Reef Wall: a wall of living coral that regrows",
        "wall_fx": "coral branches growing back as it regrows",
        "decor": "palm tree, coral cluster, tide pool, shell lamp post, anchor, fishing net rack, small boat, "
                 "driftwood log",
        "fx": "aqua drain stream flowing toward the ground (life drain)", "fx2": "puddle left by a wave",
    },
    {
        "code": "fire", "icon": "🔥", "vi": "Viêm Long Môn", "en": "Flame Dragon Sect", "el": "Fire",
        "trait": "mọi đòn để lại lửa, máu dày",
        "colours": "black volcanic rock, red-orange (#e0401c) cloth, fire orange (#ff7a1a) glow, glowing lava cracks, "
                   "red lacquer, gold dragon ornaments",
        "land": "a volcano slope dragon temple: black basalt with glowing lava cracks, lava channels with stone "
                "bridges, scorched and still-burning patches, ash drifting",
        "back": "red-lacquer halls with dragon roofs, a smoking volcano clipped by the top edge, dragon statues",
        "floor": "black ash ground with ember specks", "lane": "black basalt paving with glowing cracks",
        "edge": "basalt kerb with red lacquer posts", "liquid": "flowing lava with a bright crust",
        "mine": "the mines are hot volcanic vents, gold veins glowing red-hot, a lava trickle beside them",
        "monument": "a red-lacquer dragon pillar with a gold dragon coiled around it, breathing a solid flame from its "
                    "jaws at the top",
        "tower": "Fire Station: basalt tower with a dragon-head window, shoots fire arrows",
        "wall": "Flame Stone Wall: a basalt wall with lava seams that burns melee attackers",
        "wall_fx": "flames bursting from the lava seams when struck in melee",
        "decor": "dragon lamp post, bronze fire brazier, red paper lanterns on a pole, basalt column cluster, "
                 "smoking vent, charred tree with ember leaves, stone dragon statue, gong",
        "fx": "burning ground patch (small solid flames)", "fx2": "smouldering scorch mark",
    },
    {
        "code": "ice", "icon": "❄️", "vi": "Hàn Băng Cung", "en": "Frost Palace", "el": "Ice",
        "trait": "mọi đòn làm chậm, máu dày",
        "colours": "snow white, pale blue ice, deep ice blue (#2b67b8) cloth, icy white-blue (#bfeaff) glow, "
                   "dark blue shadows",
        "land": "a frozen palace field: deep snow, slippery frozen patches on the lane that slow everything down, "
                "icicles, a frozen lake, jagged ice crystals growing from the ground",
        "back": "ice palace halls with blue spires, frozen waterfalls, snow-covered pines",
        "floor": "deep snow with footprints", "lane": "packed snow path with ice patches",
        "edge": "snow bank with icicles", "liquid": "frozen lake ice with cracks",
        "mine": "the mines are ice caves, gold veins frozen inside clear ice, icicles over the entrance",
        "monument": "a tall spire of jagged ice crystals with a glowing snowflake floating at its top, frost spreading "
                    "over the plinth",
        "tower": "Ice Station: tower of blue ice blocks, shoots ice arrows",
        "wall": "Ice Wall: a wall of thick ice blocks that slows melee attackers",
        "wall_fx": "frost bursting out and coating the ground in front when struck in melee",
        "decor": "snow-covered pine, ice crystal cluster, snowdrift, ice lamp post, frozen fountain, ice sculpture, "
                 "firewood pile, warming brazier",
        "fx": "frozen slippery patch (slow)", "fx2": "frost crystals creeping over the ground",
    },
]


def prompt(head: str, layout: list[str], content: list[str], extra_avoid: str = "") -> str:
    parts = [
        f"{head}\n{GAME}\n{VIEW}",
        "LAYOUT\n" + "\n".join(f"- {x}" for x in layout),
        "CONTENT\n" + "\n".join(f"- {x}" for x in content),
        STYLE,
        AVOID + (f" Also avoid: {extra_avoid}." if extra_avoid else ""),
    ]
    return "\n\n".join(parts)


def sheet(grid: str, cell: str, what: str) -> str:
    return (f"Pixel art game asset sheet: ONE image, {grid} equal cells ({cell} native each) showing {what}, the object "
            "standing at the bottom centre of every cell, evenly spaced, nothing touching another cell, fully "
            "transparent PNG background (alpha), no white, no checkerboard.")


def civ_prompts(c: dict) -> list[tuple[str, str, str]]:
    who = f"the {c['en']} civilization ({c['el']} element)"
    pal = f"Palette: {c['colours']}."
    mood = f"Faction character: {c['land']}."
    tower_name, tower_desc = c["tower"].split(": ", 1)
    wall_name, wall_desc = c["wall"].split(": ", 1)
    return [
        (
            "Toàn cảnh nửa chiến trường (chốt màu, bố cục)",
            "concept.png",
            prompt(
                f"Pixel art game map screenshot, ONE wide 2:1 image (native about 640 x 320 px): the home half of the "
                f"battlefield of {who}.",
                lane_rules(WORLD / 2) + [
                    f"{pct(STATUE, WORLD / 2)}: the home monument, {c['monument']}, standing at the left end of the "
                    "lane and blocking it (enemies attack it there). It is the BIGGEST object of the map: about 5 times a soldier's "
                    "height (about 180 px native, more than half the image height, rising high into the top band), its "
                    "plinth as wide as the lane is tall.",
                    f"{pct(SILVER, WORLD / 2)}: ONE SMALL silver-ore mine on the TOP edge of the lane, its mouth facing "
                    "down onto the lane (miners walk to it along the lane): only about 1.3 times a soldier's height "
                    "(about 48 x 48 px native), much smaller than the monument.",
                    f"{pct(GOLD, WORLD / 2)}: ONE gold mine on the TOP edge of the lane, room for four miners in "
                    "front of it: only about 1.6 times a soldier's height (about 64 x 56 px native), still far smaller "
                    "than the monument. Mines are modest props, NOT big buildings.",
                    f"Four empty build plots marked on the BOTTOM edge of the lane at {', '.join(pct(x, WORLD / 2) for x in DEPOTS)}; "
                    f"the first two ({pct(DEPOTS[0], WORLD / 2)} and {pct(DEPOTS[1], WORLD / 2)}) already carry a finished "
                    f"gold depot tower ({tower_desc}), about 1.6 times a soldier's height.",
                    f"{pct(WALL_EXAMPLE, WORLD / 2)}: the defensive wall ({wall_desc}) standing ACROSS the lane from its "
                    "top edge to its bottom edge (in the game the player can build it anywhere between "
                    f"{pct(WALL_MIN, WORLD / 2)} and {pct(WALL_MAX, WORLD / 2)}).",
                    f"From {pct(WALL_MAX, WORLD / 2)} to the right edge: open no-man's land for the battle, the faction "
                    "ground fading into plain neutral dirt, a few battle scars on the lane; at the very right edge (100%) "
                    "the left half of the neutral diamond mine sitting on the top edge of the lane in the centre of the map.",
                ],
                [mood, pal, f"Mines: {c['mine']}.",
                 f"TOP BAND (behind the lane, up to the image top): densely filled with the faction's home: {c['back']}; "
                 f"plus {', '.join(c['decor'].split(', ')[:4])}. It must read instantly as the {c['el']} faction even "
                 "with the lane covered.",
                 f"BOTTOM BAND (in front of the lane, down to the image bottom): {c['land']}; with "
                 f"{', '.join(c['decor'].split(', ')[4:])}, {c['liquid']}. Ground everywhere off the lane: {c['floor']}.",
                 f"The lane itself: {c['lane']}, bordered by {c['edge']}; near the right edge it wears out into neutral "
                 "dirt with scattered battle scars.",
                 "Relative sizes (a soldier is 36 px native tall): monument ~5x, depot tower ~1.6x, wall ~1.5x and as "
                 "long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, decor 0.5x–1x.",
                 "No units on the map: only terrain, buildings and decor, as an empty battlefield before the fight."],
            ),
        ),
        (
            "Ô nền chiến trường ghép liền",
            "ground-tiles.png",
            prompt(
                "Pixel art tileset: ONE image, a 5 x 6 grid of 30 equal square ground tiles (24 x 24 px native each) "
                f"that tile seamlessly, the battlefield ground of {who}.",
                [
                    f"Row 1: off-lane ground, {c['floor']}: 6 variants (plain, small details, wear, tiny plant, pebbles, "
                    "faction detail).",
                    f"Row 2: battle lane, {c['lane']}: 2 centre variants (the lane is 5 tiles tall, so centre tiles "
                    "tile seamlessly in BOTH directions), then edges where it meets the ground: top, bottom, left end, "
                    "right end.",
                    "Row 3: lane outer corners (4) and lane inner corners (2).",
                    f"Row 4: lane border, {c['edge']}: horizontal piece (top side), horizontal piece (bottom side), "
                    "4 corners.",
                    f"Row 5: {c['liquid']}: 4 looping frames of one centre tile, then shore top and bottom.",
                    "Row 6: 3 worn / battle-damaged lane tiles (footprints, scratches, small crater), 3 transition tiles "
                    "toward a plain neutral dirt (for the shared centre of the map).",
                ],
                [mood, pal, "Every tile fully opaque, matching edges, low-contrast detail so units stay readable."],
                "transparent tiles, visible seams, objects standing on tiles",
            ),
        ),
        (
            "Mỏ bạc và mỏ vàng của hệ",
            "mines.png",
            prompt(
                sheet("a 4 x 4 grid of 16", "about 64 x 56 px", f"the two home mines of {who}"),
                [
                    "Row 1: silver mine, idle, 4 looping frames (a glint moving vein to vein).",
                    "Row 2: silver mine being struck by a pickaxe (the miner is NOT drawn): normal, HIT (rock flashes, "
                    "shakes 1 px, burst of silver chips), one nugget pops up, settling.",
                    "Row 3: gold mine, idle, 4 looping frames.",
                    "Row 4: gold mine being struck, same 4 beats with gold chips.",
                ],
                [f"{c['mine']}.", "Both mines are modest props, not buildings: silver mine about 1.3 times a unit's height with "
                 "pale grey-white veins; gold mine about 1.6 times a unit's height with thick glowing gold veins and a "
                 "small pile of nuggets. The struck face is the lower front, at a unit's waist height.", pal],
            ),
        ),
        (
            "Tượng nhà (mục tiêu phải phá để thắng)",
            "monument.png",
            prompt(
                sheet("a 2 x 4 grid of 8", "about 112 x 192 px", f"ONE home monument of {who}"),
                [
                    "Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker.",
                    "Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken, glow almost out).",
                ],
                [f"The monument: {c['monument']}.", "About five times the height of a unit (about 180 px native), the biggest and "
                 "most important object of the faction, on a wide stone plinth.", pal],
            ),
        ),
        (
            f"Trạm vàng — {tower_name}",
            "tower.png",
            prompt(
                sheet("a 2 x 4 grid of 8", "about 48 x 72 px", f"ONE gold depot tower of {who}"),
                [
                    "Row 1: build stages: foundation with scaffold, half built, almost done, complete.",
                    "Row 2: shooting, 4 frames: idle, the window glows brighter, the projectile leaves the window "
                    "(attached to its edge), the glow fading.",
                ],
                [f"{tower_name}: {tower_desc}.", "About 1.6 times the height of a unit, a few gold sacks at its foot "
                 "(miners deliver gold here).", pal],
            ),
        ),
        (
            f"Tường — {wall_name}",
            "wall.png",
            prompt(
                sheet("a 3 x 4 grid of 12", "about 40 x 64 px", f"ONE defensive wall of {who}"),
                [
                    "The wall stands across the battle lane: seen from the three-quarter view it is a short deep "
                    "block, its front face toward the camera, its length running up the screen.",
                    "Row 1: build stages: outline on the ground, a third, two thirds, complete.",
                    "Row 2: damage states: intact, cracked, heavily damaged, broken rubble.",
                    f"Row 3: special effect, 4 frames: {c['wall_fx']}.",
                ],
                [f"{wall_name}: {wall_desc}.", "About 1.5 times the height of a unit.", pal],
            ),
        ),
        (
            "Trang trí chiến trường + dấu vết nội tại của hệ",
            "decor.png",
            prompt(
                sheet("a 3 x 4 grid of 12", "about 40 x 48 px", f"battlefield decor and ground marks of {who}"),
                [f"Row 1–2, cells 1–8: {', '.join(c['decor'].split(', ')[:4])}; then "
                 f"{', '.join(c['decor'].split(', ')[4:])}. Decor sits on the edges of the lane, never blocking it.",
                 f"Row 3, cells 9–10: {c['fx']}, 2 animation frames.",
                 f"Row 3, cells 11–12: {c['fx2']}, 2 animation frames. These ground marks are flat overlays laid on "
                 "the lane where the faction fights."],
                [pal, "Small, chunky, instantly readable; banners carry only a simple symbol."],
            ),
        ),
    ]


COMMON = [
    (
        "Mỏ kim cương giữa bản đồ (hai phe tranh nhau)",
        "map/diamond-mine.png",
        prompt(
            sheet("a 2 x 4 grid of 8", "about 112 x 80 px", "ONE neutral diamond mine in the centre of the battlefield"),
            [
                "Row 1: idle, 4 looping frames: big diamonds sparkle one after another.",
                "Row 2: being struck from both sides (miners NOT drawn): normal, HIT (flash, shake 1 px, burst of white-blue "
                "diamond chips), one diamond pops up, settling.",
            ],
            ["A wide rocky outcrop of neutral grey stone in no-man's land, huge white-blue diamonds jutting out, a dark "
             "tunnel on each side (left and right) since both armies mine it, scattered bones and broken weapons "
             "around it (it is the most fought-over spot).",
             "Neutral palette: grey stone, white-blue diamonds (#bff4ff), plain brown dirt."],
        ),
    ),
    (
        "Toàn cảnh cả trận (hai hệ đối đầu)",
        "map/battle-concept.png",
        prompt(
            "Pixel art game map screenshot, ONE very wide 3:1 image (native about 960 x 320 px): the whole battlefield "
            "with two different civilizations facing each other.",
            lane_rules(WORLD) + [
                f"Left: the home of the Temple of Light (white marble, gold): monument at {pct(STATUE, WORLD)}, silver "
                f"mine at {pct(SILVER, WORLD)} and gold mine at {pct(GOLD, WORLD)} on the top edge of the lane, build "
                f"plots at {', '.join(pct(x, WORLD) for x in DEPOTS)} on the bottom edge (towers on the first two), wall "
                f"across the lane at {pct(WALL_EXAMPLE, WORLD)}.",
                "Right: the home of the Flame Dragon Sect (black basalt, lava, red lacquer), an exact mirror: monument at "
                f"{pct(WORLD - STATUE, WORLD)}, mines at {pct(WORLD - SILVER, WORLD)} and {pct(WORLD - GOLD, WORLD)}, "
                f"build plots at {', '.join(pct(WORLD - x, WORLD) for x in reversed(DEPOTS))}, wall at "
                f"{pct(WORLD - WALL_EXAMPLE, WORLD)}.",
                f"Middle ({pct(WALL_MAX, WORLD)}–{pct(WORLD - WALL_MAX, WORLD)}): neutral no-man's land of plain dirt and "
                f"broken ground, the diamond mine at exactly 50% on the top edge of the lane (miners of both sides dig it "
                "from its left and right); each faction's ground blends into neutral dirt toward the middle.",
            ],
            ["Swap the two civilizations for any other pair: the layout stays the same.",
             "Relative sizes (a soldier is 36 px native tall): each monument ~5x (the biggest objects), depot tower "
             "~1.6x, wall ~1.5x and as long as the lane is tall, gold mine ~1.6x, silver mine ~1.3x, diamond mine ~2x.",
             "The bands above and below the lane are packed with each faction's own buildings, plants and ground so "
             "each half is recognisable at a glance.",
             "No units: an empty battlefield before the fight."],
        ),
    ),
]

assert len(CIVS) == 12
for c in CIVS:
    assert len(c["decor"].split(", ")) == 8, c["code"]

lines = [
    "# 5. Bản đồ chiến trường theo hệ — góc nghiêng 3/4 (12 hệ × 7 prompt + 2 chung)",
    "",
    "> Sinh tự động bởi `docs/art/prompts/gen_map_prompts.py`. Sửa dữ liệu ở script rồi chạy lại",
    "> `python3 docs/art/prompts/gen_map_prompts.py`, đừng sửa tay file này.",
    "",
    "- **Góc nhìn** lấy từ ảnh tham khảo: nhìn xuống khoảng 60°, mặt đất thẳng với màn hình, vật đứng thấy cả nóc và mặt",
    "  trước (không phải isometric hình thoi). Lính cao khoảng 36 px, ô nền 24 × 24 px.",
    "- **Bố cục theo trận đấu** (`packages/core/src/world.ts`): mỗi phe giữ một nửa đường đánh ngang — tượng nhà sát mép →",
    "  mỏ bạc → mỏ vàng (4 chỗ) → trạm vàng (tối đa 2) và tường chắn ngang đường → bãi giao tranh → mỏ kim cương ở giữa",
    "  bản đồ dùng chung.",
    f"- **Toàn cảnh đặt vật theo toạ độ trận** (thế giới rộng {WORLD} px, phe trái): tượng {STATUE}, mỏ bạc {SILVER},",
    f"  mỏ vàng {GOLD}, ô trạm {' / '.join(map(str, DEPOTS))}, tường xây được {WALL_MIN}–{WALL_MAX}, mỏ kim cương {CENTER}.",
    "  Prompt ghi vị trí theo % chiều ngang ảnh. **Đường đánh rộng ~1/3 chiều cao ảnh (5 ô)** để đứng được 5 lính một",
    "  hàng ngang; mỏ nằm mép trên, ô trạm mép dưới, giữa đường để trống cho lính (chỉ tường chắn ngang).",
    "- **Đặc điểm riêng** của hệ (nội tại trong `factions.ts`) quyết định địa hình, tên và hiệu ứng của trạm / tường, và",
    "  dấu vết trên mặt đất (lửa cháy, băng trơn, hồn bay về tượng…).",
    "- Thứ tự mỗi hệ: **1. Toàn cảnh** trước để chốt màu; prompt 2–7 **đính kèm ảnh toàn cảnh đó**. Lưu ở",
    "  `docs/art/topdown/<hệ>/map/`.",
    "- Xem trước khi dùng: đủ ô, các ô cùng cỡ, ô nền ghép không lộ mép, nền trong suốt thật. Sai thì tạo lại.",
    "",
    "| Hệ | Đặc điểm | Mục |",
    "|---|---|---|",
    "| Dùng chung | mỏ kim cương, toàn cảnh cả trận | [chung](#chung) |",
]
body: list[str] = ["", '<a id="chung"></a>', "", "## Dùng chung", ""]
for name, file, text in COMMON:
    body += [f"**{name}** → lưu thành `{TOP}/{file}`", "", "```", text, "```", ""]
for k, c in enumerate(CIVS, 1):
    title = f"{k}. {c['icon']} {c['vi']} — {c['en']}"
    anchor = f"{k}-{c['code']}"
    lines.append(f"| {title} | {c['trait']} | [{c['code']}](#{anchor}) |")
    body += ["", f'<a id="{anchor}"></a>', "", f"## {title}", "", f"Đặc điểm: *{c['trait']}*.", ""]
    for i, (name, file, text) in enumerate(civ_prompts(c), 1):
        att = "" if i == 1 else f"đính kèm `{TOP}/{c['code']}/map/concept.png`, "
        body += [f"**{i}. {name}** → {att}lưu thành `{TOP}/{c['code']}/map/{file}`", "", "```", text, "```", ""]

OUT.write_text("\n".join(lines + body).rstrip() + "\n", encoding="utf-8")
print(f"{OUT.relative_to(HERE.parents[2])}: 12 hệ × 7 prompt + 2 chung")
