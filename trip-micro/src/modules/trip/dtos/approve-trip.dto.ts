// src/modules/trip/dtos/approve-trip.dto.ts
import { IsEnum, IsOptional, IsString, IsBoolean } from 'class-validator';
const ApprovalStatusValues = ['pending', 'approved', 'rejected', 'auto_approved'] as const;
type ApprovalStatus = (typeof ApprovalStatusValues)[number];

export class ApproveTripDto {
  @IsEnum(ApprovalStatusValues, {
    message: `status must be one of the following values: ${Object.values(ApprovalStatusValues).join(', ')}`,
  })
  status: ApprovalStatus;

  @IsString()
  note: string;

  @IsString()
  @IsOptional()
  assignee_id: string;
}
