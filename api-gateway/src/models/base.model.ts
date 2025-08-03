import { ApiProperty } from '@nestjs/swagger';

export class BaseModel {
  @ApiProperty({
    description: 'Unique identifier',
    type: 'string',
  })
  id: string;

  @ApiProperty({
    description: 'Create timestamp',
    type: 'string',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Update timestamp',
    type: 'string',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Delete timestamp',
    type: 'string',
    required: false,
  })
  deletedAt?: Date;
}
