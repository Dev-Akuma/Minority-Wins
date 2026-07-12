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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchesController = void 0;
const common_1 = require("@nestjs/common");
const matches_service_1 = require("./matches.service");
const place_stake_dto_1 = require("./dto/place-stake.dto");
let MatchesController = class MatchesController {
    matchesService;
    constructor(matchesService) {
        this.matchesService = matchesService;
    }
    async getCurrentMatch() {
        const match = await this.matchesService.getCurrentMatch();
        if (!match)
            return null;
        const aggregates = await this.matchesService.getMatchAggregates(match.id);
        return {
            ...match,
            totalPrizePool: aggregates.totalPrizePool,
            lowestStake: aggregates.lowestStake,
            highestStake: aggregates.highestStake,
        };
    }
    async getMatchHistory() {
        return this.matchesService.getMatchHistory();
    }
    async placeStake(dto) {
        await this.matchesService.placeStake(dto.userId, dto.selectedNumber, dto.amount);
        return { success: true };
    }
};
exports.MatchesController = MatchesController;
__decorate([
    (0, common_1.Get)('current'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchesController.prototype, "getCurrentMatch", null);
__decorate([
    (0, common_1.Get)('history'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], MatchesController.prototype, "getMatchHistory", null);
__decorate([
    (0, common_1.Post)('stake'),
    __param(0, (0, common_1.Body)(new common_1.ValidationPipe({ transform: true }))),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [place_stake_dto_1.PlaceStakeDto]),
    __metadata("design:returntype", Promise)
], MatchesController.prototype, "placeStake", null);
exports.MatchesController = MatchesController = __decorate([
    (0, common_1.Controller)('matches'),
    __metadata("design:paramtypes", [matches_service_1.MatchesService])
], MatchesController);
//# sourceMappingURL=matches.controller.js.map