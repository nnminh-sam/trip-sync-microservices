import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize } from 'class-validator';
import { CreatePermissionDto } from './create-permission.dto';
import { ApiProperty } from '@nestjs/swagger';

export class BulkCreatePermissionDto {
  @ApiProperty({
    type: [CreatePermissionDto],
    description: 'Array of permissions to create',
    minItems: 1,
  })
  @ValidateNested({ each: true })
  @Type(() => CreatePermissionDto)
  @ArrayMinSize(1)
  permissions: CreatePermissionDto[];
}
