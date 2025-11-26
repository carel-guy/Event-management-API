// src/custom-field/custom-field.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpStatus,
  HttpCode,
  UsePipes,
  ValidationPipe,
  Query,
  Req,
  BadRequestException,
} from '@nestjs/common';
import { CustomFieldService } from './custom-field.service';
import { CreateCustomFieldDto } from './dto/create-custom-field.dto';
import { UpdateCustomFieldDto } from './dto/update-custom-field.dto';
import { FilterCustomFieldDto } from './dto/filter-custom-field.dto';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Types } from 'mongoose';
import { Request } from 'express';
import { CustomField } from './entities/custom-field.entity';

interface UserContext {
  userId: string;
  tenantId: string;
  roles: string[];
}

// @ApiBearerAuth()
@ApiTags('custom-fields')
@Controller('custom-fields')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class CustomFieldController {
  constructor(private readonly customFieldService: CustomFieldService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new custom field' })
  @ApiResponse({
    status: 201,
    description: 'The custom field has been successfully created.',
    type: CustomField,
  })
  @ApiResponse({ status: 400, description: 'Invalid input.' })
  @ApiResponse({
    status: 409,
    description: 'A custom field with this key already exists for this tenant.',
  })
  async create(
    @Body() createCustomFieldDto: CreateCustomFieldDto,
    @Req() req: Request,
  ): Promise<CustomField> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    return this.customFieldService.create(tenantId, createCustomFieldDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get all custom fields with optional filters' })
  @ApiResponse({
    status: 200,
    description: 'List of custom fields with total count.',
  })
  @ApiResponse({ status: 400, description: 'Invalid filter parameters.' })
  async findAll(
    @Req() req: Request,
    @Query() filterDto: FilterCustomFieldDto,
  ): Promise<{ customFields: CustomField[]; total: number }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    return this.customFieldService.findAll(tenantId, filterDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a custom field by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found custom field.',
    type: CustomField,
  })
  @ApiResponse({
    status: 404,
    description: 'Custom field not found or not belonging to the tenant.',
  })
  @ApiResponse({ status: 400, description: 'Invalid ID format.' })
  async findOne(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<CustomField> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Custom Field ID format.');
    }

    return this.customFieldService.findOne(tenantId, new Types.ObjectId(id));
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a custom field by ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated custom field.',
    type: CustomField,
  })
  @ApiResponse({
    status: 404,
    description: 'Custom field not found or not belonging to the tenant.',
  })
  @ApiResponse({ status: 400, description: 'Invalid ID or input.' })
  @ApiResponse({
    status: 409,
    description: 'A custom field with this key already exists for this tenant.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateCustomFieldDto: UpdateCustomFieldDto,
    @Req() req: Request,
  ): Promise<CustomField> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Custom Field ID format.');
    }

    return this.customFieldService.update(
      tenantId,
      new Types.ObjectId(id),
      updateCustomFieldDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a custom field by ID' })
  @ApiResponse({
    status: 200,
    description: 'The custom field has been successfully deleted.',
    schema: { example: { message: 'Custom field deleted successfully.' } },
  })
  @ApiResponse({
    status: 404,
    description: 'Custom field not found or not belonging to the tenant.',
  })
  @ApiResponse({ status: 400, description: 'Invalid ID format.' })
  async remove(
    @Param('id') id: string,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const userContext = (req as any)['user'] as UserContext;
    const tenantId = new Types.ObjectId(userContext.tenantId);

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Invalid Custom Field ID format.');
    }

    await this.customFieldService.remove(tenantId, new Types.ObjectId(id));
    return { message: 'Custom field deleted successfully.' };
  }
}
