export const TaskMessagePattern = {
  findAll: 'task.find',
  create: 'task.create',
  findOne: 'task.find_one',
  update: 'task.update',
  delete: 'task.delete',
  approve: 'task.approve',
  reject: 'task.reject',
  start: 'task.start',
  complete: 'task.complete',
  cancel: 'task.cancel',
} as const;
