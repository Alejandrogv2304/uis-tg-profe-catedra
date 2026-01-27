import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
import { Role } from '../roles/entities/roles.entity';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
     private readonly logger = new Logger(UsersService.name);
    constructor(
        @InjectRepository(User)
        private readonly usersRepository: Repository<User>,

        @InjectRepository(Role)
        private readonly rolesRepository: Repository<Role>,
    ) { }

    /**
     * Crea un nuevo usuario en el sistema
     * @param userData - Datos del usuario a crear
     * @returns Usuario creado 
     */
    async createUser(userData: CreateUserDto): Promise<{ user: Partial<User>; message: string }> {
         this.logger.log(`Creando usuario: ${userData.correo}`);
        // 1. Validar que el rol existe 
        let rol: Role | null = null;
        if (userData.id_rol) {
            rol = await this.rolesRepository.findOne({
                where: { id_rol: userData.id_rol },
            });
            if (!rol) {
                throw new NotFoundException(`El rol con ID ${userData.id_rol} no existe`);
            }
        }

        // 2. Encriptar contraseña
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(userData.password, salt);

        // 3. Crear y guardar usuario
        const newUser = this.usersRepository.create({
            nombres: userData.nombres,
            apellidos: userData.apellidos,
            correo: userData.correo,
            hash,
            salt,
            ...(rol && { rol }),
        });

        try {
            const savedUser = await this.usersRepository.save(newUser);

            // 4. Retornar usuario sin información sensible
            const { hash: _, salt: __, ...userWithoutSensitiveData } = savedUser;

            return {
                user: userWithoutSensitiveData,
                message: 'Usuario creado exitosamente',
            };
        } catch (error) {
            // Manejar error de correo duplicado (constraint de BD)
            if (error.code === '23505') { 
                throw new BadRequestException('El correo ya está registrado');
            }
            throw new InternalServerErrorException('Error al crear el usuario');
        }
    }


    /**
     * Consulta un usuario por su correo y retorna los permisos asociados a su rol
     * @param correo - Correo del usuario a buscar
     * @returns Array con id y nombre de los permisos del usuario, o null si no existe
     */
    async findByEmailWithPermissions(correo: string): Promise<User | null> {
        
        const user = await this.usersRepository.findOne({
            where: { correo },
            relations: ['rol', 'rol.permisos'],
        });

        if (!user) {
            this.logger.warn(`Usuario no encontrado: ${correo}`);
            return null;
        }


          return user;
    }


    async findByEmail(correo: string): Promise<User | null> {
    return await this.usersRepository.findOne({
    where: { correo },
    relations: ['rol'],
  });
}


 async updatePassword(userId: number, newHash: string, newSalt: string): Promise<void> {
   await this.usersRepository.update(userId, {
     hash: newHash,
     salt: newSalt,
   });
 }



}
