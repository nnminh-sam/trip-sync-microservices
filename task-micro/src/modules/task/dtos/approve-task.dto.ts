import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsUUID } from 'class-validator';

export class ApproveTaskDto {
  @ApiProperty({
    description: 'Task approver ID',
  })
  @IsNotEmpty()
  @IsUUID()
  approverId: string;
}
