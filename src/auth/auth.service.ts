import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import { Customer } from '../entities/customer.entity';
import { Partner } from '../entities/partner.entity';
import { LoginDto } from './dto/login.dto';
import * as bcrypt from 'bcryptjs';

export interface JwtPayload {
  userId: number;
  userType: 'customer' | 'partner';
  email: string;
  countryCode?: string;
  country?: string;
}

export interface RefreshPayload {
  userId: number;
  userType: 'customer' | 'partner';
  tokenType: 'refresh';
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
  expires_in: number; 
}

@Injectable()
export class AuthService {
  private logger: Logger = new Logger(AuthService.name);

  constructor(
    private readonly jwtService: JwtService,
    @InjectRepository(Customer)
    private readonly customersRepository: Repository<Customer>,
    @InjectRepository(Partner)
    private readonly partnersRepository: Repository<Partner>,
  ) {}

  async validateCustomerCredentials(
    loginDto: LoginDto,
  ): Promise<Customer | null> {
    try {
      const customer = await this.customersRepository.findOne({
        where: { email: loginDto.email, isActive: true },
      });

      if (!customer) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        customer.password,
      );
      if (!isPasswordValid) {
        return null;
      }

      return customer;
    } catch (error) {
      this.logger.error(
        `Error validating customer credentials: ${error.message}`,
      );
      return null;
    }
  }

  async validatePartnerCredentials(
    loginDto: LoginDto,
  ): Promise<Partner | null> {
    try {
      const partner = await this.partnersRepository.findOne({
        where: { email: loginDto.email, isActive: true },
      });

      if (!partner) {
        return null;
      }

      const isPasswordValid = await bcrypt.compare(
        loginDto.password,
        partner.password,
      );
      if (!isPasswordValid) {
        return null;
      }

      return partner;
    } catch (error) {
      this.logger.error(
        `Error validating partner credentials: ${error.message}`,
      );
      return null;
    }
  }

  async login(loginDto: LoginDto): Promise<AuthTokens & {
    user: Omit<Customer | Partner, 'password'>;
    userType: 'customer' | 'partner';
  }> {
    const customer = await this.validateCustomerCredentials(loginDto);
    if (customer) {
      const accessPayload: JwtPayload = {
        userId: customer.id,
        userType: 'customer',
        email: customer.email,
        countryCode: customer.countryCode,
        country: customer.country,
      };

      const refreshPayload: RefreshPayload = {
        userId: customer.id,
        userType: 'customer',
        tokenType: 'refresh',
      };

      const { password, ...userWithoutPassword } = customer;
      
      return {
        access_token: this.jwtService.sign(accessPayload, { expiresIn: '2h' }),
        refresh_token: this.jwtService.sign(refreshPayload, { expiresIn: '7d' }),
        expires_in: 7200, // 2 hours in seconds
        user: userWithoutPassword,
        userType: 'customer',
      };
    }

    const partner = await this.validatePartnerCredentials(loginDto);
    if (partner) {
      const accessPayload: JwtPayload = {
        userId: partner.id,
        userType: 'partner',
        email: partner.email,
        countryCode: partner.countryCode,
        country: partner.country,
      };

      const refreshPayload: RefreshPayload = {
        userId: partner.id,
        userType: 'partner',
        tokenType: 'refresh',
      };

      const { password, ...userWithoutPassword } = partner;
      
      return {
        access_token: this.jwtService.sign(accessPayload, { expiresIn: '2h' }),
        refresh_token: this.jwtService.sign(refreshPayload, { expiresIn: '7d' }),
        expires_in: 7200, // 2 hours in seconds
        user: userWithoutPassword,
        userType: 'partner',
      };
    }

    throw new UnauthorizedException('Invalid credentials');
  }

  async validateToken(token: string): Promise<JwtPayload | null> {
    try {
      const payload = this.jwtService.verify(token);
      return payload as JwtPayload;
    } catch (error) {
      this.logger.warn(`Invalid JWT token: ${error.message}`);
      return null;
    }
  }

  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken) as RefreshPayload;
      
      if (payload.tokenType !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const user = await this.getUserById(payload.userId, payload.userType);
      if (!user || !user.isActive) {
        throw new UnauthorizedException('User not found or inactive');
      }

      const newAccessPayload: JwtPayload = {
        userId: user.id,
        userType: payload.userType,
        email: user.email,
        countryCode: user.countryCode,
        country: user.country,
      };

      return {
        access_token: this.jwtService.sign(newAccessPayload, { expiresIn: '2h' }),
        refresh_token: refreshToken,
        expires_in: 7200,
      };
    } catch (error) {
      this.logger.warn(`Invalid refresh token: ${error.message}`);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async getUserById(userId: number, userType: 'customer' | 'partner'): Promise<Customer | Partner | null> {
    try {
      if (userType === 'customer') {
        return await this.customersRepository.findOne({
          where: { id: userId, isActive: true },
        });
      } else {
        return await this.partnersRepository.findOne({
          where: { id: userId, isActive: true },
        });
      }
    } catch (error) {
      this.logger.error(`Error fetching user by ID: ${error.message}`);
      return null;
    }
  }

  async getUserFromPayload(payload: JwtPayload): Promise<Customer | Partner | null> {
    return this.getUserById(payload.userId, payload.userType);
  }
}