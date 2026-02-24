
import { Entity, PrimaryGeneratedColumn, Column, Unique, Index } from 'typeorm';

@Entity('aspirantes')
@Unique('UQ_aspirante_tipo_numdoc', ['tipoDocumento', 'numeroDocumento'])
export class AspiranteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  //Se guarda el nombre completo del aspirante
  @Column({ type: 'varchar', length: 200 })
  nombre: string; 

  @Column({ type: 'varchar', length: 120 })
  correo: string;

  @Column({ type: 'varchar', length: 30 })
  telefono: string;

  @Index()
  @Column({ name: 'numero_documento', type: 'varchar', length: 30 })
  numeroDocumento: string;

  @Column({ name: 'tipo_documento', type: 'varchar', length: 10 })
  tipoDocumento: string;
}