import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Generated,
  Index,
  Check,
} from 'typeorm';
import { Availability } from './availability.entity';
import { Booking } from './booking.entity';

export enum ServiceType {
  PAINTER = 'painter',
  ELECTRICIAN = 'electrician',
  PLUMBER = 'plumber',
  CLEANER = 'cleaner',
  HANDYMAN = 'handyman',
  HVAC = 'hvac',
  LANDSCAPER = 'landscaper',
  ROOFER = 'roofer',
}

@Entity('partners')
@Index(['email'])
@Check('average_rating >= 0 AND average_rating <= 5')
@Check('completed_jobs >= 0')
@Check('failed_jobs >= 0')
@Check('cancelled_jobs >= 0')
@Check('hourly_rate IS NULL OR hourly_rate >= 0')
export class Partner {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Generated('uuid')
  uuid: string;

  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ type: 'text', nullable: true })
  address: string;

  @Column({ name: 'country_code', length: 2, nullable: true, comment: 'ISO 3166-1 alpha-2 country code (e.g., AU, US, CA)' })
  countryCode: string;

  @Column({ length: 100, nullable: true, comment: 'Full country name (e.g., Australia, United States)' })
  country: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({
    name: 'service_type',
    type: 'enum',
    enum: ServiceType,
    default: ServiceType.PAINTER,
  })
  serviceType: ServiceType;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'hourly_rate', type: 'decimal', precision: 10, scale: 2, nullable: true })
  hourlyRate: number;

  @Column({ name: 'average_rating', type: 'decimal', precision: 3, scale: 2, default: 0, comment: 'Average rating from 0.00 to 5.00' })
  averageRating: number;

  @Column({ name: 'completed_jobs', type: 'int', default: 0, comment: 'Total number of completed jobs' })
  completedJobs: number;

  @Column({ name: 'failed_jobs', type: 'int', default: 0, comment: 'Total number of CANCELLED_FAILURE jobs' })
  failedJobs: number;

  @Column({ name: 'cancelled_jobs', type: 'int', default: 0, comment: 'Total number of CANCELLED_REJECTED jobs' })
  cancelledJobs: number;

  @Column({ name: 'last_active_at', type: 'datetime', nullable: true, comment: 'Last time partner was active in the system' })
  lastActiveAt: Date;

  @Column({ type: 'json', nullable: true, comment: 'Partner preferences for location, job types, etc.' })
  preferences: object;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Availability, (availability) => availability.partner)
  availabilities: Availability[];

  @OneToMany(() => Booking, (booking) => booking.partner)
  bookings: Booking[];
}
