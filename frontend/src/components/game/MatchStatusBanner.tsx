import { motion, AnimatePresence } from 'framer-motion';

export type MatchStatus = 'WAITING' | 'BETTING' | 'LOCKED' | 'RESULT';

interface MatchStatusBannerProps {
  status: MatchStatus;
  timeRemaining: number;
}

export function MatchStatusBanner({ status, timeRemaining }: MatchStatusBannerProps) {
  const isUrgent = status === 'BETTING' && timeRemaining <= 10;
  
  const getBannerContent = () => {
    switch (status) {
      case 'WAITING':
        return (
          <div className="flex items-center gap-3">
            <span className="text-muted-foreground uppercase tracking-widest font-semibold text-sm">Next match begins in</span>
            <span className="text-xl font-bold font-mono">{timeRemaining}s</span>
          </div>
        );
      case 'BETTING':
        return (
          <div className="flex items-center gap-3">
            <span className="text-primary uppercase tracking-widest font-bold text-sm">Staking Open</span>
            <motion.span 
              animate={isUrgent ? { scale: [1, 1.1, 1], color: ['#f8fafc', '#ef4444', '#f8fafc'] } : {}}
              transition={isUrgent ? { repeat: Infinity, duration: 1 } : {}}
              className={`text-2xl font-black font-mono ${isUrgent ? 'text-red-500' : 'text-foreground'}`}
            >
              {timeRemaining}s
            </motion.span>
          </div>
        );
      case 'LOCKED':
        return (
          <div className="flex items-center gap-3 text-accent">
            <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            <span className="uppercase tracking-widest font-bold text-sm animate-pulse">Calculating Results...</span>
          </div>
        );
      case 'RESULT':
        return (
          <div className="flex items-center gap-3">
            <span className="text-primary uppercase tracking-widest font-bold text-sm">Results</span>
            <span className="text-xl font-bold font-mono text-muted-foreground">Next round in {timeRemaining}s</span>
          </div>
        );
      default:
        return <div>Connecting to match server...</div>;
    }
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={status}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        className="w-full flex justify-center mb-2"
      >
        <div className="bg-secondary/20 px-8 py-3 rounded-full border border-secondary/50 backdrop-blur-md shadow-lg shadow-black/20">
          {getBannerContent()}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
