"""Sinh 4 file prompt pixel art (144 lính = 12 nền văn minh × 12 loại, và bản đồ), gom chung thư mục docs/art/prompts/:

  1-dung-yen.md    mỗi lính 1 ảnh lưới 4×4: hàng 1 bảng 4 mặt (TOP, SIDE, FRONT, BACK), hàng 2-4 đứng yên 4 khung
  2-di-chuyen.md   animation đi / chạy (thú cưỡi phi, máy lăn bánh), dáng đi riêng từng hệ
  3-tan-cong.md    đòn đánh thường + đòn kỹ năng riêng (chí mạng / cường hoá / hào quang / gọi quân…) theo đúng kỹ năng
                   của lính trong packages/core/src/skills.ts, hiệu ứng theo hệ
  4-ban-do.md      mỏ vàng, túi vàng, hình nộm, mặt đất, cây, nhà, đồ vật + trạm / tường / tượng riêng từng hệ

Ảnh tạo ra lưu theo hệ ở docs/art/topdown/<hệ>/ (cạnh rigs.json của hệ đó), tên ghi cạnh từng prompt.

Nguồn:
- Màu / tóc / thân của hệ ([B]), tên tiếng Anh và kiểu vải của lính: docs/art/unit-prompts.md.
- Tỉ lệ (×scale), vũ khí, khiên, thú cưỡi, máy, kỹ năng: lấy thẳng từ lõi game qua unit-data.mjs (cần Node ≥ 23).
- Đặc điểm riêng từng lính (túi vàng, dáng tinh linh / người cây / thuỷ quái…): bảng TRAITS bên dưới.
- Công trình từng hệ (trạm, tường, tượng): phần chủ đề trong docs/art/element-prompts.md.
Đổi chỉ số / vũ khí / kỹ năng trong packages/core thì chạy lại:  python3 docs/art/prompts/gen_prompts.py
"""

import json
import re
import subprocess
from pathlib import Path

HERE = Path(__file__).resolve().parent
repo = HERE.parents[2]
src = (repo / "docs/art/unit-prompts.md").read_text(encoding="utf-8")
elem_src = (repo / "docs/art/element-prompts.md").read_text(encoding="utf-8")
game = json.loads(subprocess.check_output(["node", str(HERE / "unit-data.mjs")], text=True))
GAME = {f["faction"]: f["units"] for f in game}

# Tên file sprite trong demo thế giới (public/art/topdown/<hệ>/<tên>.png) khác tên loại lính ở vài chỗ
SPRITE = {"sword": "warrior", "ninja": "assassin", "spear": "spearton", "banner": "drummer"}

# Chỉ lấy phần lính (trước phần công trình)
src = src.split("### [A-S]")[0]
sections = re.split(r"\n(?=## \d+\. )", src)[1:]

# Tên file theo element-prompts.md (01-miner ... 12-builder)
saved = re.findall(r"lưu thành `docs/art/([a-z]+)/(\d\d)-([a-z]+)\.png`", elem_src)
keys = {}
for code, num, key in saved:
    if int(num) <= 12:
        keys.setdefault(code, {})[int(num)] = key

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


# ---------- Đứng yên (hàng 2-4 của ảnh lưới 4×4) ----------
# build_topdown_sprite.py tự tách hàng 2-4 thành anim.idle (ngang / trước / sau × 4 khung).
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



# ---------- Ngoại hình từng hệ (kiểu chibi như ảnh hệ Quang đã duyệt) ----------
# Viết riêng cho pixel art: không hạt bay, không trong suốt, mọi hiệu ứng là khối pixel đặc dính vào thân / vũ khí.
LOOK = {
    "light": {
        "civ": "Light (Temple of Light)",
        "hair": "big spiky glowing golden hair with a bright white four-pointed star in it",
        "body": "solid black body with thin glowing golden crack lines on the limbs",
        "eyes": "golden",
        "cloth": "rich gold (#e8a91c)",
        "glow": "radiant gold (#ffd84a)",
    },
    "wind": {
        "civ": "Wind (Gale Horde)",
        "hair": "silver-white spiky hair swept back by the wind",
        "body": "dark navy body, white bandage wraps on the forearms, a white waist sash, two small solid pale-cyan wind wings on the back",
        "eyes": "pale icy cyan",
        "cloth": "sky blue (#2f8fc4)",
        "glow": "pale icy cyan (#a8ecff)",
    },
    "wood": {
        "civ": "Wood (Verdant Grove)",
        "hair": "a crown of dark green leaf spikes with glowing lime veins",
        "body": "very dark green bark-textured body with small leaf spikes on the shoulders, elbows and knees",
        "eyes": "bright leaf green",
        "cloth": "deep forest green (#1f6b26), leafy",
        "glow": "bright leaf green (#7dff6a)",
    },
    "shadow": {
        "civ": "Shadow (Shadow Cult)",
        "hair": "wild purple-black hair whose tips break into solid smoke wisps",
        "body": "black body with a violet tint, the cloth edges breaking into solid smoke wisps",
        "eyes": "ghostly violet",
        "cloth": "deep violet (#3d1a66)",
        "glow": "ghostly violet (#b77bff)",
    },
    "thunder": {
        "civ": "Lightning (Thunder Blade Hall)",
        "hair": "dark navy zig-zag spiky hair shaped like lightning bolts with a bright yellow outline",
        "body": "black body with a yellow rim light and a glowing yellow lightning-bolt emblem on the chest",
        "eyes": "lightning yellow",
        "cloth": "deep blue (#1d4fa0) with a yellow stripe",
        "glow": "lightning yellow (#ffe94a) with small electric-blue (#8fe3ff) sparks touching the weapon",
    },
    "blood": {
        "civ": "Blood (Blood Moon Cult)",
        "hair": "messy black-red spiky hair swept back",
        "body": "very dark red-black body with glowing red vein cracks, blood-red glowing fists",
        "eyes": "vivid red",
        "cloth": "blood red (#9c0f1c)",
        "glow": "vivid red (#ff2d3c)",
    },
    "crystal": {
        "civ": "Crystal (Crystal Vale)",
        "hair": "spiky deep purple hair with a few small crystal shards",
        "body": "dark indigo body with sharp violet crystal shards on the shoulders, forearms and shins",
        "eyes": "cyan (#7fe8ff)",
        "cloth": "purple (#5a28a8)",
        "glow": "crystal violet (#b98cff)",
    },
    "stone": {
        "civ": "Stone (Stone Bastion)",
        "hair": "angular grey stone spikes like rock hair with a glowing amber crack",
        "body": "charcoal rock-plated body with glowing amber cracks",
        "eyes": "amber",
        "cloth": "olive brown (#8a7442)",
        "glow": "amber (#ffb43a)",
    },
    "metal": {
        "civ": "Metal (Iron Forge Sect)",
        "hair": "spiky silver steel-blade hair with a gold glow",
        "body": "black body with sleek silver armour plates with gold trim on the chest, shoulders, forearms and shins",
        "eyes": "gold",
        "cloth": "dark crimson (#9e1c22)",
        "glow": "gold (#ffd34a)",
    },
    "water": {
        "civ": "Water (Tidal Moon Court)",
        "hair": "water hair curling in small waves with a few glowing droplets attached",
        "body": "opaque water body in deep blue with aqua mid-tones and white highlights (solid colours, not see-through)",
        "eyes": "aqua",
        "cloth": "aqua (#3aa6e6) water ribbons, opaque",
        "glow": "aqua blue (#6fe0ff)",
    },
    "fire": {
        "civ": "Fire (Flame Dragon Sect)",
        "hair": "hair of orange flames with bright yellow tips",
        "body": "black body with an orange ember rim and small solid flames on the fists",
        "eyes": "fire orange",
        "cloth": "flame red-orange (#e0401c), its edge turning into solid flame shapes",
        "glow": "fire orange (#ff7a1a)",
    },
    "ice": {
        "civ": "Ice (Frost Palace)",
        "hair": "spiky light-blue ice-crystal hair with white glints",
        "body": "dark blue-black body armoured with jagged glowing ice crystals on the chest, shoulders, forearms and shins",
        "eyes": "icy white-blue",
        "cloth": "deep ice blue (#2b67b8)",
        "glow": "icy white-blue (#bfeaff)",
    },
}

