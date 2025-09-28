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
} from '@nestjs/common';
import { PartnersService } from './partners.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { ProfileGuard } from '../auth/profile.guard';
import { Public } from '../auth/public.decorator';
import { ServiceType } from '../entities/partner.entity';

@Controller('partners')
@UseGuards(ProfileGuard)
@Public()
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  @Post()
  create(@Body() createPartnerDto: CreatePartnerDto) {
    return this.partnersService.create(createPartnerDto);
  }

  @Get('services')
  async getAvailableServices() {
    try {
      return await this.partnersService.getAvailableServices();
    } catch (error) {
      throw error;
    }
  }

  @Get()
  findAll(@Query('serviceType') serviceType?: ServiceType) {
    if (serviceType) {
      return this.partnersService.findByServiceType(serviceType);
    }
    return this.partnersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePartnerDto: UpdatePartnerDto,
  ) {
    return this.partnersService.update(id, updatePartnerDto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.partnersService.remove(id);
  }
}
