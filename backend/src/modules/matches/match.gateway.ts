import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { MatchState } from '../../engines/match/types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MatchGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  // --- Event Emitters to Client ---

  public emitMatchStarted(match: MatchState) {
    this.server.emit('matchStarted', match);
  }

  public emitMatchStatusChanged(match: MatchState) {
    this.server.emit('matchStatusChanged', match);
  }

  public emitMatchFinished(match: MatchState) {
    this.server.emit('matchFinished', match);
  }

  public emitPrizeDistributed(matchId: string, winners: { userId: string, amount: number }[]) {
    this.server.emit('prizeDistributed', { matchId, winners });
  }

  // Phase 2: Live Stake Distribution Broadcast
  public emitLiveStakeDistribution(matchId: string, distribution: Record<string, number>) {
    this.server.emit('liveStakeDistribution', { matchId, distribution });
  }
}