# ---------- Đặc điểm riêng từng lính (theo tên + mô tả trong game) ----------
# add: thêm vào thân; gear: thay đồ cầm; gname: tên đồ dùng khi tả đòn; form: dáng không phải người que;
# head: thay đầu; hover: bay / lơ lửng (không bước chân)
SACK = "a small brown cloth gold sack with a golden drawstring on a strap at the hip, gold nuggets peeking out"
ARCH_ADD = {
    "miner": SACK,
    "builder": "a tool belt at the waist",
}
TRAITS = {
    # Quang
    "light.miner": {},
    "light.sword": {"add": "a small golden sun emblem on the chest"},
    "light.archer": {"add": "a quiver of glowing golden arrows on the back"},
    "light.ninja": {"add": "a short golden hood-scarf over the lower face", "gear": "a glowing golden dagger in each hand"},
    "light.spear": {"add": "light golden armour plates", "gear": "glowing spear and a big oval black shield with a golden sun emblem and glowing rim"},
    "light.cavalry": {"gear": "riding a WHITE horse with golden armour trim, golden hooves and glowing golden eyes, glowing golden lance", "gname": "lance"},
    "light.healer": {"add": "a long white-and-gold priest robe", "gear": "glowing staff topped with a golden sun ring"},
    "light.banner": {"gear": "a glowing golden war drum with a sun emblem hung at the hip, one drumstick, a small golden flag on a pole strapped on the back"},
    "light.mage": {"gear": "glowing staff topped with a sun ring, a glowing light orb above the other palm"},
    "light.catapult": {"add": "golden trim on the machine, a glowing holy boulder with a star in its cup"},
    "light.giant": {"add": "golden armour plates on the shoulders and chest, a holy guardian", "gear": "a giant glowing golden mace", "gname": "mace"},
    "light.builder": {"add": "a golden work apron, a white temple stone block strapped on the back"},
    # Phong
    "wind.miner": {"add": "very small and quick, aviator goggles pushed up on the forehead"},
    "wind.sword": {"add": "a huge broad cleaver almost as big as the body"},
    "wind.archer": {},
    "wind.ninja": {"add": "a tight scarf wrapped over the mouth, a wild swirl of wind around the feet"},
    "wind.spear": {"add": "desert cloth wraps over the mouth and arms (sandstorm guard)", "gear": "glowing spear and a big square sand-coloured shield"},
    "wind.cavalry": {"gear": "riding a big grey-blue wind wolf with glowing eyes and wind-swept fur, glowing lance", "gname": "lance"},
    "wind.healer": {"gear": "glowing staff topped with a small spinning windmill"},
    "wind.banner": {"gear": "a glowing storm war drum with a spiral cloud emblem hung at the hip, one drumstick, a small sky-blue flag on the back"},
    "wind.mage": {"gear": "glowing staff with a small solid storm cloud crackling at its tip, a lightning orb in the other palm"},
    "wind.catapult": {"add": "the boulder in the cup wrapped in a small solid whirlwind"},
    "wind.giant": {"add": "a storm giant with a solid swirling cloud belt around the waist", "gear": "a giant glowing club"},
    "wind.builder": {"add": "a small pinwheel windmill strapped on the back"},
    # Mộc
    "wood.miner": {"form": "a tiny forest sprite (not a stickman): a round glowing seed-shaped body, two small leaf wings, tiny arms, hovering 2 px above the ground", "hover": True},
    "wood.sword": {"add": "a graceful sword dancer with leaf ribbons tied on the arms", "gear": "a glowing curved leaf-shaped saber"},
    "wood.archer": {"gear": "a very long glowing longbow made of a living branch with leaves, a quiver of thorn arrows"},
    "wood.ninja": {"add": "a leafy hunter's hood", "gear": "a glowing dagger whose tip drips solid green poison droplets"},
    "wood.spear": {"form": "a Treant: a walking tree person with a bark body, small branches and leaves growing from the head and shoulders, root-like feet", "gear": "a heavy glowing wooden club, no shield", "gname": "club"},
    "wood.cavalry": {"gear": "riding a dark elk with big glowing antlers that it lowers to gore, glowing lance", "gname": "lance"},
    "wood.healer": {"gear": "glowing staff topped with a blooming flower"},
    "wood.banner": {"gear": "a glowing wooden flute held to the face, a small leaf-green flag on the back"},
    "wood.mage": {"gear": "glowing staff with a swirl of solid leaves around its tip"},
    "wood.catapult": {"add": "a ballista made of living branches loaded with a giant root-tipped bolt"},
    "wood.giant": {"form": "an Ancient tree: a huge walking tree with a bark face and two glowing eyes in the bark, thick branch arms, roots for feet, moss on the shoulders", "gear": "its thick branch arms (no weapon)", "gname": "branch arms", "head": "a crown of leafy branches; two glowing bright leaf-green eyes in the bark face"},
    "wood.builder": {"add": "a small leaf hat, a seed pouch and a young sapling strapped on the back"},
    # Ám
    "shadow.miner": {"add": "thin and ragged, a torn hood"},
    "shadow.sword": {"add": "a simple shadow soldier, the feet dissolving into solid smoke (draw ONE soldier)"},
    "shadow.archer": {"gear": "a simple black bow, arrows with violet smoke tips"},
    "shadow.ninja": {"form": "a hooded Wraith whose body fades below the waist into a solid smoke tail (no legs), floating 2 px above the ground", "gear": "a big glowing scythe", "hover": True},
    "shadow.spear": {"add": "dark plate armour and a horned helmet (night knight)", "gear": "a glowing halberd, no shield"},
    "shadow.cavalry": {"head": "NO head: a violet ghost flame burns above the neck (headless knight)", "gear": "riding a black skeletal night horse with glowing eye sockets, glowing lance", "gname": "lance"},
    "shadow.healer": {"add": "a hooded necromancer robe", "gear": "glowing staff topped with a small skull"},
    "shadow.banner": {"gear": "a tattered ghost flag with a skull emblem held upright in both hands"},
    "shadow.mage": {"gear": "glowing staff, a small solid swirling poison cloud above the other palm"},
    "shadow.catapult": {"add": "a dark smoke orb with a violet skull glow in the cup"},
    "shadow.giant": {"form": "an Evil spirit giant: a huge horned brute whose lower body trails into solid black smoke", "gear": "a giant glowing cleaver", "gname": "cleaver"},
    "shadow.builder": {"add": "a small gravestone and a shovel strapped on the back"},
    # Lôi
    "thunder.miner": {"add": "a small lightning rod sticking up from a hard hat"},
    "thunder.sword": {"add": "a katana sheath at the hip (quick-draw swordsman)"},
    "thunder.archer": {"gear": "a tall glowing longbow, a quiver of lightning arrows"},
    "thunder.ninja": {"add": "a masked shadow ninja with lightning afterimage sparks on the heels"},
    "thunder.spear": {"add": "light samurai armour", "gear": "a glowing long naginata (curved blade on a pole), no shield"},
    "thunder.cavalry": {"gear": "riding a black horse with a crackling lightning mane, a glowing lightning-bolt shaped lance", "gname": "lance"},
    "thunder.healer": {"add": "a monk robe", "gear": "glowing staff topped with a crackling tesla ring"},
    "thunder.banner": {"gear": "a glowing thunder war drum hung at the hip, one drumstick, a small blue flag on the back"},
    "thunder.mage": {"gear": "glowing paper talisman charms crackling with lightning in one hand, staff in the other"},
    "thunder.catapult": {"add": "a crackling thunder orb in the cup"},
    "thunder.giant": {"form": "a horned Thunder god giant with a ring of small drums on the back", "gear": "a giant glowing thunder mace", "gname": "mace"},
    "thunder.builder": {"add": "a lightning rod pole strapped on the back"},
    # Huyết
    "blood.miner": {"add": "a blood slave with broken shackle cuffs and chain links on the wrists, ragged"},
    "blood.sword": {},
    "blood.archer": {},
    "blood.ninja": {"add": "a wild berserker with glowing red veins", "gear": "a glowing axe in each hand", "gname": "axes"},
    "blood.spear": {"add": "a FEMALE shield maiden with a long braid", "gear": "glowing spear and a big round black shield with a blood-red rim"},
    "blood.cavalry": {"gear": "riding a lean dark-red blood wolf with glowing red eyes, glowing lance", "gname": "lance"},
    "blood.healer": {"add": "a FEMALE prophet in a hooded robe", "gear": "glowing staff topped with a red crescent moon"},
    "blood.banner": {"gear": "a curved glowing war horn raised to the face, a small blood-red flag on the back"},
    "blood.mage": {"gear": "a glowing blood rune sigil on the open palm, staff in the other hand"},
    "blood.catapult": {"add": "a battering ram with a horned skull-shaped iron head"},
    "blood.giant": {"form": "a Blood demon giant with curved horns and bone spikes on the shoulders", "gear": "a giant glowing bone club", "gname": "club"},
    "blood.builder": {"add": "a woodcutter with a log on the shoulder", "gear": "glowing hammer-axe"},
    # Tinh thể
    "crystal.miner": {"add": "the gold sack bulging with gems", "gear": "a glowing crystal-tipped pickaxe"},
    "crystal.sword": {"gear": "a glowing curved crystal sickle-sword (khopesh) with a hook to catch shields"},
    "crystal.archer": {"gear": "a glowing crystal bow, prism arrows"},
    "crystal.ninja": {"add": "crystal shards on the hood"},
    "crystal.spear": {"gear": "a glowing halberd with a crystal blade, no shield"},
    "crystal.cavalry": {"gear": "standing in a small crystal chariot with diamond-spiked wheels, pulled by a black horse with glowing eyes, glowing lance", "gname": "lance"},
    "crystal.healer": {"gear": "glowing staff topped with a big crystal"},
    "crystal.banner": {"gear": "a glowing crystal hand bell raised high, a small purple flag on the back"},
    "crystal.mage": {"gear": "glowing staff, a glowing prism crystal orb above the other palm"},
    "crystal.catapult": {"add": "a big crystal cluster in the cup"},
    "crystal.giant": {"form": "a Crystal colossus: a huge body built from big violet crystal chunks", "gear": "a giant glowing crystal club"},
    "crystal.builder": {"add": "a gem cutter with a jeweller's loupe over one eye and a chisel at the belt"},
    # Thạch
    "stone.miner": {"gear": "a glowing hand drill with a spiral bit", "gname": "drill"},
    "stone.sword": {"add": "stone armour plates", "gear": "a glowing stone saber"},
    "stone.archer": {"gear": "a glowing long stone musket with a stone-bullet pouch at the hip"},
    "stone.ninja": {"gear": "a glowing dagger and a stone grappling hook on a chain at the belt"},
    "stone.spear": {"add": "the thickest stone armour", "gear": "glowing spear and a huge square stone tower shield"},
    "stone.cavalry": {"gear": "riding a big stone-plated boar with tusks and glowing eyes, glowing lance", "gname": "lance"},
    "stone.healer": {"add": "body covered in solid stone plates (mason healer)", "gear": "a glowing mason hammer"},
    "stone.banner": {"add": "body covered in stone plates", "gear": "a glowing stone horn raised to the face, a small olive flag on the back"},
    "stone.mage": {"gear": "a short wide lava sprayer gun with a solid pilot flame"},
    "stone.catapult": {"add": "a heavy stone catapult with a big rock in the cup"},
    "stone.giant": {"form": "a Stone golem: a huge golem built from stacked boulders with glowing amber cracks", "gear": "a giant glowing stone hammer", "gname": "stone hammer"},
    "stone.builder": {"add": "a stone carver with a chisel at the belt and a stone block on the back"},
    # Kim
    "metal.miner": {"add": "an iron helmet with a small glowing head lamp"},
    "metal.sword": {"gear": "a glowing steel battle axe and a round black iron shield with a gold rim"},
    "metal.archer": {"gear": "a glowing long iron musket (hand cannon) with a powder horn at the hip"},
    "metal.ninja": {"add": "a tunneler with goggles and a dirty face scarf", "gear": "a glowing pickaxe"},
    "metal.spear": {"add": "the thickest iron armour", "gear": "a glowing war hammer and a huge square iron shield"},
    "metal.cavalry": {"gear": "riding a steel warhorse covered in riveted iron barding, glowing lance", "gname": "lance"},
    "metal.healer": {"add": "a rune smith with a leather apron", "gear": "a glowing smith hammer that taps glowing runes"},
    "metal.banner": {"gear": "a glowing brass horn raised to the face, a small crimson flag on the back"},
    "metal.mage": {"gear": "glowing staff, a glowing fire rune seal on the open palm"},
    "metal.catapult": {"add": "a great iron cannon with gold bands"},
    "metal.giant": {"form": "a Steel giant: a huge riveted steel-plated giant", "gear": "a giant glowing war hammer", "gname": "war hammer"},
    "metal.builder": {"add": "a small anvil strapped on the back"},
    # Thủy
    "water.miner": {"add": "a pearl diver with round diving goggles and a snorkel; the sack is a net bag of pearls and gold"},
    "water.sword": {},
    "water.archer": {},
    "water.ninja": {"add": "small fins on the forearms", "gear": "a glowing dagger dripping solid poison droplets"},
    "water.spear": {"add": "a turtle shell on the back", "gear": "a glowing trident and an oval turtle-shell shield"},
    "water.cavalry": {},
    "water.healer": {"form": "a Mermaid: a fish tail instead of legs, resting on a small solid water wave that carries her", "hover": True, "gear": "glowing staff topped with a pearl"},
    "water.banner": {"gear": "a glowing conch-shell horn raised to the face, a small aqua flag on the back"},
    "water.mage": {"gear": "glowing staff with a solid swirl of water around its tip"},
    "water.catapult": {"add": "a ballista loaded with a giant harpoon"},
    "water.giant": {"form": "a Deep kraken: a big octopus-like sea monster standing on its tentacles, two big tentacles raised as arms", "gear": "its tentacles (no weapon)", "gname": "two big tentacles", "head": "a round octopus head with two glowing aqua eyes"},
    "water.builder": {"add": "a coral branch strapped on the back"},
    # Hỏa
    "fire.miner": {"add": "soot-stained, a volcano miner", "gear": "a glowing lava-hot pickaxe"},
    "fire.sword": {"add": "a dragon-head helmet", "gear": "a glowing flaming sword"},
    "fire.archer": {"gear": "a glowing bow, arrows with solid flaming tips"},
    "fire.ninja": {"add": "the edges of the body crumbling into solid ash flakes"},
    "fire.spear": {"add": "dragon-scale armour", "gear": "a glowing halberd, no shield"},
    "fire.cavalry": {},
    "fire.healer": {"gear": "glowing staff topped with a sacred flame"},
    "fire.banner": {"gear": "a glowing dragon war drum hung at the hip, one drumstick, a small red flag on the back"},
    "fire.mage": {"gear": "glowing staff, a big solid fireball above the other palm"},
    "fire.catapult": {"add": "a molten lava boulder in the cup"},
    "fire.giant": {"form": "a Young dragon standing upright: horned head, small wings folded on the back, a long tail, clawed hands", "gear": "its clawed fists and fire breath (no weapon)", "gname": "clawed fists", "head": "a horned dragon head with two glowing fire-orange eyes"},
    "fire.builder": {"add": "a small brazier strapped on the back"},
    # Băng
    "ice.miner": {"add": "a fur hood", "gear": "a glowing ice pick"},
    "ice.sword": {"gear": "a glowing ice longsword"},
    "ice.archer": {"gear": "a glowing ice bow, icicle arrows"},
    "ice.ninja": {"add": "a white snow cloak"},
    "ice.spear": {"add": "ice armour", "gear": "glowing spear and a round ice shield"},
    "ice.cavalry": {"gear": "riding a big white snow bear with glowing eyes, glowing lance", "gname": "lance"},
    "ice.healer": {"add": "a fur-lined robe, a body of solid ice", "gear": "glowing staff topped with a snowflake"},
    "ice.banner": {"add": "a body of solid ice", "gear": "a glowing ice horn raised to the face, a small ice-blue flag on the back"},
    "ice.mage": {"gear": "glowing frost staff, an ice orb above the other palm"},
    "ice.catapult": {"add": "a big ice block in the cup"},
    "ice.giant": {"form": "a Snow giant: a huge yeti-like giant with white shaggy fur and an icicle beard", "gear": "a giant glowing ice club"},
    "ice.builder": {"add": "ice blocks strapped on the back"},
}


UNIT_RE = re.compile(r'Unit: (.+?) "(.+?)"\. (.*?)Cloth: (.+?)\. Gear: (.+?)\. Pose: (.+?)\.(?: For sprite stacking: (.*))?$')


def character(code: str, u: dict, name_en: str, cloth: str, size: str) -> dict:
    """Các ý ngoại hình của một lính (dùng chung cho cả 3 file)."""
    kind, name, build, cloth, gear, pose, extra = UNIT_RE.match(unit_text(code, u, name_en, cloth)).groups()
    lk = LOOK[code]
    element, civ_name = lk["civ"].removesuffix(")").split(" (")
    a = u["arch"]
    if a == "cavalry":
        frame = "a chibi stickman rider (big round head, about a third of the rider's height) on its mount"
    elif a == "catapult":
        frame = "a siege machine with one chibi stickman operator (big round head)"
    elif a == "giant":
        frame = "a huge bulky chibi giant, limbs 5-6 px thick"
    else:
        frame = "chibi stickman with a big round head (about a third of the total height) and a short body"
    tr = TRAITS[f"{code}.{a}"]
    if tr.get("head", "").startswith("NO head"):
        frame = "a headless chibi stickman rider on its mount"
    if tr.get("form"):
        frame = f'{tr["form"]}, chibi proportions'
        extra = (extra or "").replace("stickman", "body")
    build = (build or "").strip().rstrip(".")
    if tr.get("form") and a == "giant":
        build = "towering, much larger and bulkier than a normal unit"
    # Dáng riêng (tinh linh, người cây, thuỷ quái…): bỏ thân người que của hệ, chỉ giữ bảng màu
    base_body = f'coloured in the {element} palette: {lk["glow"]} glow on a dark body' if tr.get("form") else lk["body"]
    body = ", ".join(x for x in (base_body, ARCH_ADD.get(a), tr.get("add")) if x)
    head = tr.get("head") or (
        f'{lk["hair"]}, bold pixel clusters hugging the head. Black face, no mouth, no nose; slanted glowing {lk["eyes"]} '
        "eyes (2-pixel clusters with a white core pixel): TWO eyes in the front view, only ONE eye at the front edge of the "
        "head in the side view, no eyes in the back and top views"
    )
    noweapon = tr.get("gname") if "(no weapon)" in tr.get("gear", "") else None
    if noweapon:
        pose = pose.replace("weapon resting on the shoulder", f"{noweapon} raised menacingly")
    return {
        "title": f'{civ_name} civilization, {element} element, {kind} "{name}"',
        "build": f"{frame}{', ' + build[0].lower() + build[1:] if build else ''}. Size: {size}",
        "head": head,
        "body": body,
        "cloth": f'{cloth} in {lk["cloth"]}, ragged stepped pixel edges, hanging close to the body',
        "gear": f'{tr.get("gear", gear)}; every glowing part in {lk["glow"]}',
        "pose": pose,
        "extra": (extra or "").strip(),
        "noweapon": noweapon,
        "hover": tr.get("hover", False),
        "feet": feet_of(code, u),
    }


def feet_of(code: str, u: dict) -> tuple[str, str] | None:
    """Bộ phận bước đi ở hàng trước / sau (người, thú cưỡi, người đẩy máy, xúc tu)."""
    a = u["arch"]
    if a == "cavalry" and u["look"].get("mount") == "shark":
        return None  # cá mập lướt trên sóng: dùng khung trôi
    if a == "cavalry":
        return "front leg of the mount", "front legs of the mount"
    if a == "catapult":
        return "foot of the operator", "feet of the operator"
    if TRAITS[f"{code}.{a}"].get("form", "").startswith("a Deep kraken"):
        return "front tentacle", "front tentacles"
    return "foot", "feet"


def char_block(ch: dict, pose: str | None = None, same: str = "every cell") -> str:
    pose = pose or ch["pose"]
    if ch["noweapon"]:  # thân là vũ khí (xúc tu, móng, cành)
        pose = pose.replace("weapon resting on the shoulder", f"{ch['noweapon']} raised menacingly")
    if ch["hover"]:
        pose = pose.replace("feet", "body") + ", floating"
    lines = [
        f"CHARACTER ({ch['title']}), identical in {same}: same colours, gear, size and pixel scale",
        f"- Build: {ch['build']}.",
        f"- Head: {ch['head']}.",
        f"- Body: {ch['body']}.",
        f"- Cloth: {ch['cloth']}.",
        f"- Gear: {ch['gear']}.",
        f"- Pose: {pose}.",
    ]
    if ch["extra"]:
        lines.append(f"- Note: {ch['extra'].strip()}")
    return "\n".join(lines)


STYLE = (
    "STYLE\n"
    "- Chunky pixel art: every art pixel a crisp square block, upscaled with nearest neighbour.\n"
    "- 3-tone shading (cool dark shadow, saturated mid-tone, warm highlight), bold 1px dark outline.\n"
    "- Arms, legs, weapon shafts and staffs at least 2 px thick.\n"
    "- Glows are solid bright pixel clusters with a white-hot core; every effect is a solid pixel shape touching the body, "
    "the weapon or the ground line, nothing floating.\n"
    "- Strictly orthographic: no perspective, no 3/4 angle.\n"
    "- Background: fully transparent PNG (alpha). No white, no colour, no checkerboard pattern."
)
AVOID_ALL = (
    "text, labels, numbers, grid lines, borders, ground shadow, motion blur, speed lines, glow halo, bloom, gradients, "
    "anti-aliasing, 1-pixel thin lines, floating particles, extra limbs, a second weapon, cells of different sizes, "
    "the character changing size, a 3/4 head or body turn, the body turning to show a step, a swing or the cloth, "
    "realistic or painterly style, 3D render"
)


