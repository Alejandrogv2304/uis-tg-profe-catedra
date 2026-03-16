import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { RolesModule } from './modules/roles/roles.module';
import { DatabaseModule } from './database/database.module';
import { EmailModule } from './modules/email/email.module';
import { CargaDatosInicialService } from './modules/carga_datos_inicial/carga_datos_inicial.service';
import { CargaDatosInicialController } from './modules/carga_datos_inicial/carga_datos_inicial.controller';
import { CargaDatosInicialModule } from './modules/carga_datos_inicial/carga_datos_inicial.module';
import { AspirantesModule } from './modules/aspirantes/aspirantes.module';
import { PostulacionesModule } from './modules/postulaciones/postulaciones.module';
import { AreaDesempeñoModule } from './modules/area_desempeño/area_desempeño.module';
import { ConvocatoriaModule } from './modules/convocatoria/convocatoria.module';
import { EvaluacionHojaDeVidaModule } from './modules/evaluacion_hoja_de_vida/evaluacion_hoja_de_vida.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST'),
        port: configService.get('DB_PORT'),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get('NODE_ENV') === 'development',
        logging: false,
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    RolesModule,
    DatabaseModule,
    EmailModule,
    CargaDatosInicialModule,
    AspirantesModule,
    PostulacionesModule,
    AreaDesempeñoModule,
    ConvocatoriaModule,
    EvaluacionHojaDeVidaModule,
  ],
  controllers: [AppController, CargaDatosInicialController],
  providers: [AppService, CargaDatosInicialService],
})
export class AppModule {}
