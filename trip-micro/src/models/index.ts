import { BaseModel } from './base.model';
import { Trip } from './trip.model';
import { TripLocation } from './trip-location.model';
import { Location } from './location.model';
import { Task } from './task.model';
import { TaskProof } from './task-proof.model';
import { TaskFile } from './task-file.model';

export const tableSchemas = [
  BaseModel,
  Trip,
  TripLocation,
  Location,
  Task,
  TaskProof,
  TaskFile,
];
