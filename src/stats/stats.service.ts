import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Partner } from '../entities/partner.entity';
import { Booking } from '../entities/booking.entity';
import { Availability } from '../entities/availability.entity';

@Injectable()
export class StatsService {
  constructor(
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
    @InjectRepository(Partner)
    private partnerRepository: Repository<Partner>,
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
  ) {}

  async getCounts() {
    const [
      totalCustomers,
      totalPartners,
      totalBookings,
      totalAvailabilities,
      activePartners,
      availableSlots,
    ] = await Promise.all([
      this.customerRepository.count({ where: { isActive: true } }),
      this.partnerRepository.count({ where: { isActive: true } }),
      this.bookingRepository.count(),
      this.availabilityRepository.count(),
      this.partnerRepository.count({ where: { isActive: true } }),
      this.availabilityRepository.count({ where: { isAvailable: true } }),
    ]);

    return {
      totalCustomers,
      totalPartners,
      totalBookings,
      totalAvailabilities,
      activePartners,
      availableSlots,
    };
  }

  async getDashboardStats() {
    const counts = await this.getCounts();

    return {
      ...counts,
      bookingsByStatus: {},
      partnersByService: {},
      recentBookings: [],
    };
  }
}