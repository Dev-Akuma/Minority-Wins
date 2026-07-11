import { MatchState, MatchStatus } from './types';
export declare class StateMachine {
    private static readonly TRANSITIONS;
    static transition(match: MatchState, nextStatus: MatchStatus): MatchState;
}
