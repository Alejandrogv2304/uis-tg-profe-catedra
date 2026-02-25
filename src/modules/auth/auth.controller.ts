import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { JwtPayload } from 'src/types/jwt-payload.interface';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('api/v1/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('change-password')
  async changePassword(
    @Body() dto: ChangePasswordDto,
    @Req() req: JwtPayload,
  ) {
    const userCorreo = req.correo;
    return this.authService.changePassword(dto, userCorreo);
  }

  @Post('forgot-password')
  async forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto);
}

  @Post('reset-password')
  async resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto);
}
}
