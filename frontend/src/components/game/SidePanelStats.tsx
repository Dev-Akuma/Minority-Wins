import { TrendingDown, TrendingUp, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

interface SidePanelStatsProps {
  lowestBet: number;
  highestBet: number;
  totalPrizePool: number;
  totalBettors: number;
}

export function SidePanelStats({ lowestBet, highestBet, totalPrizePool, totalBettors }: SidePanelStatsProps) {
  // Prevent division by zero
  const averageBet = totalBettors > 0 ? Math.round(totalPrizePool / totalBettors) : 0;
  
  // Format Infinity for UI display
  const lowestDisplay = lowestBet === Infinity ? 0 : lowestBet;

  return (
    <div className="w-full md:w-64 bg-secondary/10 p-6 rounded-3xl border border-secondary/30 backdrop-blur-md flex flex-col gap-6">
      <h3 className="text-muted-foreground text-sm uppercase tracking-widest font-semibold pb-4 border-b border-secondary/30">
        Match Extremes
      </h3>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-red-500/20 rounded-xl">
          <TrendingDown className="w-5 h-5 text-red-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Lowest Stake</p>
          <motion.p 
            key={lowestDisplay}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold font-mono"
          >
            {lowestDisplay.toLocaleString()}
          </motion.p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-500/20 rounded-xl">
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Highest Stake</p>
          <motion.p 
            key={highestBet}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold font-mono"
          >
            {highestBet.toLocaleString()}
          </motion.p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-xl">
          <Activity className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Average Stake</p>
          <motion.p 
            key={averageBet}
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 1 }}
            className="text-xl font-bold font-mono"
          >
            {averageBet.toLocaleString()}
          </motion.p>
        </div>
      </div>
    </div>
  );
}
