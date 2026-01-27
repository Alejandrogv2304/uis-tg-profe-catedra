import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import type { JwtPayload } from 'src/types/jwt-payload.interface';
import { JwtAuthGuard } from './jwt/jwt-auth.guard';

@Controller('api/v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService){}


    @Post('login')
    async login(@Body() loginDto: LoginDto){
        return this.authService.login(loginDto);
    }

    @UseGuards(JwtAuthGuard)
     @Post('change-password')
    async changePassword(@Body() changePasswordDto: ChangePasswordDto,
     @Req() req:JwtPayload
     ){
        const userCorreo = req.correo
        return this.authService.changePassword(changePasswordDto, userCorreo);
    }
}