# Mỗi ảnh động chỉ MỘT hướng: AI vẽ nhiều hướng trong một ảnh thì hay lẫn (khung ngang quay ra trước, khung sau thành
# trước…). Tách mỗi hướng một prompt, đính kèm bảng 4 mặt, bảo vẽ lại đúng ô của hướng đó.
VIEW = {
    "side": {
        "name": "SIDE view, strict profile facing LEFT",
        "cell": "cell 2 (SIDE view)",
        "rule": "head, chest, hips and feet all point LEFT; only ONE eye visible at the left edge of the head; the face "
        "never turns toward the viewer",
        "cue": "profile facing left, one eye",
        "avoid": "two eyes, the face turning toward the viewer, facing right, a front or back view",
    },
    "front": {
        "name": "FRONT view, facing the viewer straight on",
        "cell": "cell 3 (FRONT view)",
        "rule": "both eyes visible, chest and hips square to the viewer, the body left-right symmetrical apart from the "
        "held gear, like a classic 16-bit RPG sprite facing down the screen",
        "cue": "front, both eyes, symmetrical",
        "avoid": "a profile, a single eye, the head or body turned sideways, a back view",
    },
    "back": {
        "name": "BACK view, the back to the viewer",
        "cell": "cell 4 (BACK view)",
        "rule": "no eyes, no face and no profile visible, shoulders and hips square, the cloth covering the back, like a "
        "classic 16-bit RPG sprite facing up the screen",
        "cue": "back, no face, symmetrical",
        "avoid": "any eye or face, a profile, the head or body turned sideways, a front view",
    },
}
VIEW_ORDER = ("side", "front", "back")
VIEW_VI = {"side": "ngang (quay trái)", "front": "trước", "back": "sau"}
STRIP_VI = {"idle": "đứng yên", "walk": "đi", "run": "chạy nhanh", "attack": "đòn thường", "skill": "kỹ năng"}


def headless(ch: dict) -> bool:
    return ch["head"].startswith("NO head")


def gear_lock(ch: dict, n: int) -> str:
    """Trang bị phải có mặt ở mọi khung (AI hay quên vẽ vũ khí / túi ở vài khung)."""
    held = ch["noweapon"] or ch["gear"].split(";")[0].strip()
    extra = [x.strip() for x in ch["body"].split(",") if any(k in x for k in ("sack", "belt", "quiver", "shield", "drum", "bag"))]
    items = "; ".join([held] + extra)
    return (
        f"GEAR LOCK (check every one of the {n} frames)\n"
        f"- Always drawn, complete, same size and same colours in EVERY frame: {items}.\n"
        "- The weapon / tool stays in the same hand; when the body hides part of it, the visible ends still show. "
        "A frame without the weapon or tool is wrong."
    )


def eye_check(ch: dict, n: int) -> str:
    """Câu kiểm tra cuối: đếm mắt từng hàng — khung lệch hướng lộ ngay (hay gặp nhất: khung cuối hàng trước thành mặt sau)."""
    if headless(ch):
        return (
            f"- Final check before finishing: row 1 shows the side silhouette in all {n} frames, row 2 the chest facing "
            f"the viewer in all {n} frames, row 3 the back in all {n} frames, the LAST frame of each row included."
        )
    return (
        f"- Final check before finishing, count the eyes in every frame, the LAST frame of each row included: row 1 = "
        f"ONE eye in all {n} frames, row 2 = TWO eyes (the face) in all {n} frames, row 3 = NO eyes (the back) in all "
        f"{n} frames. Fix any frame that breaks this; never let a row end in another view."
    )


def view_of(v: str, ch: dict) -> dict:
    d = dict(VIEW[v])
    if headless(ch):  # kỵ sĩ không đầu: không nói mắt
        d["rule"] = d["rule"].replace("only ONE eye visible at the left edge of the head; the face never turns toward the viewer", "the body never turns toward the viewer").replace("both eyes visible, ", "")
        d["cue"] = d["cue"].replace(", one eye", "").replace(", both eyes", "")
        d["avoid"] = d["avoid"].replace("two eyes, the face turning toward the viewer", "the body turning toward the viewer").replace("a single eye, ", "")
    return d


def views_text(code: str, arch: str, size: str, ch: dict) -> str:
    """Bảng 4 mặt: mẫu gốc của lính, mọi ảnh động đính kèm ảnh này."""
    pose, _ = IDLE_POSE[arch]
    return "\n\n".join(
        [
            "Pixel art character model sheet: ONE image, ONE row of 4 equal cells, evenly spaced, nothing touching "
            "another cell: cell 1 TOP view (seen from straight above, face side pointing DOWN), cell 2 SIDE view "
            "facing LEFT, cell 3 FRONT view, cell 4 BACK view. Same character, same size, same standing pose in all "
            "4 cells, the feet of cells 2-4 on one ground line.",
            "VIEWS\n"
            "- SIDE (cell 2): strict profile facing LEFT, only ONE eye at the left edge of the head.\n"
            "- FRONT (cell 3): facing the viewer straight on, both eyes, left-right symmetrical apart from the held gear.\n"
            "- BACK (cell 4): the back to the viewer, no face, the cloth covering the back.",
            char_block(ch, pose, "all 4 cells"),
            gear_lock(ch, 4).replace("frames", "cells").replace("frame", "cell"),
            STYLE,
            f"AVOID: {AVOID_ALL}, the side view facing right, two eyes in the side view, extra cells, walking or attacking poses.",
        ]
    )


# Đứng yên 6 khung: áo choàng bay rồi chậm dần (gió nhẹ thổi qua rồi lặng); nhịp thở + vũ khí nhích 1 px (IDLE_BREATH)
IDLE_ROWS = {
    "side": [
        "exactly the SIDE cell of the attached sheet, the cloth hanging still",
        "inhale: body 1 px up; a gentle breeze lifts the cape / scarf hem 2 px out behind the back (to the right)",
        "full inhale: body 1 px up; the cloth billows at its fullest, the hem 3 px out behind the back",
        "the breeze fades: body back to neutral height; the hem drops to 1 px out, a ripple running down the cloth",
        "exhale: knees bend slightly, body 1 px down; the cloth almost settled, only the hem tips moving 1 px",
        "back to neutral height, the same view as frame 1 of THIS row (not of the row below), so the loop is seamless",
    ],
    "front": [
        "exactly the FRONT cell of the attached sheet, the cloth hanging still",
        "inhale: body 1 px up; a gentle breeze lifts the cape / scarf edges 2 px out to BOTH sides, mirrored left and right",
        "full inhale: body 1 px up; the cloth edges flare at their fullest, 3 px out on both sides, still behind the body",
        "the breeze fades: body back to neutral height; the edges drop to 1 px out, a ripple running down",
        "exhale: knees bend slightly, body 1 px down; the cloth almost settled, only the hem tips moving 1 px",
        "back to neutral height, still the FRONT view with the face and both eyes like frame 1 of this row (NOT the back view of the row below), so the loop is seamless",
    ],
    "back": [
        "exactly the BACK cell of the attached sheet, the cloth hanging still",
        "inhale: body 1 px up; a gentle breeze lifts the cape / scarf hem 2 px and sways it 2 px to the left",
        "full inhale: body 1 px up; the hem at its fullest, lifted 3 px and swayed 3 px to the left",
        "the breeze fades: body back to neutral height; the hem swings back through the centre, a ripple running down",
        "exhale: knees bend slightly, body 1 px down; the hem drifting back to the centre, only its tips moving 1 px",
        "back to neutral height, still the back view like frame 1 of this row, so the loop is seamless",
    ],
}


# Nhịp thở và vũ khí nhích theo vai từng khung (vũ khí vẫn trong tay, không giơ lên, không vung)
IDLE_BREATH = [
    "",
    "; the chest expands 1 px, the weapon / tool rises 1 px with the shoulders",
    "; chest at its fullest, the weapon / tool tip tilts 1 px back",
    "; the chest relaxes, the weapon / tool settles back to its rest position",
    "; the chest sinks 1 px, the weapon / tool dips 1 px with the shoulders",
    "; the weapon / tool exactly as in frame 1",
]


def idle_text(code: str, u: dict, size: str, tall: int, ch: dict) -> str:
    """Đứng yên: MỘT ảnh 3 hàng (ngang / trước / sau) × 6 khung, đính kèm bảng 4 mặt."""
    pose, _ = IDLE_POSE[u["arch"]]
    rows = []
    for r, v in enumerate(VIEW_ORDER, 1):
        d = view_of(v, ch)
        fl = "\n".join(
            f"{i}. ({v.upper()} view, {d['cue'].removeprefix(v + ', ')}) {f}{IDLE_BREATH[i - 1]}." for i, f in enumerate(IDLE_ROWS[v], 1)
        )
        rows.append(f"- Row {r} ({d['name']}, copied from {d['cell']} of the attached sheet in all 6 frames):\n{fl}")
    locks = "\n".join(
        f"- Row {r}: {view_of(v, ch)['name']} in EVERY frame: {view_of(v, ch)['rule']}; never {view_of(v, ch)['avoid']}."
        for r, v in enumerate(VIEW_ORDER, 1)
    )
    return "\n\n".join(
        [
            "Pixel art sprite sheet: ONE image, 3 rows x 6 columns (18 equal frames, evenly spaced, nothing touching "
            f"another frame; frames {canvas(u['arch'], tall)}), a slow looping IDLE animation of the SAME character as "
            "in the attached model sheet. Row 1 = SIDE view facing LEFT, row 2 = FRONT view, row 3 = BACK view; frames "
            "go left to right in time order; within a row the feet stand on one ground line at the same spot.",
            "ONE DIRECTION PER ROW (the most important rule)\n"
            + locks
            + "\n- Every frame of a row is a redraw of that row's model view; between frames only the breathing bob, the "
            "cloth, the hair and a slight weapon bob change. Nobody turns, nothing switches to another view, no 3/4 angle.\n"
            + eye_check(ch, 6),
            char_block(ch, pose, "all 18 frames"),
            gear_lock(ch, 18),
            "IDLE (6 frames, frame 6 loops back to frame 1; calm and slow, a living stance, not frozen)\n"
            + "\n".join(rows)
            + "\n- Slow-down: the cloth motion eases out like fabric settling after a gentle breeze: big movement in "
            "frames 2-3, smaller in frame 4, tiny in frame 5. Hair sways with the cloth, a little behind it.\n"
            "- Breathing: a clear slow rhythm, inhale (frames 2-3) and exhale (frames 4-5), the shoulders and chest rising and "
            "sinking 1 px.\n"
            "- Weapon / tool: stays in the same hand and the same grip, only bobbing 1 px and tilting 1 px with the breath; "
            "never raised, swung or waved; the free hand stays relaxed.\n"
            f"- Element touch, subtle and slow: {CIV[code]['idle']}.",
            STYLE,
            f"AVOID: {AVOID_ALL}, walking, attacking, the feet moving, raising a hand, waving, swinging the weapon, the "
            "weapon changing hands, a missing weapon or tool, a stiff frozen cloth, a jerky fast cloth, any row with frames in another view.",
        ]
    )


# Khung phẳng cho hướng trước / sau khi đi / chạy: kiểu nhân vật RPG 16-bit đi xuống / đi lên màn hình
FLAT_STEP = {
    "walk": [
        "the left {f} steps 1 px lower than the right, the right {f} lifted 2 px with the knee bent; arms swing up and down at the sides",
        "both {fs} side by side again, body dips 1 px",
        "neutral height, {fs} side by side",
        "mirror of frame 1: the right {f} 1 px lower, the left {f} lifted 2 px",
        "both {fs} side by side, body dips 1 px",
        "neutral height, the same view as frame 1 of this row, ready to loop",
    ],
    "run": [
        "the left {f} lands flat, the right knee driven up in front of the body (its {f} 3 px up), arms pumping up and down, shoulders dipping 1 px",
        "the left knee bends, body 1 px lower, the right {f} coming down",
        "the right {f} about to land, both {fs} close to the ground, body back to normal height",
        "mirror of frame 1: the right {f} lands flat, the left knee driven up",
        "the right knee bends, body 1 px lower, the left {f} coming down",
        "the left {f} about to land, the same view as frame 1 of this row, ready to loop",
    ],
    "float": [
        "floating at the base height, the hem / tail hanging straight",
        "body 1 px up, the hem swaying 2 px to the left",
        "body 2 px up, the hem swaying back to the centre",
        "body 1 px up, the hem swaying 2 px to the right",
        "back at the base height, the hem rippling",
        "body 1 px down, the same view as frame 1 of this row, ready to loop",
    ],
}
# Câu "về phía người xem / ra xa" làm AI xoay người hoặc vẽ phối cảnh: đổi thành chuyển động phẳng
TOWARD = re.compile(r" (?:straight )?(?:at|toward) the viewer(?: \((?:front row)?(?:, foreshortened)?\))?(?: (?:/|and) (?:straight )?away(?: from the viewer)?(?: \(back row\))?)?")


def flat_fb(fb: str, kind: str, v: str) -> str:
    fb = TOWARD.sub(" in front of the body" if kind == "action" else " in place", fb)
    # Câu dạng "A (front row) / B (back row) C": hướng trước giữ A, hướng sau ghi rõ B là lúc nhìn từ sau
    m = re.search(r"(.*?)\s*\(front row\)\s*/\s*(.*?)\s*\(back row\)(.*)", fb)
    if m:
        head, alt, tail = m.group(1).rstrip(" ,"), m.group(2), m.group(3)
        if v == "back":
            head = re.sub(r" (?:facing the viewer|seen from the front)$", "", head)
            if alt not in ("from behind", "back", "behind", "with the back to the viewer"):
                head = f"{head}; seen from behind: {alt}"
        fb = head + tail
    return fb.replace("seen head-on", "").replace("  ", " ").strip(" ,")


def move_frames(kind: str, v: str, ch: dict, beats: list[str]) -> tuple[list[str], str]:
    if v == "side":
        return beats, "the legs, the arms, the cloth and the bob"
    if ch["hover"] or not ch["feet"]:
        return FLAT_STEP["float"], "the height, the arms and the cloth"
    f, fs = ch["feet"]
    return [x.format(f=f, fs=fs) for x in FLAT_STEP[kind]], "the legs, the arms, the cloth and the bob"


