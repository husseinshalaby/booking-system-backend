import {
  IsNotEmpty,
  IsNumber,
  IsDateString,
  IsString,
  IsOptional,
  IsEnum,
} from 'class-validator';
import { BookingStatus } from '../../entities/booking.entity';

export class CreateBookingDto {
  @IsOptional()
  @IsString()
  uuid?: string;

  @IsNotEmpty()
  @IsNumber()
  customerId: number;

  @IsOptional()
  @IsNumber()
  partnerId?: number;

  @IsNotEmpty()
  @IsString()
  serviceType: string;

  @IsNotEmpty()
  @IsDateString()
  startTime: string; // ISO datetime string (e.g., "2024-01-15T10:00:00.000Z")

  @IsNotEmpty()
  @IsDateString()
  endTime: string; // ISO datetime string (e.g., "2024-01-15T11:00:00.000Z")

  @IsOptional()
  @IsEnum(BookingStatus)
  status?: BookingStatus;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  totalAmount?: number;

  @IsOptional()
  @IsString()
  idempotencyKey?: string;
}
