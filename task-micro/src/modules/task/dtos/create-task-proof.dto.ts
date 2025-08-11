import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { MediaTypeEnum } from 'src/models/media-type.enum';
import { TaskProofTypeEnum } from 'src/models/task-proof-type.enum';

export class CreateTaskProofDto {
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @IsNotEmpty()
  @IsString()
  type: TaskProofTypeEnum;

  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @IsNotEmpty()
  @IsString()
  mediaType: MediaTypeEnum;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsNotEmpty()
  @IsDate()
  timestamp: Date;

  @IsNotEmpty()
  @IsUUID()
  uploadedBy: string;

  // locationPoint will be calculated from latitude/longitude
  @IsOptional()
  locationPoint?: { x: number; y: number } | null;
}
