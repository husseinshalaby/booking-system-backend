import {
  IsNotEmpty,
  IsDateString,
  IsNumber,
  IsOptional,
} from 'class-validator';

export class CreateAvailabilityDto {
  @IsOptional()
  @IsNumber()
  partnerId?: number;

  @IsNotEmpty()
  @IsDateString()
  startTime: string; // ISO datetime string (e.g., "2024-01-15T10:00:00.000Z")

  @IsNotEmpty()
  @IsDateString()
  endTime: string; // ISO datetime string (e.g., "2024-01-15T11:00:00.000Z")
}
