import { MatchRepository, MatchState, RoomConfig, MatchStatus } from './types';
import { PrismaService } from '../../prisma.service';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PrismaMatchRepository implements MatchRepository {
  constructor(private prisma: PrismaService) {}

  public async createMatch(roomId: string, config: RoomConfig): Promise<MatchState> {
    const match = await this.prisma.match.create({
      data: {
        roomId,
        status: MatchStatus.WAITING_FOR_PLAYERS,
        totalPool: 0,
        platformFeePercentage: config.platformFeePercentage,
        platformFeeAmount: 0,
        distributedPool: 0,
      }
    });
    return this.mapToDomain(match);
  }

  public async updateMatch(match: MatchState): Promise<MatchState> {
    const updated = await this.prisma.match.update({
      where: { id: match.id },
      data: {
        status: match.status as any,
        startedAt: match.startedAt,
        finishedAt: match.finishedAt,
        winningNumbers: match.winningNumbers,
        totalPool: match.totalPool,
        platformFeeAmount: match.platformFeeAmount,
        distributedPool: match.distributedPool,
      }
    });
    return this.mapToDomain(updated);
  }

  public async getMatch(id: string): Promise<MatchState | null> {
    const match = await this.prisma.match.findUnique({ where: { id } });
    if (!match) return null;
    return this.mapToDomain(match);
  }

  public async getCurrentMatchForRoom(roomId: string): Promise<MatchState | null> {
    const match = await this.prisma.match.findFirst({
      where: { roomId, status: { not: 'WAITING_FOR_PLAYERS' } },
      orderBy: { createdAt: 'desc' }
    });
    if (!match) return null;
    return this.mapToDomain(match);
  }

  private mapToDomain(dbMatch: any): MatchState {
    return {
      id: dbMatch.id,
      matchNumber: dbMatch.matchNumber,
      roomId: dbMatch.roomId,
      status: dbMatch.status as MatchStatus,
      startedAt: dbMatch.startedAt,
      finishedAt: dbMatch.finishedAt,
      winningNumbers: dbMatch.winningNumbers,
      totalPool: dbMatch.totalPool,
      platformFeePercentage: dbMatch.platformFeePercentage,
      platformFeeAmount: dbMatch.platformFeeAmount,
      distributedPool: dbMatch.distributedPool,
    };
  }
}
