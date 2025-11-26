import { PartialType } from '@nestjs/mapped-types';
import { CreateRequiredDocumentDto } from './create-required-document.dto';

export class UpdateRequiredDocumentDto extends PartialType(
  CreateRequiredDocumentDto,
) {}
