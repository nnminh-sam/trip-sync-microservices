export const LocationMessagePattern = {
  // Basic CRUD operations
  create: 'location.create',
  findAll: 'location.findAll',
  findOne: 'location.findOne',
  update: 'location.update',
  delete: 'location.delete',

  // Check-in/Check-out operations
  validateCoordinates: 'location.validateCoordinates',
  validateBatch: 'location.validateBatch',

  // GPS and distance operations
  findNearby: 'location.findNearby',
  findWithinRadius: 'location.findWithinRadius',
  calculateDistance: 'location.calculateDistance',
  getDistanceFromLocation: 'location.getDistanceFromLocation',

  // Area and boundary operations
  findInArea: 'location.findInArea',
  findNearest: 'location.findNearest',
  isPointInBoundary: 'location.isPointInBoundary',
  getBoundaries: 'location.getBoundaries',

  // Batch operations
  findByIds: 'location.findByIds',

  // Health check
  health: 'location.health',
} as const;
