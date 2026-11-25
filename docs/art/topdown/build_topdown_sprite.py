"""Nhân vật cho demo thế giới nhìn từ trên (top-down 2D): cắt 3 ô FRONT / BACK / SIDE của bảng 4 góc
(TOP, SIDE, FRONT, BACK) về đúng lưới pixel gốc, dựng 4 khung bước đi cho mỗi hướng.

Hướng: xuống = FRONT, lên = BACK, trái = SIDE (ảnh quay mặt sang trái), phải = SIDE lật gương lúc vẽ.

Chạy (Python 3 + Pillow + NumPy):
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-miner-views.png apps/web/public/art/topdown light-miner
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-warrior-views.png apps/web/public/art/topdown light-warrior
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-archer-views.png apps/web/public/art/topdown light-archer
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-assassin-views.png apps/web/public/art/topdown light-assassin
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-spearton-views.png apps/web/public/art/topdown light-spearton
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-cavalry-views.png apps/web/public/art/topdown light-cavalry
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-healer-views.png apps/web/public/art/topdown light-healer
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-mage-views.png apps/web/public/art/topdown light-mage
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-drummer-views.png apps/web/public/art/topdown light-drummer
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-giant-views.png apps/web/public/art/topdown light-giant
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-catapult-views.png apps/web/public/art/topdown light-catapult
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-builder-views.png apps/web/public/art/topdown light-builder

rig "anim" = dải khung đòn đánh vẽ sẵn cho từng hướng (xem build_anim; như light-giant: nện chuỳ).
rig "sample": "median" = thu nhỏ theo trung vị từng ô (ảnh vẽ to hơn cỡ lính khác, như light-mage).

Ảnh nền trắng phẳng hoặc PNG nền trong suốt đều được (ảnh có nền ô caro vẽ sẵn — như light-cavalry — phải bỏ nền
thành trong suốt trước: loang từ mép qua các điểm xám ít bão hoà).

Khung xương từng nhân vật (chân, tay cầm vũ khí, điểm xoay, góc vung) khai ở rigs.json cùng thư mục.

Ra: <tên>.png gồm 9 hàng, mỗi hàng 4 khung cùng cỡ:
  0-2  đi bộ: xuống, lên, trái
  3-5  đi bộ nhưng không có tay vũ khí (thân, chỗ tay che đã tô lại) — dùng lúc đánh
  6-8  chỉ tay vũ khí (khung đầu) — màn chơi xoay quanh điểm vai lúc đánh;
       khung thứ hai: khiên (nếu rig có `shield`) — lúc đánh màn chơi giơ khiên lên theo `shieldRaise`
<tên>.json: cỡ khung, điểm chân, số hàng chân, điểm xoay + góc vung của tay vũ khí.
"""

import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

def remove_bg(rgb: np.ndarray, tol=30) -> np.ndarray:
    """Nền trắng phẳng → trong suốt (loang từ mép ảnh để không ăn vào màu sáng bên trong hình)."""
    h, w = rgb.shape[:2]
    near = np.abs(rgb.astype(int) - rgb[0, 0].astype(int)).sum(-1) <= tol * 3
    seen = np.zeros((h, w), bool)
    stack = [(0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)]
    while stack:
        y, x = stack.pop()
        if 0 <= y < h and 0 <= x < w and near[y, x] and not seen[y, x]:
            seen[y, x] = True
            stack += [(y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)]
    return np.dstack([rgb, np.where(seen, 0, 255).astype(np.uint8)])


def find_grid(im: np.ndarray, lo=9.0, hi=12.0):
    """Tìm cỡ ô và pha lưới pixel nghệ thuật: lấy mẫu tâm ô lệch ít nhất so với điểm lân cận trong ô."""
    best = None
    g = im.astype(int)
    for px in np.arange(lo, hi + 0.01, 0.05 if hi - lo < 1 else 0.1):
        for ph in np.arange(0, px, 0.5):
            xs = np.arange(ph + px / 2, im.shape[1] - 3, px).astype(int)
            ys = np.arange(ph + px / 2, im.shape[0] - 3, px).astype(int)
            c = g[np.ix_(ys, xs)]
            err = sum(np.abs(c - g[np.ix_(ys + dy, xs + dx)]).mean() for dy, dx in ((2, 2), (-2, -2), (2, -2), (-2, 2)))
            if best is None or err < best[0]:
                best = (err, px, ph)
    return best[1], best[2]


def clean_halo(v: np.ndarray) -> np.ndarray:
    """Bỏ quầng trắng sót lại từ nền ở mép hình."""
    v = v.copy()
    for _ in range(2):
        solid = v[..., 3] > 0
        p = np.pad(solid, 1)
        edge = solid & ~(p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:])
        rgb = v[..., :3].astype(int)
        pale = (rgb.min(-1) > 165) & (rgb.max(-1) - rgb.min(-1) < 60)
        v[edge & pale] = 0
    return v


def median_cells(rgba: np.ndarray, px: float, ph: float) -> np.ndarray:
    """Thu nhỏ theo trung vị từng ô (thay vì lấy 1 điểm giữa ô): dùng khi ô lưới to hơn pixel vẽ gốc (ảnh vẽ quá to so
    với lính khác) — giữ viền và mảng màu liền, không lốm đốm."""
    h, w = rgba.shape[:2]
    ey = np.arange(ph, h + px, px).astype(int)
    ex = np.arange(ph, w + px, px).astype(int)
    out = np.zeros((len(ey) - 1, len(ex) - 1, 4), np.uint8)
    for j in range(len(ey) - 1):
        for i in range(len(ex) - 1):
            cell = rgba[ey[j] : ey[j + 1], ex[i] : ex[i + 1]].reshape(-1, 4)
            solid = cell[cell[:, 3] > 128]
            if len(solid) * 2 > len(cell):
                out[j, i, :3] = np.median(solid[:, :3], axis=0)
                out[j, i, 3] = 255
    return out


