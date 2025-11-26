import {
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { FilterPartnerDto } from './dto/filter-partner.dto';
import { Partner, PartnerDocument } from './entities/partner.entity';

@Injectable()
export class PartnerService {
  private readonly logger = new Logger(PartnerService.name);

  constructor(
    @InjectModel(Partner.name) private partnerModel: Model<PartnerDocument>,
  ) {}

  async create(
    tenantId: Types.ObjectId,
    createPartnerDto: CreatePartnerDto,
  ): Promise<Partner> {
    try {
      const createdPartner = new this.partnerModel({
        ...createPartnerDto,
        tenantId,
      });
      return await createdPartner.save();
    } catch (error) {
      this.logger.error(
        `Failed to create partner for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create partner.');
    }
  }

  async findAll(
    tenantId: Types.ObjectId,
    filterDto: FilterPartnerDto,
  ): Promise<{
    partners: Partner[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { name, category, page = 1, limit = 10 } = filterDto;

    const query: any = { tenantId };

    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }
    if (category) {
      query.category = category;
    }

    try {
      const total = await this.partnerModel.countDocuments(query).exec();

      const totalPages = Math.ceil(total / limit) || 1;

      const partners = await this.partnerModel
        .find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .exec();

      return { partners, total, page, limit, totalPages };
    } catch (error) {
      this.logger.error(
        `Failed to fetch partners for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to retrieve partners.');
    }
  }

  async findById(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
  ): Promise<Partner> {
    try {
      const partner = await this.partnerModel
        .findOne({ _id: id, tenantId })
        .exec();
      if (!partner) {
        throw new NotFoundException(
          `Partner with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }

      return partner;
    } catch (error) {
      this.logger.error(
        `Failed to find partner with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to retrieve partner with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async update(
    tenantId: Types.ObjectId,
    id: Types.ObjectId,
    updatePartnerDto: UpdatePartnerDto,
  ): Promise<Partner> {
    try {
      const updatedPartner = await this.partnerModel
        .findOneAndUpdate({ _id: id, tenantId }, updatePartnerDto, {
          new: true,
        })
        .exec();
      if (!updatedPartner) {
        throw new NotFoundException(
          `Partner with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
      return updatedPartner;
    } catch (error) {
      this.logger.error(
        `Failed to update partner with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to update partner with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }

  async remove(tenantId: Types.ObjectId, id: Types.ObjectId): Promise<void> {
    try {
      const deletedPartner = await this.partnerModel
        .findOneAndDelete({ _id: id, tenantId })
        .exec();
      if (!deletedPartner) {
        throw new NotFoundException(
          `Partner with ID "${id.toHexString()}" not found for tenant "${tenantId.toHexString()}".`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Failed to remove partner with ID: ${id.toHexString()} for tenant ${tenantId.toHexString()}. Error: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException(
        `Failed to remove partner with ID "${id.toHexString()}" for tenant "${tenantId.toHexString()}".`,
      );
    }
  }
}
