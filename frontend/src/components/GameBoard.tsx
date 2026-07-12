import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socket } from '../lib/socket';

import { TopStatsBar } from './game/TopStatsBar';
import { SidePanelStats } from './game/SidePanelStats';
import { NumberGrid } from './game/NumberGrid';
import { MatchStatusBanner, type MatchStatus } from './game/MatchStatusBanner';
import toast from 'react-hot-toast';

interface MatchState {
  id: string;
  matchNumber: number;
  status: MatchStatus;
  startedAt: string | null;
  winningNumbers: number[];
  totalPool: number;
  distributedPool: number;
}

interface LiveMatchStats {
  matchId: string;
  totalPrizePool: number;
  totalBettors: number;
  numberStats: Record<string, number>;
  lowestBet: number;
  highestBet: number;
  status: MatchStatus;
  timeRemaining: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function GameBoard({ token }: { token?: string }) {
  const queryClient = useQueryClient();
  const [match, setMatch] = useState<MatchState | null>(null);

  const [isConnected, setIsConnected] = useState(true);
  
  const [liveStats, setLiveStats] = useState<LiveMatchStats>({
    matchId: '',
    totalPrizePool: 0,
    totalBettors: 0,
    numberStats: {},
    lowestBet: Infinity,
    highestBet: 0,
    status: 'WAITING',
    timeRemaining: 0,
  });

  // Extract User ID from JWT if present
  let USER_ID = 'usr_test_123';
  if (token) {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      USER_ID = payload.sub;
    } catch (e) {
      console.error('Invalid token');
    }
  }

  // Fetch Balance
  const { data: balance = 0 } = useQuery({
    queryKey: ['balance', USER_ID],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/vault/${USER_ID}/balance`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return data.balance;
    },
    refetchInterval: 5000
  });

  // Fetch Initial Match State
  useEffect(() => {
    fetch(`${API_URL}/matches/current`)
      .then(res => res.json())
      .then(data => setMatch(data))
      .catch(console.error);
  }, []);

  // Socket setup
  useEffect(() => {
    socket.connect();
    
    socket.on('connect', () => setIsConnected(true));
    socket.on('disconnect', () => setIsConnected(false));

    socket.on('matchStarted', (data: MatchState) => {
      setMatch(data);
      setLiveStats(prev => ({
        ...prev,
        matchId: data.id,
        totalPrizePool: 0,
        totalBettors: 0,
        numberStats: {},
        lowestBet: Infinity,
        highestBet: 0,
      }));
    });
    
    socket.on('matchStatusChanged', (data: MatchState) => setMatch(data));
    socket.on('matchFinished', (data: MatchState) => setMatch(data));
    
    socket.on('liveMatchStats', (data: { matchId: string, stats: LiveMatchStats }) => {
      if (match && data.matchId === match.id) {
        setLiveStats(data.stats);
      }
    });
    
    socket.on('prizeDistributed', (data: { matchId: string, winners: { userId: string, amount: number }[] }) => {
      const myWin = data.winners.find(w => w.userId === USER_ID);
      if (myWin) {
        queryClient.invalidateQueries({ queryKey: ['balance', USER_ID] });
        toast.success(`You won ₹${myWin.amount.toLocaleString()}!`, { icon: '🎉', duration: 5000 });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, match, USER_ID]);

  // Staking Mutation
  const stakeMutation = useMutation({
    mutationFn: async ({ number, amount }: { number: number, amount: number }) => {
      const res = await fetch(`${API_URL}/matches/stake`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: USER_ID, selectedNumber: number, amount })
      });
      if (!res.ok) throw new Error(await res.text());
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['balance', USER_ID] });
      toast.success(`₹${variables.amount.toLocaleString()} placed on Number ${variables.number}`);
    },
    onError: () => {
      toast.error('Failed to place bet. Check your balance.');
    }
  });

  const currentStatus = liveStats.status || match?.status || 'WAITING';
  const isStakingOpen = currentStatus === 'BETTING';
  const isBlindPhase = currentStatus === 'BETTING' && liveStats.timeRemaining <= 3;
  const isLockedOrResult = currentStatus === 'LOCKED' || currentStatus === 'RESULT';

  return (
    <div className="flex flex-col gap-6 w-full">
      {!isConnected && (
        <div className="bg-destructive text-destructive-foreground text-center py-1 font-bold animate-pulse text-sm">
          Reconnecting to server...
        </div>
      )}

      {/* Wallet */}
      <div className="flex justify-end mb-2">
        <div className="text-right bg-secondary/20 px-4 py-2 rounded-xl border border-secondary/50 shadow-sm">
          <div className="text-sm font-bold tabular-nums flex items-center gap-2 text-foreground">
            <span className="text-accent">●</span> Wallet: ₹{balance.toLocaleString()}
          </div>
        </div>
      </div>

      <MatchStatusBanner 
        status={currentStatus as MatchStatus} 
        timeRemaining={liveStats.timeRemaining} 
      />

      <TopStatsBar 
        totalPrizePool={liveStats.totalPrizePool} 
        totalBettors={liveStats.totalBettors} 
        isBlindPhase={isBlindPhase || isLockedOrResult}
      />
      
      {/* Main Game Area */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <NumberGrid 
            status={currentStatus}
            isStakingOpen={isStakingOpen}
            isPending={stakeMutation.isPending}
            isBlindPhase={isBlindPhase}
            numberStats={liveStats.numberStats}
            onStake={(num, amount) => {
              if (!stakeMutation.isPending && isStakingOpen) {
                stakeMutation.mutate({ number: num, amount });
              }
            }}
          />
        </div>
        
        <div className="w-full md:w-auto">
          <SidePanelStats 
            lowestBet={liveStats.lowestBet}
            highestBet={liveStats.highestBet}
            totalPrizePool={liveStats.totalPrizePool}
            totalBettors={liveStats.totalBettors}
            isBlindPhase={isBlindPhase || isLockedOrResult}
          />
        </div>
      </div>
    </div>
  );
}
