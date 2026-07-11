import { Stake, MatchState } from './types';

export interface PrizeDistribution {
  userId: string;
  amount: number;
}

export class PrizeCalculator {
  /**
   * Calculates the winning numbers, deducts platform fee, and distributes the prize.
   */
  public static calculate(match: MatchState, stakes: Stake[]): { match: MatchState, distributions: PrizeDistribution[] } {
    if (stakes.length === 0) {
      match.winningNumbers = [];
      match.totalPool = 0;
      match.platformFeeAmount = 0;
      match.distributedPool = 0;
      return { match, distributions: [] };
    }

    // 1. Group stakes by number
    const poolByNumber = new Map<number, number>();
    for (let i = 0; i <= 9; i++) poolByNumber.set(i, 0);

    let totalPool = 0;

    stakes.forEach(stake => {
      const current = poolByNumber.get(stake.selectedNumber) || 0;
      poolByNumber.set(stake.selectedNumber, current + stake.stakeAmount);
      totalPool += stake.stakeAmount;
    });

    // 2. Find the lowest stake pool(s). We only consider numbers that have stakes!
    // Wait, the rules usually say: "The number with the lowest total stake wins."
    // Does 0 stakes count as a win? Usually, players must be ON the number to win it.
    // If a number has 0 stakes, nobody wins. So we only find the minimum among numbers > 0 stakes.
    
    let minStake = Infinity;
    const stakedNumbers = Array.from(poolByNumber.entries()).filter(([_, amount]) => amount > 0);
    
    stakedNumbers.forEach(([_, amount]) => {
      if (amount < minStake) minStake = amount;
    });

    const winningNumbers = stakedNumbers
      .filter(([_, amount]) => amount === minStake)
      .map(([num, _]) => num);

    // 3. Calculate Fees
    const platformFeeAmount = totalPool * match.platformFeePercentage;
    const distributedPool = totalPool - platformFeeAmount;

    // 4. Update Match Result
    match.totalPool = totalPool;
    match.platformFeeAmount = platformFeeAmount;
    match.distributedPool = distributedPool;
    match.winningNumbers = winningNumbers;

    // 5. Calculate Distributions for the winners
    const distributions: PrizeDistribution[] = [];
    const winningStakes = stakes.filter(s => winningNumbers.includes(s.selectedNumber));
    
    // The total amount staked on the winning numbers
    const totalWinningStake = winningStakes.reduce((sum, s) => sum + s.stakeAmount, 0);

    // Distribute proportionally based on their contribution to the winning pool
    winningStakes.forEach(stake => {
      const proportion = stake.stakeAmount / totalWinningStake;
      const prizeAmount = distributedPool * proportion;
      distributions.push({
        userId: stake.userId,
        amount: prizeAmount
      });
    });

    return { match, distributions };
  }
}
