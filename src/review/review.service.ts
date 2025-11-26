// src/review/review.service.ts
import {
  Inject,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { ClientGrpc, RpcException } from '@nestjs/microservices';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { firstValueFrom } from 'rxjs';
import {
  EventSchedule,
  EventScheduleDocument,
} from 'src/event-schedule/entities/event-schedule.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Review, ReviewDocument } from './entities/review.entity';
import {
  GetRegistrationDetailsResponse,
  PingResponse,
  RegistrationService,
} from './interfaces/registration.interface';
import { status } from '@grpc/grpc-js';
import { QueueService } from '../queue/queue.service';
import { Speaker, SpeakerDocument } from 'src/speaker/entities/speaker.entity';

@Injectable()
export class ReviewService implements OnModuleInit {
  private readonly logger = new Logger(ReviewService.name);
  private registrationService: RegistrationService;

  constructor(
    @Inject('REGISTRATION_PACKAGE') private client: ClientGrpc,
    @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
    @InjectModel(EventSchedule.name)
    private eventScheduleModel: Model<EventScheduleDocument>,
    @InjectModel(Speaker.name)
    private speakerModel: Model<SpeakerDocument>,
    private readonly queueService: QueueService,
  ) {}

  onModuleInit() {
    this.registrationService = this.client.getService<RegistrationService>(
      'RegistrationService',
    );
  }

  async create(
    tenantId: Types.ObjectId,
    createReviewDto: CreateReviewDto,
  ): Promise<ReviewDocument> {
            this.logger.log(
      `Creating a new review for event schedule: ${createReviewDto.eventScheduleId}`,
    );
    const { eventScheduleId, registrationId, taggedSpeakers } = createReviewDto;
    const scheduleObjectId = new Types.ObjectId(eventScheduleId);

    const eventSchedule = await this.eventScheduleModel
      .findOne({ _id: scheduleObjectId, tenantId })
      .exec();
    if (!eventSchedule) {
      throw new NotFoundException(
        `EventSchedule with ID "${eventScheduleId}" not found`,
      );
    }

        if (taggedSpeakers && taggedSpeakers.length > 0) {
      this.logger.log(`Validating ${taggedSpeakers.length} tagged speakers.`);
      // Ensure tagged speakers are unique
      const uniqueSpeakerIds = [
        ...new Set(taggedSpeakers.map((id) => id.toString())),
      ];
      if (uniqueSpeakerIds.length !== taggedSpeakers.length) {
        throw new BadRequestException('Duplicate speaker IDs are not allowed.');
      }

      const scheduleSpeakerIds = (eventSchedule.speakers || []).map((id) =>
        id.toString(),
      );
      for (const speakerId of taggedSpeakers) {
        if (!scheduleSpeakerIds.includes(speakerId.toString())) {
          throw new BadRequestException(
            `Speaker with ID "${speakerId}" is not associated with this event schedule.`,
          );
        }
      }
    }

    const registrationDetails = await firstValueFrom(
      this.registrationService.getRegistrationDetails({
        registrationId: registrationId,
        tenantId: tenantId.toHexString(),
      }),
    );

    if (!registrationDetails) {
      throw new NotFoundException(
        `Registration with ID "${registrationId}" not found`,
      );
    }

    const review = new this.reviewModel({
      ...createReviewDto,
      tenantId,
      eventScheduleId: scheduleObjectId,
      registrationId,
      registrationName:
        `${registrationDetails.firstName} ${registrationDetails.lastName}`.trim(),
    });

        const savedReview = await review.save();
    this.logger.log(`Successfully saved review with ID: ${savedReview._id}`);

        if (savedReview.taggedSpeakers && savedReview.taggedSpeakers.length > 0) {
      this.logger.log(`Dispatching ${savedReview.taggedSpeakers.length} speaker notification jobs.`);
      for (const speakerId of savedReview.taggedSpeakers) {
        this.queueService.addEmailJob('speaker-notification', {
          speakerId,
          review: savedReview,
          tenantId,
        }).catch(err => this.logger.error(`Failed to add job for speaker ${speakerId}: ${err.message}`, err.stack));
      }
    }

    return savedReview;
  }

  async getRegistrationDetailsById(
    registrationId: string,
    tenantId: Types.ObjectId,
  ): Promise<GetRegistrationDetailsResponse> {
    this.logger.log(
      `[gRPC Client] Attempting to get registration details for ID: ${registrationId} in tenant: ${tenantId.toHexString()}`,
    );
    try {
      const payload = {
        registrationId: registrationId,
        tenantId: tenantId.toHexString(),
      };
      this.logger.log(
        `[gRPC Client] Sending GetRegistrationDetails with payload: ${JSON.stringify(payload)}`,
      );

      const registrationDetails = await firstValueFrom(
        this.registrationService.getRegistrationDetails(payload),
      );

      if (!registrationDetails) {
        // This case might be redundant if the gRPC service properly throws a NOT_FOUND error
        throw new NotFoundException(
          `Registration with ID "${registrationId}" not found`,
        );
      }
      return registrationDetails;
    } catch (error) {
      // Handle gRPC errors specifically
      if (error instanceof RpcException) {
        const rpcError = error.getError();
        if (
          typeof rpcError === 'object' &&
          rpcError !== null &&
          'code' in rpcError &&
          rpcError.code === status.NOT_FOUND
        ) {
          throw new NotFoundException(error.message);
        }
      }
      // Log the generic error
      this.logger.error(
        `Failed to get registration details for ID ${registrationId}: ${error.message}`,
        error.stack,
      );
      // Throw a generic exception
      throw new InternalServerErrorException(
        'An error occurred while fetching registration details.',
      );
    }
  }

  async findAllForEventSchedule(
    tenantId: Types.ObjectId,
    eventScheduleId: Types.ObjectId,
    options: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  ): Promise<{
    reviews: (Omit<Review, 'taggedSpeakers'> & {
      registrationDetails?: Partial<GetRegistrationDetailsResponse>;
      taggedSpeakers?: {
        id: Types.ObjectId;
        name: string;
        company?: string;
        profilePictureId?: Types.ObjectId | string;
      }[];
    })[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { page = 1, limit = 10 } = options;

    // Validate pagination parameters
    const pageNumber = Math.max(1, page);
    const pageSize = Math.max(1, Math.min(limit, 100)); // Cap limit to prevent abuse
    const skip = (pageNumber - 1) * pageSize;

    // Verify that the event schedule exists for the given tenant
    const eventSchedule = await this.eventScheduleModel
      .findOne({ _id: eventScheduleId, tenantId })
      .exec();
    if (!eventSchedule) {
      throw new NotFoundException(`EventSchedule with ID "${eventScheduleId}" not found`);
    }

    // Fetch paginated reviews and total count concurrently
    const reviewsQuery = this.reviewModel
      .find({ eventScheduleId, tenantId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(pageSize);

    const totalReviewsQuery = this.reviewModel.countDocuments({ eventScheduleId, tenantId });

    const [reviews, total] = await Promise.all([
      reviewsQuery.exec(),
      totalReviewsQuery.exec(),
    ]);

    // Enrich each review with registration details and speaker details
    const enrichedReviews = await Promise.all(
      reviews.map(async (review) => {
        let registrationDetails: Partial<GetRegistrationDetailsResponse> | undefined;
        let enrichedSpeakers: { id: Types.ObjectId; name: string; company?: string; profilePictureId?: Types.ObjectId | string }[] | undefined;

        // Fetch registration details
        try {
          const fullDetails = await firstValueFrom(
            this.registrationService.getRegistrationDetails({
              registrationId: review.registrationId,
              tenantId: tenantId.toHexString(),
            }),
          );
          registrationDetails = {
            id: fullDetails.id,
            firstName: fullDetails.firstName,
            lastName: fullDetails.lastName,
            email: fullDetails.email,
            status: fullDetails.status,
          };
        } catch (error) {
          this.logger.error(`Failed to fetch registration details for review ${review._id}: ${error.message}`);
        }

        // Fetch speaker details for taggedSpeakers
        if (review.taggedSpeakers && review.taggedSpeakers.length > 0) {
          try {
            const speakers = await this.speakerModel
              .find({ _id: { $in: review.taggedSpeakers } })
              .select('name company profilePictureId')
              .exec();
            enrichedSpeakers = speakers.map((speaker) => ({
              id: speaker._id,
              name: speaker.name,
              company: speaker.company,
              profilePictureId: speaker.profilePictureId,
            }));
          } catch (error) {
            this.logger.error(`Failed to fetch speaker details for review ${review._id}: ${error.message}`);
            enrichedSpeakers = review.taggedSpeakers.map((speaker) => ({
              id: speaker._id,
              name: 'Unknown',
              company: undefined,
              profilePictureId: undefined,
            }));
          }
        } else {
          enrichedSpeakers = [];
        }

        return { ...review.toObject(), registrationDetails, taggedSpeakers: enrichedSpeakers };
      }),
    );

    return {
      reviews: enrichedReviews,
      total,
      page: pageNumber,
      limit: pageSize,
      totalPages: Math.ceil(total / pageSize) || 1,
    };
  }

  async update(
    reviewId: Types.ObjectId,
    tenantId: Types.ObjectId,
    updateReviewDto: UpdateReviewDto,
  ): Promise<ReviewDocument> {
    if (
      updateReviewDto.taggedSpeakers &&
      updateReviewDto.taggedSpeakers.length > 0
    ) {
      // Ensure tagged speakers are unique
      const uniqueSpeakerIds = [
        ...new Set(updateReviewDto.taggedSpeakers.map((id) => id.toString())),
      ];
      if (uniqueSpeakerIds.length !== updateReviewDto.taggedSpeakers.length) {
        throw new BadRequestException('Duplicate speaker IDs are not allowed.');
      }

      const existingReview = await this.reviewModel
        .findOne({ _id: reviewId, tenantId })
        .exec();
      if (!existingReview) {
        throw new NotFoundException(`Review with ID "${reviewId}" not found`);
      }

      const eventSchedule = await this.eventScheduleModel
        .findById(existingReview.eventScheduleId)
        .exec();
      if (!eventSchedule) {
        throw new NotFoundException(
          `EventSchedule with ID "${existingReview.eventScheduleId}" not found`,
        );
      }

      const scheduleSpeakerIds = (eventSchedule.speakers || []).map((id) =>
        id.toString(),
      );
      for (const speakerId of updateReviewDto.taggedSpeakers) {
        if (!scheduleSpeakerIds.includes(speakerId.toString())) {
          throw new BadRequestException(
            `Speaker with ID "${speakerId}" is not associated with this event schedule.`,
          );
        }
      }
    }

        this.logger.log(`Updating review with ID: ${reviewId}`);
    if (updateReviewDto.taggedSpeakers) {
      this.logger.log(`Updating tagged speakers: ${updateReviewDto.taggedSpeakers.join(', ')}`);
    }

    const updatedReview = await this.reviewModel
      .findOneAndUpdate({ _id: reviewId, tenantId }, updateReviewDto, {
        new: true,
      })
      .populate('taggedSpeakers')
      .exec();

        if (!updatedReview) {
      this.logger.error(`Failed to find and update review with ID: ${reviewId}`);
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }

    this.logger.log(`Successfully updated review with ID: ${reviewId}`);
    return updatedReview;
  }

  async remove(
    reviewId: Types.ObjectId,
    tenantId: Types.ObjectId,
  ): Promise<void> {
    const result = await this.reviewModel
      .deleteOne({ _id: reviewId, tenantId })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(`Review with ID "${reviewId}" not found`);
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
  ): Promise<
    (Review & { registrationDetails?: GetRegistrationDetailsResponse })[]
  > {
    const reviews = await this.reviewModel
      .find({ tenantId })
      .sort({ createdAt: -1 })
      .exec();

    return Promise.all(
      reviews.map(async (review) => {
        try {
          const registrationDetails = await firstValueFrom(
            this.registrationService.getRegistrationDetails({
              registrationId: review.registrationId,
              tenantId: tenantId.toHexString(),
            }),
          );
          return { ...review.toObject(), registrationDetails };
        } catch (error) {
          return { ...review.toObject() };
        }
      }),
    );
  }
}
