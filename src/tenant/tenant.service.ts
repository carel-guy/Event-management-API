import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Tenant } from './entities/tenant.entity';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { FilterTenantDto } from './dto/filter-tenant.dto';
import { KeycloakService } from '../keycloak/keycloak.service';
import slugify from 'slugify';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class TenantService {
  private readonly logger = new Logger(TenantService.name);

  constructor(
    @InjectModel(Tenant.name) private readonly tenantModel: Model<Tenant>,
    private readonly keycloakService: KeycloakService,
    private readonly configService: ConfigService,
  ) {}

  async create(createTenantDto: CreateTenantDto): Promise<Tenant> {
    const { name } = createTenantDto;

    // Generate a URL-friendly realm name from the tenant name.
    const realm = slugify(name, { lower: true, strict: true });
    this.logger.log(
      `Attempting to create tenant '${name}' with realm '${realm}'`,
    );

    // Retrieve the static client ID from configuration. This ensures all tenants use the same client.
    const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');
    if (!clientId) {
      this.logger.error(
        'KEYCLOAK_CLIENT_ID is not set in the environment variables.',
      );
      throw new InternalServerErrorException(
        'Server configuration error: Keycloak client ID is missing.',
      );
    }
    this.logger.log(`Using static Keycloak client ID: ${clientId}`);

    // Check if a tenant with the same name or realm already exists to prevent duplicates.
    const existingTenant = await this.tenantModel
      .findOne({ $or: [{ name }, { realm }] })
      .exec();
    if (existingTenant) {
      this.logger.warn(
        `Tenant with name '${name}' or realm '${realm}' already exists.`,
      );
      throw new ConflictException(
        `Tenant with name '${name}' or realm '${realm}' already exists.`,
      );
    }

    // Ensure the realm exists in Keycloak. This is idempotent.
    await this.keycloakService.ensureRealmExists(realm);
    this.logger.log(`Realm '${realm}' ensured in Keycloak.`);

    // Create and save the new tenant record in the database.
    const newTenant = new this.tenantModel({
      name,
      realm,
      clientId, // Use the static client ID.
    });

    const savedTenant = await newTenant.save();
    this.logger.log(
      `Tenant '${name}' created successfully with ID: ${savedTenant._id}`,
    );
    return savedTenant;
  }

  async findAll(filter: FilterTenantDto): Promise<{
    tenants: Tenant[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { name, status, page = '1', limit = '10' } = filter;
    const query: any = {};
    if (name) query.name = { $regex: name, $options: 'i' };
    if (status) query.status = status;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const [tenants, total] = await Promise.all([
      this.tenantModel.find(query).skip(skip).limit(limitNum).exec(),
      this.tenantModel.countDocuments(query).exec(),
    ]);
    const totalPages = Math.ceil(total / limitNum) || 1;
    return { tenants, total, page: pageNum, limit: limitNum, totalPages };
  }

  async findOne(id: string): Promise<Tenant> {
    const tenant = await this.tenantModel.findById(id).exec();
    if (!tenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    return tenant;
  }

  async update(id: string, updateTenantDto: UpdateTenantDto): Promise<Tenant> {
    const existingTenant = await this.tenantModel
      .findByIdAndUpdate(id, updateTenantDto, { new: true })
      .exec();

    if (!existingTenant) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    return existingTenant;
  }

  async remove(id: string): Promise<any> {
    const result = await this.tenantModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`Tenant with ID "${id}" not found`);
    }
    return { message: `Tenant with ID "${id}" successfully deleted` };
  }
}
