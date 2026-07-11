import { Controller, Get, Post, Body } from '@nestjs/common';
import { MatchesService } from './matches.service';

@Controller('matches')
export class MatchesController {
  constructor(private readonly matchesService: MatchesService) {}

  @Get('current')
  async getCurrentMatch() {
    return this.matchesService.getCurrentMatch();
  }

  @Post('stake')
  async placeStake(
    @Body('userId') userId: string,
    @Body('selectedNumber') selectedNumber: number,
    @Body('amount') amount: number
  ) {
    await this.matchesService.placeStake(userId, selectedNumber, amount);
    return { success: true };
  }
}
