import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  IsDate,
  ValidateNested,
  IsOptional,
} from 'class-validator';

export class CompletionProofDto {
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

export class CompleteTaskDto {
  @IsNotEmpty()
  @IsUUID()
  userId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CompletionProofDto)
  proof: CompletionProofDto;

  @IsOptional()
  @IsString()
  note?: string;
}