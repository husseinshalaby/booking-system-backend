import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { Availability, AvailabilityStatus } from '../entities/availability.entity';
import { Partner } from '../entities/partner.entity';
import { Customer } from '../entities/customer.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';

import {
  BookingRequestDto,
  BookingResponseData,
  BookingConfirmDto,
  BookingConfirmResponseData,
} from './bookings.controller';

@Injectable()
export class BookingsService {
  private pendingRequests = new Map<
    string,
    {
      startTime: string;
      endTime: string;
      availableMatches: any[];
      bookingId: number;
    }
  >();

  constructor(
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
    @InjectRepository(Partner)
    private partnersRepository: Repository<Partner>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
  ) {}

  async create(createBookingDto: CreateBookingDto): Promise<Booking> {
    throw new BadRequestException('Booking creation temporarily disabled');
  }

  async createBookingRequest(
    bookingRequest: BookingRequestDto,
    customerId: number,
  ): Promise<BookingResponseData> {
    const { startTime, serviceType } = bookingRequest;
    
    
    const allPartners = await this.partnersRepository.find();
    
    const allAvailability = await this.availabilityRepository.find();
    
    const requestedDay = new Date(startTime);
    
    const dayStart = new Date(requestedDay);
    dayStart.setUTCHours(0, 0, 0, 0);
    
    const dayEnd = new Date(requestedDay);
    dayEnd.setUTCHours(23, 59, 59, 999);
    

    
    const availableSlots = await this.availabilityRepository
      .createQueryBuilder('availability')
      .innerJoinAndSelect('availability.partner', 'partner')
      .where('partner.serviceType = :serviceType', { serviceType })
      .andWhere('availability.startTime >= :dayStart', { dayStart })
      .andWhere('availability.startTime <= :dayEnd', { dayEnd })
      .andWhere('availability.isAvailable = true')
      .andWhere('availability.status = :status', { status: AvailabilityStatus.PENDING })
      .orderBy('availability.startTime', 'ASC')
      .getMany();
    


    if (availableSlots.length === 0) {
      
      const upcomingSlots = await this.availabilityRepository
        .createQueryBuilder('availability')
        .innerJoinAndSelect('availability.partner', 'partner')
        .where('partner.serviceType = :serviceType', { serviceType })
        .andWhere('availability.startTime > :now', { now: new Date() })
        .andWhere('availability.isAvailable = true')
        .andWhere('availability.status = :status', { status: AvailabilityStatus.PENDING })
        .orderBy('availability.startTime', 'ASC')
        .limit(10)
        .getMany();


      const nearestAvailabilities = upcomingSlots.map(slot => ({
        startTime: slot.startTime.toISOString(),
        endTime: slot.endTime.toISOString(),
        partnerId: slot.partnerId,
        partnerName: `${slot.partner.firstName} ${slot.partner.lastName}`,
      }));

      const tempBooking = this.bookingsRepository.create({
        customerId: customerId,
        partnerId: null,
        serviceType: bookingRequest.serviceType,
        bookingDate: new Date(new Date(startTime).getFullYear(), new Date(startTime).getMonth(), new Date(startTime).getDate()),
        startTime: new Date(startTime),
        endTime: new Date(bookingRequest.endTime),
        status: BookingStatus.CANCELLED_FAILURE,
        description: `No availability for ${bookingRequest.serviceType} service`,
      });

      const tempSavedBooking = await this.bookingsRepository.save(tempBooking);
      return {
        uuid: tempSavedBooking.uuid,
        status: BookingStatus.CANCELLED_FAILURE,
        nearestAvailabilities,
      };
    }

    const requestStartTime = new Date(startTime);
    const exactMatchSlot = availableSlots.find(slot => {
      const slotStartTime = new Date(slot.startTime);
      return slotStartTime.getTime() === requestStartTime.getTime();
    });

    if (exactMatchSlot) {
      
      const bookingDate = new Date(requestStartTime.getFullYear(), requestStartTime.getMonth(), requestStartTime.getDate());
      
      const booking = this.bookingsRepository.create({
        customerId: customerId,
        partnerId: exactMatchSlot.partnerId,
        serviceType: bookingRequest.serviceType,
        bookingDate: bookingDate,
        startTime: exactMatchSlot.startTime,
        endTime: exactMatchSlot.endTime,
        status: BookingStatus.CONFIRMED,
        description: `Auto-confirmed booking for ${bookingRequest.serviceType} service`,
      });

      const savedBooking = await this.bookingsRepository.save(booking);

      exactMatchSlot.isAvailable = false;
      exactMatchSlot.status = AvailabilityStatus.BOOKED;
      await this.availabilityRepository.save(exactMatchSlot);

      const confirmedAvailability = [{
        startTime: exactMatchSlot.startTime.toISOString(),
        endTime: exactMatchSlot.endTime.toISOString(),
        partnerId: exactMatchSlot.partnerId,
        partnerName: `${exactMatchSlot.partner.firstName} ${exactMatchSlot.partner.lastName}`,
      }];

      return {
        uuid: savedBooking.uuid,
        status: BookingStatus.CONFIRMED,
        nearestAvailabilities: confirmedAvailability,
        bookingObject: {
          id: savedBooking.id,
          uuid: savedBooking.uuid,
          customerId: savedBooking.customerId,
          partnerId: savedBooking.partnerId,
          serviceType: savedBooking.serviceType,
          bookingDate: savedBooking.bookingDate.toISOString().split('T')[0],
          startTime: savedBooking.startTime.toISOString().split('T')[1].substring(0, 5),
          endTime: savedBooking.endTime.toISOString().split('T')[1].substring(0, 5),
          status: savedBooking.status,
          description: savedBooking.description,
          totalAmount: savedBooking.totalAmount,
          createdAt: savedBooking.createdAt.toISOString(),
          updatedAt: savedBooking.updatedAt.toISOString(),
        },
      };
    }

    
    const bookingDate = new Date(requestStartTime.getFullYear(), requestStartTime.getMonth(), requestStartTime.getDate());
    
    const booking = this.bookingsRepository.create({
      customerId: customerId,
      partnerId: null,
      serviceType: bookingRequest.serviceType,
      bookingDate: bookingDate,
      startTime: new Date(startTime),
      endTime: new Date(bookingRequest.endTime),
      status: BookingStatus.PENDING,
      description: `Booking request for ${bookingRequest.serviceType} service`,
    });

    const savedBooking = await this.bookingsRepository.save(booking);

    this.pendingRequests.set(savedBooking.uuid, {
      startTime,
      endTime: bookingRequest.endTime,
      availableMatches: availableSlots,
      bookingId: savedBooking.id,
    });

    const nearestAvailabilities = availableSlots.map(slot => ({
      startTime: slot.startTime.toISOString(),
      endTime: slot.endTime.toISOString(),
      partnerId: slot.partnerId,
      partnerName: `${slot.partner.firstName} ${slot.partner.lastName}`,
    }));

    return {
      uuid: savedBooking.uuid,
      status: BookingStatus.PENDING,
      nearestAvailabilities,
      bookingObject: {
        id: savedBooking.id,
        uuid: savedBooking.uuid,
        customerId: savedBooking.customerId,
        partnerId: savedBooking.partnerId,
        serviceType: savedBooking.serviceType,
        bookingDate: savedBooking.bookingDate.toISOString().split('T')[0],
        startTime: savedBooking.startTime.toISOString().split('T')[1].substring(0, 5),
        endTime: savedBooking.endTime.toISOString().split('T')[1].substring(0, 5),
        status: savedBooking.status,
        description: savedBooking.description,
        totalAmount: savedBooking.totalAmount,
        createdAt: savedBooking.createdAt.toISOString(),
        updatedAt: savedBooking.updatedAt.toISOString(),
      },
    };
  }

