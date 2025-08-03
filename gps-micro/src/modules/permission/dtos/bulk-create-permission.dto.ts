import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreatePermissionDto } from './create-permission.dto';

export class BulkCreatePermissionDto {
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  @ArrayMinSize(1)
  permissions: CreatePermissionDto[];
}
