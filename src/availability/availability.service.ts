import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Availability, AvailabilityStatus } from '../entities/availability.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';

@Injectable()
export class AvailabilityService {
  constructor(
    @InjectRepository(Availability)
    private availabilityRepository: Repository<Availability>,
  ) {}

  async create(
    createAvailabilityDto: CreateAvailabilityDto,
  ): Promise<Availability> {
    const existingAvailability = await this.availabilityRepository.findOne({
      where: {
        partnerId: createAvailabilityDto.partnerId,
        startTime: new Date(createAvailabilityDto.startTime),
        endTime: new Date(createAvailabilityDto.endTime),
      },
    });

    if (existingAvailability) {
      throw new ConflictException(
        'Availability slot already exists for this time period',
      );
    }

    const startTime = new Date(createAvailabilityDto.startTime);
    const endTime = new Date(createAvailabilityDto.endTime);
    

    const availability = this.availabilityRepository.create({
      partnerId: createAvailabilityDto.partnerId,
      startTime,
      endTime,
    });

    const saved = await this.availabilityRepository.save(availability);
    
    
    return saved;
  }

  async findAll(): Promise<Availability[]> {
    const availabilities = await this.availabilityRepository.find({
      relations: ['partner'],
    });
    
    
    return availabilities;
  }

  async findByPartner(partnerId: number): Promise<Availability[]> {
    return this.availabilityRepository.find({
      where: { partnerId },
      relations: ['partner'],
      order: { startTime: 'ASC' },
    });
  }

  async findByDateRange(
    startDate: string,
    endDate: string,
  ): Promise<Availability[]> {
    return this.availabilityRepository.find({
      where: {
        startTime: Between(new Date(startDate), new Date(endDate)),
      },
      relations: ['partner'],
      order: { startTime: 'ASC' },
    });
  }

  async findAvailableSlots(
    partnerId: number,
    date: string,
  ): Promise<Availability[]> {
    const startOfDay = new Date(date + 'T00:00:00.000Z');
    const endOfDay = new Date(date + 'T23:59:59.999Z');
    
    return this.availabilityRepository.find({
      where: {
        partnerId,
        startTime: Between(startOfDay, endOfDay),
        status: AvailabilityStatus.PENDING,
      },
      relations: ['partner'],
      order: { startTime: 'ASC' },
    });
  }

  async findOne(id: number): Promise<Availability> {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['partner'],
    });

    if (!availability) {
      throw new NotFoundException(`Availability with ID ${id} not found`);
    }

    return availability;
  }

  async update(
    id: number,
    updateAvailabilityDto: UpdateAvailabilityDto,
  ): Promise<Availability> {
    const availability = await this.findOne(id);

    if (updateAvailabilityDto.startTime) {
      updateAvailabilityDto.startTime = new Date(updateAvailabilityDto.startTime).toISOString();
    }
    if (updateAvailabilityDto.endTime) {
      updateAvailabilityDto.endTime = new Date(updateAvailabilityDto.endTime).toISOString();
    }

    Object.assign(availability, updateAvailabilityDto);
    return this.availabilityRepository.save(availability);
  }

  async remove(id: number): Promise<void> {
    const availability = await this.findOne(id);
    await this.availabilityRepository.remove(availability);
  }

  async markAsUnavailable(id: number): Promise<Availability> {
    const availability = await this.findOne(id);
    availability.status = AvailabilityStatus.BOOKED;
    return this.availabilityRepository.save(availability);
  }
}
