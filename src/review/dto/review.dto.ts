// src/review/dto/review.dto.ts
import { ApiProperty } from '@nestjs/swagger';

import { Type } from 'class-transformer';

class DocumentInfoDto {
  @ApiProperty()
  required_document_id: string;

  @ApiProperty()
  file_reference_id: string;
}

class RegistrationDetailsDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  tenant_id: string;

  @ApiProperty()
  event_id: string;

  @ApiProperty()
  user_id: string;

  @ApiProperty({ required: false })
  qr_code_id?: string;

  @ApiProperty()
  badge_generated: boolean;

  @ApiProperty({ required: false })
  badge_url?: string;

  @ApiProperty()
  qr_validated: boolean;

  @ApiProperty({ required: false })
  last_validation_at?: string;

  @ApiProperty({ required: false })
  owner?: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  first_name: string;

  @ApiProperty()
  last_name: string;

  @ApiProperty()
  email: string;

  @ApiProperty()
  phone: string;

  @ApiProperty({ required: false })
  sexe?: string;

  @ApiProperty({ required: false })
  date_of_birth?: string;

  @ApiProperty({ required: false })
  year_of_birth?: number;

  @ApiProperty({ required: false })
  birth_place?: string;

  @ApiProperty({ required: false })
  image_url?: string;

  @ApiProperty({ required: false })
  country_of_birth?: string;

  @ApiProperty({ required: false })
  nationality?: string;

  @ApiProperty({ required: false })
  profession?: string;

  @ApiProperty({ required: false })
  profession_doc_id?: string;

  @ApiProperty({ required: false })
  organization?: string;

  @ApiProperty({ required: false })
  institution?: string;

  @ApiProperty({ required: false })
  special_requirements?: string;

  @ApiProperty()
  terms: boolean;

  @ApiProperty({ required: false })
  housing_mode?: string;

  @ApiProperty({ required: false })
  accommodation_type?: string;

  @ApiProperty()
  is_foreigner: boolean;

  @ApiProperty({ required: false })
  needs_visa?: boolean;

  @ApiProperty({ required: false })
  type_document?: string;

  @ApiProperty({ required: false })
  document_number?: string;

  @ApiProperty({ required: false })
  place_of_issue?: string;

  @ApiProperty({ required: false })
  date_of_issue?: string;

  @ApiProperty({ required: false })
  expiration_date?: string;

  @ApiProperty({ required: false })
  passport_photo_id?: string;

  @ApiProperty({ required: false })
  passport_copy_id?: string;

  @ApiProperty({ required: false })
  purpose_of_travel?: string;

  @ApiProperty({ required: false })
  date_of_arrival_in_burundi?: string;

  @ApiProperty({ required: false })
  current_visa_copy_id?: string;

  @ApiProperty({ required: false })
  marital_status?: string;

  @ApiProperty({ required: false })
  father_first_name?: string;

  @ApiProperty({ required: false })
  father_last_name?: string;

  @ApiProperty({ required: false })
  mother_first_name?: string;

  @ApiProperty({ required: false })
  mother_last_name?: string;

  @ApiProperty({ required: false })
  province?: string;

  @ApiProperty({ required: false })
  commune?: string;

  @ApiProperty({ required: false })
  zone?: string;

  @ApiProperty({ required: false })
  colline?: string;

  @ApiProperty({ required: false })
  full_address?: string;

  @ApiProperty({ required: false })
  contact_person?: string;

  @ApiProperty({ required: false })
  contact_number?: string;

  @ApiProperty({ required: false })
  reference_person_first?: string;

  @ApiProperty({ required: false })
  reference_person_last?: string;

  @ApiProperty({ required: false })
  phone_number_reference?: string;

  @ApiProperty({ required: false })
  category?: string;

  @ApiProperty()
  qr_code_file_id: string;

  @ApiProperty({ required: false })
  registration_date?: string;

  @ApiProperty({ required: false })
  language?: string;

  @ApiProperty({ type: [DocumentInfoDto], required: false })
  @Type(() => DocumentInfoDto)
  documents?: DocumentInfoDto[];

  @ApiProperty({ required: false })
  assigned_tariff_id?: string;

  @ApiProperty({ required: false })
  price?: number;

  @ApiProperty({ required: false })
  payment_status?: string;
}

export class ReviewDto {
  @ApiProperty({ description: 'The unique identifier of the review.' })
  id: string;

  @ApiProperty({
    description: 'The ID of the registration associated with the review',
  })
  registrationId: string;

  @ApiProperty({
    description: 'The name of the person who registered, cached for display',
  })
  registrationName: string;

  @ApiProperty({ description: 'The rating given by the user.' })
  rating: number;

  @ApiProperty({ description: 'The comment left by the user.' })
  comment: string;

  @ApiProperty({ description: 'The date and time the review was created.' })
  createdAt: string;

  @ApiProperty({ description: 'The ID of the event schedule being reviewed.' })
  eventScheduleId: string;

  @ApiProperty({
    description: 'Full details of the registration.',
    type: () => RegistrationDetailsDto,
  })
  @Type(() => RegistrationDetailsDto)
  registrationDetails: RegistrationDetailsDto;
}
