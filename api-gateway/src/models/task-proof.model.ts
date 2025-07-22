import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { Task } from 'src/models/task.model';

export class TaskProof extends BaseModel {
  @ApiProperty({
    description: "Task's ID of proof, UUID value",
  })
  taskId: string;

  task: Task;

  @ApiProperty({
    description: "Task's type",
    examples: ['completion', 'cancellation'],
  })
  type: 'completion' | 'cancellation';

  @ApiProperty({
    description: "Task's media URL",
  })
  mediaUrl: string;

  @ApiProperty({
    description: "Task's media type",
    examples: ['photo', 'video'],
  })
  mediaType: 'photo' | 'video';

  @ApiProperty({
    description: "Task's submit latitude value",
  })
  latitude: number;

  @ApiProperty({
    description: "Task's submit longitude value",
  })
  longitude: number;

  @ApiProperty({
    description: "Task's submit timestamp",
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Uploader ID of the task, UUID value',
  })
  uploadedBy: string;

  @ApiProperty({
    description: 'Spatial point for geospatial indexing',
  })
  locationPoint: string;
}
