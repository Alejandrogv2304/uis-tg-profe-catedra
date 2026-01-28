import { Permission } from 'src/modules/permission/entities/permission.entity';
import { User } from 'src/modules/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  DeleteDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';

@Entity('role')
export class Role {
  @PrimaryGeneratedColumn({ name: 'id_rol' })
  id_rol: number;

  @Column({ length: 50 })
  nombre: string;

  @Column({ length: 200, nullable: true })
  descripcion?: string;

  // Relación con users (Un rol puede tener muchos usuarios)
  @OneToMany(() => User, (user) => user.rol)
  usuarios: User[];

  @DeleteDateColumn()
  deleted_at?: Date;

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'rol_permiso',
    joinColumn: { name: 'id_rol' },
    inverseJoinColumn: { name: 'id_permiso' },
  })
  permisos: Permission[];
}
