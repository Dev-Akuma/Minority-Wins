import { PrismaService } from '../../prisma.service';
export declare class VaultService {
    private readonly repo;
    constructor(prisma: PrismaService);
    getUserBalance(userId: string): Promise<import("../../engines/match/types").User>;
    transact(userId: string, amount: number, type: 'INITIAL_GRANT' | 'STAKE' | 'WIN' | 'REFUND', referenceId?: string): Promise<import("../../engines/match/types").User>;
}
