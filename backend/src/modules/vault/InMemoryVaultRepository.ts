import { User, VaultTransaction } from '../../engines/match/types';

export class InMemoryVaultRepository {
  private users: Map<string, User> = new Map();
  private transactions: VaultTransaction[] = [];

  public async getUser(userId: string): Promise<User> {
    if (!this.users.has(userId)) {
      // Auto-create for local dev
      this.users.set(userId, { id: userId, balance: 10000 });
      this.transactions.push({
        id: `tx-${Date.now()}`,
        userId,
        amount: 10000,
        type: 'INITIAL_GRANT',
        createdAt: new Date()
      });
    }
    return this.users.get(userId)!;
  }

  /**
   * Modifies balance AND inserts ledger row synchronously.
   */
  public async transact(userId: string, amount: number, type: VaultTransaction['type'], referenceId?: string): Promise<User> {
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
