import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { User, VaultTransaction } from '../../engines/match/types';

@Injectable()
export class PrismaVaultRepository {
  constructor(private prisma: PrismaService) { }

  public async getUser(userId: string): Promise<User> {
    let user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      // Auto-create for demo purposes, granting 10000 coins
      user = await this.prisma.user.create({
        data: {
          id: userId,
          googleId: userId,
          email: `${userId}@example.com`,
          phoneNumber: `+910000${userId.substring(0, 6)}`,
          username: `User_${userId.substring(0, 8)}`,
          balance: 10000,
        }
      });
      await this.prisma.vaultTransaction.create({
        data: {
          userId,
          amount: 10000,
          type: 'INITIAL_GRANT',
        }
      });
    }

    return {
      id: user.id,
      balance: user.balance,
    };
  }

  public async transact(userId: string, amount: number, type: VaultTransaction['type'], referenceId?: string): Promise<User> {
    // We use an interactive transaction to ensure atomicity
    const updatedUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (!user) throw new Error('User not found');

      if (user.balance + amount < 0) {
        throw new Error('Insufficient funds');
      }

      const updated = await tx.user.update({
        where: { id: userId },
        data: { balance: { increment: amount } }
      });

      await tx.vaultTransaction.create({
        data: {
          userId,
          amount,
          type,
          referenceId,
        }
      });

      return updated;
    });

    return {
      id: updatedUser.id,
      balance: updatedUser.balance,
    };
  }
}
