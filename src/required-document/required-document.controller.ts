// src/required-document/required-document.controller.ts

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
  Req,
} from '@nestjs/common';
import { RequiredDocumentService } from './required-document.service';
import { CreateRequiredDocumentDto } from './dto/create-required-document.dto';
import { UpdateRequiredDocumentDto } from './dto/update-required-document.dto';
import { FilterRequiredDocumentDto } from './dto/filter-required-document.dto';
import { RequiredDocument } from './entities/required-document.entity';
import { Types } from 'mongoose';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';
import { CustomRequest } from 'src/Interceptor/custom-request.interface';

@ApiTags('Documents requis')
@Controller('required-documents')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class RequiredDocumentController {
  constructor(
    private readonly requiredDocumentService: RequiredDocumentService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new required document' })
  @ApiResponse({
    status: 201,
    description: 'The required document has been successfully created.',
    type: RequiredDocument,
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict: Document with the same key already exists for this tenant.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid input data.' })
  async create(
    @Body() createRequiredDocumentDto: CreateRequiredDocumentDto,
    @Req() req: CustomRequest,
  ): Promise<RequiredDocument> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.requiredDocumentService.create(
      tenantId,
      createRequiredDocumentDto,
    );
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of required documents' })
  @ApiResponse({
    status: 200,
    description: 'List of required documents.',
    type: [RequiredDocument],
  })
  @ApiQuery({
    name: 'key',
    required: false,
    type: String,
    description: 'Filter by document key (case-insensitive).',
  })
  @ApiQuery({
    name: 'label',
    required: false,
    type: String,
    description: 'Filter by document label (case-insensitive).',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number.',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page.',
    example: 10,
  })
  async findAll(
    @Query() filterDto: FilterRequiredDocumentDto,
    @Req() req: CustomRequest,
  ): Promise<{
    requiredDocuments: RequiredDocument[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.requiredDocumentService.findAll(tenantId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single required document by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found required document.',
    type: RequiredDocument,
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found: Document not found or does not belong to this tenant.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid ID format.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the required document.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<RequiredDocument> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.requiredDocumentService.findOne(
      tenantId,
      new Types.ObjectId(id),
    );
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing required document by ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated required document.',
    type: RequiredDocument,
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found: Document not found or does not belong to this tenant.',
  })
  @ApiResponse({
    status: 409,
    description:
      'Conflict: Document with the updated key already exists for this tenant.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request: Invalid input data or ID format.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the required document to update.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  @ApiBody({
    type: UpdateRequiredDocumentDto,
    description: 'Data to update the required document.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateRequiredDocumentDto: UpdateRequiredDocumentDto,
    @Req() req: CustomRequest,
  ): Promise<RequiredDocument> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.requiredDocumentService.update(
      tenantId,
      new Types.ObjectId(id),
      updateRequiredDocumentDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a required document by ID' })
  @ApiResponse({
    status: 200,
    description: 'Message indicating successful deletion.',
    schema: { example: { message: 'RequiredDocument successfully deleted.' } },
  })
  @ApiResponse({
    status: 404,
    description:
      'Not Found: Document not found or does not belong to this tenant.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request: Invalid ID format.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the required document to delete.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<{ message: string }> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.requiredDocumentService.remove(
      tenantId,
      new Types.ObjectId(id),
    );
  }
}
