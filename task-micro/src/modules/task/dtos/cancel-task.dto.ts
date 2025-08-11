import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  IsDate,
  ValidateNested,
  MinLength,
  IsEnum,
} from 'class-validator';
import { MediaTypeEnum } from 'src/models/media-type.enum';

export class CancellationProofDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  mediaUrl: string;

  @IsNotEmpty()
  @IsEnum(MediaTypeEnum)
  mediaType: MediaTypeEnum;

  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;
}

export class CancelTaskDto {
  @IsNotEmpty()
  @IsUUID()
  cancelerId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10, {
    message: 'Cancel reason must be at least 10 characters long',
  })
  cancelReason: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CancellationProofDto)
  proof: CancellationProofDto;
}
