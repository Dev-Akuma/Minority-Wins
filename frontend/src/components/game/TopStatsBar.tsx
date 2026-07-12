import { Users, Coins } from 'lucide-react';
import { motion } from 'framer-motion';

interface TopStatsBarProps {
  totalPrizePool: number;
  totalBettors: number;
}

export function TopStatsBar({ totalPrizePool, totalBettors }: TopStatsBarProps) {
  return (
    <div className="flex gap-4 md:gap-8 justify-between items-center bg-secondary/10 p-6 rounded-3xl border border-secondary/30 backdrop-blur-md mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
          <Coins className="text-accent w-6 h-6" />
        </div>
        <div>
          <h3 className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mb-1">Total Prize Pool</h3>
          <motion.div 
            key={totalPrizePool}
            initial={{ scale: 1.1, color: '#f59e0b' }} // accent color
            animate={{ scale: 1, color: '#f8fafc' }}  // foreground color
            className="text-3xl font-bold font-mono"
          >
            {(totalPrizePool || 0).toLocaleString()}
          </motion.div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 border-l border-secondary/30 pl-4 md:pl-8">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Users className="text-primary w-6 h-6" />
        </div>
        <div>
          <h3 className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mb-1">Bettors</h3>
          <motion.div 
            key={totalBettors}
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            className="text-3xl font-bold font-mono text-foreground"
          >
            {(totalBettors || 0).toLocaleString()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
