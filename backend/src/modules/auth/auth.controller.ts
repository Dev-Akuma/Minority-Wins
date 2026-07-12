import { Controller, Post, Body, UnauthorizedException, Headers } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('phone')
  async loginWithPhone(@Body('idToken') idToken: string) {
    if (!idToken) {
      throw new UnauthorizedException('Missing Firebase idToken');
    }
    
    return this.authService.verifyFirebaseToken(idToken);
  }
}
