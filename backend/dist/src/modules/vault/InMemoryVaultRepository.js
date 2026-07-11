"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InMemoryVaultRepository = void 0;
class InMemoryVaultRepository {
    users = new Map();
    transactions = [];
    async getUser(userId) {
        if (!this.users.has(userId)) {
            this.users.set(userId, { id: userId, balance: 10000 });
            this.transactions.push({
                id: `tx-${Date.now()}`,
                userId,
                amount: 10000,
                type: 'INITIAL_GRANT',
                createdAt: new Date()
            });
        }
        return this.users.get(userId);
    }
    async transact(userId, amount, type, referenceId) {
        const user = await this.getUser(userId);
        if (user.balance + amount < 0) {
            throw new Error('Insufficient funds');
        }
        user.balance += amount;
        this.transactions.push({
            id: `tx-${Date.now()}-${Math.random()}`,
            userId,
            amount,
            type,
            referenceId,
            createdAt: new Date()
        });
        return user;
    }
}
exports.InMemoryVaultRepository = InMemoryVaultRepository;
//# sourceMappingURL=InMemoryVaultRepository.js.map