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
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { BookingsService } from './bookings.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { ProfileGuard, validateOwnership } from '../auth/profile.guard';
import { Profile } from '../auth/profile.decorator';
import { Public } from '../auth/public.decorator';
import { BookingStatus } from '../entities/booking.entity';
import { JwtPayload } from '../auth/auth.service';
import {
  ApiResponse,
  ResponseCodes,
  createSuccessResponse,
  createErrorResponse,
} from '../helpers/ResponseCodes';

export interface BookingRequestDto {
  startTime: string;
  endTime: string;
  country: string;
  city?: string;
  serviceType: string; // electrician, painter, plumber, etc.
  idempotencyKey?: string;
}

export interface BookingConfirmDto {
  bookingRequestId: string;
  partnerId: number;
}

export interface BookingResponseData {
  uuid: string;
  status: BookingStatus;
  bookingObject?: {
    id: number;
    uuid: string;
    customerId: number;
    partnerId?: number;
    serviceType: string;
    bookingDate: string;
    startTime: string;
    endTime: string;
    status: BookingStatus;
    description?: string;
    totalAmount?: number;
    createdAt: string;
    updatedAt: string;
    customer?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
    };
    partner?: {
      id: number;
      firstName: string;
      lastName: string;
      email: string;
      serviceType: string;
    };
  };
  nearestAvailabilities?: {
    startTime: string;
    endTime: string;
    partnerId: number;
    partnerName: string;
  }[];
}

export interface BookingConfirmResponseData {
  bookingId: string;
  painter: {
    id: string;
    name: string;
  };
  startTime: string;
  endTime: string;
  status: string;
}

