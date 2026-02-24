import { Module } from '@nestjs/common';
import { AspiranteEntity } from '../aspirantes/entities/aspirantes.entity';
import { PostulacionEntity } from '../postulaciones/entities/postulaciones.entity';
import { AreaDesempenoEntity } from '../area_desempeño/entities/area_desempeño.entity';
import { CargaDatosInicialController } from './carga_datos_inicial.controller';
import { CargaDatosInicialService } from './carga_datos_inicial.service';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([AspiranteEntity, PostulacionEntity, AreaDesempenoEntity])],
  controllers: [CargaDatosInicialController],
  providers: [CargaDatosInicialService],
  exports: [CargaDatosInicialService],
})

export class CargaDatosInicialModule {}
