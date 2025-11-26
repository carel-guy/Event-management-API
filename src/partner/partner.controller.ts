import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UsePipes,
  ValidationPipe,
  HttpCode,
  HttpStatus,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { PartnerService } from './partner.service';
import { CreatePartnerDto } from './dto/create-partner.dto';
import { UpdatePartnerDto } from './dto/update-partner.dto';
import { FilterPartnerDto } from './dto/filter-partner.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Request } from 'express';
import { Partner } from './entities/partner.entity';

interface UserContext {
  userId: string;
  tenantId: string;
  roles: string[];
}

@ApiTags('Partenaires')
@Controller('partners')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class PartnerController {
  constructor(private readonly partnerService: PartnerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new partner' })
  @ApiResponse({
    status: 201,
    description: 'The partner has been successfully created.',
    type: Partner,
  })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async create(
    @Body() createPartnerDto: CreatePartnerDto,
    @Req() req: Request,
  ): Promise<Partner> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.partnerService.create(tenantId, createPartnerDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve all partners with optional filtering and pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'A list of partners with pagination details.',
    schema: {
      type: 'object',
      properties: {
        partners: {
          type: 'array',
          items: { $ref: '#/components/schemas/Partner' },
        },
        total: { type: 'number', example: 100 },
        page: { type: 'number', example: 1 },
        limit: { type: 'number', example: 10 },
        totalPages: { type: 'number', example: 10 },
      },
    },
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  @ApiQuery({
    name: 'name',
    required: false,
    type: String,
    description: 'Filter by partner name (case-insensitive partial match)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    type: String,
    description: 'Filter by partner category',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page for pagination',
    example: 10,
  })
  async findAll(
    @Req() req: Request,
    @Query() filterDto: FilterPartnerDto,
  ): Promise<{
    partners: Partner[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);
    return this.partnerService.findAll(tenantId, filterDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Retrieve a partner by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the partner',
    type: String,
    example: '60c72b2f9b1d8f001c8e4d8a',
  })
  @ApiResponse({
    status: 200,
    description: 'The partner details.',
    type: Partner,
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format)',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<Partner> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Partner ID format.');
    }
    return this.partnerService.findById(tenantId, new Types.ObjectId(id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a partner by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the partner',
    type: String,
    example: '60c72b2f9b1d8f001c8e4d8a',
  })
  @ApiResponse({
    status: 200,
    description: 'The partner has been successfully updated.',
    type: Partner,
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({ status: 400, description: 'Bad Request' })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async update(
    @Param('id') id: string,
    @Body() updatePartnerDto: UpdatePartnerDto,
    @Req() req: Request,
  ): Promise<Partner> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Partner ID format.');
    }
    return this.partnerService.update(
      tenantId,
      new Types.ObjectId(id),
      updatePartnerDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a partner by ID' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the partner',
    type: String,
    example: '60c72b2f9b1d8f001c8e4d8a',
  })
  @ApiResponse({
    status: 204,
    description: 'The partner has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Partner not found' })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., invalid ID format)',
  })
  @ApiResponse({ status: 500, description: 'Internal Server Error' })
  async remove(@Param('id') id: string, @Req() req: Request): Promise<void> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Partner ID format.');
    }
    await this.partnerService.remove(tenantId, new Types.ObjectId(id));
  }
}
