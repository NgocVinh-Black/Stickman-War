import type { BetOutcome, Team } from '@stickman-war/core';

export type Bet = { side: Team; amount: number };
export type BetResult = { wallet: string; outcome: BetOutcome; amount: number; payout: number };

/**
 * Chia quỹ kèo: bên thắng nhận lại tiền cược + phần của bên thua theo tỉ lệ tiền cược.
 * Hoà, hoặc kèo chỉ có một phía, thì hoàn lại toàn bộ.
 */
export function settleBets(bets: Map<string, Bet>, winner: Team | null): { refund: boolean; pool: number; results: BetResult[] } {
  const totals = [0, 0];
  for (const b of bets.values()) totals[b.side] += b.amount;
  const refund = winner === null || totals[0] === 0 || totals[1] === 0;
  const results: BetResult[] = [];
  for (const [wallet, b] of bets) {
    let outcome: BetOutcome = 'lose';
    let payout = 0;
    if (refund) {
      outcome = 'refund';
      payout = b.amount;
    } else if (b.side === winner) {
      outcome = 'win';
      payout = b.amount + Math.floor((b.amount * totals[1 - winner]) / totals[winner]);
    }
    results.push({ wallet, outcome, amount: b.amount, payout });
  }
  return { refund, pool: totals[0] + totals[1], results };
}
