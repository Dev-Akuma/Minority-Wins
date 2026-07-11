"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryStakeRepository = exports.InMemoryMatchRepository = void 0;
const types_1 = require("../types");
class InMemoryMatchRepository {
    matches = new Map();
    matchCounter = 1;
    async createMatch(roomId, config) {
        const id = `match-${Date.now()}`;
        const match = {
            id,
            matchNumber: this.matchCounter++,
            roomId,
            status: types_1.MatchStatus.WAITING_FOR_PLAYERS,
            startedAt: null,
            finishedAt: null,
            winningNumbers: [],
            totalPool: 0,
            platformFeePercentage: config.platformFeePercentage,
            platformFeeAmount: 0,
            distributedPool: 0,
        };
        this.matches.set(id, match);
        return { ...match };
    }
    async updateMatch(match) {
        this.matches.set(match.id, { ...match });
        return { ...match };
    }
    async getMatch(id) {
        const match = this.matches.get(id);
        return match ? { ...match } : null;
    }
    async getCurrentMatchForRoom(roomId) {
        const activeMatches = Array.from(this.matches.values()).filter(m => m.roomId === roomId && m.status !== types_1.MatchStatus.WAITING_FOR_PLAYERS);
        if (activeMatches.length > 0)
            return activeMatches[activeMatches.length - 1];
        return null;
    }
}
exports.InMemoryMatchRepository = InMemoryMatchRepository;
class InMemoryStakeRepository {
    stakes = [];
    async addStake(stake) {
        this.stakes.push({ ...stake });
    }
    async getStakesForMatch(matchId) {
        return this.stakes.filter(s => s.matchId === matchId).map(s => ({ ...s }));
    }
}
exports.InMemoryStakeRepository = InMemoryStakeRepository;
//# sourceMappingURL=InMemoryRepositories.js.map