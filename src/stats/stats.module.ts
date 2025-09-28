import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';
import { Customer } from '../entities/customer.entity';
import { Partner } from '../entities/partner.entity';
import { Booking } from '../entities/booking.entity';
import { Availability } from '../entities/availability.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Partner, Booking, Availability]),
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}