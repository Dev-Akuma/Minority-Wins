import { MatchEngine } from '../MatchEngine';
import { StateMachine } from '../StateMachine';
import { InMemoryMatchRepository, InMemoryStakeRepository } from './InMemoryRepositories';
import { InMemoryVaultRepository } from '../../../modules/vault/InMemoryVaultRepository';
import { MatchStatus, RoomConfig, MatchEvents } from '../types';

async function runSimulation() {
  console.log('--- Starting Minority Wins Simulation ---');

  const roomConfig: RoomConfig = {
    id: 'room-alpha',
    minimumPlayers: 2,
    platformFeePercentage: 0.05,
    matchDurationSeconds: 2,
    resultDurationSeconds: 2,
    startingCoins: 10000
  };

  const matchRepo = new InMemoryMatchRepository();
  const stakeRepo = new InMemoryStakeRepository();
  const vaultRepo = new InMemoryVaultRepository();

  const events: MatchEvents = {
    onMatchStarted: (match) => console.log(`[Event] Match ${match.matchNumber} Started!`),
    onMatchStatusChanged: (match) => console.log(`[Event] Match Status Changed -> ${match.status}`),
    onMatchFinished: (match) => console.log(`[Event] Match ${match.matchNumber} Finished! Winning Numbers: ${match.winningNumbers.join(', ')} | Distributed Pool: ${match.distributedPool}`),
    onPrizeDistributed: async (matchId, winners) => {
      console.log(`[Event] Prizes Distributed:`);
      for (const w of winners) {
        await vaultRepo.transact(w.userId, w.amount, 'WIN', matchId);
        const user = await vaultRepo.getUser(w.userId);
        console.log(`  - User ${w.userId} won ${w.amount}. New Balance: ${user.balance}`);
      }
    }
  };

  const engine = new MatchEngine(matchRepo, stakeRepo, events, roomConfig);
  let currentMatch = await engine.initializeMatch();
  
  // Fake stakes AND deduct from vault
  console.log('[System] Placing stakes...');
  await vaultRepo.transact('user1', -100, 'STAKE', currentMatch.id);
  await stakeRepo.addStake({ id: 's1', matchId: currentMatch.id, userId: 'user1', selectedNumber: 7, stakeAmount: 100, status: 'ACTIVE' });
  
  await vaultRepo.transact('user2', -200, 'STAKE', currentMatch.id);
  await stakeRepo.addStake({ id: 's2', matchId: currentMatch.id, userId: 'user2', selectedNumber: 7, stakeAmount: 200, status: 'ACTIVE' });
  
  await vaultRepo.transact('user3', -50, 'STAKE', currentMatch.id);
  await stakeRepo.addStake({ id: 's3', matchId: currentMatch.id, userId: 'user3', selectedNumber: 3, stakeAmount: 50, status: 'ACTIVE' });
  // Number 7 total = 300
  // Number 3 total = 50
  // Lowest pool is 3. User3 should win!

  // Force start properly via StateMachine
  currentMatch = StateMachine.transition(currentMatch, MatchStatus.STARTING);
  await matchRepo.updateMatch(currentMatch);

  // Simulate Scheduler loop
  const interval = setInterval(async () => {
    const m = await matchRepo.getMatch(currentMatch.id);
    if (!m) return;
    
    if (m.status === MatchStatus.RESETTING) {
      console.log('--- Simulation Complete ---');
      clearInterval(interval);
      return;
    }

    try {
      await engine.tick(m.id);
    } catch (e) {
      console.error('Engine error:', e);
      clearInterval(interval);
    }
  }, 1000); // tick every second
}

runSimulation();
