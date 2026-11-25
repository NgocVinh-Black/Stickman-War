"""Sinh docs/art/pixel-prompts.md: 144 prompt bảng 4 mặt pixel art cho sprite stacking.

- Hệ ([B]: màu, tóc, thân), tên tiếng Anh và kiểu vải của lính: docs/art/unit-prompts.md.
- Tỉ lệ (×scale), vũ khí, khiên, thú cưỡi, máy: lấy thẳng từ lõi game qua docs/art/unit-data.mjs (cần Node ≥ 23),
  nên đổi chỉ số / vũ khí trong packages/core thì chỉ cần chạy lại: python3 docs/art/gen_pixel_prompts.py .
- Khung pixel (cao, bề ngang) tính theo ×scale của từng lính; số lát khắc = chiều cao.
- Các lính trong KEEP giữ nguyên prompt đang có trong pixel-prompts.md (đang vẽ dở theo bản cũ).
"""

import json
import re
import subprocess
import sys
from pathlib import Path

repo = Path(sys.argv[1])
src = (repo / "docs/art/unit-prompts.md").read_text(encoding="utf-8")
elem_src = (repo / "docs/art/element-prompts.md").read_text(encoding="utf-8")
game = json.loads(subprocess.check_output(["node", str(repo / "docs/art/unit-data.mjs")], text=True))
GAME = {f["faction"]: f["units"] for f in game}

# Lính giữ nguyên prompt cũ (số thứ tự 1–144): 4 lính đầu hệ Quang đang vẽ dở
KEEP = {1, 2, 3, 4}
old_md = repo / "docs/art/pixel-prompts.md"
OLD = {}
if old_md.exists():
    for blk, num in re.findall(r"(\*\*(\d+)\. .+?\n\n```\n.+?\n```)", old_md.read_text(encoding="utf-8"), re.S):
        OLD[int(num)] = blk

# Chỉ lấy phần lính (trước phần công trình)
src = src.split("### [A-S]")[0]
sections = re.split(r"\n(?=## \d+\. )", src)[1:]

# Tên file theo element-prompts.md (01-miner ... 12-builder)
saved = re.findall(r"lưu thành `docs/art/([a-z]+)/(\d\d)-([a-z]+)\.png`", elem_src)
keys = {}
for code, num, key in saved:
    if int(num) <= 12:
        keys.setdefault(code, {})[int(num)] = key

A = (
    "Chunky pixel art orthographic model sheet for sprite stacking (fake-3D rotatable sprite), rich 3-tone hue-shifted pixel shading "
    "(deep cool-shifted shadows, saturated midtones, bright warm top highlights along edges), solid flat colour clusters. "
    "Four views of the SAME character in one clean 1x4 horizontal row on a fully TRANSPARENT background (PNG with alpha channel: every pixel outside the character is fully transparent, "
    "no background colour, no white, no checkerboard pattern, no frame), generous empty space between views, "
    "in this exact order left to right: "
    "1. TOP view looking straight down at the head and shoulders, the character's front (face side) pointing DOWN. "
    "2. SIDE view, the character facing LEFT. "
    "3. FRONT view. "
    "4. BACK view. "
    "Strictly orthographic: zero perspective, zero tilt, zero 3/4 angle. Identical pixel scale in all four views: the height in SIDE, FRONT and BACK is the same, "
    "the width in TOP equals the width in FRONT and BACK, the length in TOP equals the length in SIDE. Character centred in every view, standing upright on one shared ground line. "
    "Native grid: {size}, every art pixel a crisp square block, then upscaled with nearest neighbour. "
    "Character: stickman with a dark body tinted with the element colour, round head, simple round hands, no face except two sharp slanted glowing eyes "
    "drawn as 2-pixel clusters with a white core pixel. Arms, legs, weapon shafts, bow strings and staffs at least 2-3 pixels thick, never 1-pixel lines. "
    "Medium-length element hair as bold pixel clusters, close to the head: it rises only about a third of the head height above the skull (about 3-4 art pixels), never tall, towering or taller than the head. Cloth (scarf and/or cape) in one single strong colour with stepped ragged pixel edges, hanging close behind the body "
    "with the same shape in all four views. Weapon and magic glow drawn as solid bright pixel clusters with a white-hot core, never soft bloom. "
    "Every element effect (sparks, motes, rays, smoke, petals, droplets, flames) is a solid pixel shape touching the body or weapon, nothing floating loose. "
    "Keep the weapon close to the body so the silhouette stays compact and centred; every gap between limbs, weapon and body opens to the outside of the silhouette, no fully enclosed holes. "
    "Bold 1px dark outline around each view, zero anti-aliasing, zero soft edges, hard alpha edges (each pixel fully opaque or fully transparent)."
)
AVOID = (
    "Avoid: white background, coloured background, checkerboard pattern, fake transparency grid, drop shadow, semi-transparent edges, "
    "perspective, 3/4 view, isometric, labels, text, letters, guide lines, grid lines, shadows on the ground, glow halo, bloom, blur, gradients, anti-aliasing, "
    "1-pixel thin lines, floating particles, painterly, realistic, 3d render, detailed face, mouth, nose, skin, muscles, bulky armour, extra limbs, "
    "multiple cloth colours, background scenery, cropped feet, views with different sizes or poses, watermark."
)