def load_views(path: str, grid=(9.0, 12.0), median=False):
    rgba = np.array(Image.open(path).convert('RGBA'))
    alpha = rgba[..., 3]
    transparent = (alpha == 0).mean() > 0.2  # ảnh nền trong suốt: dùng thẳng kênh alpha, không loang nền
    # Dò lưới trên ảnh đã ghép lên nền trắng (viền đen nổi rõ)
    k = alpha[..., None].astype(float) / 255
    im = (rgba[..., :3] * k + 255 * (1 - k)).astype(np.uint8)
    px, ph = find_grid(im, *grid)
    xs = np.arange(ph + px / 2, im.shape[1], px).astype(int)
    ys = np.arange(ph + px / 2, im.shape[0], px).astype(int)
    if transparent and median:
        small = median_cells(rgba, px, ph)
    elif transparent:
        small = rgba[np.ix_(ys, xs)].copy()
        small[..., 3] = np.where(small[..., 3] > 128, 255, 0)
        small[small[..., 3] == 0] = 0
    else:
        small = remove_bg(im[np.ix_(ys, xs)])
    a = small[..., 3] > 0
    cols = np.nonzero(a.any(0))[0]
    runs, s, p = [], cols[0], cols[0]
    for c in cols[1:]:
        if c > p + 2:
            runs.append((s, p))
            s = c
        p = c
    runs.append((s, p))
    views = []
    for x0, x1 in runs[1:4]:  # bỏ ô TOP; còn SIDE, FRONT, BACK
        rows = np.nonzero(a[:, x0 : x1 + 1].any(1))[0]
        views.append(clean_halo(small[rows[0] : rows[-1] + 1, x0 : x1 + 1]))
    side, front, back = views
    print(f'lưới {px:.1f}px pha {ph}: side {side.shape[:2]} front {front.shape[:2]} back {back.shape[:2]}')
    return front, back, side


def leg_masks(v: np.ndarray, rig: dict):
    """Mặt nạ 2 chân theo khung xương (rigs.json): từ hàng legTop xuống đáy, trong khoảng cột của từng chân."""
    h, w = v.shape[:2]
    masks = []
    for x0, x1 in rig['legs']:
        m = np.zeros((h, w), bool)
        m[rig['legTop'] :, x0 : x1 + 1] = True
        masks.append(m & (v[..., 3] > 0))
    return masks


def arm_mask(v: np.ndarray, rig: dict, legs) -> np.ndarray:
    """Vũ khí + bàn tay: các hình chữ nhật trong rig, trừ phần chân."""
    m = np.zeros(v.shape[:2], bool)
    for x0, y0, x1, y1 in rig['arm']:
        m[y0 : y1 + 1, x0 : x1 + 1] = True
    # Đoạn thẳng dày w (cán cuốc chạy chéo qua thân)
    h, w = m.shape
    for x0, y0, x1, y1, lw in rig.get('lines', []):
        n = int(max(abs(x1 - x0), abs(y1 - y0))) * 2 + 1
        for t in np.linspace(0, 1, n):
            cx, cy = x0 + (x1 - x0) * t, y0 + (y1 - y0) * t
            r = lw / 2
            m[max(0, int(cy - r + 0.5)) : min(h, int(cy + r + 0.5)), max(0, int(cx - r + 0.5)) : min(w, int(cx + r + 0.5))] = True
    if '_toolMask' in rig:  # công cụ ghép từ góc nhìn khác (xem paste_tool)
        m |= rig['_toolMask']
    # keep: các hình chữ nhật luôn thuộc thân (vd. cái đầu nằm đè lên cán chùy vác sau gáy)
    for x0, y0, x1, y1 in rig.get('keep', []):
        m[y0 : y1 + 1, x0 : x1 + 1] = False
    for lm in legs:
        m &= ~lm
    return m & (v[..., 3] > 0)


def fill_along(arm: np.ndarray, rig: dict) -> np.ndarray:
    """Dựng lại đoạn vũ khí bị che trong vùng `keep` (vd. cán chùy vác sau gáy): mỗi điểm trong dải `lines` thuộc
    vùng keep lấy màu điểm vũ khí gần nhất dọc theo trục vũ khí (vũ khí hình trụ đều nên chép dọc trục là liền)."""
    arm = arm.copy()
    h, w = arm.shape[:2]
    keep = np.zeros((h, w), bool)
    for x0, y0, x1, y1 in rig.get('keep', []):
        keep[y0 : y1 + 1, x0 : x1 + 1] = True
    solid = arm[..., 3] > 0
    for x0, y0, x1, y1, lw in rig.get('lines', []):
        ln = max(1e-6, ((x1 - x0) ** 2 + (y1 - y0) ** 2) ** 0.5)
        ux, uy = (x1 - x0) / ln, (y1 - y0) / ln
        for y, x in zip(*np.nonzero(keep)):
            # chỉ trong dải quanh trục, nằm giữa hai đầu đoạn thẳng
            t = (x - x0) * ux + (y - y0) * uy
            d = abs((x - x0) * uy - (y - y0) * ux)
            if d > lw / 2 or t < 0 or t > ln or solid[y, x]:
                continue
            for k in range(1, 40):
                hit = None
                for sgn in (1, -1):
                    yy, xx = int(round(y + sgn * k * uy)), int(round(x + sgn * k * ux))
                    if 0 <= yy < h and 0 <= xx < w and solid[yy, xx] and not keep[yy, xx]:
                        hit = (yy, xx)
                        break
                if hit:
                    arm[y, x] = arm[hit]
                    break
    return arm


