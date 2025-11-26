import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
  Param,
  Query,
} from '@nestjs/common';
import { GrpcMethod, RpcException } from '@nestjs/microservices';
import { status } from '@grpc/grpc-js';
import { Types } from 'mongoose';
import { EventFormat, UserRole } from '../enums';
import { EventService } from 'src/event/event.service';
import { KeycloakService } from 'src/keycloak/keycloak.service';
import { TenantService } from 'src/tenant/tenant.service';
import { UserService } from 'src/user/user.service';
import { EventDocument } from 'src/event/entities/event.entity';

interface EventConfigRequest {
  tenantId: string;
  eventId: string;
}

interface Document {
  id: string;
  key: string;
  label: string;
}

interface TariffRule {
  id: string;
  name: string;
  amount: number;
  validFrom: string; // ISO string
  validUntil: string; // ISO string
}

interface GrpcCall {
  user?: {
    userId: string;
    tenantId: string;
    roles: string[];
  };
}

@Controller()
export class GrpcServerController {
  private readonly logger = new Logger(GrpcServerController.name);

  constructor(
    private readonly eventService: EventService,
    private readonly keycloakService: KeycloakService,
    private readonly tenantService: TenantService,
    private readonly userService: UserService,
  ) {}

  @Get(':eventId/config')
  async getEventConfigRest(
    @Param('eventId') eventId: string,
    @Query('tenantId') tenantId: string,
  ): Promise<EventConfigRequest> {
    this.logger.log(
      `Received REST GetEventConfig request for tenantId: ${tenantId}, eventId: ${eventId}`,
    );

    if (!tenantId) {
      throw new HttpException(
        'tenantId query parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!eventId) {
      throw new HttpException(
        'eventId parameter is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const eventConfig = await this.eventService.getEventConfig({
        tenantId,
        eventId,
      });
      return eventConfig;
    } catch (error) {
      this.logger.error(
        `Failed to fetch event config via REST: ${error.message}`,
        error.stack,
      );
      throw new HttpException(
        `Failed to fetch event configuration: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @GrpcMethod('EventService', 'GetEventConfig')
  async getEventConfig(
    data: { tenantId: string; eventId: string },
    call: GrpcCall,
  ) {
    const tenantIdSource = call.user?.tenantId ? 'JWT' : 'request body';
    const tenantId = call.user?.tenantId || data.tenantId;
    this.logger.log(
      `[gRPC] Received GetEventConfig for eventId: ${data.eventId}. tenantId: ${tenantId} (from ${tenantIdSource})`,
    );
    try {
      const config = await this.eventService.getEventConfig({
        tenantId,
        eventId: data.eventId,
      });
      this.logger.log(
        `[gRPC] Successfully fetched event config for eventId: ${data.eventId}`,
      );
      return config;
    } catch (error) {
      this.logger.error(
        `[gRPC] Failed to fetch event config for eventId: ${data.eventId}: ${error.message}`,
        error.stack,
      );
      throw new RpcException(error.message);
    }
  }

  @GrpcMethod('EventService', 'Ping')
  ping() {
    this.logger.log(`[gRPC] Received Ping request`);
    return { message: 'pong' };
  }

  @GrpcMethod('EventService', 'ValidateRegistration')
  async validateRegistration(data: {
    eventId: string;
    registrationId: string;
    tenantId: string;
  }) {
    const { eventId, registrationId, tenantId } = data;
    if (!eventId || !registrationId || !tenantId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Event ID, Registration ID, and Tenant ID are required.',
      });
    }
    return this.eventService.validateRegistration(
      eventId,
      registrationId,
      tenantId,
    );
  }

  @GrpcMethod('EventService', 'GetEventById')
  async getEventById(data: { eventId: string; tenantId: string }) {
    this.logger.log(
      `[gRPC] Received GetEventById request for eventId: ${data.eventId}`,
    );

    const { eventId, tenantId } = data;

    if (!tenantId) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'Tenant ID is required.',
      });
    }

    if (!eventId || !Types.ObjectId.isValid(eventId)) {
      throw new RpcException({
        code: status.INVALID_ARGUMENT,
        message: 'A valid Event ID is required.',
      });
    }

    try {
      const event: EventDocument = await this.eventService.getEventByIdForGrpc(
        new Types.ObjectId(tenantId),
        new Types.ObjectId(eventId),
      );

      // Helper function to convert any JS value to a google.protobuf.Value structure
      const toGrpcValue = (
        value: any,
      ):
        | { stringValue: string }
        | { listValue: { values: { stringValue: string }[] } }
        | { numberValue: number }
        | { boolValue: boolean }
        | null => {
        if (value === null || value === undefined) {
          return null;
        }
        if (typeof value === 'string') {
          return { stringValue: value };
        }
        if (typeof value === 'number') {
          return { numberValue: value };
        }
        if (typeof value === 'boolean') {
          return { boolValue: value };
        }
        if (Array.isArray(value)) {
          // This handles the array of strings case for you
          return {
            listValue: { values: value.map((v) => ({ stringValue: v })) },
          };
        }
        // Extend with other types like struct if needed
        return { stringValue: JSON.stringify(value) }; // Fallback
      };

      const eventResponse = {
        id: (event._id as Types.ObjectId).toHexString(),
        tenantId: (event.tenantId as Types.ObjectId).toHexString(),
        title: event.title,
        description: event.description || '',
        type: event.type,
        status: event.status,
        startDate: event.startDate.toISOString(),
        endDate: event.endDate.toISOString(),
        timezone: event.timezone || '',
        avenue: event.avenue || '',
        adresse: event.adresse || '',
        virtualUrl: event.virtualUrl || '',
        numberOfParticipants: event.numberOfParticipants || 0,
        currency: event.currency || '',
        fileReferenceIds: event.fileReferenceIds || '',
        isPublic: event.isPublic || false,
        createdBy: event.createdBy ? event.createdBy.toString() : '',
        updatedBy: event.updatedBy ? event.updatedBy.toString() : '',
        createdAt: event.createdAt.toISOString(),
        updatedAt: event.updatedAt.toISOString(),
        format: event.format as any,
        locations: event.locations
          ? event.locations.map((loc) => ({
              name: loc.name,
              address: loc.address,
            }))
          : [],
        tariffRules: event.tariffRuleIds
          ? event.tariffRuleIds.map((rule: any) => ({
              id: rule._id.toHexString(),
              name: rule.name,
              description: rule.description,
              // *** THIS IS THE CRITICAL FIX ***
              conditions: rule.conditions
                ? rule.conditions.map(
                    (c: { field: string; operator: string; value: any }) => ({
                      field: c.field,
                      operator: c.operator,
                      value: toGrpcValue(c.value), // Use the helper to correctly format the value
                    }),
                  )
                : [],
              currency: rule.currency,
              isActive: rule.isActive,
              price: rule.price,
              validFrom: rule.validFrom ? rule.validFrom.toISOString() : '',
              validUntil: rule.validUntil ? rule.validUntil.toISOString() : '',
              amountType: rule.amountType,
              amount: rule.amount,
              tariffType: rule.tariffType,
              createdAt: rule.createdAt.toISOString(),
              updatedAt: rule.updatedAt.toISOString(),
            }))
          : [],
        partners: event.partnerIds
          ? event.partnerIds.map((partner: any) => ({
              id: partner._id.toHexString(),
              name: partner.name,
              logo: partner.logo || '',
              website: partner.website || '',
              description: partner.description || '',
            }))
          : [],
        eventSchedules: event.eventScheduleIds
          ? event.eventScheduleIds.map((schedule: any) => ({
              id: schedule._id.toHexString(),
              title: schedule.title,
              description: schedule.description,
              sessionType: schedule.sessionType,
              startTime: schedule.startTime.toISOString(),
              endTime: schedule.endTime.toISOString(),
              location: schedule.location,
              speakers: schedule.speakers
                ? schedule.speakers.map((speaker: any) => ({
                    id: speaker._id.toHexString(),
                    name: speaker.name,
                    bio: speaker.bio,
                    company: speaker.company,
                    linkedinUrl: speaker.linkedinUrl,
                    speakerType: speaker.speakerType,
                    profilePictureId: speaker.profilePictureId || [],
                  }))
                : [],
            }))
          : [],
        socialLinks: event.socialLinks
          ? event.socialLinks.map((link) => ({
              platform: link.platform,
              url: link.url,
            }))
          : [],
        customFieldIds: event.customFieldIds
          ? event.customFieldIds.map((id) => id.toString())
          : [],
        requiredDocumentIds: event.requiredDocumentIds
          ? event.requiredDocumentIds.map((id) => id.toString())
          : [],
      };

      this.logger.log(
        `[gRPC] Successfully fetched and mapped eventId: ${data.eventId}`,
      );
      return eventResponse;
    } catch (error) {
      this.logger.error(
        `[gRPC] Failed to fetch event for eventId: ${data.eventId}: ${error.message}`,
        error.stack,
      );

      if (error instanceof RpcException) {
        throw error;
      }

      throw new RpcException({
        code: status.INTERNAL,
        message: 'An unexpected error occurred while fetching the event.',
      });
    }
  }

  @GrpcMethod('EventService', 'GetUserContext')
  getUserContext(data: {}, call: GrpcCall) {
    this.logger.log(`[gRPC] Received GetUserContext request`);

    if (call.user) {
      const { userId, tenantId, roles } = call.user;
      this.logger.log(
        `[gRPC] Returning user context from JWT: { userId: ${userId}, tenantId: ${tenantId} }`,
      );
      return {
        userId,
        tenantId,
        roles,
        isMock: false,
      };
    }

    // Fallback: Provide mock user context for dev/internal calls
    this.logger.warn(
      '[gRPC] No JWT found, returning mock user context for development.',
    );
    const mockUser = {
      userId: '60d5ec49f8a3c5a6d8b4567e', // Default mock user ID
      tenantId: '60d5ec49f8a3c5a6d8b4567f', // Default mock tenant ID
      roles: [UserRole.TENANT_ADMIN, UserRole.EVENT_MANAGER],
      isMock: true,
    };

    this.logger.debug(
      `[gRPC] Attached mock userContext with tenantId: ${mockUser.tenantId}, userId: ${mockUser.userId}`,
    );
    return mockUser;
  }
}
