import { MatchRepository, MatchState, RoomConfig } from './types';
import { PrismaService } from '../../prisma.service';
export declare class PrismaMatchRepository implements MatchRepository {
    private prisma;
    constructor(prisma: PrismaService);
    createMatch(roomId: string, config: RoomConfig): Promise<MatchState>;
    updateMatch(match: MatchState): Promise<MatchState>;
    getMatch(id: string): Promise<MatchState | null>;
    getCurrentMatchForRoom(roomId: string): Promise<MatchState | null>;
    private mapToDomain;
}
