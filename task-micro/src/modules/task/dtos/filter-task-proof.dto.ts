import { IsDate, IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { BaseRequestFilterDto } from 'src/dtos/base-request-filter.dto';
import { MediaTypeEnum } from 'src/models/media-type.enum';
import { TaskProofTypeEnum } from 'src/models/task-proof-type.enum';

export class FilterTaskProofDto extends BaseRequestFilterDto {
  @IsOptional()
  @IsEnum(TaskProofTypeEnum)
  type?: TaskProofTypeEnum;

  @IsOptional()
  @IsEnum(MediaTypeEnum)
  mediaType?: MediaTypeEnum;

  @IsOptional()
  @IsUUID()
  uploadedBy?: string;

  @IsOptional()
  @IsDate()
  timestamp?: Date;
}