def rows_sheet(what: str, n: int, cells: str, ch: dict, pose: str, section: str, rows: dict, notes: list[str], moved: str, avoid: str) -> str:
    """MỘT ảnh 3 hàng (ngang / trước / sau) × n khung, đính kèm bảng 4 mặt; mỗi hàng khoá đúng một hướng."""
    locks, body = [], []
    for r, v in enumerate(VIEW_ORDER, 1):
        d = view_of(v, ch)
        locks.append(f"- Row {r}: {d['name']} in EVERY frame: {d['rule']}; never {d['avoid']}.")
        fl = "\n".join(f"{i}. ({v.upper()} view, {d['cue'].removeprefix(v + ', ')}) {f.rstrip('.')}." for i, f in enumerate(rows[v], 1))
        body.append(f"- Row {r} ({d['name']}, redrawn from {d['cell']} of the attached sheet in all {n} frames):\n{fl}")
    nl = "".join(f"\n- {x}" for x in notes)
    return "\n\n".join(
        [
            f"Pixel art sprite sheet: ONE image, 3 rows x {n} columns ({3 * n} equal frames, evenly spaced, nothing "
            f"touching another frame; frames {cells}), {what} of the SAME character as in the attached model sheet. "
            "Row 1 = SIDE view facing LEFT, row 2 = FRONT view, row 3 = BACK view; frames go left to right in time "
            "order; within a row the feet stay on one ground line at the same spot (in place, no travelling).",
            "ONE DIRECTION PER ROW (the most important rule)\n"
            + "\n".join(locks)
            + f"\n- Every frame of a row is a redraw of that row's model view; between frames only {moved} change. "
            "Nobody turns, nothing switches to another view, no 3/4 angle.\n"
            + eye_check(ch, n),
            char_block(ch, pose, f"all {3 * n} frames"),
            gear_lock(ch, 3 * n),
            f"{section}\n" + "\n".join(body) + nl,
            STYLE,
            f"AVOID: {AVOID_ALL}, any row with frames in another view, a missing or half-drawn weapon or tool, {avoid}.",
        ]
    )


def move_text(code: str, u: dict, size: str, tall: int, ch: dict, kind: str) -> str:
    """Đi / chạy nhanh: MỘT ảnh 3 hàng × 6 khung."""
    carry, beats, fb = (move_beats if kind == "walk" else run_beats)(code, u)
    c = CIV[code]
    rows = {v: move_frames(kind, v, ch, beats)[0] for v in VIEW_ORDER}
    moved = move_frames(kind, "front", ch, beats)[1]
    side = f"Row 1 is a classic side-scroller {'walk' if kind == 'walk' else 'run'} cycle seen purely in profile: the head stays in profile the whole time."
    flat = f"Rows 2-3 read flat, like a 16-bit RPG sprite walking down / up the screen, no turning: {flat_fb(fb, 'move', 'front')}."
    if kind == "walk":
        what, sec, k = "a looping 6-frame WALK animation", "WALK (frame 6 loops back to frame 1)", 1.0
        notes = [
            side,
            flat,
            f"Gait of this civilization: {c['move']}; {c['trail']} in the contact frames.",
            "A calm normal walk (the default way the unit moves): one foot always on the ground, the body bobs at most 1 px.",
            "Hair and cloth trail behind the motion.",
        ]
        avoid = "dust clouds, jumping, hopping, both feet in the air"
    else:
        what, sec, k = "a looping 6-frame fast SPRINT / RUN animation", "SPRINT (frame 6 loops back to frame 1; clearly faster and more stretched than a walk)", 1.1
        notes = [
            side,
            flat,
            f"Gait of this civilization, exaggerated for a sprint: {c['move']}; {c['trail']} on every push-off.",
            "A fast ground run (played while the player holds Shift), NOT a jump: the feet stay close to the ground line in "
            "every frame, the speed shows through the forward lean, the long strides, the pumping arms and the cloth "
            "streaming back; the head height changes by at most 1-2 px.",
            "Hair and cloth fly back with the speed.",
        ]
        avoid = "dust clouds, the body leaning backward, jumping, hopping, leaping, both feet high in the air, the body rising more than 2 px"
    return rows_sheet(what, 6, canvas(u["arch"], tall, k), ch, carry, sec, rows, notes, moved, avoid)


def action_text(code: str, u: dict, tall: int, ch: dict, kind: str, beats: list[str], hit: int, fb: str, k: float, extra: list[str]) -> str:
    """Đòn thường / kỹ năng: MỘT ảnh 3 hàng (ngang / trước / sau) × 6 khung, cùng nhịp ra đòn ở cả 3 hàng."""
    notes = [
        "Row 2 (front) and row 3 (back) play the same beats at the same time as row 1, read flat with no turning: "
        f"{flat_fb(fb, 'action', 'front')}; there 'forward' means down the picture in front of the body (row 2) or up "
        "the picture, partly hidden by the back (row 3); the legs keep a planted stance.",
        f"Frame {hit} is the moment of the hit in all three rows and must read clearly.",
        "The weapon is ONE solid object in every frame, never cut, never bent.",
    ] + extra
    # Khung cuối hàng trước / sau ghi rõ hướng (AI hay chép nhầm khung đầu của hàng bên dưới)
    rows = {
        "side": beats,
        "front": beats[:-1] + [f"{beats[-1].rstrip('.')}, still the FRONT view with the face and both eyes like frame 1 of this row (NOT the back view of the row below)"],
        "back": beats[:-1] + [f"{beats[-1].rstrip('.')}, still the back view like frame 1 of this row"],
    }
    return rows_sheet(
        f"a 6-frame {kind} animation (room for the weapon at full reach)",
        6, canvas(u["arch"], tall, k), ch, ch["pose"], "ACTION", rows, notes,
        "the arms, the weapon, the cloth and the effects (and the legs in row 1)", "dust clouds",
    )


# ---------- Dấu ấn từng hệ cho chuyển động / đòn đánh ----------
# fx: hiệu ứng nguyên tố (khối pixel đặc), move: dáng đi riêng của hệ, hit: tia / mảnh văng ở khung ra đòn
CIV = {
    "light": {
        "idle": "the hair star twinkles brighter and back, the golden crack lines pulse",
        "name": "golden holy light",
        "fx": "golden-white holy light: solid pixel sun rays, a bright four-pointed star and a thin golden sun ring",
        "move": "upright, proud and steady steps, the cape swaying evenly",
        "trail": "a few tiny golden star pixels touching the heels",
    },
    "wind": {
        "idle": "the wind is strongest here: cape and scarf flap hard, the hair streams back, the small wings flutter",
        "name": "pale-cyan wind",
        "fx": "pale-cyan wind: solid pixel swirl arcs and short curved gust streaks",
        "move": "light, springy, fast steps leaning forward, hair and cloth streaming back",
        "trail": "a short solid pale-cyan swirl touching the back foot",
    },
    "wood": {
        "idle": "the leaf crown and the leafy cape rustle, the glowing veins pulse slowly",
        "name": "green leaf-and-vine",
        "fx": "living wood: solid green leaf clusters, thorny vines and glowing lime veins",
        "move": "calm rooted steps, knees soft, leaves on the body rustling",
        "trail": "a small leaf cluster touching the back foot",
    },
    "shadow": {
        "idle": "the smoke wisps on the hair and cape edges curl and drift up 1-2 px, then reform",
        "name": "purple shadow smoke",
        "fx": "shadow magic: solid purple-black smoke wisps, violet skull-like spirit flames and dark runes",
        "move": "a creeping, hunched glide, shoulders low, smoke wisps clinging to the feet",
        "trail": "short solid purple smoke wisps touching the feet",
    },
    "thunder": {
        "idle": "a small yellow spark jumps along the hair and the weapon every other frame, the chest emblem flickers",
        "name": "yellow lightning",
        "fx": "lightning: solid bright yellow zig-zag bolts with a white core and small electric sparks",
        "move": "sharp, jerky, very fast steps like a sprinter, crackling",
        "trail": "a tiny solid yellow zig-zag spark touching the back heel",
    },
    "blood": {
        "idle": "the red vein cracks throb like a heartbeat, the fists glow brighter on the beat",
        "name": "crimson blood",
        "fx": "blood magic: solid crimson droplets, dark red slashes and a blood-red crescent moon glow",
        "move": "aggressive, stomping, hunched-forward berserker steps",
        "trail": "a couple of solid crimson droplet pixels touching the weapon",
    },
    "crystal": {
        "idle": "the crystal shards glint one by one (a white glint pixel moving shard to shard)",
        "name": "violet crystal",
        "fx": "crystal: solid faceted violet-pink crystal shards with white glints and prism sparkles",
        "move": "elegant, precise steps, crystal shards on the body glinting",
        "trail": "a tiny white glint pixel on a crystal shard",
    },
    "stone": {
        "idle": "the amber cracks glow brighter and dimmer like slow magma, the body barely moves (heavy and steady)",
        "name": "amber-cracked rock",
        "fx": "earth: solid grey rock chunks, amber magma cracks and small pebble debris",
        "move": "heavy, slow, sure-footed steps, every footfall planted firmly",
        "trail": "two small solid pebble pixels touching the landing foot",
    },
    "metal": {
        "idle": "a forge spark glints on the armour trim, the armour plates shift 1 px with the breath",
        "name": "orange forge-spark",
        "fx": "forged metal: solid steel shards, orange-hot forge sparks and gold rivets",
        "move": "disciplined marching steps in rhythm, armour plates bouncing 1 px",
        "trail": "a tiny solid orange forge spark touching the heel",
    },
    "water": {
        "idle": "the water hair and ribbons ripple in waves, a droplet slides down and rejoins the body",
        "name": "aqua water",
        "fx": "water: solid aqua wave crests, round droplets and white foam curls (opaque pixels, not see-through)",
        "move": "flowing, swaying steps like a wave, hair rippling",
        "trail": "a small solid aqua water splash touching the landing foot",
    },
    "fire": {
        "idle": "the flame hair flickers in a different shape every frame, the fist flames lick upward",
        "name": "orange flame",
        "fx": "fire: solid orange-red flame tongues with yellow-white cores and glowing embers",
        "move": "eager, bouncy, restless steps, hair flames flickering",
        "trail": "a small solid flame tongue touching the back foot",
    },
    "ice": {
        "idle": "a frosty breath puff forms at the face in frame 2 and fades, the ice crystals glint",
        "name": "light-blue frost",
        "fx": "ice: solid light-blue ice crystals, frost spikes and white snowflake pixels",
        "move": "careful, gliding steps as if on frost, breath puffing",
        "trail": "a tiny solid frost crystal touching the landing foot",
    },
}

def canvas(arch: str, tall: int, k: float = 1.0) -> str:
    """Cỡ khung ảnh động: đủ chỗ cho vũ khí vung hết tầm / hiệu ứng kỹ năng (k > 1)."""
    wide = 1.4 if arch in ("cavalry", "catapult") else 1.9
    return f"about {round(tall * wide * k)} x {round(tall * 1.35 * k)} px native per frame"


def gear_of(code: str, u: dict) -> str:
    """Tên ngắn của đồ cầm chính (để tả đòn đánh)."""
    a, look = u["arch"], u["look"]
    w = look.get("weapon") or DEFAULT_WEAPON.get(a)
    if TRAITS[f"{code}.{a}"].get("gname"):
        return TRAITS[f"{code}.{a}"]["gname"]
    if a == "archer" and w == "throw":
        return THROWN[code]
    if a == "cavalry":
        return "lance"
    if a == "catapult":
        return look.get("machine") or "catapult"
    if w in WEAPON:
        return WEAPON[w].removeprefix("glowing ").replace("huge ", "")
    return w or "weapon"


MINE = "the mine is a separate map sprite: do NOT draw it"


# ---------- Di chuyển ----------
def move_beats(code: str, u: dict) -> tuple[str, list[str], str]:
    """(cách cầm đồ khi đi, 6 khung nhìn ngang, gợi ý hàng trước / sau) theo loại lính."""
    a, look = u["arch"], u["look"]
    w = look.get("weapon") or DEFAULT_WEAPON.get(a)
    g = gear_of(code, u)
    walk = [
        "contact: the front foot lands heel first, the back leg straight behind, arms swinging opposite",
        "down: the body dips 1 px as the weight lands on the front leg, knee bent",
        "passing: the back leg swings forward past the standing leg, body back to neutral height",
        "up: the standing leg pushes off, the body rises 1 px, the swinging foot reaches forward",
        "contact (other side): the other foot lands heel first, legs swapped compared with frame 1",
        "passing (other side): the back leg swings forward again, the loop returning to frame 1",
    ]
    fb = "the legs alternate stepping toward the viewer and away, the body bobbing 1 px, arms swinging"
    carry = f"carrying the {g} as in the idle pose"
    if a == "miner":
        carry = f"the {g} resting on the shoulder, a small gold sack bouncing at the hip"
    elif a == "sword":
        carry = f"jogging with the {g} held low and diagonal" + (", shield on the arm" if look.get("shield") not in (None, "none") else "")
    elif a == "archer":
        carry = {
            "throw": f"jogging with one {g} held ready beside the head, spare {g}s on the back",
            "musket": "jogging with the musket held diagonally across the chest",
        }.get(w, "jogging with the bow held low in one hand, quiver bouncing on the back")
    elif a == "ninja":
        carry = {
            "bomb": "creeping hunched, the lit bomb hugged to the chest, fuse sparkling",
            "pick": "creeping low, the pickaxe ready in front",
        }.get(w, f"sneaking low on the toes, the {g} held reverse-grip close to the body")
        fb = "a sneaking walk in place, knees bent, body low, light careful steps"
    elif a == "spear":
        carry = f"a heavy guarded march, the {g} upright" + (", shield held in front" if look.get("shield") != "none" else "")
        fb = "a heavy march, shoulders squared, the weapon steady, legs stomping in rhythm"
    elif a == "cavalry":
        m = look.get("mount") or "horse"
        if m == "shark":
            carry = "the rider steady with the lance forward, the shark surging along a solid pixel wave"
            walk = [
                "the shark's tail sweeps up, the wave crest high behind it",
                "the body arcs forward, the snout dipping",
                "the tail sweeps down, the wave crest rolling under the belly",
                "the body levels out, fins spread",
                "the tail sweeps up again, the wave crest building",
                "almost back to frame 1 so the loop is seamless",
            ]
            fb = "the shark's tail swishes side to side, the wave under it rolling, the rider bobbing 1 px"
        elif m == "chariot":
            carry = "the driver standing in the chariot with the lance held up, the horse trotting, wheel spokes turning a little between frames"
            walk = [
                "trot: the horse's near foreleg and far hind leg forward on the ground, the other diagonal pair lifted",
                "the lifted pair swings forward, the horse rising 1 px, the chariot rolling",
                "suspension: the horse's feet just touching, body highest, wheel spokes turned a little",
                "trot (other diagonal): the other diagonal pair lands, legs swapped compared with frame 1",
                "the first pair swings forward, the chariot bouncing 1 px",
                "almost back to frame 1 so the trot loops seamlessly, spokes at a matching position",
            ]
            fb = "the horse trots in place pulling the chariot, diagonal leg pairs alternating, the wheels turning slowly, the driver bobbing 1 px"
        else:
            carry = f"the rider sitting upright with the lance held up, the {m} trotting"
            walk = [
                "trot: the near foreleg and the far hind leg forward on the ground, the other diagonal pair lifted",
                "the lifted pair swings forward, the body rising 1 px",
                "the lifted diagonal pair passes under the body, three hooves near the ground, body highest by 1 px",
                "trot (other diagonal): the other diagonal pair lands, legs swapped compared with frame 1",
                "the first pair swings forward, the body rising 1 px",
                "almost back to frame 1 so the trot loops seamlessly",
            ]
            fb = f"the {m} trots in place, diagonal leg pairs alternating, head nodding, the rider bobbing 1 px"
    elif a == "healer":
        carry = f"a calm walk using the {g} like a walking stick, the free palm softly glowing"
    elif a == "banner":
        carry = "marching with the flag upright, the flag rippling more on every step, the instrument bouncing at the hip"
    elif a == "mage":
        carry = (
            "marching with the flamethrower gun at the hip, a small pilot flame at the muzzle"
            if w == "musket"
            else "a gliding walk, the staff in one hand, the spell orb floating above the other palm"
        )
    elif a == "catapult":
        m = look.get("machine") or "catapult"
        carry = f"the operator pushing the {m} from behind, the wheels rolling (spokes rotating a little every frame)"
        walk = [
            "the operator leans into the push, front foot forward, the machine wheels at spoke position 1",
            "the operator steps, the machine rolls 1-2 px, spokes turned a little",
            "passing step, the load in the machine wobbling 1 px",
            "the operator leans again, spokes turned further",
            "step with the other foot, the machine rolling",
            "almost back to frame 1 so the loop is seamless, spokes at a matching position",
        ]
        fb = "the operator pushes the machine toward the viewer / away, wheels rolling, the operator's legs stepping behind it"
    elif a == "giant":
        carry = f"a slow heavy stomp, the {g} resting on the shoulder, the whole body swaying side to side"
        fb = "a heavy stomp toward the viewer / away, the body swaying side to side, each footfall landing hard"
    elif a == "builder":
        carry = "walking with the hammer on the shoulder and a bundle of planks on the back, the bundle bouncing 1 px"
    if code == "water" and a == "giant":
        carry = "crawling forward on its tentacles, the two arm tentacles raised"
        walk = [
            "the front tentacles reach forward and grip the ground",
            "the body slides forward 1 px over them, the back tentacles curling",
            "the back tentacles push, the body rising 1 px",
            "the front tentacles reach forward again (other ones)",
            "the body slides forward, tentacles rippling",
            "almost back to frame 1 so the crawl loops seamlessly",
        ]
        fb = "the kraken crawls in place on its tentacles, the tentacles rippling in a wave, the body bobbing 1 px"
    if TRAITS[f"{code}.{a}"].get("hover"):
        carry = f"floating forward, {carry}"
        walk = [
            "float high: the body at its highest, cloth and tail streaming back",
            "glide: drifting forward, the body tilting slightly forward",
            "dip: the body sinks 2 px, the tail / wave / wings sweeping down",
            "low: the body at its lowest, still not touching the ground",
            "rise: the body rising again, tail / wave / wings sweeping up",
            "almost back to frame 1 so the float loops seamlessly",
        ]
        fb = "the body floats toward the viewer / away, bobbing up and down 2 px, never touching the ground"
    return carry, walk, fb


