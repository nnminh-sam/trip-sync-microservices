import { BaseModel } from './base.model';
import { Trip } from './trip.model';
import { TripLocation } from './trip-location.model';
import { TripApproval } from './trip-approval.model';

export const tableSchemas = [
  BaseModel,
  Trip,
  TripLocation,
  TripApproval,
];