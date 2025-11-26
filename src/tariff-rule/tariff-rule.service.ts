import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { FilterTarifRuleDto } from './dto/filter-tarif-rule.dto';
import { TarifRule } from './entities/tariff-rule.entity';
import { CreateTarifRuleDto } from './dto/create-tariff-rule.dto';
import { UpdateTarifRuleDto } from './dto/update-tariff-rule.dto';

@Injectable()
export class TarifRuleService {
  private readonly logger = new Logger(TarifRuleService.name);

  constructor(
    @InjectModel(TarifRule.name) private tarifRuleModel: Model<TarifRule>,
  ) {}

  async create(
    tenantId: Types.ObjectId,
    createTarifRuleDto: CreateTarifRuleDto,
  ): Promise<TarifRule> {
    this.logger.log(
      `Attempting to create tariff rule for tenantId: ${tenantId.toHexString()} with name: "${createTarifRuleDto.name}"`,
    );

    const createdTarifRule = new this.tarifRuleModel({
      ...createTarifRuleDto,
      tenantId: tenantId,
    });

    try {
      const savedTarifRule = await createdTarifRule.save();
      this.logger.log(
        `Successfully created tariff rule with ID: ${savedTarifRule._id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return savedTarifRule;
    } catch (error) {
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate key error creating tariff rule for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        );
        throw new ConflictException(
          'A tariff rule with the same unique identifier already exists.',
        );
      }
      this.logger.error(
        `Failed to save tariff rule for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create tariff rule.');
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
    filterDto: FilterTarifRuleDto,
  ): Promise<{
    tarifRules: TarifRule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    this.logger.log(
      `Fetching all tariff rules for tenantId: ${tenantId.toHexString()} with filters: ${JSON.stringify(filterDto)}`,
    );
    const {
      name,
      tariffType,
      currency,
      amountType,
      isActive,
      page = 1,
      limit = 10,
    } = filterDto;

    const query: any = { tenantId: tenantId };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (tariffType) {
      query.tariffType = tariffType; // Corrected to 'tariffType' as per schema
    }
    if (currency) {
      query.currency = currency;
    }
    if (amountType) {
      query.amountType = amountType; // Corrected from 'valueType' to 'amountType'
    }
    if (isActive !== undefined) {
      query.isActive = isActive;
    }

    try {
      const total = await this.tarifRuleModel.countDocuments(query).exec();
      const tarifRules = await this.tarifRuleModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      this.logger.log(
        `Found ${tarifRules.length} tariff rules (total: ${total}) for tenantId: ${tenantId.toHexString()} on page ${page}`,
      );
      return {
        tarifRules,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch tariff rules for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to retrieve tariff rules.',
      );
    }
  }

  async findOne(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<TarifRule> {
    this.logger.log(
      `Attempting to find tariff rule with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    const tarifRule = await this.tarifRuleModel
      .findOne({ _id: id, tenantId: tenantId })
      .exec();
    if (!tarifRule) {
      this.logger.warn(
        `NotFound: Tariff rule with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()}`,
      );
      throw new NotFoundException(
        `TarifRule with ID "${id}" not found or does not belong to this tenant.`,
      );
    }
    this.logger.log(
      `Found tariff rule with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    return tarifRule;
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updateTarifRuleDto: UpdateTarifRuleDto,
  ): Promise<TarifRule> {
    this.logger.log(
      `Attempting to update tariff rule with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );

    try {
      const updatedTarifRule = await this.tarifRuleModel
        .findOneAndUpdate({ _id: id, tenantId: tenantId }, updateTarifRuleDto, {
          new: true,
        })
        .exec();
      if (!updatedTarifRule) {
        this.logger.warn(
          `NotFound: Tariff rule with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()} during update.`,
        );
        throw new NotFoundException(
          `TarifRule with ID "${id}" not found or does not belong to this tenant.`,
        );
      }
      this.logger.log(
        `Successfully updated tariff rule with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return updatedTarifRule;
    } catch (error) {
      if (error.code === 11000) {
        this.logger.warn(
          `Duplicate key error updating tariff rule for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        );
        throw new ConflictException(
          'A tariff rule with the same unique identifier already exists.',
        );
      }
      this.logger.error(
        `Failed to update tariff rule with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update tariff rule.');
    }
  }

  async remove(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<{ message: string }> {
    this.logger.log(
      `Attempting to remove tariff rule with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
    );
    try {
      const result = await this.tarifRuleModel
        .deleteOne({ _id: id, tenantId: tenantId })
        .exec();
      if (result.deletedCount === 0) {
        this.logger.warn(
          `NotFound: Tariff rule with ID "${id.toHexString()}" not found or does not belong to tenantId: ${tenantId.toHexString()} during deletion.`,
        );
        throw new NotFoundException(
          `TarifRule with ID "${id}" not found or does not belong to this tenant.`,
        );
      }
      this.logger.log(
        `Successfully removed tariff rule with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}`,
      );
      return { message: 'TarifRule successfully deleted.' };
    } catch (error) {
      this.logger.error(
        `Failed to remove tariff rule with ID: ${id.toHexString()} for tenantId: ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete tariff rule.');
    }
  }
}
