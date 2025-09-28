import {
  Controller,
  Get,
  UseGuards,
} from '@nestjs/common';
import { StatsService } from './stats.service';
import { ProfileGuard } from '../auth/profile.guard';
import { Public } from '../auth/public.decorator';

@Controller('stats')
@UseGuards(ProfileGuard)
@Public()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  async getDashboardStats() {
    return this.statsService.getDashboardStats();
  }

  @Get('counts')
  async getCounts() {
    return this.statsService.getCounts();
  }
}