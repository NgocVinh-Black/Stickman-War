import { UNITS, type Arch, type Formation, type Team } from './units';
import { dirOf, statueX, type World } from './world';

export type AIConfig = {
  miners: number; // số thợ mỏ muốn giữ
  mix: Partial<Record<Arch, number>>; // tỉ lệ quân muốn xây (theo khung, tự đổi sang quân của tộc)
  attackAt: number; // tổng giá trị quân để bắt đầu tấn công
  forceAttackAt: number; // giây: sau mốc này có quân là đánh
  retreatRatio: number; // rút về khi quân còn dưới attackAt * ratio
  centerMine?: boolean; // khi đang tấn công thì cho thợ mỏ sang mỏ giữa
  formation?: Formation; // kiểu hành quân
};

const THINK_EVERY = 0.5;

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
  }

  private build(world: World): void {
    const t = world.teams[this.team];
    if (world.count(this.team, 'miner', true) < this.cfg.miners) {
      world.train(this.team, 'miner');
      return;
    }
    // Chọn loại đang thiếu nhiều nhất so với tỉ lệ mong muốn
    let pick: Arch | null = null;
    let lowest = Infinity;
    for (const [kind, weight] of Object.entries(this.cfg.mix) as [Arch, number][]) {
      if (!weight || !t.unlocked.includes(world.kindFor(this.team, kind))) continue;
      if (UNITS[world.kindFor(this.team, kind)].build && world.towerCount(this.team) >= 3) continue;
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
      (u) =>
        u.team !== this.team && !u.dying && UNITS[u.kind].arch !== 'miner' && (u.x - statueX(this.team)) * dirOf(this.team) < 930,
    );

    const late = world.time >= this.cfg.forceAttackAt;
    if (this.attacking) {
      // Sau mốc forceAttackAt thì không rút nữa, trừ khi bị đánh vào nhà
      const weak = strength < this.cfg.attackAt * this.cfg.retreatRatio;
      if ((weak && !late) || (late && threatened && weak)) this.attacking = false;
    } else if (strength >= this.cfg.attackAt || (late && strength > 0 && !threatened)) {
      this.attacking = true;
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
      if (s.arch !== 'miner' && s.arch !== 'tower' && s.arch !== 'builder') v += s.cost;
    }
    return v;
  }
}
