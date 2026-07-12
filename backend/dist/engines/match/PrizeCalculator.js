"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrizeCalculator = void 0;
class PrizeCalculator {
    static calculate(match, stakes) {
        if (stakes.length === 0) {
            match.winningNumbers = [-1];
            match.totalPool = 0;
            match.platformFeeAmount = 0;
            match.distributedPool = 0;
            return { match, distributions: [] };
        }
        const poolByNumber = new Map();
        for (let i = 0; i <= 9; i++)
            poolByNumber.set(i, 0);
        let totalPool = 0;
        stakes.forEach(stake => {
            const current = poolByNumber.get(stake.selectedNumber) || 0;
            poolByNumber.set(stake.selectedNumber, current + stake.stakeAmount);
            totalPool += stake.stakeAmount;
        });
        let minStake = Infinity;
        const stakedNumbers = Array.from(poolByNumber.entries()).filter(([_, amount]) => amount > 0);
        stakedNumbers.forEach(([_, amount]) => {
            if (amount < minStake)
                minStake = amount;
        });
        const isDraw = stakedNumbers.every(([_, amount]) => amount === minStake);
        if (isDraw) {
            match.winningNumbers = [-1];
            match.totalPool = totalPool;
            match.platformFeeAmount = 0;
            match.distributedPool = totalPool;
            const distributions = stakes.map(stake => ({
                userId: stake.userId,
                amount: stake.stakeAmount
            }));
            return { match, distributions };
        }
        const winningNumbers = stakedNumbers
            .filter(([_, amount]) => amount === minStake)
            .map(([num, _]) => num);
        const platformFeeAmount = totalPool * match.platformFeePercentage;
        const distributedPool = totalPool - platformFeeAmount;
        match.totalPool = totalPool;
        match.platformFeeAmount = platformFeeAmount;
        match.distributedPool = distributedPool;
        match.winningNumbers = winningNumbers;
        const distributions = [];
        const winningStakes = stakes.filter(s => winningNumbers.includes(s.selectedNumber));
        const totalWinningStake = winningStakes.reduce((sum, s) => sum + s.stakeAmount, 0);
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
exports.PrizeCalculator = PrizeCalculator;
//# sourceMappingURL=PrizeCalculator.js.map