import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socket } from '../../lib/socket';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

interface HistoryEntry {
  id: string;
  matchNumber: number;
  winningNumbers: number[];
  totalPool: number;
  createdAt: string;
}

export function MatchHistoryLog() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    // Fetch initial history
    fetch(`${API_URL}/matches/history`)
      .then(res => res.json())
      .then(data => setHistory(data))
      .catch(console.error);

    // Listen for new finished matches to append to history
    const handleMatchFinished = (match: any) => {
      setHistory(prev => {
        const newEntry = {
          id: match.id,
          matchNumber: match.matchNumber,
          winningNumbers: match.winningNumbers,
          totalPool: match.totalPool,
          createdAt: new Date().toISOString()
        };
        return [newEntry, ...prev].slice(0, 10);
      });
    };

    socket.on('matchFinished', handleMatchFinished);

    return () => {
      socket.off('matchFinished', handleMatchFinished);
    };
  }, []);

  return (
    <div className="w-full bg-secondary/10 p-6 rounded-3xl border border-secondary/30 backdrop-blur-md flex flex-col gap-4 mt-6">
      <h3 className="text-muted-foreground text-sm uppercase tracking-widest font-semibold pb-4 border-b border-secondary/30">
        Match History
      </h3>
      
      <div className="flex flex-col gap-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        <AnimatePresence>
          {history.length === 0 ? (
            <div className="text-muted-foreground text-sm text-center py-4">No past matches yet</div>
          ) : (
            history.map((entry, index) => {
              const isDraw = entry.winningNumbers.includes(-1) || entry.winningNumbers.length === 0;
              return (
                <motion.div 
                  key={entry.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex justify-between items-center bg-background/50 p-3 rounded-xl border border-secondary/20"
                >
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground font-semibold">Match #{entry.matchNumber}</span>
                    <span className="text-xs text-muted-foreground">{new Date(entry.createdAt).toLocaleTimeString()}</span>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <span className="text-xs text-muted-foreground uppercase">Pool</span>
                      <span className="text-sm font-mono font-bold text-foreground">₹{entry.totalPool.toLocaleString()}</span>
                    </div>
                    
                    <div className={`flex items-center justify-center w-8 h-8 rounded-lg font-bold text-sm ${isDraw ? 'bg-secondary text-muted-foreground' : 'bg-primary/20 text-primary border border-primary/30'}`}>
                      {isDraw ? '-' : entry.winningNumbers[0]}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
