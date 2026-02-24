import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Unique,
  Index,
  DeleteDateColumn,
} from 'typeorm';


//Etapas de la postulación
export enum PostulacionEstado {
  PRIMERA_ETAPA = 'PRIMERA_ETAPA',
  SEGUNDA_ETAPA = 'SEGUNDA_ETAPA',
}

@Entity('postulaciones')
@Unique('UQ_post_conv_asp_perfil_sede', ['convocatoriaId', 'aspiranteId', 'perfil', 'sede'])
@Index('IX_post_convocatoria', ['convocatoriaId'])
export class PostulacionEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aspirante_id', type: 'uuid' })
  aspiranteId: string;

  @Column({ name: 'convocatoria_id', type: 'uuid' })
  convocatoriaId: string;

  @Column({ type: 'varchar', length: 50 })
  perfil: string;

  @Column({ type: 'varchar', length: 50 })
  sede: string;

  @Column({ type: 'varchar', length: 120 })
  correo: string;

  @Column({ type: 'varchar', length: 30 })
  telefono: string;

  @Column({ name: 'area_desempeno_id', type: 'uuid' })
  areaDesempenoId: string;

  @Column({ type: 'enum', enum: PostulacionEstado })
  estado: PostulacionEstado;

  @DeleteDateColumn({ name: 'deletedat' })
 deletedAt?: Date | null;
}