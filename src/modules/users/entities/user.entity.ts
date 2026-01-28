import { Role } from 'src/modules/roles/entities/roles.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('usuario')
export class User {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id_usuario: number;

  @Column({ length: 100 })
  nombres: string;

  @Column({ length: 100 })
  apellidos: string;

  @Column({ length: 150, unique: true })
  correo: string;

  @Column({ length: 256 })
  hash: string;

  @Column({ length: 256 })
  salt: string;

  @ManyToOne(() => Role, (rol) => rol.usuarios, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'id_rol' })
  rol: Role;

  @DeleteDateColumn()
  deleted_at?: Date;
}
