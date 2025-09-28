import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Generated,
  Index,
  Check,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Partner } from './partner.entity';
import { UserType } from '../types/user-type.enum';

export enum BookingStatus {
  REQUESTED = 'requested',
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  CANCELLED_FAILURE = 'cancelled_failure',
  CANCELLED_REJECTED = 'cancelled_rejected',
}

@Entity('bookings')
@Index(['partnerId', 'startTime', 'endTime'])
@Index(['customerId'])
export class Booking {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ name: 'customerId' })
  customerId: number;

  @Column({ name: 'partnerId', nullable: true })
  partnerId: number;

  @Column({ name: 'serviceType' })
  serviceType: string;

  @Column({ type: 'date' })
  bookingDate: Date;

  @Column({ type: 'datetime' })
  startTime: Date;

  @Column({ type: 'datetime' })
  endTime: Date;

  @Column({
    type: 'enum',
    enum: BookingStatus,
    default: BookingStatus.REQUESTED,
  })
  status: BookingStatus;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'totalAmount', type: 'decimal', precision: 10, scale: 2, nullable: true })
  totalAmount: number;

  @CreateDateColumn({ name: 'createdAt' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updatedAt' })
  updatedAt: Date;

  @ManyToOne(() => Customer, (customer) => customer.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customerId' })
  customer: Customer;

  @ManyToOne(() => Partner, (partner) => partner.bookings, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partnerId' })
  partner: Partner;
}
