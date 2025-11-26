import {
  IsString,
  IsMongoId,
  IsOptional,
  IsDateString,
  IsEnum,
  IsDate,
} from 'class-validator';
import { SessionType } from 'src/enums'; // Assuming SessionType enum is defined in src/enums

export class FilterEventScheduleDto {
  @IsOptional()
  @IsMongoId()
  eventId?: string;

  @IsOptional()
  @IsMongoId()
  speakerId?: string;

  @IsOptional()
  @IsEnum(SessionType)
  sessionType?: SessionType;

  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  location?: string;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsString()
  page?: string;

  @IsOptional()
  @IsString()
  limit?: string;
}
