"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachine = void 0;
const types_1 = require("./types");
class StateMachine {
    static TRANSITIONS = {
        [types_1.MatchStatus.WAITING_FOR_PLAYERS]: [types_1.MatchStatus.STARTING],
        [types_1.MatchStatus.STARTING]: [types_1.MatchStatus.STAKING_OPEN, types_1.MatchStatus.WAITING_FOR_PLAYERS],
        [types_1.MatchStatus.STAKING_OPEN]: [types_1.MatchStatus.LOCKED],
        [types_1.MatchStatus.LOCKED]: [types_1.MatchStatus.CALCULATING],
        [types_1.MatchStatus.CALCULATING]: [types_1.MatchStatus.RESULT],
        [types_1.MatchStatus.RESULT]: [types_1.MatchStatus.RESETTING],
        [types_1.MatchStatus.RESETTING]: [types_1.MatchStatus.WAITING_FOR_PLAYERS],
    };
    static transition(match, nextStatus) {
        const validNextStates = this.TRANSITIONS[match.status];
        if (!validNextStates.includes(nextStatus)) {
            throw new Error(`Invalid state transition from ${match.status} to ${nextStatus}`);
        }
        match.status = nextStatus;
        if (nextStatus === types_1.MatchStatus.STARTING) {
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