import { Injectable, OnModuleInit, BadRequestException } from '@nestjs/common';
import { MatchEngine } from '../../engines/match/MatchEngine';
import { PrismaMatchRepository } from '../../engines/match/PrismaMatchRepository';
import { PrismaStakeRepository } from '../../engines/match/PrismaStakeRepository';
import { MatchGateway } from './match.gateway';
import { VaultService } from '../vault/vault.service';
import { MatchStatus, RoomConfig, MatchState } from '../../engines/match/types';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class MatchesService implements OnModuleInit {
  public readonly matchRepo: PrismaMatchRepository;
  public readonly stakeRepo: PrismaStakeRepository;
  private engine: MatchEngine;
  private currentMatchId: string;

  constructor(
    private readonly gateway: MatchGateway,
    private readonly vaultService: VaultService,
    private readonly prisma: PrismaService
  ) {
    this.matchRepo = new PrismaMatchRepository(this.prisma);
    this.stakeRepo = new PrismaStakeRepository(this.prisma);
  }

  private liveMatchStats = {
    matchId: '',
    totalPrizePool: 0,
    totalBettors: 0,
    numberStats: {} as Record<string, number>, // mapping from number string to count
    lowestBet: Infinity,
    highestBet: 0,
  };
  private uniqueBettors = new Set<string>();

  async onModuleInit() {
    const roomConfig: RoomConfig = {
      id: 'room-alpha',
      minimumPlayers: 2,
      platformFeePercentage: 0.05,
      waitingDurationSeconds: 10,
      matchDurationSeconds: 30, // 30 sec match
      resultDurationSeconds: 10, // 10 sec result display
      startingCoins: 10000
    };

    // Ensure Room exists
    const room = await this.prisma.room.findUnique({ where: { id: roomConfig.id } });
    if (!room) {
      await this.prisma.room.create({
        data: {
          id: roomConfig.id,
          name: 'Alpha Room',
          minimumPlayers: roomConfig.minimumPlayers,
          platformFeePercentage: roomConfig.platformFeePercentage,
          matchDurationSeconds: roomConfig.matchDurationSeconds,
          resultDurationSeconds: roomConfig.resultDurationSeconds,
          startingCoins: roomConfig.startingCoins
        }
      });
    }

    const events = {
      onMatchStarted: (match: MatchState) => {
        this.resetLiveStats(match.id);
        this.gateway.emitMatchStarted(match);
      },
      onMatchStatusChanged: (match: MatchState) => this.gateway.emitMatchStatusChanged(match),
      onMatchFinished: (match: MatchState) => this.gateway.emitMatchFinished(match),
      onPrizeDistributed: async (matchId: string, winners: { userId: string, amount: number }[]) => {
        this.gateway.emitPrizeDistributed(matchId, winners);
        for (const w of winners) {
          await this.vaultService.transact(w.userId, w.amount, 'WIN', matchId);
        }
      }
    };

    this.engine = new MatchEngine(this.matchRepo, this.stakeRepo, events, roomConfig);
    const match = await this.engine.initializeMatch();
    this.currentMatchId = match.id;

    // Start the global game loop
    setInterval(async () => {
      let m = await this.matchRepo.getMatch(this.currentMatchId);
      
      // Auto-start the match if it's new
      if (m?.status === MatchStatus.WAITING && !m.startedAt) {
        m.startedAt = new Date();
        await this.matchRepo.updateMatch(m);
      }

      if (m) {
        await this.engine.tick(m.id);
      }
    }, 1000);

    // Phase 2: Live Stats Broadcasting Loop (Throttled to 500ms)
    setInterval(async () => {
      if (this.currentMatchId) {
        const m = await this.matchRepo.getMatch(this.currentMatchId);
        if (m) {
          let timeRemaining = 0;
          const now = new Date().getTime();
          const startedAt = m.startedAt ? m.startedAt.getTime() : now;
          const finishedAt = m.finishedAt ? m.finishedAt.getTime() : now;

          if (m.status === MatchStatus.WAITING) {
             timeRemaining = Math.max(0, roomConfig.waitingDurationSeconds - Math.floor((now - startedAt) / 1000));
          } else if (m.status === MatchStatus.BETTING) {
             timeRemaining = Math.max(0, roomConfig.matchDurationSeconds - Math.floor((now - startedAt) / 1000));
          } else if (m.status === MatchStatus.RESULT) {
             timeRemaining = Math.max(0, roomConfig.resultDurationSeconds - Math.floor((now - finishedAt) / 1000));
          }

          this.gateway.emitLiveMatchStats(this.currentMatchId, {
            ...this.liveMatchStats,
            status: m.status,
            timeRemaining
          });
        }
      }
    }, 500);
  }

  private resetLiveStats(matchId: string) {
    this.liveMatchStats = {
      matchId,
      totalPrizePool: 0,
      totalBettors: 0,
      numberStats: {},
      lowestBet: Infinity,
      highestBet: 0,
    };
    this.uniqueBettors.clear();
  }

  public async getCurrentMatch() {
    return this.matchRepo.getMatch(this.currentMatchId);
  }

  // Phase 2: Get aggregates for the current match
  public async getMatchAggregates(matchId: string) {
    const agg = await this.prisma.stake.aggregate({
      where: { matchId },
      _sum: { stakeAmount: true },
      _min: { stakeAmount: true },
      _max: { stakeAmount: true }
    });
    return {
      totalPrizePool: agg._sum.stakeAmount ?? 0,
      lowestStake: agg._min.stakeAmount ?? 0,
      highestStake: agg._max.stakeAmount ?? 0,
    };
  }

  public async placeStake(userId: string, selectedNumber: number, amount: number) {
    const match = await this.getCurrentMatch();
    if (!match || match.status !== MatchStatus.BETTING) {
      throw new BadRequestException('Match is not open for staking');
    }

    if (selectedNumber < 0 || selectedNumber > 9) {
      throw new BadRequestException('Selected number must be between 0 and 9');
    }

    // Atomic transaction for deducting vault and creating stake
    await this.prisma.$transaction(async (tx) => {
      // 1. Verify user and balance
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new BadRequestException('User not found');
      if (user.balance < amount) throw new BadRequestException('Insufficient funds');

      // 2. Deduct from Vault
      await tx.user.update({
        where: { id: userId },
        data: { balance: { decrement: amount } }
      });

      // 3. Save Vault Transaction
      await tx.vaultTransaction.create({
        data: {
          userId,
          amount: -amount,
          type: 'STAKE',
          referenceId: match.id,
        }
      });

      // 4. Save Stake
      await tx.stake.create({
        data: {
          id: `stake-${Date.now()}-${Math.random()}`,
          userId,
          matchId: match.id,
          selectedNumber,
          stakeAmount: amount,
          status: 'ACTIVE'
        }
      });
    });

    // Phase 2: Update in-memory stats for real-time broadcast
    if (this.liveMatchStats.matchId !== match.id) {
      this.resetLiveStats(match.id);
    }
    
    this.liveMatchStats.totalPrizePool += amount;
    this.uniqueBettors.add(userId);
    this.liveMatchStats.totalBettors = this.uniqueBettors.size;
    
    const numStr = selectedNumber.toString();
    this.liveMatchStats.numberStats[numStr] = (this.liveMatchStats.numberStats[numStr] || 0) + 1;
    
    if (amount < this.liveMatchStats.lowestBet) this.liveMatchStats.lowestBet = amount;
    if (amount > this.liveMatchStats.highestBet) this.liveMatchStats.highestBet = amount;
  }
}
