import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaVaultRepository } from './PrismaVaultRepository';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class VaultService {
  private readonly repo: PrismaVaultRepository;

  constructor(prisma: PrismaService) {
    this.repo = new PrismaVaultRepository(prisma);
  }

  public async getUserBalance(userId: string) {
    return this.repo.getUser(userId);
  }

  public async transact(userId: string, amount: number, type: 'INITIAL_GRANT' | 'STAKE' | 'WIN' | 'REFUND', referenceId?: string) {
    try {
      return await this.repo.transact(userId, amount, type, referenceId);
    } catch (e: any) {
      throw new BadRequestException(e.message);
    }
  }
}
