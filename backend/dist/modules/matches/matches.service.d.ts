import { OnModuleInit } from '@nestjs/common';
import { PrismaMatchRepository } from '../../engines/match/PrismaMatchRepository';
import { PrismaStakeRepository } from '../../engines/match/PrismaStakeRepository';
import { MatchGateway } from './match.gateway';
import { VaultService } from '../vault/vault.service';
import { MatchState } from '../../engines/match/types';
import { PrismaService } from '../../prisma.service';
export declare class MatchesService implements OnModuleInit {
    private readonly gateway;
    private readonly vaultService;
    private readonly prisma;
    readonly matchRepo: PrismaMatchRepository;
    readonly stakeRepo: PrismaStakeRepository;
    private engine;
    private currentMatchId;
    constructor(gateway: MatchGateway, vaultService: VaultService, prisma: PrismaService);
    private liveMatchStats;
    private uniqueBettors;
    onModuleInit(): Promise<void>;
    private resetLiveStats;
    getCurrentMatch(): Promise<MatchState | null>;
    getMatchAggregates(matchId: string): Promise<{
        totalPrizePool: number;
        lowestStake: number;
        highestStake: number;
    }>;
    placeStake(userId: string, selectedNumber: number, amount: number): Promise<void>;
}
