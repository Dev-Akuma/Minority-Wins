import { Users, Coins, Lock } from 'lucide-react';
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

interface TopStatsBarProps {
  totalPrizePool: number;
  totalBettors: number;
  isBlindPhase?: boolean;
}

export function TopStatsBar({ totalPrizePool, totalBettors, isBlindPhase }: TopStatsBarProps) {
  return (
    <div className="flex gap-4 md:gap-8 justify-between items-center bg-secondary/10 p-6 rounded-3xl border border-secondary/30 backdrop-blur-md mb-8">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center">
          <Coins className="text-accent w-6 h-6" />
        </div>
        <div>
          <h3 className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mb-1">Total Prize Pool</h3>
          <div className="text-3xl font-bold font-mono relative">
            <span className={isBlindPhase ? 'blur-md opacity-50 transition-all duration-500' : 'transition-all duration-500'}>
              <AnimatedNumber value={totalPrizePool || 0} />
            </span>
            {isBlindPhase && <Lock className="absolute inset-0 m-auto text-muted-foreground w-6 h-6" />}
          </div>
        </div>
      </div>
      
      <div className="flex items-center gap-4 border-l border-secondary/30 pl-4 md:pl-8">
        <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
          <Users className="text-primary w-6 h-6" />
        </div>
        <div>
          <h3 className="text-muted-foreground text-sm uppercase tracking-widest font-semibold mb-1">Bettors</h3>
          <div className="text-3xl font-bold font-mono text-foreground relative">
            <span className={isBlindPhase ? 'blur-md opacity-50 transition-all duration-500' : 'transition-all duration-500'}>
              <AnimatedNumber value={totalBettors || 0} />
            </span>
            {isBlindPhase && <Lock className="absolute inset-0 m-auto text-muted-foreground w-6 h-6" />}
          </div>
        </div>
      </div>
    </div>
  );
}
