import { PrismaService } from '../../prisma.service';
import { User, VaultTransaction } from '../../engines/match/types';
export declare class PrismaVaultRepository {
    private prisma;
    constructor(prisma: PrismaService);
    getUser(userId: string): Promise<User>;
    transact(userId: string, amount: number, type: VaultTransaction['type'], referenceId?: string): Promise<User>;
}
