import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VaultModule } from './modules/vault/vault.module';
import { MatchesModule } from './modules/matches/matches.module';
import { StakesModule } from './modules/stakes/stakes.module';
import { RoomsModule } from './modules/rooms/rooms.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';

@Module({
  imports: [AuthModule, UsersModule, VaultModule, MatchesModule, StakesModule, RoomsModule, AnalyticsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
