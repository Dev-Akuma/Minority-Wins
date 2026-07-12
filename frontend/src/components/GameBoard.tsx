import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socket } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';
import { TopStatsBar } from './game/TopStatsBar';
import { SidePanelStats } from './game/SidePanelStats';
import { NumberGrid } from './game/NumberGrid';

type MatchStatus = 'WAITING_FOR_PLAYERS' | 'STARTING' | 'STAKING_OPEN' | 'LOCKED' | 'CALCULATING' | 'RESULT' | 'RESETTING';

interface MatchState {
  id: string;
  matchNumber: number;
  status: MatchStatus;
  startedAt: string | null;
  winningNumbers: number[];
  totalPool: number;
  distributedPool: number;
}

// The new aggregated stats object broadcasted from backend
interface LiveMatchStats {
  matchId: string;
  totalPrizePool: number;
  totalBettors: number;
  numberStats: Record<string, number>;
  lowestBet: number;
  highestBet: number;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export function GameBoard({ token }: { token?: string }) {
  const queryClient = useQueryClient();
  const [match, setMatch] = useState<MatchState | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastWin, setLastWin] = useState<number | null>(null);
  
  // Phase 2: Live Match Stats
  const [liveStats, setLiveStats] = useState<LiveMatchStats>({
    matchId: '',
    totalPrizePool: 0,
    totalBettors: 0,
    numberStats: {},
    lowestBet: Infinity,
    highestBet: 0,
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

    socket.on('matchStarted', (data: MatchState) => {
      setMatch(data);
      setLiveStats({
        matchId: data.id,
        totalPrizePool: 0,
        totalBettors: 0,
        numberStats: {},
        lowestBet: Infinity,
        highestBet: 0,
      });
    });
    socket.on('matchStatusChanged', (data: MatchState) => setMatch(data));
    socket.on('matchFinished', (data: MatchState) => setMatch(data));
    
    // Phase 2: Listen for live stats
    socket.on('liveMatchStats', (data: { matchId: string, stats: LiveMatchStats }) => {
      if (match && data.matchId === match.id) {
        setLiveStats(data.stats);
      }
    });
    
    socket.on('prizeDistributed', (data: { matchId: string, winners: { userId: string, amount: number }[] }) => {
      const myWin = data.winners.find(w => w.userId === USER_ID);
      if (myWin) {
        setLastWin(myWin.amount);
        queryClient.invalidateQueries({ queryKey: ['balance', USER_ID] });
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient, match, USER_ID]);

  // Timer loop for STAKING_OPEN phase
  useEffect(() => {
    if (match?.status === 'STAKING_OPEN' && match.startedAt) {
      const started = new Date(match.startedAt).getTime();
      const matchDuration = 30000;
      
      const interval = setInterval(() => {
        const now = Date.now();
        const elapsed = now - started;
        const remaining = Math.max(0, matchDuration - elapsed);
        setTimeLeft(Math.ceil(remaining / 1000));
      }, 100);
      return () => clearInterval(interval);
    }
  }, [match?.status, match?.startedAt]);

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['balance', USER_ID] });
      setLastWin(null);
    }
  });

  const isStakingOpen = match?.status === 'STAKING_OPEN';

  return (
    <div className="flex flex-col gap-6 w-full">
      
      {/* Small Header for Wallet and Status */}
      <div className="flex justify-between items-center mb-2">
        <div>
          <div className="text-xl font-bold text-primary flex items-center gap-3">
            {match?.status || 'LOADING...'}
            {isStakingOpen && (
              <span className="bg-destructive/10 text-destructive text-sm px-3 py-1 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                {timeLeft}s
              </span>
            )}
          </div>
        </div>

        <div className="text-right bg-secondary/20 px-4 py-2 rounded-xl border border-secondary/50">
          <div className="text-sm font-bold tabular-nums flex items-center gap-2 text-foreground">
            <span className="text-accent">●</span> Wallet: {balance.toLocaleString()}
          </div>
        </div>
      </div>

      <TopStatsBar 
        totalPrizePool={liveStats.totalPrizePool} 
        totalBettors={liveStats.totalBettors} 
      />

      {/* Win Notification */}
      <AnimatePresence>
        {lastWin && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-accent/20 border border-accent/50 text-accent p-4 rounded-xl text-center font-bold text-lg mb-4"
          >
            🎉 You won +{lastWin.toLocaleString()} coins! 🎉
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Main Game Area */}
      <div className="flex flex-col md:flex-row gap-6">
        <div className="flex-1">
          <NumberGrid 
            isStakingOpen={isStakingOpen}
            isPending={stakeMutation.isPending}
            numberStats={liveStats.numberStats}
            liveStakesAmount={{}} // Keeping this empty since we moved to pure count UI, or could track amount per number easily too
            onStake={(num) => {
              if (!stakeMutation.isPending && isStakingOpen) {
                stakeMutation.mutate({ number: num, amount: 100 });
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
          />
        </div>
      </div>
    </div>
  );
}
