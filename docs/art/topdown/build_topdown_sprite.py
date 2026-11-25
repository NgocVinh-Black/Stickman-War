"""Nhân vật cho demo thế giới nhìn từ trên (top-down 2D): cắt 3 ô FRONT / BACK / SIDE của bảng 4 góc
(TOP, SIDE, FRONT, BACK) về đúng lưới pixel gốc, dựng 4 khung bước đi cho mỗi hướng.

Hướng: xuống = FRONT, lên = BACK, trái = SIDE (ảnh quay mặt sang trái), phải = SIDE lật gương lúc vẽ.

Chạy (Python 3 + Pillow + NumPy):
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-miner-views.png apps/web/public/art/topdown light-miner
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-warrior-views.png apps/web/public/art/topdown light-warrior
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-archer-views.png apps/web/public/art/topdown light-archer
  python3 docs/art/topdown/build_topdown_sprite.py docs/art/topdown/light-assassin-views.png apps/web/public/art/topdown light-assassin

Ảnh nền trắng phẳng hoặc PNG nền trong suốt đều được.

Khung xương từng nhân vật (chân, tay cầm vũ khí, điểm xoay, góc vung) khai ở rigs.json cùng thư mục.

Ra: <tên>.png gồm 9 hàng, mỗi hàng 4 khung cùng cỡ:
  0-2  đi bộ: xuống, lên, trái
  3-5  đi bộ nhưng không có tay vũ khí (thân, chỗ tay che đã tô lại) — dùng lúc đánh
  6-8  chỉ tay vũ khí (khung đầu) — màn chơi xoay quanh điểm vai lúc đánh
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


def load_views(path: str, grid=(9.0, 12.0)):
    rgba = np.array(Image.open(path).convert('RGBA'))
    alpha = rgba[..., 3]
    transparent = (alpha == 0).mean() > 0.2  # ảnh nền trong suốt: dùng thẳng kênh alpha, không loang nền
    # Dò lưới trên ảnh đã ghép lên nền trắng (viền đen nổi rõ)
    k = alpha[..., None].astype(float) / 255
    im = (rgba[..., :3] * k + 255 * (1 - k)).astype(np.uint8)
    px, ph = find_grid(im, *grid)
    xs = np.arange(ph + px / 2, im.shape[1], px).astype(int)
    ys = np.arange(ph + px / 2, im.shape[0], px).astype(int)
    if transparent:
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
    for lm in legs:
        m &= ~lm
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
    """Ghép công cụ (vùng tay của ô SIDE: cuốc + bàn tay) sang góc nhìn không vẽ công cụ.
    tool: rot (số lần xoay 90° ngược chiều kim đồng hồ, như np.rot90), flipX, at = điểm bàn tay trong ô đích.
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
    lh, lw = layer.shape[:2]
    th, tw = target.shape[:2]
    left, top = tool['at'][0] - ax, tool['at'][1] - ay
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


def cape_ranges(cape):
    """cape khai [đầu, cuối] hoặc nhiều khúc [[đầu, cuối], ...]."""
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


def main():
    out_dir, name = Path(sys.argv[2]), sys.argv[3]
    rigs = json.loads((Path(__file__).parent / 'rigs.json').read_text())[name]
    # Khoảng cỡ ô pixel để dò lưới (ảnh vẽ to / nhỏ khác nhau), mặc định 9–12 điểm ảnh mỗi ô
    front, back, side = load_views(sys.argv[1], tuple(rigs.get('grid', (9.0, 12.0))))
    keys = ['down', 'up', 'left']
    trim = rigs.get('trim', 0)  # bỏ vài hàng đáy (vệt viền nhạt dưới đế giày)
    if trim:
        front, back, side = front[:-trim], back[:-trim], side[:-trim]
    if rigs.get('sideFacing') == 'right':  # quy ước: ô SIDE quay mặt sang trái
        side = side[:, ::-1].copy()
    rigs = {k: dict(rigs[k]) for k in keys}
    views = {'down': front, 'up': back, 'left': side}
    for k in ('down', 'up'):
        tool = rigs[k].get('tool')
        if tool:
            views[k], tm, pl, pt = paste_tool(side, rigs['left'], tool, views[k])
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
        am = arm_mask(v, rig, leg_masks(v, rig))
        arm = v.copy()
        arm[~am] = 0
        body = v.copy()
        body[am] = 0
        body = inpaint(body, am)
        body_rows.append(np.concatenate([place(f, x) for f in walk_frames(body, is_side, rig)], axis=1))
        arm_rows.append(np.concatenate([place(arm, x)] + [np.zeros((FH, FW, 4), np.uint8)] * 3, axis=1))
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
        if rig.get('hand2'):  # chỗ bàn tay thứ hai nắm trên vũ khí (kiếm 2 tay)
            arm_meta[k]['hand2'] = [rig['hand2'][0] + ox, rig['hand2'][1] + oy]
        if rig.get('aimShift'):  # cung dời vào giữa người khi ngắm (nhìn trước / sau)
            arm_meta[k]['shiftX'], arm_meta[k]['shiftY'] = rig['aimShift']
        if rig.get('behind'):  # tay vũ khí nằm sau thân lúc đánh
            arm_meta[k]['behind'] = True
        leg_rows[k] = v.shape[0] - rig['legTop']
        # Vạt áo choàng: phần bên phải mép chân phải, trong khoảng hàng khai ở rig (bay theo gió lúc vẽ)
        cut = rig['legs'][1][1] + 1 + ox
        cape_meta[k] = [{'cut': cut, 'top': t + oy, 'bottom': b + oy} for t, b in cape_ranges(rig.get('cape'))] or None
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
    (out_dir / f'{name}.json').write_text(json.dumps(meta) + '\n')
    print(f'khung {FW}x{FH} -> {out_dir}')


if __name__ == '__main__':
    main()
