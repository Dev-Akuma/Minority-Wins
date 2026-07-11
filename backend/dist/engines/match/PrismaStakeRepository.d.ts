import { StakeRepository, Stake } from './types';
import { PrismaService } from '../../prisma.service';
export declare class PrismaStakeRepository implements StakeRepository {
    private prisma;
    constructor(prisma: PrismaService);
    getStakesForMatch(matchId: string): Promise<Stake[]>;
    addStake(stake: Stake): Promise<void>;
}
