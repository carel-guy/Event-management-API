// src/actualities/actualities.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Actuality, ActualityDocument } from './entities/actuality.entity';
import { UserContext } from 'src/Interceptor/custom-request.interface';
import { CreateActualityDto } from './dto/create-actuality.dto';
import { FilterActualityDto } from './dto/filter-actuality.dto';
import { UpdateActualityDto } from './dto/update-actuality.dto';

@Injectable()
export class ActualitiesService {
  constructor(
    @InjectModel(Actuality.name)
    private actualityModel: Model<ActualityDocument>,
  ) {}

  /**
   * Crée une nouvelle actualité pour un tenant spécifique.
   * @param createActualityDto Les données de l'actualité à créer.
   * @param userContext Le contexte utilisateur (tenantId, userId) fourni par l'intercepteur.
   * @returns L'actualité créée.
   */
  async create(
    createActualityDto: CreateActualityDto,
    userContext: UserContext,
  ): Promise<Actuality> {
    const { tenantId, userId } = userContext;

    // Créer une nouvelle instance de l'actualité
    const createdActuality = new this.actualityModel({
      ...createActualityDto,
      tenantId: new Types.ObjectId(tenantId), // Assurez-vous que tenantId est un ObjectId
      createdBy: new Types.ObjectId(userId), // Définir l'utilisateur créateur
      publishedAt: createActualityDto.publishedAt || new Date(), // Utiliser la date fournie ou la date actuelle
    });

    // Le hook pre('save') dans le schéma gérera la validation des attachments et tenantId.
    try {
      return await createdActuality.save();
    } catch (error) {
      // Gérer les erreurs de validation ou de base de données
      if (error.name === 'ValidationError') {
        throw new BadRequestException(error.message);
      }
      throw error;
    }
  }

  /**
   * Récupère toutes les actualités pour un tenant, avec des options de filtrage et de recherche.
   * @param filterDto Les critères de filtrage.
   * @param userContext Le contexte utilisateur (tenantId).
   * @returns Un tableau d'actualités.
   */
  async findAll(filter: FilterActualityDto) {
    const {
      tenantId,
      eventId,
      type,
      publishedAt,
      isActive,
      page = 1,
      limit = 10,
    } = filter;

    const query: any = {};

    if (tenantId) query.tenantId = new Types.ObjectId(tenantId);
    if (eventId) query.eventId = eventId;
    if (type) query.type = type;
    if (publishedAt) query.publishedAt = { $gte: new Date(publishedAt) };
    if (typeof isActive === 'boolean') {
      query.isActive = isActive;
    }

    const skip = (page - 1) * limit;

    const [actualities, total] = await Promise.all([
      this.actualityModel
        .find(query)
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      this.actualityModel.countDocuments(query),
    ]);

    return {
      actualities,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Récupère une actualité spécifique par son ID pour un tenant donné.
   * @param id L'ID de l'actualité.
   * @param userContext Le contexte utilisateur (tenantId).
   * @returns L'actualité trouvée.
   * @throws NotFoundException si l'actualité n'est pas trouvée ou n'appartient pas au tenant.
   */
  async findOne(id: string, userContext: UserContext): Promise<Actuality> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("ID d'actualité invalide.");
    }
    const { tenantId } = userContext;
    const actuality = await this.actualityModel
      .findOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();

    if (!actuality) {
      throw new NotFoundException(
        `Actualité avec l'ID "${id}" introuvable pour ce tenant.`,
      );
    }
    return actuality;
  }

  /**
   * Met à jour une actualité existante pour un tenant spécifique.
   * @param id L'ID de l'actualité à mettre à jour.
   * @param updateActualityDto Les données de mise à jour.
   * @param userContext Le contexte utilisateur (tenantId, userId).
   * @returns L'actualité mise à jour.
   * @throws NotFoundException si l'actualité n'est pas trouvée ou n'appartient pas au tenant.
   */
  async update(
    id: string,
    updateActualityDto: UpdateActualityDto,
    userContext: UserContext,
  ): Promise<Actuality> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("ID d'actualité invalide.");
    }
    const { tenantId, userId } = userContext;

    // Ajouter l'ID de l'utilisateur qui met à jour
    const updatedData = {
      ...updateActualityDto,
      updatedBy: new Types.ObjectId(userId),
    };

    const updatedActuality = await this.actualityModel
      .findOneAndUpdate(
        { _id: new Types.ObjectId(id), tenantId: new Types.ObjectId(tenantId) },
        { $set: updatedData }, // Utiliser $set pour mettre à jour seulement les champs fournis
        { new: true, runValidators: true }, // Retourne le document mis à jour et exécute les validateurs
      )
      .exec();

    if (!updatedActuality) {
      throw new NotFoundException(
        `Actualité avec l'ID "${id}" introuvable pour ce tenant.`,
      );
    }
    return updatedActuality;
  }

  /**
   * Supprime une actualité spécifique pour un tenant donné.
   * @param id L'ID de l'actualité à supprimer.
   * @param userContext Le contexte utilisateur (tenantId).
   * @throws NotFoundException si l'actualité n'est pas trouvée ou n'appartient pas au tenant.
   */
  async remove(id: string, userContext: UserContext): Promise<void> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException("ID d'actualité invalide.");
    }
    const { tenantId } = userContext;
    const result = await this.actualityModel
      .deleteOne({
        _id: new Types.ObjectId(id),
        tenantId: new Types.ObjectId(tenantId),
      })
      .exec();

    if (result.deletedCount === 0) {
      throw new NotFoundException(
        `Actualité avec l'ID "${id}" introuvable pour ce tenant.`,
      );
    }
  }
}
