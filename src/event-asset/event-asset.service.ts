import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateEventAssetDto } from './dto/create-event-asset.dto';
import { UpdateEventAssetDto } from './dto/update-event-asset.dto';
import { FilterEventAssetDto } from './dto/filter-event-asset.dto';
import { EventAsset, EventAssetDocument } from './entities/event-asset.entity';

@Injectable()
export class EventAssetService {
  private readonly logger = new Logger(EventAssetService.name);
  constructor(
    @InjectModel(EventAsset.name)
    private eventAssetModel: Model<EventAssetDocument>,
  ) {}

  async create(
    tenantId: Types.ObjectId,
    createEventAssetDto: CreateEventAssetDto,
  ): Promise<EventAsset> {
    this.logger.log(
      `Creating new event asset for tenant ${tenantId.toHexString()}: ${JSON.stringify(createEventAssetDto)}`,
    );
    try {
      const createdAsset = new this.eventAssetModel({
        ...createEventAssetDto,
        tenantId,
      });
      return await createdAsset.save();
    } catch (error) {
      this.logger.error(
        `Failed to create event asset for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create event asset.');
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
    filterDto: FilterEventAssetDto,
  ): Promise<{
    eventAssets: EventAsset[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching all event assets for tenant ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );

    const { eventId, name, page = 1, limit = 10 } = filterDto;

    const query: any = { tenantId };

    if (eventId) {
      query.eventId = eventId;
    }
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    try {
      const total = await this.eventAssetModel.countDocuments(query).exec();
      const totalPages = Math.ceil(total / limit) || 1;

      const eventAssets = await this.eventAssetModel
        .find(query)
        .populate('eventId') // Populate the eventId reference
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      this.logger.log(
        `Found ${eventAssets.length} event assets (total: ${total}, page: ${page}/${totalPages}) for tenant ${tenantId.toHexString()}`,
      );

      return { eventAssets, total, page, limit, totalPages };
    } catch (error) {
      this.logger.error(
        `Failed to fetch event assets for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve event assets.',
      );
    }
  }

  async findOne(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<EventAsset> {
    this.logger.log(
      `Finding event asset with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find by both _id and tenantId to ensure tenant-scoping, and populate eventId
      const eventAsset = await this.eventAssetModel
        .findOne({ _id: id, tenantId })
        .populate('eventId')
        .exec();
      if (!eventAsset) {
        throw new NotFoundException(
          `EventAsset with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return eventAsset;
    } catch (error) {
      this.logger.error(
        `Failed to find event asset with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve event asset with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updateEventAssetDto: UpdateEventAssetDto,
  ): Promise<EventAsset> {
    this.logger.log(
      `Updating event asset with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()} with data: ${JSON.stringify(updateEventAssetDto)}`,
    );
    try {
      // Find and update by both _id and tenantId to ensure tenant-scoping
      const updatedAsset = await this.eventAssetModel
        .findOneAndUpdate(
          { _id: id, tenantId },
          { $set: updateEventAssetDto },
          { new: true },
        )
        .exec();

      if (!updatedAsset) {
        throw new NotFoundException(
          `EventAsset with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return updatedAsset;
    } catch (error) {
      this.logger.error(
        `Failed to update event asset with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update event asset with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async remove(tenantId: Types.ObjectId, id: Types.ObjectId): Promise<void> {
    this.logger.log(
      `Removing event asset with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}`,
    );
    try {
      // Find and delete by both _id and tenantId to ensure tenant-scoping
      const deletedAsset = await this.eventAssetModel
        .findOneAndDelete({ _id: id, tenantId })
        .exec();
      if (!deletedAsset) {
        throw new NotFoundException(
          `EventAsset with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      // Return void as per typical REST DELETE for 204 No Content
    } catch (error) {
      this.logger.error(
        `Failed to remove event asset with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to remove event asset with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }
}
