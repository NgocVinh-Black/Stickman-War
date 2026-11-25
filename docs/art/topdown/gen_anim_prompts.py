"""Sinh docs/art/topdown/anim-prompts-light.md: prompt dải 6 khung ĐÒN ĐÁNH cho mọi lính nền văn minh Quang, mỗi lính
3 góc (nhìn ngang / trước / sau), để tạo ảnh animation vẽ thật thay cho vũ khí xoay trong demo thế giới.

Chạy (Python 3, không cần thư viện):
  python3 docs/art/topdown/gen_anim_prompts.py

Phong cách, cỡ khung, danh sách tránh dùng chung ở đây; mỗi lính chỉ khai ngoại hình (lấy từ ảnh 4 mặt
docs/art/topdown/light-<id>-views.png) và 6 khung đòn đánh. Khung ra đòn (`hit`) phải khớp mốc ra đòn của kiểu hành
động trong apps/web/src/game/world/fx.ts (ACTIONS) để sóng chấn động / sát thương rơi đúng khung.
"""

from pathlib import Path

OUT = Path(__file__).parent / 'anim-prompts-light.md'

# Ngoại hình chung của lính Quang (thân người que đen, tóc vàng dựng, mắt sáng)
BODY = (
    'a chibi stickman with a solid black body and limbs, short spiky glowing golden hair with a bright four-pointed star '
    'in it, two slanted glowing golden eyes on a black face, thin glowing golden trim lines on the body'
)

