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

  /**
   * Ticks the game loop forward based on time elapsed.
   * This should be called by the Interval Scheduler every second.
   */
  public async tick(currentMatchId: string): Promise<void> {
    const match = await this.matchRepo.getMatch(currentMatchId);
    if (!match) throw new Error(`Match ${currentMatchId} not found`);

    const now = new Date();

    switch (match.status) {
      case MatchStatus.STARTING:
        // Move to STAKING_OPEN immediately or after a short delay
        this.transitionAndSave(match, MatchStatus.STAKING_OPEN);
        this.events.onMatchStarted(match);
        break;

      case MatchStatus.STAKING_OPEN:
        if (match.startedAt && (now.getTime() - match.startedAt.getTime() >= this.config.matchDurationSeconds * 1000)) {
          this.transitionAndSave(match, MatchStatus.LOCKED);
        }
        break;

      case MatchStatus.LOCKED:
        this.transitionAndSave(match, MatchStatus.CALCULATING);
        break;

      case MatchStatus.CALCULATING:
        await this.calculateResults(match);
        this.transitionAndSave(match, MatchStatus.RESULT);
        this.events.onMatchFinished(match);
        break;

      case MatchStatus.RESULT:
        if (match.finishedAt && (now.getTime() - match.finishedAt.getTime() >= this.config.resultDurationSeconds * 1000)) {
          this.transitionAndSave(match, MatchStatus.RESETTING);
        }
        break;

      case MatchStatus.RESETTING:
        // End this match loop, trigger the next one
        this.transitionAndSave(match, MatchStatus.WAITING_FOR_PLAYERS);
        break;
      
      case MatchStatus.WAITING_FOR_PLAYERS:
        // Logic for checking minimum players could go here, 
        // but for now, we just wait for the room to trigger STARTING.
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
