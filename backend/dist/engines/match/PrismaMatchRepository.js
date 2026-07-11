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
exports.PrismaMatchRepository = void 0;
const types_1 = require("./types");
const prisma_service_1 = require("../../prisma.service");
const common_1 = require("@nestjs/common");
let PrismaMatchRepository = class PrismaMatchRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createMatch(roomId, config) {
        const match = await this.prisma.match.create({
            data: {
                roomId,
                status: types_1.MatchStatus.WAITING_FOR_PLAYERS,
                totalPool: 0,
                platformFeePercentage: config.platformFeePercentage,
                platformFeeAmount: 0,
                distributedPool: 0,
            }
        });
        return this.mapToDomain(match);
    }
    async updateMatch(match) {
        const updated = await this.prisma.match.update({
            where: { id: match.id },
            data: {
                status: match.status,
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
    async getMatch(id) {
        const match = await this.prisma.match.findUnique({ where: { id } });
        if (!match)
            return null;
        return this.mapToDomain(match);
    }
    async getCurrentMatchForRoom(roomId) {
        const match = await this.prisma.match.findFirst({
            where: { roomId, status: { not: 'WAITING_FOR_PLAYERS' } },
            orderBy: { createdAt: 'desc' }
        });
        if (!match)
            return null;
        return this.mapToDomain(match);
    }
    mapToDomain(dbMatch) {
        return {
            id: dbMatch.id,
            matchNumber: dbMatch.matchNumber,
            roomId: dbMatch.roomId,
            status: dbMatch.status,
            startedAt: dbMatch.startedAt,
            finishedAt: dbMatch.finishedAt,
            winningNumbers: dbMatch.winningNumbers,
            totalPool: dbMatch.totalPool,
            platformFeePercentage: dbMatch.platformFeePercentage,
            platformFeeAmount: dbMatch.platformFeeAmount,
            distributedPool: dbMatch.distributedPool,
        };
    }
};
exports.PrismaMatchRepository = PrismaMatchRepository;
exports.PrismaMatchRepository = PrismaMatchRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaMatchRepository);
//# sourceMappingURL=PrismaMatchRepository.js.map