export enum MatchStatus {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  STARTING = 'STARTING',
  STAKING_OPEN = 'STAKING_OPEN',
  LOCKED = 'LOCKED',
  CALCULATING = 'CALCULATING',
  RESULT = 'RESULT',
  RESETTING = 'RESETTING',
}

export interface RoomConfig {
  id: string;
  minimumPlayers: number;
  platformFeePercentage: number; // e.g., 0.05 for 5%
  matchDurationSeconds: number;
  resultDurationSeconds: number;
  startingCoins: number;
}

export interface MatchState {
  id: string;
  matchNumber: number;
  roomId: string;
  status: MatchStatus;
  
  startedAt: Date | null;
  finishedAt: Date | null;
  
  winningNumbers: number[];
  totalPool: number;
  platformFeePercentage: number;
  platformFeeAmount: number;
  distributedPool: number;
}

export interface Stake {
  id: string;
  userId: string;
  matchId: string;
  selectedNumber: number; // 0-9
  stakeAmount: number;
  status: 'ACTIVE' | 'REFUNDED' | 'SETTLED';
}

export interface User {
  id: string;
  balance: number;
}

export interface VaultTransaction {
  id: string;
  userId: string;
  amount: number;
  type: 'INITIAL_GRANT' | 'STAKE' | 'WIN' | 'REFUND';
  referenceId?: string;
  createdAt: Date;
}

// Events that the Engine will emit to the outside world
export interface MatchEvents {
  onMatchStarted: (match: MatchState) => void;
  onMatchStatusChanged: (match: MatchState) => void;
  onMatchFinished: (match: MatchState) => void;
  onPrizeDistributed: (matchId: string, winners: { userId: string, amount: number }[]) => void;
}

export interface MatchRepository {
  createMatch(roomId: string, config: RoomConfig): Promise<MatchState>;
  updateMatch(match: MatchState): Promise<MatchState>;
  getMatch(id: string): Promise<MatchState | null>;
  getCurrentMatchForRoom(roomId: string): Promise<MatchState | null>;
}

export interface StakeRepository {
  getStakesForMatch(matchId: string): Promise<Stake[]>;
}
