import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { socket } from '../lib/socket';
import { motion, AnimatePresence } from 'framer-motion';

// Types mimicking the backend
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

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const USER_ID = 'user1'; // Hardcoded for demo

export function GameBoard() {
  const queryClient = useQueryClient();
  const [match, setMatch] = useState<MatchState | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);
  const [lastWin, setLastWin] = useState<number | null>(null);

  // Fetch Balance
  const { data: balance = 0 } = useQuery({
    queryKey: ['balance', USER_ID],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/vault/${USER_ID}/balance`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      return data.balance;
    },
    refetchInterval: 5000 // Poll as a fallback
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

    socket.on('matchStarted', (data: MatchState) => setMatch(data));
    socket.on('matchStatusChanged', (data: MatchState) => setMatch(data));
    socket.on('matchFinished', (data: MatchState) => {
      setMatch(data);
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
  }, [queryClient]);

  // Timer loop for STAKING_OPEN phase
  useEffect(() => {
    if (match?.status === 'STAKING_OPEN' && match.startedAt) {
      const started = new Date(match.startedAt).getTime();
      const matchDuration = 30000; // 30 seconds
      
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
      setLastWin(null); // Clear last win msg on new stake
    }
  });

  const isStakingOpen = match?.status === 'STAKING_OPEN';

  return (
    <div className="flex flex-col gap-8 max-w-4xl mx-auto">
      
      {/* Header Panel */}
      <div className="bg-secondary/20 p-6 rounded-2xl border border-secondary/50 flex justify-between items-center backdrop-blur-sm">
        <div>
          <h2 className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mb-1">Status</h2>
          <div className="text-2xl font-bold text-primary flex items-center gap-3">
            {match?.status || 'LOADING...'}
            {isStakingOpen && (
              <span className="bg-destructive/10 text-destructive text-sm px-3 py-1 rounded-full flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
                {timeLeft}s
              </span>
            )}
          </div>
        </div>
        <div className="text-right">
          <h2 className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mb-1">Wallet</h2>
          <div className="text-3xl font-bold tabular-nums flex items-center gap-2">
            <span className="text-accent">●</span>
            {balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 1 })}
          </div>
        </div>
      </div>

      {/* Win Notification */}
      <AnimatePresence>
        {lastWin && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-accent/20 border border-accent/50 text-accent p-4 rounded-xl text-center font-bold text-lg"
          >
            🎉 You won +{lastWin.toLocaleString()} coins! 🎉
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Game Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => {
          const isWinner = match?.status === 'RESULT' && match?.winningNumbers.includes(num);
          const isPending = stakeMutation.isPending && stakeMutation.variables?.number === num;

          return (
            <motion.button
              key={num}
              whileHover={isStakingOpen ? { scale: 1.05 } : {}}
              whileTap={isStakingOpen ? { scale: 0.95 } : {}}
              disabled={!isStakingOpen || stakeMutation.isPending}
              onClick={() => stakeMutation.mutate({ number: num, amount: 100 })}
              className={`
                aspect-square rounded-2xl flex flex-col items-center justify-center text-4xl font-black transition-colors relative overflow-hidden
                ${isWinner ? 'bg-primary text-primary-foreground border-4 border-primary/50 shadow-[0_0_30px_rgba(59,130,246,0.5)]' : ''}
                ${!isWinner && isStakingOpen ? 'bg-secondary/40 hover:bg-secondary/80 border border-secondary text-foreground cursor-pointer' : ''}
                ${!isWinner && !isStakingOpen ? 'bg-secondary/20 border border-secondary/30 text-muted-foreground cursor-not-allowed' : ''}
              `}
            >
              {num}
              {isStakingOpen && (
                <div className="absolute bottom-4 text-xs font-medium text-muted-foreground">
                  STAKE 100
                </div>
              )}
              {isPending && (
                <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </motion.button>
          );
        })}
      </div>

    </div>
  );
}