# Khung pixel theo loại lính, tính theo ×scale của game (mốc: lính thường ×1 cao 36 px, rộng 20 px).
# Kỵ binh / máy / khổng lồ lấy mốc riêng (người cưỡi + thú, máy dài, khổng lồ thu gọn để vừa khung) rồi nhân theo tỉ lệ.
def size_of(arch: str, scale: float) -> tuple[str, int]:
    r = lambda v: max(1, round(v))
    if arch == "cavalry":
        k = scale / 1.1
        tall = r(44 * k)
        return (
            f"about {r(22 * k)} px wide x {r(44 * k)} px long footprint (the mount's length runs along the TOP view's vertical axis), "
            f"about {tall} px tall including the rider",
            tall,
        )
    if arch == "catapult":
        k = scale / 1.25
        tall = r(40 * k)
        return f"about {r(28 * k)} px wide x {r(44 * k)} px long footprint, about {tall} px tall", tall
    if arch == "giant":
        k = scale / 2.3
        tall = r(72 * k)
        return f"about {r(36 * k)} x {r(36 * k)} px footprint, about {tall} px tall", tall
    tall = r(36 * scale)
    fp = r(20 * scale)
    return f"about {fp} x {fp} px footprint, about {tall} px tall", tall


# ---------- Mô tả lính ([C]) theo dữ liệu game ----------
# Vũ khí mặc định của từng khung khi hệ không ghi đè (như DEFAULT_WEAPON trong apps/web/src/game/render/stickman.ts)
DEFAULT_WEAPON = {
    "miner": "pick",
    "sword": "sword",
    "archer": "bow",
    "ninja": "dagger",
    "spear": "spear",
    "healer": "staff",
    "mage": "staff",
    "giant": "club",
    "builder": "hammer",
}
WEAPON = {
    "pick": "glowing pickaxe",
    "drill": "glowing hand drill",
    "sword": "glowing straight longsword",
    "cleaver": "glowing huge broad cleaver",
    "saber": "glowing curved saber",
    "katana": "glowing katana",
    "axe": "glowing battle axe",
    "khopesh": "glowing curved sickle-sword (khopesh)",
    "trident": "glowing trident",
    "scythe": "glowing scythe",
    "dagger": "glowing dagger",
    "club": "glowing giant club",
    "hammer": "glowing hammer",
    "halberd": "glowing halberd",
    "naginata": "glowing glaive (long curved blade on a pole)",
    "spear": "glowing spear",
    "staff": "glowing staff",
    "musket": "glowing long musket",
    "bow": "glowing bow",
}
POLEARM = {"spear", "halberd", "naginata", "trident"}
MOUNT = {
    "horse": "a black silhouette horse with glowing eyes",
    "wolf": "a big black silhouette wolf with glowing eyes",
    "elk": "a black silhouette elk with glowing antlers and eyes",
    "boar": "a black silhouette boar with tusks and glowing eyes",
    "bonehorse": "a black skeletal night horse with glowing eyes",
    "lizard": "a black silhouette fire lizard with glowing eyes",
    "bear": "a big black silhouette bear with glowing eyes",
    "shark": "a black silhouette shark with glowing eyes gliding on a solid pixel wave",
}
# Đồ ném của lính ném (weapon 'throw') theo hệ
THROWN = {"wind": "javelin", "blood": "throwing axe", "water": "harpoon javelin"}
# Nhạc cụ của lính cờ / nhạc (game vẽ người cầm cán cờ; nhạc cụ theo tên lính)
INSTRUMENT = {
    "light": "a glowing war drum hung at the hip, one drumstick raised",
    "wind": "a glowing storm war drum hung at the hip, one drumstick raised",
    "wood": "a glowing wooden flute held to the face with both hands",
    "shadow": None,  # Cờ hồn: chỉ có cờ
    "thunder": "a glowing thunder war drum hung at the hip, one drumstick raised",
    "blood": "a curved glowing war horn raised to the face",
    "crystal": "a glowing crystal hand bell raised high",
    "stone": "a glowing stone horn raised to the face",
    "metal": "a glowing brass horn raised to the face",
    "water": "a glowing conch-shell horn raised to the face",
    "fire": "a glowing dragon war drum hung at the hip, one drumstick raised",
    "ice": "a glowing ice horn raised to the face",
}
MACHINE = {
    "catapult": (
        "black silhouette catapult with glowing elemental parts and a glowing element boulder in its cup, one stickman operator",
        "operator pulling the release rope, arm cocked back",
        "TOP view: the throwing end points DOWN.",
    ),
    "ballista": (
        "black silhouette giant ballista (a huge crossbow on a wheeled frame) loaded with a glowing giant bolt, one stickman operator",
        "operator cranking the winch at the back",
        "TOP view: the bolt tip points DOWN.",
    ),
    "ram": (
        "black silhouette battering ram: a wheeled wooden frame with a small roof over a big log with a glowing iron-capped head, "
        "one stickman operator",
        "operator pushing the ram from behind, leaning forward",
        "TOP view: the ram head points DOWN.",
    ),
    "cannon": (
        "black silhouette great cannon on a two-wheeled carriage with glowing elemental bands, one stickman gunner",
        "gunner holding a glowing lit fuse stick beside the breech",
        "TOP view: the muzzle points DOWN.",
    ),
}


