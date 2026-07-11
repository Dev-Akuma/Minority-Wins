import { MatchesService } from './matches.service';
export declare class MatchesController {
    private readonly matchesService;
    constructor(matchesService: MatchesService);
    getCurrentMatch(): Promise<import("../../engines/match/types").MatchState | null>;
    placeStake(userId: string, selectedNumber: number, amount: number): Promise<{
        success: boolean;
    }>;
}
