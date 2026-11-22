import { MAX_TOWERS, UNITS, type Arch, type Formation, type Team } from './units';
import { dirOf, statueX, type World } from './world';
import { ULTS } from './skills';

export type AIConfig = {
  miners: number; // số thợ mỏ muốn giữ
  mix: Partial<Record<Arch, number>>; // tỉ lệ quân muốn xây (theo khung, tự đổi sang quân của hệ)
  attackAt: number; // tổng giá trị quân để bắt đầu tấn công
  forceAttackAt: number; // giây: sau mốc này có quân là đánh
  retreatRatio: number; // rút về khi quân còn dưới attackAt * ratio
  centerMine?: boolean; // khi đang tấn công thì cho thợ mỏ sang mỏ giữa
  formation?: Formation; // kiểu hành quân
  /**
   * Chỉ tấn công khi giá trị quân mình ≥ quân địch × edge (bên thủ có tường, trạm, tượng bắn nên đánh trước
   * mà không áp đảo là thua). Không có = chỉ xét ngưỡng attackAt như cũ.
   */
  edge?: number;
  /** Xây tường thành: từ giây `at`, cách tượng nhà `dist`; tường đổ thì xây lại. Không có = không xây tường. */
  wall?: { at: number; dist: number };
};

const THINK_EVERY = 0.5;
/** Máy chỉ tung chiêu tượng thần khi có ít nhất chừng này quân địch trong vùng chiêu. */
const ULT_CROWD = 5;

/** AI điều khiển một phe (mặc định là địch) bằng đúng các lệnh người chơi có. */
export class EnemyAI {
  private thinkT = 0;
  private attacking = false;

  constructor(
    private cfg: AIConfig,
    private readonly team: Team = 1,
  ) {}

  update(world: World, dt: number): void {
    this.thinkT += dt;
    if (this.thinkT < THINK_EVERY) return;
    this.thinkT = 0;
    this.build(world);
    this.command(world);
    this.unleash(world);
  }

  /**
   * Chiêu tượng thần: đầy nộ thì tung vào chỗ địch dồn đông nhất (ít nhất ULT_CROWD quân trong vùng chiêu),
   * ưu tiên chỗ gần nhà mình (đang bị đánh) hoặc nơi hai bên đang giáp trận.
   */
  private unleash(world: World): void {
    const t = world.teams[this.team];
    if (t.ult < 1) return;
    const r = ULTS[t.faction].area ?? 300;
    const foes = world.units.filter((u) => u.team !== this.team && !u.dying && !u.inside && !u.hidden && UNITS[u.kind].arch !== 'miner');
    let best: number | null = null;
    let most = ULT_CROWD - 1;
    for (const f of foes) {
      const n = foes.filter((e) => Math.abs(e.x - f.x) <= r * 0.8).length;
      if (n > most) {
        most = n;
        best = f.x;
      }
    }
    if (best !== null) world.unleash(this.team, best);
  }

  private build(world: World): void {
    const t = world.teams[this.team];
    // Tới giờ xây tường: để dành vàng cho tường trước, đủ thì đặt (thợ mỏ tự đi dựng)
    const w = this.cfg.wall;
    if (w && world.time >= w.at && !world.wallOf(this.team) && Number.isNaN(t.wallPlan)) {
      const x = statueX(this.team) + dirOf(this.team) * w.dist;
      const why = world.wallBlock(this.team, x);
      if (why === null) world.orderWall(this.team, x);
      if (why === null || why === 'gold') return;
    }
    if (world.count(this.team, 'miner', true) < this.cfg.miners) {
      world.train(this.team, 'miner');
      return;
    }
    // Chọn loại đang thiếu nhiều nhất so với tỉ lệ mong muốn
    let pick: Arch | null = null;
    let lowest = Infinity;
    for (const [kind, weight] of Object.entries(this.cfg.mix) as [Arch, number][]) {
      if (!weight || !t.unlocked.includes(world.kindFor(this.team, kind))) continue;
      if (UNITS[world.kindFor(this.team, kind)].build && world.towerCount(this.team) >= MAX_TOWERS) continue;
      const ratio = world.count(this.team, kind, true) / weight;
      if (ratio < lowest) {
        lowest = ratio;
        pick = kind;
      }
    }
    // Để dành tiền cho loại cần xây thay vì xây linh tinh
    if (pick) world.train(this.team, pick);
  }

  private command(world: World): void {
    const strength = this.armyValue(world, this.team);
    const threatened = world.units.some(
      (u) => u.team !== this.team && !u.dying && UNITS[u.kind].arch !== 'miner' && (u.x - statueX(this.team)) * dirOf(this.team) < 930,
    );

    const late = world.time >= this.cfg.forceAttackAt;
    if (this.attacking) {
      // Sau mốc forceAttackAt thì không rút nữa, trừ khi bị đánh vào nhà
      const weak = strength < this.cfg.attackAt * this.cfg.retreatRatio;
      if ((weak && !late) || (late && threatened && weak)) this.attacking = false;
    } else {
      const enemy = this.armyValue(world, this.team === 0 ? 1 : 0);
      // Quá mốc buộc đánh 4 phút mà vẫn chưa áp đảo thì vẫn đánh (tránh hai bên cùng ngồi thủ mãi)
      const desperate = world.time >= this.cfg.forceAttackAt + 240;
      const edge = this.cfg.edge === undefined || desperate || strength >= enemy * this.cfg.edge;
      if ((strength >= this.cfg.attackAt && edge) || (late && strength > 0 && !threatened && edge)) this.attacking = true;
    }
    if (this.cfg.formation) world.setFormation(this.team, this.cfg.formation);
    world.setStance(this.team, this.attacking ? 'attack' : 'defend');
    if (this.cfg.centerMine) world.setCenterMine(this.team, this.attacking);
  }

  private armyValue(world: World, team: Team): number {
    let v = 0;
    for (const u of world.units) {
      if (u.team !== team || u.dying) continue;
      const s = UNITS[u.kind];
      if (s.arch !== 'miner' && !s.stationary && s.arch !== 'builder') v += s.cost;
    }
    return v;
  }
}
