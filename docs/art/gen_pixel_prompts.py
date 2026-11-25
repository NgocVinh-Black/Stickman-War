"""Sinh docs/art/pixel-prompts.md: 144 prompt bảng 4 mặt pixel art cho sprite stacking,
dựa trên [B] (hệ) và [C] (lính) trong docs/art/unit-prompts.md."""

import re
import sys
from pathlib import Path

repo = Path(sys.argv[1])
src = (repo / "docs/art/unit-prompts.md").read_text(encoding="utf-8")
elem_src = (repo / "docs/art/element-prompts.md").read_text(encoding="utf-8")

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

# Kích thước lưới + số lát theo từng loại lính
SIZE = {
    "default": ("about 20 x 20 px footprint, about 36 px tall", 36),
    "ninja": ("about 18 x 18 px footprint, about 32 px tall", 32),
    "spear": ("about 22 x 22 px footprint, about 40 px tall", 40),
    "cavalry": ("about 22 px wide x 44 px long footprint (the mount's length runs along the TOP view's vertical axis), about 44 px tall including the rider", 44),
    "catapult": ("about 28 px wide x 44 px long footprint, about 40 px tall", 40),
    "giant": ("about 36 x 36 px footprint, about 72 px tall", 56),
}
EXTRA = {
    "cavalry": "TOP view: the mount's head points DOWN. SIDE view: the mount faces LEFT. Rider sits on the mount's centre line; the mount is a dark silhouette with glowing pixel eyes, legs 3 pixels thick. ",
    "catapult": "TOP view: the throwing end points DOWN. The stickman operator stands directly behind the machine on its centre line, not beside it, so the whole unit stays centred. Machine parts at least 3 pixels thick. ",
    "giant": "Much larger and bulkier stickman, limbs 5-6 pixels thick. ",
    "banner": "The flag is a solid cloth panel at least 3 pixels thick, its pole upright beside the body. ",
    "archer": "Draw the bow upright close in front of the chest, bow and string at least 2 pixels thick. ",
    "spear": "Instead of thrusting it far forward, hold the spear angled upward close beside the body, shaft 2-3 pixels thick. ",
}
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
    "đưa thẳng vào `views_to_slices.py` (không cần tách nền) để khắc thành dải lát (slice strip) rồi render giả 3D xoay được. Sửa lính / hệ ở `unit-prompts.md` thì chạy lại `python3 docs/art/gen_pixel_prompts.py .`",
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
    for i, (name, scale, c) in enumerate(units, 1):
        n += 1
        key = keys[code][i]
        size, slices = SIZE.get(key, SIZE["default"])
        prompt = A.format(size=size) + " Element: " + b.removeprefix("Element: ") + " " + c + " " + (("For sprite stacking: " + EXTRA[key]) if key in EXTRA else "") + AVOID
        prompt = re.sub(r"\s+", " ", prompt).strip()
        base = f"docs/art/pixel/{code}/{i:02d}-{key}"
        body += [
            f"**{n}. {name}** (×{scale}) → lưu thành `{base}-views.png` · khắc `--slices {slices} --top-nose down`",
            "",
            "```",
            prompt,
            "```",
            "",
        ]

assert n == 144, n
(repo / "docs/art/pixel-prompts.md").write_text("\n".join(out + body).rstrip() + "\n", encoding="utf-8")
print("wrote", n)
