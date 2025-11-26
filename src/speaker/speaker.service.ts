import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateSpeakerDto } from './dto/create-speaker.dto';
import { UpdateSpeakerDto } from './dto/update-speaker.dto';
import { FilterSpeakerDto } from './dto/filter-speaker.dto';
import { Speaker, SpeakerDocument } from './entities/speaker.entity';
import { MinioService } from 'src/minio/minio.service'; // Ensure this path is correct
import {
  EventSchedule,
  EventScheduleDocument,
} from 'src/event-schedule/entities/event-schedule.entity';
import { FilterEventScheduleDto } from './dto/filter-event-schedule.dto';

@Injectable()
export class SpeakerService {
  private readonly logger = new Logger(SpeakerService.name); // Corrected Logger initialization

  constructor(
    @InjectModel(Speaker.name) private speakerModel: Model<SpeakerDocument>,
    private readonly minioService: MinioService,
    @InjectModel(EventSchedule.name)
    private eventScheduleModel: Model<EventScheduleDocument>,
  ) {}

  async create(
    tenantId: Types.ObjectId,
    createSpeakerDto: CreateSpeakerDto,
  ): Promise<Speaker> {
    this.logger.log(
      `Attempting to create speaker for tenant ${tenantId.toHexString()} with name: ${createSpeakerDto.name}`,
    );
    try {
      // Check if a speaker with the same name already exists for this tenant
      const existingSpeaker = await this.speakerModel
        .findOne({ tenantId, name: createSpeakerDto.name })
        .exec();
      if (existingSpeaker) {
        throw new ConflictException(
          `Speaker with name "${createSpeakerDto.name}" already exists for tenant "${tenantId.toHexString()}".`,
        );
      }

      // Create new speaker, assigning the tenantId from the context
      const createdSpeaker = new this.speakerModel({
        ...createSpeakerDto,
        tenantId,
      });
      return await createdSpeaker.save();
    } catch (error) {
      this.logger.error(
        `Failed to create speaker for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error.code === 11000 && error.keyPattern && error.keyPattern.name) {
        throw new ConflictException(`Speaker with name "${createSpeakerDto.name}" already exists.`);
      }
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to create speaker.');
    }
  }

  async findAll(
    tenantId: Types.ObjectId, // tenantId is now explicitly passed
    filterDto: FilterSpeakerDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    speakers: Speaker[];
    total: number;
    currentPage: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching all speakers for tenant ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );
    const query: any = { tenantId }; // Always filter by the provided tenantId

    if (filterDto.name) {
      query.name = { $regex: filterDto.name, $options: 'i' }; // Case-insensitive partial match
    }
    if (filterDto.company) {
      query.company = { $regex: filterDto.company, $options: 'i' }; // Case-insensitive partial match
    }
    if (filterDto.speakerType) {
      query.speakerType = filterDto.speakerType;
    }

    const skip = (page - 1) * limit;

    try {
      const speakers = await this.speakerModel
        .find(query)
        .skip(skip)
        .limit(limit)
        .exec();
      const total = await this.speakerModel.countDocuments(query).exec();
      const totalPages = Math.ceil(total / limit) || 1; // Ensure totalPages is at least 1

      this.logger.log(
        `Found ${speakers.length} speakers (total: ${total}, page: ${page}/${totalPages}) for tenant ${tenantId.toHexString()}`,
      );
      return {
        speakers,
        total,
        currentPage: page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch speakers for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve speakers.');
    }
  }

  async findOne(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<Speaker> {
    this.logger.log(
      `Finding speaker with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find by both _id and tenantId to ensure tenant-scoping
      const speaker = await this.speakerModel
        .findOne({ _id: id, tenantId })
        .exec();
      if (!speaker) {
        throw new NotFoundException(
          `Speaker with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return speaker;
    } catch (error) {
      this.logger.error(
        `Failed to find speaker with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve speaker with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updateSpeakerDto: UpdateSpeakerDto,
  ): Promise<Speaker> {
    this.logger.log(
      `Updating speaker with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()} with data: ${JSON.stringify(updateSpeakerDto)}`,
    );
    try {
      if (updateSpeakerDto.name) {
        // Check for conflict: another speaker with the same name in the same tenant, excluding the current speaker
        const existingSpeakerByName = await this.speakerModel
          .findOne({
            tenantId: tenantId, // Use the tenantId from the service method parameter
            name: updateSpeakerDto.name,
            _id: { $ne: id }, // Exclude the speaker being updated
          })
          .exec();

        if (existingSpeakerByName) {
          throw new ConflictException(
            `Speaker with name "${updateSpeakerDto.name}" already exists for tenant "${tenantId.toHexString()}".`,
          );
        }
      }

      // Find and update by both _id and tenantId to ensure tenant-scoping
      const updatedSpeaker = await this.speakerModel
        .findOneAndUpdate(
          { _id: id, tenantId },
          { $set: updateSpeakerDto },
          { new: true },
        )
        .exec();

      if (!updatedSpeaker) {
        throw new NotFoundException(
          `Speaker with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return updatedSpeaker;
    } catch (error) {
      this.logger.error(
        `Failed to update speaker with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update speaker with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async remove(tenantId: Types.ObjectId, id: Types.ObjectId): Promise<void> {
    this.logger.log(
      `Removing speaker with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find and delete by both _id and tenantId to ensure tenant-scoping
      const result = await this.speakerModel
        .deleteOne({ _id: id, tenantId })
        .exec();
      if (result.deletedCount === 0) {
        throw new NotFoundException(
          `Speaker with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to remove speaker with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to remove speaker with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async getSchedulesBySpeakerId(
    tenantId: Types.ObjectId,
    speakerId: Types.ObjectId,
    filterDto: FilterEventScheduleDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<{
    eventSchedules: EventSchedule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching event schedules for speaker ${speakerId.toHexString()} in tenant ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );

    // Validate speakerId
    if (!Types.ObjectId.isValid(speakerId)) {
      throw new BadRequestException('Invalid speakerId format.');
    }

    // Build initial match conditions
    const initialMatchConditions: any[] = [
      { tenantId },
      { speakers: speakerId },
    ];

    // Handle additional filters from FilterEventScheduleDto
    if (filterDto.eventId) {
      initialMatchConditions.push({ eventId: filterDto.eventId });
    }

    if (filterDto.sessionType) {
      initialMatchConditions.push({ sessionType: filterDto.sessionType });
    }

    // Combine initial conditions
    const finalInitialMatchQuery =
      initialMatchConditions.length > 1
        ? { $and: initialMatchConditions }
        : initialMatchConditions[0];

    // Build aggregation pipeline
    const pipeline: any[] = [
      { $match: finalInitialMatchQuery },
      {
        $lookup: {
          from: 'speakers',
          localField: 'speakers',
          foreignField: '_id',
          as: 'speakers',
        },
      },
      {
        $addFields: {
          eventObjectId: {
            $cond: {
              if: {
                $and: [
                  { $ne: ['$eventId', null] },
                  { $ne: ['$eventId', ''] },
                  { $eq: [{ $type: '$eventId' }, 'string'] },
                ],
              },
              then: {
                $cond: {
                  if: {
                    $regexMatch: {
                      input: '$eventId',
                      regex: '^[0-9a-fA-F]{24}$',
                    },
                  },
                  then: { $toObjectId: '$eventId' },
                  else: null,
                },
              },
              else: null,
            },
          },
        },
      },
      {
        $lookup: {
          from: 'events',
          localField: 'eventObjectId',
          foreignField: '_id',
          as: 'event',
        },
      },
      {
        $unwind: {
          path: '$event',
          preserveNullAndEmptyArrays: true,
        },
      },
    ];

    // Handle search or specific title/location filters
    if (filterDto.search) {
      const searchRegex = new RegExp(filterDto.search, 'i');
      pipeline.push({
        $match: {
          $or: [
            { title: searchRegex },
            { location: searchRegex },
            { 'speakers.name': searchRegex },
            { 'speakers.bio': searchRegex },
            { 'event.title': searchRegex },
            { 'event.description': searchRegex },
          ],
        },
      });
    } else {
      if (filterDto.title) {
        pipeline.push({
          $match: { title: { $regex: filterDto.title, $options: 'i' } },
        });
      }
      if (filterDto.location) {
        pipeline.push({
          $match: { location: { $regex: filterDto.location, $options: 'i' } },
        });
      }
    }

    // Add eventTitle and exclude event and eventObjectId
    pipeline.push(
      {
        $addFields: {
          eventTitle: '$event.title',
        },
      },
      {
        $project: {
          event: 0,
          eventObjectId: 0,
        },
      },
    );

    try {
      // Count total documents
      const countPipeline = [...pipeline, { $count: 'total' }];
      const countResult = await this.eventScheduleModel
        .aggregate(countPipeline)
        .exec();
      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / limit) || 1;

      // Add pagination and sorting
      pipeline.push(
        { $sort: { startTime: 1 } },
        { $skip: (page - 1) * limit },
        { $limit: limit },
      );

      const eventSchedules = await this.eventScheduleModel
        .aggregate(pipeline)
        .exec();

      this.logger.log(
        `Found ${eventSchedules.length} event schedules for speaker ${speakerId.toHexString()} (total: ${total}, page: ${page}/${totalPages}) in tenant ${tenantId.toHexString()}`,
      );

      return {
        eventSchedules,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch event schedules for speaker ${speakerId.toHexString()} in tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to retrieve event schedules.',
      );
    }
  }
}
