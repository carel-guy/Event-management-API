import {
  Injectable,
  NotFoundException,
  Logger,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { KeycloakService } from '../keycloak/keycloak.service';
import { TenantService } from '../tenant/tenant.service';
import { FilterUserDto } from './dto/filter-user.dto';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    private readonly keycloakService: KeycloakService,
    private readonly tenantService: TenantService,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const { tenantId, email, password, firstName, lastName, roles } =
      createUserDto;

    this.logger.log(
      `Attempting to create user with email '${email}' for tenant '${tenantId}'`,
    );

    // 1. Find the tenant to get the realm
    const tenant = await this.tenantService.findOne(tenantId);
    if (!tenant) {
      this.logger.warn(
        `Create user failed: Tenant with ID '${tenantId}' not found.`,
      );
      throw new NotFoundException(`Tenant with ID '${tenantId}' not found.`);
    }
    const { realm } = tenant;

    // 2. Check if user already exists in our DB
    const existingUser = await this.userModel
      .findOne({ email, tenantId })
      .exec();
    if (existingUser) {
      this.logger.warn(
        `User with email '${email}' already exists for this tenant.`,
      );
      throw new ConflictException(
        `User with email '${email}' already exists for this tenant.`,
      );
    }

    // 3. Create user in Keycloak
    let keycloakId: string;
    try {
      keycloakId = await this.keycloakService.createUser(
        realm,
        { firstName, lastName, email },
        tenantId,
        password,
      );
      this.logger.log(
        `User '${email}' created in Keycloak realm '${realm}' with ID: ${keycloakId}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to create user in Keycloak for realm '${realm}'. Reason: ${error.message}`,
        error.stack,
      );
      if (error.message.includes('already exists')) {
        throw new ConflictException(error.message);
      }
      throw new InternalServerErrorException(
        'Failed to create user in the identity provider.',
      );
    }

    // 4. Save user in local DB
    const newUser = new this.userModel({
      tenantId,
      keycloakId,
      firstName,
      lastName,
      email,
      roles: roles || [], // Default to empty array if not provided
    });

    const savedUser = await newUser.save();
    this.logger.log(
      `User '${email}' saved to local DB with ID: ${savedUser._id}`,
    );

    return savedUser;
  }

  async findAll(filter: FilterUserDto): Promise<{
    users: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const { name, email, role, page = '1', limit = '10' } = filter;
    const query: any = {};
    if (name)
      query.$or = [
        { firstName: { $regex: name, $options: 'i' } },
        { lastName: { $regex: name, $options: 'i' } },
      ];
    if (email) query.email = { $regex: email, $options: 'i' };
    if (role) query.roles = role;
    const pageNum = parseInt(page, 10) || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const skip = (pageNum - 1) * limitNum;
    const [users, total] = await Promise.all([
      this.userModel.find(query).skip(skip).limit(limitNum).exec(),
      this.userModel.countDocuments(query).exec(),
    ]);
    const totalPages = Math.ceil(total / limitNum) || 1;
    return { users, total, page: pageNum, limit: limitNum, totalPages };
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userModel.findById(id).exec();
    if (!user) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return user;
  }

  async findOneByKeycloakId(keycloakId: string): Promise<User> {
    const user = await this.userModel.findOne({ keycloakId }).exec();
    if (!user) {
      throw new NotFoundException(
        `User with Keycloak ID "${keycloakId}" not found`,
      );
    }
    return user;
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const existingUser = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!existingUser) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return existingUser;
  }

  async remove(id: string): Promise<any> {
    const result = await this.userModel.deleteOne({ _id: id }).exec();
    if (result.deletedCount === 0) {
      throw new NotFoundException(`User with ID "${id}" not found`);
    }
    return { message: `User with ID "${id}" successfully deleted` };
  }
}