def unit_text(code: str, u: dict, name_en: str, cloth: str) -> str:
    """[C] của một lính: loại + tên, cỡ, vải, đồ cầm, tư thế, lưu ý cho sprite stacking — theo dữ liệu game."""
    a, look, sc = u["arch"], u["look"], u["scale"]
    w = look.get("weapon") or DEFAULT_WEAPON.get(a)
    shield = look.get("shield") or ("oval" if a == "spear" and code == "light" else None)
    shield = None if shield == "none" else shield
    shield_txt = f"black {shield} shield with a glowing rim" if shield else ""
    kind, gear, pose, extra, note = "", "", "", "", ""
    if a == "miner":
        kind, gear = "gold miner", WEAPON[w]
        pose = "tool resting on the shoulder in one hand, relaxed"
    elif a == "sword":
        kind, gear = "melee warrior", WEAPON[w]
        pose = (
            "trident held diagonally in both hands, prongs up and forward"
            if w == "trident"
            else "weapon held low and diagonal, ready to charge"
        )
        if shield:
            gear += f", {shield_txt} on the other arm close to the chest"
        if "soldiers" in name_en:
            name_en = name_en.replace("soldiers", "soldier")
            note = "Draw ONE single soldier. "
    elif a == "archer":
        if w == "throw":
            item = THROWN[code]
            kind = "ranged thrower"
            gear = f"a few glowing {item}s strapped on the back, one {item} in the raised throwing hand"
            pose = f"throwing arm cocked back with the {item} beside the head, other hand pointing forward"
            extra = f"Keep the raised {item} close beside the head, its shaft at least 2-3 pixels thick. "
        elif w == "musket":
            kind, gear = "ranged gunner", WEAPON["musket"]
            pose = "musket held diagonally across the chest in both hands, muzzle up"
            extra = "Keep the musket close against the body, barrel 2-3 pixels thick. "
        else:
            kind, gear = "ranged archer", WEAPON["bow"]
            pose = "drawing the bow"
            extra = "Draw the bow upright close in front of the chest, bow and string at least 2 pixels thick. "
    elif a == "ninja":
        if w == "bomb":
            kind, gear, pose = "suicide bomber", "a glowing round bomb with a lit fuse hugged to the chest", "crouched low, about to sprint"
        elif w == "pick":
            kind, gear, pose = "tunneler", WEAPON["pick"], "crouched low with the pickaxe ready, as if about to burrow"
        else:
            kind, gear, pose = "assassin", WEAPON[w], "crouched low, about to dash"
            if w == "scythe":
                pose = "crouched low, scythe held close behind the back, about to dash"
    elif a == "spear":
        kind = "shield tank" if shield else "heavy guard"
        gear = WEAPON[w] + (f", {shield_txt} held in front of the chest" if shield else "")
        pose = "braced guard stance"
        if w in POLEARM:
            extra = f"Hold the {WEAPON[w].removeprefix('glowing ')} angled upward close beside the body, shaft 2-3 pixels thick. "
        else:
            extra = f"Hold the {WEAPON[w].removeprefix('glowing ')} upright at the side, head up, close to the body. "
    elif a == "cavalry":
        m = look.get("mount") or "horse"
        if m == "chariot":
            kind = "chariot driver"
            gear = "standing in a small two-wheeled chariot pulled by a black silhouette horse with glowing eyes, glowing lance"
            pose = "horse running, rider braced in the chariot with the lance forward"
            extra = (
                "TOP view: the horse's head points DOWN with the chariot behind it. SIDE view: facing LEFT. "
                "Horse and chariot on one centre line; horse legs and wheels 3 pixels thick. "
            )
        else:
            kind = "cavalry rider"
            gear = f"riding {MOUNT[m]}, glowing lance"
            pose = "mount running, lance held forward" if m != "shark" else "shark surging forward, lance held forward"
            limbs = "fins and the wave under it at least 3 pixels thick" if m == "shark" else "legs 3 pixels thick"
            extra = (
                "TOP view: the mount's head points DOWN. SIDE view: the mount faces LEFT. Rider sits on the mount's centre line; "
                f"the mount is a dark silhouette with glowing pixel eyes, {limbs}. "
            )
    elif a == "healer":
        kind, gear = "healer", WEAPON[w]
        pose = (
            "hammer raised to tap a glowing rune, other palm open casting heal"
            if w == "hammer"
            else "staff raised, other palm open casting heal"
        )
        if code == "shadow":
            kind = "necromancer (raises the dead, does not heal)"
            pose = "staff raised, other hand beckoning upward to summon a spirit"
    elif a == "banner":
        ins = INSTRUMENT[code]
        kind = "standard bearer (buffs allies)" if ins is None else "war musician (buffs allies)"
        gear = "a flag of the cloth colour on a pole" + (" strapped upright on the back, and " + ins if ins else " held in both hands")
        pose = "holding the flag pole upright, flag hanging" if ins is None else "playing the instrument"
        extra = "The flag is a solid cloth panel at least 3 pixels thick, its pole upright beside or behind the body. "
    elif a == "mage":
        if w == "musket":
            kind = "magma gunner"
            gear = "a glowing short wide flamethrower gun spraying a short solid pixel jet of magma"
            pose = "gun held at the hip in both hands, spraying forward"
        else:
            kind = "battle mage"
            gear = "glowing staff in one hand, the element spell as a solid pixel orb in the other palm"
            pose = "spell hand thrust forward"
    elif a == "catapult":
        m = look.get("machine") or "catapult"
        kind = "siege engine"
        gear, pose, top = MACHINE[m]
        extra = (
            f"{top} The stickman operator stands directly behind the machine on its centre line, not beside it, "
            "so the whole unit stays centred. Machine parts at least 3 pixels thick. "
        )
    elif a == "giant":
        # Vũ khí cỡ khổng lồ (chùy đã ghi sẵn "giant"; bỏ "huge" của đao cho khỏi lặp)
        kind = "giant"
        gear = WEAPON[w] if w == "club" else WEAPON[w].replace("huge ", "").replace("glowing ", "glowing giant ", 1)
        pose = "towering, menacing hunch, weapon resting on the shoulder"
        extra = "Much larger and bulkier stickman, limbs 5-6 pixels thick. "
    elif a == "builder":
        kind, gear, pose = "builder", WEAPON[w], "hammer and materials on the shoulder"
    if a == "giant":
        build = "Towering, much larger and bulkier than a normal stickman. "
    elif a in ("cavalry", "catapult"):
        build = ""
    elif sc < 0.999:
        build = ("Small and lean, " if sc <= 0.86 else "Slightly smaller and leaner, ") + f"about {round(sc * 100)}% of a normal stickman. "
    elif sc > 1.001:
        build = f"Slightly bigger and sturdier, about {round(sc * 100)}% of a normal stickman. "
    else:
        build = ""
    text = f'Unit: {kind} "{name_en}". {note}{build}Cloth: {cloth}. Gear: {gear}. Pose: {pose}.'
    return text + (" For sprite stacking: " + extra if extra else "")


