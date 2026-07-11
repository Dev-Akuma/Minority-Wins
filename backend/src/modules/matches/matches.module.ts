import { Module } from '@nestjs/common';
import { VaultModule } from '../vault/vault.module';
import { MatchGateway } from './match.gateway';
import { MatchesService } from './matches.service';
import { MatchesController } from './matches.controller';
import { PrismaService } from '../../prisma.service';

@Module({
  imports: [VaultModule],
  controllers: [MatchesController],
  providers: [MatchGateway, MatchesService, PrismaService],
  exports: [MatchesService]
})
export class MatchesModule {}
