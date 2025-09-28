import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
  Query,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { AvailabilityService } from './availability.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { UpdateAvailabilityDto } from './dto/update-availability.dto';
import { ProfileGuard, validateOwnership } from '../auth/profile.guard';
import { Profile } from '../auth/profile.decorator';
import { Public } from '../auth/public.decorator';
import { JwtPayload } from '../auth/auth.service';

@Controller('availability')
@UseGuards(ProfileGuard)
export class AvailabilityController {
  constructor(private readonly availabilityService: AvailabilityService) {}

  @Post()
  @Public()
  async create(
    @Body() createAvailabilityDto: CreateAvailabilityDto,
  ) {
    return this.availabilityService.create(createAvailabilityDto);
  }

  @Get()
  @Public()
  findAll(
    @Query('partnerId') partnerId?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    if (partnerId) {
      return this.availabilityService.findByPartner(partnerId);
    }

    if (startDate && endDate) {
      return this.availabilityService.findByDateRange(startDate, endDate);
    }

    return this.availabilityService.findAll();
  }

  @Get('partner/:partnerId/date/:date')
  @Public()
  findAvailableSlots(
    @Param('partnerId', ParseIntPipe) partnerId: number,
    @Param('date') date: string,
  ) {
    return this.availabilityService.findAvailableSlots(partnerId, date);
  }

  @Get(':id')
  @Public()
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.availabilityService.findOne(id);
  }

  @Patch(':id')
  @Profile('partner')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateAvailabilityDto: UpdateAvailabilityDto,
    @Request() req: { user: JwtPayload },
  ) {
    const availability = await this.availabilityService.findOne(id);
    if (!validateOwnership(req.user, availability, 'partnerId')) {
      throw new ForbiddenException('You can only update your own availability');
    }
    return this.availabilityService.update(id, updateAvailabilityDto);
  }

  @Patch(':id/unavailable')
  @Profile('partner')
  async markAsUnavailable(
    @Param('id', ParseIntPipe) id: number,
    @Request() req: { user: JwtPayload },
  ) {
    const availability = await this.availabilityService.findOne(id);
    if (!validateOwnership(req.user, availability, 'partnerId')) {
      throw new ForbiddenException('You can only modify your own availability');
    }
    return this.availabilityService.markAsUnavailable(id);
  }

  @Delete(':id')
  @Public()
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ) {

    return this.availabilityService.remove(id);
  }
}
