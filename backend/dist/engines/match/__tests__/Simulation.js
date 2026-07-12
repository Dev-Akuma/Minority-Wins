"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MatchEngine_1 = require("../MatchEngine");
const StateMachine_1 = require("../StateMachine");
const InMemoryRepositories_1 = require("./InMemoryRepositories");
const InMemoryVaultRepository_1 = require("../../../modules/vault/InMemoryVaultRepository");
const types_1 = require("../types");
async function runSimulation() {
    console.log('--- Starting Minority Wins Simulation ---');
    const roomConfig = {
        id: 'room-alpha',
        minimumPlayers: 2,
        platformFeePercentage: 0.05,
        waitingDurationSeconds: 2,
        matchDurationSeconds: 2,
        resultDurationSeconds: 2,
        startingCoins: 10000
    };
    const matchRepo = new InMemoryRepositories_1.InMemoryMatchRepository();
    const stakeRepo = new InMemoryRepositories_1.InMemoryStakeRepository();
    const vaultRepo = new InMemoryVaultRepository_1.InMemoryVaultRepository();
    const events = {
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
    const engine = new MatchEngine_1.MatchEngine(matchRepo, stakeRepo, events, roomConfig);
    let currentMatch = await engine.initializeMatch();
    console.log('[System] Placing stakes...');
    await vaultRepo.transact('user1', -100, 'STAKE', currentMatch.id);
    await stakeRepo.addStake({ id: 's1', matchId: currentMatch.id, userId: 'user1', selectedNumber: 7, stakeAmount: 100, status: 'ACTIVE' });
    await vaultRepo.transact('user2', -200, 'STAKE', currentMatch.id);
    await stakeRepo.addStake({ id: 's2', matchId: currentMatch.id, userId: 'user2', selectedNumber: 7, stakeAmount: 200, status: 'ACTIVE' });
    await vaultRepo.transact('user3', -50, 'STAKE', currentMatch.id);
    await stakeRepo.addStake({ id: 's3', matchId: currentMatch.id, userId: 'user3', selectedNumber: 3, stakeAmount: 50, status: 'ACTIVE' });
    currentMatch = StateMachine_1.StateMachine.transition(currentMatch, types_1.MatchStatus.BETTING);
    await matchRepo.updateMatch(currentMatch);
    const interval = setInterval(async () => {
        const m = await matchRepo.getMatch(currentMatch.id);
        if (!m)
            return;
        if (m.status === types_1.MatchStatus.WAITING && m.finishedAt) {
            console.log('--- Simulation Complete ---');
            clearInterval(interval);
            return;
        }
        try {
            await engine.tick(m.id);
        }
        catch (e) {
            console.error('Engine error:', e);
            clearInterval(interval);
        }
    }, 1000);
}
runSimulation();
//# sourceMappingURL=Simulation.js.map