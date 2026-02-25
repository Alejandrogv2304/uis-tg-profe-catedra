import { IsString, MinLength } from 'class-validator';

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  old_password: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  new_password: string;
}
