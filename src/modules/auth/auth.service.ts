import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcrypt';
import { ChangePasswordDto } from './dto/change-password.dto';

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);

    constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
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
    this.logger.error(`Error al validar contraseña: ${error.message}`);
    throw new UnauthorizedException('Error al validar credenciales');
    }

    if (!isPasswordValid) {
      this.logger.warn(`Login fallido: contraseña incorrecta`);
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Mapeo de permisos
    const permisos = user.rol?.permisos?.map(p => p.nombre) || [];

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

  async changePassword(changePasswordDto:ChangePasswordDto, userCorreo:string):Promise<{message:string}> {
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
    this.logger.error(`Error al validar contraseña: ${error.message}`);
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

    this.logger.log(`Contraseña actualizada exitosamente para usuario ${user.correo}`);

    return {
      message: 'Contraseña actualizada exitosamente',
    };

}


}