# ---------- Chạy nhanh ----------
# Chạy nhanh bám đất: AI hay vẽ thành nhảy nếu có khung "hai chân rời đất" — bỏ hẳn, chỉ sải dài + đổ người
RUN_HUMAN = [
    "contact: the front foot lands flat under the hips, body leaning forward, the back leg stretched far behind, the opposite arm pumping forward",
    "down: the front knee bends, the body 1 px lower, the back foot lifting just off the ground and swinging forward",
    "drive: the swinging knee drives forward to hip height, the standing foot pushing off the ground, body back to normal height",
    "contact (other side): the other foot lands flat under the hips, legs and arms swapped compared with frame 1",
    "down (other side): the knee bends, body 1 px lower, the back foot swinging forward low",
    "drive (other side): the other knee drives forward, almost back to frame 1 so the run loops seamlessly",
]
RUN_GALLOP = [
    "gathered: all four legs pulled under the belly, the hooves just above the ground line",
    "the hind legs land and push off hard, the forelegs reaching far forward",
    "FULL STRETCH: the forelegs land far in front, the hind legs stretched far back, body longest and lowest",
    "the forelegs push off, the hind legs swing forward under the body",
    "legs folding under the belly again, head and neck lifting slightly",
    "almost back to frame 1 so the gallop loops seamlessly",
]


def run_beats(code: str, u: dict) -> tuple[str, list[str], str]:
    """(cách cầm đồ khi chạy nhanh, 6 khung nhìn ngang, gợi ý hàng trước / sau) theo loại lính."""
    a, look = u["arch"], u["look"]
    w = look.get("weapon") or DEFAULT_WEAPON.get(a)
    g = gear_of(code, u)
    tr = TRAITS[f"{code}.{a}"]
    beats = list(RUN_HUMAN)
    fb = "a fast run in place, knees driving forward, arms pumping hard, the body bobbing 1 px, cloth flying"
    carry = f"sprinting with the {g} held tight"
    if a == "miner":
        carry = f"sprinting with the {g} gripped in one hand at the side, the gold sack bouncing hard and swinging wide at the hip"
    elif a == "sword":
        carry = f"charging with the {g} held low and trailing behind" + (", shield arm forward" if look.get("shield") not in (None, "none") else "")
    elif a == "archer":
        carry = {
            "throw": f"sprinting with one {g} raised ready above the shoulder, spare {g}s rattling on the back",
            "musket": "sprinting with the musket held across the chest in both hands",
        }.get(w, "sprinting with the bow gripped in one hand, the quiver bouncing on the back")
    elif a == "ninja":
        carry = {
            "bomb": "a frantic sprint, the lit bomb hugged to the chest, the fuse sparking brighter",
            "pick": "a low fast scurry, the pickaxe held ready in front",
        }.get(w, f"a blazing-fast dash, body almost horizontal, both arms swept straight back, the {g} reverse-grip")
        fb = "a blazing-fast low dash in place, knees pumping, arms swept back, scarf streaming"
    elif a == "spear":
        carry = f"a heavy shield-first charge, the {g} levelled forward" + (", shield in front" if look.get("shield") != "none" else "")
        fb = "a heavy charge in place, shoulders down behind the shield, legs pounding, the body bobbing 1 px"
    elif a == "cavalry":
        m = look.get("mount") or "horse"
        if m == "shark":
            carry = "the rider crouched low with the lance couched forward, the shark surging at full speed on a big solid wave"
            beats = [
                "the tail whips up hard, a tall wave crest behind",
                "the body lunges forward, snout low, fins pressed back",
                "the tail whips down, the wave crest rolling under the belly, spray chunks at the snout",
                "the body levels out at full length",
                "the tail whips up again, the wave building",
                "almost back to frame 1 so the surge loops seamlessly",
            ]
            fb = "the shark surges in place, the tail whipping side to side, the wave under it big and rolling, the rider crouched"
        else:
            mount = "horse" if m == "chariot" else m
            carry = (
                "the driver crouched in the bouncing chariot with the lance couched forward, the wheels spinning fast (spokes turned further each frame)"
                if m == "chariot"
                else f"the rider crouched low over the {m}'s neck with the lance couched forward, the {m} at full gallop"
            )
            beats = list(RUN_GALLOP)
            fb = f"the {mount} gallops at full speed in place, legs alternating in pairs, head pumping, the rider crouched and bobbing 1 px"
    elif a == "healer":
        carry = f"running with the robe hitched up, the {g} held in one hand, the free palm glowing"
    elif a == "banner":
        carry = "running with the flag held high and snapping wide, the instrument bouncing"
    elif a == "mage":
        carry = (
            "running with the flamethrower gun at the hip, a pilot flame streaming back"
            if w == "musket"
            else "running with the staff in one hand, the spell orb trailing just behind the palm"
        )
    elif a == "catapult":
        m = look.get("machine") or "catapult"
        carry = f"the operator sprinting while pushing the {m} hard, the machine rolling fast and bouncing 1 px, spokes turned further each frame"
        beats = [
            "the operator lunges into the push, leaning far forward, front foot forward",
            "a long running step, the machine bouncing up 1 px, the load rattling",
            "the other foot lands, the machine down again",
            "the operator lunges again, spokes turned further",
            "a long running step, the machine bouncing",
            "almost back to frame 1 so the loop is seamless, spokes at a matching position",
        ]
        fb = "the operator sprints in place behind the machine pushing hard, the wheels turning fast, the machine bouncing 1 px"
    elif a == "giant":
        carry = f"a lumbering charge, the {g} swinging at the side, huge strides"
        fb = "a lumbering charge in place, huge strides, the whole body bobbing 2 px, each footfall landing hard"
        if code == "water":
            carry = "surging forward fast on its tentacles, the arm tentacles thrown forward"
            beats = [
                "all tentacles bunch under the body",
                "the tentacles push off together, the body lunging forward and up 2 px",
                "the body at full stretch, tentacles trailing behind",
                "the tentacles land in front and grip",
                "the body pulled forward over them, tentacles bunching",
                "almost back to frame 1 so the surge loops seamlessly",
            ]
            fb = "the kraken surges in place on its tentacles, pushing off and gripping in a fast rhythm, the body bobbing 1 px"
    elif a == "builder":
        carry = "running with the hammer in hand, the building material bouncing on the back"
    if tr.get("hover"):
        carry = f"gliding fast, leaning far forward, {carry}"
        beats = [
            "dash: the body leaning far forward, the trail / tail / wave streaming straight back",
            "the body dips 2 px, gaining speed",
            "the body rises 2 px, the trail whipping",
            "full speed: leaning even further, arms swept back",
            "the body dips again",
            "almost back to frame 1 so the glide loops seamlessly",
        ]
        fb = "the body glides fast in place, bobbing 2 px, the trail streaming behind, never touching the ground"
    return carry, beats, fb


