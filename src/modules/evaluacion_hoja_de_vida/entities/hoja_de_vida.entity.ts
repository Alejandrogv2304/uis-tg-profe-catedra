import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
  DeleteDateColumn,
  OneToMany,
} from 'typeorm';
import { ItemHvEntity } from './items_hv.entity';

@Entity('hoja_de_vida')
@Index('UQ_hoja_vida_aspirante_convocatoria', ['aspiranteId', 'convocatoriaId'], {
  unique: true,
})
export class HojaVidaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'aspirante_id', type: 'uuid' })
  aspiranteId: string;

  @Column({ name: 'convocatoria_id', type: 'uuid' })
  convocatoriaId: string;

  @Column({ name: 'evaluador_id', type: 'uuid' })
  evaluadorId: string;

  /**
   Este campo se va calculando con los 
   puntajes derivados de items_hv
   */
  @Column({
    name: 'puntaje_total',
    type: 'int',
    default: 0,
  })
  puntajeTotal: number;

  @Column({ type: 'text', nullable: true })
  observaciones?: string | null;


  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;

  @OneToMany(() => ItemHvEntity, (item) => item.hojaVida)
  items: ItemHvEntity[];
}