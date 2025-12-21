import { BaseModel } from './base.model';
import { Trip } from './trip.model';
import { TripLocation } from './trip-location.model';
import { Location } from './location.model';
import { Task } from './task.model';
import { TripProgress } from './trip-progress.model';
import { Cancelation } from 'src/models/cancelation.model';

export const tableSchemas = [
  BaseModel,
  Trip,
  TripLocation,
  Location,
  Task,
  TripProgress,
  Cancelation,
];
