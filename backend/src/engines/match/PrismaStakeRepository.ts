import { StakeRepository, Stake } from './types';
import { PrismaService } from '../../prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaStakeRepository implements StakeRepository {
  constructor(private prisma: PrismaService) {}

  public async getStakesForMatch(matchId: string): Promise<Stake[]> {
    const stakes = await this.prisma.stake.findMany({
      where: { matchId }
    });
    
    return stakes.map(s => ({
      id: s.id,
      userId: s.userId,
      matchId: s.matchId,
      selectedNumber: s.selectedNumber,
      stakeAmount: s.stakeAmount,
      status: s.status as any,
    }));
  }

  public async addStake(stake: Stake): Promise<void> {
    await this.prisma.stake.create({
      data: {
        id: stake.id,
        userId: stake.userId,
        matchId: stake.matchId,
        selectedNumber: stake.selectedNumber,
        stakeAmount: stake.stakeAmount,
        status: stake.status as any,
      }
    });
  }
}
