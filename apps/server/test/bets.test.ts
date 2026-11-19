import { describe, expect, it } from 'vitest';
import { settleBets, type Bet } from '../src/game/bets';

describe('Chia quỹ kèo', () => {
  const bets = () =>
    new Map<string, Bet>([
      ['a', { side: 0, amount: 100 }],
      ['b', { side: 0, amount: 300 }],
      ['c', { side: 1, amount: 200 }],
    ]);

  it('bên thắng nhận lại tiền cược + phần bên thua theo tỉ lệ', () => {
    const { refund, pool, results } = settleBets(bets(), 0);
    expect(refund).toBe(false);
    expect(pool).toBe(600);
    expect(results).toEqual([
      { wallet: 'a', outcome: 'win', amount: 100, payout: 150 },
      { wallet: 'b', outcome: 'win', amount: 300, payout: 450 },
      { wallet: 'c', outcome: 'lose', amount: 200, payout: 0 },
    ]);
  });

  it('hoà hoặc kèo một phía thì hoàn tiền', () => {
    expect(settleBets(bets(), null).results.every((r) => r.outcome === 'refund' && r.payout === r.amount)).toBe(true);
    const oneSide = new Map<string, Bet>([['a', { side: 1, amount: 50 }]]);
    expect(settleBets(oneSide, 0).results).toEqual([{ wallet: 'a', outcome: 'refund', amount: 50, payout: 50 }]);
  });
});
