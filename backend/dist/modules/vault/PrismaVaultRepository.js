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
exports.PrismaVaultRepository = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../prisma.service");
let PrismaVaultRepository = class PrismaVaultRepository {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getUser(userId) {
        let user = await this.prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    id: userId,
                    googleId: userId,
                    email: `${userId}@example.com`,
                    phoneNumber: `+910000${userId.substring(0, 6)}`,
                    username: `User_${userId.substring(0, 8)}`,
                    balance: 10000,
                }
            });
            await this.prisma.vaultTransaction.create({
                data: {
                    userId,
                    amount: 10000,
                    type: 'INITIAL_GRANT',
                }
            });
        }
        return {
            id: user.id,
            balance: user.balance,
        };
    }
    async transact(userId, amount, type, referenceId) {
        const updatedUser = await this.prisma.$transaction(async (tx) => {
            const user = await tx.user.findUnique({ where: { id: userId } });
            if (!user)
                throw new Error('User not found');
            if (user.balance + amount < 0) {
                throw new Error('Insufficient funds');
            }
            const updated = await tx.user.update({
                where: { id: userId },
                data: { balance: { increment: amount } }
            });
            await tx.vaultTransaction.create({
                data: {
                    userId,
                    amount,
                    type,
                    referenceId,
                }
            });
            return updated;
        });
        return {
            id: updatedUser.id,
            balance: updatedUser.balance,
        };
    }
};
exports.PrismaVaultRepository = PrismaVaultRepository;
exports.PrismaVaultRepository = PrismaVaultRepository = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], PrismaVaultRepository);
//# sourceMappingURL=PrismaVaultRepository.js.map