// src/actualities/actualities.controller.ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  Req,
  HttpCode,
  HttpStatus,
  ValidationPipe,
} from '@nestjs/common';
import { CreateActualityDto } from './dto/create-actuality.dto';
import { UpdateActualityDto } from './dto/update-actuality.dto';
import { FilterActualityDto } from './dto/filter-actuality.dto';
import { Actuality } from './entities/actuality.entity'; // Importez l'entité pour le type de retour
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { TenantInterceptor } from 'src/Interceptor/tenant-interceptor';
import { ActualitiesService } from './actuality.service';
import { CustomRequest } from 'src/Interceptor/custom-request.interface';
import { ActualityType } from 'src/enums';

@ApiTags('Actualités') // Tag pour Swagger
@Controller('actualities')
@UseInterceptors(TenantInterceptor) // Applique l'intercepteur pour injecter le tenantId et userId
export class ActualitiesController {
  constructor(private readonly actualitiesService: ActualitiesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Créer une nouvelle actualité pour le tenant actuel',
  })
  @ApiResponse({
    status: 201,
    description: 'Actualité créée avec succès.',
    type: Actuality,
  })
  @ApiResponse({ status: 400, description: 'Données de requête invalides.' })
  async create(
    @Body() createActualityDto: CreateActualityDto,
    @Req() req: CustomRequest,
  ): Promise<Actuality> {
    // L'intercepteur TenantInterceptor a déjà attaché req.user
    return this.actualitiesService.create(createActualityDto, req.user);
  }

  @Get()
  async findAll(@Query() query: FilterActualityDto) {
    return this.actualitiesService.findAll(query);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Récupérer une actualité spécifique par ID pour le tenant actuel',
  })
  @ApiResponse({
    status: 200,
    description: 'Actualité récupérée avec succès.',
    type: Actuality,
  })
  @ApiResponse({
    status: 404,
    description: 'Actualité introuvable pour ce tenant.',
  })
  @ApiResponse({ status: 400, description: "ID d'actualité invalide." })
  async findOne(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<Actuality> {
    return this.actualitiesService.findOne(id, req.user);
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Mettre à jour une actualité spécifique par ID pour le tenant actuel',
  })
  @ApiResponse({
    status: 200,
    description: 'Actualité mise à jour avec succès.',
    type: Actuality,
  })
  @ApiResponse({
    status: 404,
    description: 'Actualité introuvable pour ce tenant.',
  })
  @ApiResponse({
    status: 400,
    description: 'Données de requête ou ID invalides.',
  })
  async update(
    @Param('id') id: string,
    @Body() updateActualityDto: UpdateActualityDto,
    @Req() req: CustomRequest,
  ): Promise<Actuality> {
    return this.actualitiesService.update(id, updateActualityDto, req.user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Supprimer une actualité spécifique par ID pour le tenant actuel',
  })
  @ApiResponse({ status: 204, description: 'Actualité supprimée avec succès.' })
  @ApiResponse({
    status: 404,
    description: 'Actualité introuvable pour ce tenant.',
  })
  @ApiResponse({ status: 400, description: "ID d'actualité invalide." })
  async remove(
    @Param('id') id: string,
    @Req() req: CustomRequest,
  ): Promise<void> {
    await this.actualitiesService.remove(id, req.user);
  }
}
