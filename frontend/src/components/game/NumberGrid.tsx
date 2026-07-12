import { motion } from 'framer-motion';
import { useState } from 'react';
import { Check, Lock } from 'lucide-react';

interface NumberGridProps {
  status: string;
  isStakingOpen: boolean;
  isPending: boolean;
  isBlindPhase: boolean;
  numberStats: Record<string, number>;
  finalNumberTotals?: Record<string, number>;
  onStake: (number: number, amount: number) => void;
}

export function NumberGrid({ status, isStakingOpen, isPending, isBlindPhase, numberStats, finalNumberTotals, onStake }: NumberGridProps) {
  const numbers = Array.from({ length: 10 }, (_, i) => i);
  const [selectedNum, setSelectedNum] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(10);

  const handleStakeClick = (num: number) => {
    if (isStakingOpen && !isPending && status === 'BETTING') {
      setSelectedNum(num);
      setAmount(10); // Reset to minimum bet
    }
  };

  const handleConfirm = (e: React.MouseEvent, num: number) => {
    e.stopPropagation();
    if (amount >= 10) {
      onStake(num, amount);
      setSelectedNum(null);
    }
  };

  const isLocked = status === 'LOCKED' || status === 'RESULT';

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
      {numbers.map((num) => {
        const betCount = numberStats[num.toString()] || 0;
        const finalAmount = finalNumberTotals?.[num.toString()] || 0;
        const isSelected = selectedNum === num;

        return (
          <motion.div
            key={num}
            layout
            whileHover={!isLocked && !isSelected && !isPending ? { scale: 1.05 } : {}}
            whileTap={!isLocked && !isSelected && !isPending ? { scale: 0.95 } : {}}
            onClick={() => !isSelected && handleStakeClick(num)}
            className={`
              relative overflow-hidden aspect-square rounded-2xl flex flex-col items-center justify-center transition-colors border
              ${isLocked 
                ? 'bg-secondary/10 border-secondary/20 text-muted-foreground opacity-80 cursor-not-allowed'
                : isSelected
                  ? 'bg-secondary/40 border-primary text-foreground shadow-[0_0_15px_rgba(59,130,246,0.3)]' 
                  : 'bg-secondary/30 hover:bg-secondary/50 border-secondary hover:border-primary/50 text-foreground cursor-pointer shadow-lg'
              }
            `}
          >
            {/* Main Number or Input Form */}
            {!isSelected ? (
              <>
                <motion.span layoutId={`num-${num}`} className={`text-4xl font-bold ${(betCount > 0 && !isBlindPhase) || status === 'RESULT' ? 'mb-2' : ''}`}>
                  {num}
                </motion.span>

                {/* Phase 3 & 4: Bet Count Badge / Blind Phase */}
                {status === 'RESULT' ? (
                  <div className="absolute top-2 right-2 bg-green-500/90 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                    ₹{finalAmount.toLocaleString()}
                  </div>
                ) : !isLocked && (
                  isBlindPhase ? (
                    <div className="absolute top-2 right-2 bg-secondary/80 text-muted-foreground p-1 rounded-full shadow-sm backdrop-blur-md">
                      <Lock className="w-3 h-3" />
                    </div>
                  ) : (
                    betCount > 0 && (
                      <div className="absolute top-2 right-2 bg-primary text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {betCount} {betCount === 1 ? 'bet' : 'bets'}
                      </div>
                    )
                  )
                )}
              </>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center gap-2 w-full px-4"
              >
                <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1">
                  Stake on {num}
                </div>
                <div className="flex items-center w-full bg-background rounded-lg border border-secondary p-1">
                  <span className="text-xs text-muted-foreground pl-2 pr-1">₹</span>
                  <input 
                    type="number"
                    autoFocus
                    min="10"
                    value={amount}
                    onChange={(e) => setAmount(Number(e.target.value))}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full bg-transparent text-foreground text-center text-lg font-bold font-mono outline-none appearance-none"
                  />
                </div>
                <div className="flex gap-2 w-full mt-2">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setSelectedNum(null); }}
                    className="flex-1 py-2 rounded-lg bg-secondary/50 text-xs font-bold hover:bg-secondary transition-colors"
                  >
                    X
                  </button>
                  <button 
                    onClick={(e) => handleConfirm(e, num)}
                    disabled={isPending || amount < 10}
                    className="flex-1 flex justify-center items-center py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/80 transition-colors disabled:opacity-50"
                  >
                    {isPending ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Loading Overlay if pending and NOT selected (e.g. general lock) */}
            {isPending && !isSelected && (
              <div className="absolute inset-0 bg-background/50 flex items-center justify-center backdrop-blur-sm z-10">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
