import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEventScheduleDto } from './dto/create-event-schedule.dto';
import { UpdateEventScheduleDto } from './dto/update-event-schedule.dto';
import { FilterEventScheduleDto } from './dto/filter-event-schedule.dto';
import {
  EventSchedule,
  EventScheduleDocument,
} from './entities/event-schedule.entity';
import { Speaker, SpeakerDocument } from 'src/speaker/entities/speaker.entity';
import {
  FileReference,
  FileReferenceDocument,
} from 'src/file-reference/entities/file-reference.entity';
import { FilterSpeakersForEventDto } from './dto/filter-speakers-for-event.dto';
import { AddSpeakerToEventDto } from './dto/add-speaker-to-eventschedule.dto';

@Injectable()
export class EventScheduleService {
  private readonly logger = new Logger(EventScheduleService.name);

  constructor(
    @InjectModel(EventSchedule.name)
    private eventScheduleModel: Model<EventScheduleDocument>,
    @InjectModel(Event.name) private eventModel: Model<EventScheduleDocument>,
    @InjectModel(Speaker.name) private speakerModel: Model<SpeakerDocument>,
    @InjectModel(FileReference.name)
    private fileReferenceModel: Model<FileReferenceDocument>,
  ) {}

  async create(
    tenantId: Types.ObjectId,
    createEventScheduleDto: CreateEventScheduleDto,
  ): Promise<EventSchedule> {
    this.logger.log(
      `Creating new event schedule for tenant ${tenantId.toHexString()}: ${JSON.stringify(createEventScheduleDto)}`,
    );

    try {
      // Validate that the eventId exists
      if (createEventScheduleDto.eventId) {
        const eventExists = await this.eventModel
          .findOne({
            _id: createEventScheduleDto.eventId,
            tenantId,
          })
          .exec();

        if (!eventExists) {
          throw new BadRequestException(
            `Event with ID "${createEventScheduleDto.eventId}" not found for tenant "${tenantId.toHexString()}".`,
          );
        }
      }

      // Validate that all speaker IDs exist
      if (
        createEventScheduleDto.speakers &&
        createEventScheduleDto.speakers.length > 0
      ) {
        const existingSpeakers = await this.speakerModel
          .find({
            _id: { $in: createEventScheduleDto.speakers },
            tenantId,
          })
          .exec();

        if (
          existingSpeakers.length !== createEventScheduleDto.speakers.length
        ) {
          const existingSpeakerIds = existingSpeakers.map((speaker) =>
            (speaker._id as Types.ObjectId).toString(),
          );

          const missingSpeakerIds = createEventScheduleDto.speakers.filter(
            (speakerId) => !existingSpeakerIds.includes(speakerId.toString()),
          );
          throw new BadRequestException(
            `Speaker(s) with ID(s) [${missingSpeakerIds.join(', ')}] not found for tenant "${tenantId.toHexString()}".`,
          );
        }
      }

      // Validate that the imageFileReferenceId exists
      // if (createEventScheduleDto.imageFileReferenceId) {
      //   const fileReferenceExists = await this.fileReferenceModel.findOne({
      //     _id: createEventScheduleDto.imageFileReferenceId,
      //     tenantId
      //   }).exec();

      //   if (!fileReferenceExists) {
      //     throw new BadRequestException(`File reference with ID "${createEventScheduleDto.imageFileReferenceId}" not found for tenant "${tenantId.toHexString()}".`);
      //   }
      // }

      // If all validations pass, create the event schedule
      const createdSchedule = new this.eventScheduleModel({
        ...createEventScheduleDto,
        tenantId,
      });
      return await createdSchedule.save();
    } catch (error) {
      this.logger.error(
        `Failed to create event schedule for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );

      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Failed to create event schedule.',
      );
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
    filterDto: FilterEventScheduleDto,
  ): Promise<{
    eventSchedules: EventSchedule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching all event schedules for tenant ${tenantId.toHexString()} with filters: ${JSON.stringify(
        filterDto,
      )}`,
    );

    // --- Build the initial match conditions for the pipeline ---
    const initialMatchConditions: any[] = [{ tenantId: tenantId }];

    // Handle eventId filter (support string storage)
    if (filterDto.eventId) {
      initialMatchConditions.push({ eventId: filterDto.eventId });
    }

    // Handle speakerId filter
    if (filterDto.speakerId) {
      if (!Types.ObjectId.isValid(filterDto.speakerId)) {
        throw new BadRequestException('Invalid speakerId format.');
      }
      initialMatchConditions.push({
        speakers: new Types.ObjectId(filterDto.speakerId),
      });
    }

    // Handle sessionType filter
    if (filterDto.sessionType) {
      initialMatchConditions.push({ sessionType: filterDto.sessionType });
    }

    // Handle date range filters
    if (filterDto.startTimeFrom || filterDto.endTimeTo) {
      const dateRangeClause: any = {};
      if (filterDto.startTimeFrom) {
        if (isNaN(filterDto.startTimeFrom.getTime())) {
          throw new BadRequestException('Invalid startTimeFrom date format.');
        }
        dateRangeClause.startTime = { $gte: filterDto.startTimeFrom };
      }
      if (filterDto.endTimeTo) {
        if (isNaN(filterDto.endTimeTo.getTime())) {
          throw new BadRequestException('Invalid endTimeTo date format.');
        }
        dateRangeClause.endTime = { $lte: filterDto.endTimeTo };
      }
      if (Object.keys(dateRangeClause).length > 0) {
        initialMatchConditions.push(dateRangeClause);
      }
    }

    // Combine all initial conditions into a single $match object
    const finalInitialMatchQuery =
      initialMatchConditions.length > 1
        ? { $and: initialMatchConditions }
        : initialMatchConditions[0];

    // --- Build the aggregation pipeline ---
    const pipeline: any[] = [
      { $match: finalInitialMatchQuery }, // Apply initial filters
      {
        $lookup: {
          from: 'speakers',
          localField: 'speakers',
          foreignField: '_id',
          as: 'speakers',
        },
      },
      // Convert string eventId to ObjectId for lookup
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

    // Handle the 'search' filter or specific 'title' and 'location' filters
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
      // Apply specific title/location filters
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

    // Add eventTitle field
    pipeline.push({
      $addFields: {
        eventTitle: '$event.title',
      },
    });

    // Exclude event and eventObjectId fields
    pipeline.push({
      $project: {
        event: 0,
        eventObjectId: 0,
      },
    });

    // --- Pagination and Sorting ---
    const { page = 1, limit = 10 } = filterDto;

    try {
      // Create a separate pipeline for counting total documents
      const countPipeline = [...pipeline]; // Copy the pipeline up to projection
      countPipeline.push({ $count: 'total' });

      const countResult = await this.eventScheduleModel
        .aggregate(countPipeline)
        .exec();
      const total = countResult[0]?.total || 0;
      const totalPages = Math.ceil(total / limit) || 1;

      // Add sorting and pagination to the main pipeline
      pipeline.push({ $sort: { startTime: 1 } });
      pipeline.push({ $skip: (page - 1) * limit });
      pipeline.push({ $limit: limit });

      const eventSchedules = await this.eventScheduleModel
        .aggregate(pipeline)
        .exec();

      this.logger.log(
        `Found ${eventSchedules.length} event schedules (total: ${total}, page: ${page}/${totalPages}) for tenant ${tenantId.toHexString()}`,
      );

      return { eventSchedules, total, page, limit, totalPages };
    } catch (error) {
      this.logger.error(
        `Failed to fetch event schedules for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
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

  async findOne(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<EventSchedule> {
    this.logger.log(
      `Finding event schedule with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find by both _id and tenantId to ensure tenant-scoping
      const eventSchedule = await this.eventScheduleModel
        .findOne({ _id: id, tenantId })
        .populate([{ path: 'speakers' }, { path: 'eventId' }])
        .exec();
      if (!eventSchedule) {
        throw new NotFoundException(
          `EventSchedule with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return eventSchedule;
    } catch (error) {
      this.logger.error(
        `Failed to find event schedule with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve event schedule with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updateEventScheduleDto: UpdateEventScheduleDto,
  ): Promise<EventSchedule> {
    this.logger.log(
      `Updating event schedule with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()} with data: ${JSON.stringify(updateEventScheduleDto)}`,
    );
    try {
      // Find and update by both _id and tenantId to ensure tenant-scoping
      const updatedSchedule = await this.eventScheduleModel
        .findOneAndUpdate(
          { _id: id, tenantId },
          { $set: updateEventScheduleDto },
          { new: true },
        )
        .populate('speakers') // Populate after update to return full speaker details
        .exec();

      if (!updatedSchedule) {
        throw new NotFoundException(
          `EventSchedule with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return updatedSchedule;
    } catch (error) {
      this.logger.error(
        `Failed to update event schedule with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update event schedule with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async remove(tenantId: Types.ObjectId, id: Types.ObjectId): Promise<void> {
    this.logger.log(
      `Removing event schedule with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find and delete by both _id and tenantId to ensure tenant-scoping
      const deletedResult = await this.eventScheduleModel
        .findOneAndDelete({ _id: id, tenantId })
        .exec();
      if (!deletedResult) {
        throw new NotFoundException(
          `EventSchedule with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      // Return void as per typical REST DELETE for 204 No Content
    } catch (error) {
      this.logger.error(
        `Failed to remove event schedule with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to remove event schedule with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  // src/event-schedule/event-schedule.service.ts
  // Your Service File
  // async getSpeakersForEvent(
  //   tenantId: Types.ObjectId,
  //   filterDto: { eventId: string; name?: string; company?: string } // Adjusted type
  // ): Promise<Speaker[]> {
  //   this.logger.log(
  //     `Fetching speakers for event ${filterDto.eventId} and tenant ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`
  //   );

  //   const { eventId, name, company } = filterDto;

  //   // Your existing validation for eventId is still good here
  //   if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
  //     throw new BadRequestException('eventId must be a non-empty string');
  //   }

  //   const pipeline: any[] = [
  //     {
  //       $match: {
  //         tenantId,
  //         eventId: eventId, // eventId is stored as a string
  //       },
  //     },
  //     {
  //       $unwind: '$speakers',
  //     },
  //     {
  //       $group: {
  //         _id: '$speakers',
  //       },
  //     },
  //     {
  //       $lookup: {
  //         from: 'speakers',
  //         localField: '_id',
  //         foreignField: '_id',
  //         as: 'speaker',
  //       },
  //     },
  //     {
  //       $unwind: '$speaker',
  //     },
  //     {
  //       $match: {
  //         'speaker.tenantId': tenantId,
  //       },
  //     },
  //   ];

  //   if (name) {
  //     pipeline.push({
  //       $match: {
  //         'speaker.name': { $regex: name, $options: 'i' },
  //       },
  //     });
  //   }

  //   if (company) {
  //     pipeline.push({
  //       $match: {
  //         'speaker.company': { $regex: company, $options: 'i' },
  //       },
  //     });
  //   }

  //   pipeline.push({
  //     $replaceRoot: { newRoot: '$speaker' },
  //   });

  //   try {
  //     const speakers = await this.eventScheduleModel.aggregate(pipeline).exec();
  //     this.logger.log(
  //       `Retrieved ${speakers.length} speakers for event ${eventId} and tenant ${tenantId.toHexString()}`
  //     );
  //     return speakers;
  //   } catch (error) {
  //     this.logger.error(
  //       `Failed to get speakers for event ${eventId} and tenant ${tenantId.toHexString()}. Error: ${error.message}`,
  //       error.stack
  //     );
  //     throw new InternalServerErrorException('Failed to retrieve speakers for the event.');
  //   }
  // }

  async getSpeakersForEvent(
    tenantId: Types.ObjectId,
    eventId: string, // eventId is now a direct parameter
    filterDto: FilterSpeakersForEventDto,
  ): Promise<{
    speakers: Speaker[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching speakers for event ${eventId} and tenant ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );

    const { search, name, company, page = 1, limit = 10 } = filterDto;

    if (!eventId || typeof eventId !== 'string' || eventId.trim() === '') {
      throw new BadRequestException('eventId must be a non-empty string');
    }

    const pipeline: any[] = [
      {
        $match: {
          tenantId,
          eventId: eventId,
        },
      },
      {
        $unwind: '$speakers',
      },
      {
        $group: {
          _id: '$speakers',
        },
      },
      {
        $lookup: {
          from: 'speakers',
          localField: '_id',
          foreignField: '_id',
          as: 'speaker',
        },
      },
      {
        $unwind: '$speaker',
      },
      {
        $match: {
          'speaker.tenantId': tenantId,
        },
      },
    ];

    const searchConditions: any[] = [];

    if (search) {
      searchConditions.push(
        { 'speaker.name': { $regex: search, $options: 'i' } },
        { 'speaker.company': { $regex: search, $options: 'i' } },
      );
    } else {
      if (name) {
        searchConditions.push({
          'speaker.name': { $regex: name, $options: 'i' },
        });
      }
      if (company) {
        searchConditions.push({
          'speaker.company': { $regex: company, $options: 'i' },
        });
      }
    }

    if (searchConditions.length > 0) {
      pipeline.push({
        $match: {
          $or: searchConditions,
        },
      });
    }

    // Count total documents before pagination
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: 'total' });

    // Add pagination stages
    pipeline.push(
      {
        $skip: (page - 1) * limit,
      },
      {
        $limit: limit,
      },
      {
        $replaceRoot: { newRoot: '$speaker' },
      },
    );

    try {
      const [speakers, totalResult] = await Promise.all([
        this.eventScheduleModel.aggregate(pipeline).exec(),
        this.eventScheduleModel.aggregate(countPipeline).exec(),
      ]);

      const total = totalResult.length > 0 ? totalResult[0].total : 0;
      const totalPages = Math.ceil(total / limit);

      this.logger.log(
        `Retrieved ${speakers.length} speakers (total: ${total}) for event ${eventId} and tenant ${tenantId.toHexString()}`,
      );

      return { speakers, total, page, limit, totalPages };
    } catch (error) {
      this.logger.error(
        `Failed to get speakers for event ${eventId} and tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve speakers for the event.',
      );
    }
  }

  async addSpeakerToEventSchedule(
    tenantId: Types.ObjectId,
    addSpeakerDto: AddSpeakerToEventDto,
  ): Promise<EventSchedule> {
    const { eventScheduleId, speakerId } = addSpeakerDto;

    this.logger.log(
      `Attempting to add speaker ${speakerId} to event schedule ${eventScheduleId} for tenant ${tenantId.toHexString()}`,
    );

    // 1. Validate if eventScheduleId is a valid ObjectId
    if (!Types.ObjectId.isValid(eventScheduleId)) {
      throw new BadRequestException('Invalid eventScheduleId format.');
    }

    // 2. Validate if speakerId is a valid ObjectId
    if (!Types.ObjectId.isValid(speakerId)) {
      throw new BadRequestException('Invalid speakerId format.');
    }

    try {
      // 3. Check if the event schedule exists and belongs to the tenant
      const eventSchedule = await this.eventScheduleModel
        .findOne({
          _id: new Types.ObjectId(eventScheduleId),
          tenantId,
        })
        .exec();

      if (!eventSchedule) {
        throw new NotFoundException(
          `Event schedule with ID "${eventScheduleId}" not found for this tenant.`,
        );
      }

      // 4. Check if the speaker exists and belongs to the tenant
      const speaker = await this.speakerModel
        .findOne({
          _id: new Types.ObjectId(speakerId),
          tenantId,
        })
        .exec();

      if (!speaker) {
        throw new NotFoundException(
          `Speaker with ID "${speakerId}" not found for this tenant.`,
        );
      }

      // 5. Check if the speaker is already associated with this event schedule
      const speakerObjectId = new Types.ObjectId(speakerId);
      if (
        (eventSchedule.speakers ?? []).some(
          (s) => s && s.equals(speakerObjectId),
        )
      ) {
        // Ensure s is not null/undefined
        this.logger.warn(
          `Speaker ${speakerId} is already associated with event schedule ${eventScheduleId}.`,
        );
        // You might choose to throw a BadRequestException here or simply return the existing schedule
        return eventSchedule; // Return the existing schedule if already added
      }

      // 6. Add the speaker ID to the speakers array
      if (!eventSchedule.speakers) {
        eventSchedule.speakers = [];
      }
      eventSchedule.speakers.push(speakerObjectId); // Push as ObjectId
      await eventSchedule.save();

      this.logger.log(
        `Speaker ${speakerId} successfully added to event schedule ${eventScheduleId}.`,
      );
      return eventSchedule;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error; // Re-throw specific HTTP exceptions
      }
      this.logger.error(
        `Failed to add speaker ${speakerId} to event schedule ${eventScheduleId} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to add speaker to event schedule.',
      );
    }
  }
}