# ---------- Animation đứng yên (idle) ----------
# Ảnh gộp 3 hàng (SIDE quay trái / FRONT / BACK) x 4 khung lặp, đính kèm bảng 4 mặt của chính lính đó làm mẫu.
# build_topdown_sprite.py đọc dạng gộp này qua rig "anim": {"idle": {"sheet", "order", "frames", "fps"}}.
IDLE_A = (
    "Pixel art sprite sheet: a looping 4-frame IDLE (standing still, breathing) animation of the SAME unit as in the attached "
    "4-view model sheet (same colours, hair, cloth, gear and pixel scale). Three rows, one view per row, top to bottom: "
    "row 1 SIDE view facing LEFT, row 2 FRONT view, row 3 BACK view (no face visible). Four frames per row, left to right in "
    "time order, the loop returning seamlessly from frame 4 to frame 1. Fully TRANSPARENT background (PNG alpha: no background "
    "colour, no white, no checkerboard pattern), generous equal empty space between all frames and rows (no frame touching "
    "another), every frame the same canvas size, the feet on one shared ground line at the same spot in every frame of a row. "
    "Strictly orthographic, zero perspective, zero 3/4 angle. Native grid: {size}, every art pixel a crisp square block, upscaled "
    "with nearest neighbour, bold 1px dark outline, zero anti-aliasing, hard alpha edges. Subtle motion only: the body and head "
    "rise and fall by 1 pixel with the breath, hair and cloth sway 1-2 pixels, glowing parts pulse slightly brighter and back; "
    "feet never move and the silhouette stays the same size. Frames: 1. neutral. 2. inhale: chest and head 1 px up, cloth lifting. "
    "3. neutral, {beat}. 4. exhale: chest and head 1 px down, cloth settling."
)
IDLE_AVOID = (
    "Avoid: white background, coloured background, checkerboard pattern, fake transparency grid, ground shadow, motion blur, "
    "speed lines, walking, attacking, big pose changes, the unit changing size, frames of different sizes, perspective, 3/4 view, "
    "the side view facing right, 1-pixel thin lines, anti-aliasing, glow halo, bloom, blur, gradients, floating particles, labels, "
    "text, frame numbers, borders, watermark."
)
# Tư thế đứng nghỉ + chuyển động phụ ở khung 3 theo loại lính (tư thế đánh của bảng 4 mặt đổi sang tư thế nghỉ)
IDLE_POSE = {
    "miner": ("tool resting on the shoulder in one hand, relaxed", "the free hand wipes the brow then drops back"),
    "sword": ("weapon held low and diagonal in a relaxed guard", "the weapon tip glints and dips 1 px"),
    "archer": ("ranged weapon lowered at the side, not aiming", "the free hand taps the quiver or the weapon once"),
    "ninja": ("crouched low, weapon ready close to the body", "a light bounce on the toes, scarf tails flicking"),
    "spear": ("braced guard stance, weapon upright close to the body", "the weapon head sways 1 px, the shield or guard steady"),
    "cavalry": (
        "the mount standing still on all legs, rider sitting upright with the weapon held up",
        "the mount shifts one front hoof, nods its head and swishes its tail",
    ),
    "healer": ("staff planted on the ground, the other palm open and glowing", "the healing glow in the palm pulses brighter"),
    "banner": ("holding the flag pole upright, instrument resting", "the flag ripples in the wind"),
    "mage": ("staff upright, the spell orb hovering above the open palm", "the spell orb pulses brighter and rises 1 px"),
    "catapult": (
        "the machine standing still and loaded, the operator standing behind it at ease",
        "the operator shifts weight and checks the rope, the machine does not move",
    ),
    "giant": ("towering hunch, weapon resting on the shoulder", "a heavy deep breath, shoulders rising 2 px"),
    "builder": ("hammer and materials on the shoulder", "the hammer taps lightly into the free palm"),
}


