import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SeedService } from './seed.service';
import { UsersModule } from '../modules/users/users.module';
import { Role } from '../modules/roles/entities/roles.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Role]),
    UsersModule,
  ],
  providers: [SeedService],
})
export class DatabaseModule {}