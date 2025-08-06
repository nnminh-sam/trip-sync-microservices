import { Injectable, HttpStatus } from '@nestjs/common';
import { Task } from 'src/models/task.model';
import { throwRpcException } from 'src/utils';

export enum TaskStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  CANCELED = 'canceled',
}

export interface StatusTransitionResult {
  isValid: boolean;
  reason?: string;
  requiredFields?: string[];
}

@Injectable()
export class TaskStatusManagerService {
  /**
   * Validates if a status transition is allowed
   */
  validateStatusTransition(
    currentStatus: TaskStatus,
    newStatus: TaskStatus,
    task?: Task,
  ): StatusTransitionResult {
    // Same status is always valid (no-op)
    if (currentStatus === newStatus) {
      return { isValid: true };
    }

    // Define valid transitions
    const validTransitions: Record<TaskStatus, TaskStatus[]> = {
      [TaskStatus.PENDING]: [TaskStatus.COMPLETED, TaskStatus.CANCELED],
      [TaskStatus.COMPLETED]: [], // Cannot transition from completed
      [TaskStatus.CANCELED]: [], // Cannot transition from canceled
    };

    const allowedTransitions = validTransitions[currentStatus] || [];
    
    if (!allowedTransitions.includes(newStatus)) {
      return {
        isValid: false,
        reason: `Cannot transition from ${currentStatus} to ${newStatus}`,
      };
    }

    // Additional validation for specific transitions
    if (newStatus === TaskStatus.CANCELED) {
      return {
        isValid: true,
        requiredFields: ['cancelReason'],
      };
    }

    if (newStatus === TaskStatus.COMPLETED) {
      // Task completion requires at least one completion proof
      return {
        isValid: true,
        requiredFields: ['completionProof'],
      };
    }

    return { isValid: true };
  }

  /**
   * Apply status change and update related timestamps
   */
  applyStatusChange(
    task: Task,
    newStatus: TaskStatus,
    additionalData?: {
      cancelReason?: string;
      completedBy?: string;
      canceledBy?: string;
    },
  ): Task {
    const oldStatus = task.status as TaskStatus;
    
    // Validate transition
    const validation = this.validateStatusTransition(oldStatus, newStatus, task);
    if (!validation.isValid) {
      throwRpcException({
        statusCode: HttpStatus.BAD_REQUEST,
        message: validation.reason || 'Invalid status transition',
      });
    }

    // Update status
    task.status = newStatus;

    // Update timestamps and required fields based on new status
    switch (newStatus) {
      case TaskStatus.COMPLETED:
        task.completedAt = new Date();
        break;

      case TaskStatus.CANCELED:
        if (!additionalData?.cancelReason) {
          throwRpcException({
            statusCode: HttpStatus.BAD_REQUEST,
            message: 'Cancel reason is required when canceling a task',
          });
        }
        task.canceledAt = new Date();
        task.cancelReason = additionalData.cancelReason;
        break;

      case TaskStatus.PENDING:
        // Reset completion/cancellation fields if reverting to pending
        // (though this transition is not currently allowed)
        task.completedAt = null;
        task.canceledAt = null;
        task.cancelReason = null;
        break;
    }

    return task;
  }

  /**
   * Check if a task can be modified based on its current status
   */
  canModifyTask(task: Task): boolean {
    // Only pending tasks can be modified
    return task.status === TaskStatus.PENDING;
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

  /**
   * Get human-readable status description
   */
  getStatusDescription(status: TaskStatus): string {
    const descriptions: Record<TaskStatus, string> = {
      [TaskStatus.PENDING]: 'Task is pending and awaiting action',
      [TaskStatus.COMPLETED]: 'Task has been completed successfully',
      [TaskStatus.CANCELED]: 'Task has been canceled',
    };

    return descriptions[status] || 'Unknown status';
  }

  /**
   * Check if status transition requires proof
   */
  requiresProof(currentStatus: TaskStatus, newStatus: TaskStatus): boolean {
    if (newStatus === TaskStatus.COMPLETED) {
      return this.requiresCompletionProof();
    }
    
    if (newStatus === TaskStatus.CANCELED) {
      return this.requiresCancellationProof();
    }

    return false;
  }
}