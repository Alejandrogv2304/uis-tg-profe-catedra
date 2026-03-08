import { Module } from '@nestjs/common';
import { PostulacionesService } from './postulaciones.service';
import { PostulacionesController } from './postulaciones.controller';
import { PostulacionEntity } from './entities/postulaciones.entity';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
   imports: [TypeOrmModule.forFeature([PostulacionEntity])],
  providers: [PostulacionesService],
  controllers: [PostulacionesController],
  exports: [PostulacionesService],
})
export class PostulacionesModule {}
