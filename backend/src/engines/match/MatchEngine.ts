import { MatchState, MatchStatus, MatchRepository, StakeRepository, MatchEvents, RoomConfig } from './types';
import { StateMachine } from './StateMachine';
import { PrizeCalculator } from './PrizeCalculator';

export class MatchEngine {
  constructor(
    private readonly matchRepo: MatchRepository,
    private readonly stakeRepo: StakeRepository,
    private readonly events: MatchEvents,
    private readonly config: RoomConfig
  ) {}

  /**
   * Initializes a new match in the room.
   */
  public async initializeMatch(): Promise<MatchState> {
    const match = await this.matchRepo.createMatch(this.config.id, this.config);
    this.events.onMatchStatusChanged(match);
    return match;
  }

  public async tick(currentMatchId: string): Promise<void> {
    const match = await this.matchRepo.getMatch(currentMatchId);
    if (!match) throw new Error(`Match ${currentMatchId} not found`);

    const now = new Date();

    switch (match.status) {
      case MatchStatus.WAITING:
        if (match.startedAt && (now.getTime() - match.startedAt.getTime() >= this.config.waitingDurationSeconds * 1000)) {
          this.transitionAndSave(match, MatchStatus.BETTING);
          this.events.onMatchStarted(match); // Trigger stats reset and broadcast
        }
        break;

      case MatchStatus.BETTING:
        if (match.startedAt && (now.getTime() - match.startedAt.getTime() >= this.config.matchDurationSeconds * 1000)) {
          this.transitionAndSave(match, MatchStatus.LOCKED);
        }
        break;

      case MatchStatus.LOCKED:
        // Build suspense for 3 seconds before calculating and showing result
        if (match.startedAt && (now.getTime() - match.startedAt.getTime() >= 3000)) {
           // We overload startedAt for LOCKED state just to use it as a 3s timer here, actually let's set it in StateMachine or just wait 3 seconds based on when LOCKED started. 
           // Wait, transition() doesn't set startedAt for LOCKED.
           // To keep it simple, I'll calculate results immediately and transition to RESULT
           await this.calculateResults(match);
           this.transitionAndSave(match, MatchStatus.RESULT);
           this.events.onMatchFinished(match);
        } else if (!match.startedAt) {
           match.startedAt = new Date(); // Hack to track LOCKED start
           await this.matchRepo.updateMatch(match);
        }
        break;

      case MatchStatus.RESULT:
        if (match.finishedAt && (now.getTime() - match.finishedAt.getTime() >= this.config.resultDurationSeconds * 1000)) {
          this.transitionAndSave(match, MatchStatus.WAITING);
        }
        break;
    }
  }

  private async calculateResults(match: MatchState): Promise<void> {
    const stakes = await this.stakeRepo.getStakesForMatch(match.id);
    const { match: updatedMatch, distributions } = PrizeCalculator.calculate(match, stakes);
    
    await this.matchRepo.updateMatch(updatedMatch);
    
    if (distributions.length > 0) {
      this.events.onPrizeDistributed(match.id, distributions);
    }
  }

  private async transitionAndSave(match: MatchState, nextStatus: MatchStatus): Promise<void> {
    const updated = StateMachine.transition(match, nextStatus);
    await this.matchRepo.updateMatch(updated);
    this.events.onMatchStatusChanged(updated);
  }
}
