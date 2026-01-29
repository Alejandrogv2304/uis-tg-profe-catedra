import { BadRequestException, Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailService } from '../email/email.service';
import { PasswordResetToken } from './entities/passwordreset.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { generateResetToken, hashToken } from './password-reset-util';
import { ResetPasswordDto } from './dto/reset-password.dto';


@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private emailService: EmailService,

     @InjectRepository(PasswordResetToken)
    private readonly passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async login(loginDto: LoginDto) {
    const { correo, password } = loginDto;
    this.logger.log(`Intento de login`);

    // 1. Buscar usuario con hash y permisos usando el metodo de UserService
    const user = await this.usersService.findByEmailWithPermissions(correo);

    //Verificacion de que no sea un usuario eliminado o inactivo
    if (!user || user.deleted_at) {
      this.logger.warn(`Login fallido: usuario no encontrado o inactivo`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Validación de contraseña
    let isPasswordValid: boolean;
    try {
      isPasswordValid = await bcrypt.compare(password, user.hash);
    } catch (error) {
      this.logger.error(`Error al validar contraseña: ${error}`);
      throw new UnauthorizedException('Error al validar credenciales');
    }

    if (!isPasswordValid) {
      this.logger.warn(`Login fallido: contraseña incorrecta`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Mapeo de permisos
    const permisos = user.rol?.permisos?.map((p) => p.nombre) || [];

    // 4. Creación de payloads
    const payloadAccess = {
      sub: user.id_usuario,
      correo: user.correo,
      rol: user.rol?.id_rol,
      permisos,
    };

    const payloadRefresh = { sub: user.id_usuario };

    // 5. Generar tokens
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payloadAccess, {
        secret: this.configService.get('JWT_SECRET'),
        expiresIn: this.configService.get('DURACION_ACCESS_TOKEN'),
      }),
      this.jwtService.signAsync(payloadRefresh, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('DURACION_REFRESH_TOKEN'),
      }),
    ]);

    this.logger.log(`Login exitoso para usuario`);

    return {
      message: 'Login exitoso',
      access_token,
      refresh_token,
      user: {
        id: user.id_usuario,
        nombres: user.nombres,
        correo: user.correo,
        rol: user.rol?.id_rol,
        permisos,
      },
    };
  }

  async changePassword(
    changePasswordDto: ChangePasswordDto,
    userCorreo: string,
  ): Promise<{ message: string }> {
    const { old_password, new_password } = changePasswordDto;

    // 1. Buscar usuario con hash y permisos usando el metodo de UserService
    const user = await this.usersService.findByEmailWithPermissions(userCorreo);

    //Verificacion de que no sea un usuario eliminado o inactivo
    if (!user || user.deleted_at) {
      this.logger.warn(`Login fallido: usuario no encontrado o inactivo`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 1. Validación de contraseña
    let isPasswordValid: boolean;
    try {
      isPasswordValid = await bcrypt.compare(old_password, user.hash);
    } catch (error) {
      this.logger.error(`Error al validar contraseña: ${error}`);
      throw new UnauthorizedException('Error al validar credenciales');
    }

    if (!isPasswordValid) {
      this.logger.warn(`Contraseña incorrecta`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // 2. Encriptar nueva contraseña
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    //3.Actualizar la contraseña en la base de datos
    await this.usersService.updatePassword(user.id_usuario, hash, salt);

    this.logger.log(
      `Contraseña actualizada exitosamente para usuario ${user.correo}`,
    );

    return {
      message: 'Contraseña actualizada exitosamente',
    };
  }


    async forgotPassword(
    forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    const { correo } = forgotPasswordDto;
    this.logger.log(`Solicitud de recuperación de contraseña`);

    const user = await this.usersService.findByEmail(correo);

    
    if (!user || user.deleted_at) {
      this.logger.warn(
        `Recuperación solicitada para correo inexistente/inactivo`,
      );
      return {
        message:
          'Si el correo existe, enviaremos instrucciones para restablecer la contraseña.',
      };
    }

    // Invalida tokens previos
    await this.passwordResetTokenRepository.update(
      { user: { id_usuario: user.id_usuario } as any, used_at: IsNull() },
      { used_at: new Date() },
    );

    const token = generateResetToken();
    const tokenHash = hashToken(token);

    const expiresMinutes = Number(
      this.configService.get('PASSWORD_RESET_EXPIRES_MINUTES') ?? 5,
    );
    const expiresAt = new Date(Date.now() + expiresMinutes * 60 * 1000);

    await this.passwordResetTokenRepository.save({
      user,
      token_hash: tokenHash,
      expires_at: expiresAt,
      used_at: null,
    });

    try {
      await this.emailService.sendPasswordResetEmail(user.correo, {
        nombres: user.nombres,
        token,
        expiresMinutes,
      });
      this.logger.log(`Correo de recuperación enviado a ${user.correo}`);
    } catch (error) {
      
      this.logger.error(`Error enviando correo de recuperación: ${error}`);
    }

    return {
      message:
        'Si el correo existe, enviaremos instrucciones para restablecer la contraseña.',
    };
  }

  
  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    const { token, new_password } = resetPasswordDto;
    this.logger.log(`Intento de restablecer contraseña`);

    const tokenHash = hashToken(token);

    const record = await this.passwordResetTokenRepository.findOne({
      where: { token_hash: tokenHash, used_at: IsNull() },
      relations: { user: true },
    });

    if (!record) {
      this.logger.warn(`Reset fallido: token inválido o usado`);
      throw new BadRequestException('Token inválido');
    }

    if (record.expires_at.getTime() < Date.now()) {
      this.logger.warn(`Reset fallido: token expirado`);
      throw new BadRequestException('Token expirado');
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(new_password, salt);

    await this.usersService.updatePassword(record.user.id_usuario, hash, salt);

    record.used_at = new Date();
    await this.passwordResetTokenRepository.save(record);

    this.logger.log(
      `Contraseña restablecida exitosamente para ${record.user.correo}`,
    );

    return { message: 'Contraseña restablecida exitosamente' };
  }
}
