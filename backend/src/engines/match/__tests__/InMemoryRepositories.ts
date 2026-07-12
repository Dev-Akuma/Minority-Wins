import { MatchRepository, StakeRepository, MatchState, Stake, RoomConfig, MatchStatus } from '../types';

export class InMemoryMatchRepository implements MatchRepository {
  private matches: Map<string, MatchState> = new Map();
  private matchCounter = 1;

  public async createMatch(roomId: string, config: RoomConfig): Promise<MatchState> {
    const id = `match-${Date.now()}`;
    const match: MatchState = {
      id,
      matchNumber: this.matchCounter++,
      roomId,
      status: MatchStatus.WAITING,
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

  public async updateMatch(match: MatchState): Promise<MatchState> {
    this.matches.set(match.id, { ...match });
    return { ...match };
  }

  public async getMatch(id: string): Promise<MatchState | null> {
    const match = this.matches.get(id);
    return match ? { ...match } : null;
  }

  public async getCurrentMatchForRoom(roomId: string): Promise<MatchState | null> {
    const activeMatches = Array.from(this.matches.values()).filter(m => m.roomId === roomId && m.status !== MatchStatus.WAITING);
    if (activeMatches.length > 0) return activeMatches[activeMatches.length - 1];
    return null;
  }
}

export class InMemoryStakeRepository implements StakeRepository {
  private stakes: Stake[] = [];

  public async addStake(stake: Stake): Promise<void> {
    this.stakes.push({ ...stake });
  }

  public async getStakesForMatch(matchId: string): Promise<Stake[]> {
    return this.stakes.filter(s => s.matchId === matchId).map(s => ({ ...s }));
  }
}