def mirror_head(body: np.ndarray, rig: dict) -> np.ndarray:
    """Dựng lại phần đầu bị vũ khí đè trong ảnh gốc (lớp thân lúc đánh, vũ khí đã tách đi): mỗi mục mirrorHead
    {rect: [x0, y0, x1, y1], cx: cột giữa đầu, over: true / false} lấy nửa đầu bên kia lật gương qua cột cx;
    over = false chỉ lấp điểm trống, over = true ghi đè cả vùng (kể cả trong suốt) — dùng khi trong vùng còn sót mảnh
    vũ khí lẫn với tóc."""
    body = body.copy()
    h, w = body.shape[:2]
    for m in rig.get('mirrorHead', []):
        x0, y0, x1, y1 = m['rect']
        src = body.copy()
        for y in range(max(0, y0), min(h, y1 + 1)):
            for x in range(max(0, x0), min(w, x1 + 1)):
                sx = int(round(2 * m['cx'] - x))
                if not 0 <= sx < w:
                    continue
                if m.get('over') or body[y, x, 3] == 0:
                    body[y, x] = src[y, sx]
    return body


def graft(target: np.ndarray, src_views: dict, g: dict) -> np.ndarray:
    """Dán mảnh `rect` của ô `from` vào `target` tại `at` (ép ngang còn `width` px, lật `flipX`). `dim`: [x0, y0, x1, y1]
    trong mảnh — điểm sáng ở đó tô thành màu tối của thân (vd. mượn đầu nhìn trước làm đầu nhìn sau: tắt đôi mắt).
    ellipse: chỉ lấy phần nằm trong elip nội tiếp mảnh (lấy riêng cái đầu, không kéo theo vai / nền quanh đầu)."""
    x0, y0, x1, y1 = g['rect']
    piece = src_views[g.get('from', 'down')][y0 : y1 + 1, x0 : x1 + 1].copy()
    if g.get('ellipse'):
        ph, pw = piece.shape[:2]
        yy, xx = np.mgrid[0:ph, 0:pw]
        out_e = ((xx - (pw - 1) / 2) / (pw / 2)) ** 2 + ((yy - (ph - 1) / 2) / (ph / 2)) ** 2 > 1
        piece[out_e] = 0
    if g.get('unblue'):  # viên đá xanh trên trán (đầu nhìn trước) không có ở gáy: tô thành màu tóc
        rgb = piece[..., :3].astype(int)
        blue = (piece[..., 3] > 0) & (rgb[..., 2] > rgb[..., 0] + 20)
        piece[blue, :3] = (224, 160, 32)
    if g.get('dim'):
        a0, b0, a1, b1 = g['dim']
        part = piece[b0 : b1 + 1, a0 : a1 + 1]
        bright = (part[..., 3] > 0) & (part[..., :3].astype(int).sum(-1) > 330)
        part[bright, :3] = (26, 18, 12)
    if g.get('width'):
        piece = np.array(Image.fromarray(piece).resize((g['width'], piece.shape[0]), Image.NEAREST))
    if g.get('flipX'):
        piece = piece[:, ::-1]
    ax, ay = g['at']
    ph, pw = piece.shape[:2]
    ph, pw = min(ph, target.shape[0] - ay), min(pw, target.shape[1] - ax)
    out = target.copy()
    region = out[ay : ay + ph, ax : ax + pw]
    sel = piece[:ph, :pw, 3] > 0
    region[sel] = piece[:ph, :pw][sel]
    return out


def free_mask(v: np.ndarray, rig: dict, fill: bool) -> np.ndarray:
    """Phần tay bỏ khỏi lớp thân dùng lúc đánh (các hình chữ nhật `free` trong rig): bàn tay kia buông ở hông và
    đoạn cánh tay cầm vũ khí — lúc đánh màn chơi vẽ lại cả hai cánh tay vung theo vũ khí.
    fill: lấy các ô cần tô lại (mặc định); ô có số thứ 5 = 0 (nằm ở mép người) thì chỉ xoá, không tô."""
    m = np.zeros(v.shape[:2], bool)
    for r in rig.get('free', []):
        if (len(r) < 5 or r[4]) == fill:
            x0, y0, x1, y1 = r[:4]
            m[y0 : y1 + 1, x0 : x1 + 1] = True
    return m & (v[..., 3] > 0)


def inpaint(body: np.ndarray, hole: np.ndarray) -> np.ndarray:
    """Tô lại chỗ tay vũ khí che lên thân: điểm trống nằm kẹp giữa thân (ngang hoặc dọc, trong R px) lấy màu điểm thân gần nhất.
    Tô nhiều lượt từ mép vào để lấp kín cả vùng rộng (bàn tay to của nhân vật vẽ lớn)."""
    body = body.copy()
    h, w = hole.shape
    R = 10
    for _ in range(8):
        solid = body[..., 3] > 0
        for y, x in zip(*np.nonzero(hole & ~solid)):
            best = None
            for dy, dx in ((0, -1), (0, 1), (-1, 0), (1, 0)):
                for k in range(1, R):
                    yy, xx = y + dy * k, x + dx * k
                    if not (0 <= yy < h and 0 <= xx < w):
                        break
                    if solid[yy, xx]:
                        if best is None or k < best[0]:
                            best = (k, yy, xx, (dy, dx))
                        break
            if best is None:
                continue
            dy, dx = best[3]
            # phải có thân ở cả phía đối diện thì mới là lỗ bên trong (không tô ra ngoài viền)
            opp = any(
                0 <= y - dy * k < h and 0 <= x - dx * k < w and solid[y - dy * k, x - dx * k] for k in range(1, R)
            )
            if opp:
                body[y, x] = body[best[1], best[2]]
    return body


