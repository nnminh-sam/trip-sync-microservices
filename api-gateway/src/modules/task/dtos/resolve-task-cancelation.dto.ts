import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { CancelationDecision } from 'src/models/enums/cancelation-decision.enum';

export class ResolveTaskCancelationDto {
  @ApiProperty({
    description: 'Decision on the task cancellation request',
    example: CancelationDecision.APPROVE,
    enum: CancelationDecision,
    required: true,
  })
  @IsEnum(CancelationDecision)
  @IsNotEmpty()
  decision: CancelationDecision;

  @ApiProperty({
    description: 'Note for resolving task cancellation',
    example: 'Approved due to valid reason',
    required: false,
  })
  @IsString()
  @IsOptional()
  note?: string;
}
