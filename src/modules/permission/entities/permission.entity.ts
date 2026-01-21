import { Role } from "src/modules/roles/entities/roles.entity";
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";

// Permission entity
@Entity('permiso')
export class Permission {
  @PrimaryGeneratedColumn({ name: 'id_permiso' })
  id_permiso: number;

  @Column({ length: 50, unique: true })
  nombre: string; 

  @Column({ length: 200, nullable: true })
  descripcion?: string;

  @ManyToMany(() => Role, (role) => role.permisos)
  roles: Role[];
}