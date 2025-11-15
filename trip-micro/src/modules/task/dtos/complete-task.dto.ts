import { Type } from 'class-transformer';
import {
  IsNotEmpty,
  IsUUID,
  IsString,
  IsNumber,
  IsDate,
  ValidateNested,
  IsOptional,
  IsUrl,
  IsEnum,
} from 'class-validator';
import { MediaTypeEnum } from 'src/models/media-type.enum';

export class CompletionProofDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsUrl()
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

export class CompleteTaskDto {
  @IsNotEmpty()
  @IsUUID()
  assigneeId: string;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => CompletionProofDto)
  proof: CompletionProofDto;

  @IsOptional()
  @IsString()
  note?: string;
}