# ---------- Tấn công: đòn thường ----------
# Khung ra đòn (1..6) theo kiểu hành động; cùng nhịp ACTIONS trong apps/web/src/game/world/fx.ts
def attack_beats(code: str, u: dict) -> tuple[list[str], int, str]:
    """(6 khung nhìn ngang, khung ra đòn, gợi ý hàng trước / sau) của đòn đánh thường."""
    a, look = u["arch"], u["look"]
    w = look.get("weapon") or DEFAULT_WEAPON.get(a)
    g = gear_of(code, u)
    if a == "miner":
        if g == "drill":
            return [
                f"ready: the {g} held in both hands at the hip, the gold sack at the other hip",
                "aim: the drill bit pointed forward at waist height, feet braced",
                f"DRILL: the spinning bit pushes into the gold mine standing just in front ({MINE}), the bit stopping in mid-air at waist height, solid gold chips spraying from the tip",
                "drill on: the body shaking 1 px, more gold chips spraying",
                "pull out: the drill pulled back, one gold nugget dropping from the tip into the free hand",
                "COLLECT: the free hand drops the nugget into the gold sack, the sack now fuller",
            ], 3, "the drill pushes forward toward the viewer (front row) / away (back row) into the unseen mine"
        return [
            f"ready: the {g} resting on the shoulder, the gold sack at the hip",
            f"lift: both hands raise the {g} off the shoulder",
            f"wind-up peak: the {g} high over the head, body leaning back",
            f"swing: the {g} sweeps down in front, body leaning forward",
            f"IMPACT: the {g} strikes the gold mine standing just in front ({MINE}); the tip stops in mid-air at waist height, "
            "knees bent, a burst of solid gold chips and sparks at the tip, one gold nugget popping out",
            f"COLLECT: the {g} back on the shoulder, the free hand drops the nugget into the gold sack, the sack now fuller",
        ], 5, f"the {g} rises and strikes the unseen mine toward the viewer (front row) / away from the viewer (back row), gold chips flying at the tip"
    if a == "sword":
        if w == "trident":
            return [
                "ready: trident held diagonally in both hands, prongs forward",
                "draw back: the trident pulled back to the hip, body coiled",
                "step: big step forward, trident still back",
                "THRUST: the trident drives straight forward at chest height, arms fully extended",
                "push: the trident pushed deeper, body leaning in, still in profile",
                "recover: back to the ready pose",
            ], 4, "the trident jabs toward the viewer (front row) / away (back row)"
        return [
            f"ready: the {g} held low and diagonal",
            f"raise: both hands lift the {g}, blade up beside the head",
            f"wind-up peak: the {g} raised high behind the head, body coiled, front foot stepping",
            f"SLASH: the {g} sweeps down diagonally across the front, blade horizontal at chest height, big step forward",
            "follow-through: the blade ends low behind the front foot, cloth flaring",
            "recover: back to the ready guard",
        ], 4, f"the {g} rises over the head and slashes diagonally across the front of the body"
    if a == "archer":
        if w == "throw":
            return [
                f"ready: one {g} held beside the head",
                "wind-up: the throwing arm cocks far back, the other arm pointing forward, chest still in profile",
                "step: front foot steps forward, weight shifting onto it",
                f"RELEASE: the arm whips forward and the {g} leaves the hand, flying forward a short distance in front",
                "follow-through: the throwing arm ends low across the body",
                f"reload: the hand pulls a new {g} from the back",
            ], 4, f"the {g} is thrown toward the viewer (front row) / away (back row)"
        if w == "musket":
            return [
                "ready: musket held diagonally across the chest",
                "raise: the musket comes up to the shoulder",
                "aim: musket levelled, cheek on the stock, body still",
                "FIRE: a solid pixel muzzle flash at the barrel tip, the body jolting back 1-2 px from the recoil",
                "recoil: the barrel kicks up, a small solid smoke puff at the muzzle",
                "lower: the musket comes back down across the chest",
            ], 4, "the musket is raised across the chest and fired toward the viewer (front row) / away (back row), a solid muzzle-flash burst beside the barrel"
        return [
            "ready: bow held low in one hand",
            "nock: the bow comes up, an arrow nocked on the string",
            "draw: the string pulled halfway back, arrow pointing forward",
            "full draw: the string pulled back to the cheek, body steady",
            "RELEASE: the arrow flies off forward, the string snapping straight, the drawing hand opening back",
            "lower: the bow comes down to the ready pose",
        ], 5, "the bow is drawn and the arrow shot toward the viewer (front row) / away (back row)"
    if a == "ninja":
        if w == "bomb":
            return [
                "ready: crouched low, the lit bomb hugged to the chest",
                "sprint: one big dash step forward",
                "leap: jumping forward, the bomb held up in both hands",
                "SLAM: the bomb slammed down on the ground in front, the fuse at its brightest",
                "BLAST: a big solid element explosion burst around the bomber, the body thrown back",
                "aftermath: the burst breaking into solid chunks, the bomber's silhouette fading to smoke pixels",
            ], 5, "the explosion bursts around the bomber, seen head-on (front row) / from behind (back row)"
        if w == "pick":
            return [
                "ready: crouched low, pickaxe ready",
                "dig: the pickaxe bites the ground, dirt chunks flying",
                "burrow: half the body sunk into a hole in the ground",
                "POP-UP: bursting out of the ground in front, pickaxe swinging up",
                "follow-through: the pickaxe high above the head, dirt chunks around the feet",
                "recover: crouched low again",
            ], 4, "the tunneler dives into the ground and pops up toward the viewer (front row) / away (back row)"
        if w == "scythe":
            return [
                "ready: crouched low, scythe held behind the back",
                "dash: a long low lunge forward",
                "wind-up: the scythe drawn far back behind the body, shoulders pulled back",
                "REAP: the scythe blade sweeps in a wide flat arc in front at knee height",
                "follow-through: the blade ends high on the other side, cloth whipping",
                "recover: crouched low again, scythe behind the back",
            ], 4, "the scythe sweeps a wide arc across the front (front row) / behind the body (back row)"
        return [
            f"ready: crouched low, the {g} reverse-grip",
            "dash: a long low lunge forward",
            f"STAB 1: the {g} drives forward at waist height",
            "pull back: the arm pulls back, body still low",
            "STAB 2: a second fast stab with the other hand, deeper",
            "recover: a small hop backward into the crouch, still facing forward",
        ], 3, "two fast stabs toward the viewer (front row) / away (back row); frames 3 and 5 are both hits"
    if a == "spear":
        if w in POLEARM:
            return [
                f"ready: braced guard, the {g} upright",
                f"lower: the {g} comes down level behind the shield",
                f"draw back: the {g} pulled back, body coiled behind the shield",
                f"THRUST: one long thrust of the {g} straight forward over the shield, front foot stepping",
                "hold: arms fully extended, the shield still in front",
                f"recover: the {g} pulled back upright",
            ], 4, f"the {g} thrusts over the top of the shield, in front of the body"
        return [
            f"ready: braced guard, the {g} upright at the side",
            f"raise: the {g} lifted high",
            "step: shoulder down, stepping forward",
            f"BASH: the {g} crashes down in front",
            "hold: weight on the front foot",
            "recover: back to the guard stance",
        ], 4, f"the {g} crashes down in front of the body"
    if a == "cavalry":
        m = look.get("mount") or "horse"
        mount = "horse" if m == "chariot" else m
        if m == "shark":  # cá mập không có chân: lướt trên sóng
            return [
                "gather: the shark arches on its wave, the rider pulling the lance back",
                "surge: the shark lunges forward, the wave crest rising behind it",
                "level: the lance comes down level at chest height",
                "CHARGE HIT: the shark at full stretch, the lance thrust far forward, the rider leaning into it",
                "impact: the shark's belly slaps down on the wave, the lance still forward",
                "recover: the lance comes back up, the shark settling on the wave",
            ], 4, "the shark surges up on its wave and the rider thrusts the lance toward the viewer (front row) / away (back row)"
        return [
            f"gather: the {mount} rears slightly, the rider pulling the lance back",
            f"spur: the {mount} lunges forward, front legs reaching",
            "level: the lance comes down level at chest height",
            f"CHARGE HIT: the {mount} at full stretch, the lance thrust far forward, the rider leaning into it",
            f"impact: the {mount}'s front hooves land hard, the lance still forward",
            "recover: the lance comes back up, the mount settling",
        ], 4, f"the {mount} stamps its front legs down and the rider thrusts the lance toward the viewer (front row) / away (back row)"
    if a == "healer":
        if code == "shadow":
            return [
                "ready: staff raised",
                "beckon: the free hand rises, palm up",
                "gather: violet spirit flames gather at the staff tip",
                "RAISE: a small solid spirit skull rises from the ground in front, the staff pointing at it",
                "release: the spirit flames swirl around the staff",
                "recover: back to the ready pose",
            ], 4, "the spirit rises in front of the necromancer (front row) / above the necromancer's shoulders (back row)"
        return [
            f"ready: the {g} raised",
            "gather: the free palm opens, a small healing glow forming",
            f"raise: the {g} lifted high, the glow growing",
            "HEAL: a solid ring of healing light spreads on the ground around the feet, a plus-shaped glow above the palm",
            "release: the ring widens and breaks into solid sparkles touching the ground",
            "recover: back to the ready pose",
        ], 4, "the healing ring spreads around the feet seen head-on (front row) / from behind (back row)"
    if a == "banner":
        ins = INSTRUMENT[code]
        if ins is None:
            return [
                "ready: flag pole upright",
                "lift: the flag raised high in both hands",
                "wave 1: the flag swept to one side, the cloth snapping",
                "PLANT: the pole slammed down into the ground, a solid shock ring at its base",
                "wave 2: the flag rippling wide above",
                "recover: back to the ready pose",
            ], 4, "the flag waves and is planted in front of the bearer (front row) / behind (back row)"
        verb = "drum" if "drum" in ins else ("bell" if "bell" in ins else "horn")
        if verb == "drum":
            return [
                "ready: drumstick raised",
                "lift: the drumstick high over the head",
                "wind-up: body leaning back",
                "BEAT: the drumstick slams the drum, a solid sound ring bursting out around the drum",
                "rebound: the stick bouncing up, the ring widening",
                "recover: back to the ready pose",
            ], 4, "the drum is struck facing the viewer (front row) / with the back to the viewer (back row), the sound ring spreading around"
        if verb == "bell":
            return [
                "ready: bell held up",
                "lift: the bell raised high",
                "swing back: the bell tilted back",
                "RING: the bell swung forward, solid sound rings bursting from its mouth",
                "ring on: the rings widening",
                "recover: back to the ready pose",
            ], 4, "the bell rings above the head, the sound rings spreading to both sides"
        return [
            "ready: the instrument lowered",
            "breathe in: chest rising, the instrument raised to the face",
            "start: cheeks puffed, body leaning back",
            "BLOW: a solid sound wave bursting out of the instrument's mouth, body leaning forward",
            "hold: the wave widening into rings",
            "recover: back to the ready pose",
        ], 4, "the instrument is played in front of the chest, the sound rings spreading to both sides"
    if a == "mage":
        if w == "musket":
            return [
                "ready: flamethrower gun at the hip",
                "aim: the gun levelled",
                "ignite: a small pilot flame at the muzzle",
                "SPRAY: a short solid jet of magma bursting forward from the muzzle",
                "spray on: the jet at full length",
                "recover: the jet stops, the gun back at the hip",
            ], 4, "the magma jet sprays toward the viewer (front row) / away (back row)"
        return [
            "ready: staff upright, the orb above the palm",
            "gather: the staff rises, the orb growing brighter",
            "charge: staff high, the orb at its biggest",
            "CAST: the staff and open hand thrust forward together, the element orb launching forward",
            "release: the orb leaving the frame edge in front, the cloth blown back",
            "recover: back to the ready pose",
        ], 4, "the orb is thrown toward the viewer (front row) / away (back row)"
    if a == "catapult":
        m = look.get("machine") or "catapult"
        if m == "ram":
            return [
                "ready: the ram log pulled back",
                "draw: the operator hauls the log further back on its ropes",
                "hold: the log at its furthest back",
                "SMASH: the log swings forward, its iron head crashing out of the front of the frame",
                "rebound: the log bouncing back",
                "recover: back to the ready pose",
            ], 4, "the ram swings at the viewer (front row) / away (back row)"
        if m == "ballista":
            return [
                "ready: the bolt loaded",
                "crank: the operator winds the winch, the bow arms bending",
                "full tension: arms fully bent",
                "SHOOT: the giant bolt fires forward, the bow arms snapping straight",
                "recoil: the frame jolting back 1-2 px",
                "reload: the operator lays a new bolt in the groove",
            ], 4, "the bolt fires toward the viewer (front row) / away (back row)"
        if m == "cannon":
            return [
                "ready: the cannon loaded",
                "fuse: the gunner touches the lit stick to the fuse",
                "spark: the fuse sparking",
                "FIRE: a big solid muzzle flash, the cannonball leaving the barrel",
                "recoil: the cannon rolling back 2 px, a solid smoke puff",
                "reload: the gunner pushes the cannon forward again",
            ], 4, "the cannon fires toward the viewer (front row) / away (back row)"
        return [
            "ready: the arm cocked back, the element boulder in the cup",
            "pull: the operator yanks the release rope",
            "launch start: the arm swinging up",
            "LAUNCH: the arm slams into the crossbar, the boulder flying up and forward",
            "follow-through: the arm shaking, the boulder leaving the frame edge",
            "reload: the operator winding the arm back down",
        ], 4, "the arm swings toward the viewer (front row) / away (back row), the boulder flying in a high arc"
    if a == "giant" and code == "fire":
        return [
            "ready: clawed fists raised, tail swaying",
            "inhale: the head rears back, chest swelling, a glow in the throat",
            "aim: the head snaps forward, jaws opening, small flames at the teeth",
            "BREATH: a big solid cone of fire bursts from the jaws forward and down onto the ground in front",
            "breath on: the fire cone at full length, the body leaning into it",
            "recover: the jaws close, a puff of solid smoke, back to the ready pose",
        ], 4, "the fire cone blasts toward the viewer (front row) / away (back row)"
    if a == "giant" and "(no weapon)" in TRAITS[f"{code}.giant"].get("gear", ""):
        return [
            f"ready: the {g} raised menacingly",
            f"lift: the {g} rise high above the head",
            "wind-up peak: the whole body arching back",
            f"SMASH: the {g} whip down and slam the ground in front, body lowest, a solid shock ring cracking out on the ground",
            "rebound: bouncing up 2 px, the shock ring widening",
            f"recover: back to the ready pose, the {g} raised",
        ], 4, f"the {g} slam down toward the viewer (front row) / away (back row)"
    if a == "giant":
        return [
            f"ready: the {g} resting on the shoulder",
            f"lift: both hands raise the {g} off the shoulder",
            f"wind-up peak: the {g} high over the head, the body arching back",
            f"SMASH: the {g} slams into the ground in front, knees bent, body lowest, a solid shock ring cracking out on the ground",
            "rebound: the weapon bouncing up 2 px, the shock ring widening",
            f"recover: the {g} back on the shoulder",
        ], 4, f"the {g} rises over the head and slams down in front of the body"
    # builder: dựng trạm vàng (trạm là hình riêng của bản đồ, không vẽ)
    return [
        "ready: hammer on the shoulder, building material on the back",
        "lift: the hammer raised off the shoulder",
        "wind-up: hammer high over the head",
        "swing: the hammer coming down",
        "IMPACT: the hammer strikes the structure being built just in front (a separate map sprite, do NOT draw it): "
        "the head stops in mid-air at chest height, a solid spark and a few wood / stone chips at the hit point",
        "recover: the hammer back on the shoulder",
    ], 5, "the hammer comes down on the unseen structure toward the viewer (front row) / away (back row)"


# ---------- Tấn công: đòn kỹ năng (theo skills.ts) ----------
def effects_en(sk: dict, fx: str) -> list[str]:
    """Hình ảnh của từng hiệu ứng kỹ năng (vẽ bằng khối pixel đặc của hệ). Đòn đánh: hiện ở chỗ trúng đòn; còn lại: quanh người."""
    spot = "on the impact spot" if sk["on"] == "strike" else "on the ground around the unit"
    src = "the impact" if sk["on"] == "strike" else "the unit"
    e = []
    if sk.get("stun"):
        e.append(f"a ring of small solid {fx} stars spinning at head height {spot} (stun)")
    if sk.get("slow"):
        e.append(f"heavy solid element clumps clinging {spot} (slow)")
    if sk.get("knock"):
        e.append(f"a solid curved force wave pushing outward from {src}, ground pebbles kicked outward (knockback)")
    if sk.get("dot"):
        e.append(f"small solid element pieces (burning / poison / bleeding) left stuck {spot} (damage over time)")
    if sk.get("sunder"):
        e.append(f"solid broken armour shards and a cracked rune breaking off {spot} (armour break)")
    if sk.get("drain"):
        e.append("solid element wisps flowing from the impact back into the unit's chest (life drain)")
    if sk.get("heal"):
        e.append("a bright solid healing glow wrapping the unit's body, a plus-shaped sparkle above the head (self heal)")
    if sk.get("mend"):
        e.append("a solid ring of healing light on the ground around the unit with plus-shaped sparkles rising (heals allies)")
    if sk.get("guard"):
        who = "a wide dome over the area" if sk.get("allies") else "a close shell around the body"
        e.append(f"a solid faceted element shield as {who}, edges bright (damage reduction)")
    if sk.get("haste"):
        who = "around the allies' area" if sk.get("allies") else "on the unit's legs"
        e.append(f"solid chevron arrows of element light {who}, a short element trail on the heels (haste)")
    if sk.get("summon"):
        s = sk["summon"]
        e.append(f"{s['count']} small solid silhouette ally {'unit' if s['count'] == 1 else 'units'} of the same civilization rising from an element portal on the ground (summon)")
    if sk.get("gold"):
        e.append("a burst of solid shiny gold coins and nuggets popping up (bonus gold)")
    if sk.get("dmg") and sk["on"] != "strike":
        e.append("a solid element blast ring hurting everything around (area damage)")
    if sk.get("area") and sk["on"] == "strike":
        e.append("a solid element splash ring spreading on the ground around the impact (hits nearby enemies)")
    return e


# Động tác tung hào quang (pulse) theo loại lính
PULSE_MOVE = {
    "spear": "the shield and weapon slammed down into the ground together",
    "healer": "the staff planted hard into the ground, the free palm raised",
    "banner": "the instrument played at full force, the flag snapping wide",
    "mage": "the staff thrust high overhead, the orb bursting",
    "giant": "the giant weapon slammed into the ground, knees bent",
    "sword": "the weapon swept in a wide flat arc in front of the body",
    "cavalry": "the mount rearing up on its hind legs, the lance raised high",
}