  async confirmBooking(
    confirmRequest: BookingConfirmDto,
    customerId: number,
  ): Promise<BookingConfirmResponseData> {
    const { bookingRequestId, partnerId } = confirmRequest;


    const pendingRequest = this.pendingRequests.get(bookingRequestId);
    if (!pendingRequest) {
      throw new NotFoundException('Booking request not found or expired');
    }


    const existingBooking = await this.bookingsRepository.findOne({
      where: { uuid: bookingRequestId, status: BookingStatus.PENDING },
    });

    if (!existingBooking) {
      throw new NotFoundException('Booking not found or already confirmed');
    }

    const partner = await this.partnersRepository.findOne({
      where: { id: partnerId, isActive: true },
    });

    if (!partner) {
      throw new NotFoundException('Partner not found or inactive');
    }


    const bookingDay = new Date(existingBooking.startTime);
    bookingDay.setUTCHours(0, 0, 0, 0);
    
    const dayEnd = new Date(bookingDay);
    dayEnd.setUTCHours(23, 59, 59, 999);
    
    
    const allPartnerSlots = await this.availabilityRepository.find({
      where: { partnerId: partnerId },
    });

    const availabilitySlot = await this.availabilityRepository.findOne({
      where: {
        partnerId: partnerId,
        isAvailable: true,
        status: AvailabilityStatus.PENDING,
      },
      order: {
        startTime: 'ASC'
      }
    });

    if (!availabilitySlot) {
      throw new ConflictException('Selected time slot is no longer available');
    }


    existingBooking.customerId = customerId;
    existingBooking.partnerId = partnerId;
    existingBooking.startTime = availabilitySlot.startTime;
    existingBooking.endTime = availabilitySlot.endTime;
    existingBooking.status = BookingStatus.CONFIRMED;
    existingBooking.serviceType = partner.serviceType;
    existingBooking.description = `Booking for ${partner.serviceType} service`;

    const savedBooking = await this.bookingsRepository.save(existingBooking);

    availabilitySlot.isAvailable = false;
    availabilitySlot.status = AvailabilityStatus.BOOKED;
    await this.availabilityRepository.save(availabilitySlot);

    this.pendingRequests.delete(bookingRequestId);

    return {
      bookingId: savedBooking.id.toString(),
      painter: {
        id: partner.id.toString(),
        name: `${partner.firstName} ${partner.lastName}`,
      },
      startTime: savedBooking.startTime.toISOString(),
      endTime: savedBooking.endTime.toISOString(),
      status: savedBooking.status,
    };
  }

