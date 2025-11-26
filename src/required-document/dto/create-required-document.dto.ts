import { IsString, IsNotEmpty, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRequiredDocumentDto {
  @ApiProperty({
    example: 'photo_passeport', // passport_photo
    description:
      'Une clé unique pour le document requis au sein du locataire. Par exemple : photo_passeport, justificatif_domicile.',
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  key: string;

  @ApiProperty({
    example: 'Photo de Passeport', // Passport Photo
    description:
      "Un libellé lisible par l'humain pour le document requis. Par exemple : Photo de Passeport, Justificatif de Domicile.",
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  label: string;
}
