import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Customer } from '../entities/customer.entity';
import { Partner } from '../entities/partner.entity';
import { Availability } from '../entities/availability.entity';
import { Booking } from '../entities/booking.entity';
import { Review } from '../entities/review.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const databaseUrl = configService.get<string>('DATABASE_URL') || process.env.DATABASE_URL;
        
        
        if (databaseUrl) {
          return {
            type: 'mysql',
            url: databaseUrl,
            entities: [Customer, Partner, Availability, Booking, Review],
            synchronize: false,
            autoLoadEntities: true,
            retryAttempts: 3,
            retryDelay: 3000,
            connectTimeout: 60000,
            timeout: 60000,
          };
        }

        const dbHost = configService.get<string>('DB_HOST') || process.env.DATABASE_HOST || 'localhost';
        const dbPort = parseInt(configService.get<string>('DB_PORT') || process.env.DATABASE_PORT || '3306');
        const dbUsername = configService.get<string>('DB_USERNAME') || process.env.DATABASE_USERNAME || 'root';
        const dbPassword = configService.get<string>('DB_PASSWORD') || process.env.DATABASE_PASSWORD || '';
        const dbName = configService.get<string>('DB_NAME') || process.env.DATABASE_NAME || 'railway';


        return {
          type: 'mysql',
          host: dbHost,
          port: dbPort,
          username: dbUsername,
          password: dbPassword,
          database: dbName,
          entities: [Customer, Partner, Availability, Booking, Review],
          synchronize: false, 
          autoLoadEntities: true,
          retryAttempts: 3,
          retryDelay: 3000,
          connectTimeout: 60000,
          timeout: 60000,
        };
      },
      inject: [ConfigService],
    }),
  ],
})
export class DatabaseModule {}
