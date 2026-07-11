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
    async onModuleInit() {
        const roomConfig = {
            id: 'room-alpha',
            minimumPlayers: 2,
            platformFeePercentage: 0.05,
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
            onMatchStarted: (match) => this.gateway.emitMatchStarted(match),
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
            if (m?.status === types_1.MatchStatus.WAITING_FOR_PLAYERS) {
                m.status = types_1.MatchStatus.STARTING;
                m.startedAt = new Date();
                await this.matchRepo.updateMatch(m);
            }
            else if (m?.status === types_1.MatchStatus.RESETTING) {
                m = await this.engine.initializeMatch();
                this.currentMatchId = m.id;
                m.status = types_1.MatchStatus.STARTING;
                m.startedAt = new Date();
                await this.matchRepo.updateMatch(m);
            }
            if (m) {
                await this.engine.tick(m.id);
            }
        }, 1000);
    }
    async getCurrentMatch() {
        return this.matchRepo.getMatch(this.currentMatchId);
    }
    async placeStake(userId, selectedNumber, amount) {
        const match = await this.getCurrentMatch();
        if (!match || match.status !== types_1.MatchStatus.STAKING_OPEN) {
            throw new common_1.BadRequestException('Match is not open for staking');
        }
        if (selectedNumber < 0 || selectedNumber > 9) {
            throw new common_1.BadRequestException('Selected number must be between 0 and 9');
        }
        await this.vaultService.transact(userId, -amount, 'STAKE', match.id);
        await this.stakeRepo.addStake({
            id: `stake-${Date.now()}-${Math.random()}`,
            userId,
            matchId: match.id,
            selectedNumber,
            stakeAmount: amount,
            status: 'ACTIVE'
        });
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