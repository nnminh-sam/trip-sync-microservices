import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { MediaTypeEnum } from 'src/models/media-type.enum';
import { TaskProofTypeEnum } from 'src/models/task-proof-type.enum';
import { Task } from 'src/models/task.model';
import { User } from 'src/models/user.model';

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
    enum: TaskProofTypeEnum,
    example: TaskProofTypeEnum.COMPLETION,
  })
  type: TaskProofTypeEnum;

  @ApiProperty({
    description: "Proof's name",
  })
  name: string;

  @ApiProperty({
    description: "Proof's media URL",
  })
  mediaUrl: string;

  @ApiProperty({
    description: "Proof's media type",
    enum: MediaTypeEnum,
    example: MediaTypeEnum.JPEG,
  })
  mediaType: MediaTypeEnum;

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
