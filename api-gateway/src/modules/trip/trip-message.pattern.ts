export const TripMessagePattern = {
  CREATE: 'trip.create',
  FIND_ALL: 'trip.find',
  FIND_ONE: 'trip.find_one',
  UPDATE: 'trip.update',
  DELETE: 'trip.delete',
  APPROVE: 'trip.approve',
  LOCATIONS: 'trip.locations',
  APPROVALS: 'trip.approvals',
  CHECK_IN: 'trip.location.check_in',
  CHECK_OUT: 'trip.location.check_out',
} as const;
