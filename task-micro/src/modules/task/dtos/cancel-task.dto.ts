import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  IsDate,
  ValidateNested,
  MinLength,
} from 'class-validator';

export class CancellationProofDto {
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
  @Type(() => Date)
  timestamp: Date;
}

export class CancelTaskDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(10, { message: 'Cancel reason must be at least 10 characters long' })
  cancelReason: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CancellationProofDto)
  proof: CancellationProofDto;
}