import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { UsersService } from '../modules/users/users.service';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AreaDesempenoEntity } from 'src/modules/area_desempeño/entities/area_desempeño.entity';
import { ConvocatoriaEntity } from 'src/modules/convocatoria/entities/convocatoria.entity';


//Este módulo hace una inicialización al arrancar la aplicación verificando si hay un usuario o no
//Si no hay usuarios registrados, crea un usuario administrador
@Injectable()
export class SeedService implements OnModuleInit {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    private readonly usersService: UsersService,
    private readonly configService: ConfigService,

    @InjectRepository(AreaDesempenoEntity)
    private readonly areasDesempeñoRepository: Repository<AreaDesempenoEntity>,

     @InjectRepository(ConvocatoriaEntity)
    private readonly convocatoriaRepository: Repository<ConvocatoriaEntity>,
  ) {}

  async onModuleInit() {
    await this.seedInformaciónBase();
    await this.seedAdminUser();
  }


private async seedInformaciónBase(){
  //Aquí se inicializa la información base del sistema, areas de desempeño, temas,perfiles y toda la demás información estática.
  const AreasDesempeñoDefault = [
      {
        nombre: 'algoritmica e informatica',
      },
      {
        nombre: 'bases de datos',
      },
      {
        nombre: 'inteligencia artificial',
      },
    ];

    const existingAreas = await this.areasDesempeñoRepository.find();
    if (existingAreas.length === 0) {
      const areasToInsert = AreasDesempeñoDefault.map((area) =>
        this.areasDesempeñoRepository.create(area),
      );
      await this.areasDesempeñoRepository.save(areasToInsert);
      this.logger.log(' Áreas de desempeño inicializadas');
    } else {
      this.logger.log(' Áreas de desempeño ya existen, no se inicializan');
    }

    const Convocatorias = [{
     periodo: '2026-1',
     escuela: 'Ingeniería de Sistemas e Informatica',
    },{
     periodo: '2026-prueba',
     escuela: 'Ingeniería de Sistemas e Informatica',
    }];

    const existingConvocatorias = await this.convocatoriaRepository.find();
    if (existingConvocatorias.length === 0) {
      const convocatoriasToInsert = Convocatorias.map((convocatoria) =>
        this.convocatoriaRepository.create(convocatoria),
      );
      await this.convocatoriaRepository.save(convocatoriasToInsert);
      this.logger.log(' Convocatorias inicializadas');
    } else {
      this.logger.log(' Convocatorias ya existen, no se inicializan');
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
    });

    this.logger.log(
      ` Usuario admin creado exitosamente: ${userResult.message}`,
    );
  }
}
