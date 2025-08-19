import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
import { TripApprovalStatusEnum } from 'src/models/trip-approval-status.enum';

export class ApproveTripDto {
  @IsEnum(TripApprovalStatusEnum)
  status: TripApprovalStatusEnum;

  @IsString()
  note: string;

  @IsString()
  @IsOptional()
  assignee_id: string;
}
