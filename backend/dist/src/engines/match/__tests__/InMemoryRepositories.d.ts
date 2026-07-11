import { MatchRepository, StakeRepository, MatchState, Stake, RoomConfig } from '../types';
export declare class InMemoryMatchRepository implements MatchRepository {
    private matches;
    private matchCounter;
    createMatch(roomId: string, config: RoomConfig): Promise<MatchState>;
    updateMatch(match: MatchState): Promise<MatchState>;
    getMatch(id: string): Promise<MatchState | null>;
    getCurrentMatchForRoom(roomId: string): Promise<MatchState | null>;
}
export declare class InMemoryStakeRepository implements StakeRepository {
    private stakes;
    addStake(stake: Stake): Promise<void>;
    getStakesForMatch(matchId: string): Promise<Stake[]>;
}
