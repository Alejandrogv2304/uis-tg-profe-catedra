import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../modules/roles/entities/roles.entity';

//Este módulo hace una inicialización al arrancar la aplicación verificando si hay un usuario o no
//Si no hay usuarios registrados, crea un usuario administrador
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  async onModuleInit() {
    await this.seedRoles();
    await this.seedAdminUser();
  }

  private async seedRoles() {
    const rolesDefault = [
      {
        nombre: 'administrador',
        descripcion: 'Administrador con acceso total al sistema',
      },
      {
        nombre: 'miembroConsejo',
        descripcion:
          'Miembro del consejo con permisos de evaluacion y revision',
      },
      {
        nombre: 'secretaria',
        descripcion: 'Secretaria con permisos administrativos limitados',
      },
    ];

    for (const rolData of rolesDefault) {
      const exists = await this.rolesRepository.findOne({
        where: { nombre: rolData.nombre },
      });

      if (!exists) {
        const rol = this.rolesRepository.create(rolData);
        await this.rolesRepository.save(rol);
        this.logger.log(` Rol ${rolData.nombre} creado`);
      }
    }
  }

  private async seedAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL') ?? '';
    const adminPassword =
      this.configService.get<string>('ADMIN_PASSWORD') ?? '';

    if (!adminEmail || !adminPassword) {
      this.logger.warn(' ADMIN_EMAIL o ADMIN_PASSWORD no están configurados');
      return;
    }

    const existingAdmin = await this.usersService.findByEmail(
      String(adminEmail),
    );

    if (existingAdmin) {
      this.logger.log(' Usuario admin ya existe');
      return;
    }

    const userResult = await this.usersService.createUser({
      correo: String(adminEmail),
      password: String(adminPassword),
      nombres: 'Admin',
      apellidos: 'Sistema',
      id_rol: 1, //Le ponemos el rol de administrador
    });

    this.logger.log(
      ` Usuario admin creado exitosamente: ${userResult.message}`,
    );
  }
}
