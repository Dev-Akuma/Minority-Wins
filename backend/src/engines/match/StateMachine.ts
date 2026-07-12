import { MatchState, MatchStatus } from './types';

export class StateMachine {
  
  // Valid transitions mapping
  private static readonly TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
    [MatchStatus.WAITING]: [MatchStatus.BETTING],
    [MatchStatus.BETTING]: [MatchStatus.LOCKED],
    [MatchStatus.LOCKED]: [MatchStatus.RESULT],
    [MatchStatus.RESULT]: [MatchStatus.WAITING],
  };

  /**
   * Attempts to transition the match state to the target state.
   * Throws an error if the transition is invalid.
   */
  public static transition(match: MatchState, nextStatus: MatchStatus): MatchState {
    const validNextStates = this.TRANSITIONS[match.status];

    if (!validNextStates.includes(nextStatus)) {
      throw new Error(`Invalid state transition from ${match.status} to ${nextStatus}`);
    }

    match.status = nextStatus;
    
    // Handle specific side effects of state changes
    if (nextStatus === MatchStatus.WAITING) {
      match.startedAt = new Date();
    }
    
    if (nextStatus === MatchStatus.BETTING) {
      match.startedAt = new Date();
    }
    
    if (nextStatus === MatchStatus.RESULT) {
      match.finishedAt = new Date();
    }

    return match;
  }
}
