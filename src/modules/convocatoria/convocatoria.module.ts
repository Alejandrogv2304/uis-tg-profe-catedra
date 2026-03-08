import { Module } from '@nestjs/common';
import { ConvocatoriaService } from './convocatoria.service';
import {TypeOrmModule} from '@nestjs/typeorm';
import { ConvocatoriaController } from './convocatoria.controller';
import { ConvocatoriaEntity } from './entities/convocatoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([ConvocatoriaEntity])],
  providers: [ConvocatoriaService],
  controllers: [ConvocatoriaController],
  exports: [ConvocatoriaService],
})
export class ConvocatoriaModule {}