  async findAll(): Promise<Booking[]> {
    try {
      const bookings = await this.bookingsRepository.find({
        relations: ['customer', 'partner'],
        order: {
          createdAt: 'DESC',
        },
      });
    
      return bookings;
    } catch (error) {
      try {
        const bookings = await this.bookingsRepository.find({
          order: {
            createdAt: 'DESC',
          },
        });
        return bookings;
      } catch (fallbackError) {
        return [];
      }
    }
  }

  async findByCustomer(customerId: number): Promise<Booking[]> {
    
    try {
      const bookings = await this.bookingsRepository.find({
        where: { customerId },
        relations: ['partner'],
        order: { createdAt: 'DESC' },
      });
      
      return bookings;
    } catch (error) {
      return [];
    }
  }

  async findByPartner(partnerId: number): Promise<Booking[]> {
    
    try {
      const bookings = await this.bookingsRepository.find({
        where: { partnerId },
        relations: ['customer'],
        order: { createdAt: 'DESC' },
      });
      
      return bookings;
    } catch (error) {
      return [];
    }
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Booking[]> {
    return [];
  }

  async findByStatus(status: BookingStatus): Promise<Booking[]> {
    return [];
  }

  async findOne(id: number): Promise<Booking> {
    throw new NotFoundException('Booking lookup temporarily disabled');
  }

  async update(
    id: number,
    updateBookingDto: UpdateBookingDto,
  ): Promise<Booking> {
    throw new BadRequestException('Booking update temporarily disabled');
  }

  async updateStatus(id: number, status: BookingStatus): Promise<Booking> {
    const booking = await this.bookingsRepository.findOne({
      where: { id },
      relations: ['customer', 'partner'],
    });

    if (!booking) {
      throw new NotFoundException(`Booking with ID ${id} not found`);
    }

    booking.status = status;
    return await this.bookingsRepository.save(booking);
  }

  async remove(id: number): Promise<void> {
    throw new BadRequestException('Booking removal temporarily disabled');
  }
}