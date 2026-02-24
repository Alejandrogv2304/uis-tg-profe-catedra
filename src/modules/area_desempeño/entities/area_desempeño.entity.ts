import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

@Entity('areas_desempeño')
export class AreaDesempenoEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 200 })
  nombre: string;
}