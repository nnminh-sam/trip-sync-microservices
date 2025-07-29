import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { Task } from 'src/models/task.model';
import { User } from 'src/models/user.model';

export enum ProofType {
  COMPLETION = 'completion',
  CANCELLATION = 'cancellation',
}

export enum MediaType {
  PHOTO = 'photo',
  VIDEO = 'video',
}

export class TaskProof extends BaseModel {
  @ApiProperty({
    description: "Task's ID of proof, UUID value",
  })
  taskId: string;

  @ApiProperty({
    description: 'Task object',
    type: () => Task,
  })
  task?: Task;

  @ApiProperty({
    description: "Proof's type",
    enum: ProofType,
    example: ProofType.COMPLETION,
  })
  type: ProofType;

  @ApiProperty({
    description: "Proof's media URL",
  })
  mediaUrl: string;

  @ApiProperty({
    description: "Proof's media type",
    enum: MediaType,
    example: MediaType.PHOTO,
  })
  mediaType: MediaType;

  @ApiProperty({
    description: "Proof's submit latitude value",
    type: 'number',
    example: 21.0285,
  })
  latitude: number;

  @ApiProperty({
    description: "Proof's submit longitude value",
    type: 'number',
    example: 105.8542,
  })
  longitude: number;

  @ApiProperty({
    description: "Proof's submit timestamp",
    type: 'string',
    format: 'date-time',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Uploader ID of the task, UUID value',
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Uploader user object',
    type: () => User,
  })
  uploader?: User;

  @ApiProperty({
    description: 'Spatial point for geospatial indexing',
  })
  locationPoint: string;
}
