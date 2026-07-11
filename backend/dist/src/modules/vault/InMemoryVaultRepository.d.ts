import { User, VaultTransaction } from '../../engines/match/types';
export declare class InMemoryVaultRepository {
    private users;
    private transactions;
    getUser(userId: string): Promise<User>;
    transact(userId: string, amount: number, type: VaultTransaction['type'], referenceId?: string): Promise<User>;
}
