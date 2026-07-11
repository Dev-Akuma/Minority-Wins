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
    onModuleInit(): Promise<void>;
    getCurrentMatch(): Promise<MatchState | null>;
    placeStake(userId: string, selectedNumber: number, amount: number): Promise<void>;
}
