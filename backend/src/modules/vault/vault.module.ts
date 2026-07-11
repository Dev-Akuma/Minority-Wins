import { Module } from '@nestjs/common';

import { VaultController } from './vault.controller';
import { VaultService } from './vault.service';
import { PrismaService } from '../../prisma.service';

@Module({
  controllers: [VaultController],
  providers: [VaultService, PrismaService],
  exports: [VaultService]
})
export class VaultModule {}
