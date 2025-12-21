import { TripStatusEnum } from 'src/models/trip-status.enum';

export const TRIP_STATUS_TRANSISTION_MAP: Record<
  TripStatusEnum,
  TripStatusEnum[]
> = {
  waiting_for_approval: [
    TripStatusEnum.NOT_APPROVED,
    TripStatusEnum.NOT_STARTED,
    TripStatusEnum.CANCELED,
  ],
  not_approved: [],
  not_started: [TripStatusEnum.IN_PROGRESS, TripStatusEnum.CANCELED],
  in_progress: [TripStatusEnum.COMPLETED, TripStatusEnum.CANCELED],
  completed: [],
  canceled: [],
};