# Mỗi lính: id (tên file), tên, kiểu hành động trong game, mốc ra đòn trong ACTIONS, cỡ khung gốc (rộng x cao, px
# nghệ thuật), ngoại hình, 6 khung nhìn ngang, gợi ý nhìn trước / sau, khung ra đòn (1..6).
UNITS = [
    {
        'id': 'miner',
        'name': 'Thợ mỏ',
        'kind': 'mine',
        'hit': 0.5,
        'size': (72, 72),
        'look': f'{BODY}, golden scarf and short torn golden cape, a golden pickaxe with a thick wooden handle, a small '
        'brown cloth gold sack with a golden drawstring hanging on a strap over the shoulder at the back hip (visible in '
        'every frame)',
        'side': [
            'ready: pickaxe resting on the right shoulder, the gold sack hanging small and half empty at the back hip',
            'lift: both hands raise the pickaxe off the shoulder, pick head pointing back, the sack swinging',
            'wind-up peak: pickaxe held high over the head, body leaning back, front foot lifted',
            'swing: the pickaxe sweeps down in front, handle horizontal, body leaning forward',
            'IMPACT: the pick tip strikes a glowing gold ore rock on the ground in front of the front foot, knees bent, '
            'body lowest, one shiny gold nugget popping up out of the rock',
            'COLLECT: the pickaxe goes back on the shoulder while the free hand drops the gold nugget into the sack on '
            'the shoulder strap, the sack now bulging bigger and fuller than in frame 1',
        ],
        'front': 'the pickaxe rises straight up beside the head and comes down toward the viewer, the pick tip hitting '
        'a gold ore rock in front of the feet (foreshortened, seen head-on), a gold nugget pops out, then the free hand '
        'drops it into the sack hanging at the side, the strap across the chest and the sack bulging fuller',
        'back': 'the pickaxe rises over the head and comes down away from the viewer, the pick head hidden in front of '
        'the miner at impact; the gold sack hangs clearly on the back on its strap, and in the last frame the free hand '
        'reaches back over the shoulder to drop a gold nugget into it, the sack bulging fuller',
        'hitFrame': 5,
    },
    {
        'id': 'warrior',
        'name': 'Kiếm sĩ',
        'kind': 'slash',
        'hit': 0.5,
        'size': (80, 72),
        'look': f'{BODY}, golden scarf and torn golden cape, a long glowing golden sword held in both hands',
        'side': [
            'ready: sword held low in front with both hands, tip pointing forward and down, exactly like the reference',
            'raise: both hands lift the sword, blade pointing straight up beside the head',
            'wind-up peak: sword raised high behind the head, blade pointing back, body coiled, front foot stepping',
            'SLASH: the sword sweeps down diagonally across the front, blade horizontal at chest height, big step forward',
            'follow-through: the blade ends low behind the front foot, body leaning forward, cape flaring',
            'recover: the warrior pulls the sword back to the ready guard',
        ],
        'front': 'the sword rises over the head and slashes down diagonally across the body toward the viewer, ending '
        'low on the other side',
        'back': 'the sword rises over the head and slashes down in front of the warrior (away from the viewer), the '
        'blade visible above the shoulders and then sweeping out to the side',
        'hitFrame': 4,
    },
    {
        'id': 'archer',
        'name': 'Cung thủ',
        'kind': 'shoot',
        'hit': 0.6,
        'size': (72, 72),
        'look': f'{BODY}, golden scarf and torn golden cape, a large curved glowing golden bow, glowing golden arrows',
        'side': [
            'ready: bow held low at the side, exactly like the reference',
            'nock: the bow is raised to chest height and a glowing golden arrow is placed on the string',
            'draw: the string is pulled halfway back, bow arm straight forward, arrow pointing forward and slightly up',
            'full draw: string pulled back to the cheek, arrow pointing forward and slightly up, body steady',
            'RELEASE: the arrow is gone, the string snaps straight, the drawing hand flies back open, bow still raised',
            'recover: the bow is lowered back to the ready pose',
        ],
        'front': 'the archer raises the bow in front of the chest and draws the arrow straight toward the viewer '
        '(only the arrow tip and the bow seen head-on, string pulled back to the face)',
        'back': 'the archer raises the bow in front (away from the viewer), the bow tips visible on both sides of the '
        'body, the drawing elbow pulled back beside the head',
        'hitFrame': 5,
    },
    {
        'id': 'assassin',
        'name': 'Sát thủ',
        'kind': 'stab',
        'hit': 0.32,
        'size': (80, 64),
        'look': f'{BODY}, long flowing golden scarf, a short glowing golden dagger in EACH hand',
        'side': [
            'ready: low crouch, both daggers held forward, exactly like the reference',
            'dash: body leaning far forward, back foot pushing off, both daggers pulled back',
            'STAB 1: the front arm thrusts its dagger straight forward at full reach, the other dagger held back',
            'pull: the first dagger pulls back, the body twists',
            'STAB 2: the other arm thrusts its dagger straight forward at full reach',
            'recover: back to the low ready crouch',
        ],
        'front': 'the two daggers stab straight toward the viewer one after the other (foreshortened, blades seen '
        'head-on), body crouched low',
        'back': 'the two daggers stab away from the viewer one after the other, the elbows driving forward past the '
        'sides of the body',
        'hitFrame': 3,
    },
    {
        'id': 'spearton',
        'name': 'Giáo binh',
        'kind': 'thrust',
        'hit': 0.46,
        'size': (88, 72),
        'look': f'{BODY}, golden scarf and torn golden cape, a long golden spear and a golden shield with a glowing '
        'four-pointed star',
        'side': [
            'ready: spear upright in the back hand, shield in front, exactly like the reference',
            'level: the spear is lowered to horizontal at shoulder height, pointing forward, shield raised',
            'pull back: the spear arm draws far back behind the shield, body coiled, weight on the back foot',
            'THRUST: the spear shoots forward at full reach past the shield, big lunge step, body stretched forward',
            'hold: the spear still extended, shield braced, body low',
            'recover: the spear is pulled back and raised upright again',
        ],
        'front': 'the spear is lowered and thrust straight toward the viewer past the shield (spear tip seen head-on '
        'and foreshortened), shield in front of the chest',
        'back': 'the spear is lowered and thrust away from the viewer, the shaft visible over the shoulder, the shield '
        'held at the side',
        'hitFrame': 4,
    },
    {
        'id': 'cavalry',
        'name': 'Kỵ binh',
        'kind': 'charge',
        'hit': 0.5,
        'size': (120, 88),
        'look': 'a black silhouette horse with glowing golden eyes, golden armour trim, golden hooves, golden saddle '
        f'cloth with a glowing star and a golden flowing tail, ridden by {BODY}, golden scarf and cape, holding a long '
        'glowing golden lance',
        'side': [
            'gallop: lance raised at 45 degrees, horse galloping, exactly the reference rider and horse',
            'lower: the lance is lowered toward horizontal, the rider leaning forward, horse stretching out',
            'couch: lance level and pointing forward under the arm, horse at full stretch',
            'LUNGE: the horse leaps forward with forelegs reaching, the lance shoots forward at full reach',
            'impact: lance fully extended, rider braced, horse landing on the forelegs',
            'recover: the lance is lifted back to 45 degrees, horse galloping on',
        ],
        'front': 'horse and rider charge straight toward the viewer, the lance lowering and pointing at the viewer '
        '(lance tip seen head-on, foreshortened), horse head down',
        'back': 'horse and rider charge away from the viewer, the lance lowering forward over the horse head, the '
        "horse tail and the rider's cape flowing toward the viewer",
        'hitFrame': 4,
    },
    {
        'id': 'mage',
        'name': 'Pháp sư',
        'kind': 'cast',
        'hit': 0.5,
        'size': (80, 80),
        'look': f'{BODY}, long torn golden cape with golden trim, a tall golden staff topped with a glowing sun ring, a '
        'floating golden flame above the free hand',
        'side': [
            'ready: staff upright in the back hand, flame floating above the open front hand, exactly like the reference',
            'raise: the staff is lifted high, the flame hand pulled back toward the chest',
            'gather: staff held high, the sun ring glowing brighter, a small bright light ball forming at its tip',
            'CAST: the staff and the open hand thrust forward together, a big bright light ball at the staff tip',
            'release: the light ball is gone, staff still pointing forward, the cape blown back',
            'recover: the staff returns upright',
        ],
        'front': 'the staff rises, the light gathers at the sun ring, then the staff and open hand thrust toward the '
        'viewer (staff tip foreshortened, the bright ball in the centre)',
        'back': 'the staff rises, light gathers at the sun ring above the head, then the staff thrusts forward away '
        'from the viewer, the cape blown toward the viewer',
        'hitFrame': 4,
    },
    {
        'id': 'drummer',
        'name': 'Tay trống',
        'kind': 'drum',
        'hit': 0.5,
        'size': (72, 80),
        'look': f'{BODY}, golden scarf and torn golden cape, a large round golden war drum hanging at the hip, a drum '
        'stick in each hand, a tall golden banner on a pole strapped to the back',
        'side': [
            'ready: both sticks held near the drum, banner upright on the back, exactly like the reference, the drum '
            'CLEARLY VISIBLE in front of the hip',
            'raise: the front stick is lifted high above the shoulder',
            'BEAT 1: the front stick strikes the drum head, the drum head flashing bright',
            'raise: the other stick is lifted high, the first stick bouncing up',
            'BEAT 2: the other stick strikes the drum head',
            'recover: both sticks back near the drum',
        ],
        'front': 'the drum faces the viewer at the hip, the two sticks rise and strike its round head one after the '
        'other, the banner waving behind the head',
        'back': 'the drum is in front (hidden by the body except its rim), the elbows rise and strike one after the '
        'other, the banner waving in front of the viewer',
        'hitFrame': 3,
    },
    {
        'id': 'healer',
        'name': 'Tu sĩ',
        'kind': 'heal',
        'hit': 0.5,
        'size': (72, 80),
        'look': 'a chibi stickman with a solid black body, a deep golden hood with a pointed tip hiding the face except '
        'two slanted glowing golden eyes, long torn golden robe and cape, a golden staff topped with a small star, a '
        'glowing golden light orb in the free hand',
        'side': [
            'ready: staff upright, orb held in the open front hand, exactly like the reference',
            'raise: the orb hand lifts to chest height, the orb glowing brighter',
            'lift: both arms rise, staff and orb above the head, the robe lifting',
            'peak: arms high and wide, the orb shining brightest above the head',
            'RELEASE: arms spread wide and down, the orb gone, the robe flaring outward',
            'recover: back to the ready pose with a new small orb in the hand',
        ],
        'front': 'the orb and staff rise above the hood, the orb shines brightest, then both arms spread wide toward '
        'the viewer as the light is released',
        'back': 'the orb and staff rise above the hood, then both arms spread wide, the robe flaring toward the viewer',
        'hitFrame': 5,
    },
    {
        'id': 'catapult',
        'name': 'Máy phóng',
        'kind': 'launch',
        'hit': 0.56,
        'size': (112, 80),
        'look': 'a golden wooden siege catapult with two big dark wheels, glowing golden brackets and a glowing golden '
        f'ball in the cup of the throwing arm, pulled by {BODY} with a golden scarf who stands behind it holding the rope',
        'side': [
            'ready: throwing arm cocked back low, glowing ball in the cup, operator holding the rope, exactly like the '
            'reference layout, the catapult throws toward the LEFT',
            'tension: the operator leans back pulling the rope tight, the arm trembling',
            'release: the operator yanks the rope, the arm starts swinging up and forward',
            'FLING: the arm slams against the crossbar pointing up and forward, the cup empty, the ball just gone',
            'settle: the arm bounces back slightly, the operator stumbles',
            'reload: the operator places a new glowing ball in the cup and the arm is cocked back again',
        ],
        'front': 'the catapult faces the viewer, the throwing arm swings from low up over the crossbar toward the '
        'viewer (cup foreshortened), the operator visible behind',
        'back': 'the catapult faces away, the operator in front of it pulls the rope, the arm swings up and away over '
        'the crossbar',
        'hitFrame': 4,
    },
    {
        'id': 'builder',
        'name': 'Thợ xây',
        'kind': 'build',
        'hit': 0.5,
        'size': (72, 72),
        'look': f'{BODY}, golden work apron and belt, a bundle of wooden planks on the back, a big golden hammer with a '
        'square head',
        'side': [
            'ready: hammer resting on the shoulder, exactly like the reference',
            'lift: the hammer is raised off the shoulder, head pointing back',
            'wind-up peak: hammer high over the head, body leaning back',
            'swing: the hammer comes down in front, handle horizontal',
            'IMPACT: the hammer head strikes the ground in front of the front foot, knees bent, body lowest',
            'recover: the builder straightens up and brings the hammer back to the shoulder',
        ],
        'front': 'the hammer rises straight up beside the head and comes down toward the viewer, the square head '
        'hitting the ground in front of the feet (seen head-on)',
        'back': 'the hammer rises over the head and comes down away from the viewer, the planks bundle bouncing on '
        'the back',
        'hitFrame': 5,
    },
]

