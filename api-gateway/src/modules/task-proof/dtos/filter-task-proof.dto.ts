import { ApiProperty } from '@nestjs/swagger';
import { IsDate, IsOptional, IsString, IsUUID } from 'class-validator';

export class FilterTaskProofDto {
  @ApiProperty({
    description: "Proof's type",
    required: false,
  })
  @IsOptional()
  @IsString()
  type?: 'completion' | 'cancellation';

  @ApiProperty({
    description: "Proof's media type",
    required: false,
  })
  @IsOptional()
  @IsString()
  mediaType?: 'photo' | 'video';

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
}
