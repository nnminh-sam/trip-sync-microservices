export const MediaMessagePattern = {
  findById: 'media.find.id',
  findAll: 'media.find',
  findByTaskId: 'media.find.task',
  create: 'media.create',
  update: 'media.update',
  delete: 'media.delete',
  verifySignature: 'media.signature.verify',
} as const;
