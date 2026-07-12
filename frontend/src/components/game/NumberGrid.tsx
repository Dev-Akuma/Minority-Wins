import { motion } from 'framer-motion';

interface NumberGridProps {
  isStakingOpen: boolean;
  isPending: boolean;
  numberStats: Record<string, number>;
  liveStakesAmount: Record<string, number>;
  onStake: (number: number) => void;
}

export function NumberGrid({ isStakingOpen, isPending, numberStats, liveStakesAmount, onStake }: NumberGridProps) {
  const numbers = Array.from({ length: 10 }, (_, i) => i);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {numbers.map((num) => {
        const betCount = numberStats[num.toString()] || 0;
        const betAmount = liveStakesAmount[num.toString()] || 0;

        return (
          <motion.button
            key={num}
            whileHover={isStakingOpen && !isPending ? { scale: 1.05 } : {}}
            whileTap={isStakingOpen && !isPending ? { scale: 0.95 } : {}}
            disabled={!isStakingOpen || isPending}
            onClick={() => onStake(num)}
            className={`
              relative overflow-hidden aspect-square rounded-2xl flex flex-col items-center justify-center text-4xl font-bold transition-colors border
              ${isStakingOpen
                ? 'bg-secondary/30 hover:bg-secondary/50 border-secondary hover:border-primary/50 text-foreground cursor-pointer shadow-lg'
                : 'bg-secondary/10 border-secondary/20 text-muted-foreground cursor-not-allowed'
              }
            `}
          >
            {/* Main Number */}
            <span className={betCount > 0 ? 'mb-2' : ''}>{num}</span>

            {/* Bet Stats */}
            {isStakingOpen && (
              <div className="absolute bottom-2 flex flex-col items-center w-full px-2">
                <span className="text-[10px] uppercase font-bold text-muted-foreground opacity-60">Stake 100</span>
                
                {/* Amount Staked (existing functionality) */}
                {betAmount > 0 && (
                  <span className="text-[10px] text-accent mt-0.5">
                    🔥 {betAmount.toLocaleString()}
                  </span>
                )}
              </div>
            )}

            {/* Phase 3: Bet Count Badge */}
            {betCount > 0 && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                {betCount} {betCount === 1 ? 'bet' : 'bets'}
              </div>
            )}

            {/* Loading Overlay */}
            {isPending && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}