def paste_tool(side: np.ndarray, side_rig: dict, tool: dict, target: np.ndarray):
    """Ghép công cụ (vùng tay của ô nguồn — mặc định SIDE: cuốc + bàn tay) sang góc nhìn không vẽ công cụ.
    tool: from (ô nguồn: left / down / up), rot (số lần xoay 90° ngược chiều kim đồng hồ, như np.rot90), flipX,
    at = điểm bàn tay trong ô đích. Phần công cụ thò quá đáy ô đích bị cắt bỏ.
    Trả về ô đích đã ghép (có thể nới lề trái / phải / trên), mặt nạ công cụ, độ nới trái, độ nới trên."""
    m = arm_mask(side, side_rig, leg_masks(side, side_rig))
    ys, xs = np.nonzero(m)
    y0, y1, x0, x1 = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
    layer = side[y0:y1, x0:x1].copy()
    layer[~m[y0:y1, x0:x1]] = 0
    # Đánh dấu điểm bàn tay để theo dõi qua các phép xoay / lật
    mark = np.zeros(layer.shape[:2], np.uint8)
    mark[side_rig['pivot'][1] - y0, side_rig['pivot'][0] - x0] = 1
    k = tool.get('rot', 0)
    layer, mark = np.rot90(layer, k), np.rot90(mark, k)
    if tool.get('flipX'):
        layer, mark = layer[:, ::-1], mark[:, ::-1]
    ay, ax = [int(c[0]) for c in np.nonzero(mark)]
    th, tw = target.shape[:2]
    left, top = tool['at'][0] - ax, tool['at'][1] - ay
    over = top + layer.shape[0] - th
    if over > 0:  # cắt phần thò quá đáy ô đích
        layer = layer[:-over]
    lh, lw = layer.shape[:2]
    pl, pt = max(0, -left), max(0, -top)
    pr = max(0, left + lw - tw)
    out = np.zeros((th + pt, tw + pl + pr, 4), np.uint8)
    out[pt:, pl : pl + tw] = target
    L, T = left + pl, top + pt
    tm = np.zeros(out.shape[:2], bool)
    sel = layer[..., 3] > 0
    out[T : T + lh, L : L + lw][sel] = layer[sel]
    tm[T : T + lh, L : L + lw] = sel
    return out, tm, pl, pt


def shift_rig(rig: dict, dx: int, dy: int) -> dict:
    """Dời toạ độ khung xương khi ô bị nới lề."""
    r = dict(rig)
    r['legs'] = [[a + dx, b + dx] for a, b in rig['legs']]
    r['legTop'] = rig['legTop'] + dy
    r['arm'] = [[a + dx, b + dy, c + dx, d + dy] for a, b, c, d in rig.get('arm', [])]
    r['lines'] = [[a + dx, b + dy, c + dx, d + dy, w] for a, b, c, d, w in rig.get('lines', [])]
    r['pivot'] = [rig['pivot'][0] + dx, rig['pivot'][1] + dy]
    if rig.get('cape'):
        r['cape'] = [[t + dy, b + dy] for t, b in cape_ranges(rig['cape'])]
    return r


def flag_meta(c: dict, ox: int, oy: int) -> dict:
    """Khúc lá cờ (rig dạng dict): rows [đầu, cuối]; cán cờ là các cột pole..cut-1; lá cờ ở bên phải cán (từ cột
    cut) hoặc bên trái (side: "left", các cột trước pole); anchor = hàng bàn tay nắm cán; span = [đầu, cuối] cả lá cờ (biên độ bay tăng dần
    từ trên xuống liền mạch qua các khúc). Màn chơi vẽ cán như một thanh cứng theo điểm nắm (không uốn theo gió / tóc),
    lá cờ dính vào cán và chỉ bay ra xa cán."""
    t, b = c['rows']
    st, sb = c.get('span', c['rows'])
    return {
        'top': t + oy,
        'bottom': b + oy,
        'cut': c['cut'] + ox,
        'pole': c['pole'] + ox,
        'anchor': c['anchor'] + oy,
        'spanTop': st + oy,
        'spanBottom': sb + oy,
        'flag': True,
        **({'left': True} if c.get('side') == 'left' else {}),
    }


def cape_ranges(cape):
    """cape khai [đầu, cuối] hoặc nhiều khúc [[đầu, cuối], ...] (khúc lá cờ khai dạng dict: xem flag_meta)."""
    return [cape] if cape and isinstance(cape[0], int) else (cape or [])


def walk_frames(v: np.ndarray, side: bool, rig: dict):
    """4 khung: đứng, bước chân 1, đứng (nhún), bước chân 2. Thân nhún 1px khi chân nhấc."""
    h, w = v.shape[:2]
    left_m, right_m = leg_masks(v, rig)
    left, right, body = v.copy(), v.copy(), v.copy()
    left[~left_m] = 0
    right[~right_m] = 0
    body[left_m | right_m] = 0

    def shift(layer, dx, dy):
        out = np.zeros_like(layer)
        ys0, ys1 = max(0, dy), h + min(0, dy)
        xs0, xs1 = max(0, dx), w + min(0, dx)
        out[ys0:ys1, xs0:xs1] = layer[ys0 - dy : ys1 - dy, xs0 - dx : xs1 - dx]
        return out

    def over(dst, src):
        m = src[..., 3] > 0
        dst[m] = src[m]
        return dst

    gait = rig.get('gait')
    if gait:
        return gait_frames(v, rig, gait, shift, over)

    frames = []
    for step in (0, 1, 0, -1):
        f = np.zeros_like(v)
        bob = -1 if step else 0
        if side:  # nhìn ngang: chân trước (bên trái ảnh) và chân sau bước ngược chiều nhau, chân đang đưa lên nhấc 1px
            over(f, shift(right, 2 * step, -1 if step == -1 else 0))
            over(f, shift(left, -2 * step, -1 if step == 1 else 0))
        else:  # nhìn trước / sau: nhấc luân phiên từng chân
            over(f, shift(left, 0, -2 if step == 1 else 0))
            over(f, shift(right, 0, -2 if step == -1 else 0))
        if bob:  # lót thân gốc bên dưới để không hở khe giữa thân và chân khi nhún
            over(f, shift(body, 0, 0))
        over(f, shift(body, 0, bob))
        frames.append(f)
    return frames


