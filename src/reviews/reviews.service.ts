import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from '../entities/review.entity';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewsService {
  constructor(
    @InjectRepository(Review)
    private reviewsRepository: Repository<Review>,
    @InjectRepository(Booking)
    private bookingsRepository: Repository<Booking>,
  ) {}

  async create(createReviewDto: CreateReviewDto): Promise<Review> {
    const booking = await this.bookingsRepository.findOne({
      where: { 
        id: createReviewDto.bookingId,
        customerId: createReviewDto.customerId,
        partnerId: createReviewDto.partnerId,
      },
      relations: ['customer', 'partner'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found or does not belong to this customer/partner combination');
    }

    if (booking.status !== BookingStatus.COMPLETED) {
      throw new BadRequestException('Can only review completed bookings');
    }

    const existingReview = await this.reviewsRepository.findOne({
      where: { bookingId: createReviewDto.bookingId },
    });

    if (existingReview) {
      throw new ConflictException('Review already exists for this booking');
    }

    const review = this.reviewsRepository.create(createReviewDto);
    return this.reviewsRepository.save(review);
  }

  async findAll(): Promise<Review[]> {
    return this.reviewsRepository.find({
      relations: ['customer', 'partner', 'booking'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByPartner(partnerId: number): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { partnerId },
      relations: ['customer', 'partner', 'booking'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByCustomer(customerId: number): Promise<Review[]> {
    return this.reviewsRepository.find({
      where: { customerId },
      relations: ['customer', 'partner', 'booking'],
      order: { createdAt: 'DESC' },
    });
  }

  async getPartnerAverageRating(partnerId: number): Promise<{ average: number; count: number }> {
    const result = await this.reviewsRepository
      .createQueryBuilder('review')
      .select('AVG(review.rating)', 'average')
      .addSelect('COUNT(review.rating)', 'count')
      .where('review.partnerId = :partnerId', { partnerId })
      .getRawOne();

    return {
      average: parseFloat(result.average) || 0,
      count: parseInt(result.count) || 0,
    };
  }

  async findOne(id: number): Promise<Review> {
    const review = await this.reviewsRepository.findOne({
      where: { id },
      relations: ['customer', 'partner', 'booking'],
    });

    if (!review) {
      throw new NotFoundException(`Review with ID ${id} not found`);
    }

    return review;
  }

  async update(id: number, updateReviewDto: UpdateReviewDto): Promise<Review> {
    const review = await this.findOne(id);
    
    if (updateReviewDto.rating !== undefined) {
      review.rating = updateReviewDto.rating;
    }
    if (updateReviewDto.comment !== undefined) {
      review.comment = updateReviewDto.comment;
    }

    return this.reviewsRepository.save(review);
  }

  async remove(id: number): Promise<void> {
    const review = await this.findOne(id);
    await this.reviewsRepository.remove(review);
  }

  async getBookingForReview(bookingId: number): Promise<Booking | null> {
    return this.bookingsRepository.findOne({
      where: { id: bookingId },
      relations: ['customer', 'partner'],
    });
  }
}