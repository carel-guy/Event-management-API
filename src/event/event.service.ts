import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
  OnModuleInit,
  Inject,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { FilterEventDto } from './dto/filter-event.dto';
import { Event, EventDocument } from './entities/event.entity';
import { CustomField } from 'src/custom-field/entities/custom-field.entity';
import { RequiredDocument } from 'src/required-document/entities/required-document.entity';
import { FileReference } from 'src/file-reference/entities/file-reference.entity';
import { TarifRule } from 'src/tariff-rule/entities/tariff-rule.entity';
import { Partner } from 'src/partner/entities/partner.entity';
import { Speaker } from 'src/speaker/entities/speaker.entity';
import { EventSchedule } from 'src/event-schedule/entities/event-schedule.entity';
import { GetEventsByUserIdDto } from './dto/get-events-by-user-id.dto';
import { Client, ClientGrpc, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { join } from 'path';
import { Observable } from 'rxjs';

interface RegistrationService {
  validateRegistration(data: {
    registrationId: string;
    eventId: string;
    tenantId: string;
  }): Observable<{ isValid: boolean; message: string; status?: string }>;
}

@Injectable()
export class EventService implements OnModuleInit {
  private readonly logger = new Logger(EventService.name);

  private registrationService: RegistrationService;

  constructor(
    @Inject('REGISTRATION_SERVICE') private client: ClientGrpc,
    @InjectModel(Event.name) private eventModel: Model<Event>,
    @InjectModel(CustomField.name) private customFieldModel: Model<CustomField>,
    @InjectModel(RequiredDocument.name)
    private requiredDocumentModel: Model<RequiredDocument>,
    @InjectModel(FileReference.name)
    private fileReferenceModel: Model<FileReference>,
    @InjectModel(TarifRule.name) private tarifRuleModel: Model<TarifRule>,
    @InjectModel(Partner.name) private partnerModel: Model<Partner>,
    @InjectModel(EventSchedule.name)
    private eventScheduleModel: Model<EventSchedule>,
  ) {}

  onModuleInit() {
    this.registrationService = this.client.getService<RegistrationService>(
      'RegistrationService',
    );
  }

  private async validateAssociatedIds(
    tenantId: Types.ObjectId,
    dto: CreateEventDto | UpdateEventDto,
  ): Promise<void> {
    const checks: {
      ids: string[] | undefined;
      model: Model<any>;
      modelName: string;
    }[] = [
      {
        ids: Array.isArray(dto.requiredDocumentIds)
          ? dto.requiredDocumentIds
          : dto.requiredDocumentIds
            ? [dto.requiredDocumentIds]
            : undefined,
        model: this.requiredDocumentModel,
        modelName: 'RequiredDocument',
      },
      {
        ids: Array.isArray(dto.tariffRuleIds)
          ? dto.tariffRuleIds
          : dto.tariffRuleIds
            ? [dto.tariffRuleIds]
            : undefined,
        model: this.tarifRuleModel,
        modelName: 'TarifRule',
      },
      {
        ids: Array.isArray(dto.partnerIds)
          ? dto.partnerIds
          : dto.partnerIds
            ? [dto.partnerIds]
            : undefined,
        model: this.partnerModel,
        modelName: 'Partner',
      },
    ];

    for (const check of checks) {
      if (check.ids && check.ids.length > 0) {
        const objectIds = check.ids.map((id) => {
          if (!Types.ObjectId.isValid(id)) {
            throw new BadRequestException(
              `Invalid ID format for ${check.modelName}: ${id}`,
            );
          }
          return new Types.ObjectId(id);
        });

        const foundDocuments = await check.model
          .find({ _id: { $in: objectIds }, tenantId: tenantId })
          .exec();

        if (foundDocuments.length !== objectIds.length) {
          const foundIds = new Set(
            foundDocuments.map((doc) => doc._id.toHexString()),
          );
          const missingIds = objectIds
            .filter((id) => !foundIds.has(id.toHexString()))
            .map((id) => id.toHexString());
          this.logger.warn(
            `Missing or unauthorized ${check.modelName} IDs for tenantId ${tenantId.toHexString()}: ${missingIds.join(', ')}`,
          );
          throw new BadRequestException(
            `One or more provided ${check.modelName} IDs are invalid or do not belong to this tenant: ${missingIds.join(', ')}`,
          );
        }
      }
    }
  }

  async getEventConfig(data: { tenantId: string; eventId: string }) {
    const tenantId = new Types.ObjectId(data.tenantId);
    const event = await this.eventModel
      .findOne({ _id: data.eventId, tenantId })
      .exec();
    if (!event) {
      throw new Error('Event not found');
    }

    const requiredDocuments = await this.requiredDocumentModel
      .find({ _id: { $in: event.requiredDocumentIds }, tenantId })
      .exec();
    const tariffRules = await this.tarifRuleModel
      .find({ _id: { $in: event.tariffRuleIds }, tenantId })
      .exec();

    return {
      tenantId: data.tenantId,
      eventId: data.eventId,
      requiredDocuments: requiredDocuments.map((rd) => ({
        id: rd._id.toString(),
        key: rd.key,
        label: rd.label,
      })),
      tariffRules: tariffRules.map((tr) => ({
        id: tr._id.toString(),
        name: tr.name,
        amount: tr.amount,
        validFrom: tr.validFrom ? tr.validFrom.toISOString() : null,
        validUntil: tr.validUntil ? tr.validUntil.toISOString() : null,
      })),
    };
  }

  async create(
    tenantId: Types.ObjectId,
    createdBy: Types.ObjectId | null,
    createEventDto: CreateEventDto,
  ): Promise<Event> {
    this.logger.log(
      `Attempting to create event for tenantId: ${tenantId.toHexString()} with title: "${createEventDto.title}"`,
    );

    if (
      new Date(createEventDto.startDate) >= new Date(createEventDto.endDate)
    ) {
      throw new BadRequestException(
        'Event start date must be before end date.',
      );
    }

    await this.validateAssociatedIds(tenantId, createEventDto);

    const createdEvent = new this.eventModel({
      ...createEventDto,
      tenantId: tenantId,
      createdBy: createdBy,
      updatedBy: createdBy,
    });

    try {
      const savedEvent = await createdEvent.save();
      this.logger.log(
        `Successfully created event with ID: ${savedEvent._id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return savedEvent;
    } catch (error) {
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate key error creating event for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        );
        throw new ConflictException(
          'An event with the same unique identifier already exists.',
        );
      }
      this.logger.error(
        `Failed to save event for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create event.');
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
    filterDto: FilterEventDto,
  ): Promise<{
    events: Event[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching all events for tenantId: ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );

    const {
      search,
      title,
      type,
      format,
      status,
      startDateFrom,
      endDateTo,
      location,
      currency,
      minParticipants,
      maxParticipants,
      isPublic,
      page = 1,
      limit = 10,
      tenantId: filterTenantId, // <-- from DTO
    } = filterDto;

    // If filterTenantId is provided, validate it and override tenantId
    let effectiveTenantId: Types.ObjectId = tenantId;
    if (filterTenantId !== undefined && filterTenantId !== null) {
      if (!Types.ObjectId.isValid(filterTenantId)) {
        // Invalid tenantId filter, return nothing
        return { events: [], total: 0, page, limit, totalPages: 1 };
      }
      // Only allow filtering if the provided tenantId matches the authenticated tenantId
      if (filterTenantId !== tenantId.toHexString()) {
        // Provided tenantId does not match authenticated tenant, return nothing
        return { events: [], total: 0, page, limit, totalPages: 1 };
      }
      effectiveTenantId = new Types.ObjectId(filterTenantId);
    }

    const query: any = { tenantId: effectiveTenantId };

    if (search) {
      const searchRegex = { $regex: search, $options: 'i' };
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { 'locations.name': searchRegex },
        { 'locations.address': searchRegex },
      ];
    }

    const specificFilters: any = {};

    if (title) {
      specificFilters.title = { $regex: title, $options: 'i' };
    }
    if (type) {
      specificFilters.type = type;
    }
    if (format) {
      specificFilters.format = format;
    }
    if (status) {
      specificFilters.status = status;
    }
    if (location) {
      const locationRegex = { $regex: location, $options: 'i' };
      specificFilters.$or = [
        { 'locations.name': locationRegex },
        { 'locations.address': locationRegex },
      ];
    }
    if (currency) {
      specificFilters.currency = currency;
    }
    if (isPublic !== undefined) {
      specificFilters.isPublic = isPublic;
    }
    if (minParticipants || maxParticipants) {
      specificFilters.numberOfParticipants = {};
      if (minParticipants !== undefined) {
        specificFilters.numberOfParticipants.$gte = minParticipants;
      }
      if (maxParticipants !== undefined) {
        specificFilters.numberOfParticipants.$lte = maxParticipants;
      }
    }
    if (startDateFrom || endDateTo) {
      specificFilters.startDate = specificFilters.startDate || {};
      specificFilters.endDate = specificFilters.endDate || {};
      if (startDateFrom) {
        specificFilters.startDate.$gte = startDateFrom;
      }
      if (endDateTo) {
        specificFilters.endDate.$lte = endDateTo;
      }
    }

    if (Object.keys(specificFilters).length > 0) {
      if (query.$or) {
        query.$and = [
          { tenantId: effectiveTenantId },
          query.$or,
          specificFilters,
        ];
        delete query.tenantId;
        delete query.$or;
      } else {
        Object.assign(query, specificFilters);
      }
    }

    try {
      const total = await this.eventModel.countDocuments(query).exec();
      const totalPages = Math.ceil(total / limit) || 1;

      const events = await this.eventModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate('customFieldIds')
        .populate('requiredDocumentIds')
        .populate('fileReferenceIds')
        .populate('tariffRuleIds')
        .populate('partnerIds')
        .populate({
          path: 'eventScheduleIds',
          populate: {
            path: 'speakers', // This will populate speakers within each eventSchedule
            model: 'Speaker', // Make sure this matches the name of your Speaker model
            select: 'name bio company linkedinUrl speakerType profilePictureId', // Specify fields to retrieve
          },
        })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .exec();

      this.logger.log(
        `Found ${events.length} events (total: ${total}, page: ${page}/${totalPages}) for tenantId: ${effectiveTenantId.toHexString()}`,
      );

      return { events, total, page, limit, totalPages };
    } catch (error) {
      this.logger.error(
        `Failed to fetch events for tenantId: ${effectiveTenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve events.');
    }
  }

  async findOne(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<EventDocument> {
    this.logger.log(
      `Attempting to find event with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );

    const event = await this.eventModel
      .findOne({ _id: id, tenantId: tenantId })
      .populate('customFieldIds') // Populates the actual CustomField documents
      .populate('requiredDocumentIds') // Populates the actual RequiredDocument documents
      .populate('fileReferenceIds') // Populates the actual FileReference documents
      .populate('tariffRuleIds')
      .populate({
        path: 'eventScheduleIds',
        populate: {
          path: 'speakers', // This will populate speakers within each eventSchedule
          model: 'Speaker', // Make sure this matches the name of your Speaker model
          select: 'name bio company linkedinUrl speakerType profilePictureId', // Specify fields to retrieve
        },
      })
      .populate('partnerIds')

      // For createdBy and updatedBy, you might only need specific user fields (e.g., name, email)
      .populate('createdBy', 'name email') // Selects only 'name' and 'email' fields from User
      .populate('updatedBy', 'name email') // Selects only 'name' and 'email' fields from User
      .exec();

    if (!event) {
      this.logger.warn(
        `NotFound: Event with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()}`,
      );
      throw new NotFoundException(
        `Event with ID "${id}" not found or does not belong to this tenant.`,
      );
    }

    this.logger.log(
      `Found event with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    return event;
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updatedBy: Types.ObjectId | null,
    updateEventDto: UpdateEventDto,
  ): Promise<Event> {
    this.logger.log(
      `Attempting to update event with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );

    await this.validateAssociatedIds(tenantId, updateEventDto);

    const updatePayload: any = { ...updateEventDto, updatedBy: updatedBy };

    if (updateEventDto.startDate || updateEventDto.endDate) {
      const existingEvent = await this.eventModel
        .findOne({ _id: id, tenantId: tenantId })
        .exec();
      if (!existingEvent) {
        throw new NotFoundException(
          `Event with ID "${id}" not found or does not belong to this tenant.`,
        );
      }

      const newStartDate = updateEventDto.startDate
        ? new Date(updateEventDto.startDate)
        : existingEvent.startDate;
      const newEndDate = updateEventDto.endDate
        ? new Date(updateEventDto.endDate)
        : existingEvent.endDate;

      if (newStartDate >= newEndDate) {
        throw new BadRequestException(
          'Updated event start date must be before end date.',
        );
      }
      updatePayload.startDate = newStartDate;
      updatePayload.endDate = newEndDate;
    }

    try {
      const updatedEvent = await this.eventModel
        .findOneAndUpdate({ _id: id, tenantId: tenantId }, updatePayload, {
          new: true,
        })
        .exec();
      if (!updatedEvent) {
        this.logger.warn(
          `NotFound: Event with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()} during update.`,
        );
        throw new NotFoundException(
          `Event with ID "${id}" not found or does not belong to this tenant.`,
        );
      }
      this.logger.log(
        `Successfully updated event with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return updatedEvent;
    } catch (error) {
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate key error updating event for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        );
        throw new ConflictException(
          'An event with the same unique identifier already exists.',
        );
      }
      this.logger.error(
        `Failed to update event with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update event.');
    }
  }

  async remove(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Attempting to remove event with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    try {
      const result = await this.eventModel
        .deleteOne({ _id: id, tenantId: tenantId })
        .exec();
      if (result.deletedCount === 0) {
        this.logger.warn(
          `NotFound: Event with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()} during deletion.`,
        );
        throw new NotFoundException(
          `Event with ID "${id}" not found or does not belong to this tenant.`,
        );
      }
      this.logger.log(
        `Successfully removed event with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return { message: 'Event successfully deleted.' };
    } catch (error) {
      this.logger.error(
        `Failed to remove event with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete event.');
    }
  }

  async getEventsByUserId(
    tenantId: Types.ObjectId,
    dto: GetEventsByUserIdDto,
  ): Promise<{
    events: Event[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { userId, page = 1, limit = 10 } = dto;

    this.logger.log(
      `Fetching events created or updated by userId: ${userId} for tenantId: ${tenantId.toHexString()}`,
    );

    if (!Types.ObjectId.isValid(userId)) {
      throw new BadRequestException(`Invalid userId: ${userId}`);
    }

    const objectUserId = new Types.ObjectId(userId);

    const query = {
      tenantId,
      $or: [{ createdBy: objectUserId }, { updatedBy: objectUserId }],
    };

    try {
      const total = await this.eventModel.countDocuments(query).exec();
      const totalPages = Math.ceil(total / limit) || 1;

      const events = await this.eventModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 })
        .populate('customFieldIds')
        .populate('requiredDocumentIds')
        .populate('fileReferenceIds')
        .populate('tariffRuleIds')
        .populate('partnerIds')
        .populate({
          path: 'eventScheduleIds',
          populate: {
            path: 'speakers',
            model: 'Speaker',
            select: 'name bio company linkedinUrl speakerType profilePictureId',
          },
        })
        .populate('createdBy', 'name email')
        .populate('updatedBy', 'name email')
        .exec();

      this.logger.log(`Found ${events.length} events for userId: ${userId}`);

      return { events, total, page, limit, totalPages };
    } catch (error) {
      this.logger.error(
        `Failed to fetch events by userId: ${userId}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve events by user.',
      );
    }
  }

  async validateRegistration(
    eventId: string,
    registrationId: string,
    tenantId: string,
  ) {
    // First, validate the event itself
    if (!Types.ObjectId.isValid(eventId) || !Types.ObjectId.isValid(tenantId)) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Invalid event or tenant ID format.',
      });
    }

    const event = await this.eventModel.findOne({ _id: eventId, tenantId });

    if (!event) {
      throw new RpcException({
        code: status.NOT_FOUND,
        message: 'Event not found or does not belong to tenant.',
      });
    }

    // Now, call the registration service to validate the registration
    return this.registrationService.validateRegistration({
      registrationId,
      eventId,
      tenantId,
    });
  }

  async getEventByIdForGrpc(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<EventDocument> {
    const event = await this.eventModel
      .findOne({ _id: id, tenantId })
      .populate('tariffRuleIds')
      .populate('partnerIds')
      .populate({
        path: 'eventScheduleIds',
        populate: { path: 'speakers' },
      })
      .exec();

    if (!event) {
      this.logger.warn(
        `[gRPC] Event with ID "${id}" not found for tenantId: ${tenantId}`,
      );
      throw new RpcException({
        code: status.NOT_FOUND,
        message: `Event with ID "${id}" not found`,
      });
    }

    return event;
  }

  // src/event/event.service.ts
}
