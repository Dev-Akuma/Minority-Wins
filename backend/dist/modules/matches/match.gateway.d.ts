import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchState } from '../../engines/match/types';
export declare class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    emitMatchStarted(match: MatchState): void;
    emitMatchStatusChanged(match: MatchState): void;
    emitMatchFinished(match: MatchState): void;
    emitPrizeDistributed(matchId: string, winners: {
        userId: string;
        amount: number;
    }[]): void;
}