def idle_text(arch: str, size: str, look: str) -> str:
    """Prompt animation đứng yên của một lính: dùng chung phần ngoại hình [B] + [C] của bảng 4 mặt, đổi tư thế sang nghỉ."""
    pose, beat = IDLE_POSE[arch]
    look = re.sub(r"Pose: [^.]*\.", f"Pose: {pose}.", look, count=1)
    look = look.split(" For sprite stacking:")[0]
    return re.sub(r"\s+", " ", IDLE_A.format(size=size, beat=beat) + " " + look + " " + IDLE_AVOID).strip()


WATER = "Render the water body, hair and ribbons as opaque pixel colours (cool deep blue shadow, aqua mid, white highlight), not see-through. "

HAIR = {
    "light": "Head: short-to-medium golden spiky hair with a glowing tip, flicking up a little like small flames.",
    "wind": "Head: medium silver-white spiky hair swept back by the wind, lying close to the head.",
    "wood": "Head: a low crown of dark green leaves in short spikes with glowing veins.",
    "shadow": "Head: medium purple-black messy hair with short wisps of smoke at the tips.",
    "thunder": "Head: medium dark navy zig-zag spiky hair shaped like small lightning bolts with a bright yellow outline.",
    "blood": "Head: medium messy black-red spiky hair swept back, close to the head.",
    "crystal": "Head: medium spiky deep purple hair with a few small crystal shards.",
    "stone": "Head: short angular grey stone spikes like rock hair, with a glowing amber crack.",
    "metal": "Head: medium spiky silver steel-blade hair with a gold glow, swept back close to the head.",
    "water": "Head: medium-length water hair curling in small waves around the head and nape, with a few glowing droplets.",
    "fire": "Head: medium hair of orange flames with bright yellow tips, flickering just above the head.",
    "ice": "Head: medium spiky light-blue ice-crystal hair with white glints, close to the head.",
}
HAIR_NOTE = " Hair stays medium height, about a third of the head height above the skull, never tall."

