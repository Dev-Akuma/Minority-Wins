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
exports.PrismaStakeRepository = void 0;
const prisma_service_1 = require("../../prisma.service");
const common_1 = require("@nestjs/common");
let PrismaStakeRepository = class PrismaStakeRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getStakesForMatch(matchId) {
        const stakes = await this.prisma.stake.findMany({
            where: { matchId }
        });
        return stakes.map(s => ({
            id: s.id,
            userId: s.userId,
            matchId: s.matchId,
            selectedNumber: s.selectedNumber,
            stakeAmount: s.stakeAmount,
            status: s.status,
        }));
    }
    async addStake(stake) {
        await this.prisma.stake.create({
            data: {
                id: stake.id,
                userId: stake.userId,
                matchId: stake.matchId,
                selectedNumber: stake.selectedNumber,
                stakeAmount: stake.stakeAmount,
                status: stake.status,
            }
        });
    }
};
exports.PrismaStakeRepository = PrismaStakeRepository;
exports.PrismaStakeRepository = PrismaStakeRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaStakeRepository);
//# sourceMappingURL=PrismaStakeRepository.js.map