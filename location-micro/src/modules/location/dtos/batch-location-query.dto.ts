import { IsArray, IsUUID, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class BatchLocationQueryDto {
  @ApiProperty({ 
    type: [String], 
    description: 'Array of location IDs',
    example: ['uuid1', 'uuid2', 'uuid3']
  })
  @IsArray()
  @IsUUID('4', { each: true })
  locationIds: string[];

  @ApiProperty({ 
    required: false,
    description: 'Include inactive locations in the results',
    default: false
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  includeInactive?: boolean;
}