out = ["# Prompt pixel art 4 mặt cho sprite stacking — 144 lính (12 hệ × 12 lính)", ""]
out += [
    "Bản chuyển từ `docs/art/unit-prompts.md` sang **bảng 4 mặt pixel art** theo skill",
    "[sprite-stacking](https://github.com/danielwh2/sprite-stacking): ảnh ra là một hàng **TOP, SIDE, FRONT, BACK** trên nền trong suốt,",
    "đưa thẳng vào `views_to_slices.py` (không cần tách nền) để khắc thành dải lát (slice strip) rồi render giả 3D xoay được.",
    "",
    "- **Tỉ lệ, vũ khí, khiên, thú cưỡi, máy** lấy thẳng từ lõi game (`packages/core`, qua `docs/art/unit-data.mjs`): đổi trong game thì chạy lại",
    "  `python3 docs/art/gen_pixel_prompts.py .` (cần Node ≥ 23). Màu / tóc hệ, tên tiếng Anh, kiểu vải lấy ở `unit-prompts.md`.",
    "- **Khung pixel theo ×scale từng lính** (lính thường ×1 = cao 36 px; kỵ binh, máy, khổng lồ có mốc riêng); số lát khắc = chiều cao.",
    "- Lính 1–4 (Quang: thợ mỏ, kiếm sĩ, cung thủ, thích khách) giữ nguyên prompt bản trước vì đang vẽ dở.",
    "",
    "## Khác gì so với prompt cũ",
    "",
    "| Prompt cũ (turnaround anime) | Prompt pixel 4 mặt | Vì sao |",
    "|---|---|---|",
    "| 3 góc FRONT / TOP-DOWN / RIGHT SIDE | 4 góc **TOP, SIDE, FRONT, BACK**, 1 hàng | Slicer cần đủ 4 hình chiếu, đúng thứ tự |",
    "| Nền xám có chữ nhãn + đường kẻ ngang | **Nền trong suốt** (PNG alpha), không chữ, không đường kẻ | Khỏi bước tách nền; chữ / đường kẻ bị khắc thành khối rác |",
    "| SIDE quay phải | **SIDE quay trái**, TOP mặt quay **xuống** | Quy ước của slicer |",
    "| Glow, bloom mềm, bụi sáng bay quanh | Phát sáng = cụm pixel đặc, hiệu ứng **dính vào thân / vũ khí** | Viền mềm bị nhoè khi xoay, hạt rời khắc ra rác |",
    "| Tóc dựng to, cao | Tóc **vừa phải**, cao khoảng 1/3 đầu, ôm sát đầu | Tóc cao làm nhân vật mất cân đối, khi khắc ra thành cột lát mỏng |",
    "| Tay chân, dây cung mảnh | Tối thiểu **2-3 px** | Phần 1 px nhấp nháy khi xoay |",
    "| Áo choàng bay ngang, vũ khí chĩa xa | Áo choàng ôm sau lưng, vũ khí sát thân | Khối lồi ra làm stack quay lệch tâm |",
    "| Thủy: thân nước trong suốt | Màu đặc, không trong suốt | Phần bán trong suốt bị khoét thủng khi khắc |",
    "",
    "## Cách dùng",
    "",
    "1. Copy prompt, **không cần** đính kèm ảnh mẫu (nếu đính kèm thì chỉ để lấy màu / kiểu tóc, không lấy góc nhìn).",
    "2. Lưu ảnh vào `docs/art/pixel/<mã hệ>/NN-<loại>-views.png` (tên ghi cạnh từng prompt).",
    "3. Xem ảnh trước khi khắc: đúng 4 hình, **nền trong suốt thật** (không phải ô caro vẽ giả), TOP mặt quay xuống, SIDE quay trái, cùng chiều cao, nét pixel sắc. Sai thì tạo lại, đừng cố cứu.",
    "   - Công cụ nào không xuất được nền trong suốt sẽ hay **vẽ ô caro xám-trắng giả** vào ảnh: ô caro đó slicer không tách được, phải tạo lại. ChatGPT (tạo ảnh) xuất PNG trong suốt thật; nếu công cụ vẫn ra nền trắng phẳng thì slicer vẫn tự tách được.",
    "4. Khắc (lệnh ghi cạnh từng prompt), mở `check.png` xem ngay:",
    "",
    "```bash",
    "S=.claude/skills/sprite-stacking/scripts   # skill nằm sẵn trong repo",
    "uv run --with numpy --with pillow python3 $S/views_to_slices.py docs/art/pixel/light/02-sword-views.png docs/art/pixel/light/02-sword-slices.png \\",
    "  --slices 36 --top-nose down --emissive docs/art/pixel/light/02-sword-glow.png \\",
    "  --preview docs/art/pixel/light/02-sword-check.png --html docs/art/pixel/light/02-sword.html",
    "```",
    "",
    "- `--top-nose down` luôn bật vì lính không phải xe (auto sẽ lật ngược).",
    "- `--emissive` tách mặt nạ phần phát sáng (mắt, vũ khí) để renderer cộng glow lúc chạy thay vì vẽ cứng vào ảnh.",
    "- Ảnh quá to (AI hay xuất 1024 px+) vẫn khắc được: `--slices` quyết định độ chi tiết, không phải độ phân giải file.",
    "- Lính đổi tư thế (đánh, chạy) cần thêm bảng 4 mặt cho từng frame, cùng kích thước và cùng số lát (xem Lessons của skill).",
    "",
    "**Animation đứng yên:** dưới mỗi lính có thêm prompt *Đứng yên* — một ảnh 3 hàng (ngang quay trái / trước / sau) × 4 khung",
    "thở lặp lại (thân nhún 1 px, tóc và vải lay, chỗ phát sáng nhịp sáng, chuyển động phụ riêng từng loại lính: thú cưỡi gõ móng",
    "vẫy đuôi, cờ bay, quả cầu phép nhịp sáng…). Đính kèm bảng 4 mặt của chính lính đó làm mẫu. Demo thế giới đọc ảnh gộp này qua",
    "rig `anim.idle` (`sheet` + `order`) trong `docs/art/topdown/rigs.json`.",
    "",
    "| Hệ | Số | Thư mục |",
    "|---|---|---|",
]

