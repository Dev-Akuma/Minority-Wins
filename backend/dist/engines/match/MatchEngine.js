"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MatchEngine = void 0;
const types_1 = require("./types");
const StateMachine_1 = require("./StateMachine");
const PrizeCalculator_1 = require("./PrizeCalculator");
class MatchEngine {
    matchRepo;
    stakeRepo;
    events;
    config;
    constructor(matchRepo, stakeRepo, events, config) {
        this.matchRepo = matchRepo;
        this.stakeRepo = stakeRepo;
        this.events = events;
        this.config = config;
    }
    async initializeMatch() {
        const match = await this.matchRepo.createMatch(this.config.id, this.config);
        this.events.onMatchStatusChanged(match);
        return match;
    }
    async tick(currentMatchId) {
        const match = await this.matchRepo.getMatch(currentMatchId);
        if (!match)
            throw new Error(`Match ${currentMatchId} not found`);
        const now = new Date();
        switch (match.status) {
            case types_1.MatchStatus.WAITING:
                if (match.startedAt && (now.getTime() - match.startedAt.getTime() >= this.config.waitingDurationSeconds * 1000)) {
                    this.transitionAndSave(match, types_1.MatchStatus.BETTING);
                    this.events.onMatchStarted(match);
                }
                break;
            case types_1.MatchStatus.BETTING:
                if (match.startedAt && (now.getTime() - match.startedAt.getTime() >= this.config.matchDurationSeconds * 1000)) {
                    this.transitionAndSave(match, types_1.MatchStatus.LOCKED);
                }
                break;
            case types_1.MatchStatus.LOCKED:
                if (match.startedAt && (now.getTime() - match.startedAt.getTime() >= 3000)) {
                    await this.calculateResults(match);
                    this.transitionAndSave(match, types_1.MatchStatus.RESULT);
                    this.events.onMatchFinished(match);
                }
                else if (!match.startedAt) {
                    match.startedAt = new Date();
                    await this.matchRepo.updateMatch(match);
                }
                break;
            case types_1.MatchStatus.RESULT:
                if (match.finishedAt && (now.getTime() - match.finishedAt.getTime() >= this.config.resultDurationSeconds * 1000)) {
                    this.transitionAndSave(match, types_1.MatchStatus.WAITING);
                }
                break;
        }
    }
    async calculateResults(match) {
        const stakes = await this.stakeRepo.getStakesForMatch(match.id);
        const { match: updatedMatch, distributions } = PrizeCalculator_1.PrizeCalculator.calculate(match, stakes);
        await this.matchRepo.updateMatch(updatedMatch);
        if (distributions.length > 0) {
            this.events.onPrizeDistributed(match.id, distributions);
        }
    }
    async transitionAndSave(match, nextStatus) {
        const updated = StateMachine_1.StateMachine.transition(match, nextStatus);
        await this.matchRepo.updateMatch(updated);
        this.events.onMatchStatusChanged(updated);
    }
}
exports.MatchEngine = MatchEngine;
//# sourceMappingURL=MatchEngine.js.map