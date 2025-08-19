import { IsOptional, IsString, IsArray, IsBoolean, IsDateString, IsEnum, ValidateNested, IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export enum EvidenceType {
  PHOTO = 'photo',
  VIDEO = 'video',
  DOCUMENT = 'document'
}

export class LocationDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lng: number;
}

export class EvidenceAttachmentDto {
  @IsEnum(EvidenceType)
  type: EvidenceType;

  @IsString()
  url: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => LocationDto)
  location?: LocationDto;

  @IsOptional()
  @IsDateString()
  timestamp?: string;
}

export class CancellationProposalDto {
  @IsString()
  reason: string;

  @IsArray()
  @IsString({ each: true })
  evidence: string[];
}

export class TaskReportDto {
  @IsString()
  task_id: string;

  @IsString()
  trip_id: string;

  @IsString()
  employee_id: string;

  @IsArray()
  @IsString({ each: true })
  objectives_achieved: string[];

  @IsArray()
  @IsString({ each: true })
  ongoing_work: string[];

  @IsOptional()
  @ValidateNested()
  @Type(() => CancellationProposalDto)
  cancellation_proposals?: CancellationProposalDto;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceAttachmentDto)
  evidence_attachments: EvidenceAttachmentDto[];

  @IsBoolean()
  auto_submission: boolean;

  @IsDateString()
  submission_time: string;
}

export class FilterTaskReportDto {
  @IsOptional()
  @IsString()
  task_id?: string;

  @IsOptional()
  @IsString()
  trip_id?: string;

  @IsOptional()
  @IsString()
  employee_id?: string;

  @IsOptional()
  @IsDateString()
  from_date?: string;

  @IsOptional()
  @IsDateString()
  to_date?: string;

  @IsOptional()
  @IsBoolean()
  auto_submitted?: boolean;
}