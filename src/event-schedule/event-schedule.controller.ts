import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  InternalServerErrorException,
  Req,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { EventScheduleService } from './event-schedule.service';
import { CreateEventScheduleDto } from './dto/create-event-schedule.dto';
import { UpdateEventScheduleDto } from './dto/update-event-schedule.dto';
import { FilterEventScheduleDto } from './dto/filter-event-schedule.dto';
import { Types } from 'mongoose';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Request } from 'express';
import { EventSchedule } from './entities/event-schedule.entity';
import { FilterSpeakersForEventDto } from './dto/filter-speakers-for-event.dto';
import { Speaker } from 'src/speaker/entities/speaker.entity';
import { AddSpeakerToEventDto } from './dto/add-speaker-to-eventschedule.dto';

// Define the UserContext interface as per your application's authentication setup
interface UserContext {
  userId: string;
  tenantId: string;
  roles: string[];
}

@ApiTags('Event Schedules')
@Controller('event-schedules')
export class EventScheduleController {
  private readonly logger = new Logger(EventScheduleController.name);
  constructor(private readonly eventScheduleService: EventScheduleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event schedule item' })
  @ApiBody({ type: CreateEventScheduleDto })
  @ApiResponse({
    status: 201,
    description: 'The event schedule item has been successfully created.',
    type: EventSchedule,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(
    @Body() createEventScheduleDto: CreateEventScheduleDto,
    @Req() req: Request,
  ): Promise<EventSchedule> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.eventScheduleService.create(tenantId, createEventScheduleDto);
  }

  @Post('add-speaker')
  @HttpCode(HttpStatus.OK) // Using OK as it's an update operation, or use 201 Created if you consider it a resource creation (linking)
  @ApiOperation({ summary: 'Add a speaker to an existing event schedule' })
  @ApiBody({
    type: AddSpeakerToEventDto,
    description: 'Details to add a speaker to an event schedule',
  })
  @ApiResponse({
    status: 200,
    description: 'Speaker successfully added to the event schedule.',
    type: EventSchedule,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request (e.g., invalid ID format, speaker already added).',
  })
  @ApiResponse({
    status: 404,
    description: 'Event schedule or speaker not found.',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async addSpeakerToEventSchedule(
    @Body() addSpeakerDto: AddSpeakerToEventDto,
    @Req() req: Request,
  ): Promise<EventSchedule> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    try {
      return await this.eventScheduleService.addSpeakerToEventSchedule(
        tenantId,
        addSpeakerDto,
      );
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Error in addSpeakerToEventSchedule for tenant ${tenantId.toHexString()}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to add speaker to event schedule.',
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of event schedule items' })
  @ApiResponse({
    status: 200,
    description: 'List of event schedule items.',
    type: [EventSchedule],
  })
  async findAll(
    @Req() req: Request,
    @Query() filterDto: FilterEventScheduleDto,
  ): Promise<{
    eventSchedules: EventSchedule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    // Validate speakerId if present in filterDto
    if (filterDto.speakerId && !Types.ObjectId.isValid(filterDto.speakerId)) {
      throw new BadRequestException('Invalid speakerId format in query.');
    }

    try {
      return await this.eventScheduleService.findAll(tenantId, filterDto);
    } catch (error) {
      // Re-throw BadRequestException from service if any
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve event schedules.',
      );
    }
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a single event schedule item by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the event schedule item',
    example: '60c72b2f9b1d8f001c8e4d8e',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved event schedule item.',
    type: EventSchedule,
  })
  @ApiResponse({ status: 404, description: 'Event Schedule item not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format).',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<EventSchedule> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Schedule ID format.');
    }
    return this.eventScheduleService.findOne(tenantId, new Types.ObjectId(id));
  }

  // Your Controller File
  @Get(':eventId/speakers') // Changed to :eventId to follow RESTful conventions
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve speakers for a specific event' })
  @ApiParam({
    name: 'eventId',
    type: String,
    description: 'The ID of the event',
    example: '60c72b2f9b1d8f001c8e4d8e',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'General search term for speaker name or company',
  })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter speakers by name (ignored if search is provided)',
  })
  @ApiQuery({
    name: 'company',
    required: false,
    type: String,
    description: 'Filter speakers by company (ignored if search is provided)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (starts at 1)',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page',
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description:
      'Successfully retrieved speakers for the event with pagination info.',
    schema: {
      type: 'object',
      properties: {
        speakers: {
          type: 'array',
          items: { $ref: '#/components/schemas/Speaker' }, // Reference your Speaker schema for Swagger
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Event not found.' })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request (e.g., invalid ID format, validation errors on query params).',
  })
  async getSpeakersForEvent(
    @Param('eventId') eventId: string, // eventId from URL param
    @Query() filterDto: FilterSpeakersForEventDto, // Now includes search, page, limit
    @Req() req: Request,
  ): Promise<{
    speakers: Speaker[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('Invalid Event ID format.');
    }

    try {
      // Pass eventId as the first argument and the full filterDto as the second
      return await this.eventScheduleService.getSpeakersForEvent(
        tenantId,
        eventId,
        filterDto,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to retrieve speakers for the event.',
      );
    }
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing event schedule item by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the event schedule item',
    example: '60c72b2f9b1d8f001c8e4d8e',
  })
  @ApiBody({ type: UpdateEventScheduleDto })
  @ApiResponse({
    status: 200,
    description: 'The event schedule item has been successfully updated.',
    type: EventSchedule,
  })
  @ApiResponse({ status: 404, description: 'Event Schedule item not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async update(
    @Param('id') id: string,
    @Body() updateEventScheduleDto: UpdateEventScheduleDto,
    @Req() req: Request,
  ): Promise<EventSchedule> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Schedule ID format.');
    }
    return this.eventScheduleService.update(
      tenantId,
      new Types.ObjectId(id),
      updateEventScheduleDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event schedule item by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the event schedule item',
    example: '60c72b2f9b1d8f001c8e4d8e',
  })
  @ApiResponse({
    status: 204,
    description: 'The event schedule item has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Event Schedule item not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format).',
  })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Schedule ID format.');
    }
    await this.eventScheduleService.remove(tenantId, new Types.ObjectId(id));
  }
}
