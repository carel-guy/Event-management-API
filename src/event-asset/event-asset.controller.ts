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
import { EventAssetService } from './event-asset.service';
import { CreateEventAssetDto } from './dto/create-event-asset.dto';
import { UpdateEventAssetDto } from './dto/update-event-asset.dto';
import { FilterEventAssetDto } from './dto/filter-event-asset.dto';
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
import { EventAsset } from './entities/event-asset.entity';

interface UserContext {
  userId: string;
  tenantId: string;
  roles: string[];
}

@ApiTags("Ressources de l'événement")
@Controller('event-assets')
@UsePipes(
  new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }),
)
export class EventAssetController {
  constructor(private readonly eventAssetService: EventAssetService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new event asset' })
  @ApiBody({ type: CreateEventAssetDto })
  @ApiResponse({
    status: 201,
    description: 'The event asset has been successfully created.',
    type: EventAsset,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async create(
    @Body() createEventAssetDto: CreateEventAssetDto,
    @Req() req: Request,
  ): Promise<EventAsset> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.eventAssetService.create(tenantId, createEventAssetDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve all event assets, with optional filters' })
  @ApiQuery({
    name: 'eventId',
    description: 'Filter by event ID',
    required: false,
    type: String,
    example: '60c72b2f9b1d8f001c8e4d8b',
  })
  @ApiQuery({
    name: 'name',
    description: 'Search by asset name (partial match)',
    required: false,
    type: String,
    example: 'proj',
  })
  @ApiQuery({
    name: 'page',
    description: 'Page number for pagination',
    required: false,
    type: Number,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Limit of items per page for pagination',
    required: false,
    type: Number,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved event assets.',
    schema: {
      properties: {
        eventAssets: {
          type: 'array',
          items: { $ref: '#/components/schemas/EventAsset' },
        },
        total: { type: 'number', example: 50 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 5 },
      },
    },
  })
  async findAll(
    @Req() req: Request,
    @Query() filterDto: FilterEventAssetDto,
  ): Promise<{
    eventAssets: EventAsset[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.eventAssetService.findAll(tenantId, filterDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a single event asset by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the event asset',
    example: '60c72b2f9b1d8f001c8e4d8c',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved event asset.',
    type: EventAsset,
  })
  @ApiResponse({ status: 404, description: 'Event Asset not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format).',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<EventAsset> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Asset ID format.');
    }
    return this.eventAssetService.findOne(tenantId, new Types.ObjectId(id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing event asset by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the event asset',
    example: '60c72b2f9b1d8f001c8e4d8c',
  })
  @ApiBody({ type: UpdateEventAssetDto })
  @ApiResponse({
    status: 200,
    description: 'The event asset has been successfully updated.',
    type: EventAsset,
  })
  @ApiResponse({ status: 404, description: 'Event Asset not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  async update(
    @Param('id') id: string,
    @Body() updateEventAssetDto: UpdateEventAssetDto,
    @Req() req: Request,
  ): Promise<EventAsset> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Asset ID format.');
    }
    return this.eventAssetService.update(
      tenantId,
      new Types.ObjectId(id),
      updateEventAssetDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete an event asset by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the event asset',
    example: '60c72b2f9b1d8f001c8e4d8c',
  })
  @ApiResponse({
    status: 204,
    description: 'The event asset has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Event Asset not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format).',
  })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Event Asset ID format.');
    }
    await this.eventAssetService.remove(tenantId, new Types.ObjectId(id));
  }
}