def gait_frames(v: np.ndarray, rig: dict, gait: dict, shift, over):
    """Bước chân thú cưỡi (rig `gait`): mỗi chân là một vùng [x0, y0, x1, y1] (y0 = hông) kèm pha nhịp (vòng tròn 0..1).
    Mỗi khung, chân nghiêng quanh hông (từng hàng dời ngang theo độ xa hông → vó đưa tới / lui `swing` px) và chân đang
    đưa tới thì nhấc vó lên `lift` px; thân nhún 1px ở nửa nhịp. Pha 2 chân chéo nhau bằng nhau = nước kiệu."""
    h, w = v.shape[:2]
    swing, lift = gait.get('swing', 3), gait.get('lift', 2)
    legs = []
    body = v.copy()
    for x0, y0, x1, y1, ph in gait['legs']:
        m = np.zeros((h, w), bool)
        m[y0 : y1 + 1, x0 : x1 + 1] = True
        m &= v[..., 3] > 0
        leg = v.copy()
        leg[~m] = 0
        body[m] = 0
        legs.append((leg, y0, y1, ph))
    frames = []
    n = 4
    for i in range(n):
        f = np.zeros_like(v)
        bob = -1 if i % 2 else 0
        for leg, y0, y1, ph in legs:
            t = 2 * np.pi * (i / n + ph)
            fx = -swing * np.cos(t)  # âm = về phía trước (ảnh quay mặt sang trái)
            fy = -lift * max(0.0, np.sin(t))  # đang đưa tới thì nhấc vó
            out = np.zeros_like(v)
            for y in range(y0, min(h, y1 + 1)):
                k = (y - y0) / max(1, y1 - y0)
                dx, dy = int(round(fx * k)), int(round(fy * k))
                row = leg[y]
                if not row[..., 3].any() or not 0 <= y + dy < h:
                    continue
                src = row if dx == 0 else np.roll(row, dx, axis=0)
                if dx > 0:
                    src[:dx] = 0
                elif dx < 0:
                    src[dx:] = 0
                m = src[..., 3] > 0
                out[y + dy][m] = src[m]
            over(f, shift(out, 0, bob))
        if bob:
            over(f, body)
        over(f, shift(body, 0, bob))
        frames.append(f)
    return frames


def split_frames(rgba: np.ndarray, n: int) -> list:
    """Tách dải khung vẽ sẵn thành n khung theo các cột có hình (cụm cách nhau gần thì gộp: hạt bụi, tia sáng)."""
    cols = np.nonzero((rgba[..., 3] > 0).any(0))[0]
    runs, s, p = [], cols[0], cols[0]
    for c in cols[1:]:
        if c > p + 1:
            runs.append([s, p])
            s = c
        p = c
    runs.append([s, p])
    # Gộp cụm gần nhau cho tới khi còn n khung: luôn gộp khe hẹp nhất trước
    while len(runs) > n:
        gaps = [runs[i + 1][0] - runs[i][1] for i in range(len(runs) - 1)]
        i = int(np.argmin(gaps))
        runs[i : i + 2] = [[runs[i][0], runs[i + 1][1]]]
    # Khung dính nhau (vũ khí chạm khung bên cạnh): cắt cụm rộng nhất ở cột ít điểm hình nhất quanh giữa cụm
    count = (rgba[..., 3] > 0).sum(0)
    while len(runs) < n:
        i = max(range(len(runs)), key=lambda j: runs[j][1] - runs[j][0])
        x0, x1 = runs[i]
        w = x1 - x0
        lo, hi = x0 + w // 4, x1 - w // 4
        cut = lo + int(np.argmin(count[lo : hi + 1]))
        runs[i : i + 1] = [[x0, cut], [cut + 1, x1]]
    out = []
    for x0, x1 in runs:
        part = rgba[:, x0 : x1 + 1]
        rows = np.nonzero((part[..., 3] > 0).any(1))[0]
        out.append((part[rows[0] : rows[-1] + 1], int(rows[0])))
    return out


