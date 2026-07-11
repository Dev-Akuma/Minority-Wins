import { Stake, MatchState } from './types';
export interface PrizeDistribution {
    userId: string;
    amount: number;
}
export declare class PrizeCalculator {
    static calculate(match: MatchState, stakes: Stake[]): {
        match: MatchState;
        distributions: PrizeDistribution[];
    };
}
