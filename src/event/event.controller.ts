import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  Req,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { EventService } from './event.service';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventDto } from './dto/filter-event.dto';
import { Event } from './entities/event.entity';
import { Types } from 'mongoose';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { CustomRequest } from 'src/Interceptor/custom-request.interface';
import { GetEventsByUserIdDto } from './dto/get-events-by-user-id.dto';

@ApiTags('Événements')
@Controller('events')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class EventController {
  private readonly logger = new Logger(EventController.name);

  constructor(private readonly eventService: EventService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new event' })
  @ApiResponse({
    status: 201,
    description: 'The event has been successfully created.',
    type: Event,
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request: Invalid input data (e.g., start date after end date).',
  })
  @ApiConflictResponse({
    description:
      'Conflict: An event with the same unique identifier already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error: Failed to create event.',
  })
  async create(
    @Body() createEventDto: CreateEventDto,
    @Req() req: CustomRequest,
  ): Promise<Event> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    const createdBy: Types.ObjectId | null = req.user.userId
      ? new Types.ObjectId(req.user.userId)
      : null;
    return this.eventService.create(tenantId, createdBy, createEventDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of events' })
  @ApiResponse({ status: 200, description: 'List of events.', type: [Event] })
  async findAll(
    @Query() filterDto: FilterEventDto,
    @Req() req: CustomRequest,
  ): Promise<{
    events: Event[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    if (filterDto.tenantId && filterDto.tenantId !== tenantId.toHexString()) {
      return {
        events: [],
        total: 0,
        page: filterDto.page || 1,
        limit: filterDto.limit || 10,
        totalPages: 1,
      };
    }
    return this.eventService.findAll(tenantId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single event by ID' })
  @ApiResponse({ status: 200, description: 'The found event.', type: Event })
  @ApiNotFoundResponse({
    description:
      'Not Found: Event not found or does not belong to this tenant.',
  })
  @ApiBadRequestResponse({ description: 'Bad Request: Invalid ID format.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the event.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<Event> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.eventService.findOne(tenantId, new Types.ObjectId(id));
  }

  @Get('by-user/:userId')
  @ApiOperation({
    summary: 'Get all events created or updated by a specific user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of events created or updated by the given user.',
    schema: {
      example: {
        events: [],
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Invalid user ID format or query params.',
  })
  async getEventsByUserId(
    @Query() query: GetEventsByUserIdDto,
    @Req() req: CustomRequest,
  ): Promise<{
    events: Event[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const tenantId = new Types.ObjectId(req.user.tenantId);
    const dto: GetEventsByUserIdDto = {
      userId: query.userId,
      page: query.page || 1,
      limit: query.limit || 10,
    };
    return this.eventService.getEventsByUserId(tenantId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing event by ID' })
  @ApiResponse({ status: 200, description: 'The updated event.', type: Event })
  @ApiNotFoundResponse({
    description:
      'Not Found: Event not found or does not belong to this tenant.',
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request: Invalid input data or ID format (e.g., start date after end date).',
  })
  @ApiConflictResponse({
    description:
      'Conflict: An event with the same unique identifier already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error: Failed to update event.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the event to update.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  @ApiBody({ type: UpdateEventDto, description: 'Data to update the event.' })
  async update(
    @Param('id') id: string,
    @Body() updateEventDto: UpdateEventDto,
    @Req() req: CustomRequest,
  ): Promise<Event> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    const updatedBy: Types.ObjectId | null = req.user.userId
      ? new Types.ObjectId(req.user.userId)
      : null;
    return this.eventService.update(
      tenantId,
      new Types.ObjectId(id),
      updatedBy,
      updateEventDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an event by ID' })
  @ApiResponse({
    status: 200,
    description: 'Message indicating successful deletion.',
    schema: { example: { message: 'Event successfully deleted.' } },
  })
  @ApiNotFoundResponse({
    description:
      'Not Found: Event not found or does not belong to this tenant.',
  })
  @ApiBadRequestResponse({ description: 'Bad Request: Invalid ID format.' })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error: Failed to delete event.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the event to delete.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<{ message: string }> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.eventService.remove(tenantId, new Types.ObjectId(id));
  }
}
