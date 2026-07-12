import { MatchesService } from './matches.service';
import { PlaceStakeDto } from './dto/place-stake.dto';
export declare class MatchesController {
    private readonly matchesService;
    constructor(matchesService: MatchesService);
    getCurrentMatch(): Promise<{
        totalPrizePool: number;
        lowestStake: number;
        highestStake: number;
        id: string;
        matchNumber: number;
        roomId: string;
        status: import("../../engines/match/types").MatchStatus;
        startedAt: Date | null;
        finishedAt: Date | null;
        winningNumbers: number[];
        totalPool: number;
        platformFeePercentage: number;
        platformFeeAmount: number;
        distributedPool: number;
    } | null>;
    placeStake(dto: PlaceStakeDto): Promise<{
        success: boolean;
    }>;
}