def skill_beats(code: str, u: dict) -> tuple[str, list[str], int, str, str]:
    """(tên kiểu, 6 khung nhìn ngang, khung bùng nổ, gợi ý trước / sau, mô tả kích hoạt) của đòn kỹ năng."""
    sk, a = u["skill"], u["arch"]
    fx = CIV[code]["name"] + " energy"
    eff = effects_en(sk, CIV[code]["name"])
    effs = "; ".join(eff) if eff else f"a burst of {fx}"
    on = sk["on"]
    base, hit, fb = attack_beats(code, u)
    if on == "strike":
        p = sk.get("power") or 1
        label = "CRITICAL HIT" if p >= 1.5 else "EMPOWERED STRIKE"
        beats = list(base)
        beats[1] = f"{beats[1]}, the weapon starting to glow with {fx}"
        beats[2] = f"{beats[2]}, the weapon now fully charged and wrapped in solid {fx}, the eyes flaring"
        beats[hit - 1] = f"{beats[hit - 1].split(':')[0]} ({label}): {beats[hit - 1].split(':', 1)[1].strip()}, the hit much bigger than a normal attack, a large solid {fx} burst at the impact"
        if hit < 6:
            beats[hit] = f"{beats[hit]}; the effect shows clearly: {effs}"
        how = "chí mạng" if label == "CRITICAL HIT" else "đòn cường hoá"
        return label, beats, hit, fb, how
    if on == "pulse":
        beats = [
            "ready: the idle pose",
            f"focus: the {gear_of(code, u)} raised, {fx} gathering around the body",
            "charge: the gathered energy at its brightest around the chest and weapon",
            f"RELEASE: {PULSE_MOVE.get(a, 'the weapon thrust high overhead')}, a big solid {fx} ring bursting out around the feet",
            f"spread: the ring at its widest; {effs}",
            "settle: the effect breaking into solid pieces touching the ground, the unit back to idle",
        ]
        return "AURA PULSE", beats, 4, "the ring bursts around the unit seen head-on (front row) / from behind (back row)", "hào quang"
    if on == "low":
        beats = [
            "wounded: the unit staggers, hunched, one knee bending, cloth torn",
            "kneel: down on one knee, the weapon planted, a crack of light in the chest",
            f"rally: the head snaps up, the eyes blazing, {fx} erupting from the body",
            f"SURGE: standing tall again, arms wide, a big solid {fx} burst around the whole body",
            f"empowered: {effs}",
            "ready: back in the guard pose, still glowing slightly brighter than normal",
        ]
        return "LAST STAND", beats, 4, "the unit staggers, kneels, then rises tall with a burst of energy around the body", "gượng dậy khi sắp chết"
    if on == "kill":
        beats = list(base[:hit]) + [
            f"FINISH: the enemy is defeated, the unit pulls the weapon back and stands tall, still facing forward, {fx} swirling into the body",
            f"EMPOWERED: {effs}",
            "ready: back in the attack stance, still glowing brighter than normal",
        ]
        beats = beats[:hit] + beats[hit:][: 6 - hit]
        while len(beats) < 6:
            beats.insert(hit + 1, f"flourish: the weapon raised high, the {fx} flaring")
        return "KILL TRIGGER", beats, hit, fb, "bùng lên khi hạ địch"
    if on == "death":
        beats = [
            "hit: the unit recoils from a fatal blow, body bending back",
            "fall: dropping to the knees, the weapon falling from the hand",
            f"crack: bright solid {fx} cracks opening across the body",
            f"BURST: the body bursts into a big solid {fx} explosion",
            f"after: {effs}",
            "fade: only small solid element pieces left on the ground where the unit stood",
        ]
        return "DEATH BURST", beats, 4, "a big burst of energy around the unit", "bùng nổ khi chết"
    if on == "haul":
        beats = [
            "ready: pickaxe on the shoulder, the gold sack full",
            "strike: the tool strikes the unseen mine in front, gold chips flying",
            f"RARE FIND: a big solid shining gem / gold chunk pops out of the unseen mine in front, {fx} sparkling",
            "catch: the miner catches it in the free hand",
            f"stash: drops it in the sack; {effs}",
            "proud: the sack bulging, the miner standing tall",
        ]
        return "LUCKY HAUL", beats, 3, fb, "chuyến vàng may mắn"
    if on == "built":
        beats = [
            "ready: hammer raised toward the finished station in front (a separate map sprite, do NOT draw it)",
            "strike: the hammer taps the station, a solid spark at the hit point",
            f"rune: a solid {fx} rune lighting up on the ground at the builder's feet",
            f"BLESS: a big solid {fx} ring bursting out along the ground",
            f"spread: {effs}",
            "done: the builder shoulders the hammer, the rune still glowing",
        ]
        return "STATION BLESSING", beats, 4, "the ring bursts around the post seen head-on (front row) / from behind (back row)", "ban phước trạm"
    raise ValueError(on)


def skill_vi(sk: dict) -> str:
    """Tóm tắt kỹ năng tiếng Việt (để người tạo ảnh biết đòn này làm gì)."""
    on = {
        "strike": f"đòn cường hoá mỗi {sk.get('every')} giây" if sk.get("every") else "đòn đánh nổ",
        "pulse": f"toả quanh mình mỗi {sk.get('every')} giây",
        "low": "khi máu dưới 40%",
        "kill": "khi hạ được địch",
        "death": "khi bị hạ",
        "haul": f"chuyến vàng đầu mỗi {sk.get('every')} giây",
        "built": "khi xây xong trạm",
    }[sk["on"]]
    p = []
    if sk.get("power") and sk["power"] != 1:
        p.append(f"×{sk['power']:g} sát thương")
    if sk.get("dmg"):
        p.append(f"{sk['dmg']} sát thương")
    if sk.get("stun"):
        p.append(f"choáng {sk['stun']:g}s")
    if sk.get("slow"):
        p.append(f"làm chậm {sk['slow']:g}s")
    if sk.get("knock"):
        p.append("hất lùi")
    if sk.get("dot"):
        p.append(f"{sk['dot']['dps']}/s trong {sk['dot']['dur']}s")
    if sk.get("sunder"):
        p.append(f"phá giáp {round(sk['sunder']['mult'] * 100)}%")
    if sk.get("drain"):
        p.append(f"hút máu {round(sk['drain'] * 100)}%")
    if sk.get("heal"):
        p.append(f"hồi {round(sk['heal'] * 100)}% máu")
    if sk.get("mend"):
        p.append(f"hồi {sk['mend']} máu cho quân quanh đó")
    if sk.get("guard"):
        p.append(f"giảm {round(sk['guard']['mult'] * 100)}% sát thương nhận" + (" cho đồng đội" if sk.get("allies") else ""))
    if sk.get("haste"):
        p.append(f"nhanh hơn {round(sk['haste']['mult'] * 100)}%" + (" cho đồng đội" if sk.get("allies") else ""))
    if sk.get("summon"):
        p.append(f"gọi {sk['summon']['count']} quân")
    if sk.get("gold"):
        p.append(f"+{sk['gold']} vàng")
    if sk.get("area"):
        p.append(f"vùng {sk['area']}")
    return f"{on}: " + ", ".join(p)




# ---------- 4. Bản đồ (mỏ vàng, công trình từng hệ, cây cối, nhà, đồ vật) ----------
MAP_VIEW = (
    "Top-down 2D pixel art in the classic 16-bit RPG view: seen from above at a steep angle, the top and the front face "
    "of every object visible (like the village of the world demo), light from the top-left."
)
MAP_STYLE = (
    "STYLE\n"
    "- Chunky pixel art: every art pixel a crisp square block, upscaled with nearest neighbour; same pixel scale as the "
    "units (a normal unit is about 36 px tall).\n"
    "- 3-tone shading (cool dark shadow, saturated mid-tone, warm highlight), bold 1px dark outline.\n"
    "- Glows are solid bright pixel clusters with a white-hot core; effects are solid pixel shapes attached to the object.\n"
    "- Background: fully transparent PNG (alpha) unless the item is a ground tile. No white, no checkerboard pattern."
)
MAP_AVOID = (
    "AVOID: text, labels, numbers, grid lines, borders, characters, stickmen, people, drop shadow outside the object, "
    "glow halo, bloom, blur, gradients, anti-aliasing, 1-pixel thin lines, floating particles, perspective tricks, "
    "isometric diamond tiles, cells of different sizes, realistic or painterly style, 3D render."
)


def map_prompt(what: str, layout: list[str], desc: list[str], extra_avoid: str = "") -> str:
    lines = [f"Pixel art game asset sheet: ONE image, {what}, every cell the same size, evenly spaced, nothing touching another cell.", MAP_VIEW]
    return "\n\n".join(
        [
            "\n".join(lines),
            "LAYOUT\n" + "\n".join(f"- {x}" for x in layout),
            "OBJECT\n" + "\n".join(f"- {x}" for x in desc),
            MAP_STYLE,
            MAP_AVOID + (f" Also avoid: {extra_avoid}." if extra_avoid else ""),
        ]
    )


# Đồ dùng chung (không theo hệ): (tên, file, prompt)
MAP_COMMON = [
    (
        "Mỏ vàng (thợ mỏ gõ vào đây)",
        "map/gold-mine.png",
        map_prompt(
            "a 3 x 4 grid of 12 equal cells (about 72 x 64 px native each) showing ONE gold mine",
            [
                "Row 1: idle, 4 looping frames: gold veins and the ore pile glint (a white glint pixel moving vein to vein).",
                "Row 2: being struck by a miner's pickaxe (the miner is NOT drawn), 4 frames: 1. normal. 2. HIT: the rock face "
                "flashes brighter, the mine shakes 1 px, a burst of solid gold chips at the front face. 3. one gold nugget pops "
                "up from the face, chips falling. 4. settling back to normal.",
                "Row 3: depletion stages left to right: full (big ore pile, thick veins), two-thirds, one-third, empty (dark "
                "veins, ore pile gone, a few cracks).",
            ],
            [
                "A rocky hill mine entrance: a dark tunnel mouth framed by thick wooden beams, set in grey-brown rock.",
                "Thick glowing gold veins running through the rock, a pile of gold ore nuggets beside the entrance, short mine-cart "
                "rails leaving the tunnel, one small wooden mine cart.",
                "The struck face (where pickaxes hit) is the lower front of the rock, at the height of a unit's waist.",
            ],
        ),
    ),
    (
        "Túi vàng rơi (thợ mỏ chết rơi ra)",
        "map/gold-sack.png",
        map_prompt(
            "a 1 x 4 row of 4 equal cells (about 16 x 16 px native each)",
            ["4 looping frames of one dropped gold sack lying on the ground: a glint pixel moves across the coins, the sack "
             "bounces 1 px in frame 1 only."],
            ["A small brown cloth sack with a golden drawstring, a few gold coins and nuggets spilling out in front of it."],
        ),
    ),
    (
        "Hình nộm tập đánh",
        "map/training-dummy.png",
        map_prompt(
            "a 2 x 4 grid of 8 equal cells (about 24 x 40 px native each) showing ONE training dummy",
            [
                "Row 1: idle, 4 looping frames: the straw tufts and the rope sway 1 px in the wind.",
                "Row 2: being hit (the attacker is NOT drawn), 4 frames: 1. normal. 2. HIT: flashes white-ish, tilts back 2 px, "
                "straw bits flying. 3. wobbles forward 1 px. 4. back to normal.",
            ],
            [
                "A straw training dummy on a wooden post with a crossbar as arms, a burlap sack head with stitched cross eyes, "
                "a rope tied around the waist and a red-and-white target painted on the chest.",
            ],
        ),
    ),
    (
        "Mặt đất: cỏ, đường đất, nước",
        "map/ground-tiles.png",
        map_prompt(
            "a 4 x 6 grid of 24 equal square ground tiles (24 x 24 px native each) that tile seamlessly",
            [
                "Row 1: 4 grass tile variants (plain grass, grass with tufts, grass with small flowers, grass with pebbles).",
                "Row 2: dirt path: 1 plain dirt tile, then edge tiles where dirt meets grass: top edge, bottom edge, left edge, "
                "right edge, and 1 inner-corner tile.",
                "Row 3: outer corners of the dirt path (top-left, top-right, bottom-left, bottom-right) and 2 more plain dirt variants.",
                "Row 4: pond water: 4 looping frames of one water tile with a moving light shimmer, then shore edge top and bottom.",
            ],
            [
                "Bright green grass with soft colour patches, warm brown packed dirt with small stones, clear blue water with a "
                "lighter shimmer.",
                "Every tile is fully opaque (no transparency) and its edges match the neighbouring tiles of the same kind.",
            ],
            "transparent tiles, visible seams",
        ),
    ),
    (
        "Cây, bụi, đá, hoa",
        "map/nature.png",
        map_prompt(
            "a 3 x 4 grid of 12 equal cells (about 48 x 64 px native each)",
            [
                "Row 1: 4 trees: round leafy tree, tall pine, fruit tree with small red apples, a dead bare tree.",
                "Row 2: 2 bushes (one with berries), 1 tall grass clump, 1 flower patch (red, yellow, white flowers).",
                "Row 3: 2 grey rocks of different sizes, 2 rocks with glowing gold ore veins (minable look).",
            ],
            [
                "Tree trunks start at the bottom centre of the cell, the canopy round and chunky, a small dark contact patch at the "
                "foot (inside the object outline).",
            ],
        ),
    ),
    (
        "Nhà làng",
        "map/houses.png",
        map_prompt(
            "a 1 x 3 row of 3 equal cells (about 96 x 96 px native each)",
            [
                "Cell 1: cottage with a golden straw thatch roof. Cell 2: house with a red clay tile roof. Cell 3: small "
                "storage shed with a canvas roof.",
            ],
            [
                "Light plaster walls with wooden frame beams, stone foundation, a wooden door, small windows with warm light, "
                "a chimney on the bigger houses.",
            ],
        ),
    ),
    (
        "Đồ vật trong làng",
        "map/props.png",
        map_prompt(
            "a 2 x 4 grid of 8 equal cells (about 40 x 40 px native each)",
            [
                "Row 1: stone well with a small roof and a bucket on a rope, wooden signpost with two arrow boards (no text), "
                "barrel, wooden crate.",
                "Row 2: pile of logs, wooden fence segment (horizontal), wooden fence segment (vertical), fence gate.",
            ],
            ["Warm brown wood, grey stone, iron bands on the barrel."],
        ),
    ),
]


def civ_structures() -> dict:
    """Mô tả trạm / tường / tượng riêng từng hệ, lấy từ element-prompts.md (phần sau 'Element: X.')."""
    out: dict = {}
    pat = re.compile(r"\*\*\d+\. (Tháp|Tường|Tượng nhà)[^*]*\*\* → lưu thành `docs/art/([a-z]+)/\d+-[a-z]+\.png`\n\n```\n(.+?)\n```", re.S)
    for kind, code, text in pat.findall(elem_src):
        m = re.search(r"Element: [A-Za-z]+\. (.+?)(?: Pennant colour| Glow colour)", text)
        out.setdefault(code, {})[{"Tháp": "tower", "Tường": "wall", "Tượng nhà": "monument"}[kind]] = m.group(1).strip()
    return out


