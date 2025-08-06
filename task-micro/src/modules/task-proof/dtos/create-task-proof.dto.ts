import {
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateTaskProofDto {
  @IsNotEmpty()
  @IsUUID()
  taskId: string;

  @IsNotEmpty()
  @IsString()
  type: 'completion' | 'cancellation';

  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @IsNotEmpty()
  @IsString()
  mediaType: 'photo' | 'video';

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
