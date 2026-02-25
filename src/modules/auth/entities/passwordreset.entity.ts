import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
  Index,
} from 'typeorm';
import { User } from 'src/modules/users/entities/user.entity';

@Entity('password_reset_token')
export class PasswordResetToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  user: User;

  @Index()
  @Column({ type: 'varchar', length: 128 })
  token_hash: string;

  @Index()
  @Column({ type: 'timestamp' })
  expires_at: Date;

  @Column({ type: 'timestamp', nullable: true })
  used_at: Date | null;

  @CreateDateColumn({ type: 'timestamp' })
  created_at: Date;
}