def civ_map_prompts(code: str, st: dict) -> list[tuple[str, str, str]]:
    lk = LOOK[code]
    element, civ_name = lk["civ"].removesuffix(")").split(" (")
    colours = f"cloth / pennant colour {lk['cloth']}, glow colour {lk['glow']}"
    return [
        (
            "Trạm vàng (thợ xây dựng, có tháp bắn)",
            f"{code}/tower.png",
            map_prompt(
                "a 2 x 4 grid of 8 equal cells (about 40 x 64 px native each) showing ONE gold depot watchtower",
                [
                    "Row 1: build stages left to right: wooden scaffold and foundation, half built, almost done, complete.",
                    "Row 2: the complete tower shooting, 4 frames: 1. idle. 2. the arrow slit glows brighter. 3. a solid element "
                    "bolt leaves the slit (attached to the slit edge). 4. the glow fading back.",
                ],
                [
                    f"{civ_name} ({element} element) gold depot watchtower, about 1.4 times the height of a unit, tapering upward, "
                    "crenellated top, one tall glowing arrow slit, a small pennant on top, a few gold sacks at the foot.",
                    f"Theme: {st['tower']}",
                    f"Colours: {colours}.",
                ],
            ),
        ),
        (
            "Tường thành có cổng",
            f"{code}/wall.png",
            map_prompt(
                "a 2 x 4 grid of 8 equal cells (about 72 x 48 px native each) showing ONE wall segment",
                [
                    "Row 1: the gate opening, 4 frames: closed, opening, half open, fully open.",
                    "Row 2: damage states: intact, cracked, heavily damaged, broken rubble.",
                ],
                [
                    f"{civ_name} ({element} element) defensive wall segment with a double gate in the middle, about 1.4 times "
                    "the height of a unit.",
                    f"Theme: {st['wall']}",
                    f"Colours: {colours}.",
                ],
            ),
        ),
        (
            "Tượng nhà (mục tiêu phải phá để thắng)",
            f"{code}/monument.png",
            map_prompt(
                "a 2 x 4 grid of 8 equal cells (about 64 x 112 px native each) showing ONE home monument",
                [
                    "Row 1: idle, 4 looping frames: the element glow pulses, moving parts turn or flicker slowly.",
                    "Row 2: damage states: intact, cracked, heavily damaged, destroyed (broken base, glow almost out).",
                ],
                [
                    f"{civ_name} ({element} element) home monument, the main base objective, about three times the height "
                    "of a unit, on a low stone plinth.",
                    f"Theme: {st['monument']}",
                    f"Colours: {colours}.",
                ],
            ),
        ),
    ]


# ---------- Ghi 4 file ----------
TOP = "docs/art/topdown"
FILES = {
    "idle": HERE / "1-dung-yen.md",
    "move": HERE / "2-di-chuyen.md",
    "attack": HERE / "3-tan-cong.md",
    "map": HERE / "4-ban-do.md",
}
COMMON = [
    "> Sinh tự động bởi `docs/art/prompts/gen_prompts.py` (dữ liệu lấy thẳng từ `packages/core`). Sửa ở script rồi chạy lại",
    "> `python3 docs/art/prompts/gen_prompts.py`, đừng sửa tay file này.",
    "",
    "- Ảnh lưu theo hệ ở `docs/art/topdown/<hệ>/` (tên ghi cạnh từng prompt), cạnh `rigs.json` của hệ đó.",
    "- Mỗi kiểu chuyển động **một ảnh 3 hàng** (hàng 1 ngang quay **trái**, hàng 2 trước, hàng 3 sau): `<lính>-idle.png`,",
    "  `<lính>-walk.png`, `<lính>-run.png`, `<lính>-attack.png`, `<lính>-skill.png`.",
    "- Luôn **đính kèm bảng 4 mặt** (`<lính>-views.png`, tạo ở file 1) của chính lính đó để giữ đúng màu, tóc, đồ, cỡ pixel.",
    "- `build_topdown_sprite.py` tự nhận ảnh 3 hàng `<lính>-<kiểu>.png` và các ảnh `<lính>-<kiểu>-side|front|back.png` có đủ 3",
    "  hướng thành `anim.<kiểu>`. Nhìn ngang AI lỡ vẽ quay phải thì khai `\"flip\": [\"left\"]` cho kiểu đó trong `rigs.json`.",
    "- Xem trước khi dùng: đủ khung, các khung không chạm nhau, cùng cỡ, chân cùng một vạch đất, **mọi khung cùng một hướng**,",
    "  nền trong suốt thật (không phải ô caro vẽ giả). Sai thì tạo lại, đừng cố cứu.",
    "",
]


def toc(rows: list[str]) -> list[str]:
    return ["| Hệ | Số | Mục |", "|---|---|---|", *rows, ""]


hdr = {
    "idle": [
        "# 1. Đứng yên — bảng 4 mặt + đứng yên 3 hướng trong một ảnh (144 lính)",
        "",
        *COMMON,
        "Mỗi lính 2 prompt:",
        "",
        "1. **Bảng 4 mặt** (trên, ngang quay trái, trước, sau), 1 hàng × 4 ô, lưu `<lính>-views.png`. Không cần đính kèm gì;",
        "   đây là mẫu gốc, mọi prompt khác đính kèm ảnh này. Tạo xong mới làm các prompt sau.",
        "2. **Đứng yên 3 hướng** trong **một ảnh** 3 hàng × 6 khung (hàng 1 ngang quay trái, hàng 2 trước, hàng 3 sau), lưu",
        "   `<lính>-idle.png` → `anim.idle`. Nhịp thở rõ (vai, ngực lên xuống), vũ khí nhích 1 px theo nhịp thở (không giơ,",
        "   không vung), áo / khăn bay theo cơn gió nhẹ rồi **chậm dần** lặng xuống.",
        "",
    ],
    "move": [
        "# 2. Di chuyển — đi + chạy nhanh, mỗi kiểu một ảnh 3 hướng (144 lính)",
        "",
        *COMMON,
        "Mỗi lính 2 prompt, mỗi prompt **một ảnh 3 hàng × 6 khung** (hàng 1 ngang quay trái, hàng 2 trước, hàng 3 sau), lặp lại,",
        "đứng tại chỗ (không trượt ngang khung); dáng mang chất riêng của hệ:",
        "",
        "1. **Đi** (di chuyển bình thường): luôn một chân chạm đất, nhún tối đa 1 px (thích khách rón rén cúi thấp, thú cưỡi",
        "   nước kiệu, máy lăn chậm, tinh linh / bóng ma / tiên cá trôi nhấp nhô, thuỷ quái bò bằng xúc tu). Lưu `<lính>-walk.png`",
        "   → `anim.walk`.",
        "2. **Chạy nhanh** (giữ Shift): bám đất, **không nhảy** — người đổ về trước, sải chân dài, tay đánh mạnh, vải bay ra sau",
        "   (thích khách lướt thấp, thú cưỡi phi nước đại, khiên binh xông sau khiên, khổng lồ lao rầm rập, máy bị đẩy rung bánh).",
        "   Lưu `<lính>-run.png` → `anim.run`.",
        "",
        "Hàng trước / sau đi kiểu nhân vật RPG 16-bit đi xuống / đi lên màn hình: chân nhấc lên hạ xuống, người luôn chính diện.",
        "",
    ],
    "attack": [
        "# 3. Tấn công — đòn thường + đòn kỹ năng, mỗi đòn một ảnh 3 hướng (144 lính)",
        "",
        *COMMON,
        "Mỗi lính 2 prompt, mỗi prompt **một ảnh 3 hàng × 6 khung** (hàng 1 ngang quay trái, hàng 2 trước, hàng 3 sau):",
        "",
        "1. **Đòn thường** theo loại lính và vũ khí thật trong game (chém, đâm hai nhát, bắn cung, ném lao, nổ súng,",
        "   phóng máy…). Lưu `<lính>-attack.png` → `anim.attack`.",
        "2. **Đòn kỹ năng** theo đúng kỹ năng riêng của lính trong `packages/core/src/skills.ts`, hiệu ứng theo hệ:",
        "   - kỹ năng đòn đánh (`strike`): **chí mạng** (×1.5 trở lên) hoặc **đòn cường hoá**: vũ khí tụ năng lượng hệ, khung ra đòn to hơn",
        "     đòn thường, kèm hiệu ứng (choáng, làm chậm, hất lùi, thiêu / độc / chảy máu, phá giáp, hút máu, lan vùng…);",
        "   - hào quang (`pulse`), gượng dậy khi sắp chết (`low`), bùng lên khi hạ địch (`kill`), nổ / gọi quân khi chết (`death`),",
        "     chuyến vàng may mắn (`haul`), ban phước trạm (`built`).",
        "   Lưu `<lính>-skill.png` → `anim.skill`. Khung ra đòn ghi ở từng mục phải khớp mốc ra đòn của game.",
        "",
        "Hướng trước / sau: chân đứng vững, chỉ tay, vũ khí, áo và hiệu ứng chuyển động, đòn đánh diễn ra ngay trước thân người.",
        "Thợ mỏ gõ vào mỏ vàng, thợ xây gõ vào trạm: **không vẽ mỏ / trạm** trong ảnh lính (chúng có prompt riêng ở",
        "`4-ban-do.md`), chỉ vẽ dụng cụ dừng ở chỗ chạm cùng mảnh vàng / tia lửa bắn ra.",
        "",
    ],
}
rows = {"idle": [], "move": [], "attack": [], "map": []}
body = {"idle": [], "move": [], "attack": [], "map": []}
hdr["map"] = [
    "# 4. Bản đồ — mỏ vàng, công trình từng hệ, cây cối, nhà, đồ vật",
    "",
    "> Sinh tự động bởi `docs/art/prompts/gen_prompts.py`. Sửa ở script rồi chạy lại, đừng sửa tay file này.",
    "",
    "- Cùng cỡ pixel với lính (lính thường cao khoảng 36 px), nhìn từ trên kiểu RPG 16-bit như làng trong demo `#/world`.",
    "- Đồ dùng chung lưu ở `docs/art/topdown/map/`; công trình riêng từng hệ lưu ở `docs/art/topdown/<hệ>/`.",
    "- Mỏ vàng là đích của thợ mỏ: hàng 2 (bị gõ) khớp với khung ra đòn của thợ mỏ ở file 3 (thợ mỏ không vẽ mỏ).",
    "- Xem trước khi dùng: đủ hàng / ô, các ô cùng cỡ, nền trong suốt thật (trừ ô mặt đất). Sai thì tạo lại.",
    "",
]
n = 0
for sec in sections:
    title = sec.splitlines()[0][3:].strip()
    code = re.search(r"docs/art/demo/([a-z]+)\.png", sec).group(1)
    units = re.findall(r"\*\*(.+?)\*\* \(×([\d.]+)\)[^\n]*\n(?:- [^\n]*\n)*```\n\[C\] (.+?)\n```", sec)
    assert len(units) == 12, (code, len(units))
    anchor = re.sub(r"[^a-z0-9]+", "-", f"{n // 12 + 1} {code}").strip("-")
    for f in rows:
        rows[f].append(f"| {title} | {n + 1}–{n + 12} | [{code}](#{anchor}) |")
        body[f] += ["", f'<a id="{anchor}"></a>', "", f"## {title}", ""]
    c = CIV[code]
    body["move"] += [f"Dáng đi của hệ: *{c['move']}*.", ""]
    body["attack"] += [f"Hiệu ứng của hệ: *{c['fx']}*.", ""]
    for i, ((_, _, ctext), u) in enumerate(zip(units, GAME[code]), 1):
        n += 1
        key = keys[code][i]
        assert key == u["arch"], (code, i, key, u["arch"])
        name_en = re.search(r'Unit: [^"]*"([^"]+)"', ctext).group(1)
        cloth = re.search(r"Cloth: ([^.]+)\.", ctext).group(1)
        size, slices = size_of(key, u["scale"])
        look = character(code, u, name_en, cloth, size)
        base = f"{TOP}/{code}/{SPRITE.get(key, key)}"
        views = f"`{base}-views.png`"
        head = f"**{n}. {u['name']}** (×{u['scale']:g})"

        def entry(label: str, file: str, info: str, text: str, attach: bool = True) -> list[str]:
            att = f"đính kèm {views}, " if attach else ""
            return [f"*{label}* → {att}lưu thành `{file}` ({info})", "", "```", text, "```", ""]

        # 1. Bảng 4 mặt + đứng yên 3 hướng
        body["idle"] += [head, ""] + entry("Bảng 4 mặt", f"{base}-views.png", "1 hàng × 4 ô", views_text(code, key, size, look), False)
        body["idle"] += entry("Đứng yên 3 hướng", f"{base}-idle.png", "3 hàng × 6 khung: ngang / trước / sau", idle_text(code, u, size, slices, look))

        # 2. Di chuyển: đi + chạy, 3 hướng mỗi kiểu
        body["move"] += [head, ""]
        for kind in ("walk", "run"):
            body["move"] += entry(f"{STRIP_VI[kind].capitalize()} 3 hướng", f"{base}-{kind}.png", "3 hàng × 6 khung: ngang / trước / sau", move_text(code, u, size, slices, look, kind))

        # 3. Tấn công: đòn thường + kỹ năng, 3 hướng mỗi kiểu
        beats, hit, fb = attack_beats(code, u)
        sk = u["skill"]
        label, sbeats, shit, sfb, how = skill_beats(code, u)
        hits = "khung 3 và 5" if u["arch"] == "ninja" and hit == 3 else f"khung {hit}"
        special = [
            f"SPECIAL MOVE: clearly stronger and flashier than the normal attack, coloured with {c['fx']}.",
            "Effects may reach the frame edges but stay solid pixel shapes touching the unit, the weapon or the ground line.",
        ]
        body["attack"] += [f"{head} — kỹ năng **{sk['name']}** ({sk['en']}): {skill_vi(sk)}", ""]
        body["attack"] += entry(
            "Đòn thường 3 hướng", f"{base}-attack.png", f"3 hàng × 6 khung: ngang / trước / sau, ra đòn {hits}",
            action_text(code, u, slices, look, "ATTACK", beats, hit, fb, 1.0, []),
        )
        body["attack"] += entry(
            f"Kỹ năng: {sk['name']} ({how}) 3 hướng", f"{base}-skill.png", f"3 hàng × 6 khung: ngang / trước / sau, bùng nổ khung {shit}",
            action_text(code, u, slices, look, f"SKILL ({label}: \"{sk['en']}\")", sbeats, shit, sfb, 1.25, special),
        )

assert n == 144, n

# Bản đồ: đồ dùng chung + 3 công trình × 12 hệ
body["map"] += ["", "## Đồ dùng chung", ""]
rows["map"].append("| Đồ dùng chung | — | [chung](#chung) |")
for name, file, prompt in MAP_COMMON:
    body["map"] += [f"**{name}** → lưu thành `{TOP}/{file}`", "", "```", prompt, "```", ""]
STRUCT = civ_structures()
for k, sec in enumerate(sections, 1):
    title = sec.splitlines()[0][3:].strip()
    code = re.search(r"docs/art/demo/([a-z]+)\.png", sec).group(1)
    anchor = f"{k}-{code}"
    rows["map"].append(f"| {title} | — | [{code}](#{anchor}) |")
    body["map"] += ["", f'<a id="{anchor}"></a>', "", f"## {title}", ""]
    for name, file, prompt in civ_map_prompts(code, STRUCT[code]):
        body["map"] += [f"**{name}** → lưu thành `{TOP}/{file}`", "", "```", prompt, "```", ""]
body["map"].insert(1, '<a id="chung"></a>')

for f, path in FILES.items():
    path.write_text("\n".join(hdr[f] + toc(rows[f]) + body[f]).rstrip() + "\n", encoding="utf-8")
    print(f"{path.relative_to(repo)}: " + ("bản đồ" if f == "map" else f"{n} lính"))
