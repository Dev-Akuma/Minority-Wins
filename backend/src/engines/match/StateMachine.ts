import { MatchState, MatchStatus } from './types';

export class StateMachine {
  
  // Valid transitions mapping
  private static readonly TRANSITIONS: Record<MatchStatus, MatchStatus[]> = {
    [MatchStatus.WAITING_FOR_PLAYERS]: [MatchStatus.STARTING],
    [MatchStatus.STARTING]: [MatchStatus.STAKING_OPEN, MatchStatus.WAITING_FOR_PLAYERS], // Can abort back to waiting
    [MatchStatus.STAKING_OPEN]: [MatchStatus.LOCKED],
    [MatchStatus.LOCKED]: [MatchStatus.CALCULATING],
    [MatchStatus.CALCULATING]: [MatchStatus.RESULT],
    [MatchStatus.RESULT]: [MatchStatus.RESETTING],
    [MatchStatus.RESETTING]: [MatchStatus.WAITING_FOR_PLAYERS],
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
    if (nextStatus === MatchStatus.STARTING) {
      match.startedAt = new Date();
    }
    
    if (nextStatus === MatchStatus.RESULT) {
      match.finishedAt = new Date();
    }

    return match;
  }
}
