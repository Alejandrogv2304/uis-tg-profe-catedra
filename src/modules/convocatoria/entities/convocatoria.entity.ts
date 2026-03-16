import { Entity, PrimaryGeneratedColumn, Column, Index, DeleteDateColumn } from 'typeorm';

@Entity('convocatorias')
export class ConvocatoriaEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  periodo: string;

  @Column({type: 'varchar', length: 100})
  escuela: string;
  

 @DeleteDateColumn({ name: 'deletedat' })
 deletedAt?: Date | null;
}