STYLE = (
    'Six frames in one single horizontal row, left to right in time order, on a fully TRANSPARENT background (PNG '
    'alpha, no background colour, no white, no checkerboard pattern), generous equal empty space between frames (no '
    'frame touching another), every frame the same canvas size (about {w} x {h} px native, room for the weapon at full '
    'swing) and the same pixel scale as the reference, the feet on one shared ground line at the same spot in every '
    'frame. Every art pixel a crisp square block, upscaled with nearest neighbour, bold 1px dark outline, zero '
    'anti-aliasing, hard alpha edges. The weapon is ONE solid continuous object in every frame, always fully visible '
    'unless the view hides it, never cut, never bent. Glowing details stay solid bright pixel clusters with a white-hot '
    'core.'
)
AVOID = (
    'Avoid: white background, coloured background, checkerboard pattern, fake transparency grid, ground shadow, motion '
    'blur, speed lines, smear frames, dust clouds, impact flash, cracks in the ground, {extra}frames of different '
    'sizes, the character changing size, a broken or bent weapon, a second weapon, extra arms, 1-pixel thin lines, '
    'anti-aliasing, glow halo, bloom, blur, gradients, labels, text, frame numbers, borders, watermark.'
)
VIEWS = {
    'side': ('SIDE', 'Strict side view, facing LEFT in every frame, zero perspective, zero 3/4 angle.', 'perspective, 3/4 view, facing right, '),
    'front': ('FRONT', 'Strict front view, facing the viewer in every frame, zero 3/4 angle.', '3/4 view, '),
    'back': ('BACK', 'Strict back view, facing AWAY from the viewer in every frame, zero 3/4 angle, no face visible.', 'a visible face, 3/4 view, '),
}
VIEW_VI = {'side': 'Nhìn ngang', 'front': 'Nhìn trước', 'back': 'Nhìn sau'}


