import { ApiProperty } from '@nestjs/swagger';
import { BaseModel } from 'src/models/base.model';
import { TaskProof } from 'src/models/task-proof.model';

export class Task extends BaseModel {
  @ApiProperty({
    description: "Trip's location ID, UUID value",
  })
  tripLocationId: string;

  @ApiProperty({
    description: "Trip's title",
  })
  title: string;

  @ApiProperty({
    description: "Trip's description",
  })
  description: string;

  @ApiProperty({
    description: "Trip's status",
    examples: ['pending', 'completed', 'canceled'],
  })
  status: 'pending' | 'completed' | 'canceled';

  @ApiProperty({
    description: "Trip's note",
  })
  note: string;

  @ApiProperty({
    description: "Trip's deadline",
  })
  deadline: Date;

  @ApiProperty({
    description: "Trip's completion timestamp",
    required: false,
  })
  completedAt?: Date;

  @ApiProperty({
    description: "Trip's cancelation timestamp",
    required: false,
  })
  canceledAt?: Date;

  @ApiProperty({
    description: "Trip's cancel reason",
    required: false,
  })
  cancelReason?: string;

  @ApiProperty({
    description: "Trip's proofs",
    type: TaskProof,
    isArray: true,
  })
  proofs: TaskProof[];
}
