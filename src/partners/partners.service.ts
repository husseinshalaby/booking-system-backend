import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Partner, ServiceType } from '../entities/partner.entity';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class PartnersService {
  constructor(
    @InjectRepository(Partner)
    private partnersRepository: Repository<Partner>,
  ) {}

  async create(createPartnerDto: CreatePartnerDto): Promise<Partner> {
    const existingPartner = await this.partnersRepository.findOne({
      where: { email: createPartnerDto.email },
    });

    if (existingPartner) {
      throw new ConflictException('Email already exists');
    }

    const hashedPassword = await bcrypt.hash(createPartnerDto.password, 10);

    const partner = this.partnersRepository.create({
      ...createPartnerDto,
      password: hashedPassword,
    });

    return this.partnersRepository.save(partner);
  }

  async findAll(): Promise<Partner[]> {
    try {
      return await this.partnersRepository.find({
        where: { isActive: true },
        relations: ['availabilities', 'bookings'],
        order: { createdAt: 'DESC' },
      });
    } catch (error) {
      try {
        return await this.partnersRepository.find({
          where: { isActive: true },
          order: { createdAt: 'DESC' },
        });
      } catch (fallbackError) {
        return [];
      }
    }
  }

  async findByServiceType(serviceType: ServiceType): Promise<Partner[]> {
    return this.partnersRepository.find({
      where: { serviceType, isActive: true },
      relations: ['availabilities', 'bookings'],
    });
  }

  async findOne(id: number): Promise<Partner> {
    const partner = await this.partnersRepository.findOne({
      where: { id, isActive: true },
      relations: ['availabilities', 'bookings'],
    });

    if (!partner) {
      throw new NotFoundException(`Partner with ID ${id} not found`);
    }

    return partner;
  }

  async findByEmail(email: string): Promise<Partner | null> {
    return this.partnersRepository.findOne({
      where: { email, isActive: true },
    });
  }

  async update(
    id: number,
    updatePartnerDto: UpdatePartnerDto,
  ): Promise<Partner> {
    const partner = await this.findOne(id);

    if (updatePartnerDto.password) {
      updatePartnerDto.password = await bcrypt.hash(
        updatePartnerDto.password,
        10,
      );
    }

    if (updatePartnerDto.email && updatePartnerDto.email !== partner.email) {
      const existingPartner = await this.partnersRepository.findOne({
        where: { email: updatePartnerDto.email },
      });

      if (existingPartner) {
        throw new ConflictException('Email already exists');
      }
    }

    Object.assign(partner, updatePartnerDto);
    return this.partnersRepository.save(partner);
  }

  async remove(id: number): Promise<void> {
    const partner = await this.findOne(id);
    partner.isActive = false;
    await this.partnersRepository.save(partner);
  }

  async getAvailableServices(): Promise<
    {
      id: string;
      name: string;
      description: string;
      icon: string;
      priceRange: string;
      minRate: number;
      maxRate: number;
      count: number;
    }[]
  > {
    try {
      const partners = await this.partnersRepository
        .createQueryBuilder('partner')
        .select(['partner.serviceType', 'partner.hourlyRate'])
        .where('partner.isActive = :isActive', { isActive: true })
        .andWhere('partner.hourlyRate IS NOT NULL')
        .getMany();

      const serviceMap = new Map<
        string,
        {
          rates: number[];
          count: number;
        }
      >();

      partners.forEach((partner) => {
        const serviceType = partner.serviceType;
        const rate = Number(partner.hourlyRate);

        if (rate > 0) {
          if (!serviceMap.has(serviceType)) {
            serviceMap.set(serviceType, { rates: [], count: 0 });
          }
          serviceMap.get(serviceType)!.rates.push(rate);
          serviceMap.get(serviceType)!.count++;
        }
      });

      const serviceMetadata: Record<
        string,
        { name: string; description: string; icon: string }
      > = {
        painter: {
          name: 'Painter',
          description: 'Professional painting services for your home or office',
          icon: '🎨',
        },
        electrician: {
          name: 'Electrician',
          description: 'Electrical repairs and installations',
          icon: '⚡',
        },
        plumber: {
          name: 'Plumber',
          description: 'Plumbing repairs and maintenance',
          icon: '🔧',
        },
        cleaner: {
          name: 'House Cleaner',
          description: 'Professional house cleaning services',
          icon: '🧽',
        },
        handyman: {
          name: 'Handyman',
          description: 'General repair and maintenance services',
          icon: '🔨',
        },
        hvac: {
          name: 'HVAC Technician',
          description: 'Heating, ventilation, and air conditioning services',
          icon: '❄️',
        },
        landscaper: {
          name: 'Landscaper',
          description: 'Garden and outdoor space maintenance',
          icon: '🌿',
        },
        roofer: {
          name: 'Roofer',
          description: 'Roof repair and maintenance services',
          icon: '🏠',
        },
      };

      const services: {
        id: string;
        name: string;
        description: string;
        icon: string;
        priceRange: string;
        minRate: number;
        maxRate: number;
        count: number;
      }[] = [];
      for (const [serviceType, data] of serviceMap.entries()) {
        const minRate = Math.min(...data.rates);
        const maxRate = Math.max(...data.rates);
        const metadata = serviceMetadata[serviceType] || {
          name: serviceType.charAt(0).toUpperCase() + serviceType.slice(1),
          description: `Professional ${serviceType} services`,
          icon: '🔧',
        };

        services.push({
          id: serviceType,
          name: metadata.name,
          description: metadata.description,
          icon: metadata.icon,
          priceRange: `$${minRate}-${maxRate}/hour`,
          minRate,
          maxRate,
          count: data.count,
        });
      }

      return services.sort((a, b) => a.name.localeCompare(b.name));
    } catch (error) {
      throw new Error('Failed to fetch available services');
    }
  }
}
