// src/custom-field/custom-field.service.ts
import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { FilterCustomFieldDto } from './dto/filter-custom-field.dto';
import { CustomField } from './entities/custom-field.entity';

@Injectable()
export class CustomFieldService {
  private readonly logger = new Logger(CustomFieldService.name);

  constructor(
    @InjectModel(CustomField.name) private customFieldModel: Model<CustomField>,
  ) {}

  async create(
    tenantId: Types.ObjectId,
    createCustomFieldDto: CreateCustomFieldDto,
  ): Promise<CustomField> {
    this.logger.log(
      `Attempting to create custom field for tenantId: ${tenantId.toHexString()} with key: ${createCustomFieldDto.key}`,
    );

    const existingField = await this.customFieldModel
      .findOne({
        tenantId: tenantId,
        key: createCustomFieldDto.key,
      })
      .exec();

    if (existingField) {
      this.logger.warn(
        `Conflict: Custom field with key "${createCustomFieldDto.key}" already exists for tenantId: ${tenantId.toHexString()}`,
      );
      throw new ConflictException(
        `Custom field with key "${createCustomFieldDto.key}" already exists for this tenant.`,
      );
    }

    const createdCustomField = new this.customFieldModel({
      ...createCustomFieldDto,
      tenantId: tenantId,
    });

    try {
      const savedField = await createdCustomField.save();
      this.logger.log(
        `Successfully created custom field with ID: ${savedField._id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return savedField;
    } catch (error) {
      this.logger.error(
        `Failed to save custom field for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
    filterDto: FilterCustomFieldDto,
  ): Promise<{
    customFields: CustomField[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching all custom fields for tenantId: ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );
    const {
      key,
      type,
      label,
      required,
      hasOptions,
      page = 1,
      limit = 10,
    } = filterDto;

    const query: any = { tenantId: tenantId };

    if (key) {
      query.key = { $regex: key, $options: 'i' };
    }
    if (type) {
      query.type = type;
    }
    if (label) {
      query.label = { $regex: label, $options: 'i' };
    }
    if (required !== undefined) {
      query.required = required;
    }
    if (hasOptions !== undefined) {
      if (hasOptions) {
        query.options = { $exists: true, $not: { $size: 0 } };
      } else {
        query.options = { $exists: true, $size: 0 };
      }
    }

    try {
      const total = await this.customFieldModel.countDocuments(query).exec();
      const customFields = await this.customFieldModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      const totalPages = Math.ceil(total / limit) || 1;

      this.logger.log(
        `Found ${customFields.length} custom fields (total: ${total}) for tenantId: ${tenantId.toHexString()} on page ${page}`,
      );
      return {
        customFields,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch custom fields for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<CustomField> {
    this.logger.log(
      `Attempting to find custom field with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    const customField = await this.customFieldModel
      .findOne({ _id: id, tenantId: tenantId })
      .exec();
    if (!customField) {
      this.logger.warn(
        `NotFound: Custom field with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()}`,
      );
      throw new NotFoundException(
        `CustomField with ID "${id}" not found or does not belong to this tenant.`,
      );
    }
    this.logger.log(
      `Found custom field with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    return customField;
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updateCustomFieldDto: UpdateCustomFieldDto,
  ): Promise<CustomField> {
    this.logger.log(
      `Attempting to update custom field with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );

    if (updateCustomFieldDto.key) {
      this.logger.debug(
        `Checking for unique key "${updateCustomFieldDto.key}" during update for ID: ${id.toHexString()}`,
      );
      const existingField = await this.customFieldModel
        .findOne({
          tenantId: tenantId,
          key: updateCustomFieldDto.key,
          _id: { $ne: id },
        })
        .exec();

      if (existingField) {
        this.logger.warn(
          `Conflict: Custom field with key "${updateCustomFieldDto.key}" already exists for tenantId: ${tenantId.toHexString()} (excluding current ID: ${id.toHexString()})`,
        );
        throw new ConflictException(
          `Custom field with key "${updateCustomFieldDto.key}" already exists for this tenant.`,
        );
      }
    }

    try {
      const updatedCustomField = await this.customFieldModel
        .findOneAndUpdate(
          { _id: id, tenantId: tenantId },
          updateCustomFieldDto,
          { new: true },
        )
        .exec();
      if (!updatedCustomField) {
        this.logger.warn(
          `NotFound: Custom field with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()} during update.`,
        );
        throw new NotFoundException(
          `CustomField with ID "${id}" not found or does not belong to this tenant.`,
        );
      }
      this.logger.log(
        `Successfully updated custom field with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return updatedCustomField;
    } catch (error) {
      this.logger.error(
        `Failed to update custom field with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(tenantId: Types.ObjectId, id: Types.ObjectId): Promise<any> {
    this.logger.log(
      `Attempting to remove custom field with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    try {
      const result = await this.customFieldModel
        .deleteOne({ _id: id, tenantId: tenantId })
        .exec();
      if (result.deletedCount === 0) {
        this.logger.warn(
          `NotFound: Custom field with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()} during deletion.`,
        );
        throw new NotFoundException(
          `CustomField with ID "${id}" not found or does not belong to this tenant.`,
        );
      }
      this.logger.log(
        `Successfully removed custom field with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return { message: 'CustomField successfully deleted.' };
    } catch (error) {
      this.logger.error(
        `Failed to remove custom field with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
