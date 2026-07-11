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
exports.VaultService = void 0;
const common_1 = require("@nestjs/common");
const PrismaVaultRepository_1 = require("./PrismaVaultRepository");
const prisma_service_1 = require("../../prisma.service");
let VaultService = class VaultService {
    repo;
    constructor(prisma) {
        this.repo = new PrismaVaultRepository_1.PrismaVaultRepository(prisma);
    }
    async getUserBalance(userId) {
        return this.repo.getUser(userId);
    }
    async transact(userId, amount, type, referenceId) {
        try {
            return await this.repo.transact(userId, amount, type, referenceId);
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message);
        }
    }
};
exports.VaultService = VaultService;
exports.VaultService = VaultService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VaultService);
//# sourceMappingURL=vault.service.js.map