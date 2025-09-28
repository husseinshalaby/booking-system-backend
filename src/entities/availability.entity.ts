import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Check,
  Generated,
} from 'typeorm';
import { Partner } from './partner.entity';

export enum AvailabilityStatus {
  PENDING = 'pending',
  BOOKED = 'booked',
  EXPIRED = 'expired',
}

@Entity('availabilities')
@Index(['partnerId', 'startTime', 'endTime'])
@Check('start_time < end_time')
export class Availability {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ name: 'partner_id' })
  partnerId: number;

  @Column({ name: 'start_time', type: 'datetime' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: AvailabilityStatus,
    default: AvailabilityStatus.PENDING,
  })
  status: AvailabilityStatus;

  @Column({ name: 'is_available', default: true })
  isAvailable: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Partner, (partner) => partner.availabilities, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;
}
