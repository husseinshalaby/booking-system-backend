import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ProfileGuard } from './profile.guard';
import { Customer } from '../entities/customer.entity';
import { Partner } from '../entities/partner.entity';
import { CustomersModule } from '../customers/customers.module';
import { PartnersModule } from '../partners/partners.module';

@Global()
@Module({
  imports: [
    TypeOrmModule.forFeature([Customer, Partner]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const jwtSecret = configService.get<string>('JWT_SECRET');
        const jwtExpiresIn = configService.get<string>('JWT_EXPIRES_IN');

        if (!jwtSecret) {
          throw new Error('JWT_SECRET environment variable is required but not set');
        }

        if (jwtSecret.length < 32) {
          throw new Error('JWT_SECRET must be at least 32 characters long for security');
        }

        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: jwtExpiresIn || '2h',
          },
        };
      },
      inject: [ConfigService],
    }),
    CustomersModule,
    PartnersModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, ProfileGuard],
  exports: [AuthService, ProfileGuard],
})
export class AuthModule {}
