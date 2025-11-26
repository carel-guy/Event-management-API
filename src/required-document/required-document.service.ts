// src/required-document/required-document.service.ts

import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateRequiredDocumentDto } from './dto/create-required-document.dto';
import { UpdateRequiredDocumentDto } from './dto/update-required-document.dto';
import { FilterRequiredDocumentDto } from './dto/filter-required-document.dto';
import { RequiredDocument } from './entities/required-document.entity';

@Injectable()
export class RequiredDocumentService {
  private readonly logger = new Logger(RequiredDocumentService.name);

  constructor(
    @InjectModel(RequiredDocument.name)
    private requiredDocumentModel: Model<RequiredDocument>,
  ) {}

  async create(
    tenantId: Types.ObjectId,
    createRequiredDocumentDto: CreateRequiredDocumentDto,
  ): Promise<RequiredDocument> {
    this.logger.log(
      `Attempting to create required document for tenantId: ${tenantId.toHexString()} with key: ${createRequiredDocumentDto.key}`,
    );

    const existingDocument = await this.requiredDocumentModel
      .findOne({
        tenantId: tenantId,
        key: createRequiredDocumentDto.key,
      })
      .exec();

    if (existingDocument) {
      this.logger.warn(
        `Conflict: Required document with key "${createRequiredDocumentDto.key}" already exists for tenantId: ${tenantId.toHexString()}`,
      );
      throw new ConflictException(
        `Required document with key "${createRequiredDocumentDto.key}" already exists for this tenant.`,
      );
    }

    const createdRequiredDocument = new this.requiredDocumentModel({
      ...createRequiredDocumentDto,
      tenantId: tenantId,
    });

    try {
      const savedDocument = await createdRequiredDocument.save();
      this.logger.log(
        `Successfully created required document with ID: ${savedDocument._id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return savedDocument;
    } catch (error) {
      this.logger.error(
        `Failed to save required document for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
    filterDto: FilterRequiredDocumentDto,
  ): Promise<{
    requiredDocuments: RequiredDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching all required documents for tenantId: ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );
    const { key, label, page = 1, limit = 10 } = filterDto;

    const query: any = { tenantId: tenantId };

    if (key) {
      query.key = { $regex: key, $options: 'i' };
    }
    if (label) {
      query.label = { $regex: label, $options: 'i' };
    }

    try {
      const total = await this.requiredDocumentModel
        .countDocuments(query)
        .exec();
      const totalPages = Math.ceil(total / limit);
      const requiredDocuments = await this.requiredDocumentModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      this.logger.log(
        `Found ${requiredDocuments.length} required documents (total: ${total}) for tenantId: ${tenantId.toHexString()} on page ${page}`,
      );
      return {
        requiredDocuments,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch required documents for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async findOne(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<RequiredDocument> {
    this.logger.log(
      `Attempting to find required document with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    const requiredDocument = await this.requiredDocumentModel
      .findOne({ _id: id, tenantId: tenantId })
      .exec();
    if (!requiredDocument) {
      this.logger.warn(
        `NotFound: Required document with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()}`,
      );
      throw new NotFoundException(
        `RequiredDocument with ID "${id}" not found or does not belong to this tenant.`,
      );
    }
    this.logger.log(
      `Found required document with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    return requiredDocument;
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updateRequiredDocumentDto: UpdateRequiredDocumentDto,
  ): Promise<RequiredDocument> {
    this.logger.log(
      `Attempting to update required document with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );

    if (updateRequiredDocumentDto.key) {
      this.logger.debug(
        `Checking for unique key "${updateRequiredDocumentDto.key}" during update for ID: ${id.toHexString()}`,
      );
      const existingDocument = await this.requiredDocumentModel
        .findOne({
          tenantId: tenantId,
          key: updateRequiredDocumentDto.key,
          _id: { $ne: id },
        })
        .exec();

      if (existingDocument) {
        this.logger.warn(
          `Conflict: Required document with key "${updateRequiredDocumentDto.key}" already exists for tenantId: ${tenantId.toHexString()} (excluding current ID: ${id.toHexString()})`,
        );
        throw new ConflictException(
          `Required document with key "${updateRequiredDocumentDto.key}" already exists for this tenant.`,
        );
      }
    }

    try {
      const updatedRequiredDocument = await this.requiredDocumentModel
        .findOneAndUpdate(
          { _id: id, tenantId: tenantId },
          updateRequiredDocumentDto,
          { new: true },
        )
        .exec();
      if (!updatedRequiredDocument) {
        this.logger.warn(
          `NotFound: Required document with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()} during update.`,
        );
        throw new NotFoundException(
          `RequiredDocument with ID "${id}" not found or does not belong to this tenant.`,
        );
      }
      this.logger.log(
        `Successfully updated required document with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return updatedRequiredDocument;
    } catch (error) {
      this.logger.error(
        `Failed to update required document with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }

  async remove(tenantId: Types.ObjectId, id: Types.ObjectId): Promise<any> {
    this.logger.log(
      `Attempting to remove required document with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    try {
      const result = await this.requiredDocumentModel
        .deleteOne({ _id: id, tenantId: tenantId })
        .exec();
      if (result.deletedCount === 0) {
        this.logger.warn(
          `NotFound: Required document with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()} during deletion.`,
        );
        throw new NotFoundException(
          `RequiredDocument with ID "${id}" not found or does not belong to this tenant.`,
        );
      }
      this.logger.log(
        `Successfully removed required document with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return { message: 'RequiredDocument successfully deleted.' };
    } catch (error) {
      this.logger.error(
        `Failed to remove required document with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw error;
    }
  }
}