def drop_specks(s: np.ndarray, small: int = 60) -> np.ndarray:
    """Bỏ cụm điểm nằm rời (bụi / đá văng sát đất, tia sáng của khung bên cạnh lọt sang khi tách dải); chỉ giữ cụm nhỏ
    ở 35% trên cùng và nằm hẳn trong bề ngang khối chính (ngọn lửa, tia sáng lơ lửng trên đầu là một phần nhân vật)."""
    s = s.copy()
    h, w = s.shape[:2]
    op = s[..., 3] > 0
    lab = np.zeros((h, w), bool)
    comps = []
    for sy, sx in zip(*np.nonzero(op)):
        if lab[sy, sx]:
            continue
        comp, stack = [], [(sy, sx)]
        lab[sy, sx] = True
        while stack:
            y, x = stack.pop()
            comp.append((y, x))
            for yy in (y - 1, y, y + 1):
                for xx in (x - 1, x, x + 1):
                    if 0 <= yy < h and 0 <= xx < w and op[yy, xx] and not lab[yy, xx]:
                        lab[yy, xx] = True
                        stack.append((yy, xx))
        comps.append(comp)
    main = max(comps, key=len)
    mx0, mx1 = min(x for _, x in main), max(x for _, x in main)
    for comp in comps:
        if comp is main:
            continue
        cy = sum(y for y, _ in comp) / len(comp)
        cx = sum(x for _, x in comp) / len(comp)
        ground = max(y for y, _ in comp) >= h * 0.75  # bụi / đá văng sát mặt đất
        if ground and len(comp) < small * 2.5:
            pass
        elif len(comp) >= small or (cy < h * 0.35 and mx0 + 3 <= cx <= mx1 - 3):
            continue
        ys, xs = zip(*comp)
        s[list(ys), list(xs)] = 0
    return s


def build_anim(cfg: dict, ref_h: dict, src_dir: Path, out_dir: Path, name: str) -> dict:
    """Dải khung đòn đánh vẽ sẵn (rig "anim"): mỗi đòn {frames, times, views: {hướng: ảnh}, flip: [hướng]} — hoặc
    sheet: một ảnh gộp, mỗi hướng một hàng, order: [hướng của từng hàng, trên xuống dưới].
    Thu mỗi dải về đúng cỡ pixel của sprite (khung đầu = tư thế đứng vác vũ khí, cao bằng ô 4 mặt cùng hướng), căn
    mọi khung theo điểm chân (đáy chân tối, giữa hai chân) rồi ghép thành <tên>-anim.png. Trả về meta cho màn chơi."""
    sheets, meta, y = [], {}, 0
    for kind, c in cfg.items():
        n = c['frames']
        rows = []
        if 'sheet' in c:
            # Một ảnh gộp nhiều hướng, mỗi hướng một hàng (order: hướng của từng hàng, trên xuống dưới)
            whole = np.array(Image.open(src_dir / c['sheet']).convert('RGBA'))
            bands = split_frames(whole.transpose(1, 0, 2), len(c['order']))
            images = {k: b.transpose(1, 0, 2) for k, (b, _) in zip(c['order'], bands)}
        else:
            images = {k: np.array(Image.open(src_dir / f).convert('RGBA')) for k, f in c['views'].items()}
        dirs = [k for k in ('down', 'up', 'left') if k in images]
        for k in dirs:
            rgba = images[k].copy()
            rgba[..., 3] = np.where(rgba[..., 3] > 128, 255, 0)
            split = split_frames(rgba, n)
            frames = [f for f, _ in split]
            # Vạch đất chung của cả dải (ảnh gốc): hàng thấp nhất có điểm tối (móng / chân) trong mọi khung
            ground = max(top + int(np.nonzero(((f[..., 3] > 0) & (f[..., :3].astype(int).sum(-1) < 200)).any(1))[0][-1]) for f, top in split)
            # Cỡ ô: khung đầu cao bằng ô 4 mặt cùng hướng (refFrame: dùng chiều cao trung vị các khung, khi không khung
            # nào trùng tư thế ảnh 4 mặt — vd. ngựa phi)
            fh = float(np.median([f.shape[0] for f in frames])) if c.get('refFrame') == 'median' else frames[0].shape[0]
            px = fh * c.get('scale', 1.0) / ref_h[k]
            small = []
            for f, top in split:
                s = median_cells(f, px, 0.0)
                rs = np.nonzero((s[..., 3] > 0).any(1))[0]
                rs0 = int(rs[0])
                cs = np.nonzero((s[..., 3] > 0).any(0))[0]
                s = drop_specks(clean_halo(s[rs[0] : rs[-1] + 1, cs[0] : cs[-1] + 1]))
                rs = np.nonzero((s[..., 3] > 0).any(1))[0]
                cs = np.nonzero((s[..., 3] > 0).any(0))[0]
                rs0 += int(rs[0])
                s = s[rs[0] : rs[-1] + 1, cs[0] : cs[-1] + 1]
                if k in c.get('flip', []):
                    s = s[:, ::-1].copy()
                dark = (s[..., 3] > 0) & (s[..., :3].astype(int).sum(-1) < 200)
                if c.get('anchor') == 'body':
                    # Dải chạy (ngựa phi): chân mỗi khung một chỗ nên căn ngang theo giữa thân (dải giữa khung), dọc
                    # theo vạch đất chung của ảnh gốc — thân nhún đúng như vẽ, không giật
                    h0 = s.shape[0]
                    xs = np.nonzero((s[int(h0 * 0.35) : int(h0 * 0.7), :, 3] > 0).any(0))[0]
                    fx = int(round((xs.min() + xs.max()) / 2))
                    fy = int(round((ground - top) / px)) - rs0
                else:
                    # Điểm chân: hàng thấp nhất có điểm tối (chân, không tính vũ khí vàng chạm đất), giữa các điểm tối
                    # gần đáy
                    ys = np.nonzero(dark.any(1))[0]
                    fy = int(ys[-1])
                    xs = np.nonzero(dark[max(0, fy - 3) : fy + 1].any(0))[0]
                    fx = int(round((xs.min() + xs.max()) / 2))
                small.append((s, fx, fy))
            rows.append((k, small))
        L = max(fx for _, sm in rows for s, fx, fy in sm) + 1
        R = max(s.shape[1] - fx for _, sm in rows for s, fx, fy in sm) + 1
        T = max(fy for _, sm in rows for s, fx, fy in sm) + 1
        Bt = max(s.shape[0] - fy for _, sm in rows for s, fx, fy in sm)  # phần thấp hơn chân (chuỳ nện xuống đất)
        W, H = L + R, T + Bt + 1
        band = np.zeros((H * len(rows), W * n, 4), np.uint8)
        for r, (k, sm) in enumerate(rows):
            for i, (s, fx, fy) in enumerate(sm):
                x0, y0 = i * W + L - fx, r * H + T - fy
                band[y0 : y0 + s.shape[0], x0 : x0 + s.shape[1]] = s
        sheets.append(band)
        meta[kind] = {'w': W, 'h': H, 'frames': n, 'footX': L, 'footY': T, 'y': y, 'rows': dirs}
        if 'times' in c:
            meta[kind]['times'] = c['times']
        if 'fps' in c:
            meta[kind]['fps'] = c['fps']
        y += H * len(rows)
        print(f'anim {kind}: khung {W}x{H} x {n}')
    width = max(b.shape[1] for b in sheets)
    sheet = np.concatenate([np.pad(b, ((0, 0), (0, width - b.shape[1]), (0, 0))) for b in sheets], axis=0)
    Image.fromarray(sheet).save(out_dir / f'{name}-anim.png', optimize=True)
    return meta


