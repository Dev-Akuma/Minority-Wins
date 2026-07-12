import { Controller, Get, Post, Body, ValidationPipe } from '@nestjs/common';
import { MatchesService } from './matches.service';
import { PlaceStakeDto } from './dto/place-stake.dto';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('current')
  async getCurrentMatch() {
    const match = await this.matchesService.getCurrentMatch();
    if (!match) return null;

    // Fetch aggregates for Phase 2: Game UI Mechanics
    const aggregates = await this.matchesService.getMatchAggregates(match.id);
    return {
      ...match,
      totalPrizePool: aggregates.totalPrizePool,
      lowestStake: aggregates.lowestStake,
      highestStake: aggregates.highestStake,
    };
  }

  @Get('history')
  async getMatchHistory() {
    return this.matchesService.getMatchHistory();
  }

  @Post('stake')
  async placeStake(@Body(new ValidationPipe({ transform: true })) dto: PlaceStakeDto) {
    await this.matchesService.placeStake(dto.userId, dto.selectedNumber, dto.amount);
    return { success: true };
  }
}
