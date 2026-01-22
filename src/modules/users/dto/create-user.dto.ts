import { 
  IsEmail, 
  IsNotEmpty, 
  IsString, 
  MinLength, 
  MaxLength,
  IsOptional,
  IsInt,
  IsPositive,
} from 'class-validator';

export class CreateUserDto {
  @IsString({ message: 'Los nombres deben ser una cadena de texto' })
  @IsNotEmpty({ message: 'Los nombres son obligatorios' })
  @MaxLength(100, { message: 'Los nombres no pueden exceder 100 caracteres' })
  nombres: string;

  @IsString({ message: 'Los apellidos deben ser una cadena de texto' })
  @IsNotEmpty({ message: 'Los apellidos son obligatorios' })
  @MaxLength(100, { message: 'Los apellidos no pueden exceder 100 caracteres' })
  apellidos: string;

  @IsEmail({}, { message: 'El correo debe tener un formato válido' })
  @IsNotEmpty({ message: 'El correo es obligatorio' })
  @MaxLength(150, { message: 'El correo no puede exceder 150 caracteres' })
  correo: string;

  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @MinLength(8, { message: 'La contraseña debe tener mínimo 8 caracteres' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  password: string;

  @IsNotEmpty()
  @IsInt({ message: 'El id del rol debe ser un número entero' })
  @IsPositive({ message: 'El id del rol debe ser un número positivo' })
  id_rol?: number;
}