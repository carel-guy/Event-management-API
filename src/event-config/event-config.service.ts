// src/event-config/event-config.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEventConfigDto } from './dto/create-event-config.dto';
import { UpdateEventConfigDto } from './dto/update-event-config.dto';
import { FilterEventConfigDto } from './dto/filter-event-config.dto';
import {
  EventConfig,
  EventConfigDocument,
} from './entities/event-config.entity';

@Injectable()
export class EventConfigService {
  private readonly logger = new Logger(EventConfigService.name);
  constructor(
    @InjectModel(EventConfig.name)
    private eventConfigModel: Model<EventConfigDocument>,
  ) {}

  async create(
    tenantId: Types.ObjectId,
    createEventConfigDto: CreateEventConfigDto,
  ): Promise<EventConfig> {
    this.logger.log(
      `Creating new event config for tenant ${tenantId.toHexString()} with data: ${JSON.stringify(createEventConfigDto)}`,
    );
    try {
      // Check for existing config for this eventId within the same tenant
      const existingConfig = await this.eventConfigModel
        .findOne({
          tenantId: tenantId, // Filter by tenantId
          eventId: createEventConfigDto.eventId,
        })
        .exec();

      if (existingConfig) {
        throw new ConflictException(
          `EventConfig for event ID "${createEventConfigDto.eventId.toHexString()}" already exists for tenant "${tenantId.toHexString()}".`,
        );
      }

      const createdConfig = new this.eventConfigModel({
        ...createEventConfigDto,
        tenantId, // Assign tenantId from UserContext
      });
      return await createdConfig.save();
    } catch (error) {
      this.logger.error(
        `Failed to create event config for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Failed to create event configuration.',
      );
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
    filterDto: FilterEventConfigDto,
  ): Promise<{
    eventConfigs: EventConfig[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching all event configs for tenant ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );

    // Destructure filterDto, ensuring default values for page and limit
    const { eventId, isRegistrationOpen, page = 1, limit = 10 } = filterDto;

    const query: any = { tenantId }; // Always filter by tenantId

    if (eventId) {
      query.eventId = eventId;
    }
    if (isRegistrationOpen !== undefined) {
      query.isRegistrationOpen = isRegistrationOpen;
    }

    try {
      const total = await this.eventConfigModel.countDocuments(query).exec();
      const totalPages = Math.ceil(total / limit) || 1; // Ensure totalPages is at least 1
      const eventConfigs = await this.eventConfigModel
        .find(query)
        .populate('eventId') // Populate eventId reference
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      this.logger.log(
        `Found ${eventConfigs.length} event configs (total: ${total}, page: ${page}/${totalPages}) for tenant ${tenantId.toHexString()}`,
      );
      return { eventConfigs, total, page, limit, totalPages };
    } catch (error) {
      this.logger.error(
        `Failed to fetch event configurations for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve event configurations.',
      );
    }
  }

  async findOne(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<EventConfig> {
    this.logger.log(
      `Finding event config with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find by both _id and tenantId to ensure tenant-scoping, and populate eventId reference
      const eventConfig = await this.eventConfigModel
        .findOne({ _id: id, tenantId })
        .populate('eventId')
        .exec();
      if (!eventConfig) {
        throw new NotFoundException(
          `EventConfig with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return eventConfig;
    } catch (error) {
      this.logger.error(
        `Failed to find event config with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve event config with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async findByEventId(
    tenantId: Types.ObjectId,
    eventId: Types.ObjectId,
  ): Promise<EventConfig> {
    this.logger.log(
      `Finding event config for event ID: ${eventId.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find by both eventId and tenantId to ensure tenant-scoping
      const eventConfig = await this.eventConfigModel
        .findOne({ eventId: eventId, tenantId: tenantId })
        .exec();
      if (!eventConfig) {
        throw new NotFoundException(
          `EventConfig for event ID "${eventId.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return eventConfig;
    } catch (error) {
      this.logger.error(
        `Failed to find event config for event ID: ${eventId.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve event config for event ID "${eventId.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updateEventConfigDto: UpdateEventConfigDto,
  ): Promise<EventConfig> {
    this.logger.log(
      `Updating event config with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()} with data: ${JSON.stringify(updateEventConfigDto)}`,
    );
    try {
      // Find and update by both _id and tenantId to ensure tenant-scoping
      const updatedConfig = await this.eventConfigModel
        .findOneAndUpdate(
          { _id: id, tenantId },
          { $set: updateEventConfigDto },
          { new: true },
        )
        .exec();

      if (!updatedConfig) {
        throw new NotFoundException(
          `EventConfig with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return updatedConfig;
    } catch (error) {
      this.logger.error(
        `Failed to update event config with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update event config with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async remove(tenantId: Types.ObjectId, id: Types.ObjectId): Promise<void> {
    this.logger.log(
      `Removing event config with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find and delete by both _id and tenantId to ensure tenant-scoping
      const deletedConfig = await this.eventConfigModel
        .findOneAndDelete({ _id: id, tenantId })
        .exec();
      if (!deletedConfig) {
        throw new NotFoundException(
          `EventConfig with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      // Return void for 204 No Content success
    } catch (error) {
      this.logger.error(
        `Failed to remove event config with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to remove event config with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }
}
