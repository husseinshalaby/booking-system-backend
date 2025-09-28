import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Booking } from './booking.entity';

@Entity('customers')
@Index(['email'])
export class Customer {
  @PrimaryGeneratedColumn()
  id: number;


  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 15, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'country_code', length: 3, nullable: true, comment: 'ISO 3166-1 alpha-2 country code (e.g., AU, US, CA)' })
  countryCode: string;

  @Column({ length: 100, nullable: true, comment: 'Full country name (e.g., Australia, United States)' })
  country: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Booking, (booking) => booking.customer)
  bookings: Booking[];
}
