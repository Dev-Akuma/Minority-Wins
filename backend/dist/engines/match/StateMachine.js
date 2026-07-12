"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachine = void 0;
const types_1 = require("./types");
class StateMachine {
    static TRANSITIONS = {
        [types_1.MatchStatus.WAITING]: [types_1.MatchStatus.BETTING],
        [types_1.MatchStatus.BETTING]: [types_1.MatchStatus.LOCKED],
        [types_1.MatchStatus.LOCKED]: [types_1.MatchStatus.RESULT],
        [types_1.MatchStatus.RESULT]: [types_1.MatchStatus.WAITING],
    };
    static transition(match, nextStatus) {
        const validNextStates = this.TRANSITIONS[match.status];
        if (!validNextStates.includes(nextStatus)) {
            throw new Error(`Invalid state transition from ${match.status} to ${nextStatus}`);
        }
        match.status = nextStatus;
        if (nextStatus === types_1.MatchStatus.WAITING) {
            match.startedAt = new Date();
        }
        if (nextStatus === types_1.MatchStatus.BETTING) {
            match.startedAt = new Date();
        }
        if (nextStatus === types_1.MatchStatus.RESULT) {
            match.finishedAt = new Date();
        }
        return match;
    }
}
exports.StateMachine = StateMachine;
//# sourceMappingURL=StateMachine.js.map