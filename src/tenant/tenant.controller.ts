import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { FilterTenantDto } from './dto/filter-tenant.dto';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { Roles } from 'nest-keycloak-connect';
import { UserRole } from '../enums';

@ApiTags('Tenants')
@Controller('tenants')
export class TenantController {
  constructor(private readonly tenantService: TenantService) {}

  @Post()
  @Roles({ roles: [UserRole.SUPER_ADMIN] }) // Only Super Admins can create new tenants
  @ApiOperation({ summary: 'Create a new tenant' })
  @ApiResponse({
    status: 201,
    description: 'The tenant has been successfully created.',
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  create(@Body() createTenantDto: CreateTenantDto) {
    return this.tenantService.create(createTenantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all tenants' })
  @ApiResponse({ status: 200, description: 'A list of all tenants.' })
  findAll(@Query() filter: FilterTenantDto) {
    return this.tenantService.findAll(filter);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve a single tenant by ID' })
  @ApiParam({ name: 'id', description: 'The ID of the tenant to retrieve' })
  @ApiResponse({ status: 200, description: 'The tenant record.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  findOne(@Param('id') id: string) {
    return this.tenantService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing tenant' })
  @ApiParam({ name: 'id', description: 'The ID of the tenant to update' })
  @ApiResponse({ status: 200, description: 'The updated tenant record.' })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  update(@Param('id') id: string, @Body() updateTenantDto: UpdateTenantDto) {
    return this.tenantService.update(id, updateTenantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a tenant' })
  @ApiParam({ name: 'id', description: 'The ID of the tenant to delete' })
  @ApiResponse({
    status: 200,
    description: 'The tenant has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Tenant not found.' })
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