@Controller('bookings')
@UseGuards(ProfileGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Profile('customer')
  async create(
    @Body() createBookingDto: CreateBookingDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ApiResponse<any>> {
    try {
      createBookingDto.customerId = req.user.userId;
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        null,
        'Booking creation temporarily disabled'
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(
        ResponseCodes.INTERNAL_SERVER_ERROR,
        'Something went wrong! Please try again.'
      );
    }
  }

  @Post('booking-request')
  @Profile('customer')
  async createBookingRequest(
    @Body() bookingRequest: BookingRequestDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ApiResponse<BookingResponseData>> {
    try {

      const validation = this.validateBookingRequest(bookingRequest);
      if (!validation.isValid) {
        return createErrorResponse(validation.code!, validation.message);
      }

      const result = await this.bookingsService.createBookingRequest(
        bookingRequest,
        req.user.userId,
      );

      if (result.status === BookingStatus.CANCELLED_FAILURE) {
        return createSuccessResponse(
          ResponseCodes.BOOKING_CANCELLED_FAILURE,
          result,
          result.nearestAvailabilities?.length > 0 
            ? `No availability for the requested time. Here are the nearest available slots.`
            : `No providers are currently available for this time slot or the next 2 days. Please try selecting a different date.`,
          result.uuid,
        );
      }

      return createSuccessResponse(
        ResponseCodes.BOOKING_PENDING,
        result,
        `Found available ${bookingRequest.serviceType} providers. Please confirm your booking.`,
        result.uuid,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(
        ResponseCodes.INTERNAL_SERVER_ERROR,
        errorMessage,
      );
    }
  }

  private validateBookingRequest(request: BookingRequestDto): {
    isValid: boolean;
    code?: ResponseCodes;
    message?: string;
  } {
    if (
      !request.startTime ||
      !request.endTime ||
      !request.country ||
      !request.serviceType
    ) {
      return {
        isValid: false,
        code: ResponseCodes.MISSING_REQUIRED_FIELDS,
        message:
          'Missing required fields: startTime, endTime, country, and serviceType are required',
      };
    }

    try {
      const startDate = new Date(request.startTime);
      const endDate = new Date(request.endTime);
      const now = new Date();

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        return {
          isValid: false,
          code: ResponseCodes.INVALID_DATE,
          message: 'Invalid date format for startTime or endTime',
        };
      }

      if (startDate < now) {
        return {
          isValid: false,
          code: ResponseCodes.DATE_IN_PAST,
          message: 'Start time cannot be in the past',
        };
      }

      if (endDate <= startDate) {
        return {
          isValid: false,
          code: ResponseCodes.INVALID_TIME_RANGE,
          message: 'End time must be after start time',
        };
      }

      const validServiceTypes = [
        'painter',
        'electrician',
        'plumber',
        'cleaner',
        'handyman',
        'hvac',
        'landscaper',
        'roofer',
      ];
      if (!validServiceTypes.includes(request.serviceType.toLowerCase())) {
        return {
          isValid: false,
          code: ResponseCodes.INVALID_SERVICE_TYPE,
          message: `Invalid service type. Valid types are: ${validServiceTypes.join(
            ', ',
          )}`,
        };
      }

      if (request.country.length !== 2) {
        return {
          isValid: false,
          code: ResponseCodes.INVALID_COUNTRY,
          message:
            'Country must be a 2-letter country code (e.g., "at", "us", "ca")',
        };
      }
    } catch (error) {
      return {
        isValid: false,
        code: ResponseCodes.INVALID_DATE,
        message: 'Invalid date format',
      };
    }

    return { isValid: true };
  }

  @Post('booking-request/confirm')
  @Profile('customer')
  async confirmBooking(
    @Body() confirmRequest: BookingConfirmDto,
    @Request() req: { user: JwtPayload },
  ): Promise<ApiResponse<BookingConfirmResponseData>> {
    try {
      
      const result = await this.bookingsService.confirmBooking(confirmRequest, req.user.userId);
      
      return createSuccessResponse(
        ResponseCodes.BOOKING_CONFIRMED,
        result,
        `Booking confirmed successfully`,
      );
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      
      if (error instanceof NotFoundException) {
        return createErrorResponse(
          ResponseCodes.NOT_FOUND,
          errorMessage,
        );
      }
      
      if (error instanceof ConflictException) {
        return createErrorResponse(
          ResponseCodes.TIME_SLOT_UNAVAILABLE,
          errorMessage,
        );
      }
      
      return createErrorResponse(
        ResponseCodes.INTERNAL_SERVER_ERROR,
        errorMessage,
      );
    }
  }

  @Get()
  @Public()
  async findAll(
    @Query('customerId') customerId?: number,
    @Query('partnerId') partnerId?: number,
    @Query('status') status?: BookingStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<ApiResponse<any[]>> {
    try {
      
      if (customerId) {
        const customerBookings = await this.bookingsService.findByCustomer(customerId);
        return createSuccessResponse(
          ResponseCodes.SUCCESS, 
          customerBookings, 
          `Found ${customerBookings.length} bookings for customer ID ${customerId}`
        );
      }

      if (partnerId) {
        const partnerBookings = await this.bookingsService.findByPartner(partnerId);
        return createSuccessResponse(
          ResponseCodes.SUCCESS, 
          partnerBookings, 
          `Found ${partnerBookings.length} bookings for partner ID ${partnerId}`
        );
      }

      if (status) {
        return createSuccessResponse(
          ResponseCodes.SUCCESS, 
          [], 
          `Bookings with status '${status}' retrieved successfully`
        );
      }

      if (startDate && endDate) {
        return createSuccessResponse(
          ResponseCodes.SUCCESS, 
          [], 
          `Bookings from ${startDate} to ${endDate} retrieved successfully`
        );
      }

      const allBookings = await this.bookingsService.findAll();
      return createSuccessResponse(
        ResponseCodes.SUCCESS, 
        allBookings, 
        `Found ${allBookings.length} bookings`
      );
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(
        ResponseCodes.INTERNAL_SERVER_ERROR,
        'Something went wrong! Please try again.'
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<any>> {
    try {
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        null,
        `Booking with ID ${id} not found`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(
        ResponseCodes.INTERNAL_SERVER_ERROR,
        'Something went wrong! Please try again.'
      );
    }
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateBookingDto: UpdateBookingDto,
  ): Promise<ApiResponse<any>> {
    try {
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        null,
        `Booking update temporarily disabled`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(
        ResponseCodes.INTERNAL_SERVER_ERROR,
        'Something went wrong! Please try again.'
      );
    }
  }

  @Patch(':id/status/:status')
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Param('status') status: BookingStatus,
  ): Promise<ApiResponse<any>> {
    try {
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        null,
        `Booking status update temporarily disabled`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(
        ResponseCodes.INTERNAL_SERVER_ERROR,
        'Something went wrong! Please try again.'
      );
    }
  }

  @Patch(':id/complete')
  async markAsCompleted(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse> {
    try {
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        null,
        `Booking completion temporarily disabled`
      );
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, errorMessage);
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number): Promise<ApiResponse<any>> {
    try {
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        null,
        `Booking deletion temporarily disabled`
      );
    } catch (error: unknown) {
      return createErrorResponse(
        ResponseCodes.INTERNAL_SERVER_ERROR,
        'Something went wrong! Please try again.'
      );
    }
  }
}
