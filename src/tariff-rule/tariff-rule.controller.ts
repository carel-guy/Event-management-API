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
  Logger,
  Put,
} from '@nestjs/common';
import { FilterTarifRuleDto } from './dto/filter-tarif-rule.dto';
import { Types } from 'mongoose';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiQuery,
  ApiBody,
  ApiParam,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { CustomRequest } from 'src/Interceptor/custom-request.interface';
import { CreateTarifRuleDto } from './dto/create-tariff-rule.dto';
import { TarifRuleService } from './tariff-rule.service';
import { TarifRule } from './entities/tariff-rule.entity';
import { Currency, TarifType, ValueType } from 'src/enums';
import { UpdateTarifRuleDto } from './dto/update-tariff-rule.dto';

@ApiTags('Règles tarifaires')
@Controller('tariff-rules')
@UsePipes(new ValidationPipe({ whitelist: true, transform: true }))
export class TarifRuleController {
  private readonly logger = new Logger(TarifRuleController.name);

  constructor(private readonly tarifRuleService: TarifRuleService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new tariff rule' })
  @ApiResponse({
    status: 201,
    description: 'The tariff rule has been successfully created.',
    type: TarifRule,
  })
  @ApiBadRequestResponse({ description: 'Bad Request: Invalid input data.' })
  @ApiConflictResponse({
    description:
      'Conflict: A tariff rule with the same unique identifier already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error: Failed to create tariff rule.',
  })
  async create(
    @Body() createTarifRuleDto: CreateTarifRuleDto,
    @Req() req: CustomRequest,
  ): Promise<TarifRule> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.tarifRuleService.create(tenantId, createTarifRuleDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve a list of tariff rules' })
  @ApiResponse({
    status: 200,
    description: 'List of tariff rules.',
    type: [TarifRule],
  })
  async findAll(
    @Query() filterDto: FilterTarifRuleDto,
    @Req() req: CustomRequest,
  ): Promise<{
    tarifRules: TarifRule[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.tarifRuleService.findAll(tenantId, filterDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single tariff rule by ID' })
  @ApiResponse({
    status: 200,
    description: 'The found tariff rule.',
    type: TarifRule,
  })
  @ApiNotFoundResponse({
    description:
      'Not Found: Tariff rule not found or does not belong to this tenant.',
  })
  @ApiBadRequestResponse({ description: 'Bad Request: Invalid ID format.' })
  @ApiParam({
    name: 'id',
    description: 'The ID of the tariff rule.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  async findOne(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<TarifRule> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.tarifRuleService.findOne(tenantId, new Types.ObjectId(id));
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing tariff rule by ID' })
  @ApiResponse({
    status: 200,
    description: 'The updated tariff rule.',
    type: TarifRule,
  })
  @ApiNotFoundResponse({
    description:
      'Not Found: Tariff rule not found or does not belong to this tenant.',
  })
  @ApiBadRequestResponse({
    description: 'Bad Request: Invalid input data or ID format.',
  })
  @ApiConflictResponse({
    description:
      'Conflict: A tariff rule with the same unique identifier already exists.',
  })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error: Failed to update tariff rule.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the tariff rule to update.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  @ApiBody({
    type: UpdateTarifRuleDto,
    description: 'Data to update the tariff rule.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateTarifRuleDto: UpdateTarifRuleDto,
    @Req() req: CustomRequest,
  ): Promise<TarifRule> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.tarifRuleService.update(
      tenantId,
      new Types.ObjectId(id),
      updateTarifRuleDto,
    );
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a tariff rule by ID' })
  @ApiResponse({
    status: 200,
    description: 'Message indicating successful deletion.',
    schema: { example: { message: 'TarifRule successfully deleted.' } },
  })
  @ApiNotFoundResponse({
    description:
      'Not Found: Tariff rule not found or does not belong to this tenant.',
  })
  @ApiBadRequestResponse({ description: 'Bad Request: Invalid ID format.' })
  @ApiInternalServerErrorResponse({
    description: 'Internal Server Error: Failed to delete tariff rule.',
  })
  @ApiParam({
    name: 'id',
    description: 'The ID of the tariff rule to delete.',
    type: String,
    example: '60d5ec49f8a3c5a6d8b4567a',
  })
  async remove(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<{ message: string }> {
    const tenantId: Types.ObjectId = new Types.ObjectId(req.user.tenantId);
    return this.tarifRuleService.remove(tenantId, new Types.ObjectId(id));
  }
}
