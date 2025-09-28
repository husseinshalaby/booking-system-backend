import {
  Controller,
  Get,
  Post,
  Body,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ProfileGuard } from './profile.guard';
import { AuthService } from './auth.service';
import { CustomersService } from '../customers/customers.service';
import { PartnersService } from '../partners/partners.service';
import { Public } from './public.decorator';
import { LoginDto } from './dto/login.dto';
import { RegisterCustomerDto, RegisterPartnerDto } from './dto/register.dto';
import { ResponseCodes, createSuccessResponse, createErrorResponse } from '../helpers/ResponseCodes';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly customersService: CustomersService,
    private readonly partnersService: PartnersService,
  ) {}

  @Public()
  @Get('health')
  health() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Public()
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    try {
      const result = await this.authService.login(loginDto);
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        {
          user: result.user,
          userType: result.userType,
        },
        'Login successful'
      );
    } catch (error) {
      return createErrorResponse(ResponseCodes.BAD_REQUEST, error.message || 'Login failed');
    }
  }

  @Public()
  @Post('register/customer')
  async registerCustomer(@Body() registerDto: RegisterCustomerDto) {
    try {
      const customer = await this.customersService.create(registerDto);
      const { password, ...customerWithoutPassword } = customer;
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        {
          user: customerWithoutPassword,
          userType: 'customer',
        },
        'Customer registration successful'
      );
    } catch (error) {
      
      if (error.message?.includes('Unknown column') || error.message?.includes('field list')) {
        return createErrorResponse(ResponseCodes.DATABASE_ERROR, 'Database schema mismatch. Please contact support.');
      }
      
      if (error.message?.includes('Duplicate entry') || error.message?.includes('already exists')) {
        return createErrorResponse(ResponseCodes.BAD_REQUEST, 'An account with this email already exists.');
      }
      
      if (error.message?.includes('validation') || error.message?.includes('Invalid')) {
        return createErrorResponse(ResponseCodes.BAD_REQUEST, error.message);
      }
      
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, 'Registration failed. Please try again later.');
    }
  }

  @Public()
  @Post('register/partner')
  async registerPartner(@Body() registerDto: RegisterPartnerDto) {
    try {
      const partner = await this.partnersService.create(registerDto);
      const { password, ...partnerWithoutPassword } = partner;
      return createSuccessResponse(
        ResponseCodes.SUCCESS,
        {
          user: partnerWithoutPassword,
          userType: 'partner',
        },
        'Partner registration successful'
      );
    } catch (error) {
      
      if (error.message?.includes('Unknown column') || error.message?.includes('field list')) {
        return createErrorResponse(ResponseCodes.DATABASE_ERROR, 'Database schema mismatch. Please contact support.');
      }
      
      if (error.message?.includes('Duplicate entry') || error.message?.includes('already exists')) {
        return createErrorResponse(ResponseCodes.BAD_REQUEST, 'An account with this email already exists.');
      }
      
      if (error.message?.includes('validation') || error.message?.includes('Invalid')) {
        return createErrorResponse(ResponseCodes.BAD_REQUEST, error.message);
      }
      
      return createErrorResponse(ResponseCodes.INTERNAL_SERVER_ERROR, 'Registration failed. Please try again later.');
    }
  }

  @UseGuards(ProfileGuard)
  @Get('me')
  getMe(@Request() req) {
    return {
      user: req.user,
      authenticated: true,
    };
  }


}
