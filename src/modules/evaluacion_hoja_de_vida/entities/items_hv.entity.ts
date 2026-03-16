import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  Index,
  DeleteDateColumn,
} from 'typeorm';
import { HojaVidaEntity } from './hoja_de_vida.entity';
import { CriterioHvEntity } from './criterios_hv.entity';

@Entity('items_hv')
@Index('UQ_items_hv_hoja_vida_criterio', ['hojaVidaId', 'criterioHvId'], {
  unique: true,
})
export class ItemHvEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'hoja_vida_id', type: 'uuid' })
  hojaVidaId: string;

  @Column({ name: 'criterio_hv_id', type: 'uuid' })
  criterioHvId: string;

  @Column({ type: 'int', default: 0 })
  puntaje: number;

  @Column({ type: 'text', nullable: true })
  observacion?: string | null;


  @DeleteDateColumn({ name: 'deleted_at' })
  deletedAt?: Date | null;

  @ManyToOne(() => HojaVidaEntity, { nullable: false, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'hoja_vida_id' })
  hojaVida: HojaVidaEntity;

  @ManyToOne(() => CriterioHvEntity, { nullable: false, onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'criterio_hv_id' })
  criterioHv: CriterioHvEntity;
}