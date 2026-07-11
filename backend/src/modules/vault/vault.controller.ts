import { Controller, Get, Param } from '@nestjs/common';
import { VaultService } from './vault.service';

@Controller('vault')
export class VaultController {
  constructor(private readonly vaultService: VaultService) {}

  @Get(':userId/balance')
  async getBalance(@Param('userId') userId: string) {
    return this.vaultService.getUserBalance(userId);
  }
}
