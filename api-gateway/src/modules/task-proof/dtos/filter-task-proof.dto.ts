import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsEnum, IsOptional, IsUUID } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { TaskProofTypeEnum } from 'src/models/task-proof-type.enum';
import { MediaTypeEnum } from 'src/models/media-type.enum';

export class FilterTaskProofDto extends BaseRequestFilterDto {
  @ApiProperty({
    description: "Proof's type",
    required: false,
    enum: TaskProofTypeEnum,
  })
  @IsOptional()
  @IsEnum(TaskProofTypeEnum)
  type?: TaskProofTypeEnum;

  @ApiProperty({
    description: "Proof's media type",
    required: false,
    enum: MediaTypeEnum,
  })
  @IsOptional()
  @IsEnum(MediaTypeEnum)
  mediaType?: MediaTypeEnum;

  @ApiProperty({
    description: 'Uploader ID, UUID, value',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @ApiProperty({
    description: 'Upload timestamp',
    required: false,
  })
  @IsOptional()
  @IsDate()
  timestamp?: Date;

  @ApiProperty({
    description: 'Task ID to filter proofs by',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  taskId?: string;
}
