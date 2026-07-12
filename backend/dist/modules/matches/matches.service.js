"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesService = void 0;
const common_1 = require("@nestjs/common");
const MatchEngine_1 = require("../../engines/match/MatchEngine");
const PrismaMatchRepository_1 = require("../../engines/match/PrismaMatchRepository");
const PrismaStakeRepository_1 = require("../../engines/match/PrismaStakeRepository");
const match_gateway_1 = require("./match.gateway");
const vault_service_1 = require("../vault/vault.service");
const types_1 = require("../../engines/match/types");
const prisma_service_1 = require("../../prisma.service");
let MatchesService = class MatchesService {
    gateway;
    vaultService;
    prisma;
    matchRepo;
    stakeRepo;
    engine;
    currentMatchId;
    constructor(gateway, vaultService, prisma) {
        this.gateway = gateway;
        this.vaultService = vaultService;
        this.prisma = prisma;
        this.matchRepo = new PrismaMatchRepository_1.PrismaMatchRepository(this.prisma);
        this.stakeRepo = new PrismaStakeRepository_1.PrismaStakeRepository(this.prisma);
    }
    liveMatchStats = {
        matchId: '',
        totalPrizePool: 0,
        totalBettors: 0,
        numberStats: {},
        finalNumberTotals: {},
        lowestBet: Infinity,
        highestBet: 0,
    };
    uniqueBettors = new Set();
    async onModuleInit() {
        const roomConfig = {
            id: 'room-alpha',
            minimumPlayers: 2,
            platformFeePercentage: 0.05,
            waitingDurationSeconds: 10,
            matchDurationSeconds: 30,
            resultDurationSeconds: 10,
            startingCoins: 10000
        };
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
            onMatchStarted: (match) => {
                this.resetLiveStats(match.id);
                this.gateway.emitMatchStarted(match);
            },
            onMatchStatusChanged: (match) => this.gateway.emitMatchStatusChanged(match),
            onMatchFinished: (match) => this.gateway.emitMatchFinished(match),
            onPrizeDistributed: async (matchId, winners) => {
                this.gateway.emitPrizeDistributed(matchId, winners);
                for (const w of winners) {
                    await this.vaultService.transact(w.userId, w.amount, 'WIN', matchId);
                }
            }
        };
        this.engine = new MatchEngine_1.MatchEngine(this.matchRepo, this.stakeRepo, events, roomConfig);
        const match = await this.engine.initializeMatch();
        this.currentMatchId = match.id;
        setInterval(async () => {
            let m = await this.matchRepo.getMatch(this.currentMatchId);
            if (m?.status === types_1.MatchStatus.WAITING && !m.startedAt) {
                m.startedAt = new Date();
                await this.matchRepo.updateMatch(m);
            }
            if (m?.status === types_1.MatchStatus.RESULT && m.finishedAt) {
                const now = new Date().getTime();
                const finishedAt = m.finishedAt.getTime();
                const timeRemaining = Math.max(0, roomConfig.resultDurationSeconds - Math.floor((now - finishedAt) / 1000));
                if (timeRemaining === 0) {
                    const newMatch = await this.engine.initializeMatch();
                    this.currentMatchId = newMatch.id;
                    this.resetLiveStats(newMatch.id);
                    return;
                }
            }
            if (m) {
                await this.engine.tick(m.id);
            }
        }, 1000);
        setInterval(async () => {
            if (this.currentMatchId) {
                const m = await this.matchRepo.getMatch(this.currentMatchId);
                if (m) {
                    let timeRemaining = 0;
                    const now = new Date().getTime();
                    const startedAt = m.startedAt ? m.startedAt.getTime() : now;
                    const finishedAt = m.finishedAt ? m.finishedAt.getTime() : now;
                    if (m.status === types_1.MatchStatus.WAITING) {
                        timeRemaining = Math.max(0, roomConfig.waitingDurationSeconds - Math.floor((now - startedAt) / 1000));
                    }
                    else if (m.status === types_1.MatchStatus.BETTING) {
                        timeRemaining = Math.max(0, roomConfig.matchDurationSeconds - Math.floor((now - startedAt) / 1000));
                    }
                    else if (m.status === types_1.MatchStatus.RESULT) {
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
    resetLiveStats(matchId) {
        this.liveMatchStats = {
            matchId,
            totalPrizePool: 0,
            totalBettors: 0,
            numberStats: {},
            finalNumberTotals: {},
            lowestBet: Infinity,
            highestBet: 0,
        };
        this.uniqueBettors.clear();
    }
    async getCurrentMatch() {
        return this.matchRepo.getMatch(this.currentMatchId);
    }
    async getMatchHistory() {
        return this.prisma.match.findMany({
            where: { status: 'RESULT' },
            orderBy: { createdAt: 'desc' },
            take: 10,
            select: {
                id: true,
                matchNumber: true,
                winningNumbers: true,
                totalPool: true,
                createdAt: true,
            }
        });
    }
    async getMatchAggregates(matchId) {
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
    async placeStake(userId, selectedNumber, amount) {
        const match = await this.getCurrentMatch();
        if (!match || match.status !== types_1.MatchStatus.BETTING) {
            throw new common_1.BadRequestException('Match is not open for staking');
        }
        if (selectedNumber < 0 || selectedNumber > 9) {
            throw new common_1.BadRequestException('Selected number must be between 0 and 9');
        }
        await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user)
                throw new common_1.BadRequestException('User not found');
            if (user.balance < amount)
                throw new common_1.BadRequestException('Insufficient funds');
            await tx.user.update({
                where: { id: userId },
                data: { balance: { decrement: amount } }
            });
            await tx.vaultTransaction.create({
                data: {
                    userId,
                    amount: -amount,
                    type: 'STAKE',
                    referenceId: match.id,
                }
            });
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
        if (this.liveMatchStats.matchId !== match.id) {
            this.resetLiveStats(match.id);
        }
        this.liveMatchStats.totalPrizePool += amount;
        this.uniqueBettors.add(userId);
        this.liveMatchStats.totalBettors = this.uniqueBettors.size;
        const numStr = selectedNumber.toString();
        this.liveMatchStats.numberStats[numStr] = (this.liveMatchStats.numberStats[numStr] || 0) + 1;
        this.liveMatchStats.finalNumberTotals[numStr] = (this.liveMatchStats.finalNumberTotals[numStr] || 0) + amount;
        if (amount < this.liveMatchStats.lowestBet)
            this.liveMatchStats.lowestBet = amount;
        if (amount > this.liveMatchStats.highestBet)
            this.liveMatchStats.highestBet = amount;
    }
};
exports.MatchesService = MatchesService;
exports.MatchesService = MatchesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [match_gateway_1.MatchGateway,
        vault_service_1.VaultService,
        prisma_service_1.PrismaService])
], MatchesService);
//# sourceMappingURL=matches.service.js.map