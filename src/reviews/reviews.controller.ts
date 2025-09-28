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
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ProfileGuard, validateOwnership } from '../auth/profile.guard';
import { Profile } from '../auth/profile.decorator';
import { Public } from '../auth/public.decorator';
import { JwtPayload } from '../auth/auth.service';
import { ApiResponse, ResponseCodes, createSuccessResponse, createErrorResponse } from '../helpers/ResponseCodes';

@Controller('reviews')
@UseGuards(ProfileGuard)
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @Profile('customer')
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ApiResponse> {
    try {
      const booking = await this.reviewsService.getBookingForReview(createReviewDto.bookingId);
      
      if (!booking) {
        return createErrorResponse(ResponseCodes.NOT_FOUND, 'Booking not found');
      }
      
      if (!validateOwnership(req.user, booking, 'customerId')) {
        throw new ForbiddenException('Access denied: You can only review bookings that you made');
      }
      
      createReviewDto.customerId = req.user.userId;
      
      const review = await this.reviewsService.create(createReviewDto);
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        review,
        'Review created successfully'
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  @Get()
  async findAll(
    @Query('partnerId') partnerId?: number,
    @Query('customerId') customerId?: number,
  ): Promise<ApiResponse> {
    try {
      let reviews;
      
      if (partnerId) {
        reviews = await this.reviewsService.findByPartner(partnerId);
      } else if (customerId) {
        reviews = await this.reviewsService.findByCustomer(customerId);
      } else {
        reviews = await this.reviewsService.findAll();
      }

      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        reviews,
        'Reviews retrieved successfully'
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  @Get('partner/:partnerId/average')
  async getPartnerAverageRating(@Param('partnerId', ParseIntPipe) partnerId: number): Promise<ApiResponse> {
    try {
      const rating = await this.reviewsService.getPartnerAverageRating(partnerId);
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        rating,
        'Partner average rating retrieved successfully'
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse> {
    try {
      const review = await this.reviewsService.findOne(id);
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        review,
        'Review retrieved successfully'
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateReviewDto: UpdateReviewDto,
  ): Promise<ApiResponse> {
    try {
      const review = await this.reviewsService.update(id, updateReviewDto);
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        review,
        'Review updated successfully'
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse> {
    try {
      await this.reviewsService.remove(id);
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        null,
        'Review deleted successfully'
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }
}