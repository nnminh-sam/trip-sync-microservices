import { TripStatusEnum } from 'src/models/trip-status.enum';

export const TRIP_STATUS_TRANSISTION_MAP: Record<
  TripStatusEnum,
  TripStatusEnum[]
> = {
  proposing: [TripStatusEnum.PENDING, TripStatusEnum.CANCELED],
  pending: [
    TripStatusEnum.IN_PROGRESS,
    TripStatusEnum.CANCELED,
    TripStatusEnum.OVERDUE,
  ],
  in_progress: [
    TripStatusEnum.COMPLETED,
    TripStatusEnum.CANCELED,
    TripStatusEnum.OVERDUE,
  ],
  completed: [],
  canceled: [],
  overdue: [],
};
