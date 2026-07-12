import { TrendingDown, TrendingUp, Activity, Lock } from 'lucide-react';
import { motion, useSpring, useTransform } from 'framer-motion';
import { useEffect } from 'react';

function AnimatedNumber({ value }: { value: number }) {
  const spring = useSpring(value, { mass: 0.8, stiffness: 75, damping: 15 });
  const display = useTransform(spring, (current) => Math.round(current).toLocaleString());

  useEffect(() => {
    spring.set(value);
  }, [spring, value]);

  return <motion.span>{display}</motion.span>;
}

interface SidePanelStatsProps {
  lowestBet: number;
  highestBet: number;
  totalPrizePool: number;
  totalBettors: number;
  isBlindPhase?: boolean;
}

export function SidePanelStats({ lowestBet, highestBet, totalPrizePool, totalBettors, isBlindPhase }: SidePanelStatsProps) {
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
          <div className="text-xl font-bold font-mono relative">
            <span className={isBlindPhase ? 'blur-md opacity-50 transition-all duration-500' : 'transition-all duration-500'}>
              <AnimatedNumber value={lowestDisplay || 0} />
            </span>
            {isBlindPhase && <Lock className="absolute inset-0 m-auto text-muted-foreground w-4 h-4" />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-green-500/20 rounded-xl">
          <TrendingUp className="w-5 h-5 text-green-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Highest Stake</p>
          <div className="text-xl font-bold font-mono relative">
            <span className={isBlindPhase ? 'blur-md opacity-50 transition-all duration-500' : 'transition-all duration-500'}>
              <AnimatedNumber value={highestBet || 0} />
            </span>
            {isBlindPhase && <Lock className="absolute inset-0 m-auto text-muted-foreground w-4 h-4" />}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="p-3 bg-blue-500/20 rounded-xl">
          <Activity className="w-5 h-5 text-blue-500" />
        </div>
        <div>
          <p className="text-xs text-muted-foreground uppercase font-semibold">Average Stake</p>
          <div className="text-xl font-bold font-mono relative">
            <span className={isBlindPhase ? 'blur-md opacity-50 transition-all duration-500' : 'transition-all duration-500'}>
              <AnimatedNumber value={averageBet || 0} />
            </span>
            {isBlindPhase && <Lock className="absolute inset-0 m-auto text-muted-foreground w-4 h-4" />}
          </div>
        </div>
      </div>
    </div>
  );
}