def frames_text(u: dict, view: str) -> str:
    """6 khung theo góc: nhìn ngang khai từng khung; nhìn trước / sau dùng cùng nhịp với gợi ý riêng của góc đó."""
    lines = ' '.join(f'{i}. {f}.' for i, f in enumerate(u['side'], 1))
    if view == 'side':
        return f'Frames: {lines}'
    return f'Same six beats as this side-view description: {lines} Seen from the {view.upper()} instead: {u[view]}.'


def prompt(u: dict, view: str) -> str:
    tag, view_rule, extra = VIEWS[view]
    w, h = u['size']
    return ' '.join(
        [
            f'Pixel art sprite sheet: a 6-frame ATTACK animation of the SAME character as in the attached reference '
            f'image (use its {tag} view: {u["look"]}).',
            view_rule,
            STYLE.format(w=w, h=h),
            frames_text(u, view),
            f'Frame {u["hitFrame"]} is the moment of the hit and must read clearly.',
            AVOID.format(extra=extra),
        ]
    )


def main() -> None:
    out = [
        '# Prompt animation đòn đánh — nền văn minh Quang (demo thế giới)',
        '',
        '> Sinh tự động bởi `docs/art/topdown/gen_anim_prompts.py` — sửa ở script rồi chạy lại, đừng sửa tay file này.',
        '',
        'Mỗi lính 3 dải (nhìn ngang / trước / sau), mỗi dải 6 khung đòn đánh vẽ thật. Đã có: khổng lồ (nện chuỳ, xem',
        '`anim-prompts.md`). Cách dùng:',
        '',
        '- Đính kèm ảnh 4 mặt `docs/art/topdown/light-<id>-views.png` của lính đó rồi dán prompt.',
        '- Lưu thành `docs/art/topdown/light-<id>-<kiểu>-side.png` / `-front.png` / `-back.png` (tên ở từng mục).',
        '- Xem trước khi dùng: đủ 6 khung một hàng, các khung không chạm nhau, cùng cỡ, chân cùng một vạch đất, vũ khí',
        '  liền một khối, nhìn ngang quay mặt sang **trái**, nền trong suốt thật (nền ô caro vẽ giả vẫn bỏ được). Sai',
        '  thì tạo lại.',
        '- Có ảnh thì báo để khai `anim` trong `rigs.json`: khung ra đòn (ghi ở từng mục) phải rơi đúng mốc ra đòn của',
        '  game để sóng chấn động / sát thương khớp hình.',
        '',
    ]
    for u in UNITS:
        out += [
            f'## {u["name"]} — `{u["kind"]}` (light-{u["id"]})',
            '',
            f'- Lưu: `light-{u["id"]}-{u["kind"]}-side.png`, `-front.png`, `-back.png`.',
            f'- Khung ra đòn: khung {u["hitFrame"]} (game ra đòn ở {round(u["hit"] * 100)}% thời gian đòn).',
            '',
        ]
        for view in ('side', 'front', 'back'):
            out += [f'### {VIEW_VI[view]}', '', '```', prompt(u, view), '```', '']
    OUT.write_text('\n'.join(out), encoding='utf-8')
    print(f'{len(UNITS)} lính x 3 góc -> {OUT}')


if __name__ == '__main__':
    main()
