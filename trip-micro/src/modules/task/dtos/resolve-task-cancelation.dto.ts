import { IsNotEmpty, IsOptional, IsString, IsEnum } from 'class-validator';
import { CancelationDecision } from 'src/models/enums/CancelationDecision.enum';

export class ResolveTaskCancelationDto {
  @IsEnum(CancelationDecision)
  @IsNotEmpty()
  decision: CancelationDecision;

  @IsString()
  @IsOptional()
  note?: string;
}
