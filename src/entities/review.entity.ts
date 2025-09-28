import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Check,
  Generated,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Partner } from './partner.entity';
import { Booking } from './booking.entity';

@Entity('reviews')
@Check('rating >= 1 AND rating <= 5')
export class Review {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ name: 'customer_id' })
  customerId: number;

  @Column({ name: 'partner_id' })
  partnerId: number;

  @Column({ name: 'booking_id' })
  bookingId: number;

  @Column({ type: 'int', comment: 'Rating from 1 to 5' })
  rating: number;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Customer, (customer) => customer.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Partner, (partner) => partner.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'partner_id' })
  partner: Partner;

  @ManyToOne(() => Booking, (booking) => booking.id, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'booking_id' })
  booking: Booking;
}