def main():
    out_dir, name = Path(sys.argv[2]), sys.argv[3]
    rigs = json.loads((Path(__file__).parent / 'rigs.json').read_text())[name]
    # Khoảng cỡ ô pixel để dò lưới (ảnh vẽ to / nhỏ khác nhau), mặc định 9–12 điểm ảnh mỗi ô
    front, back, side = load_views(sys.argv[1], tuple(rigs.get('grid', (9.0, 12.0))), rigs.get('sample') == 'median')
    keys = ['down', 'up', 'left']
    trim = rigs.get('trim', 0)  # bỏ vài hàng đáy (vệt viền nhạt dưới đế giày)
    if trim:
        front, back, side = front[:-trim], back[:-trim], side[:-trim]
    if rigs.get('sideFacing') == 'right':  # quy ước: ô SIDE quay mặt sang trái
        side = side[:, ::-1].copy()
    anim_cfg = rigs.get('anim')
    rigs = {k: dict(rigs[k]) for k in keys}
    views = {'down': front, 'up': back, 'left': side}
    src_views, src_rigs = dict(views), {k: dict(rigs[k]) for k in keys}
    for k in keys:
        # erase: các hình chữ nhật xoá khỏi ô trước khi ghép công cụ (vd. ngọn lửa phép chỗ bàn tay sẽ cầm gậy)
        for x0, y0, x1, y1 in rigs[k].get('erase', []):
            views[k] = views[k].copy()
            views[k][y0 : y1 + 1, x0 : x1 + 1] = 0
        # graft: ghép một mảnh của ô khác vào thân ô này (vd. trống của ô FRONT treo trước hông ở ô SIDE):
        # {from, rect: [x0, y0, x1, y1] trong ô nguồn, at: góc trên trái trong ô này, width: ép ngang còn bao nhiêu px}
        for g in rigs[k].get('graft', []):
            if g.get('layer') != 'body':
                views[k] = graft(views[k], src_views, g)
        tool = rigs[k].get('tool')
        if tool:
            src = tool.get('from', 'left')
            views[k], tm, pl, pt = paste_tool(src_views[src], src_rigs[src], tool, views[k])
            rigs[k] = shift_rig(rigs[k], pl, pt)
            rigs[k]['pivot'] = [tool['at'][0] + pl, tool['at'][1] + pt]
            rigs[k]['_toolMask'] = tm
    views = [views[k] for k in keys]
    fx = [int(round((rigs[k]['legs'][0][0] + rigs[k]['legs'][1][1]) / 2)) for k in keys]
    left_pad = max(fx) + 2
    right_pad = max(v.shape[1] - x for v, x in zip(views, fx)) + 2
    FW, FH = left_pad + right_pad, max(v.shape[0] for v in views) + 2

    def place(f, x):
        c = np.zeros((FH, FW, 4), np.uint8)
        y0, x0 = FH - f.shape[0], left_pad - x
        c[y0 : y0 + f.shape[0], x0 : x0 + f.shape[1]] = f
        return c

    walk, body_rows, arm_rows, arm_meta, leg_rows, cape_meta = [], [], [], {}, {}, {}
    for v, x, k in zip(views, fx, keys):
        rig = rigs[k]
        is_side = k == 'left'
        walk.append(np.concatenate([place(f, x) for f in walk_frames(v, is_side, rig)], axis=1))
        # Lớp thân không có tay vũ khí (đã tô lại chỗ trống) + lớp tay vũ khí riêng
        legs = leg_masks(v, rig)
        am = arm_mask(v, rig, legs)
        # Khiên (giáo binh): tách thành lớp riêng để lúc đánh giơ lên che người
        sm = np.zeros(v.shape[:2], bool)
        for x0, y0, x1, y1 in rig.get('shield', []):
            sm[y0 : y1 + 1, x0 : x1 + 1] = True
        sm &= (v[..., 3] > 0) & ~am
        for lm in legs:
            sm &= ~lm
        arm = v.copy()
        arm[~am] = 0
        if rig.get('fillAlong'):
            arm = fill_along(arm, rig)
        body = v.copy()
        # Bàn tay kia (buông ở hông) cũng bỏ khỏi lớp thân: lúc đánh màn chơi vẽ tay đó nắm lên cán vũ khí
        hole = am | sm | free_mask(v, rig, True)
        body[hole | free_mask(v, rig, False)] = 0
        if rig.get('inpaint', True):
            body = inpaint(body, hole)
        # graft layer 'body': chỉ dán vào lớp thân lúc đánh (vd. cái đầu bị vũ khí che trong ảnh gốc)
        for g in rig.get('graft', []):
            if g.get('layer') == 'body':
                body = graft(body, src_views, g)
        body = mirror_head(body, rig)
        if sm.any():
            # Sau khiên là thân áo tối: tô chỗ khiên để lại bằng màu tối hay gặp nhất của nhân vật (không kéo vệt màu áo choàng)
            px = v[v[..., 3] > 0][:, :3].astype(int)
            dark = px[px.sum(1) < 150]
            if len(dark):
                cols, cnt = np.unique(dark, axis=0, return_counts=True)
                body[sm & (body[..., 3] > 0), :3] = cols[cnt.argmax()]
        body_rows.append(np.concatenate([place(f, x) for f in walk_frames(body, is_side, rig)], axis=1))
        shield = v.copy()
        shield[~sm] = 0
        arm_rows.append(np.concatenate([place(arm, x), place(shield, x)] + [np.zeros((FH, FW, 4), np.uint8)] * 2, axis=1))
        ox, oy = left_pad - x, FH - v.shape[0]
        # Hướng vũ khí (từ vai tới trọng tâm vũ khí) để đâm tới dọc theo nó
        ys, xs = np.nonzero(am)
        ux, uy = xs.mean() - rig['pivot'][0], ys.mean() - rig['pivot'][1]
        if 'dir' in rig:
            ux, uy = rig['dir']
        n = max(1e-6, (ux * ux + uy * uy) ** 0.5)
        arm_meta[k] = {
            'cx': round(float(xs.mean() + ox), 1),
            'cy': round(float(ys.mean() + oy), 1),
            'ux': round(float(ux / n), 3),
            'uy': round(float(uy / n), 3),
            'px': rig['pivot'][0] + ox,
            'py': rig['pivot'][1] + oy,
            'aw': rig['aw'],
            'as': rig['as'],
            'push': rig['push'],
        }
        # Hai đầu vũ khí (điểm trên cùng / dưới cùng): đầu cung để mắc dây
        top_i, bot_i = ys.argmin(), ys.argmax()
        arm_meta[k]['tips'] = [[int(xs[top_i] + ox), int(ys[top_i] + oy)], [int(xs[bot_i] + ox), int(ys[bot_i] + oy)]]
        if sm.any():  # khiên ở khung thứ hai của hàng tay vũ khí; raise: dời khiên lúc đánh [dx, dy] (giơ lên che người)
            arm_meta[k]['shield'] = {'raise': rig.get('shieldRaise', [0, -5])}
        if rig.get('hand2'):  # chỗ bàn tay thứ hai nắm trên vũ khí (kiếm 2 tay)
            arm_meta[k]['hand2'] = [rig['hand2'][0] + ox, rig['hand2'][1] + oy]
        if rig.get('shoulder1'):  # vai của tay cầm vũ khí: lúc đánh bàn tay vung quanh đây theo vũ khí
            arm_meta[k]['shoulder1'] = [rig['shoulder1'][0] + ox, rig['shoulder1'][1] + oy]
        if rig.get('shoulder2'):  # vai của tay kia: gốc cánh tay vươn tới chỗ nắm hand2
            arm_meta[k]['shoulder2'] = [rig['shoulder2'][0] + ox, rig['shoulder2'][1] + oy]
        if rig.get('aimShift'):  # cung dời vào giữa người khi ngắm (nhìn trước / sau)
            arm_meta[k]['shiftX'], arm_meta[k]['shiftY'] = rig['aimShift']
        if rig.get('behind'):  # tay vũ khí nằm sau thân lúc đánh
            arm_meta[k]['behind'] = True
        if rig.get('club'):  # chuỳ: lúc đánh màn chơi vẽ lại cả cây liền một khối (ảnh gốc bị đầu che mất khúc giữa)
            c = rig['club']
            arm_meta[k]['club'] = {'tip': [c['tip'][0] + ox, c['tip'][1] + oy], 'r0': c['r0'], 'r1': c['r1']}
        leg_rows[k] = v.shape[0] - rig['legTop']
        # Vạt áo choàng: phần bên phải mép chân phải, trong khoảng hàng khai ở rig (bay theo gió lúc vẽ)
        cut = rig['legs'][1][1] + 1 + ox
        cape_meta[k] = [
            flag_meta(c, ox, oy) if isinstance(c, dict) else {'cut': cut, 'top': c[0] + oy, 'bottom': c[1] + oy}
            for c in cape_ranges(rig.get('cape'))
        ] or None
    out_dir.mkdir(parents=True, exist_ok=True)
    sheet = np.concatenate(walk + body_rows + arm_rows, axis=0)
    Image.fromarray(sheet).save(out_dir / f'{name}.png', optimize=True)
    meta = {
        'w': FW,
        'h': FH,
        'frames': 4,
        'rows': keys,
        'footX': left_pad,
        'footY': FH - 1,
        'legRows': leg_rows,
        'arm': arm_meta,
        'cape': cape_meta,
    }
    if anim_cfg:  # dải khung đòn đánh vẽ sẵn: cao khung đầu = cao ô 4 mặt (trước khi nới lề khi ghép công cụ)
        ref_h = {'down': front.shape[0], 'up': back.shape[0], 'left': side.shape[0]}
        meta['anim'] = build_anim(anim_cfg, ref_h, Path(sys.argv[1]).parent, out_dir, name)
    (out_dir / f'{name}.json').write_text(json.dumps(meta) + '\n')
    print(f'khung {FW}x{FH} -> {out_dir}')


if __name__ == '__main__':
    main()
