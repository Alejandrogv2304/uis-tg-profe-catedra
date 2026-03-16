import { Entity, PrimaryGeneratedColumn, Column, Index, DeleteDateColumn, OneToMany } from 'typeorm';
import { ItemHvEntity } from './items_hv.entity';

@Entity('criterios_hv')
export class CriterioHvEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 150 })
  nombre: string;

  @Column({type: 'int'})
  puntajeMaximo: number;
  

 @DeleteDateColumn({ name: 'deletedat' })
 deletedAt?: Date | null;

 @OneToMany(() => ItemHvEntity, (item) => item.criterioHv)
 items: ItemHvEntity[];
}