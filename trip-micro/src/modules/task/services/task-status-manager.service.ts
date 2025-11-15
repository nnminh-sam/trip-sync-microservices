import { TaskAttribute } from './../../../models/task.model';
import { Injectable, HttpStatus, Logger } from '@nestjs/common';
import { TaskStatusEnum } from 'src/models/task-status.enum';
import { Task } from 'src/models/task.model';
import { throwRpcException } from 'src/utils';

export interface StatusTransitionResult {
  isValid: boolean;
  reason?: string;
  requiredFields?: TaskAttribute[];
}

@Injectable()
export class TaskStatusManagerService {
  private readonly logger: Logger = new Logger(TaskStatusManagerService.name);

  validateStatusTransition(
    currentStatus: TaskStatusEnum,
    newStatus: TaskStatusEnum,
    task?: Task,
  ): StatusTransitionResult {
    if (currentStatus === newStatus) {
      return { isValid: true };
    }

    // * Define valid transitions
    const validTransitions: Record<TaskStatusEnum, TaskStatusEnum[]> = {
      [TaskStatusEnum.PENDING]: [
        TaskStatusEnum.IN_PROGRESS,
        TaskStatusEnum.CANCELED,
      ],
      [TaskStatusEnum.IN_PROGRESS]: [
        TaskStatusEnum.SUBMITTED,
        TaskStatusEnum.CANCELED,
      ],

      [TaskStatusEnum.SUBMITTED]: [
        TaskStatusEnum.APPROVED,
        TaskStatusEnum.REJECTED,
        TaskStatusEnum.CANCELED,
      ],
      [TaskStatusEnum.APPROVED]: [
        TaskStatusEnum.PENDING,
        TaskStatusEnum.SUBMITTED,
        TaskStatusEnum.CANCELED,
      ],
      [TaskStatusEnum.REJECTED]: [
        TaskStatusEnum.PENDING,
        TaskStatusEnum.SUBMITTED,
        TaskStatusEnum.CANCELED,
      ],
      [TaskStatusEnum.CANCELED]: [
        TaskStatusEnum.PENDING,
        TaskStatusEnum.SUBMITTED,
        TaskStatusEnum.APPROVED,
        TaskStatusEnum.REJECTED,
      ],
    };

    const allowedTransitions = validTransitions[currentStatus];
    if (!allowedTransitions) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: `Invalid current status: ${currentStatus}`,
      });
    }

    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    // * Require fields when task is approved
    if (newStatus === TaskStatusEnum.APPROVED) {
      return {
        isValid: true,
        requiredFields: ['approvedBy', 'approvedAt'],
      };
    }

    if (newStatus === TaskStatusEnum.REJECTED) {
      return {
        isValid: true,
        requiredFields: ['rejectionReason', 'rejectedBy', 'rejectedAt'],
      };
    }

    // * Require fields when cancelling a task
    if (newStatus === TaskStatusEnum.CANCELED) {
      return {
        isValid: true,
        requiredFields: ['cancelReason'],
      };
    }

    // * Require fields when submitting a task
    if (newStatus === TaskStatusEnum.SUBMITTED) {
      return {
        isValid: true,
        requiredFields: ['proofs'],
      };
    }

    return { isValid: true };
  }

  applyStatusChange(
    task: Task,
    newStatus: TaskStatusEnum,
    additionalData?: Partial<Task>,
  ): Task {
    const oldStatus: TaskStatusEnum = task.status;

    // * Validate transition
    const validation = this.validateStatusTransition(
      oldStatus,
      newStatus,
      task,
    );
    if (!validation.isValid) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: validation.reason || 'Invalid status transition',
      });
    }

    // * Update status
    task.status = newStatus;

    // * Update timestamps and required fields based on new status
    switch (newStatus) {
      case TaskStatusEnum.APPROVED:
        task.approvedAt = new Date();
        if (!additionalData?.approvedBy) {
          throwRpcException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Approver is required when approving a task',
          });
        }
        task.approvedBy = additionalData.approvedBy;
        task.rejectedAt = null;
        task.rejectedBy = null;
        task.rejectionReason = null;
        task.canceledAt = null;
        task.canceledBy = null;
        break;

      case TaskStatusEnum.REJECTED:
        if (!additionalData?.rejectionReason) {
          throwRpcException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Rejection reason is required when rejecting a task',
          });
        }
        if (!additionalData?.rejectedBy) {
          throwRpcException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Rejection by is required when rejecting a task',
          });
        }
        task.rejectedAt = new Date();
        task.rejectedBy = additionalData.rejectedBy;
        task.rejectionReason = additionalData.rejectionReason;
        task.approvedAt = null;
        task.approvedBy = null;
        task.cancelReason = null;
        task.canceledAt = null;
        task.canceledBy = null;
        break;

      case TaskStatusEnum.IN_PROGRESS:
        task.startedAt = new Date();
        break;

      case TaskStatusEnum.SUBMITTED:
        task.completedAt = new Date();
        break;

      case TaskStatusEnum.CANCELED:
        if (!additionalData?.cancelReason) {
          throwRpcException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Cancel reason is required when canceling a task',
          });
        }
        task.canceledAt = new Date();
        task.cancelReason = additionalData.cancelReason;
        task.canceledBy = additionalData.canceledBy;
        task.approvedAt = null;
        task.approvedBy = null;
        task.rejectedAt = null;
        task.rejectedBy = null;
        task.rejectionReason = null;
        break;

      // * Reset fields if reverting to pending
      case TaskStatusEnum.PENDING:
        task.startedAt = null;
        task.completedAt = null;
        task.approvedAt = null;
        task.approvedBy = null;
        task.rejectedAt = null;
        task.rejectedBy = null;
        task.rejectionReason = null;
        task.canceledAt = null;
        task.cancelReason = null;
        break;
    }

    return task;
  }

  canModifyTask(task: Task): boolean {
    // * Only pending and rejected tasks can be modified
    return (
      task.status === TaskStatusEnum.PENDING ||
      task.status === TaskStatusEnum.REJECTED
    );
  }

  /**
   * Check if a task requires proof for completion
   */
  requiresCompletionProof(): boolean {
    // All tasks require completion proof
    return true;
  }

  /**
   * Check if a task requires proof for cancellation
   */
  requiresCancellationProof(): boolean {
    // All tasks require cancellation proof
    return true;
  }

  getStatusDescription(status: TaskStatusEnum): string {
    const descriptions: Record<TaskStatusEnum, string> = {
      [TaskStatusEnum.PENDING]:
        'Task is pending and awaiting for assignee to do',
      [TaskStatusEnum.IN_PROGRESS]: 'Task is processing by the assignee',
      [TaskStatusEnum.SUBMITTED]: 'Task has been submitted by the assignee',
      [TaskStatusEnum.APPROVED]: 'Task is approved by the reviewer',
      [TaskStatusEnum.REJECTED]: 'Task is rejected by the reviewer',
      [TaskStatusEnum.CANCELED]: 'Task has been canceled',
    };

    return descriptions[status] || 'Unknown status';
  }

  requiresProof(
    currentStatus: TaskStatusEnum,
    newStatus: TaskStatusEnum,
  ): boolean {
    if (!this.validateStatusTransition(currentStatus, newStatus).isValid) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Invalid status transition',
      });
    }

    if (newStatus === TaskStatusEnum.SUBMITTED) {
      return this.requiresCompletionProof();
    }

    if (newStatus === TaskStatusEnum.CANCELED) {
      return this.requiresCancellationProof();
    }

    return false;
  }
}
