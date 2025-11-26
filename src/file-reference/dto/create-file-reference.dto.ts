// src/file-reference/dto/create-file-reference.dto.ts

import { IsString, IsNotEmpty, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileType } from 'src/enums';

export class CreateFileReferenceDto {
  @ApiProperty({
    example: 'Formulaire de demande pour nouveau locataire', // Application form for new tenant
    description: "Un libellé lisible par l'humain pour le fichier.",
    required: false,
  })
  @IsString()
  @IsOptional()
  label: string;
}
