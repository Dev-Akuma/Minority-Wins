import { MatchState, MatchRepository, StakeRepository, MatchEvents, RoomConfig } from './types';
export declare class MatchEngine {
    private readonly matchRepo;
    private readonly stakeRepo;
    private readonly events;
    private readonly config;
    constructor(matchRepo: MatchRepository, stakeRepo: StakeRepository, events: MatchEvents, config: RoomConfig);
    initializeMatch(): Promise<MatchState>;
    tick(currentMatchId: string): Promise<void>;
    private calculateResults;
    private transitionAndSave;
}
