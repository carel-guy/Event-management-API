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
  Req,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { EventConfigService } from './event-config.service';
import { CreateEventConfigDto } from './dto/create-event-config.dto';
import { UpdateEventConfigDto } from './dto/update-event-config.dto';
import { FilterEventConfigDto } from './dto/filter-event-config.dto';
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
import { EventConfig } from './entities/event-config.entity';

interface UserContext {
  userId: string;
  tenantId: string;
  roles: string[];
}

@ApiBearerAuth()
@ApiTags("Configurations d'événements")
@Controller('event-configs')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class EventConfigController {
  constructor(private readonly eventConfigService: EventConfigService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event configuration' })
  @ApiBody({ type: CreateEventConfigDto })
  @ApiResponse({
    status: 201,
    description: 'The event configuration has been successfully created.',
    type: EventConfig,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description: 'Conflict (EventConfig for this eventId already exists).',
  })
  async create(
    @Body() createEventConfigDto: CreateEventConfigDto,
    @Req() req: Request,
  ): Promise<EventConfig> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.eventConfigService.create(tenantId, createEventConfigDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Retrieve all event configurations, with optional filters and pagination',
  })
  @ApiQuery({
    name: 'eventId',
    required: false,
    description: 'Filter by event ID',
    example: '60c72b2f9b1d8f001c8e4d8b',
    type: String,
  })
  @ApiQuery({
    name: 'isRegistrationOpen',
    required: false,
    description: 'Filter by registration status (true or false as string)',
    example: 'true',
    type: Boolean,
  })
  @ApiQuery({
    name: 'page',
    required: false,
    description: 'Page number for pagination (starts from 1)',
    example: 1,
    type: Number,
    minimum: 1,
    default: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Number of items per page',
    example: 10,
    type: Number,
    minimum: 1,
    default: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved event configuration.',
    type: EventConfig,
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  async findAll(
    @Req() req: Request,
    @Query() filterDto: FilterEventConfigDto,
  ): Promise<{
    eventConfigs: EventConfig[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.eventConfigService.findAll(tenantId, filterDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve a single event configuration by its unique ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The unique ID of the event configuration',
    example: '60c72b2f9b1d8f001c8e4d8c',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved event configuration.',
    type: EventConfig,
  })
  @ApiResponse({ status: 404, description: 'Event Configuration not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format).',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<EventConfig> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Configuration ID format.');
    }
    return this.eventConfigService.findOne(tenantId, new Types.ObjectId(id));
  }

  @Get('by-event/:eventId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve an event configuration by its associated event ID',
  })
  @ApiParam({
    name: 'eventId',
    type: String,
    description: 'The ID of the event',
    example: '60c72b2f9b1d8f001c8e4d8b',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved event configuration by event ID.',
    type: EventConfig,
  })
  @ApiResponse({
    status: 404,
    description: 'Event Configuration for event ID not found.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid event ID format).',
  })
  async findByEventId(
    @Param('eventId') eventId: string,
    @Req() req: Request,
  ): Promise<EventConfig> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(eventId)) {
      throw new BadRequestException('Invalid Event ID format.');
    }
    return this.eventConfigService.findByEventId(
      tenantId,
      new Types.ObjectId(eventId),
    );
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update an existing event configuration by its unique ID',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The unique ID of the event configuration',
    example: '60c72b2f9b1d8f001c8e4d8c',
  })
  @ApiBody({ type: UpdateEventConfigDto })
  @ApiResponse({
    status: 200,
    description: 'The event configuration has been successfully updated.',
    type: EventConfig,
  })
  @ApiResponse({ status: 404, description: 'Event Configuration not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async update(
    @Param('id') id: string,
    @Body() updateEventConfigDto: UpdateEventConfigDto,
    @Req() req: Request,
  ): Promise<EventConfig> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Configuration ID format.');
    }
    return this.eventConfigService.update(
      tenantId,
      new Types.ObjectId(id),
      updateEventConfigDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event configuration by its unique ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The unique ID of the event configuration',
    example: '60c72b2f9b1d8f001c8e4d8c',
  })
  @ApiResponse({
    status: 204,
    description: 'The event configuration has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Event Configuration not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format).',
  })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Configuration ID format.');
    }
    await this.eventConfigService.remove(tenantId, new Types.ObjectId(id));
  }
}
