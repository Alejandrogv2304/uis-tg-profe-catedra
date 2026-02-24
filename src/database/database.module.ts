import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { UsersModule } from '../modules/users/users.module';
import { AreaDesempenoEntity } from 'src/modules/area_desempeño/entities/area_desempeño.entity';
import { ConvocatoriaEntity } from 'src/modules/convocatoria/entities/convocatoria.entity';

@Module({
  imports: [TypeOrmModule.forFeature([AreaDesempenoEntity, ConvocatoriaEntity]), UsersModule],
  providers: [SeedService],
})
export class DatabaseModule {}
