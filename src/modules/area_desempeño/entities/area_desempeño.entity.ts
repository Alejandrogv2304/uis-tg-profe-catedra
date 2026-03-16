import { PostulacionEntity } from 'src/modules/postulaciones/entities/postulaciones.entity';
import { Entity, PrimaryGeneratedColumn, Column, Index, OneToMany } from 'typeorm';

@Entity('areas_desempeño')
export class AreaDesempenoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  nombre: string;
  
  @OneToMany(() => PostulacionEntity, postulacion => postulacion.areaDesempeno)
  postulaciones: PostulacionEntity[];
}