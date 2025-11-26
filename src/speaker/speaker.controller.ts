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
  UploadedFile,
  UseInterceptors,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SpeakerService } from './speaker.service';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { FilterSpeakerDto } from './dto/filter-speaker.dto';
import { Types, Model } from 'mongoose';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiConsumes,
} from '@nestjs/swagger';
import { Request } from 'express';
import { Speaker, SpeakerDocument } from './entities/speaker.entity';
import { MinioService } from 'src/minio/minio.service'; // Ensure this path is correct
import { InjectModel } from '@nestjs/mongoose'; // Keep this for the specific Minio upload logic if MinioService needs the Model directly.
import { SpeakerType } from 'src/enums'; // Ensure this path is correct
import { FilterEventScheduleDto } from './dto/filter-event-schedule.dto';
import { EventSchedule } from 'src/event-schedule/entities/event-schedule.entity';

// Define the UserContext interface as per your application's authentication setup
interface UserContext {
  userId: string;
  tenantId: string;
  roles: string[];
}

@ApiBearerAuth() // Indicates that JWT token is required for all endpoints in this controller
@ApiTags('Intervenants')
@Controller('speakers')
@UsePipes(
  new ValidationPipe({
    transform: true, // Automatically transforms payloads to DTO instances
    whitelist: true, // Strips away properties that are not defined in the DTO
    forbidNonWhitelisted: true, // Throws an error if non-whitelisted properties are present
  }),
)
export class SpeakerController {
  constructor(
    private readonly speakerService: SpeakerService,
    private readonly minioService: MinioService,
    @InjectModel(Speaker.name) private speakerModel: Model<SpeakerDocument>, // This is specifically for the Minio upload example.
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new speaker' })
  @ApiBody({ type: CreateSpeakerDto })
  @ApiResponse({
    status: 201,
    description: 'The speaker has been successfully created.',
    type: Speaker,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict (Speaker with this name already exists for the tenant).',
  })
  async create(
    @Body() createSpeakerDto: CreateSpeakerDto,
    @Req() req: Request,
  ): Promise<Speaker> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.speakerService.create(tenantId, createSpeakerDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Retrieve a list of speakers with pagination and filters',
  })
  @ApiResponse({
    status: 200,
    description: 'List of speakers with pagination details.',
    schema: {
      type: 'object',
      properties: {
        speakers: {
          type: 'array',
          items: { $ref: '#/components/schemas/Speaker' },
        },
        total: { type: 'number', example: 100 },
        currentPage: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  // Removed tenantId from @ApiQuery as it comes from UserContext
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by speaker name (case-insensitive partial match).',
  })
  @ApiQuery({
    name: 'company',
    required: false,
    type: String,
    description: 'Filter by speaker company (case-insensitive partial match).',
  })
  @ApiQuery({
    name: 'speakerType',
    required: false,
    type: String,
    enum: SpeakerType,
    description: 'Filter by speaker type.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page for pagination.',
    example: 10,
  })
  async findAll(
    @Req() req: Request,
    @Query() filterDto: FilterSpeakerDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{
    speakers: Speaker[];
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.speakerService.findAll(tenantId, filterDto, page, limit);
  }

  @Get(':id/schedules')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Retrieve event schedules for a specific speaker with pagination and filters',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the speaker',
    example: '60c72b2f9b1d8f001c8e4d8f',
  })
  @ApiResponse({
    status: 200,
    description:
      'List of event schedules for the speaker with pagination details.',
    schema: {
      type: 'object',
      properties: {
        eventSchedules: {
          type: 'array',
          items: { $ref: '#/components/schemas/EventSchedule' },
        },
        total: { type: 'number', example: 25 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 3 },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid speaker ID format).',
  })
  @ApiResponse({ status: 404, description: 'Speaker not found.' })
  @ApiResponse({ status: 500, description: 'Internal Server Error.' })
  @ApiQuery({
    name: 'eventId',
    required: false,
    type: String,
    description: 'Filter by event ID.',
  })
  @ApiQuery({
    name: 'sessionType',
    required: false,
    type: String,
    description: 'Filter by session type.',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    type: String,
    description: 'Search in title, location, speaker info, or event details.',
  })
  @ApiQuery({
    name: 'title',
    required: false,
    type: String,
    description: 'Filter by schedule title (case-insensitive partial match).',
  })
  @ApiQuery({
    name: 'location',
    required: false,
    type: String,
    description: 'Filter by location (case-insensitive partial match).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page for pagination.',
    example: 10,
  })
  async getSpeakerSchedules(
    @Param('id') speakerId: string,
    @Req() req: Request,
    @Query() filterDto: FilterEventScheduleDto,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<{
    eventSchedules: EventSchedule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(speakerId)) {
      throw new BadRequestException('Invalid Speaker ID format.');
    }

    const speakerObjectId = new Types.ObjectId(speakerId);

    return this.speakerService.getSchedulesBySpeakerId(
      tenantId,
      speakerObjectId,
      filterDto,
      page,
      limit,
    );
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a single speaker by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the speaker',
    example: '60c72b2f9b1d8f001c8e4d8f',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved speaker.',
    type: Speaker,
  })
  @ApiResponse({ status: 404, description: 'Speaker not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format).',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Speaker> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Speaker ID format.');
    }
    return this.speakerService.findOne(tenantId, new Types.ObjectId(id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update an existing speaker by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the speaker',
    example: '60c72b2f9b1d8f001c8e4d8f',
  })
  @ApiBody({ type: UpdateSpeakerDto })
  @ApiResponse({
    status: 200,
    description: 'The speaker has been successfully updated.',
    type: Speaker,
  })
  @ApiResponse({ status: 404, description: 'Speaker not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({
    status: 409,
    description:
      'Conflict (Updated name already exists for another speaker in this tenant).',
  })
  async update(
    @Param('id') id: string,
    @Body() updateSpeakerDto: UpdateSpeakerDto,
    @Req() req: Request,
  ): Promise<Speaker> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Speaker ID format.');
    }
    return this.speakerService.update(
      tenantId,
      new Types.ObjectId(id),
      updateSpeakerDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a speaker by ID' })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The ID of the speaker',
    example: '60c72b2f9b1d8f001c8e4d8f',
  })
  @ApiResponse({
    status: 204,
    description: 'The speaker has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Speaker not found.' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format).',
  })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Speaker ID format.');
    }
    await this.speakerService.remove(tenantId, new Types.ObjectId(id));
  }

  @Post(':speakerId/picture') // tenantId is now derived from context
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data') // Required for Swagger to know it's a file upload
  @ApiOperation({ summary: 'Upload a profile picture for a speaker' })
  // tenantId removed from @ApiParam as it comes from context
  @ApiParam({ name: 'speakerId', type: String, description: 'Speaker ID' })
  @ApiBody({
    // Define the body for Swagger to handle file upload correctly
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'The profile picture file to upload.',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Profile picture uploaded successfully.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid file, invalid ID).',
  })
  @ApiResponse({ status: 404, description: 'Speaker not found.' })
  async uploadSpeakerPicture(
    @Param('speakerId') speakerId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request,
  ) {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = userContext.tenantId; // Keep as string for MinioService if it expects string

    if (!Types.ObjectId.isValid(speakerId)) {
      throw new BadRequestException('Invalid Speaker ID format.');
    }
    if (!file) {
      throw new BadRequestException('No file uploaded.');
    }

    try {
      // Pass tenantId from context, the file, and the speakerId as ObjectId if MinioService expects it
      await this.minioService.uploadProfilePicture(
        tenantId, // MinioService might expect string tenantId, check its implementation
        file,
        speakerId,
        this.speakerModel, // Passing the Mongoose Model directly, ensure MinioService handles it properly
      );
      return { message: 'Profile picture uploaded successfully' };
    } catch (error) {
      // Catch specific errors from MinioService or database operations
      if (error instanceof NotFoundException) {
        throw new NotFoundException(
          `Speaker with ID "${speakerId}" not found for tenant "${tenantId}".`,
        );
      }
      if (error instanceof ConflictException) {
        // If MinioService throws Conflict for some reason
        throw error;
      }
      throw new BadRequestException(
        `Failed to upload profile picture: ${error.message}`,
      );
    }
  }
}