body = []
n = 0
for sec in sections:
    title = sec.splitlines()[0][3:].strip()
    code = re.search(r"docs/art/demo/([a-z]+)\.png", sec).group(1)
    b = re.search(r"\[B\] (.+?)\n```", sec, re.S).group(1).replace("\n", " ")
    b = b.replace(" Match the attached element reference image.", "")
    b += " (Colours and hair/body motif only; draw every effect as solid attached pixel clusters.)"
    b = re.sub(r"Head: [^.]*\.", HAIR[code] + HAIR_NOTE, b, count=1)
    b = b.replace("faint translucent wind wings behind the back", "small solid pale-cyan pixel wind wings attached to the back")
    if code == "water":
        b = b.replace("translucent ", "") + " " + WATER.strip()
    units = re.findall(r"\*\*(.+?)\*\* \(×([\d.]+)\)[^\n]*\n(?:- [^\n]*\n)*```\n\[C\] (.+?)\n```", sec)
    assert len(units) == 12, (code, len(units))
    out.append(f"| {title} | {n + 1}–{n + 12} | `docs/art/pixel/{code}/` |")
    body += ["", f"## {title}", ""]
    for i, ((_, _, c), u) in enumerate(zip(units, GAME[code]), 1):
        n += 1
        key = keys[code][i]
        assert key == u["arch"], (code, i, key, u["arch"])
        name_en = re.search(r'Unit: [^"]*"([^"]+)"', c).group(1)
        cloth = re.search(r"Cloth: ([^.]+)\.", c).group(1)
        size, slices = size_of(key, u["scale"])
        look = "Element: " + b.removeprefix("Element: ") + " " + unit_text(code, u, name_en, cloth)
        base = f"docs/art/pixel/{code}/{i:02d}-{key}"
        idle = [
            f"*Đứng yên — {u['name']}* → đính kèm `{base}-views.png`, lưu thành `{base}-idle.png` (3 hàng × 4 khung)",
            "",
            "```",
            idle_text(key, size, look),
            "```",
            "",
        ]
        if n in KEEP and n in OLD:
            body += [OLD[n], ""] + idle
            continue
        prompt = A.format(size=size) + " " + look + " " + AVOID
        prompt = re.sub(r"\s+", " ", prompt).strip()
        body += [
            f"**{n}. {u['name']}** (×{u['scale']:g}) → lưu thành `{base}-views.png` · khắc `--slices {slices} --top-nose down`",
            "",
            "```",
            prompt,
            "```",
            "",
        ] + idle

assert n == 144, n
(repo / "docs/art/pixel-prompts.md").write_text("\n".join(out + body).rstrip() + "\n", encoding="utf-8")
print("wrote", n)
