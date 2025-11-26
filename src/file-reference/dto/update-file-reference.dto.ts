// src/file-reference/dto/update-file-reference.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateFileReferenceDto } from './create-file-reference.dto';
import { IsOptional, IsString, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { FileType } from 'src/enums';

export class UpdateFileReferenceDto extends PartialType(
  CreateFileReferenceDto,
) {
  @ApiProperty({
    example: 'Formulaire de demande mis à jour', // Updated Application form
    description: "Un libellé mis à jour lisible par l'humain pour le fichier.",
    required: false,
  })
  @IsOptional()
  @IsString()
  label?: string;

  // @ApiProperty({
  //   example: FileType.JPEG,
  //   description: 'Le type MIME mis à jour du fichier.',
  //   enum: FileType,
  //   required: false,
  // })
  // @IsOptional()
  // @IsEnum(FileType)
  // fileType?: FileType;
}
