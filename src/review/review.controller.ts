// src/review/review.controller.ts
import {
  Controller,
  Post,
  Body,
  Param,
  Get,
  Req,
  HttpCode,
  HttpStatus,
  NotFoundException,
  Patch,
  Delete,
  Logger,
  InternalServerErrorException,
  BadRequestException,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiNoContentResponse,
  ApiQuery,
} from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { ReviewDto } from './dto/review.dto';
import { Types } from 'mongoose';
import { Request } from 'express';
import { UpdateReviewDto } from './dto/update-review.dto';
import { FindReviewsDto } from './dto/find-reviews.dto';
import { UpdateReviewParamsDto } from './dto/update-review-params.dto';
import { RemoveReviewParamsDto } from './dto/remove-review-params.dto';
import { Review } from './entities/review.entity';
import {
  GetRegistrationDetailsResponse,
  PingResponse,
} from './interfaces/registration.interface';
import { FilterReviewDto } from './dto/filter-review.dto';
import { plainToClass } from 'class-transformer';

// Define the UserContext interface as per your application's authentication setup
interface UserContext {
  userId: string;
  tenantId: string;
  roles: string[];
}

@ApiTags('Reviews')
@ApiBearerAuth()
@Controller('reviews')
export class ReviewController {
  private readonly logger = new Logger(ReviewController.name);
  constructor(private readonly reviewService: ReviewService) {}

  @Get()
  @ApiOperation({
    summary: 'Retrieve all reviews for a tenant',
    description:
      'Fetches a list of all reviews for the given tenant. For each review, it makes a gRPC call to the Registration microservice to enrich the data with the latest registration details.',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of reviews with registration details.',
    type: [ReviewDto],
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async getAll(@Req() req: Request): Promise<ReviewDto[]> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    try {
      const reviews = await this.reviewService.findAll(tenantId);
      return plainToClass(ReviewDto, reviews);
    } catch (error) {
      this.logger.error(
        `Failed to retrieve reviews for tenant ${tenantId.toHexString()}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve reviews.');
    }
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new review for an event registration',
    description:
      "Submits a new review. Internally, this triggers a gRPC call to the Registration microservice to fetch and cache the registrant's name.",
  })
  @ApiResponse({
    status: 201,
    description: 'The review has been successfully created.',
    type: ReviewDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request. Invalid input data.' })
  @ApiResponse({
    status: 404,
    description:
      'Not Found. The specified event schedule or registration could not be found.',
  })
  async create(
    @Req() req: Request,
    @Body() createReviewDto: CreateReviewDto,
  ): Promise<ReviewDto> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    try {
      const review = await this.reviewService.create(tenantId, createReviewDto);

      return plainToClass(ReviewDto, review.toObject());
    } catch (error) {
      this.logger.error(
        `Failed to create review for tenant ${tenantId.toHexString()}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create review.');
    }
  }

  @Get('event-schedule/:eventScheduleId')
  @ApiOperation({
    summary: 'Retrieve all reviews for a specific event schedule',
    description:
      'Fetches all reviews for a specific event schedule. For each review, it makes a gRPC call to the Registration microservice to enrich the data with the latest registration details.',
  })
  @ApiParam({
    name: 'eventScheduleId',
    description: 'The ID of the event schedule',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'A list of reviews for the event schedule.',
    type: [ReviewDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Not Found. The specified event schedule could not be found.',
  })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })
  async findAllForEventSchedule(
    @Req() req: Request,
    @Param('eventScheduleId') eventScheduleId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{ reviews: ReviewDto[], total: number, page: number, limit: number, totalPages: number }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(eventScheduleId)) {
      throw new BadRequestException('Invalid Event Schedule ID format.');
    }

    try {
      const result = await this.reviewService.findAllForEventSchedule(
        tenantId,
        new Types.ObjectId(eventScheduleId),
        { page, limit },
      );

      return {
        reviews: plainToClass(ReviewDto, result.reviews),
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to find reviews for event schedule ${eventScheduleId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to retrieve reviews.');
    }
  }

  @Delete(':reviewId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a review' })
  @ApiParam({ name: 'reviewId', description: 'The ID of the review to delete' })
  @ApiNoContentResponse({
    description: 'The review has been successfully deleted.',
  })
  @ApiNotFoundResponse({ description: 'Review not found.' })
  async remove(
    @Req() req: Request,
    @Param() params: RemoveReviewParamsDto,
  ): Promise<void> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(params.reviewId)) {
      throw new BadRequestException('Invalid Review ID format.');
    }

    try {
      await this.reviewService.remove(
        new Types.ObjectId(params.reviewId),
        tenantId,
      );
    } catch (error) {
      this.logger.error(
        `Failed to remove review ${params.reviewId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to remove review.');
    }
  }

  @Get('registrations/:registrationId')
  @ApiOperation({
    summary: 'Get registration details by ID (gRPC Test Endpoint)',
    description:
      'A test endpoint to directly call the GetRegistrationDetails gRPC method on the Registration microservice and return the raw response. Useful for debugging the connection.',
  })
  @ApiParam({
    name: 'registrationId',
    description: 'The ID of the registration to fetch',
    type: String,
  })
  @ApiResponse({ status: 200, description: 'The registration details.' })
  @ApiResponse({
    status: 404,
    description: 'Not Found. The registration could not be found.',
  })
  @ApiResponse({
    status: 500,
    description:
      'Internal Server Error. Could not communicate with the gRPC service.',
  })
  async getRegistrationDetails(
    @Req() req: Request,
    @Param('registrationId') registrationId: string,
  ): Promise<GetRegistrationDetailsResponse> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(registrationId)) {
      throw new BadRequestException('Invalid Registration ID format.');
    }

    return this.reviewService.getRegistrationDetailsById(
      registrationId,
      tenantId,
    );
  }
}
