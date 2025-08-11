import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, ValidateNested, ArrayMinSize, ArrayMaxSize } from 'class-validator';
import { CreateTaskProofDto } from './create-task-proof.dto';

export class BulkCreateTaskProofDto {
  @IsArray()
  @IsNotEmpty()
  @ArrayMinSize(1)
  @ArrayMaxSize(10) // Limit bulk upload to 10 items at a time
  @ValidateNested({ each: true })
  @Type(() => CreateTaskProofDto)
  proofs: CreateTaskProofDto[];
}